#!/usr/bin/env python3
"""毎日 12:00 JST に Google News RSS からニュースを取得して news.json を更新するスクリプト"""

import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree as ET

NEWS_FILE = "news.json"
MAX_ITEMS = 30
TIMEOUT = 20

# (検索クエリ, デフォルトカテゴリ)
QUERIES = [
    ("TNFD 自然関連財務情報開示", "tnfd"),
    ("生物多様性 自然資本 企業開示", "tnfd"),
    ("GBF CBD 生物多様性条約", "gbf"),
    ("IPBES 生態系サービス 生物多様性", "science"),
    ("自然資本 ESG 金融 投資", "finance"),
    ("環境省 生物多様性 自然資本 政策", "domestic"),
]

# カテゴリ判定キーワード（優先順）
CATEGORY_RULES = [
    ("tnfd",     ["tnfd", "自然関連財務", "leap評価", "自然関連リスク"]),
    ("gbf",      ["gbf", "cbd", "cop15", "cop16", "cop17", "30×30", "30x30",
                  "昆明", "モントリオール", "生物多様性条約", "nbsap"]),
    ("domestic", ["環境省", "農水省", "農林水産省", "金融庁", "国土交通省",
                  "閣議決定", "oecm", "国内政策"]),
    ("science",  ["ipbes", "iucn", "レッドリスト", "絶滅危惧", "nature誌",
                  "science誌", "論文", "研究報告"]),
    ("finance",  ["esg", "投資", "ファンド", "msci", "issb", "ftse", "開示義務",
                  "サステナビリティ", "csrd"]),
]


def categorize(title: str) -> str:
    t = title.lower()
    for cat, keywords in CATEGORY_RULES:
        if any(kw.lower() in t for kw in keywords):
            return cat
    return "tnfd"


def fetch_rss(query: str) -> list:
    encoded = urllib.parse.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=ja&gl=JP&ceid=JP:ja"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; biodiversity-news-bot/1.0)"},
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            xml_bytes = resp.read()
    except Exception as e:
        print(f"  ⚠ fetch failed ({query!r}): {e}", file=sys.stderr)
        return []

    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError as e:
        print(f"  ⚠ XML parse error: {e}", file=sys.stderr)
        return []

    items = []
    for item in root.findall(".//item"):
        title_el   = item.find("title")
        link_el    = item.find("link")
        pubdate_el = item.find("pubDate")
        source_el  = item.find("source")

        if title_el is None or link_el is None:
            continue

        title = (title_el.text or "").strip()
        # 末尾の " - 媒体名" を除去
        title = re.sub(r"\s*[-–—]\s*[^-–—]{1,40}$", "", title).strip()
        if len(title) < 10:
            continue

        link = (link_el.text or "").strip()
        if not link.startswith("http"):
            continue

        source = (source_el.text or "").strip() if source_el is not None else ""

        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if pubdate_el is not None and pubdate_el.text:
            try:
                date_str = parsedate_to_datetime(pubdate_el.text).strftime("%Y-%m-%d")
            except Exception:
                pass

        items.append({
            "date":         date_str,
            "title":        title,
            "source":       source,
            "category":     categorize(title),
            "url":          link,
            "auto_fetched": True,
        })
    return items


def main():
    # 既存の news.json を読み込む
    try:
        with open(NEWS_FILE, encoding="utf-8") as f:
            existing = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing = {"updated": "", "items": []}

    # 手動で追加された記事（auto_fetched フラグなし）は保持
    pinned = [it for it in existing.get("items", []) if not it.get("auto_fetched")]
    pinned_titles = {it["title"] for it in pinned}

    # RSS から新規記事を収集
    fetched: list = []
    seen: set = set()

    for query, _ in QUERIES:
        print(f"Fetching: {query}")
        for item in fetch_rss(query):
            t = item["title"]
            if t in seen or t in pinned_titles:
                continue
            seen.add(t)
            fetched.append(item)

    # 日付降順でソート
    fetched.sort(key=lambda x: x.get("date", ""), reverse=True)

    # 手動記事を先頭、自動取得を後ろに結合して上限適用
    all_items = pinned + fetched[: MAX_ITEMS - len(pinned)]

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    result = {"updated": today, "items": all_items}

    with open(NEWS_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(
        f"✓ news.json 更新: 計 {len(all_items)} 件 "
        f"（固定 {len(pinned)} 件 + 自動取得 {len(all_items) - len(pinned)} 件）"
    )


if __name__ == "__main__":
    main()

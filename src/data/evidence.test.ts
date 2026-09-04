import { describe, expect, it } from 'vitest';
import { DOMAIN_META, EVIDENCE, type EvidenceDomain } from './evidence';

const DOMAINS = Object.keys(DOMAIN_META) as EvidenceDomain[];

describe('知見データの構造', () => {
  it('ID が一意である', () => {
    const ids = EVIDENCE.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('7 領域すべてに 2〜4 件の代表文献がある', () => {
    for (const domain of DOMAINS) {
      const count = EVIDENCE.filter((e) => e.domain === domain).length;
      expect(count, `${domain} の件数`).toBeGreaterThanOrEqual(2);
      expect(count, `${domain} の件数`).toBeLessThanOrEqual(4);
    }
  });

  it('未知の領域が混ざっていない', () => {
    for (const e of EVIDENCE) {
      expect(DOMAINS, `${e.id} の domain`).toContain(e.domain);
    }
  });

  it('4 軸それぞれに、優先提示できる知見が最低 1 件ある', () => {
    for (const axis of ['frequency', 'duration', 'diversity', 'intensity'] as const) {
      const hits = EVIDENCE.filter((e) => e.triggerAxis === axis);
      expect(hits.length, `${axis} に紐づく知見`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('出典の明示', () => {
  it('DOI が DOI の形式を満たしている', () => {
    for (const e of EVIDENCE) {
      expect(e.citation.doi, `${e.id} の DOI`).toMatch(/^10\.\d{4,9}\/\S+$/);
    }
  });

  it('DOI が重複していない（同一文献の二重登録を防ぐ）', () => {
    const dois = EVIDENCE.map((e) => e.citation.doi.toLowerCase());
    expect(new Set(dois).size).toBe(dois.length);
  });

  it('著者・雑誌名が空でない', () => {
    for (const e of EVIDENCE) {
      expect(e.citation.authors.length, `${e.id} の著者`).toBeGreaterThan(3);
      expect(e.citation.journal.length, `${e.id} の雑誌名`).toBeGreaterThan(3);
    }
  });

  it('出版年が妥当な範囲にある', () => {
    for (const e of EVIDENCE) {
      expect(e.citation.year, `${e.id} の年`).toBeGreaterThanOrEqual(1980);
      expect(e.citation.year, `${e.id} の年`).toBeLessThanOrEqual(new Date().getFullYear() + 1);
    }
  });
});

describe('本文の要件', () => {
  it('headline は一文で書かれている', () => {
    for (const e of EVIDENCE) {
      expect(e.headline.length, `${e.id} の headline`).toBeGreaterThan(10);
      expect(e.headline.trimEnd().endsWith('。'), `${e.id} は句点で終わる`).toBe(true);
      // 句点は末尾の 1 つだけ（＝一文）
      expect((e.headline.match(/。/g) ?? []).length, `${e.id} の文の数`).toBe(1);
    }
  });

  it('summary は 2〜3 文程度である', () => {
    for (const e of EVIDENCE) {
      const sentences = (e.summary.match(/。/g) ?? []).length;
      expect(sentences, `${e.id} の summary の文数`).toBeGreaterThanOrEqual(2);
      expect(sentences, `${e.id} の summary の文数`).toBeLessThanOrEqual(4);
    }
  });

  it('caveat が省略されておらず、実質的な内容を持つ', () => {
    for (const e of EVIDENCE) {
      expect(e.caveat.trim().length, `${e.id} の caveat`).toBeGreaterThan(20);
    }
  });

  it('caveat に研究デザインまたは対象集団の限界が書かれている', () => {
    const markers = [
      '横断', '縦断', 'コホート', '観察', '実験', '無作為', '対照群', '総説', '概念',
      'レビュー', '因果', '小規模', '自己申告', '生態学的', '予測',
      '英国', '欧州', '米国', '北米', '日本', 'カナダ', 'デンマーク',
      'オーストラリア', '高所得国', '大学生', '児童', '成人', '一都市', '単一都市',
    ];
    for (const e of EVIDENCE) {
      const hit = markers.some((m) => e.caveat.includes(m));
      expect(hit, `${e.id} の caveat に研究デザイン・対象集団の言及がある`).toBe(true);
    }
  });
});

describe('表現の禁止事項', () => {
  const text = (e: (typeof EVIDENCE)[number]) => `${e.headline}\n${e.summary}\n${e.caveat}`;

  it('診断・予測を思わせる断定表現を含まない', () => {
    // 「〜が治る」「〜を予防できる」など、個人の健康状態を約束する表現
    const forbidden = [
      /治りま?す/,
      /予防できま?す/,
      /治療でき/,
      /診断(でき|しま|を下)/,
      /病気になりません/,
      /健康になりま?す/,
      /寿命が延びま?す/,
    ];
    for (const e of EVIDENCE) {
      for (const pattern of forbidden) {
        expect(pattern.test(text(e)), `${e.id} に断定表現 ${pattern}`).toBe(false);
      }
    }
  });

  it('相関を因果と言い換える表現を含まない', () => {
    const forbidden = [/効果が証明された/, /因果関係が示された/, /必ず改善/, /確実に/];
    for (const e of EVIDENCE) {
      for (const pattern of forbidden) {
        expect(pattern.test(text(e)), `${e.id} に因果の断定 ${pattern}`).toBe(false);
      }
    }
  });

  it('横断研究を扱う知見では、因果を主張していないことを caveat で明示している', () => {
    for (const e of EVIDENCE) {
      if (!e.caveat.includes('横断')) continue;
      const disclaims =
        /因果|原因|区別できない|特定できない|説明も否定できない|逆|示せない|分からない/.test(e.caveat);
      expect(disclaims, `${e.id} の caveat が因果の限界に触れている`).toBe(true);
    }
  });

  it('スコアと健康を直接結びつける表現を含まない', () => {
    for (const e of EVIDENCE) {
      expect(/PEI/.test(text(e)), `${e.id} が個人のスコアに言及していない`).toBe(false);
      expect(/あなた/.test(text(e)), `${e.id} が読者個人に効果を約束していない`).toBe(false);
    }
  });
});

describe('領域メタデータ', () => {
  it('すべての領域に表示名と説明がある', () => {
    for (const domain of DOMAINS) {
      expect(DOMAIN_META[domain].label.length).toBeGreaterThan(0);
      expect(DOMAIN_META[domain].description.length).toBeGreaterThan(0);
    }
  });
});

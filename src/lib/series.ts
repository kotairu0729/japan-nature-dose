/**
 * 記録の時系列集計。純関数のみ。
 *
 * 日付は "YYYY-MM-DD"（ローカル日付）の文字列として扱い、Date への変換を
 * 極力避ける。タイムゾーンによって週や月の境界がずれるのを防ぐため。
 */
import { AXIS_KEYS, computeScore, mean, toAxisValues } from './pei';
import type { AxisKey, AxisValues, PeiEntry, PeiScore } from '../types/pei';

/** 1 件の記録とその算出結果。 */
export interface ScoredEntry {
  entry: PeiEntry;
  score: PeiScore;
}

/** グラフ 1 点分のデータ。 */
export interface SeriesPoint extends AxisValues {
  /** X 軸のキー。日次は YYYY-MM-DD、月次は YYYY-MM。 */
  key: string;
  /** 表示用の短いラベル。 */
  label: string;
  pei: number;
  /** この点に集約された記録の件数。 */
  count: number;
}

/** 月次の点。記録がない月は values が null になる。 */
export interface MonthlyPoint {
  /** YYYY-MM */
  key: string;
  /** 表示用ラベル（例: "4月"）。 */
  label: string;
  year: number;
  /** 1〜12 */
  month: number;
  season: Season;
  count: number;
  pei: number | null;
  frequency: number | null;
  duration: number | null;
  diversity: number | null;
  intensity: number | null;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASON_LABEL: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬',
};

/** 日付の新しい順に並べ替えた新しい配列を返す。 */
export function sortByDateDesc(entries: readonly PeiEntry[]): PeiEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** 日付の古い順に並べ替えた新しい配列を返す。 */
export function sortByDateAsc(entries: readonly PeiEntry[]): PeiEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** 各記録にスコアを添えて古い順に返す。 */
export function scoreEntries(entries: readonly PeiEntry[]): ScoredEntry[] {
  return sortByDateAsc(entries).map((entry) => ({ entry, score: computeScore(entry) }));
}

/** 記録 1 件を 1 点として扱う時系列（週次記録を前提とした素の推移）。 */
export function toEntrySeries(entries: readonly PeiEntry[]): SeriesPoint[] {
  return scoreEntries(entries).map(({ entry, score }) => ({
    key: entry.date,
    label: formatDayLabel(entry.date),
    ...toAxisValues(score),
    pei: score.pei,
    count: 1,
  }));
}

/** 同月の記録を平均して月次の時系列にする（記録のある月のみ）。 */
export function toMonthlySeries(entries: readonly PeiEntry[]): SeriesPoint[] {
  const buckets = groupByMonth(entries);
  return [...buckets.keys()]
    .sort()
    .map((key) => {
      const scored = buckets.get(key) ?? [];
      const axes = averageAxes(scored.map((s) => s.score));
      return {
        key,
        label: formatMonthLabel(key),
        ...axes,
        pei: mean(AXIS_KEYS.map((k) => axes[k])),
        count: scored.length,
      };
    });
}

/**
 * 直近 months ヶ月分を、記録のない月も含めて連続で返す。
 * 季節変動を俯瞰するためのビューに使う。
 */
export function toMonthlyOverview(
  entries: readonly PeiEntry[],
  months = 12,
  endDate: string = todayString(),
): MonthlyPoint[] {
  const buckets = groupByMonth(entries);
  const [endYear, endMonth] = parseMonthKey(endDate.slice(0, 7));
  const points: MonthlyPoint[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const total = endYear * 12 + (endMonth - 1) - offset;
    const year = Math.floor(total / 12);
    const month = (total % 12) + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    const scored = buckets.get(key) ?? [];
    const axes = scored.length > 0 ? averageAxes(scored.map((s) => s.score)) : null;
    points.push({
      key,
      label: `${month}月`,
      year,
      month,
      season: seasonOfMonth(month),
      count: scored.length,
      pei: axes ? mean(AXIS_KEYS.map((k) => axes[k])) : null,
      frequency: axes?.frequency ?? null,
      duration: axes?.duration ?? null,
      diversity: axes?.diversity ?? null,
      intensity: axes?.intensity ?? null,
    });
  }
  return points;
}

/** 気象庁の区分に合わせた季節（3〜5月=春, 6〜8月=夏, 9〜11月=秋, 12〜2月=冬）。 */
export function seasonOfMonth(month: number): Season {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/** 複数のスコアの軸ごとの平均。 */
export function averageAxes(scores: readonly PeiScore[]): AxisValues {
  const out = {} as AxisValues;
  for (const key of AXIS_KEYS) {
    out[key] = mean(scores.map((s) => s[key]));
  }
  return out;
}

/** 全記録期間の平均。記録が無ければ null。 */
export function overallAverage(entries: readonly PeiEntry[]): (AxisValues & { pei: number; count: number }) | null {
  if (entries.length === 0) return null;
  const scores = entries.map((e) => computeScore(e));
  const axes = averageAxes(scores);
  return { ...axes, pei: mean(AXIS_KEYS.map((k) => axes[k])), count: entries.length };
}

/** 最新（日付が最も新しい）の記録とスコア。 */
export function latestScored(entries: readonly PeiEntry[]): ScoredEntry | null {
  const sorted = sortByDateDesc(entries);
  const first = sorted[0];
  return first ? { entry: first, score: computeScore(first) } : null;
}

/** 直近 n 件の平均。件数が足りなければあるだけで計算する。 */
export function recentAverage(entries: readonly PeiEntry[], n: number): AxisValues & { pei: number; count: number } | null {
  const recent = sortByDateDesc(entries).slice(0, n);
  if (recent.length === 0) return null;
  const axes = averageAxes(recent.map((e) => computeScore(e)));
  return { ...axes, pei: mean(AXIS_KEYS.map((k) => axes[k])), count: recent.length };
}

/** 軸ごとの「直近 − 全期間平均」の差分。 */
export interface AxisComparison {
  axis: AxisKey | 'pei';
  latest: number;
  average: number;
  delta: number;
}

/** 直近値と全期間平均の比較。記録が 1 件以下なら null。 */
export function compareLatestToAverage(entries: readonly PeiEntry[]): AxisComparison[] | null {
  const latest = latestScored(entries);
  const average = overallAverage(entries);
  if (!latest || !average || entries.length < 2) return null;

  const rows: AxisComparison[] = AXIS_KEYS.map((axis) => ({
    axis,
    latest: latest.score[axis],
    average: average[axis],
    delta: latest.score[axis] - average[axis],
  }));
  rows.push({
    axis: 'pei',
    latest: latest.score.pei,
    average: average.pei,
    delta: latest.score.pei - average.pei,
  });
  return rows;
}

function groupByMonth(entries: readonly PeiEntry[]): Map<string, ScoredEntry[]> {
  const buckets = new Map<string, ScoredEntry[]>();
  for (const scored of scoreEntries(entries)) {
    const key = scored.entry.date.slice(0, 7);
    const list = buckets.get(key);
    if (list) list.push(scored);
    else buckets.set(key, [scored]);
  }
  return buckets;
}

function parseMonthKey(key: string): [number, number] {
  const [y, m] = key.split('-').map(Number);
  return [y ?? 1970, m ?? 1];
}

/** "2026-04-05" -> "4/5" */
export function formatDayLabel(date: string): string {
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)}`;
}

/** "2026-04" -> "2026年4月" */
export function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${y}年${Number(m)}月`;
}

/** ローカルタイムゾーンでの今日を YYYY-MM-DD で返す。 */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 週次記録の目安として、その日を含む週の月曜日を返す。
 * 同じ週に二重記録しようとしていないかの判定に使う。
 */
export function weekStart(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // 月曜=0
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

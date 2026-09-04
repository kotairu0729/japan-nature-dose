/**
 * PEI 算出ロジック。純関数のみ。React にも DOM にも依存しない。
 *
 * 算出式（Poznansky et al. 2026, DOI: 10.1002/pan3.70389）：
 *   PEI = (frequency_norm + duration_norm + diversity_norm + intensity_norm) / 4
 *
 * 論文では非加重（4軸均等）版が正式採用されている。加重版との相関が
 * R^2 = 0.78 と高く、加重によって識別力が向上する証拠が得られなかったため。
 */
import {
  DIVERSITY_MAX,
  DURATION_MAX,
  FREQUENCY_MAX,
  INTENSITY_ITEM_MAX,
  INTENSITY_TARGETS,
  SPACE_TYPES,
} from '../data/scale';
import type {
  AxisKey,
  AxisValues,
  IntensityTarget,
  PeiEntry,
  PeiScore,
  SpaceTypeId,
  ValidationIssue,
} from '../types/pei';

export const AXIS_KEYS: readonly AxisKey[] = [
  'frequency',
  'duration',
  'diversity',
  'intensity',
] as const;

const SPACE_TYPE_IDS: ReadonlySet<string> = new Set(SPACE_TYPES.map((s) => s.id));

/** 値を [min, max] に収める。 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** frequency 配点（0〜7）を 0〜1 に正規化する。 */
export function normalizeFrequency(score: number): number {
  return clamp(score, 0, FREQUENCY_MAX) / FREQUENCY_MAX;
}

/**
 * duration 配点（1〜7）を 0〜1 に正規化する。
 *
 * 論文の尺度に 0 点の選択肢は存在せず、最短の「30分以下」でも 1/7 ≒ 0.143 に
 * なる。この床の存在は指標の限界として `data/limitations.ts` で開示している。
 * 外部データ由来の 0 は「未回答」として 0 のまま扱う。
 */
export function normalizeDuration(score: number): number {
  return clamp(score, 0, DURATION_MAX) / DURATION_MAX;
}

/** 選択された空間タイプ数を 0〜1 に正規化する。重複と未知の ID は除外する。 */
export function normalizeDiversity(spaces: readonly SpaceTypeId[]): number {
  const unique = new Set(spaces.filter((s) => SPACE_TYPE_IDS.has(s)));
  return clamp(unique.size, 0, DIVERSITY_MAX) / DIVERSITY_MAX;
}

/** 4 項目それぞれを 4 で除して正規化し、その平均を取る。 */
export function normalizeIntensity(
  intensity: Partial<Record<IntensityTarget, number>>,
): number {
  const values = INTENSITY_TARGETS.map(
    (t) => clamp(intensity[t.id] ?? 0, 0, INTENSITY_ITEM_MAX) / INTENSITY_ITEM_MAX,
  );
  return mean(values);
}

/** 1 件の記録から 4 軸の正規化値と PEI を算出する。 */
export function computeScore(entry: Pick<PeiEntry, 'frequency' | 'duration' | 'spaces' | 'intensity'>): PeiScore {
  const frequency = normalizeFrequency(entry.frequency);
  const duration = normalizeDuration(entry.duration);
  const diversity = normalizeDiversity(entry.spaces);
  const intensity = normalizeIntensity(entry.intensity);
  return {
    frequency,
    duration,
    diversity,
    intensity,
    pei: mean([frequency, duration, diversity, intensity]),
  };
}

/** 空配列では 0 を返す平均。 */
export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** 4 軸の値から PEI を算出する（非加重の単純平均）。 */
export function peiFromAxes(axes: AxisValues): number {
  return mean(AXIS_KEYS.map((k) => axes[k]));
}

/**
 * 最も低い軸を返す。同値の場合は AXIS_KEYS の順で先に来る軸を返す
 * （順序が入力に依存しないようにするため）。
 */
export function lowestAxis(axes: AxisValues): AxisKey {
  let best: AxisKey = 'frequency';
  for (const key of AXIS_KEYS) {
    if (axes[key] < axes[best]) best = key;
  }
  return best;
}

/** 最も高い軸を返す。同値の場合の扱いは lowestAxis と同じ。 */
export function highestAxis(axes: AxisValues): AxisKey {
  let best: AxisKey = 'frequency';
  for (const key of AXIS_KEYS) {
    if (axes[key] > axes[best]) best = key;
  }
  return best;
}

/** PeiScore から 4 軸だけを取り出す。 */
export function toAxisValues(score: PeiScore): AxisValues {
  return {
    frequency: score.frequency,
    duration: score.duration,
    diversity: score.diversity,
    intensity: score.intensity,
  };
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD として妥当か（実在する日付かどうかも確認する）。 */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/**
 * 記録の妥当性を検証する。インポートしたデータの取り込み判定に使う。
 * 問題がなければ空配列を返す。
 */
export function validateEntry(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof value !== 'object' || value === null) {
    return [{ field: 'entry', message: '記録がオブジェクトではありません' }];
  }
  const e = value as Record<string, unknown>;

  if (typeof e['id'] !== 'string' || e['id'].length === 0) {
    issues.push({ field: 'id', message: 'id がありません' });
  }
  if (typeof e['date'] !== 'string' || !isValidDateString(e['date'])) {
    issues.push({ field: 'date', message: 'date が YYYY-MM-DD 形式ではありません' });
  }
  if (!isIntegerInRange(e['frequency'], 0, FREQUENCY_MAX)) {
    issues.push({ field: 'frequency', message: `frequency は 0〜${FREQUENCY_MAX} の整数である必要があります` });
  }
  if (!isIntegerInRange(e['duration'], 1, DURATION_MAX)) {
    issues.push({ field: 'duration', message: `duration は 1〜${DURATION_MAX} の整数である必要があります` });
  }
  if (!Array.isArray(e['spaces']) || e['spaces'].some((s) => typeof s !== 'string' || !SPACE_TYPE_IDS.has(s))) {
    issues.push({ field: 'spaces', message: 'spaces に未知の空間タイプが含まれています' });
  }
  const intensity = e['intensity'];
  if (typeof intensity !== 'object' || intensity === null) {
    issues.push({ field: 'intensity', message: 'intensity がありません' });
  } else {
    const rec = intensity as Record<string, unknown>;
    for (const target of INTENSITY_TARGETS) {
      if (!isIntegerInRange(rec[target.id], 0, INTENSITY_ITEM_MAX)) {
        issues.push({
          field: 'intensity',
          message: `intensity.${target.id} は 0〜${INTENSITY_ITEM_MAX} の整数である必要があります`,
        });
      }
    }
  }
  return issues;
}

function isIntegerInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/** 0〜1 のスコアを百分率の整数にする（表示専用）。 */
export function toPercent(score: number): number {
  return Math.round(clamp(score, 0, 1) * 100);
}

/** 0〜1 のスコアを小数第 2 位までの文字列にする（表示専用）。 */
export function formatScore(score: number): string {
  return clamp(score, 0, 1).toFixed(2);
}

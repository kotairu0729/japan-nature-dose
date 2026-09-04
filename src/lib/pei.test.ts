import { describe, expect, it } from 'vitest';
import {
  AXIS_KEYS,
  clamp,
  computeScore,
  formatScore,
  highestAxis,
  isValidDateString,
  lowestAxis,
  mean,
  normalizeDiversity,
  normalizeDuration,
  normalizeFrequency,
  normalizeIntensity,
  peiFromAxes,
  toPercent,
  validateEntry,
} from './pei';
import {
  DURATION_OPTIONS,
  FREQUENCY_OPTIONS,
  INTENSITY_OPTIONS,
  INTENSITY_TARGETS,
  SPACE_TYPES,
} from '../data/scale';
import type { IntensityTarget, PeiEntry, SpaceTypeId } from '../types/pei';

const flat = (v: number): Record<IntensityTarget, number> => ({
  insects: v,
  landscape: v,
  birds: v,
  plants: v,
});

const baseEntry: PeiEntry = {
  id: 'e1',
  date: '2026-04-01',
  frequency: 4,
  duration: 3,
  spaces: ['urban_park', 'freshwater'],
  intensity: flat(2),
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

describe('尺度の定義が論文どおりであること', () => {
  it('frequency は 0〜7 の 8 段階', () => {
    expect(FREQUENCY_OPTIONS.map((o) => o.value)).toEqual([7, 6, 5, 4, 3, 2, 1, 0]);
  });

  it('duration は 1〜7 の 7 段階（0 の選択肢は存在しない）', () => {
    expect(DURATION_OPTIONS.map((o) => o.value)).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });

  it('diversity の空間タイプは 10 種類で ID が重複しない', () => {
    expect(SPACE_TYPES).toHaveLength(10);
    expect(new Set(SPACE_TYPES.map((s) => s.id)).size).toBe(10);
  });

  it('intensity は 4 項目・各 0〜4 の 5 段階', () => {
    expect(INTENSITY_TARGETS.map((t) => t.id)).toEqual(['insects', 'landscape', 'birds', 'plants']);
    expect(INTENSITY_OPTIONS.map((o) => o.value)).toEqual([4, 3, 2, 1, 0]);
  });
});

describe('normalizeFrequency', () => {
  it('配点を 7 で除する', () => {
    expect(normalizeFrequency(7)).toBe(1);
    expect(normalizeFrequency(0)).toBe(0);
    expect(normalizeFrequency(4)).toBeCloseTo(4 / 7, 10);
  });

  it('範囲外の値を丸める', () => {
    expect(normalizeFrequency(99)).toBe(1);
    expect(normalizeFrequency(-3)).toBe(0);
    expect(normalizeFrequency(Number.NaN)).toBe(0);
  });
});

describe('normalizeDuration', () => {
  it('配点を 7 で除する', () => {
    expect(normalizeDuration(7)).toBe(1);
    expect(normalizeDuration(4)).toBeCloseTo(4 / 7, 10);
  });

  it('尺度の最小値 1 でも 0 にはならない（指標の床）', () => {
    expect(normalizeDuration(1)).toBeCloseTo(1 / 7, 10);
    expect(normalizeDuration(1)).toBeGreaterThan(0);
  });
});

describe('normalizeDiversity', () => {
  it('選択数を 10 で除する', () => {
    expect(normalizeDiversity([])).toBe(0);
    expect(normalizeDiversity(['urban_park'])).toBeCloseTo(0.1, 10);
    expect(normalizeDiversity(SPACE_TYPES.map((s) => s.id))).toBe(1);
  });

  it('重複を数えない', () => {
    expect(normalizeDiversity(['forest', 'forest', 'forest'])).toBeCloseTo(0.1, 10);
  });

  it('未知の ID を無視する', () => {
    expect(normalizeDiversity(['forest', 'moon_base' as SpaceTypeId])).toBeCloseTo(0.1, 10);
  });
});

describe('normalizeIntensity', () => {
  it('各項目を 4 で除した値の平均を取る', () => {
    expect(normalizeIntensity(flat(4))).toBe(1);
    expect(normalizeIntensity(flat(0))).toBe(0);
    expect(normalizeIntensity(flat(2))).toBeCloseTo(0.5, 10);
  });

  it('項目ごとに配点が異なる場合も平均になる', () => {
    // (4 + 3 + 1 + 0) / 4 / 4 = 0.5
    expect(
      normalizeIntensity({ insects: 4, landscape: 3, birds: 1, plants: 0 }),
    ).toBeCloseTo(0.5, 10);
  });

  it('欠けた項目は 0 として扱う', () => {
    // (4 + 0 + 0 + 0) / 4 / 4 = 0.25
    expect(normalizeIntensity({ insects: 4 })).toBeCloseTo(0.25, 10);
  });
});

describe('computeScore', () => {
  it('4 軸の単純平均（非加重）で PEI を算出する', () => {
    const score = computeScore(baseEntry);
    expect(score.frequency).toBeCloseTo(4 / 7, 10);
    expect(score.duration).toBeCloseTo(3 / 7, 10);
    expect(score.diversity).toBeCloseTo(0.2, 10);
    expect(score.intensity).toBeCloseTo(0.5, 10);
    expect(score.pei).toBeCloseTo((4 / 7 + 3 / 7 + 0.2 + 0.5) / 4, 10);
  });

  it('全項目が最大なら PEI は 1', () => {
    const score = computeScore({
      frequency: 7,
      duration: 7,
      spaces: SPACE_TYPES.map((s) => s.id),
      intensity: flat(4),
    });
    expect(score.pei).toBe(1);
  });

  it('尺度上の最小の記録でも PEI は 0 にならない（duration の床のため）', () => {
    const score = computeScore({ frequency: 0, duration: 1, spaces: [], intensity: flat(0) });
    expect(score.pei).toBeCloseTo(1 / 7 / 4, 10);
    expect(score.pei).toBeGreaterThan(0);
  });

  it('どの軸を上げても PEI は単調に増える（軸は均等に効く）', () => {
    const base = computeScore(baseEntry).pei;
    const upFreq = computeScore({ ...baseEntry, frequency: 5 }).pei;
    const upDur = computeScore({ ...baseEntry, duration: 4 }).pei;
    expect(upFreq).toBeGreaterThan(base);
    expect(upDur).toBeGreaterThan(base);
    // 同じだけ配点が増えれば、frequency でも duration でも寄与は等しい
    expect(upFreq).toBeCloseTo(upDur, 10);
  });

  it('PEI は常に 0〜1 に収まる', () => {
    const wild = computeScore({
      frequency: 999,
      duration: -5,
      spaces: SPACE_TYPES.map((s) => s.id),
      intensity: flat(99),
    });
    expect(wild.pei).toBeGreaterThanOrEqual(0);
    expect(wild.pei).toBeLessThanOrEqual(1);
  });
});

describe('peiFromAxes / lowestAxis / highestAxis', () => {
  it('4 軸の平均を返す', () => {
    expect(peiFromAxes({ frequency: 1, duration: 0, diversity: 0.5, intensity: 0.5 })).toBeCloseTo(0.5, 10);
  });

  it('最低・最高の軸を特定する', () => {
    const axes = { frequency: 0.7, duration: 0.4, diversity: 0.1, intensity: 0.9 };
    expect(lowestAxis(axes)).toBe('diversity');
    expect(highestAxis(axes)).toBe('intensity');
  });

  it('同値なら軸の定義順で先に来るものを返す（入力順に依存しない）', () => {
    const axes = { frequency: 0.3, duration: 0.3, diversity: 0.3, intensity: 0.3 };
    expect(lowestAxis(axes)).toBe(AXIS_KEYS[0]);
    expect(highestAxis(axes)).toBe(AXIS_KEYS[0]);
  });
});

describe('mean / clamp', () => {
  it('空配列の平均は 0', () => {
    expect(mean([])).toBe(0);
  });

  it('clamp は範囲に収める', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
  });
});

describe('isValidDateString', () => {
  it('妥当な日付を受け入れる', () => {
    expect(isValidDateString('2026-02-28')).toBe(true);
    expect(isValidDateString('2024-02-29')).toBe(true);
  });

  it('実在しない日付や形式違いを弾く', () => {
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026/04/01')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
});

describe('validateEntry', () => {
  it('妥当な記録は問題なしとする', () => {
    expect(validateEntry(baseEntry)).toEqual([]);
  });

  it('範囲外の配点を検出する', () => {
    const issues = validateEntry({ ...baseEntry, frequency: 8 });
    expect(issues.map((i) => i.field)).toContain('frequency');
  });

  it('duration の 0 は尺度上存在しないため弾く', () => {
    const issues = validateEntry({ ...baseEntry, duration: 0 });
    expect(issues.map((i) => i.field)).toContain('duration');
  });

  it('未知の空間タイプを検出する', () => {
    const issues = validateEntry({ ...baseEntry, spaces: ['atlantis'] });
    expect(issues.map((i) => i.field)).toContain('spaces');
  });

  it('intensity の欠損項目を検出する', () => {
    const issues = validateEntry({ ...baseEntry, intensity: { insects: 1 } });
    expect(issues.filter((i) => i.field === 'intensity').length).toBe(3);
  });

  it('オブジェクトでないものを弾く', () => {
    expect(validateEntry(null).length).toBe(1);
    expect(validateEntry('記録').length).toBe(1);
  });
});

describe('表示用フォーマッタ', () => {
  it('百分率に変換する', () => {
    expect(toPercent(0.486)).toBe(49);
    expect(toPercent(1)).toBe(100);
  });

  it('小数第 2 位までの文字列にする', () => {
    expect(formatScore(0.4857)).toBe('0.49');
    expect(formatScore(0)).toBe('0.00');
  });
});

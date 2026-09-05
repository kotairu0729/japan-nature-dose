import { describe, expect, it } from 'vitest';
import {
  averageAxes,
  compareLatestToAverage,
  formatDayLabel,
  formatMonthLabel,
  latestScored,
  overallAverage,
  recentAverage,
  seasonOfMonth,
  sortByDateAsc,
  sortByDateDesc,
  toEntrySeries,
  toMonthlyOverview,
  toMonthlySeries,
  todayString,
  weekStart,
} from './series';
import { computeScore } from './pei';
import type { IntensityTarget, PeiEntry } from '../types/pei';

const flat = (v: number): Record<IntensityTarget, number> => ({
  insects: v,
  landscape: v,
  birds: v,
  plants: v,
});

function entry(date: string, over: Partial<PeiEntry> = {}): PeiEntry {
  return {
    id: `id-${date}`,
    date,
    frequency: 4,
    duration: 3,
    spaces: ['urban_park'],
    intensity: flat(2),
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    ...over,
  };
}

describe('並べ替え', () => {
  const entries = [entry('2026-03-01'), entry('2026-01-15'), entry('2026-02-20')];

  it('古い順に並べる', () => {
    expect(sortByDateAsc(entries).map((e) => e.date)).toEqual([
      '2026-01-15',
      '2026-02-20',
      '2026-03-01',
    ]);
  });

  it('新しい順に並べる', () => {
    expect(sortByDateDesc(entries).map((e) => e.date)).toEqual([
      '2026-03-01',
      '2026-02-20',
      '2026-01-15',
    ]);
  });

  it('元の配列を破壊しない', () => {
    const copy = [...entries];
    sortByDateAsc(entries);
    expect(entries).toEqual(copy);
  });
});

describe('toEntrySeries', () => {
  it('記録 1 件を 1 点として古い順に返す', () => {
    const series = toEntrySeries([entry('2026-03-01'), entry('2026-01-15')]);
    expect(series.map((p) => p.key)).toEqual(['2026-01-15', '2026-03-01']);
    expect(series[0]?.count).toBe(1);
    expect(series[0]?.pei).toBeCloseTo(computeScore(entry('2026-01-15')).pei, 10);
  });

  it('記録が無ければ空配列', () => {
    expect(toEntrySeries([])).toEqual([]);
  });
});

describe('toMonthlySeries', () => {
  it('同じ月の記録を平均する', () => {
    const series = toMonthlySeries([
      entry('2026-01-05', { frequency: 7 }),
      entry('2026-01-19', { frequency: 1 }),
      entry('2026-02-02', { frequency: 4 }),
    ]);
    expect(series.map((p) => p.key)).toEqual(['2026-01', '2026-02']);
    expect(series[0]?.count).toBe(2);
    expect(series[0]?.frequency).toBeCloseTo((7 / 7 + 1 / 7) / 2, 10);
  });

  it('月次の PEI は 4 軸平均の平均と一致する', () => {
    const series = toMonthlySeries([entry('2026-01-05', { frequency: 7 }), entry('2026-01-19')]);
    const p = series[0]!;
    expect(p.pei).toBeCloseTo((p.frequency + p.duration + p.diversity + p.intensity) / 4, 10);
  });
});

describe('toMonthlyOverview', () => {
  it('記録が無い月も含めて 12 ヶ月を連続で返す', () => {
    const points = toMonthlyOverview([entry('2026-04-01')], 12, '2026-09-04');
    expect(points).toHaveLength(12);
    expect(points[0]?.key).toBe('2025-10');
    expect(points[11]?.key).toBe('2026-09');
    expect(points.find((p) => p.key === '2026-04')?.count).toBe(1);
    expect(points.find((p) => p.key === '2026-05')?.pei).toBeNull();
  });

  it('年をまたいでも月の計算が正しい', () => {
    const points = toMonthlyOverview([], 3, '2026-01-15');
    expect(points.map((p) => p.key)).toEqual(['2025-11', '2025-12', '2026-01']);
  });

  it('季節を割り当てる', () => {
    const points = toMonthlyOverview([], 12, '2026-12-31');
    expect(points.find((p) => p.month === 4)?.season).toBe('spring');
    expect(points.find((p) => p.month === 7)?.season).toBe('summer');
    expect(points.find((p) => p.month === 10)?.season).toBe('autumn');
    expect(points.find((p) => p.month === 12)?.season).toBe('winter');
  });

  it('記録が全く無くても 12 ヶ月分の枠を返す', () => {
    const points = toMonthlyOverview([], 12, '2026-09-04');
    expect(points).toHaveLength(12);
    expect(points.every((p) => p.pei === null && p.count === 0)).toBe(true);
  });
});

describe('seasonOfMonth', () => {
  it('3〜5月=春, 6〜8月=夏, 9〜11月=秋, 12・1・2月=冬', () => {
    expect([3, 4, 5].map(seasonOfMonth)).toEqual(['spring', 'spring', 'spring']);
    expect([6, 7, 8].map(seasonOfMonth)).toEqual(['summer', 'summer', 'summer']);
    expect([9, 10, 11].map(seasonOfMonth)).toEqual(['autumn', 'autumn', 'autumn']);
    expect([12, 1, 2].map(seasonOfMonth)).toEqual(['winter', 'winter', 'winter']);
  });
});

describe('averageAxes / overallAverage', () => {
  it('軸ごとに平均を取る', () => {
    const axes = averageAxes([
      computeScore(entry('2026-01-01', { frequency: 7 })),
      computeScore(entry('2026-01-02', { frequency: 0 })),
    ]);
    expect(axes.frequency).toBeCloseTo(0.5, 10);
  });

  it('記録が無ければ overallAverage は null', () => {
    expect(overallAverage([])).toBeNull();
  });

  it('件数を含めて返す', () => {
    const avg = overallAverage([entry('2026-01-01'), entry('2026-02-01')]);
    expect(avg?.count).toBe(2);
  });
});

describe('latestScored / recentAverage', () => {
  it('日付が最も新しい記録を返す（配列の順序に依存しない）', () => {
    const latest = latestScored([entry('2026-01-01'), entry('2026-05-01'), entry('2026-03-01')]);
    expect(latest?.entry.date).toBe('2026-05-01');
  });

  it('記録が無ければ null', () => {
    expect(latestScored([])).toBeNull();
    expect(recentAverage([], 4)).toBeNull();
  });

  it('直近 n 件だけを平均する', () => {
    const avg = recentAverage(
      [
        entry('2026-01-01', { frequency: 0 }),
        entry('2026-02-01', { frequency: 7 }),
        entry('2026-03-01', { frequency: 7 }),
      ],
      2,
    );
    expect(avg?.count).toBe(2);
    expect(avg?.frequency).toBe(1);
  });

  it('件数が足りなければあるだけで計算する', () => {
    expect(recentAverage([entry('2026-01-01')], 8)?.count).toBe(1);
  });
});

describe('compareLatestToAverage', () => {
  it('記録が 1 件以下なら null', () => {
    expect(compareLatestToAverage([])).toBeNull();
    expect(compareLatestToAverage([entry('2026-01-01')])).toBeNull();
  });

  it('4 軸と PEI の差分を返す', () => {
    const rows = compareLatestToAverage([
      entry('2026-01-01', { frequency: 0 }),
      entry('2026-02-01', { frequency: 7 }),
    ]);
    expect(rows).not.toBeNull();
    expect(rows?.map((r) => r.axis)).toEqual([
      'frequency',
      'duration',
      'diversity',
      'intensity',
      'pei',
    ]);
    const freq = rows?.find((r) => r.axis === 'frequency');
    expect(freq?.latest).toBe(1);
    expect(freq?.average).toBeCloseTo(0.5, 10);
    expect(freq?.delta).toBeCloseTo(0.5, 10);
  });
});

describe('日付ユーティリティ', () => {
  it('ラベルを整形する', () => {
    expect(formatDayLabel('2026-04-05')).toBe('4/5');
    expect(formatMonthLabel('2026-04')).toBe('2026年4月');
  });

  it('todayString はローカル日付を返す', () => {
    expect(todayString(new Date(2026, 8, 4))).toBe('2026-09-04');
  });

  it('weekStart はその週の月曜日を返す', () => {
    expect(weekStart('2026-09-04')).toBe('2026-08-31'); // 金曜 -> 月曜
    expect(weekStart('2026-08-31')).toBe('2026-08-31'); // 月曜はそのまま
    expect(weekStart('2026-09-06')).toBe('2026-08-31'); // 日曜 -> 同じ週の月曜
  });
});

import { describe, expect, it } from 'vitest';
import {
  doiUrl,
  evidenceForAxis,
  filterByDomain,
  formatCitation,
  selectEvidence,
} from './evidenceSelect';
import { EVIDENCE } from '../data/evidence';
import type { AxisValues } from '../types/pei';

const axes = (v: Partial<AxisValues>): AxisValues => ({
  frequency: 0.5,
  duration: 0.5,
  diversity: 0.5,
  intensity: 0.5,
  ...v,
});

describe('filterByDomain / evidenceForAxis', () => {
  it('領域で絞り込む', () => {
    const mental = filterByDomain('mental');
    expect(mental.length).toBeGreaterThan(0);
    expect(mental.every((e) => e.domain === 'mental')).toBe(true);
  });

  it('null なら全件返す', () => {
    expect(filterByDomain(null)).toHaveLength(EVIDENCE.length);
  });

  it('軸に紐づく知見を返す', () => {
    expect(evidenceForAxis('intensity').every((e) => e.triggerAxis === 'intensity')).toBe(true);
  });
});

describe('selectEvidence', () => {
  it('記録が無くても知見を返す', () => {
    const picks = selectEvidence(null, 3);
    expect(picks).toHaveLength(3);
    expect(picks.every((p) => p.reason.length > 0)).toBe(true);
  });

  it('最も低い軸に紐づく知見を含める', () => {
    const picks = selectEvidence(axes({ intensity: 0.05 }), 3);
    expect(picks.some((p) => p.evidence.triggerAxis === 'intensity')).toBe(true);
  });

  it('最も高い軸に紐づく知見も含め、低い側だけを見せない', () => {
    const picks = selectEvidence(axes({ intensity: 0.05, duration: 0.95 }), 3);
    expect(picks.some((p) => p.evidence.triggerAxis === 'intensity')).toBe(true);
    expect(picks.some((p) => p.evidence.triggerAxis === 'duration')).toBe(true);
  });

  it('同じ知見を重複して返さない', () => {
    for (const count of [1, 3, 5, 7]) {
      const picks = selectEvidence(axes({ diversity: 0.1 }), count);
      const ids = picks.map((p) => p.evidence.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('領域が偏らないようにする（3件なら3領域）', () => {
    const picks = selectEvidence(axes({ frequency: 0.1 }), 3);
    const domains = picks.map((p) => p.evidence.domain);
    expect(new Set(domains).size).toBe(3);
  });

  it('要求件数を超えず、在庫を超えても落ちない', () => {
    expect(selectEvidence(axes({}), 0)).toHaveLength(0);
    expect(selectEvidence(axes({}), 100).length).toBeLessThanOrEqual(EVIDENCE.length);
  });

  it('同じ入力には同じ結果を返す（乱数を使わない）', () => {
    const a = selectEvidence(axes({ duration: 0.1 }), 4, 3).map((p) => p.evidence.id);
    const b = selectEvidence(axes({ duration: 0.1 }), 4, 3).map((p) => p.evidence.id);
    expect(a).toEqual(b);
  });

  it('rotation を変えると提示が入れ替わる', () => {
    const a = selectEvidence(axes({ duration: 0.1 }), 3, 0).map((p) => p.evidence.id);
    const b = selectEvidence(axes({ duration: 0.1 }), 3, 1).map((p) => p.evidence.id);
    expect(a).not.toEqual(b);
  });

  it('選択理由が個人の健康状態に言及していない', () => {
    for (const rotation of [0, 1, 2, 3, 4, 5]) {
      for (const pick of selectEvidence(axes({ intensity: 0 }), 4, rotation)) {
        expect(/健康|効果があ|改善しま|なります/.test(pick.reason)).toBe(false);
      }
    }
  });
});

describe('引用の整形', () => {
  it('DOI からリンクを作る', () => {
    expect(doiUrl('10.1002/pan3.70389')).toBe('https://doi.org/10.1002/pan3.70389');
  });

  it('著者・年・雑誌名を1行にまとめる', () => {
    const evidence = EVIDENCE.find((e) => e.id === 'white-2019-120-minutes')!;
    expect(formatCitation(evidence)).toContain('2019');
    expect(formatCitation(evidence)).toContain('Scientific Reports');
  });
});

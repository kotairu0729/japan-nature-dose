import { describe, expect, it } from 'vitest';
import { axisSpread, buildSuggestionPlan, suggestionsForAxis, tiedLowestAxes } from './suggest';
import { SUGGESTIONS } from '../data/suggestions';
import type { AxisKey, AxisValues } from '../types/pei';

const AXES: AxisKey[] = ['frequency', 'duration', 'diversity', 'intensity'];

const axes = (v: Partial<AxisValues>): AxisValues => ({
  frequency: 0.5,
  duration: 0.5,
  diversity: 0.5,
  intensity: 0.5,
  ...v,
});

describe('提案カタログの要件', () => {
  it('ID が一意である', () => {
    const ids = SUGGESTIONS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('4 軸それぞれに提案が 3 件以上ある', () => {
    for (const axis of AXES) {
      expect(SUGGESTIONS.filter((s) => s.axis === axis).length, axis).toBeGreaterThanOrEqual(3);
    }
  });

  it('すべての提案が無料または低コストである', () => {
    for (const s of SUGGESTIONS) {
      expect(['free', 'low'], s.id).toContain(s.cost);
    }
  });

  it('大半の提案が既存の移動・時間の中に収まる（追加10分以内）', () => {
    const withinTen = SUGGESTIONS.filter((s) => s.extraMinutes <= 10);
    expect(withinTen.length / SUGGESTIONS.length).toBeGreaterThanOrEqual(0.8);
  });

  it('休日の遠出を前提とする提案に偏っていない', () => {
    const weekend = SUGGESTIONS.filter((s) => s.context === 'weekend');
    expect(weekend.length / SUGGESTIONS.length).toBeLessThan(0.2);
  });

  it('義務や達成を課す言い方をしていない', () => {
    const forbidden = [/しましょう/, /すべき/, /目標/, /達成/, /連続/, /毎日必ず/, /ランキング/];
    for (const s of SUGGESTIONS) {
      for (const pattern of forbidden) {
        expect(pattern.test(`${s.title}${s.detail}`), `${s.id} に ${pattern}`).toBe(false);
      }
    }
  });

  it('健康を報酬として提示していない（道具主義に寄らない）', () => {
    const forbidden = [/健康のため/, /健康になり/, /ストレスが減りま/, /病気/, /痩せ/];
    for (const s of SUGGESTIONS) {
      for (const pattern of forbidden) {
        expect(pattern.test(`${s.title}${s.detail}`), `${s.id} に ${pattern}`).toBe(false);
      }
    }
  });
});

describe('suggestionsForAxis', () => {
  it('指定した軸の提案だけを返す', () => {
    for (const axis of AXES) {
      expect(suggestionsForAxis(axis).every((s) => s.axis === axis)).toBe(true);
    }
  });

  it('負担の少ない順（無料・追加時間が短い順）に並ぶ', () => {
    const list = suggestionsForAxis('frequency');
    const ranks = list.map((s) => (s.cost === 'free' ? 0 : 100) + s.extraMinutes);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});

describe('buildSuggestionPlan', () => {
  it('記録が無ければ最初の一歩を返す', () => {
    const plan = buildSuggestionPlan(null);
    expect(plan.axis).toBeNull();
    expect(plan.suggestions).toHaveLength(1);
    expect(plan.suggestions[0]?.id).toBe('first-step');
  });

  it('最も低い軸に対応する提案を返す', () => {
    const plan = buildSuggestionPlan(axes({ intensity: 0.1 }));
    expect(plan.axis).toBe('intensity');
    expect(plan.suggestions.every((s) => s.axis === 'intensity')).toBe(true);
  });

  it('要求した件数を超えない', () => {
    expect(buildSuggestionPlan(axes({ diversity: 0 }), 2).suggestions).toHaveLength(2);
    expect(buildSuggestionPlan(axes({ diversity: 0 }), 0).suggestions).toHaveLength(0);
  });

  it('rotation を変えると提示される提案が入れ替わる', () => {
    const a = buildSuggestionPlan(axes({ duration: 0 }), 2, 0).suggestions.map((s) => s.id);
    const b = buildSuggestionPlan(axes({ duration: 0 }), 2, 1).suggestions.map((s) => s.id);
    expect(a).not.toEqual(b);
  });

  it('同じ入力なら常に同じ結果を返す（乱数を使わない）', () => {
    const first = buildSuggestionPlan(axes({ duration: 0 }), 3, 7).suggestions.map((s) => s.id);
    const second = buildSuggestionPlan(axes({ duration: 0 }), 3, 7).suggestions.map((s) => s.id);
    expect(first).toEqual(second);
  });

  it('rotation が負や大きな値でも範囲外にならない', () => {
    for (const rotation of [-5, -1, 0, 99, 1000]) {
      const plan = buildSuggestionPlan(axes({ duration: 0 }), 3, rotation);
      expect(plan.suggestions.length).toBeGreaterThan(0);
      expect(plan.suggestions.every((s) => s.axis === 'duration')).toBe(true);
    }
  });
});

describe('tiedLowestAxes / axisSpread', () => {
  it('横並びの軸をまとめて返す', () => {
    expect(tiedLowestAxes(axes({}))).toHaveLength(4);
  });

  it('明確に低い軸が一つならその軸だけを返す', () => {
    expect(tiedLowestAxes(axes({ diversity: 0.1 }))).toEqual(['diversity']);
  });

  it('ばらつきは最大値と最小値の差', () => {
    expect(axisSpread(axes({ frequency: 1, diversity: 0.2 }))).toBeCloseTo(0.8, 10);
    expect(axisSpread(axes({}))).toBe(0);
  });
});

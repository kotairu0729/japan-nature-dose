/**
 * 最も低い軸の特定と、それに対応する行動提案の選択。純関数のみ。
 *
 * 提案は「無料または極低コストで、既存の移動の中で実行できるもの」を優先する。
 * 同点の場合の順序を固定し、同じ入力に対して常に同じ結果を返す（乱数を使わない）。
 */
import { FIRST_STEP_SUGGESTION, SUGGESTIONS, type Suggestion } from '../data/suggestions';
import { lowestAxis } from './pei';
import type { AxisKey, AxisValues } from '../types/pei';

/** 費用と追加時間の少ないものを先に並べる（既存の移動に埋め込めるものを優先）。 */
function suggestionRank(s: Suggestion): number {
  return (s.cost === 'free' ? 0 : 100) + s.extraMinutes;
}

/** 指定した軸の提案を、負担の少ない順に返す。 */
export function suggestionsForAxis(axis: AxisKey): Suggestion[] {
  return SUGGESTIONS.filter((s) => s.axis === axis).sort(
    (a, b) => suggestionRank(a) - suggestionRank(b) || a.id.localeCompare(b.id),
  );
}

export interface SuggestionPlan {
  /** 提案の対象となった軸。記録が無い場合は null。 */
  axis: AxisKey | null;
  suggestions: Suggestion[];
}

/**
 * 4軸の値から提案を組み立てる。
 *
 * @param axes 記録が無い場合は null を渡す。
 * @param limit 返す提案の最大数。
 * @param rotation 同じ軸が続いても表示が固定されないよう、開始位置をずらす値。
 *   記録件数など、増えていく整数を渡す。
 */
export function buildSuggestionPlan(
  axes: AxisValues | null,
  limit = 3,
  rotation = 0,
): SuggestionPlan {
  if (!axes) {
    return { axis: null, suggestions: [FIRST_STEP_SUGGESTION] };
  }
  const axis = lowestAxis(axes);
  const pool = suggestionsForAxis(axis);
  if (pool.length === 0) return { axis, suggestions: [] };

  const offset = ((rotation % pool.length) + pool.length) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return { axis, suggestions: rotated.slice(0, Math.max(0, limit)) };
}

/**
 * 4軸のうち、値が近い（差が 0.05 未満）軸をまとめて返す。
 * 「最も低い軸」を一つだけ強調すると、実質的に横並びの状態を誤って伝えるため、
 * UI ではこの情報を使って言い方を調整する。
 */
export function tiedLowestAxes(axes: AxisValues, tolerance = 0.05): AxisKey[] {
  const lowest = lowestAxis(axes);
  const min = axes[lowest];
  return (['frequency', 'duration', 'diversity', 'intensity'] as const).filter(
    (k) => axes[k] - min < tolerance,
  );
}

/** 4軸のばらつき（最大値と最小値の差）。バランスの偏りを示すのに使う。 */
export function axisSpread(axes: AxisValues): number {
  const values = [axes.frequency, axes.duration, axes.diversity, axes.intensity];
  return Math.max(...values) - Math.min(...values);
}

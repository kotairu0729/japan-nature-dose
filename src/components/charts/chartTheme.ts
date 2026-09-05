/**
 * グラフ共通の設定。
 *
 * 色は CSS カスタムプロパティ経由で渡す。SVG の stroke/fill は var() を解釈するため、
 * ダークモードの切り替えが CSS 側だけで完結する。
 *
 * 配色は dataviz の検証済みカテゴリカル配色を使用している。明色面では
 * diversity（aqua）と intensity（yellow）が背景に対して 3:1 未満のため、
 * 値は必ず数字でも表示し、表形式での確認もできるようにしている。
 */
import type { AxisKey } from '../../types/pei';

export const AXIS_COLOR_VAR: Record<AxisKey, string> = {
  frequency: 'var(--axis-frequency)',
  duration: 'var(--axis-duration)',
  diversity: 'var(--axis-diversity)',
  intensity: 'var(--axis-intensity)',
};

export const PEI_COLOR = 'var(--series-pei)';
export const COMPARE_COLOR = 'var(--series-compare)';
export const GRID_COLOR = 'var(--grid)';
export const AXIS_TEXT_COLOR = 'var(--text-faint)';

/** PEI も4軸も 0〜1 に正規化されているため、目盛りは常に固定する。 */
export const SCORE_DOMAIN: [number, number] = [0, 1];
export const SCORE_TICKS = [0, 0.25, 0.5, 0.75, 1];

export const tickStyle = { fontSize: 11, fill: AXIS_TEXT_COLOR } as const;

/** 目盛りの書式。ブラウザ既定だと "0.25" が ".25" と描かれ読みにくいため明示する。 */
export function formatTick(value: number): string {
  return value === 0 || value === 1 ? String(value) : value.toFixed(2).replace(/0$/, '');
}

export const gridProps = {
  stroke: GRID_COLOR,
  strokeDasharray: '2 4',
  vertical: false,
} as const;

/**
 * 4軸それぞれの推移を、独立した小さなグラフとして並べる（スモールマルチプル）。
 *
 * 4本を1枚に重ねると、色覚特性によっては区別しづらい組み合わせが生じるうえ、
 * 「どの軸がどう動いたか」も読み取りにくい。軸ごとに分けることで、
 * 系列の識別は見出しの文字が担い、色は補助に留まる。
 */
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { AXIS_COLOR_VAR, SCORE_DOMAIN, formatTick, gridProps } from './chartTheme';
import { AXIS_META } from '../../data/scale';
import { AXIS_KEYS, formatScore } from '../../lib/pei';
import type { SeriesPoint } from '../../lib/series';

interface Props {
  data: SeriesPoint[];
}

export default function AxisTrendGrid({ data }: Props) {
  return (
    <div className="axis-grid">
      {AXIS_KEYS.map((axis) => {
        const last = data.at(-1);
        return (
          <div className="axis-grid__cell" key={axis}>
            <div className="axis-grid__head">
              <span className="axis-grid__title">{AXIS_META[axis].label}</span>
              {last && (
                <span className="axis-bar__value">直近 {formatScore(last[axis])}</span>
              )}
            </div>
            <div className="axis-grid__chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 8, right: 6, bottom: 6, left: 0 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="label" tick={false} tickLine={false} axisLine={{ stroke: 'var(--grid)' }} height={2} />
                  <YAxis
                    domain={SCORE_DOMAIN}
                    ticks={[0, 0.5, 1]}
                    tick={{ fontSize: 10, fill: 'var(--text-faint)' }}
                    tickFormatter={formatTick}
                    tickLine={false}
                    axisLine={false}
                    width={26}
                  />
                  <Tooltip
                    cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]?.payload as SeriesPoint | undefined;
                      if (!point) return null;
                      return (
                        <ChartTooltip
                          title={point.key}
                          rows={[
                            {
                              name: AXIS_META[axis].label,
                              value: point[axis],
                              color: AXIS_COLOR_VAR[axis],
                            },
                          ]}
                        />
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={axis}
                    stroke={AXIS_COLOR_VAR[axis]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
                    isAnimationActive={false}
                    name={AXIS_META[axis].label}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

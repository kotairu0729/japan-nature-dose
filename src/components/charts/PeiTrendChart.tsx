/** PEI 総合スコアの推移。単一系列のため凡例は置かない（見出しが系列名を兼ねる）。 */
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
import {
  PEI_COLOR,
  SCORE_DOMAIN,
  SCORE_TICKS,
  formatTick,
  gridProps,
  tickStyle,
} from './chartTheme';
import type { SeriesPoint } from '../../lib/series';

interface Props {
  data: SeriesPoint[];
  /** 全期間平均。基準線として薄く引く。 */
  average?: number | undefined;
}

export default function PeiTrendChart({ data, average }: Props) {
  // 点が多いと丸が連なって折れ線が読めなくなるため、密なときは線だけにする
  const showDots = data.length <= 24;

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="label"
            tick={tickStyle}
            tickLine={false}
            axisLine={{ stroke: 'var(--grid)' }}
            minTickGap={16}
          />
          <YAxis
            domain={SCORE_DOMAIN}
            ticks={SCORE_TICKS}
            tick={tickStyle}
            tickFormatter={formatTick}
            tickLine={false}
            axisLine={false}
            width={44}
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
                  rows={[{ name: 'PEI', value: point.pei, color: PEI_COLOR }]}
                  footer={point.count > 1 ? `${point.count} 件の平均` : undefined}
                />
              );
            }}
          />
          {average !== undefined && (
            <Line
              type="monotone"
              dataKey={() => average}
              stroke="var(--text-faint)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              legendType="none"
              name="全期間平均"
            />
          )}
          <Line
            type="monotone"
            dataKey="pei"
            stroke={PEI_COLOR}
            strokeWidth={2}
            dot={showDots ? { r: 4, strokeWidth: 2, stroke: 'var(--surface)', fill: PEI_COLOR } : false}
            activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
            isAnimationActive={false}
            name="PEI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

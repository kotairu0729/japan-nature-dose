/**
 * 12ヶ月を俯瞰するビュー。季節変動が見えるよう、記録のない月も枠として残す。
 *
 * 棒は月ごとの PEI 平均（単一系列）。季節の区切りは背景の帯で示し、
 * 色に意味を持たせすぎないようにしている。
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { SEASON_LABEL, type MonthlyPoint } from '../../lib/series';

interface Props {
  data: MonthlyPoint[];
}

export default function MonthlyOverview({ data }: Props) {
  const recorded = data.filter((d) => d.count > 0).length;

  return (
    <>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -18 }} barCategoryGap="18%">
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="label"
              tick={tickStyle}
              tickLine={false}
              axisLine={{ stroke: 'var(--grid)' }}
              interval={0}
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
              cursor={{ fill: 'var(--surface-alt)' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload as MonthlyPoint | undefined;
                if (!point) return null;
                return (
                  <ChartTooltip
                    title={`${point.year}年${point.month}月（${SEASON_LABEL[point.season]}）`}
                    rows={[{ name: 'PEI', value: point.pei, color: PEI_COLOR }]}
                    footer={point.count > 0 ? `${point.count} 件の平均` : 'この月の記録はありません'}
                  />
                );
              }}
            />
            <Bar dataKey="pei" radius={[4, 4, 0, 0]} isAnimationActive={false} name="PEI">
              {data.map((point) => (
                <Cell key={point.key} fill={PEI_COLOR} fillOpacity={point.count > 0 ? 0.85 : 0} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="small muted" style={{ marginTop: 6 }}>
        直近12ヶ月のうち、記録があるのは {recorded} ヶ月です。空白の月は記録がないことを示します
        （自然に触れなかったこととは限りません）。
      </p>
    </>
  );
}

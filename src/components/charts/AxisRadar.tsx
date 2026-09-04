/**
 * 4軸のバランスをレーダーチャートで示す（論文の Figure 5-7 に相当）。
 *
 * 直近と全期間平均の2系列を重ねる。識別は凡例と線種（実線／破線）でも
 * 行い、色だけに依存させない。
 */
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import ChartTooltip from './ChartTooltip';
import { COMPARE_COLOR, GRID_COLOR, PEI_COLOR } from './chartTheme';
import { AXIS_META } from '../../data/scale';
import { AXIS_KEYS } from '../../lib/pei';
import type { AxisValues } from '../../types/pei';

interface Props {
  /** 手前に描く値（直近の記録など）。 */
  current: AxisValues;
  currentLabel: string;
  /** 比較対象（全期間平均など）。省略可。 */
  reference?: AxisValues | undefined;
  referenceLabel?: string | undefined;
}

interface RadarRow {
  axis: string;
  current: number;
  reference: number | null;
}

export default function AxisRadar({
  current,
  currentLabel,
  reference,
  referenceLabel = '全期間平均',
}: Props) {
  const data: RadarRow[] = AXIS_KEYS.map((key) => ({
    axis: AXIS_META[key].label,
    current: current[key],
    reference: reference ? reference[key] : null,
  }));

  return (
    <>
      <div className="chart-wrap chart-wrap--radar">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={GRID_COLOR} />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
            {/* 半径の数値ラベルは頂点ラベルと重なって読めないため置かない。
                中心が0・外周が1であることは図の下に文章で示す。 */}
            <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as RadarRow | undefined;
                if (!row) return null;
                const rows = [{ name: currentLabel, value: row.current, color: PEI_COLOR }];
                if (row.reference !== null) {
                  rows.push({
                    name: referenceLabel,
                    value: row.reference,
                    color: COMPARE_COLOR,
                  });
                }
                return <ChartTooltip title={row.axis} rows={rows} />;
              }}
            />
            {reference && (
              <Radar
                name={referenceLabel}
                dataKey="reference"
                stroke={COMPARE_COLOR}
                strokeWidth={2}
                strokeDasharray="5 4"
                fill="none"
                isAnimationActive={false}
              />
            )}
            <Radar
              name={currentLabel}
              dataKey="current"
              stroke={PEI_COLOR}
              strokeWidth={2}
              fill={PEI_COLOR}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span className="chart-legend__item">
          <span className="chart-legend__swatch" style={{ background: PEI_COLOR }} />
          {currentLabel}（実線）
        </span>
        {reference && (
          <span className="chart-legend__item">
            <span
              className="chart-legend__swatch"
              style={{ background: COMPARE_COLOR, opacity: 0.85 }}
            />
            {referenceLabel}（破線）
          </span>
        )}
      </div>
      <p className="small muted">中心が 0、外周が 1 です。値は下の一覧でも確認できます。</p>
    </>
  );
}

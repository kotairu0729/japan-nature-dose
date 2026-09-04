/** 4軸の値を横棒で表示する。順位や達成度ではなく、内訳を見るためのもの。 */
import { AXIS_META } from '../data/scale';
import { AXIS_KEYS, formatScore } from '../lib/pei';
import type { AxisValues } from '../types/pei';

export const AXIS_COLOR: Record<(typeof AXIS_KEYS)[number], string> = {
  frequency: 'var(--axis-frequency)',
  duration: 'var(--axis-duration)',
  diversity: 'var(--axis-diversity)',
  intensity: 'var(--axis-intensity)',
};

interface Props {
  axes: AxisValues;
  /** 比較用に薄く重ねる値（全期間平均など）。 */
  reference?: AxisValues | undefined;
  referenceLabel?: string;
  compact?: boolean;
}

export default function AxisBars({ axes, reference, referenceLabel, compact }: Props) {
  return (
    <div className="axis-bars">
      {AXIS_KEYS.map((key) => {
        const value = axes[key];
        const ref = reference?.[key];
        return (
          <div key={key}>
            <div className="axis-bar__head">
              <span>{AXIS_META[key].label}</span>
              <span className="axis-bar__value">
                {formatScore(value)}
                {ref !== undefined && (
                  <>
                    {' / '}
                    <span title={referenceLabel}>{formatScore(ref)}</span>
                  </>
                )}
              </span>
            </div>
            <div
              className="axis-bar__track"
              role="img"
              aria-label={`${AXIS_META[key].label} ${formatScore(value)}（1が上限）`}
            >
              <div
                className="axis-bar__fill"
                style={{ width: `${Math.round(value * 100)}%`, background: AXIS_COLOR[key] }}
              />
            </div>
            {!compact && <p className="choice__hint">{AXIS_META[key].description}</p>}
          </div>
        );
      })}
    </div>
  );
}

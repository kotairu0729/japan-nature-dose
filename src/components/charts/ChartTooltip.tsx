/** グラフ共通のツールチップ。値は小数第2位まで、単位と件数を添える。 */
import { formatScore } from '../../lib/pei';

export interface TooltipRow {
  name: string;
  value: number | null;
  color?: string;
}

interface Props {
  title: string;
  rows: TooltipRow[];
  footer?: string | undefined;
}

export default function ChartTooltip({ title, rows, footer }: Props) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 12,
        lineHeight: 1.6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        color: 'var(--text)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{title}</div>
      {rows.map((row) => (
        <div key={row.name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {row.color && (
            <span
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: row.color,
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ color: 'var(--text-muted)' }}>{row.name}</span>
          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
            {row.value === null ? '記録なし' : formatScore(row.value)}
          </span>
        </div>
      ))}
      {footer && (
        <div style={{ color: 'var(--text-faint)', marginTop: 3 }}>{footer}</div>
      )}
    </div>
  );
}

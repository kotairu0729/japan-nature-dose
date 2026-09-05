/** 記録がまだ無いときの表示。責める言い方をしない。 */
import type { ReactNode } from 'react';

export default function EmptyState({
  children,
  onGoToRecord,
}: {
  children: ReactNode;
  onGoToRecord: () => void;
}) {
  return (
    <div className="card">
      <div className="empty">
        <p>{children}</p>
        <button className="button button--primary" type="button" onClick={onGoToRecord}>
          最初の記録をつける
        </button>
        <p className="small muted">3分ほどで終わります。正確でなくてかまいません。</p>
      </div>
    </div>
  );
}

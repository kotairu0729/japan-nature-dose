/** 記録の入力と、これまでの記録の一覧。 */
import { useMemo, useState } from 'react';
import RecordForm from '../components/RecordForm';
import { computeScore, formatScore } from '../lib/pei';
import { sortByDateDesc } from '../lib/series';
import { SPACE_TYPES } from '../data/scale';
import { useRecords, useRecordsActions } from '../state/RecordsContext';
import type { PeiEntry, PeiEntryInput } from '../types/pei';

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; entry: PeiEntry };

export default function RecordPage() {
  const { entries } = useRecords();
  const { addEntry, updateEntry, removeEntry } = useRecordsActions();
  const [mode, setMode] = useState<Mode>(entries.length === 0 ? { kind: 'new' } : { kind: 'list' });

  const existingDates = useMemo(() => entries.map((e) => e.date), [entries]);

  const handleSubmit = (input: PeiEntryInput): void => {
    if (mode.kind === 'edit') updateEntry(mode.entry.id, input);
    else addEntry(input);
    setMode({ kind: 'list' });
    window.scrollTo({ top: 0 });
  };

  if (mode.kind === 'new' || mode.kind === 'edit') {
    return (
      <div className="stack">
        <h2 className="section-heading">
          {mode.kind === 'edit' ? '記録を編集' : '新しい記録'}
        </h2>
        <RecordForm
          {...(mode.kind === 'edit' ? { initial: mode.entry } : {})}
          onSubmit={handleSubmit}
          onCancel={entries.length > 0 ? () => setMode({ kind: 'list' }) : undefined}
          existingDates={existingDates}
        />
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="button-row">
        <button className="button button--primary" type="button" onClick={() => setMode({ kind: 'new' })}>
          記録を追加
        </button>
      </div>

      <div className="card">
        <h2 className="card__title">これまでの記録（{entries.length} 件）</h2>
        <p className="card__lead">
          日付の新しい順です。記録は端末の中だけに保存されます。
        </p>
        {entries.length === 0 ? (
          <p className="small muted">まだ記録がありません。</p>
        ) : (
          <div>
            {sortByDateDesc(entries).map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                onEdit={() => setMode({ kind: 'edit', entry })}
                onRemove={() => {
                  if (window.confirm(`${entry.date} の記録を削除しますか？`)) removeEntry(entry.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryRow({
  entry,
  onEdit,
  onRemove,
}: {
  entry: PeiEntry;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const score = computeScore(entry);
  const spaceLabels = entry.spaces
    .map((id) => SPACE_TYPES.find((s) => s.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div className="entry-row">
      <div className="entry-row__body">
        <div className="entry-row__date">{entry.date}</div>
        <div className="entry-row__meta">
          {spaceLabels.length > 0 ? spaceLabels.join('、') : '空間の選択なし'}
        </div>
        {entry.note && <div className="entry-row__meta">{entry.note}</div>}
      </div>
      <div className="entry-row__score">{formatScore(score.pei)}</div>
      <div className="entry-row__actions">
        <button className="button button--quiet" type="button" onClick={onEdit}>
          編集
        </button>
        <button className="button button--quiet" type="button" onClick={onRemove}>
          削除
        </button>
      </div>
    </div>
  );
}

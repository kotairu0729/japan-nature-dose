import { useMemo, useState } from 'react';
import RecordPage from './pages/RecordPage';
import { useRecords, useRecordsActions } from './state/RecordsContext';

const TABS = [
  { id: 'home', label: 'ホーム', icon: '◍' },
  { id: 'record', label: '記録', icon: '✎' },
  { id: 'trends', label: '推移', icon: '◺' },
  { id: 'evidence', label: '知見', icon: '❋' },
  { id: 'settings', label: '設定', icon: '⚙' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export default function App() {
  const [tab, setTab] = useState<TabId>('home');
  const { hydrated, notice } = useRecords();
  const { setNotice } = useRecordsActions();

  const body = useMemo(() => {
    switch (tab) {
      case 'record':
        return <RecordPage />;
      default:
        return <p className="small muted">準備中</p>;
    }
  }, [tab]);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">PEI 自然体験の記録</h1>
        <p className="app__subtitle">Personalised Ecology Index</p>
      </header>

      <main className="app__main">
        {notice && (
          <div className="note note--warn" style={{ marginBottom: 16 }}>
            {notice}{' '}
            <button className="button button--quiet" type="button" onClick={() => setNotice(null)}>
              閉じる
            </button>
          </div>
        )}
        {hydrated ? body : <p className="small muted">読み込み中…</p>}
      </main>

      <nav className="tabbar" aria-label="画面の切り替え">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="tabbar__button"
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => {
              setTab(item.id);
              window.scrollTo({ top: 0 });
            }}
          >
            <span className="tabbar__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

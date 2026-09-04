/**
 * 設定。データの持ち出し・取り込みと、指標の限界の開示。
 *
 * 限界の開示をここに置いたうえで、ホームからも到達できるようにしている。
 * スコアだけが独り歩きしないようにするための、この製品に不可欠な情報である。
 */
import { useRef, useState } from 'react';
import { PEI_LIMITATIONS, PEI_ONE_LINER } from '../data/limitations';
import { exportFileName, importFromJson, serializeDataFile } from '../lib/storage';
import { useRecords, useRecordsActions } from '../state/RecordsContext';

export default function SettingsPage() {
  const { entries } = useRecords();
  const { importEntries, clearAll, setNotice } = useRecordsActions();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = (): void => {
    const blob = new Blob([serializeDataFile(entries)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportFileName();
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${entries.length} 件を JSON ファイルとして書き出しました。`);
  };

  const handleImport = async (file: File): Promise<void> => {
    setImportError(null);
    const text = await file.text();
    const result = importFromJson(text);
    if (result.error) {
      setImportError(result.error);
      return;
    }
    if (result.entries.length === 0 && result.skipped === 0) {
      setImportError('取り込める記録が見つかりませんでした。');
      return;
    }
    importEntries(result.entries, result.skipped);
  };

  return (
    <div className="stack">
      <div className="card">
        <h2 className="card__title">データの保存先</h2>
        <p className="small">
          記録はこの端末のブラウザの中だけに保存されます。サーバーには送信されません。
          ブラウザのデータを消すと記録も消えるため、続けて使う場合は
          ときどき書き出しておくことをおすすめします。
        </p>
        <p className="small muted" style={{ marginTop: 8 }}>
          現在の記録：{entries.length} 件
        </p>
      </div>

      <div className="card">
        <h2 className="card__title">書き出し・取り込み</h2>
        <p className="card__lead">
          JSON ファイルとして保存し、別の端末で読み込めます。
          取り込みは既存の記録と統合され、同じ日付の記録は新しい方が残ります。
        </p>
        <div className="button-row">
          <button
            className="button"
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
          >
            JSON で書き出す
          </button>
          <button className="button" type="button" onClick={() => fileInput.current?.click()}>
            JSON を取り込む
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />
        {importError && (
          <p className="note note--warn" style={{ marginTop: 12 }}>
            取り込めませんでした：{importError}
          </p>
        )}
      </div>

      <h2 className="section-heading">この指標の限界</h2>
      <div className="card">
        <p className="small">{PEI_ONE_LINER}</p>
      </div>
      {PEI_LIMITATIONS.map((limitation) => (
        <div className="card" key={limitation.id}>
          <h3 className="card__title">{limitation.title}</h3>
          <p className="small muted">{limitation.body}</p>
        </div>
      ))}

      <div className="card">
        <h2 className="card__title">指標の出典</h2>
        <p className="small">
          Poznansky, F. et al. (2026). The Personalised Ecology Index: A novel measure of an
          individual&apos;s direct sensory interactions with nature. People and Nature, 8,
          2881–2897.{' '}
          <a href="https://doi.org/10.1002/pan3.70389" target="_blank" rel="noreferrer noopener">
            DOI: 10.1002/pan3.70389
          </a>
        </p>
        <p className="small muted" style={{ marginTop: 8 }}>
          算出は論文が正式採用している非加重版（4軸の単純平均）に従っています。
          加重版との相関が高く、加重によって識別力が上がる証拠が得られなかったためです。
        </p>
      </div>

      <div className="card">
        <h2 className="card__title">記録をすべて削除</h2>
        <p className="card__lead">
          この操作は取り消せません。必要なら先に書き出してください。
        </p>
        <div className="button-row">
          <button
            className="button button--danger"
            type="button"
            disabled={entries.length === 0}
            onClick={() => {
              if (window.confirm(`${entries.length} 件の記録をすべて削除します。よろしいですか？`)) {
                clearAll();
              }
            }}
          >
            すべて削除する
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 記録の状態管理。
 *
 * 設計方針
 * --------
 * - ドメイン状態は「記録の配列」ただ一つ。スコア・平均・最低軸・提示する知見は
 *   すべてここからの派生値として算出し、状態として保持しない（二重管理を避ける）。
 * - 永続化は reducer の外側の effect で行い、「state が変わったら書く」という
 *   一方向に限定する。
 * - 読み込み時に壊れた記録があっても全体を捨てず、除外件数を notice として
 *   ユーザーに開示する。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import {
  createId,
  loadEntries,
  mergeEntries,
  saveEntries,
} from '../lib/storage';
import { sortByDateDesc } from '../lib/series';
import type { PeiEntry, PeiEntryInput } from '../types/pei';

export interface RecordsState {
  entries: PeiEntry[];
  /** localStorage からの読み込みが済んだか。 */
  hydrated: boolean;
  /** ユーザーに伝えるべき出来事（保存失敗、取り込み結果など）。 */
  notice: string | null;
}

type Action =
  | { type: 'hydrate'; entries: PeiEntry[]; notice: string | null }
  | { type: 'add'; entry: PeiEntry }
  | { type: 'update'; id: string; input: PeiEntryInput; updatedAt: string }
  | { type: 'remove'; id: string }
  | { type: 'replaceAll'; entries: PeiEntry[]; notice: string | null }
  | { type: 'notice'; notice: string | null };

const initialState: RecordsState = { entries: [], hydrated: false, notice: null };

export function recordsReducer(state: RecordsState, action: Action): RecordsState {
  switch (action.type) {
    case 'hydrate':
      return { entries: action.entries, hydrated: true, notice: action.notice };
    case 'add':
      return { ...state, entries: sortByDateDesc([...state.entries, action.entry]) };
    case 'update':
      // createdAt は最初に記録した時刻なので、更新では引き継ぐ
      return {
        ...state,
        entries: sortByDateDesc(
          state.entries.map((e) =>
            e.id === action.id
              ? { ...action.input, id: e.id, createdAt: e.createdAt, updatedAt: action.updatedAt }
              : e,
          ),
        ),
      };
    case 'remove':
      return { ...state, entries: state.entries.filter((e) => e.id !== action.id) };
    case 'replaceAll':
      return { ...state, entries: sortByDateDesc(action.entries), notice: action.notice };
    case 'notice':
      return { ...state, notice: action.notice };
    default:
      return state;
  }
}

export interface RecordsActions {
  addEntry: (input: PeiEntryInput) => PeiEntry;
  updateEntry: (id: string, input: PeiEntryInput) => void;
  removeEntry: (id: string) => void;
  /** 取り込んだ記録を既存に統合する。 */
  importEntries: (incoming: PeiEntry[], skipped: number) => void;
  /** すべての記録を削除する。 */
  clearAll: () => void;
  setNotice: (notice: string | null) => void;
}

const StateContext = createContext<RecordsState | null>(null);
const ActionsContext = createContext<RecordsActions | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }): ReactNode {
  const [state, dispatch] = useReducer(recordsReducer, initialState);
  // StrictMode の二重実行でも初回読み込みが二度走らないようにする
  const hydratedOnce = useRef(false);
  // 読み込み直後の配列。これと同一のうちは保存し直す必要がない
  const hydratedEntries = useRef<PeiEntry[] | null>(null);

  useEffect(() => {
    if (hydratedOnce.current) return;
    hydratedOnce.current = true;
    const result = loadEntries();
    const messages: string[] = [];
    if (result.error) messages.push(result.error);
    if (result.skipped > 0) {
      messages.push(`形式が正しくない記録を ${result.skipped} 件読み飛ばしました。`);
    }
    hydratedEntries.current = result.entries;
    dispatch({
      type: 'hydrate',
      entries: result.entries,
      notice: messages.length > 0 ? messages.join(' ') : null,
    });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    // 読み込んだ内容をそのまま書き戻さない。無意味な書き込みを避けるだけでなく、
    // 読み込みに失敗した直後に空の配列で既存データを上書きするのを防ぐ。
    // reducer は変更のたびに新しい配列を作るため、参照の同一性で判定できる。
    if (state.entries === hydratedEntries.current) return;
    const error = saveEntries(state.entries);
    if (error) dispatch({ type: 'notice', notice: error });
  }, [state.entries, state.hydrated]);

  const baseActions = useMemo<Omit<RecordsActions, 'importEntries'>>(
    () => ({
      addEntry: (input) => {
        const now = new Date().toISOString();
        const entry: PeiEntry = { ...input, id: createId(), createdAt: now, updatedAt: now };
        dispatch({ type: 'add', entry });
        return entry;
      },
      updateEntry: (id, input) => {
        dispatch({ type: 'update', id, input, updatedAt: new Date().toISOString() });
      },
      removeEntry: (id) => dispatch({ type: 'remove', id }),
      clearAll: () => dispatch({ type: 'replaceAll', entries: [], notice: 'すべての記録を削除しました。' }),
      setNotice: (notice) => dispatch({ type: 'notice', notice }),
    }),
    [],
  );

  // 取り込みは既存の記録との統合が必要なため、state を参照する形で別に定義する
  const importEntries = useCallback(
    (incoming: PeiEntry[], skipped: number) => {
      const merged = mergeEntries(state.entries, incoming);
      const parts = [`${merged.added} 件を追加`, `${merged.updated} 件を更新`];
      if (skipped > 0) parts.push(`${skipped} 件は形式が正しくないため読み飛ばし`);
      dispatch({
        type: 'replaceAll',
        entries: merged.entries,
        notice: `${parts.join('、')}しました。`,
      });
    },
    [state.entries],
  );

  const actions = useMemo<RecordsActions>(
    () => ({ ...baseActions, importEntries }),
    [baseActions, importEntries],
  );

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useRecords(): RecordsState {
  const state = useContext(StateContext);
  if (!state) throw new Error('useRecords は RecordsProvider の内側で使ってください');
  return state;
}

export function useRecordsActions(): RecordsActions {
  const actions = useContext(ActionsContext);
  if (!actions) throw new Error('useRecordsActions は RecordsProvider の内側で使ってください');
  return actions;
}

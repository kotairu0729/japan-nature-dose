/**
 * localStorage への永続化と JSON エクスポート／インポート。
 *
 * 方針：ユーザーの記録は決して黙って失わない。読み込み時に壊れた記録が
 * あっても全体を捨てず、妥当な記録だけを採用し、弾いた件数を呼び出し側に
 * 返して開示できるようにする。
 */
import { validateEntry } from './pei';
import { sortByDateDesc } from './series';
import type { PeiDataFile, PeiEntry } from '../types/pei';

export const STORAGE_KEY = 'japan-nature-dose:entries:v1';
export const SCHEMA_VERSION = 1 as const;

/** 読み込み結果。skipped は形式が不正で取り込めなかった件数。 */
export interface LoadResult {
  entries: PeiEntry[];
  skipped: number;
  /** 読み込み自体が失敗した場合の理由。 */
  error?: string;
}

/** localStorage 互換の最小インターフェース（テストで差し替えるため）。 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    // プライベートブラウジング等でアクセス自体が例外になる場合がある
    return null;
  }
}

/** 保存されたデータを読み込む。壊れた記録は除外して件数を返す。 */
export function loadEntries(storage: StorageLike | null = defaultStorage()): LoadResult {
  if (!storage) return { entries: [], skipped: 0, error: 'この環境ではデータを保存できません' };
  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return { entries: [], skipped: 0, error: '保存データの読み込みに失敗しました' };
  }
  if (raw === null) return { entries: [], skipped: 0 };

  try {
    return parseDataFile(JSON.parse(raw));
  } catch {
    return { entries: [], skipped: 0, error: '保存データを解釈できませんでした' };
  }
}

/** 記録を保存する。失敗した場合は理由の文字列を返す。 */
export function saveEntries(
  entries: readonly PeiEntry[],
  storage: StorageLike | null = defaultStorage(),
): string | null {
  if (!storage) return 'この環境ではデータを保存できません';
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(buildDataFile(entries)));
    return null;
  } catch {
    return 'データの保存に失敗しました（保存容量の上限に達している可能性があります）';
  }
}

/** 保存データを消去する。 */
export function clearEntries(storage: StorageLike | null = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // 消せない場合に呼び出し側でできることは無いので黙って諦める
  }
}

/** エクスポート用のデータファイルを組み立てる。 */
export function buildDataFile(
  entries: readonly PeiEntry[],
  now: Date = new Date(),
): PeiDataFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    entries: sortByDateDesc(entries),
  };
}

/** エクスポート用の整形済み JSON 文字列。 */
export function serializeDataFile(entries: readonly PeiEntry[], now?: Date): string {
  return JSON.stringify(buildDataFile(entries, now), null, 2);
}

/** エクスポートファイル名（例: pei-records-2026-09-04.json）。 */
export function exportFileName(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `pei-records-${y}-${m}-${d}.json`;
}

/**
 * 未知の値をデータファイルとして解釈する。
 * 記録の配列そのもの（旧形式・手書き）も受け付ける。
 */
export function parseDataFile(value: unknown): LoadResult {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'object' && value !== null && Array.isArray((value as PeiDataFile).entries)
      ? (value as PeiDataFile).entries
      : null;

  if (list === null) {
    return { entries: [], skipped: 0, error: '記録の配列が見つかりませんでした' };
  }

  const entries: PeiEntry[] = [];
  let skipped = 0;
  for (const item of list) {
    if (validateEntry(item).length === 0) entries.push(normalizeEntry(item as PeiEntry));
    else skipped += 1;
  }
  return { entries: sortByDateDesc(entries), skipped };
}

/** JSON 文字列を取り込む。 */
export function importFromJson(text: string): LoadResult {
  try {
    return parseDataFile(JSON.parse(text));
  } catch {
    return { entries: [], skipped: 0, error: 'JSON として読み取れませんでした' };
  }
}

/**
 * 既存の記録に取り込んだ記録を統合する。
 * 同一 ID は updatedAt が新しい方を採用し、同一日付の重複は取り込み側を優先する。
 */
export interface MergeResult {
  entries: PeiEntry[];
  added: number;
  updated: number;
}

export function mergeEntries(
  current: readonly PeiEntry[],
  incoming: readonly PeiEntry[],
): MergeResult {
  const byId = new Map(current.map((e) => [e.id, e]));
  const byDate = new Map(current.map((e) => [e.date, e]));
  let added = 0;
  let updated = 0;

  for (const entry of incoming) {
    const sameId = byId.get(entry.id);
    const sameDate = byDate.get(entry.date);
    const existing = sameId ?? sameDate;

    if (!existing) {
      byId.set(entry.id, entry);
      byDate.set(entry.date, entry);
      added += 1;
      continue;
    }
    if (entry.updatedAt >= existing.updatedAt) {
      byId.delete(existing.id);
      byId.set(entry.id, entry);
      byDate.set(entry.date, entry);
      updated += 1;
    }
  }
  return { entries: sortByDateDesc([...byId.values()]), added, updated };
}

/** 想定外のプロパティを落とし、未定義の任意項目を整える。 */
function normalizeEntry(entry: PeiEntry): PeiEntry {
  const { id, date, frequency, duration, spaces, intensity, note, createdAt, updatedAt } = entry;
  const base: PeiEntry = {
    id,
    date,
    frequency,
    duration,
    spaces: [...new Set(spaces)],
    intensity: {
      insects: intensity.insects,
      landscape: intensity.landscape,
      birds: intensity.birds,
      plants: intensity.plants,
    },
    createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
    updatedAt: typeof updatedAt === 'string' ? updatedAt : new Date().toISOString(),
  };
  return typeof note === 'string' && note.length > 0 ? { ...base, note } : base;
}

/** 衝突しにくい ID を作る。crypto が使えない環境ではフォールバックする。 */
export function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // 続けてフォールバックする
  }
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

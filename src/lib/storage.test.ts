import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY,
  buildDataFile,
  clearEntries,
  createId,
  exportFileName,
  importFromJson,
  loadEntries,
  mergeEntries,
  parseDataFile,
  saveEntries,
  serializeDataFile,
  type StorageLike,
} from './storage';
import type { IntensityTarget, PeiEntry } from '../types/pei';

const flat = (v: number): Record<IntensityTarget, number> => ({
  insects: v,
  landscape: v,
  birds: v,
  plants: v,
});

function entry(date: string, over: Partial<PeiEntry> = {}): PeiEntry {
  return {
    id: `id-${date}`,
    date,
    frequency: 4,
    duration: 3,
    spaces: ['urban_park'],
    intensity: flat(2),
    createdAt: `${date}T00:00:00.000Z`,
    updatedAt: `${date}T00:00:00.000Z`,
    ...over,
  };
}

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data: Record<string, string> = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

function throwingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {
      throw new Error('blocked');
    },
  };
}

describe('保存と読み込み', () => {
  it('保存した記録を読み戻せる', () => {
    const store = memoryStorage();
    expect(saveEntries([entry('2026-01-01')], store)).toBeNull();
    const result = loadEntries(store);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.date).toBe('2026-01-01');
    expect(result.skipped).toBe(0);
  });

  it('未保存なら空で返り、エラーにはならない', () => {
    const result = loadEntries(memoryStorage());
    expect(result.entries).toEqual([]);
    expect(result.error).toBeUndefined();
  });

  it('壊れた JSON でも例外を投げず、理由を返す', () => {
    const result = loadEntries(memoryStorage({ [STORAGE_KEY]: '{壊れている' }));
    expect(result.entries).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('storage が使えない環境でも落ちない', () => {
    expect(loadEntries(null).error).toBeTruthy();
    expect(saveEntries([], null)).toBeTruthy();
    expect(loadEntries(throwingStorage()).error).toBeTruthy();
    expect(saveEntries([entry('2026-01-01')], throwingStorage())).toBeTruthy();
    expect(() => clearEntries(throwingStorage())).not.toThrow();
  });

  it('消去できる', () => {
    const store = memoryStorage();
    saveEntries([entry('2026-01-01')], store);
    clearEntries(store);
    expect(loadEntries(store).entries).toEqual([]);
  });
});

describe('parseDataFile', () => {
  it('妥当な記録だけを採用し、弾いた件数を返す', () => {
    const result = parseDataFile({
      schemaVersion: 1,
      exportedAt: '2026-09-04T00:00:00.000Z',
      entries: [entry('2026-01-01'), { ...entry('2026-02-01'), frequency: 99 }, null],
    });
    expect(result.entries).toHaveLength(1);
    expect(result.skipped).toBe(2);
  });

  it('記録の配列そのものも受け付ける', () => {
    const result = parseDataFile([entry('2026-01-01')]);
    expect(result.entries).toHaveLength(1);
  });

  it('配列が見つからなければ理由を返す', () => {
    expect(parseDataFile({ foo: 1 }).error).toBeTruthy();
    expect(parseDataFile(42).error).toBeTruthy();
  });

  it('想定外のプロパティを落とす', () => {
    const result = parseDataFile([{ ...entry('2026-01-01'), evil: '<script>' }]);
    expect(result.entries[0]).not.toHaveProperty('evil');
  });

  it('spaces の重複を取り除く', () => {
    const result = parseDataFile([entry('2026-01-01', { spaces: ['forest', 'forest', 'coast'] })]);
    expect(result.entries[0]?.spaces).toEqual(['forest', 'coast']);
  });

  it('空文字のメモは保持しない', () => {
    const result = parseDataFile([entry('2026-01-01', { note: '' })]);
    expect(result.entries[0]).not.toHaveProperty('note');
  });
});

describe('エクスポート', () => {
  it('スキーマバージョンと日時を含む', () => {
    const file = buildDataFile([entry('2026-01-01')], new Date('2026-09-04T12:00:00.000Z'));
    expect(file.schemaVersion).toBe(1);
    expect(file.exportedAt).toBe('2026-09-04T12:00:00.000Z');
  });

  it('エクスポートしたものをそのまま読み戻せる（往復可能）', () => {
    const entries = [entry('2026-01-01'), entry('2026-02-01', { note: '桜' })];
    const round = importFromJson(serializeDataFile(entries));
    expect(round.skipped).toBe(0);
    expect(round.entries.map((e) => e.date).sort()).toEqual(['2026-01-01', '2026-02-01']);
    expect(round.entries.find((e) => e.date === '2026-02-01')?.note).toBe('桜');
  });

  it('ファイル名に日付が入る', () => {
    expect(exportFileName(new Date(2026, 8, 4))).toBe('pei-records-2026-09-04.json');
  });

  it('JSON でない文字列は理由を返す', () => {
    expect(importFromJson('これはJSONではない').error).toBeTruthy();
  });
});

describe('mergeEntries', () => {
  it('新しい記録を追加する', () => {
    const result = mergeEntries([entry('2026-01-01')], [entry('2026-02-01')]);
    expect(result.entries).toHaveLength(2);
    expect(result.added).toBe(1);
    expect(result.updated).toBe(0);
  });

  it('同じ ID なら updatedAt が新しい方を採用する', () => {
    const older = entry('2026-01-01', { frequency: 1, updatedAt: '2026-01-01T00:00:00.000Z' });
    const newer = entry('2026-01-01', { frequency: 7, updatedAt: '2026-06-01T00:00:00.000Z' });
    const result = mergeEntries([older], [newer]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.frequency).toBe(7);
    expect(result.updated).toBe(1);
  });

  it('取り込み側が古ければ既存を残す', () => {
    const current = entry('2026-01-01', { frequency: 7, updatedAt: '2026-06-01T00:00:00.000Z' });
    const incoming = entry('2026-01-01', { frequency: 1, updatedAt: '2026-01-01T00:00:00.000Z' });
    const result = mergeEntries([current], [incoming]);
    expect(result.entries[0]?.frequency).toBe(7);
    expect(result.updated).toBe(0);
  });

  it('ID が違っても同じ日付なら重複させない', () => {
    const current = entry('2026-01-01', { id: 'a' });
    const incoming = entry('2026-01-01', { id: 'b', updatedAt: '2026-06-01T00:00:00.000Z' });
    const result = mergeEntries([current], [incoming]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.id).toBe('b');
  });

  it('既存が空でも動く', () => {
    expect(mergeEntries([], [entry('2026-01-01')]).added).toBe(1);
  });
});

describe('createId', () => {
  it('毎回異なる ID を返す', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createId()));
    expect(ids.size).toBe(200);
  });
});

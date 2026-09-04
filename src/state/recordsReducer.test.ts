import { describe, expect, it } from 'vitest';
import { recordsReducer, type RecordsState } from './RecordsContext';
import type { IntensityTarget, PeiEntry, PeiEntryInput } from '../types/pei';

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
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const input: PeiEntryInput = {
  date: '2026-03-01',
  frequency: 7,
  duration: 5,
  spaces: ['forest'],
  intensity: flat(4),
};

const state = (entries: PeiEntry[]): RecordsState => ({
  entries,
  hydrated: true,
  notice: null,
});

describe('recordsReducer', () => {
  it('hydrate で読み込み済みになる', () => {
    const next = recordsReducer(
      { entries: [], hydrated: false, notice: null },
      { type: 'hydrate', entries: [entry('2026-01-01')], notice: null },
    );
    expect(next.hydrated).toBe(true);
    expect(next.entries).toHaveLength(1);
  });

  it('add は日付の新しい順を保つ', () => {
    const next = recordsReducer(state([entry('2026-01-01')]), {
      type: 'add',
      entry: entry('2026-05-01'),
    });
    expect(next.entries.map((e) => e.date)).toEqual(['2026-05-01', '2026-01-01']);
  });

  it('update は createdAt を引き継ぎ、updatedAt だけを進める', () => {
    const original = entry('2026-01-01', { createdAt: '2025-12-24T09:00:00.000Z' });
    const next = recordsReducer(state([original]), {
      type: 'update',
      id: original.id,
      input,
      updatedAt: '2026-06-01T10:00:00.000Z',
    });
    const updated = next.entries[0];
    expect(updated?.createdAt).toBe('2025-12-24T09:00:00.000Z');
    expect(updated?.updatedAt).toBe('2026-06-01T10:00:00.000Z');
    expect(updated?.frequency).toBe(7);
    expect(updated?.date).toBe('2026-03-01');
    expect(updated?.id).toBe(original.id);
  });

  it('update は対象外の記録に触れない', () => {
    const other = entry('2026-02-01', { id: 'other' });
    const next = recordsReducer(state([entry('2026-01-01'), other]), {
      type: 'update',
      id: 'id-2026-01-01',
      input,
      updatedAt: '2026-06-01T10:00:00.000Z',
    });
    expect(next.entries.find((e) => e.id === 'other')).toEqual(other);
  });

  it('存在しない ID の update は何も変えない', () => {
    const before = state([entry('2026-01-01')]);
    const next = recordsReducer(before, {
      type: 'update',
      id: 'missing',
      input,
      updatedAt: '2026-06-01T10:00:00.000Z',
    });
    expect(next.entries).toEqual(before.entries);
  });

  it('remove は該当の記録だけを消す', () => {
    const next = recordsReducer(state([entry('2026-01-01'), entry('2026-02-01')]), {
      type: 'remove',
      id: 'id-2026-01-01',
    });
    expect(next.entries.map((e) => e.id)).toEqual(['id-2026-02-01']);
  });

  it('replaceAll は並べ替えたうえで通知を差し替える', () => {
    const next = recordsReducer(state([]), {
      type: 'replaceAll',
      entries: [entry('2026-01-01'), entry('2026-06-01')],
      notice: '取り込みました',
    });
    expect(next.entries.map((e) => e.date)).toEqual(['2026-06-01', '2026-01-01']);
    expect(next.notice).toBe('取り込みました');
  });

  it('notice は記録に影響しない', () => {
    const entries = [entry('2026-01-01')];
    const next = recordsReducer(state(entries), { type: 'notice', notice: '保存に失敗' });
    expect(next.entries).toBe(entries);
    expect(next.notice).toBe('保存に失敗');
  });
});

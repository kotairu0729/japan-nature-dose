/**
 * 記録の入力フォーム。
 *
 * 3分以内に終えられることを設計の制約とし、
 * - 4軸すべてを1画面に置いて画面遷移をなくす
 * - 数値入力は日付とメモ以外すべてタップだけで完結させる
 * - 未入力があっても「あと何が残っているか」をその場に出す
 * ようにしている。
 */
import { useMemo, useState } from 'react';
import {
  DIVERSITY_QUESTION,
  DURATION_OPTIONS,
  DURATION_QUESTION,
  FREQUENCY_OPTIONS,
  FREQUENCY_QUESTION,
  INTENSITY_OPTIONS,
  INTENSITY_QUESTION,
  INTENSITY_TARGETS,
  RECALL_PERIOD,
  SPACE_TYPES,
} from '../data/scale';
import { computeScore, formatScore } from '../lib/pei';
import { todayString } from '../lib/series';
import type {
  IntensityTarget,
  PeiEntry,
  PeiEntryInput,
  SpaceTypeId,
} from '../types/pei';
import AxisBars from './AxisBars';

interface Props {
  /** 編集時の初期値。新規作成では省略する。 */
  initial?: PeiEntry;
  onSubmit: (input: PeiEntryInput) => void;
  onCancel?: (() => void) | undefined;
  /** すでに記録がある日付。同じ日の二重記録に気づけるようにする。 */
  existingDates?: readonly string[];
}

type IntensityState = Record<IntensityTarget, number | null>;

const EMPTY_INTENSITY: IntensityState = {
  insects: null,
  landscape: null,
  birds: null,
  plants: null,
};

export default function RecordForm({
  initial,
  onSubmit,
  onCancel,
  existingDates = [],
}: Props) {
  const [date, setDate] = useState(initial?.date ?? todayString());
  const [frequency, setFrequency] = useState<number | null>(initial?.frequency ?? null);
  const [duration, setDuration] = useState<number | null>(initial?.duration ?? null);
  const [spaces, setSpaces] = useState<SpaceTypeId[]>(initial ? [...initial.spaces] : []);
  const [intensity, setIntensity] = useState<IntensityState>(
    initial ? { ...initial.intensity } : EMPTY_INTENSITY,
  );
  const [note, setNote] = useState(initial?.note ?? '');

  const missing = useMemo(() => {
    const list: string[] = [];
    if (frequency === null) list.push('頻度');
    if (duration === null) list.push('滞在時間');
    if (INTENSITY_TARGETS.some((t) => intensity[t.id] === null)) list.push('注意の強度');
    return list;
  }, [frequency, duration, intensity]);

  // 未入力の項目は 0 として仮のスコアを出す。入力の途中でも変化が見えるようにするため。
  const preview = useMemo(
    () =>
      computeScore({
        frequency: frequency ?? 0,
        duration: duration ?? 0,
        spaces,
        intensity: {
          insects: intensity.insects ?? 0,
          landscape: intensity.landscape ?? 0,
          birds: intensity.birds ?? 0,
          plants: intensity.plants ?? 0,
        },
      }),
    [frequency, duration, spaces, intensity],
  );

  const duplicateDate =
    date !== initial?.date && existingDates.includes(date) ? date : null;

  const toggleSpace = (id: SpaceTypeId): void => {
    setSpaces((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (missing.length > 0 || frequency === null || duration === null) return;
    const trimmed = note.trim();
    const base: PeiEntryInput = {
      date,
      frequency,
      duration,
      spaces,
      intensity: {
        insects: intensity.insects ?? 0,
        landscape: intensity.landscape ?? 0,
        birds: intensity.birds ?? 0,
        plants: intensity.plants ?? 0,
      },
    };
    onSubmit(trimmed.length > 0 ? { ...base, note: trimmed } : base);
  };

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="card">
        <p className="small muted">
          すべての設問は<strong>{RECALL_PERIOD}</strong>を振り返って答えます。
          正確でなくてかまいません。思い出せる範囲で選んでください。
        </p>
      </div>

      <div className="card">
        <label className="field__legend" htmlFor="entry-date">
          記録する日
        </label>
        <p className="field__question">週に1回程度の記録を想定しています。</p>
        <input
          id="entry-date"
          className="input"
          type="date"
          value={date}
          max={todayString()}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        {duplicateDate && (
          <p className="note note--warn" style={{ marginTop: 10 }}>
            {duplicateDate} にはすでに記録があります。このまま保存すると、同じ日に2件並びます。
          </p>
        )}
      </div>

      {/* ── 1. Frequency ── */}
      <fieldset className="field card">
        <legend className="field__legend">1. 頻度</legend>
        <p className="field__question">{FREQUENCY_QUESTION}</p>
        <div className="choice-list">
          {FREQUENCY_OPTIONS.map((option) => (
            <label className="choice" key={option.value}>
              <input
                type="radio"
                name="frequency"
                value={option.value}
                checked={frequency === option.value}
                onChange={() => setFrequency(option.value)}
              />
              <span className="choice__body">
                <span className="choice__label">{option.label}</span>
                {option.hint && <span className="choice__hint">{option.hint}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── 2. Duration ── */}
      <fieldset className="field card">
        <legend className="field__legend">2. 滞在時間</legend>
        <p className="field__question">{DURATION_QUESTION}</p>
        <div className="choice-list">
          {DURATION_OPTIONS.map((option) => (
            <label className="choice" key={option.value}>
              <input
                type="radio"
                name="duration"
                value={option.value}
                checked={duration === option.value}
                onChange={() => setDuration(option.value)}
              />
              <span className="choice__body">
                <span className="choice__label">{option.label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── 3. Diversity ── */}
      <fieldset className="field card">
        <legend className="field__legend">3. 多様性</legend>
        <p className="field__question">
          {DIVERSITY_QUESTION}（あてはまるものをすべて / 0個でもかまいません）
        </p>
        <div className="choice-list choice-list--grid">
          {SPACE_TYPES.map((space) => (
            <label className="choice" key={space.id}>
              <input
                type="checkbox"
                checked={spaces.includes(space.id)}
                onChange={() => toggleSpace(space.id)}
              />
              <span className="choice__body">
                <span className="choice__label">{space.label}</span>
                <span className="choice__hint">{space.examples}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          選択中：{spaces.length} / {SPACE_TYPES.length} 種類
        </p>
      </fieldset>

      {/* ── 4. Intensity ── */}
      <fieldset className="field card">
        <legend className="field__legend">4. 注意の強度</legend>
        <p className="field__question">{INTENSITY_QUESTION}</p>
        {INTENSITY_TARGETS.map((target) => (
          <div className="scale-row" key={target.id}>
            <span className="scale-row__label">{target.label}</span>
            <div className="scale-row__options" role="radiogroup" aria-label={target.label}>
              {[...INTENSITY_OPTIONS]
                .sort((a, b) => a.value - b.value)
                .map((option) => (
                  <label className="scale-chip" key={option.value}>
                    <input
                      type="radio"
                      name={`intensity-${target.id}`}
                      value={option.value}
                      checked={intensity[target.id] === option.value}
                      onChange={() =>
                        setIntensity((current) => ({ ...current, [target.id]: option.value }))
                      }
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="card">
        <label className="field__legend" htmlFor="entry-note">
          メモ（任意）
        </label>
        <p className="field__question">
          場所や気づいたこと。スコアには影響しません。
        </p>
        <textarea
          id="entry-note"
          className="input textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="用水路沿いでカワセミを見た、など"
          maxLength={500}
        />
      </div>

      <div className="form-footer">
        <div className="score-hero">
          <span className="score-hero__value">{formatScore(preview.pei)}</span>
          <span className="score-hero__unit">
            {missing.length > 0 ? '入力中の暫定値（0〜1）' : 'この記録の PEI（0〜1）'}
          </span>
        </div>
        <AxisBars axes={preview} compact />
        {missing.length > 0 && (
          <p className="small muted">未入力：{missing.join('、')}</p>
        )}
        <div className="button-row">
          <button className="button button--primary" type="submit" disabled={missing.length > 0}>
            {initial ? 'この記録を更新' : '記録を保存'}
          </button>
          {onCancel && (
            <button className="button button--quiet" type="button" onClick={onCancel}>
              キャンセル
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

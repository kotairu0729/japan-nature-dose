/**
 * PEI（Personalised Ecology Index）の型定義。
 *
 * 出典：Poznansky, F. et al. (2026) "The Personalised Ecology Index: A novel
 * measure of an individual's direct sensory interactions with nature",
 * People and Nature, 8, 2881-2897. DOI: 10.1002/pan3.70389
 *
 * このファイルは他のいかなるモジュールにも依存しない。
 */

/** PEI を構成する 4 軸。 */
export type AxisKey = 'frequency' | 'duration' | 'diversity' | 'intensity';

/** intensity 軸で注意の対象となる 4 項目。 */
export type IntensityTarget = 'insects' | 'landscape' | 'birds' | 'plants';

/**
 * diversity 軸の屋外空間タイプ。
 * 論文の英国緑地分類を日本の文脈に適応させたもの（適応は暫定的である旨を
 * アプリ内で開示すること）。
 */
export type SpaceTypeId =
  | 'urban_park'
  | 'garden_heritage'
  | 'allotment'
  | 'forest'
  | 'freshwater'
  | 'mountain'
  | 'coast'
  | 'reserve'
  | 'farmland'
  | 'home_green';

/** 選択式設問の 1 選択肢。value は論文の配点。 */
export interface ScaleOption<T extends number = number> {
  value: T;
  label: string;
  /** 選択肢の意味を補う短い説明（任意）。 */
  hint?: string;
}

/** 1 回分の記録（週次記録を基本とする）。 */
export interface PeiEntry {
  /** 一意な ID。 */
  id: string;
  /** 記録対象日。ローカル日付の YYYY-MM-DD。 */
  date: string;
  /** 頻度の配点 0〜7。 */
  frequency: number;
  /** 滞在時間の配点 1〜7（論文の尺度に 0 は存在しない）。 */
  duration: number;
  /** 訪れた空間タイプ（重複なし、最大 10）。 */
  spaces: SpaceTypeId[];
  /** 注意の強度。各項目 0〜4。 */
  intensity: Record<IntensityTarget, number>;
  /** 自由記述のメモ（任意）。スコアには影響しない。 */
  note?: string;
  /** ISO 8601。 */
  createdAt: string;
  /** ISO 8601。 */
  updatedAt: string;
}

/** 新規作成時に ID・タイムスタンプを除いた入力値。 */
export type PeiEntryInput = Omit<PeiEntry, 'id' | 'createdAt' | 'updatedAt'>;

/** 4 軸の正規化値（各 0〜1）と、その単純平均である PEI。 */
export interface PeiScore {
  frequency: number;
  duration: number;
  diversity: number;
  intensity: number;
  /** (frequency + duration + diversity + intensity) / 4 */
  pei: number;
}

/** 軸ごとの値だけを持つ型（PEI 総合値を含まない）。 */
export type AxisValues = Record<AxisKey, number>;

/** 検証結果。 */
export interface ValidationIssue {
  field: keyof PeiEntry | 'entry';
  message: string;
}

/** 永続化されるアプリ全体のデータ。 */
export interface PeiDataFile {
  /** データ形式のバージョン。移行処理の判定に使う。 */
  schemaVersion: 1;
  /** エクスポート日時（ISO 8601）。 */
  exportedAt: string;
  entries: PeiEntry[];
}

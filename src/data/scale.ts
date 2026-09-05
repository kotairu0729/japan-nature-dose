/**
 * PEI 4 軸の設問文・選択肢・配点。
 *
 * 出典：Poznansky, F. et al. (2026), People and Nature, 8, 2881-2897.
 * DOI: 10.1002/pan3.70389
 *
 * 選択肢と配点は論文の尺度に忠実に実装している。diversity 軸の空間分類のみ、
 * 英国の緑地分類を日本の文脈に読み替えている（暫定的な適応であることを
 * アプリ内で開示する）。
 */
import type {
  IntensityTarget,
  ScaleOption,
  SpaceTypeId,
} from '../types/pei';

/** 想起期間。すべての設問に共通。 */
export const RECALL_PERIOD = '過去1ヶ月間';

/** frequency 軸：配点の最大値。正規化はこの値で除する。 */
export const FREQUENCY_MAX = 7;
/** duration 軸：配点の最大値。 */
export const DURATION_MAX = 7;
/** diversity 軸：空間タイプの総数。 */
export const DIVERSITY_MAX = 10;
/** intensity 軸：各項目の配点の最大値。 */
export const INTENSITY_ITEM_MAX = 4;

export const FREQUENCY_QUESTION =
  '過去1ヶ月間、平均してどのくらいの頻度で緑地・自然空間で自由時間を過ごしましたか？';

/** 降順（高い配点が先頭）。UI もこの順で表示する。 */
export const FREQUENCY_OPTIONS: readonly ScaleOption[] = [
  { value: 7, label: '毎日' },
  { value: 6, label: '週2回より多い', hint: '毎日ではない' },
  { value: 5, label: '週2回' },
  { value: 4, label: '週1回' },
  { value: 3, label: '月1〜2回' },
  { value: 2, label: '2〜3ヶ月に1回' },
  { value: 1, label: 'それ以下' },
  { value: 0, label: '一度もない' },
] as const;

export const DURATION_QUESTION =
  '過去1ヶ月間、緑地・自然空間で過ごした最も長い一回の時間はどのくらいでしたか？';

export const DURATION_OPTIONS: readonly ScaleOption[] = [
  { value: 7, label: '8時間より長い' },
  { value: 6, label: '6〜8時間' },
  { value: 5, label: '4〜6時間' },
  { value: 4, label: '2〜4時間' },
  { value: 3, label: '1〜2時間' },
  { value: 2, label: '30分〜1時間' },
  { value: 1, label: '30分以下' },
] as const;

export const DIVERSITY_QUESTION =
  '過去1ヶ月間、以下のうちどのタイプの屋外空間で自由時間を過ごしましたか？';

export interface SpaceType {
  id: SpaceTypeId;
  label: string;
  /** 身近な例。心理的な敷居を下げるために添える。 */
  examples: string;
}

export const SPACE_TYPES: readonly SpaceType[] = [
  { id: 'urban_park', label: '都市公園・広場・運動場', examples: '近所の児童公園、駅前広場、河川敷グラウンド' },
  { id: 'garden_heritage', label: '庭園・史跡・大規模公園', examples: '日本庭園、城址公園、都市の大規模公園' },
  { id: 'allotment', label: '市民農園・コミュニティガーデン・家庭菜園', examples: '貸し農園、地域の花壇' },
  { id: 'forest', label: '森林・雑木林', examples: '鎮守の森、平地林、林道' },
  { id: 'freshwater', label: '川・湖・用水路・河川敷', examples: '街中の水路、ため池、湖畔' },
  { id: 'mountain', label: '山・丘陵地', examples: '低山、丘陵の遊歩道' },
  { id: 'coast', label: '海岸・砂浜', examples: '砂浜、防波堤、磯' },
  { id: 'reserve', label: '自然保護区・野鳥観察地', examples: '自然観察公園、干潟、ビオトープ' },
  { id: 'farmland', label: '田畑・里山・農村景観', examples: '田んぼ道、果樹園、里山の集落' },
  { id: 'home_green', label: '自宅の庭・ベランダ・室内の植物', examples: 'プランター、鉢植え、庭木' },
] as const;

export const INTENSITY_QUESTION =
  '緑地・自然空間にいるとき、以下にどのくらい注意を払っていますか？';

export const INTENSITY_TARGETS: readonly { id: IntensityTarget; label: string }[] = [
  { id: 'insects', label: '昆虫' },
  { id: 'landscape', label: '景観' },
  { id: 'birds', label: '鳥' },
  { id: 'plants', label: '植物' },
] as const;

export const INTENSITY_OPTIONS: readonly ScaleOption[] = [
  { value: 4, label: 'とても注意を払う' },
  { value: 3, label: 'かなり払う' },
  { value: 2, label: 'ある程度払う' },
  { value: 1, label: '少し払う' },
  { value: 0, label: '全く払わない' },
] as const;

/** 軸の日本語表示名と 1 行の説明。 */
export const AXIS_META = {
  frequency: { label: '頻度', short: '頻度', description: '自然空間で自由時間を過ごした頻度' },
  duration: { label: '滞在時間', short: '時間', description: '一回あたりの最長滞在時間' },
  diversity: { label: '多様性', short: '多様性', description: '訪れた空間タイプの幅' },
  intensity: { label: '注意の強度', short: '注意', description: '生きものや景観に向ける注意の深さ' },
} as const;

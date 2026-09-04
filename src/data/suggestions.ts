/**
 * 行動提案のカタログ。
 *
 * 選定の方針
 * ----------
 * - 無料、または極めて低コストであること。
 * - 通勤・買い物・昼休みなど、すでに存在する移動や時間の中で実行できること。
 *   自然体験を「特別な余暇活動」ではなく日常の一部として捉え直すため、
 *   休日の遠出を前提とする提案は最小限にとどめる。
 * - 義務や達成を課す言い方をしない。「〜しましょう」ではなく、
 *   試せる小さな選択肢として示す。
 */
import type { AxisKey } from '../types/pei';

/** 提案を実行できる場面。 */
export type SuggestionContext = 'commute' | 'errand' | 'break' | 'home' | 'weekend';

export const CONTEXT_LABEL: Record<SuggestionContext, string> = {
  commute: '通勤・通学の途中で',
  errand: '買い物・用事のついでに',
  break: '休憩時間に',
  home: '家にいるまま',
  weekend: '休みの日に',
};

export interface Suggestion {
  id: string;
  /** この提案が主に効く軸。 */
  axis: AxisKey;
  /** 短い行動そのもの。 */
  title: string;
  /** 補足。なぜそれで足りるのか、どう始めるか。 */
  detail: string;
  context: SuggestionContext;
  /** 追加でかかる費用。 */
  cost: 'free' | 'low';
  /** 追加で必要になる時間の目安（分）。0 は既存の移動の中で完結する。 */
  extraMinutes: number;
}

export const SUGGESTIONS: readonly Suggestion[] = [
  // ── frequency：回数を増やす（1回を長くしなくてよい） ──
  {
    id: 'freq-detour-green',
    axis: 'frequency',
    title: '帰り道を、一本だけ緑のある道に変えてみる',
    detail:
      '距離が同じか少し長いだけの並行した道を一本選び、そちらを通ります。回数を増やすのに、新しい予定を作る必要はありません。',
    context: 'errand',
    cost: 'free',
    extraMinutes: 0,
  },
  {
    id: 'freq-five-minutes-outside',
    axis: 'frequency',
    title: '昼休みの最初の5分だけ、建物の外に出る',
    detail:
      '食事の前に外に出て、座れる場所があれば座ります。5分でも「外に出た日」は1日として積み上がります。',
    context: 'break',
    cost: 'free',
    extraMinutes: 5,
  },
  {
    id: 'freq-one-stop-early',
    axis: 'frequency',
    title: '週に一度だけ、一つ手前の駅やバス停で降りる',
    detail:
      '毎回でなくてかまいません。曜日を一つ決めておくと、判断のたびに迷わずに済みます。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 10,
  },
  {
    id: 'freq-doorstep-plant',
    axis: 'frequency',
    title: 'ゴミ出しや郵便受けのついでに、家の前の植物を一つ見る',
    detail:
      '外出とは呼べないくらいの時間で終わります。街路樹でも、駐車場の隅の草でもかまいません。',
    context: 'home',
    cost: 'free',
    extraMinutes: 1,
  },
  {
    id: 'freq-platform-sky',
    axis: 'frequency',
    title: '電車を待つ場所を、空が見える端に変える',
    detail:
      'ホームの位置を変えるだけです。待ち時間はもともとあるので、新しく時間を作る必要がありません。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 0,
  },

  // ── duration：1回の滞在を少し長くする ──
  {
    id: 'dur-bench-ten',
    axis: 'duration',
    title: '公園のベンチに10分だけ座る（バスを1本見送る）',
    detail:
      '次のバスまでの待ち時間を、屋内ではなく屋外で過ごすという置き換えです。新しく確保する時間はほとんどありません。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 10,
  },
  {
    id: 'dur-lap-before-shopping',
    axis: 'duration',
    title: '買い物の前に、店の近くの緑地を一周する',
    detail:
      '目的地に着いてから店に入るまでの間に、ひと回りだけ挟みます。20分ほどの滞在は、研究でよく扱われる長さの目安の一つです。',
    context: 'errand',
    cost: 'free',
    extraMinutes: 15,
  },
  {
    id: 'dur-walk-and-call',
    axis: 'duration',
    title: '電話をかけるとき、屋外を歩きながら話す',
    detail:
      '通話の長さがそのまま滞在時間になります。屋内でしていたことを外に移すだけで、予定は増えません。',
    context: 'break',
    cost: 'free',
    extraMinutes: 0,
  },
  {
    id: 'dur-outdoor-lunch',
    axis: 'duration',
    title: '昼食を屋外のベンチで食べる',
    detail:
      '天気の良い日だけで十分です。食事の時間はもともとあるので、滞在時間だけが増えます。',
    context: 'break',
    cost: 'free',
    extraMinutes: 0,
  },
  {
    id: 'dur-long-way-once',
    axis: 'duration',
    title: '月に一度、20分の遠回りをする日を決める',
    detail:
      '行き先を決める必要はありません。川沿いや線路沿いなど、続いている道を選ぶと迷わずに歩けます。',
    context: 'weekend',
    cost: 'free',
    extraMinutes: 20,
  },

  // ── diversity：場所の種類を増やす ──
  {
    id: 'div-back-street',
    axis: 'diversity',
    title: 'いつもの道の一本裏、水路や川沿いの道を通ってみる',
    detail:
      '都市部でも、用水路や暗渠沿いの細い道は意外に残っています。「川・用水路」は公園とは別の種類として数えられます。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 5,
  },
  {
    id: 'div-shrine-grove',
    axis: 'diversity',
    title: '神社やお寺の境内を通り抜ける',
    detail:
      '社寺林は都市の中に残った古い樹木のまとまりであることが多く、公園とは違う植生に出会えます。参拝しなくても通り抜けるだけで十分です。',
    context: 'errand',
    cost: 'free',
    extraMinutes: 5,
  },
  {
    id: 'div-one-planter',
    axis: 'diversity',
    title: 'ベランダか窓辺に、鉢をひとつ置く',
    detail:
      '種や苗は数百円で手に入ります。「自宅の庭・ベランダ・室内の植物」も、多様性の軸では独立した一種類として数えます。',
    context: 'home',
    cost: 'low',
    extraMinutes: 0,
  },
  {
    id: 'div-map-scan',
    axis: 'diversity',
    title: '地図アプリで家から2km以内の緑を探し、まだ行っていない場所を一つ選ぶ',
    detail:
      '行くのは後日でかまいません。探すこと自体が数分で終わり、選択肢が可視化されます。',
    context: 'home',
    cost: 'free',
    extraMinutes: 5,
  },
  {
    id: 'div-different-station',
    axis: 'diversity',
    title: '最寄りではない駅・バス停まで歩いてみる',
    detail:
      '通り道が変わると、通る空間の種類も変わります。丘の斜面や農地の縁が残っている経路が見つかることがあります。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 10,
  },

  // ── intensity：注意の向け方を変える ──
  {
    id: 'int-count-birds',
    axis: 'intensity',
    title: '次に外に出たとき、1分だけ立ち止まって鳥の声を数える',
    detail:
      '種類が分からなくてかまいません。「何種類か違う声がした」と気づくだけで十分です。場所を変える必要はありません。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 1,
  },
  {
    id: 'int-same-tree',
    axis: 'intensity',
    title: '通り道の木を一本決めて、毎週その変化を一つ見つける',
    detail:
      '葉の色、芽、落ちているもの。同じ対象を繰り返し見ると、季節の動きが自分の記録として残ります。',
    context: 'commute',
    cost: 'free',
    extraMinutes: 1,
  },
  {
    id: 'int-look-down',
    axis: 'intensity',
    title: '足元だけを見て10歩あるく',
    detail:
      '舗装の割れ目のコケ、街路樹の根元の草。昆虫や植物は、視線の高さを変えるだけで見えるものが変わります。',
    context: 'errand',
    cost: 'free',
    extraMinutes: 1,
  },
  {
    id: 'int-photograph-unknown',
    axis: 'intensity',
    title: '名前を知らない植物を1つ、写真に撮る',
    detail:
      '名前を調べなくてもかまいません。撮るために近づくこと自体が、注意を向ける行為になります。',
    context: 'errand',
    cost: 'free',
    extraMinutes: 1,
  },
  {
    id: 'int-sky-once',
    axis: 'intensity',
    title: '1日に一度、空の色を見る時間を決める',
    detail:
      '景観への注意は、遠くに出かけなくても向けられます。同じ時刻に見ると、日ごとの違いのほうが目に入るようになります。',
    context: 'break',
    cost: 'free',
    extraMinutes: 1,
  },
] as const;

/** 記録がまだ無い人に向けた、軸に依存しない導入。 */
export const FIRST_STEP_SUGGESTION: Suggestion = {
  id: 'first-step',
  axis: 'frequency',
  title: 'まず、この1ヶ月を思い出して1回記録してみる',
  detail:
    '正確でなくてかまいません。最初の1件は、あとから推移を見るための基準点になります。3分ほどで終わります。',
  context: 'home',
  cost: 'free',
  extraMinutes: 3,
};

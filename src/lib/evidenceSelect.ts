/**
 * ユーザーの状態に応じた知見の選択。純関数のみ。
 *
 * 選択の原則
 * ----------
 * - 「あなたのスコアが◯◯だから、この効果がある」という提示は行わない。
 *   選ぶのはあくまで「いま関心を持ちやすい話題」であって、個人への当てはめではない。
 * - 領域が偏らないようにする。用量反応の話ばかりが並ぶと、
 *   自然体験が「摂取すべき量」として道具的に読まれてしまう。
 * - 乱数を使わず、同じ入力には同じ結果を返す。
 */
import { EVIDENCE, type Evidence, type EvidenceDomain } from '../data/evidence';
import type { AxisKey, AxisValues } from '../types/pei';
import { lowestAxis } from './pei';

/** 領域で絞り込む。null なら全件。 */
export function filterByDomain(domain: EvidenceDomain | null): Evidence[] {
  return domain === null ? [...EVIDENCE] : EVIDENCE.filter((e) => e.domain === domain);
}

/** 指定の軸に紐づく知見。 */
export function evidenceForAxis(axis: AxisKey): Evidence[] {
  return EVIDENCE.filter((e) => e.triggerAxis === axis);
}

/** 提示する知見と、なぜそれが選ばれたかの説明。 */
export interface EvidencePick {
  evidence: Evidence;
  /** 選択理由。UI にそのまま表示できる中立的な言い回し。 */
  reason: string;
}

/**
 * 記録の状態にもとづいて知見を選ぶ。
 *
 * @param axes 4軸の値。記録が無い場合は null。
 * @param count 返す件数。
 * @param rotation 表示が固定されないようにずらす値（記録件数など）。
 */
export function selectEvidence(
  axes: AxisValues | null,
  count = 3,
  rotation = 0,
): EvidencePick[] {
  const picks: EvidencePick[] = [];
  const used = new Set<string>();
  const usedDomains = new Set<EvidenceDomain>();

  const push = (evidence: Evidence | undefined, reason: string): void => {
    if (!evidence || used.has(evidence.id)) return;
    used.add(evidence.id);
    usedDomains.add(evidence.domain);
    picks.push({ evidence, reason });
  };

  /**
   * 候補の中から1件選ぶ。まだ使っていない領域のものを優先し、
   * 見つからなければ領域の重複を許す。領域が偏ると、自然体験が
   * 特定の効能の話に閉じてしまうため。
   */
  const pickOne = (candidates: Evidence[], reason: string): void => {
    if (candidates.length === 0) return;
    const offset = ((rotation % candidates.length) + candidates.length) % candidates.length;
    const ordered = [...candidates.slice(offset), ...candidates.slice(0, offset)];
    const fresh = ordered.find((e) => !used.has(e.id) && !usedDomains.has(e.domain));
    push(fresh ?? ordered.find((e) => !used.has(e.id)), reason);
  };

  if (axes) {
    // 1. いま最も低い軸に関係する知見を1件。
    //    「低いから問題だ」ではなく「この軸に関係する研究がある」という提示にとどめる。
    const axis = lowestAxis(axes);
    pickOne(evidenceForAxis(axis), `いま最も低い「${AXIS_LABEL[axis]}」の軸に関係する研究です`);

    // 2. 最も高い軸に関係する知見も1件。低い側だけを見せると、
    //    できていないことばかりが強調されてしまうため。
    const highest = highestAxisKey(axes);
    if (highest !== axis) {
      pickOne(
        evidenceForAxis(highest),
        `続けている「${AXIS_LABEL[highest]}」の軸に関係する研究です`,
      );
    }
  }

  // 3. 残りは領域が重ならないように、順に埋める。
  const rest = [...EVIDENCE];
  const start = rest.length > 0 ? ((rotation % rest.length) + rest.length) % rest.length : 0;
  const ordered = [...rest.slice(start), ...rest.slice(0, start)];

  for (const evidence of ordered) {
    if (picks.length >= count) break;
    if (used.has(evidence.id) || usedDomains.has(evidence.domain)) continue;
    push(evidence, '自然との関わりをめぐる研究から');
  }
  // 領域の重複を避けきれない場合は、重複を許して件数を満たす。
  for (const evidence of ordered) {
    if (picks.length >= count) break;
    push(evidence, '自然との関わりをめぐる研究から');
  }

  return picks.slice(0, Math.max(0, count));
}

const AXIS_LABEL: Record<AxisKey, string> = {
  frequency: '頻度',
  duration: '滞在時間',
  diversity: '多様性',
  intensity: '注意の強度',
};

function highestAxisKey(axes: AxisValues): AxisKey {
  const keys: AxisKey[] = ['frequency', 'duration', 'diversity', 'intensity'];
  let best: AxisKey = 'frequency';
  for (const key of keys) if (axes[key] > axes[best]) best = key;
  return best;
}

/** DOI から解決先の URL を作る。 */
export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

/** 引用の1行表示。 */
export function formatCitation(evidence: Evidence): string {
  const { authors, year, journal } = evidence.citation;
  return `${authors} (${year}). ${journal}.`;
}

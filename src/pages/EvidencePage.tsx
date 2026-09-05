/**
 * 科学的知見の一覧。本アプリの中核。
 *
 * 冒頭に「これは集団を対象とした研究の話であって、あなた個人に何が起きるかを
 * 述べたものではない」という枠づけを常設し、そのうえで領域別に読めるようにする。
 */
import { useMemo, useState } from 'react';
import EvidenceCard from '../components/EvidenceCard';
import { DOMAIN_META, EVIDENCE, type EvidenceDomain } from '../data/evidence';
import { filterByDomain, selectEvidence } from '../lib/evidenceSelect';
import { toAxisValues } from '../lib/pei';
import { latestScored } from '../lib/series';
import { useRecords } from '../state/RecordsContext';

const DOMAIN_ORDER = Object.keys(DOMAIN_META) as EvidenceDomain[];

export default function EvidencePage() {
  const { entries } = useRecords();
  const [domain, setDomain] = useState<EvidenceDomain | null>(null);

  const axes = useMemo(() => {
    const latest = latestScored(entries);
    return latest ? toAxisValues(latest.score) : null;
  }, [entries]);

  const picks = useMemo(
    () => selectEvidence(axes, 3, entries.length),
    [axes, entries.length],
  );

  const list = useMemo(() => filterByDomain(domain), [domain]);

  return (
    <div className="stack">
      <div className="card">
        <h2 className="card__title">研究知見について</h2>
        <p className="small">
          ここに載せているのは、いずれも<strong>集団を対象とした研究</strong>の結果です。
          あなた個人の身体や気持ちに何が起きるかを述べたものではありませんし、
          記録したスコアが上がったことを健康状態の変化の証拠として読むこともできません。
        </p>
        <p className="small muted" style={{ marginTop: 8 }}>
          自然に触れることの価値は、健康上の効果に還元されるものではありません。
          ここでの研究は、日常の自然体験を過小評価しないための材料であって、
          自然を「健康のための手段」に位置づけるためのものではありません。
        </p>
      </div>

      {picks.length > 0 && (
        <>
          <h2 className="section-heading">いまのあなたの記録に関連する知見</h2>
          {picks.map((pick) => (
            <EvidenceCard key={pick.evidence.id} evidence={pick.evidence} reason={pick.reason} />
          ))}
          {!axes && (
            <p className="small muted">
              記録がまだないため、領域を横断して選んでいます。
            </p>
          )}
        </>
      )}

      <h2 className="section-heading">すべての知見（{EVIDENCE.length} 件）</h2>
      <div className="card">
        <p className="card__lead">領域で絞り込めます。</p>
        <div className="segmented" role="group" aria-label="知見の領域">
          <button
            type="button"
            className="segmented__button"
            aria-pressed={domain === null}
            onClick={() => setDomain(null)}
          >
            すべて
          </button>
          {DOMAIN_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className="segmented__button"
              aria-pressed={domain === key}
              onClick={() => setDomain(key)}
            >
              {DOMAIN_META[key].label}
            </button>
          ))}
        </div>
        {domain && <p className="small muted" style={{ marginTop: 10 }}>{DOMAIN_META[domain].description}</p>}
      </div>

      {list.map((evidence) => (
        <EvidenceCard key={evidence.id} evidence={evidence} />
      ))}

      <div className="card">
        <h2 className="card__title">収録の方針</h2>
        <p className="small">
          査読を経た論文、系統的レビュー、メタアナリシスを優先し、書誌情報と DOI を
          確認できたものだけを収録しています。確認できなかった候補は、
          もっともらしい記述を書き足すのではなく、意図的に載せていません。
        </p>
        <p className="small muted" style={{ marginTop: 8 }}>
          現状の収録は英国・欧州・北米の研究に偏っており、日本を対象とした研究は
          森林環境の生理反応と子どもの自然体験に限られています。
          この偏りも、数値を読むときの前提です。
        </p>
      </div>
    </div>
  );
}

/**
 * 研究知見の1件分。
 *
 * 表示の原則
 * ----------
 * - 出典（著者・年・雑誌名・DOI）を必ず併記し、DOI はリンクにする。
 * - caveat（解釈上の限界）は畳まない。見出しだけを読んで持ち帰られると、
 *   研究の射程を超えた読み方をされてしまうため、常に本文と同じ画面に置く。
 */
import { DOMAIN_META, type Evidence } from '../data/evidence';
import { doiUrl, formatCitation } from '../lib/evidenceSelect';

interface Props {
  evidence: Evidence;
  /** なぜこの知見が表示されているのかの説明。 */
  reason?: string | undefined;
}

export default function EvidenceCard({ evidence, reason }: Props) {
  const meta = DOMAIN_META[evidence.domain];
  return (
    <article className="evidence">
      <span className="evidence__domain">{meta.label}</span>
      {reason && <p className="evidence__reason">{reason}</p>}
      <h3 className="evidence__headline">{evidence.headline}</h3>
      <p className="evidence__summary">{evidence.summary}</p>
      <p className="evidence__caveat">
        <span className="evidence__caveat-label">読むときの注意：</span>
        {evidence.caveat}
      </p>
      <p className="evidence__citation">
        {formatCitation(evidence)}{' '}
        <a href={doiUrl(evidence.citation.doi)} target="_blank" rel="noreferrer noopener">
          DOI: {evidence.citation.doi}
        </a>
      </p>
    </article>
  );
}

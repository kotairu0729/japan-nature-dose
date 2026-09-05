/**
 * ホーム。「自分の自然体験がどう推移し、それが何をもたらしているか」を
 * 一画面で受け取れるようにする。
 *
 * 並び順は、直近の状態 → 全期間との比較 → バランス → 提案 → 集団平均 → 知見。
 * スコアを最初に大きく出すが、そのすぐ下に「良い・悪いを表す数値ではない」
 * 旨を置き、単独で一人歩きしないようにしている。
 */
import { useMemo } from 'react';
import AxisBars from '../components/AxisBars';
import AxisRadar from '../components/charts/AxisRadar';
import BenchmarkCompare from '../components/BenchmarkCompare';
import EmptyState from '../components/EmptyState';
import EvidenceCard from '../components/EvidenceCard';
import SuggestionList from '../components/SuggestionList';
import { AXIS_META } from '../data/scale';
import { PEI_ONE_LINER } from '../data/limitations';
import { selectEvidence } from '../lib/evidenceSelect';
import { formatScore, toAxisValues } from '../lib/pei';
import { compareLatestToAverage, latestScored, overallAverage } from '../lib/series';
import { buildSuggestionPlan, tiedLowestAxes } from '../lib/suggest';
import { useRecords } from '../state/RecordsContext';
import type { AxisKey } from '../types/pei';

export default function HomePage({
  onGoToRecord,
  onGoToEvidence,
}: {
  onGoToRecord: () => void;
  onGoToEvidence: () => void;
}) {
  const { entries } = useRecords();

  const latest = useMemo(() => latestScored(entries), [entries]);
  const average = useMemo(() => overallAverage(entries), [entries]);
  const comparison = useMemo(() => compareLatestToAverage(entries), [entries]);
  const axes = latest ? toAxisValues(latest.score) : null;
  const plan = useMemo(
    () => buildSuggestionPlan(axes, 3, entries.length),
    [axes, entries.length],
  );
  const picks = useMemo(() => selectEvidence(axes, 2, entries.length), [axes, entries.length]);
  const tied = axes ? tiedLowestAxes(axes) : [];

  if (!latest || !axes) {
    return (
      <div className="stack">
        <EmptyState onGoToRecord={onGoToRecord}>
          まだ記録がありません。1件記録すると、推移と関連する研究知見が表示されます。
        </EmptyState>
        <div className="card">
          <h2 className="card__title">PEI とは</h2>
          <p className="small">{PEI_ONE_LINER}</p>
        </div>
        <h2 className="section-heading">研究知見から</h2>
        {picks.map((pick) => (
          <EvidenceCard key={pick.evidence.id} evidence={pick.evidence} />
        ))}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <h2 className="card__title">直近の記録（{latest.entry.date}）</h2>
        <div className="score-hero">
          <span className="score-hero__value">{formatScore(latest.score.pei)}</span>
          <span className="score-hero__unit">PEI（0〜1）</span>
        </div>
        <p className="small muted" style={{ margin: '8px 0 14px' }}>
          この数値は関わり方の一断面であって、良い・悪いを表すものではありません。
          記録{entries.length}件の平均は {average ? formatScore(average.pei) : '—'} です。
        </p>
        <AxisBars
          axes={axes}
          reference={average ?? undefined}
          referenceLabel="全期間平均"
        />
        <p className="small muted" style={{ marginTop: 10 }}>
          数値は「直近 / 全期間平均」の順です。
        </p>
      </div>

      {comparison && (
        <div className="card">
          <h2 className="card__title">直近と全期間平均の差</h2>
          <p className="card__lead">
            差が出るのは自然なことです。季節や生活の状況で動きます。
          </p>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">項目</th>
                  <th scope="col">直近</th>
                  <th scope="col">平均</th>
                  <th scope="col">差</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.axis}>
                    <th scope="row">
                      {row.axis === 'pei' ? 'PEI 総合' : AXIS_META[row.axis].label}
                    </th>
                    <td>{formatScore(row.latest)}</td>
                    <td>{formatScore(row.average)}</td>
                    <td className="delta">
                      {row.delta >= 0 ? '+' : '−'}
                      {Math.abs(row.delta).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card__title">4軸のバランス</h2>
        <AxisRadar
          current={axes}
          currentLabel="直近"
          reference={entries.length > 1 && average ? average : undefined}
        />
      </div>

      {plan.axis && (
        <div className="card">
          <h2 className="card__title">試せそうなこと</h2>
          <p className="card__lead">
            {describeLowest(plan.axis, tied)}
            {' '}
            以下は、お金がかからず、いまある移動や時間の中でできることです。
            やらなくても差し支えありません。
          </p>
          <SuggestionList suggestions={plan.suggestions} />
        </div>
      )}

      <div className="card">
        <h2 className="card__title">公表されている集団平均との比較</h2>
        <p className="card__lead">
          直近の PEI（{formatScore(latest.score.pei)}）を、論文が報告している範囲の上に置いたものです。
        </p>
        <BenchmarkCompare score={latest.score.pei} />
      </div>

      <h2 className="section-heading">いまの記録に関連する研究知見</h2>
      {picks.map((pick) => (
        <EvidenceCard key={pick.evidence.id} evidence={pick.evidence} reason={pick.reason} />
      ))}
      <div className="button-row">
        <button className="button" type="button" onClick={onGoToEvidence}>
          知見をすべて見る
        </button>
      </div>
    </div>
  );
}

/** 最も低い軸の伝え方。横並びのときに一つだけを名指ししないようにする。 */
function describeLowest(axis: AxisKey, tied: AxisKey[]): string {
  if (tied.length >= 4) {
    return '4つの軸はいまほぼ横並びです。';
  }
  if (tied.length > 1) {
    const names = tied.map((k) => AXIS_META[k].label).join('と');
    return `いま数値が低いのは${names}です。`;
  }
  return `いま数値が最も低いのは「${AXIS_META[axis].label}」の軸です。`;
}

/** 推移の可視化。週次/月次の切り替え、軸別の推移、レーダー、12ヶ月俯瞰。 */
import { useMemo, useState } from 'react';
import AxisRadar from '../components/charts/AxisRadar';
import AxisTrendGrid from '../components/charts/AxisTrendGrid';
import MonthlyOverview from '../components/charts/MonthlyOverview';
import PeiTrendChart from '../components/charts/PeiTrendChart';
import SeriesTable from '../components/SeriesTable';
import EmptyState from '../components/EmptyState';
import { formatScore, toAxisValues } from '../lib/pei';
import {
  latestScored,
  overallAverage,
  toEntrySeries,
  toMonthlyOverview,
  toMonthlySeries,
} from '../lib/series';
import { useRecords } from '../state/RecordsContext';

type Granularity = 'entry' | 'month';

export default function TrendsPage({ onGoToRecord }: { onGoToRecord: () => void }) {
  const { entries } = useRecords();
  const [granularity, setGranularity] = useState<Granularity>('entry');
  const [showTable, setShowTable] = useState(false);

  const series = useMemo(
    () => (granularity === 'entry' ? toEntrySeries(entries) : toMonthlySeries(entries)),
    [entries, granularity],
  );
  const monthly = useMemo(() => toMonthlyOverview(entries, 12), [entries]);
  const average = useMemo(() => overallAverage(entries), [entries]);
  const latest = useMemo(() => latestScored(entries), [entries]);

  if (entries.length === 0) {
    return (
      <EmptyState onGoToRecord={onGoToRecord}>
        記録が1件もないため、まだ推移を表示できません。
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      <div className="card">
        <h2 className="card__title">PEI の推移</h2>
        <p className="card__lead">
          縦軸は 0〜1 に固定しています。上下の動きは、自然との関わり方の変化を表します。
        </p>
        <div className="segmented" role="group" aria-label="表示の粒度">
          <button
            type="button"
            className="segmented__button"
            aria-pressed={granularity === 'entry'}
            onClick={() => setGranularity('entry')}
          >
            記録ごと（週次）
          </button>
          <button
            type="button"
            className="segmented__button"
            aria-pressed={granularity === 'month'}
            onClick={() => setGranularity('month')}
          >
            月ごと
          </button>
        </div>
        <PeiTrendChart data={series} average={average?.pei} />
        <p className="small muted">
          破線は全期間の平均（{average ? formatScore(average.pei) : '—'}）です。
        </p>
        <div className="button-row" style={{ marginTop: 8 }}>
          <button
            className="button button--quiet"
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
          >
            {showTable ? '表を隠す' : '数値を表で見る'}
          </button>
        </div>
        {showTable && <SeriesTable data={series} />}
      </div>

      <div className="card">
        <h2 className="card__title">4軸それぞれの推移</h2>
        <p className="card__lead">
          軸ごとに分けて表示しています。1枚に重ねないのは、どの軸が動いたのかを
          読み取りやすくするためです。
        </p>
        <AxisTrendGrid data={series} />
      </div>

      {latest && (
        <div className="card">
          <h2 className="card__title">4軸のバランス</h2>
          <p className="card__lead">
            直近の記録（{latest.entry.date}）と、全期間の平均を重ねています。
            形の違いは関わり方の違いであって、優劣ではありません。
          </p>
          <AxisRadar
            current={toAxisValues(latest.score)}
            currentLabel={`直近（${latest.entry.date}）`}
            reference={entries.length > 1 && average ? average : undefined}
          />
        </div>
      )}

      <div className="card">
        <h2 className="card__title">直近12ヶ月</h2>
        <p className="card__lead">
          季節による動きが見えるよう、記録のない月も枠として残しています。
        </p>
        <MonthlyOverview data={monthly} />
      </div>
    </div>
  );
}

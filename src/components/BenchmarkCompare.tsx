/**
 * 公表されている集団平均との比較。
 *
 * 順位や優劣ではなく「目盛りのどのあたりか」を示すことに徹する。
 * 英国データであり日本にそのまま当てはめられない旨を、比較のたびに併記する。
 */
import { BENCHMARK_DISCLAIMER, UK_BENCHMARKS, describeDistance } from '../data/benchmarks';
import { formatScore } from '../lib/pei';

export default function BenchmarkCompare({ score }: { score: number }) {
  return (
    <div>
      {UK_BENCHMARKS.map((benchmark) => {
        const [low, high] = benchmark.range;
        return (
          <div className="benchmark-row" key={benchmark.id}>
            <div className="benchmark-row__head">
              <span>{benchmark.label}</span>
              <span className="axis-bar__value">
                {formatScore(low)}〜{formatScore(high)}
              </span>
            </div>
            <div
              className="benchmark-scale"
              role="img"
              aria-label={`${benchmark.label}は ${formatScore(low)} から ${formatScore(high)}。あなたの値は ${formatScore(score)}。`}
            >
              <div className="benchmark-scale__track" />
              <div
                className="benchmark-scale__band"
                style={{ left: `${low * 100}%`, width: `${(high - low) * 100}%` }}
              />
              <div className="benchmark-scale__marker" style={{ left: `${score * 100}%` }} />
            </div>
            <p className="small muted">{describeDistance(score, benchmark)}</p>
          </div>
        );
      })}
      <p className="note note--warn" style={{ marginTop: 12 }}>
        {BENCHMARK_DISCLAIMER}
      </p>
    </div>
  );
}

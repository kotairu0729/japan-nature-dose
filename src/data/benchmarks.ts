/**
 * 公表されている集団平均。
 *
 * 出典：Poznansky, F. et al. (2026) "The Personalised Ecology Index",
 * People and Nature, 8, 2881-2897. DOI: 10.1002/pan3.70389
 *
 * 【重要】これらはすべて英国の調査データである。緑地の分布、気候、住まい方、
 * 余暇の過ごし方が日本とは異なるため、日本在住者のスコアと直接比べて
 * 優劣を論じることはできない。UI では必ずこの但し書きを併記すること。
 */

export interface Benchmark {
  id: string;
  label: string;
  /** 論文で報告された範囲。 */
  range: [number, number];
  /** 表示や比較に使う代表値（範囲の中央）。 */
  midpoint: number;
  note: string;
}

function benchmark(id: string, label: string, range: [number, number], note: string): Benchmark {
  return { id, label, range, midpoint: (range[0] + range[1]) / 2, note };
}

export const UK_BENCHMARKS: readonly Benchmark[] = [
  benchmark('uk-national', '英国 全国平均', [0.48, 0.52], '英国全体の調査回答者の平均的な範囲'),
  benchmark('uk-urban', '英国 都市部', [0.47, 0.48], '都市部に居住する回答者'),
  benchmark('uk-rural', '英国 農村部', [0.56, 0.57], '農村部に居住する回答者'),
] as const;

/** 比較のたびに必ず添える但し書き。 */
export const BENCHMARK_DISCLAIMER =
  'これらは英国の調査にもとづく数値です。日本とは緑地の分布・気候・住まい方・休日の過ごし方が異なるため、あなたの数値と並べても「日本の中での位置」を示すものではありません。目盛りの目安として見てください。';

/** 比較を「優劣」ではなく「距離」として言葉にする（順位づけを避ける）。 */
export function describeDistance(userScore: number, benchmark: Benchmark): string {
  const diff = userScore - benchmark.midpoint;
  const abs = Math.abs(diff).toFixed(2);
  if (Math.abs(diff) < 0.03) return `${benchmark.label}とほぼ同じ範囲にあります`;
  return diff > 0
    ? `${benchmark.label}より ${abs} 高い位置にあります`
    : `${benchmark.label}より ${abs} 低い位置にあります`;
}

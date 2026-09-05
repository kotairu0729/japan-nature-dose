/**
 * 時系列を表として示す。
 *
 * グラフの色だけに頼らずに値を読めるようにするための代替表示であり、
 * 色覚特性や強制カラーモードでも同じ情報に到達できるようにしている。
 */
import { AXIS_META } from '../data/scale';
import { AXIS_KEYS, formatScore } from '../lib/pei';
import type { SeriesPoint } from '../lib/series';

export default function SeriesTable({ data }: { data: SeriesPoint[] }) {
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <caption className="visually-hidden">記録ごとの PEI と4軸の値</caption>
        <thead>
          <tr>
            <th scope="col">時点</th>
            <th scope="col">PEI</th>
            {AXIS_KEYS.map((axis) => (
              <th scope="col" key={axis}>
                {AXIS_META[axis].short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...data].reverse().map((point) => (
            <tr key={point.key}>
              <th scope="row">{point.key}</th>
              <td>{formatScore(point.pei)}</td>
              {AXIS_KEYS.map((axis) => (
                <td key={axis}>{formatScore(point[axis])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

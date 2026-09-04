/**
 * 行動提案の一覧。
 *
 * 「できていないこと」を突きつける画面にならないよう、軸の名指しは
 * 事実の記述にとどめ、提案は選択肢として並べる。
 */
import { CONTEXT_LABEL, type Suggestion } from '../data/suggestions';

export default function SuggestionList({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <div className="stack stack--tight">
      {suggestions.map((suggestion) => (
        <article className="suggestion" key={suggestion.id}>
          <div className="suggestion__meta">
            <span className="tag">{CONTEXT_LABEL[suggestion.context]}</span>
            <span className="tag">{suggestion.cost === 'free' ? '無料' : '数百円程度'}</span>
            <span className="tag">
              {suggestion.extraMinutes === 0
                ? '追加の時間なし'
                : `+${suggestion.extraMinutes}分ほど`}
            </span>
          </div>
          <h3 className="suggestion__title">{suggestion.title}</h3>
          <p className="suggestion__detail">{suggestion.detail}</p>
        </article>
      ))}
    </div>
  );
}

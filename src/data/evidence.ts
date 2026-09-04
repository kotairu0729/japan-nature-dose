/**
 * 科学的知見データ。
 *
 * 収録の方針
 * ----------
 * - 実在が確認できる査読済み論文・系統的レビュー・メタアナリシスのみを収録する。
 *   書誌情報や DOI に確信が持てない候補はエントリ化せず、ファイル末尾の
 *   「未収録の候補」にコメントとして残す。
 * - summary は原著の主張を自分の言葉で要約したものであり、原文の翻訳ではない。
 * - caveat は必須。研究デザイン（横断か縦断か、実験か観察か）、因果を主張できるか、
 *   対象集団の地域・年齢層を必ず含める。
 * - 個人の健康状態を診断・予測する表現、および「スコアが上がったから健康になった」
 *   という因果の誤帰属を招く表現は用いない。
 *
 * 追記の手順
 * ----------
 * 1. 下の EVIDENCE 配列に追加する（id は一意、domain は 7 種のいずれか）。
 * 2. `npx vitest run src/data/evidence.test.ts` を実行する。
 *    ID の重複、DOI 形式、caveat の欠落、断定的な表現の混入を自動で検査する。
 */

/** 知見の領域。 */
export type EvidenceDomain =
  | 'mental'
  | 'cognitive'
  | 'physical'
  | 'attention'
  | 'dose-response'
  | 'eoe'
  | 'equity';

/** PEI の 4 軸。この軸が低いユーザーに優先的に提示する知見を紐づける。 */
export type EvidenceAxis = 'frequency' | 'duration' | 'diversity' | 'intensity';

export type Evidence = {
  id: string;
  domain: EvidenceDomain;
  /** 一文で何が分かっているか。 */
  headline: string;
  /** 2〜3文の要約。 */
  summary: string;
  citation: { authors: string; year: number; journal: string; doi: string };
  /** 解釈上の限界。省略不可。 */
  caveat: string;
  triggerAxis?: EvidenceAxis;
};

/** 領域の表示名と説明。 */
export const DOMAIN_META: Record<EvidenceDomain, { label: string; description: string }> = {
  mental: {
    label: '精神的健康',
    description: 'ストレス、不安、抑うつとの関連',
  },
  cognitive: {
    label: '認知機能',
    description: '注意の回復、創造性、集中力との関連',
  },
  physical: {
    label: '身体的健康',
    description: '血圧、免疫指標、死亡率との関連',
  },
  attention: {
    label: '注意を向けること',
    description: '自然に「気づく」こと自体の効果（intensity 軸に対応）',
  },
  'dose-response': {
    label: '用量反応関係',
    description: 'どのくらいの接触量から関連が見えてくるか',
  },
  eoe: {
    label: '経験の絶滅',
    description: '人と自然の関わりの減少と、世代間で基準が動くこと',
  },
  equity: {
    label: '緑地アクセスの不平等',
    description: '自然に触れられるかどうかの社会的な偏り',
  },
};

export const EVIDENCE: readonly Evidence[] = [
  // ── 1. 自然接触と精神的健康 ─────────────────────────────
  {
    id: 'bratman-2015-rumination',
    domain: 'mental',
    headline:
      '自然の中を90分歩いた人では、都市部を歩いた人と比べて反芻思考の指標が下がった。',
    summary:
      '健康な都市在住者を「自然の中を歩く」「交通量の多い都市部を歩く」の2条件に無作為に割り付けた実験。自然条件でのみ、ネガティブな考えを反芻する傾向の自己申告が下がり、それに関連するとされる脳領域（膝下部前帯状皮質）の血流も低下した。',
    citation: {
      authors: 'Bratman, G. N., Hamilton, J. P., Hahn, K. S., Daily, G. C., & Gross, J. J.',
      year: 2015,
      journal: 'Proceedings of the National Academy of Sciences',
      doi: '10.1073/pnas.1510459112',
    },
    caveat:
      '参加者38名の小規模な実験で、測定は1回の散歩の前後のみ。長期的にどうなるか、都市在住の健康な成人以外にも当てはまるかは、この研究からは分からない。',
    triggerAxis: 'duration',
  },
  {
    id: 'cox-2017-neighbourhood-nature',
    domain: 'mental',
    headline:
      '近隣の自然に週3回以上触れている人ほど、抑うつ・不安・ストレスの申告が少ない傾向があった。',
    summary:
      '英国の都市住民263名を対象とした横断調査。自然への接触頻度が高い人、および住宅地の植生量や午後の鳥の数が多い地域に住む人ほど、精神的健康の指標が良好だった。著者らは週3回程度を目安の一つとして挙げている。',
    citation: {
      authors:
        'Cox, D. T. C., Shanahan, D. F., Hudson, H. L., Plummer, K. E., Siriwardena, G. M., Fuller, R. A., Anderson, K., Hancock, S., & Gaston, K. J.',
      year: 2017,
      journal: 'BioScience',
      doi: '10.1093/biosci/biw173',
    },
    caveat:
      '一時点の横断研究であり、自然に触れたから調子が良いのか、調子が良い人ほど外に出るのかは区別できない。対象は英国南部の都市住民に限られる。',
    triggerAxis: 'frequency',
  },
  {
    id: 'engemann-2019-green-childhood',
    domain: 'mental',
    headline:
      '子ども時代に住居まわりの緑が多かった人ほど、思春期以降に精神疾患と診断される割合が低いという関連が報告された。',
    summary:
      'デンマークの約94万人分の出生・診療登録データを、衛星画像から求めた住居周辺の緑地量と結びつけた大規模コホート研究。10歳までの緑が最も少なかった群は、最も多かった群と比べて、後年に精神疾患と診断される割合が高かった。',
    citation: {
      authors:
        'Engemann, K., Pedersen, C. B., Arge, L., Tsirogiannis, C., Mortensen, P. B., & Svenning, J.-C.',
      year: 2019,
      journal: 'Proceedings of the National Academy of Sciences',
      doi: '10.1073/pnas.1807504116',
    },
    caveat:
      '集団レベルの関連であり、特定の個人がどうなるかを予測するものではない。所得や都市度を統計的に調整してもなお他の要因が残っている可能性があり、デンマークという特定の社会の記録に基づく。',
  },
  {
    id: 'fuller-2007-biodiversity',
    domain: 'mental',
    headline:
      '緑地の「種の豊かさ」が高いほど、訪問者が報告する心理的な回復感も高かった。',
    summary:
      '英国シェフィールドの都市緑地15ヶ所で植物・鳥・チョウの種数を実際に調べ、来訪者312名の心理的な恩恵の申告と照らし合わせた研究。緑地の面積だけでなく生物多様性の高さが、内省の深さや場所への愛着といった指標と関連していた。',
    citation: {
      authors:
        'Fuller, R. A., Irvine, K. N., Devine-Wright, P., Warren, P. H., & Gaston, K. J.',
      year: 2007,
      journal: 'Biology Letters',
      doi: '10.1098/rsbl.2007.0149',
    },
    caveat:
      '横断的な観察研究であり因果関係は示せない。来訪者が実際の種数を正確に知覚していたわけではないことは著者ら自身が指摘している。英国の一都市のデータ。',
    triggerAxis: 'diversity',
  },

  // ── 2. 自然接触と認知機能 ───────────────────────────────
  {
    id: 'berman-2008-attention',
    domain: 'cognitive',
    headline:
      '自然環境を歩いた後は、都市環境を歩いた後より注意課題の成績が高かった。',
    summary:
      '2つの小規模な実験。参加者を自然の中と都市部の散歩に割り付けた実験と、自然・都市の写真を見せた実験のいずれでも、自然条件の後で作業記憶と注意を測る課題（逆唱数字など）の成績が向上した。注意回復理論を支持する結果として引用されることが多い。',
    citation: {
      authors: 'Berman, M. G., Jonides, J., & Kaplan, S.',
      year: 2008,
      journal: 'Psychological Science',
      doi: '10.1111/j.1467-9280.2008.02225.x',
    },
    caveat:
      '参加者は各実験で数十名、しかも大学生が中心。効果は課題直後の測定に限られ、日常の学習や仕事のパフォーマンスがどうなるかは分からない。',
  },
  {
    id: 'atchley-2012-creativity',
    domain: 'cognitive',
    headline:
      '電子機器を持たずに4日間自然の中で過ごした後、創造性を測る課題の成績が約50%高かった。',
    summary:
      'バックパッキング旅行の参加者56名を対象に、出発前と旅程4日目に遠隔連想課題を実施して比較した研究。自然の中での数日間の滞在と、創造的な問題解決の成績の高さが関連していた。',
    citation: {
      authors: 'Atchley, R. A., Strayer, D. L., & Atchley, P.',
      year: 2012,
      journal: 'PLoS ONE',
      doi: '10.1371/journal.pone.0051474',
    },
    caveat:
      '無作為割り付けではなく、自然への曝露とデジタル機器から離れたことの効果を分けられない。長期の野外旅行に参加する層に偏りがあり、日常的な短時間の自然接触に当てはめることはできない。',
    triggerAxis: 'duration',
  },
  {
    id: 'stevenson-2018-art-review',
    domain: 'cognitive',
    headline:
      '系統的レビューでは、自然曝露による認知機能の改善は、測る課題の種類によってばらつきがあった。',
    summary:
      '注意回復理論を検証した42件の研究を系統的にレビューしたもの。作業記憶や認知的柔軟性を測る課題では自然曝露後の改善が比較的一貫していた一方、注意に関するあらゆる指標で効果が見られるわけではないと結論している。',
    citation: {
      authors: 'Stevenson, M. P., Schilhab, T., & Bentsen, P.',
      year: 2018,
      journal: 'Journal of Toxicology and Environmental Health, Part B',
      doi: '10.1080/10937404.2018.1505571',
    },
    caveat:
      'レビュー対象の多くが小規模な実験で、用いる課題も統一されていない。効果量を数値で統合したメタアナリシスではなく、質的な整理である。',
  },
  {
    id: 'dadvand-2015-schoolchildren',
    domain: 'cognitive',
    headline:
      '学校周辺の緑が多い児童ほど、1年間の作業記憶の伸びが大きかった。',
    summary:
      'バルセロナの小学生2,593名を12ヶ月間追跡し、3ヶ月ごとに認知課題を実施した縦断研究。学校周辺の緑地量と、作業記憶の発達の大きさや不注意の少なさに関連が見られ、その一部は大気中の微粒子濃度の低さで説明された。',
    citation: {
      authors: 'Dadvand, P., Nieuwenhuijsen, M. J., Esnaola, M., Forns, J., Basagaña, X., et al.',
      year: 2015,
      journal: 'Proceedings of the National Academy of Sciences',
      doi: '10.1073/pnas.1503402112',
    },
    caveat:
      '発達期の児童を対象とした観察研究であり、成人にそのまま当てはめられない。緑地の多さと大気汚染の少なさが絡み合っており、単一都市のデータである。',
  },

  // ── 3. 自然接触と身体的健康 ─────────────────────────────
  {
    id: 'twohig-bennett-2018-meta',
    domain: 'physical',
    headline:
      '143件の研究のメタアナリシスで、緑地への曝露が多いことと、心拍数・血圧・II型糖尿病リスクの低さとの関連が示された。',
    summary:
      '20ヶ国・延べ約2億9千万人分を対象とした系統的レビューとメタアナリシス。緑地曝露の多さは、唾液中コルチゾール、心拍数、拡張期血圧、II型糖尿病の有病率、全死因死亡などの指標と統計的に有意な関連を示した。',
    citation: {
      authors: 'Twohig-Bennett, C., & Jones, A.',
      year: 2018,
      journal: 'Environmental Research',
      doi: '10.1016/j.envres.2018.06.030',
    },
    caveat:
      '含まれる研究の大半が横断研究であり、因果関係の証明にはならない。曝露の測り方（住居からの距離、植生指数など）が研究ごとに異なるため、効果の大きさの解釈には幅がある。',
  },
  {
    id: 'li-2010-nk-cells',
    domain: 'physical',
    headline:
      '2泊3日の森林滞在の後、ナチュラルキラー細胞の活性が上昇し、その状態が30日程度続いたと報告されている。',
    summary:
      '日本の成人を対象とした一連の小規模な介入研究をまとめたもの。森林への旅行の前後で血中のナチュラルキラー細胞の活性と数を測定し、上昇が観察された。著者は樹木由来の揮発性物質（フィトンチッド）の関与を仮説として挙げている。',
    citation: {
      authors: 'Li, Q.',
      year: 2010,
      journal: 'Environmental Health and Preventive Medicine',
      doi: '10.1007/s12199-008-0068-3',
    },
    caveat:
      '各研究の参加者が10〜20名程度と少なく、対照群を置かない前後比較が中心である。免疫指標の変化が実際の病気のなりやすさにどう結びつくかまでは示されていない。',
    triggerAxis: 'duration',
  },
  {
    id: 'park-2010-shinrin-yoku',
    domain: 'physical',
    headline:
      '日本の24ヶ所の森林での実験で、森林環境は都市環境より唾液中コルチゾール・脈拍・血圧が低い状態と関連していた。',
    summary:
      '被験者280名が森林と都市の両方を訪れ、生理指標を比較したフィールド実験。森林側では副交感神経の活動が高く交感神経の活動が低い傾向が、24ヶ所を通じて一貫して観察された。',
    citation: {
      authors: 'Park, B. J., Tsunetsugu, Y., Kasetani, T., Kagawa, T., & Miyazaki, Y.',
      year: 2010,
      journal: 'Environmental Health and Preventive Medicine',
      doi: '10.1007/s12199-009-0086-9',
    },
    caveat:
      '対象は日本の若年男性が中心で、測定は短時間の滞在中の生理反応にとどまる。健康状態そのものが改善したかを調べた研究ではない。',
  },
  {
    id: 'rojas-rueda-2019-mortality',
    domain: 'physical',
    headline:
      'コホート研究のメタアナリシスで、住居周辺の緑が多いことと全死因死亡率の低さとの関連が示された。',
    summary:
      '7件の縦断コホート研究（延べ約800万人）を統合した系統的レビューとメタアナリシス。住居周辺の植生指数が0.1増えるごとに、全死因死亡率が約4%低いという関連が推定された。',
    citation: {
      authors: 'Rojas-Rueda, D., Nieuwenhuijsen, M. J., Gascon, M., Perez-Leon, D., & Mudu, P.',
      year: 2019,
      journal: 'The Lancet Planetary Health',
      doi: '10.1016/S2542-5196(19)30215-3',
    },
    caveat:
      '観察研究の統合であり、緑地そのものの影響と、緑の多い地域に住める人の社会経済的な条件とを完全には切り分けられない。統合された研究数は少なく、対象は主に高所得国である。',
  },

  // ── 4. 「注意」を向けることの効果（intensity 軸） ────────
  {
    id: 'richardson-2016-30-days-wild',
    domain: 'attention',
    headline:
      '「30日間、毎日ひとつ自然に関わる」キャンペーンの参加者では、健康感と自然とのつながりの申告がキャンペーン終了2ヶ月後も高いままだった。',
    summary:
      '英国の市民向けキャンペーン「30 Days Wild」の参加者を対象にした評価研究。日常の中で自然に意識を向ける小さな行動を30日続けた群で、幸福感・健康感・自然への関与の指標が上昇し、終了2ヶ月後の追跡でも維持されていた。',
    citation: {
      authors: 'Richardson, M., Cormack, A., McRobert, L., & Underhill, R.',
      year: 2016,
      journal: 'PLoS ONE',
      doi: '10.1371/journal.pone.0149777',
    },
    caveat:
      '自ら参加を選んだ人々の自己申告に基づく評価で、比較のための対照群がない。もともと自然に関心の高い層が集まっている可能性が高い。',
    triggerAxis: 'intensity',
  },
  {
    id: 'passmore-2017-noticing-nature',
    domain: 'attention',
    headline:
      '2週間「身の回りの自然に気づく」ことを続けた群は、人工物に気づく群より幸福感の指標が高かった。',
    summary:
      '大学生395名を「自然に注意を向ける」「人工物に注意を向ける」「特に何もしない」の3群に無作為に割り付けた介入研究。自然群では日常の幸福感、他者とのつながり、向社会的な傾向の指標が上昇した。場所を変えるのではなく注意の向け方を変えるだけでも差が出た点が注目される。',
    citation: {
      authors: 'Passmore, H.-A., & Holder, M. D.',
      year: 2017,
      journal: 'The Journal of Positive Psychology',
      doi: '10.1080/17439760.2016.1221126',
    },
    caveat:
      '参加者はカナダの大学生に限られ、介入期間は2週間、指標はすべて自己申告である。効果が長く続くかどうかは追跡されていない。',
    triggerAxis: 'intensity',
  },
  {
    id: 'capaldi-2014-connectedness-meta',
    domain: 'attention',
    headline:
      'メタアナリシスによれば、自然とのつながりの感覚と幸福感には、小さいが一貫した正の相関がある。',
    summary:
      '30件・8,523名を統合したメタアナリシス。自然に対する情緒的なつながりの強さは、活力や肯定的な感情と有意に相関していた（相関はおおむね小〜中程度）。単に自然の近くにいることとは別に、つながりの感覚そのものが関わりうると論じている。',
    citation: {
      authors: 'Capaldi, C. A., Dopko, R. L., & Zelenski, J. M.',
      year: 2014,
      journal: 'Frontiers in Psychology',
      doi: '10.3389/fpsyg.2014.00976',
    },
    caveat:
      '相関の統合であり、どちらが原因かは特定できない。含まれる研究はほとんどが横断研究で、対象は北米・欧州の成人に偏っている。',
    triggerAxis: 'intensity',
  },
  {
    id: 'pritchard-2020-eudaimonia-meta',
    domain: 'attention',
    headline:
      '自然とのつながりは、心地よさだけでなく「意味」や「成長」といった側面の幸福感とも関連していた。',
    summary:
      '20件・4,758名を統合したメタアナリシス。自然とのつながりの強さは、人生の意味や自己の成長を含むエウダイモニア的な幸福感と、小〜中程度の正の相関を示した。快・不快の感情とは別の側面にも関連が及ぶことを示唆する。',
    citation: {
      authors: 'Pritchard, A., Richardson, M., Sheffield, D., & McEwan, K.',
      year: 2020,
      journal: 'Journal of Happiness Studies',
      doi: '10.1007/s10902-019-00118-6',
    },
    caveat:
      '横断研究の統合であり因果関係は言えない。すべて自己申告の尺度に依存し、対象は主に欧米の成人である。',
  },

  // ── 5. 用量反応関係 ────────────────────────────────────
  {
    id: 'white-2019-120-minutes',
    domain: 'dose-response',
    headline:
      '週に合計120分以上を自然の中で過ごす人は、良好な健康感・幸福感を報告する割合が高かった。',
    summary:
      '英国の成人19,806名を対象とした全国調査の分析。週あたりの自然滞在時間が120分を超えたあたりから良好な健康・幸福の申告割合が明確に高くなり、200〜300分程度で頭打ちになった。1回にまとめても複数回に分けても、関連の大きさは変わらなかった。',
    citation: {
      authors:
        'White, M. P., Alcock, I., Grellier, J., Wheeler, B. W., Hartig, T., Warber, S. L., Bone, A., Depledge, M. H., & Fleming, L. E.',
      year: 2019,
      journal: 'Scientific Reports',
      doi: '10.1038/s41598-019-44097-3',
    },
    caveat:
      '一時点の横断研究であり、120分は臨床的に定められた推奨量ではない。健康な人ほど外に出やすいという逆向きの説明も否定できず、英国のデータである点にも注意が要る。',
    triggerAxis: 'duration',
  },
  {
    id: 'shanahan-2016-dose',
    domain: 'dose-response',
    headline:
      '週30分以上の公園訪問と、抑うつ・高血圧の申告の少なさとの関連が報告された。',
    summary:
      'オーストラリア・ブリスベンの住民1,538名への調査。訪問の頻度・1回の長さ・緑地の質を分けて分析したところ、訪問時間の長さは抑うつの少なさと、訪問頻度の高さは社会的なつながりの強さと、それぞれ異なる形で関連していた。',
    citation: {
      authors:
        'Shanahan, D. F., Bush, R., Gaston, K. J., Lin, B. B., Dean, J., Barber, E., & Fuller, R. A.',
      year: 2016,
      journal: 'Scientific Reports',
      doi: '10.1038/srep28551',
    },
    caveat:
      '横断研究であり因果は示せない。亜熱帯の都市の住民が対象で、気候や緑地の性質が異なる地域にそのまま当てはめることはできない。',
    triggerAxis: 'frequency',
  },
  {
    id: 'barton-pretty-2010-dose',
    domain: 'dose-response',
    headline:
      '10件の研究の統合分析では、自然の中での活動による気分と自尊感情の改善は、最初の5分程度で最も大きかった。',
    summary:
      '英国の10研究・1,252名分のデータを統合し、活動時間と強度ごとに効果量を推定した。ごく短時間の曝露でも自己申告の気分に改善が見られ、時間が延びるにつれて追加の改善幅は小さくなる形が示された。',
    citation: {
      authors: 'Barton, J., & Pretty, J.',
      year: 2010,
      journal: 'Environmental Science & Technology',
      doi: '10.1021/es903183r',
    },
    caveat:
      '設計の異なる研究を統合しており、対照群の置き方が揃っていない。指標は自己申告の気分と自尊感情で、短期的な変化にとどまる。英国のデータ。',
    triggerAxis: 'duration',
  },
  {
    id: 'hunter-2019-nature-pill',
    domain: 'dose-response',
    headline:
      '日常生活の中で20分以上を自然の中で過ごしたとき、唾液中のストレス関連物質の低下が大きかった。',
    summary:
      '参加者36名が8週間にわたり、自分で選んだ場所と時間で「自然体験」を取り、その前後に唾液を採取した研究。コルチゾールの低下率は20〜30分あたりで最も効率が良く、それを超えると変化は緩やかになった。',
    citation: {
      authors: 'Hunter, M. R., Gillespie, B. W., & Chen, S. Y.-P.',
      year: 2019,
      journal: 'Frontiers in Psychology',
      doi: '10.3389/fpsyg.2019.00722',
    },
    caveat:
      '参加者36名の小規模な研究で、場所も活動内容も各自の裁量に任されている。測定したのは生理指標であり、健康状態が改善したことを示すものではない。',
    triggerAxis: 'duration',
  },

  // ── 6. 経験の絶滅（extinction of experience） ───────────
  {
    id: 'soga-gaston-2016-eoe',
    domain: 'eoe',
    headline:
      '人と自然の直接的な関わりは世界的に減少しており、著者らはこれを「経験の絶滅」と呼んでいる。',
    summary:
      '都市化と生活様式の変化により、人が自然に接する機会そのものと、機会を活かそうとする意欲の両方が減っていることを整理した総説。接触の減少が自然への関心と健康の双方を損ない、それがさらに接触を減らすという循環を指摘している。',
    citation: {
      authors: 'Soga, M., & Gaston, K. J.',
      year: 2016,
      journal: 'Frontiers in Ecology and the Environment',
      doi: '10.1002/fee.1225',
    },
    caveat:
      '個別データの解析ではなく、既存研究を概念的に整理した総説である。減少の速度や程度は地域・世代によって大きく異なり、日本を含む各国での実証はまだ限られている。',
  },
  {
    id: 'soga-gaston-2018-shifting-baseline',
    domain: 'eoe',
    headline:
      '各世代が自分の子ども時代の自然を「普通」と見なすため、長期的な劣化が気づかれにくい（基準推移症候群）。',
    summary:
      '人が環境の状態を評価するときの基準そのものが、世代ごとに下方修正されていく現象を整理した総説。個人の記憶が薄れることと、世代が入れ替わることの両方が働き、実際に失われたものの大きさが過小評価されると論じている。',
    citation: {
      authors: 'Soga, M., & Gaston, K. J.',
      year: 2018,
      journal: 'Frontiers in Ecology and the Environment',
      doi: '10.1002/fee.1794',
    },
    caveat:
      '概念的な枠組みの提示であり、基準の移動そのものを直接測定した研究ではない。どの程度基準が動くかは環境や文化によって異なる。',
  },
  {
    id: 'soga-2016-children-japan',
    domain: 'eoe',
    headline:
      '日本の児童では、直接的な自然体験が多いほど、生物多様性を守ろうとする意欲が高かった。',
    summary:
      '東京都の小学生397名への質問紙調査。自然の中で遊ぶといった直接体験と、本や映像を通じた間接体験の双方が、保全への意欲や自然に対する感情と正の関連を示した。関連は直接体験のほうが強かった。',
    citation: {
      authors: 'Soga, M., Gaston, K. J., Yamaura, Y., Kurisu, K., & Hanaki, K.',
      year: 2016,
      journal: 'International Journal of Environmental Research and Public Health',
      doi: '10.3390/ijerph13060529',
    },
    caveat:
      '横断的な質問紙調査であり因果関係は示せない。対象は東京の児童に限られ、成人や他地域にそのまま当てはめることはできない。',
    triggerAxis: 'frequency',
  },

  // ── 7. 緑地アクセスの社会的不平等 ───────────────────────
  {
    id: 'mitchell-popham-2008-inequality',
    domain: 'equity',
    headline:
      '緑地の多い地域では、所得による健康格差が相対的に小さかった。',
    summary:
      'イングランドの就労年齢人口4,000万人超の死亡記録を、居住地域の緑地量と所得階層で層別して比較した観察研究。所得による死亡率の格差は、緑地が最も多い地域で最も小さかった。',
    citation: {
      authors: 'Mitchell, R., & Popham, F.',
      year: 2008,
      journal: 'The Lancet',
      doi: '10.1016/S0140-6736(08)61689-X',
    },
    caveat:
      '地域単位の生態学的分析であり、個人の経験を表すものではない。緑の多い地域に住むことを選べる人の特性が影響している可能性がある。2008年のイングランドのデータ。',
  },
  {
    id: 'wolch-2014-just-green-enough',
    domain: 'equity',
    headline:
      '都市の緑化は、それ自体が地価上昇を通じて既存住民を追い出しうるという逆説が指摘されている。',
    summary:
      '都市緑地へのアクセスの不平等に関する研究を整理した総説。低所得層や人種的マイノリティの居住地域ほど緑地が乏しい一方で、大規模な緑化はジェントリフィケーションを招きうるとして、「just green enough（ちょうど十分なだけ緑に）」という方針を提案している。',
    citation: {
      authors: 'Wolch, J. R., Byrne, J., & Newell, J. P.',
      year: 2014,
      journal: 'Landscape and Urban Planning',
      doi: '10.1016/j.landurbplan.2014.01.017',
    },
    caveat:
      '主に北米の事例に基づく総説であり、日本の都市計画や住宅市場の文脈とは異なる。提案は政策的な論考であって、効果を検証した研究ではない。',
  },
  {
    id: 'rigolon-2016-park-access',
    domain: 'equity',
    headline:
      '公園へのアクセスの格差は、「距離」よりも「面積と質」に強く現れる。',
    summary:
      '都市公園へのアクセスの公平性を扱った文献のレビュー。低所得層やマイノリティの居住地区では、公園までの距離は必ずしも遠くない一方で、一人当たりの面積や設備の質が劣る傾向が繰り返し報告されていることを示した。',
    citation: {
      authors: 'Rigolon, A.',
      year: 2016,
      journal: 'Landscape and Urban Planning',
      doi: '10.1016/j.landurbplan.2016.05.017',
    },
    caveat:
      '米国の研究が大半を占めるレビューで、アクセスの指標の定義も研究ごとに異なる。日本の状況を直接示すものではない。',
  },
  {
    id: 'schule-2019-who-europe',
    domain: 'equity',
    headline:
      'WHO欧州地域のレビューでも、社会経済的に不利な集団ほど緑地・水辺の資源が乏しい傾向が確認された。',
    summary:
      '欧州の75件の研究を対象とした系統的レビュー。個人の指標で見ても地域の指標で見ても、社会経済的に不利な立場にある集団ほど緑地へのアクセスが限られる傾向が多く報告されていた。ただし結果は一貫しておらず、都市の歴史的背景に左右される。',
    citation: {
      authors: 'Schüle, S. A., Hilz, L. K., Dreger, S., & Bolte, G.',
      year: 2019,
      journal: 'International Journal of Environmental Research and Public Health',
      doi: '10.3390/ijerph16071216',
    },
    caveat:
      '対象は欧州に限られ、結果の方向は国によってばらつく。緑地の「量」の測定が中心で、実際にどう使われているかや質は十分に捉えられていない。',
  },
];

/* ────────────────────────────────────────────────────────────
 * 未収録の候補（プレースホルダ）
 *
 * 以下は本アプリの関心に合致する可能性が高いテーマだが、書誌情報または DOI を
 * 確実に確認できなかったため、意図的にエントリ化していない。原典に当たって
 * 著者・年・雑誌名・DOI を確認できた時点で EVIDENCE に追加すること。
 * 存在しない文献や推測による DOI を書き足してはならない。
 *
 * - [physical] 日本国内の緑地量と高齢者の生存率に関するコホート研究
 *   （高齢者の「歩いて行ける緑地」と生存期間を扱った日本の研究があるが、
 *    書誌情報を確認できていない）
 * - [dose-response] 日本人を対象とした自然接触の用量反応関係の検証
 *   （現状の dose-response 領域は英国・豪州のデータに偏っている）
 * - [equity] 日本の都市における公園アクセスの社会経済的格差
 *   （equity 領域は欧米の研究のみで構成されており、日本の実証が欠けている）
 * - [cognitive] 職場・学校での窓からの緑の眺めと集中力に関する介入研究
 * - [mental] 自然接触を用いた社会的処方（social prescribing）の効果検証
 *   （英国で試行が進むが、効果検証の質にばらつきがあり要精査）
 * ──────────────────────────────────────────────────────────── */

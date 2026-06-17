const PptxGenJS = require('pptxgenjs');

const pptx = new PptxGenJS();

// ── A4 Portrait (21cm × 29.7cm)
pptx.layout = 'LAYOUT_4x3'; // override below
pptx.defineLayout({ name: 'A4', width: 21, height: 29.7 });
pptx.layout = 'A4';

// ── Color palette
const C = {
  navy:       '1B2C4E',
  navy2:      '22345C',
  gold:       'E8A820',
  goldLight:  'F5C842',
  cream:      'F5EEE0',
  creameStroke:'DDD5C0',
  white:      'FFFFFF',
  textDark:   '1B2C4E',
  textGray:   '555555',
  textLight:  '888888',
  textUrl:    '2D9CB4',
  orange:     'E8750A',
  teal:       '2D9CB4',
  purple:     '6B5EA8',
  deptA:      '243760',
  deptB:      '1A7040',
  deptC:      '5B3D9A',
};

// ── Helpers
// cm conversion: 1cm = 1 (PptxGenJS uses cm natively when layout is A4)
const W = 21;   // page width cm
const H = 29.7; // page height cm

// Draw a rounded rectangle card
function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.22,
    fill:   { color: opts.fill   || C.white },
    line:   { color: opts.border || C.creameStroke, width: 0.7 },
  });
  if (opts.topColor) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x, y, w, h: 0.12,
      rectRadius: 0.1,
      fill: { color: opts.topColor },
      line: { color: opts.topColor, width: 0 },
    });
  }
}

// Small label (gold, all-caps style)
function label(slide, text, x, y, opts = {}) {
  slide.addText(text, {
    x, y, w: opts.w || 6, h: 0.3,
    fontSize: opts.size || 6,
    color: opts.color || C.gold,
    bold: true,
    fontFace: 'Noto Sans JP',
  });
}

// Body text
function body(slide, text, x, y, w, opts = {}) {
  slide.addText(text, {
    x, y, w, h: opts.h || 1,
    fontSize: opts.size || 7.5,
    color: opts.color || C.textGray,
    fontFace: 'Noto Sans JP',
    breakLine: false,
    wrap: true,
    valign: 'top',
    ...(opts.bold ? { bold: true } : {}),
    ...(opts.align ? { align: opts.align } : {}),
  });
}

// Divider line
function divLine(slide, x, y, w, color) {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h: 0,
    line: { color, width: 0.5 },
  });
}

// =============================================================
// PAGE 1 : 団体基本情報 + 設立背景・問題意識
// =============================================================
const s1 = pptx.addSlide();

// ── Background (cream)
s1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: W, h: H,
  fill: { color: C.cream },
  line: { color: C.cream, width: 0 },
});

// Subtle vertical stripe effect (thin gold columns every ~0.85cm)
for (let x = 0; x < W; x += 0.85) {
  s1.addShape(pptx.ShapeType.rect, {
    x: x + 0.82, y: 0, w: 0.03, h: H,
    fill: { color: 'C8A85F', transparency: 87 },
    line: { color: C.cream, width: 0 },
  });
}

// ── HEADER
const hH = 5.1; // header height cm

// Header gradient background (approximated with two rects)
s1.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: W, h: hH,
  fill: { type: 'gradient', gradType: 'linear', angle: 135,
    stops: [
      { position: 0,   color: C.navy },
      { position: 55,  color: C.navy2 },
      { position: 100, color: '1A3560' },
    ]},
  line: { color: C.navy, width: 0 },
});

// Header stripes overlay
for (let x = 0; x < W; x += 0.8) {
  s1.addShape(pptx.ShapeType.rect, {
    x: x + 0.77, y: 0, w: 0.03, h: hH,
    fill: { color: 'FFFFFF', transparency: 96 },
    line: { color: C.navy, width: 0 },
  });
}

// Eyebrow
s1.addText('STUDENT ORGANIZATION  ·  KOBE UNIVERSITY', {
  x: 1.17, y: 0.75, w: 15, h: 0.35,
  fontSize: 6.5,
  color: 'AABBD0',
  fontFace: 'Arial',
  charSpacing: 3,
});

// Main title
s1.addText([
  { text: '神大留学', options: { color: C.white, bold: true } },
  { text: 'リアル',   options: { color: C.gold,  bold: true } },
], {
  x: 1.1, y: 1.15, w: 16, h: 1.8,
  fontSize: 42,
  fontFace: 'Noto Sans JP',
});

// Subtitle
s1.addText('〜神大生の留学をもっと身近に〜', {
  x: 1.1, y: 2.75, w: 14, h: 0.45,
  fontSize: 9,
  color: 'B0C4D8',
  fontFace: 'Noto Sans JP',
  charSpacing: 1.5,
});

// Gold divider under subtitle
s1.addShape(pptx.ShapeType.rect, {
  x: 1.1, y: 3.28, w: 1.1, h: 0.07,
  fill: { color: C.gold },
  line: { color: C.gold, width: 0 },
});

// Badge
s1.addShape(pptx.ShapeType.roundRect, {
  x: 1.1, y: 3.5, w: 3.7, h: 0.62,
  rectRadius: 0.1,
  fill: { color: C.gold },
  line: { color: C.gold, width: 0 },
});
s1.addText('活動紹介（2025年度）', {
  x: 1.1, y: 3.51, w: 3.7, h: 0.6,
  fontSize: 8,
  color: C.navy,
  fontFace: 'Noto Sans JP',
  bold: true,
  align: 'center',
  valign: 'middle',
});

// ── SECTION 01 header
const bY = hH + 0.7; // body starts

// Eyebrow bar + number
s1.addShape(pptx.ShapeType.rect, {
  x: 0.95, y: bY, w: 0.6, h: 0.07,
  fill: { color: C.gold }, line: { color: C.gold, width: 0 },
});
s1.addText('01', {
  x: 1.65, y: bY - 0.04, w: 1, h: 0.25,
  fontSize: 6.5, color: C.gold, bold: true, fontFace: 'Noto Sans JP', charSpacing: 3,
});

s1.addText('団体基本情報', {
  x: 0.95, y: bY + 0.18, w: 10, h: 0.7,
  fontSize: 15, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});

// ── 4 Info cards
const cY = bY + 1.02;
const cGap = 0.25;
const cW = (W - 1.9 - cGap * 3) / 4; // ~4.56cm
const cH = 1.82;
const cards4 = [
  { label: '団  体  名',    value: '神大留学リアル', sub: '' },
  { label: '設 立 年 月',   value: '2025年',        sub: '' },
  { label: '代  表  者',    value: '宇都健太',        sub: '経営学部 4回生' },
  { label: '幹事人数 / 活動対象', value: '16名',     sub: '神戸大学在学生・卒業生\n留学検討中の全大学生・高校生' },
];
cards4.forEach((c, i) => {
  const cx = 0.95 + i * (cW + cGap);
  card(s1, cx, cY, cW, cH);
  label(s1, c.label, cx + 0.22, cY + 0.22, { w: cW });
  s1.addText(c.value, {
    x: cx + 0.22, y: cY + 0.55, w: cW - 0.3, h: 0.55,
    fontSize: 10, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
  });
  if (c.sub) {
    s1.addText(c.sub, {
      x: cx + 0.22, y: cY + 1.1, w: cW - 0.3, h: 0.65,
      fontSize: 6.5, color: C.textLight, fontFace: 'Noto Sans JP', wrap: true, valign: 'top',
    });
  }
});

// ── Media box
const mY = cY + cH + 0.28;
const mH = 3.6;
card(s1, 0.95, mY, W - 1.9, mH);
label(s1, '活 動 媒 体', 1.17, mY + 0.25, { w: 4 });

const media = [
  { name: '📸  Instagram', url: '@kobeu_studyabroad',                                   date: '2025年9月〜' },
  { name: '✍️  Note',      url: 'note.com/kobeu_abroad',                               date: '2026年3月〜' },
  { name: '📌  Padlet',    url: 'padlet.com/kobeustudyabroad2025/padlet-ktoczxwypj225o11', date: '2026年4月〜' },
];
media.forEach((m, i) => {
  const ry = mY + 0.72 + i * 0.96;
  if (i > 0) divLine(s1, 1.17, ry - 0.06, W - 2.34, 'E8E0CE');
  s1.addText(m.name, {
    x: 1.17, y: ry, w: 11, h: 0.38,
    fontSize: 9, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
  });
  s1.addText(m.url, {
    x: 1.17, y: ry + 0.38, w: 13, h: 0.3,
    fontSize: 7, color: C.teal, fontFace: 'Noto Sans JP',
  });
  s1.addText(m.date, {
    x: W - 3.3, y: ry + 0.1, w: 2.2, h: 0.35,
    fontSize: 7, color: C.textLight, fontFace: 'Noto Sans JP', align: 'right',
  });
});

// ── SECTION 02: 設立背景・問題意識
const s2Y = mY + mH + 0.65;
s1.addShape(pptx.ShapeType.rect, {
  x: 0.95, y: s2Y, w: 0.6, h: 0.07,
  fill: { color: C.gold }, line: { color: C.gold, width: 0 },
});
s1.addText('02', {
  x: 1.65, y: s2Y - 0.04, w: 1, h: 0.25,
  fontSize: 6.5, color: C.gold, bold: true, fontFace: 'Noto Sans JP', charSpacing: 3,
});
s1.addText('設立背景・問題意識', {
  x: 0.95, y: s2Y + 0.18, w: 10, h: 0.7,
  fontSize: 15, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});

const pY = s2Y + 1.0;
const pGap = 0.3;
const pW = (W - 1.9 - pGap * 2) / 3;
const pCardH = 5.5;
const problems = [
  {
    color: C.orange, title: '留学者数の減少',
    body: '神戸大学における海外留学生の減少傾向が続いている。',
    sol:  '「神大生の留学をもっと身近に」するための情報発信。学外の学生にも有益な情報を提供する。',
  },
  {
    color: C.teal, title: '具体的情報の不足',
    body: '事前準備・現地生活・奨学金対策など、大学側の発信では具体性が不足している。',
    sol:  'SNSを活用し具体的情報へのアクセス性を高め、情報格差を是正する。',
  },
  {
    color: C.purple, title: 'コミュニティの欠如',
    body: '留学する人はまだ少数派で、タテ・ヨコのつながりが不足している。',
    sol:  '志望大学の先輩（タテ）と一緒に応募する同期（ヨコ）の繋がりを提供するコミュニティを運営する。',
  },
];
problems.forEach((p, i) => {
  const px = 0.95 + i * (pW + pGap);
  card(s1, px, pY, pW, pCardH, { topColor: p.color });

  s1.addText(p.title, {
    x: px + 0.22, y: pY + 0.28, w: pW - 0.35, h: 0.55,
    fontSize: 8.5, color: p.color, bold: true, fontFace: 'Noto Sans JP',
  });
  s1.addText(p.body, {
    x: px + 0.22, y: pY + 0.88, w: pW - 0.35, h: 1.6,
    fontSize: 7.5, color: C.textGray, fontFace: 'Noto Sans JP', wrap: true, valign: 'top',
  });

  // Solution badge
  s1.addShape(pptx.ShapeType.roundRect, {
    x: px + 0.22, y: pY + 2.48, w: 1.5, h: 0.32,
    rectRadius: 0.06,
    fill: { color: C.white },
    line: { color: C.gold, width: 0.7 },
  });
  s1.addText('→ 解決策', {
    x: px + 0.22, y: pY + 2.49, w: 1.5, h: 0.31,
    fontSize: 6, color: C.gold, bold: true, fontFace: 'Noto Sans JP',
    align: 'center', valign: 'middle',
  });
  s1.addText(p.sol, {
    x: px + 0.22, y: pY + 2.9, w: pW - 0.35, h: 2.3,
    fontSize: 7.5, color: '333333', fontFace: 'Noto Sans JP', wrap: true, valign: 'top',
  });
});


// =============================================================
// PAGE 2 : 活動理念 + 活動内容 + 運営システム
// =============================================================
const s2 = pptx.addSlide();

// Background
s2.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: W, h: H,
  fill: { color: C.cream }, line: { color: C.cream, width: 0 },
});
for (let x = 0; x < W; x += 0.85) {
  s2.addShape(pptx.ShapeType.rect, {
    x: x + 0.82, y: 0, w: 0.03, h: H,
    fill: { color: 'C8A85F', transparency: 87 },
    line: { color: C.cream, width: 0 },
  });
}

// ── COMPACT HEADER
const hH2 = 3.5;
s2.addShape(pptx.ShapeType.rect, {
  x: 0, y: 0, w: W, h: hH2,
  fill: { type: 'gradient', gradType: 'linear', angle: 135,
    stops: [
      { position: 0,  color: C.navy },
      { position: 55, color: C.navy2 },
      { position: 100, color: '1A3560' },
    ]},
  line: { color: C.navy, width: 0 },
});
for (let x = 0; x < W; x += 0.8) {
  s2.addShape(pptx.ShapeType.rect, {
    x: x + 0.77, y: 0, w: 0.03, h: hH2,
    fill: { color: 'FFFFFF', transparency: 96 },
    line: { color: C.navy, width: 0 },
  });
}

s2.addText('STUDENT ORGANIZATION  ·  KOBE UNIVERSITY', {
  x: 1.17, y: 0.55, w: 15, h: 0.35,
  fontSize: 6.5, color: 'AABBD0', fontFace: 'Arial', charSpacing: 3,
});
s2.addText([
  { text: '神大留学', options: { color: C.white, bold: true } },
  { text: 'リアル',   options: { color: C.gold,  bold: true } },
], { x: 1.1, y: 0.98, w: 16, h: 1.4, fontSize: 30, fontFace: 'Noto Sans JP' });

// Badge
s2.addShape(pptx.ShapeType.roundRect, {
  x: 1.1, y: 2.45, w: 3.7, h: 0.62,
  rectRadius: 0.1, fill: { color: C.gold }, line: { color: C.gold, width: 0 },
});
s2.addText('活動紹介（2025年度）', {
  x: 1.1, y: 2.46, w: 3.7, h: 0.6,
  fontSize: 8, color: C.navy, fontFace: 'Noto Sans JP',
  bold: true, align: 'center', valign: 'middle',
});

// ── SECTION 03: 活動理念・ミッション
const b2Y = hH2 + 0.55;

s2.addShape(pptx.ShapeType.rect, {
  x: 0.95, y: b2Y, w: 0.6, h: 0.07,
  fill: { color: C.gold }, line: { color: C.gold, width: 0 },
});
s2.addText('03', {
  x: 1.65, y: b2Y - 0.04, w: 1, h: 0.25,
  fontSize: 6.5, color: C.gold, bold: true, fontFace: 'Noto Sans JP', charSpacing: 3,
});
s2.addText('活動理念・ミッション', {
  x: 0.95, y: b2Y + 0.18, w: 10, h: 0.7,
  fontSize: 15, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});

const missions = [
  { icon: '🌍', title: '留学への挑戦を促進する',  body: '神戸大学から海外へ留学する学生を増やすことを第一の目標とする。どんな出自を持つ人であれ、交換留学の機会は公平にあるべきという信念のもと活動する。' },
  { icon: '🔗', title: '双方向コミュニティを形成する', body: '留学を「検討している人」が、「留学中の人」「留学経験者」と直接繋がれるコミュニティを形成・運営する。' },
  { icon: '⚖️', title: 'あらゆる情報格差をなくす', body: '現役留学生が自身の活動・学び・現地の様子を発信するプラットフォームとして機能し、情報の非対称性を解消する。' },
];
const mCardH = 1.28;
const mGap   = 0.22;
missions.forEach((m, i) => {
  const my = b2Y + 1.0 + i * (mCardH + mGap);
  // Card
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.95, y: my, w: W - 1.9, h: mCardH,
    rectRadius: 0.22,
    fill: { color: C.white },
    line: { color: C.creameStroke, width: 0.7 },
  });
  // Left accent bar
  s2.addShape(pptx.ShapeType.roundRect, {
    x: 0.95, y: my, w: 0.12, h: mCardH,
    rectRadius: 0.06,
    fill: { color: C.navy }, line: { color: C.navy, width: 0 },
  });
  s2.addText(m.icon, {
    x: 1.22, y: my + 0.22, w: 0.6, h: 0.5, fontSize: 14, align: 'center',
  });
  s2.addText(m.title, {
    x: 1.9, y: my + 0.18, w: W - 3.2, h: 0.4,
    fontSize: 9, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
  });
  s2.addText(m.body, {
    x: 1.9, y: my + 0.6, w: W - 3.2, h: 0.65,
    fontSize: 7.5, color: C.textGray, fontFace: 'Noto Sans JP', wrap: true, valign: 'top',
  });
});

// ── SECTION 04: 活動内容
const sec4Y = b2Y + 1.0 + missions.length * (mCardH + mGap) + 0.42;

s2.addShape(pptx.ShapeType.rect, {
  x: 0.95, y: sec4Y, w: 0.6, h: 0.07,
  fill: { color: C.gold }, line: { color: C.gold, width: 0 },
});
s2.addText('04', {
  x: 1.65, y: sec4Y - 0.04, w: 1, h: 0.25,
  fontSize: 6.5, color: C.gold, bold: true, fontFace: 'Noto Sans JP', charSpacing: 3,
});
s2.addText('活動内容（コンテンツ）', {
  x: 0.95, y: sec4Y + 0.18, w: 10, h: 0.7,
  fontSize: 15, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});

const activities = [
  { icon: '📸', name: 'Instagram', items: ['留学アンバサダー制度', '対面・オンラインイベント告知', 'リール作成・発信'] },
  { icon: '✍️', name: 'note',       items: ['留学体験談の記事作成', '情報量の多い詳細発信'] },
  { icon: '📌', name: 'Padlet',     items: ['各コンテンツの統合', '情報ポータル機能'] },
];
const acGap = 0.3;
const acW   = (W - 1.9 - acGap * 2) / 3;
const acH   = 3.0;
const acY   = sec4Y + 1.0;
activities.forEach((a, i) => {
  const ax = 0.95 + i * (acW + acGap);
  card(s2, ax, acY, acW, acH);
  s2.addText(a.icon, {
    x: ax, y: acY + 0.3, w: acW, h: 0.6, fontSize: 18, align: 'center',
  });
  s2.addText(a.name, {
    x: ax + 0.15, y: acY + 0.98, w: acW - 0.3, h: 0.45,
    fontSize: 9.5, color: C.textDark, bold: true, fontFace: 'Noto Sans JP', align: 'center',
  });
  a.items.forEach((item, j) => {
    s2.addText('▸  ' + item, {
      x: ax + 0.25, y: acY + 1.58 + j * 0.43, w: acW - 0.4, h: 0.42,
      fontSize: 7.5, color: C.textGray, fontFace: 'Noto Sans JP',
    });
  });
});

// ── SECTION 05: 運営システム・組織図
const sec5Y = acY + acH + 0.42;

s2.addShape(pptx.ShapeType.rect, {
  x: 0.95, y: sec5Y, w: 0.6, h: 0.07,
  fill: { color: C.gold }, line: { color: C.gold, width: 0 },
});
s2.addText('05', {
  x: 1.65, y: sec5Y - 0.04, w: 1, h: 0.25,
  fontSize: 6.5, color: C.gold, bold: true, fontFace: 'Noto Sans JP', charSpacing: 3,
});
s2.addText('運営システム・組織図', {
  x: 0.95, y: sec5Y + 0.18, w: 10, h: 0.7,
  fontSize: 15, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});

// Root box (center)
const rootW = 5.5;
const rootX = (W - rootW) / 2;
const orgY  = sec5Y + 1.1;
s2.addShape(pptx.ShapeType.roundRect, {
  x: rootX, y: orgY, w: rootW, h: 0.88,
  rectRadius: 0.22,
  fill: { color: C.navy }, line: { color: C.navy, width: 0 },
});
s2.addText('🏛  神大留学リアル', {
  x: rootX, y: orgY + 0.06, w: rootW, h: 0.44,
  fontSize: 9.5, color: C.white, bold: true, fontFace: 'Noto Sans JP', align: 'center',
});
s2.addText('学生団体 全体統括', {
  x: rootX, y: orgY + 0.48, w: rootW, h: 0.3,
  fontSize: 6.5, color: 'AABBD0', fontFace: 'Noto Sans JP', align: 'center',
});

// Connector: root → crossbar
const stemX = W / 2;
const stemY1 = orgY + 0.88;
const stemY2 = stemY1 + 0.35;
s2.addShape(pptx.ShapeType.line, {
  x: stemX, y: stemY1, w: 0, h: 0.35,
  line: { color: C.navy, width: 1 },
});

// Crossbar
const deptGap = 0.28;
const deptW   = (W - 1.9 - deptGap * 2) / 3;
const deptX   = [0.95, 0.95 + deptW + deptGap, 0.95 + (deptW + deptGap) * 2];
const crossY  = stemY2;
const leftX   = deptX[0] + deptW / 2;
const rightX  = deptX[2] + deptW / 2;
s2.addShape(pptx.ShapeType.line, {
  x: leftX, y: crossY, w: rightX - leftX, h: 0,
  line: { color: C.navy, width: 1 },
});
deptX.forEach(dx => {
  const cx = dx + deptW / 2;
  s2.addShape(pptx.ShapeType.line, {
    x: cx, y: crossY, w: 0, h: 0.32,
    line: { color: C.navy, width: 1 },
  });
});

// Department cards
const deptY  = crossY + 0.32;
const deptH  = 2.6;
const depts = [
  {
    color: C.deptA, title: 'A. 運営管理部', role: 'B・C部門の全体管理',
    items: ['会議調整・議事進行', '渉外・対外折衝', '団体設立関連手続き'],
  },
  {
    color: C.deptB, title: 'B. 広報部', role: '情報発信・コンテンツ管理',
    items: ['Instagram（ストーリー・固定投稿）', 'Canvaコンテンツ作成', 'note・website管理'],
  },
  {
    color: C.deptC, title: 'C. 留学支援部', role: 'コミュニティ・イベント管理',
    items: ['支援LINEグループ運営', 'オープンチャット管理', '対面・オンラインイベント企画・実行'],
  },
];
depts.forEach((d, i) => {
  const dx = deptX[i];
  s2.addShape(pptx.ShapeType.roundRect, {
    x: dx, y: deptY, w: deptW, h: deptH,
    rectRadius: 0.22,
    fill: { color: d.color }, line: { color: d.color, width: 0 },
  });
  s2.addText(d.title, {
    x: dx + 0.2, y: deptY + 0.22, w: deptW - 0.3, h: 0.42,
    fontSize: 8.5, color: C.white, bold: true, fontFace: 'Noto Sans JP',
  });
  s2.addText(d.role, {
    x: dx + 0.2, y: deptY + 0.62, w: deptW - 0.3, h: 0.32,
    fontSize: 6.5, color: 'AABBD0', fontFace: 'Noto Sans JP',
  });
  d.items.forEach((item, j) => {
    s2.addText('▸  ' + item, {
      x: dx + 0.2, y: deptY + 1.08 + j * 0.45, w: deptW - 0.3, h: 0.44,
      fontSize: 7.5, color: 'FFFFFF', fontFace: 'Noto Sans JP', opacity: 90,
    });
  });
});

// ── Tools + Meeting row
const toolsY = deptY + deptH + 0.3;
const toolGap = 0.3;
const toolW   = (W - 1.9 - toolGap * 2) / 3;

const tools = [
  { icon: '🗂', name: 'Notion（全員）',  desc: '議事録・タスク管理の拠点' },
  { icon: '💬', name: 'Discord（全員）', desc: '進捗・相談などコミュニケーションの場。各班ごとにチャンネルが分岐。' },
];
tools.forEach((t, i) => {
  const tx = 0.95 + i * (toolW + toolGap);
  card(s2, tx, toolsY, toolW, 1.28);
  s2.addText(t.icon, {
    x: tx + 0.2, y: toolsY + 0.32, w: 0.6, h: 0.55, fontSize: 13,
  });
  s2.addText(t.name, {
    x: tx + 0.85, y: toolsY + 0.25, w: toolW - 1.0, h: 0.38,
    fontSize: 8.5, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
  });
  s2.addText(t.desc, {
    x: tx + 0.85, y: toolsY + 0.64, w: toolW - 1.0, h: 0.58,
    fontSize: 7, color: C.textLight, fontFace: 'Noto Sans JP', wrap: true, valign: 'top',
  });
});

// Meeting card
const meetX = 0.95 + (toolW + toolGap) * 2;
card(s2, meetX, toolsY, toolW, 1.28);
s2.addText('📅', {
  x: meetX + 0.2, y: toolsY + 0.28, w: 0.55, h: 0.55, fontSize: 13,
});
s2.addText('会議頻度', {
  x: meetX + 0.85, y: toolsY + 0.12, w: toolW - 1.0, h: 0.28,
  fontSize: 6, color: C.textLight, bold: true, fontFace: 'Noto Sans JP',
});
s2.addText('月2回', {
  x: meetX + 0.85, y: toolsY + 0.36, w: toolW * 0.45, h: 0.42,
  fontSize: 12, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});
// Vertical separator
s2.addShape(pptx.ShapeType.line, {
  x: meetX + 0.85 + toolW * 0.45 + 0.12, y: toolsY + 0.3, w: 0, h: 0.65,
  line: { color: C.creameStroke, width: 0.7 },
});
s2.addText('開始時刻', {
  x: meetX + 0.85 + toolW * 0.45 + 0.28, y: toolsY + 0.12, w: toolW - 1.45, h: 0.28,
  fontSize: 6, color: C.textLight, bold: true, fontFace: 'Noto Sans JP',
});
s2.addText('21:00〜', {
  x: meetX + 0.85 + toolW * 0.45 + 0.28, y: toolsY + 0.36, w: toolW - 1.45, h: 0.42,
  fontSize: 12, color: C.textDark, bold: true, fontFace: 'Noto Sans JP',
});
s2.addText('留学メンバーと時差を合わせるため', {
  x: meetX + 0.85, y: toolsY + 0.88, w: toolW - 1.0, h: 0.32,
  fontSize: 6, color: C.textLight, fontFace: 'Noto Sans JP',
});


// =============================================================
// Output
// =============================================================
pptx.writeFile({ fileName: 'poster.pptx' })
  .then(() => console.log('poster.pptx を生成しました。'))
  .catch(err => { console.error(err); process.exit(1); });

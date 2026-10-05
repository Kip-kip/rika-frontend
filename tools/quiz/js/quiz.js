// ============================================================
// Rika — "Find Your Window" recommendation quiz (T-B3-02)
// Deterministic: 6 answers → rule-based recommendation + live price
// via the shared pricing engine. No AI, no backend.
// ============================================================
import { computePrice, formatKsh, formatRange, waLink, GLASS, FINISHES } from '../../shared/js/rika-price.js';
import { RIKA_CONFIG } from '../../shared/js/rika-config.js';

// ---------- questions ----------
const QUESTIONS = [
  {
    id: 'room',
    title: 'Where is this window going?',
    sub: 'Different spaces have different priorities.',
    answers: [
      { id: 'kitchen',   ico: '🍳', txt: 'Kitchen', sub: 'Grease, daily use, easy clean' },
      { id: 'bedroom',   ico: '🛏️', txt: 'Bedroom', sub: 'Quiet, privacy, light' },
      { id: 'bathroom',  ico: '🚿', txt: 'Bathroom', sub: 'Humidity, privacy first' },
      { id: 'living',    ico: '🛋️', txt: 'Living room / lounge', sub: 'View, airflow, style' },
      { id: 'shop',      ico: '🏪', txt: 'Shop / office front', sub: 'Security, visibility, impressions' },
    ],
  },
  {
    id: 'budget',
    title: 'What’s your budget comfort zone?',
    sub: 'Per single window (supply + fit).',
    answers: [
      { id: 'budget',   ico: '💸', txt: 'Keep it simple', sub: 'Best value, nothing fancy' },
      { id: 'mid',      ico: '⚖️', txt: 'Mid-range', sub: 'Good balance of looks and cost' },
      { id: 'premium',  ico: '💎', txt: 'Go premium', sub: 'Best glass, hardware, warranty' },
    ],
  },
  {
    id: 'light',
    title: 'How much light & airflow?',
    sub: 'How should the window behave?',
    answers: [
      { id: 'max',    ico: '☀️', txt: 'Max light + airflow', sub: 'Big opening, swings wide' },
      { id: 'balance',ico: '🌤️', txt: 'Balanced', sub: 'Some open, some fixed' },
      { id: 'min',    ico: '🌙', txt: 'Light but quiet', sub: 'Mostly sealed, less movement' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & glass?',
    sub: 'What should pass through the glass?',
    answers: [
      { id: 'clear',   ico: '🔍', txt: 'Clear view out', sub: 'See everything, let light in' },
      { id: 'tinted',  ico: '🌫️', txt: 'Tinted', sub: 'Glare down, still see out' },
      { id: 'frosted', ico: '🫧', txt: 'Frosted', sub: 'Light in, nobody peeks in' },
    ],
  },
  {
    id: 'security',
    title: 'How worried about break-ins?',
    sub: 'Street level, ground floor, busy area?',
    answers: [
      { id: 'low',    ico: '🔓', txt: 'Not a concern', sub: 'Ground-floor not an issue' },
      { id: 'high',   ico: '🔒', txt: 'Yes, it matters', sub: 'Add physical deterrence' },
    ],
  },
  {
    id: 'finish',
    title: 'Which look matches your space?',
    sub: 'Frame finish (no price difference).',
    answers: [
      { id: 'black',  ico: '⬛', txt: 'Matte Black', sub: 'Modern, sharp' },
      { id: 'silver', ico: '⬜', txt: 'Silver', sub: 'Classic aluminium' },
      { id: 'bronze', ico: '🟤', txt: 'Bronze', sub: 'Warm, premium tone' },
      { id: 'white',  ico: '🤍', txt: 'White', sub: 'Bright, traditional' },
    ],
  },
];

// ---------- rule engine ----------
function recommend(answers) {
  const { room, budget, light, privacy, security, finish } = answers;

  // 1. product type
  let product;
  switch (room) {
    case 'kitchen':   product = 'sliding';  break;
    case 'bedroom':   product = 'casement'; break;
    case 'bathroom':  product = 'casement'; break;
    case 'living':    product = light === 'max' ? 'sliding' : 'casement'; break;
    case 'shop':      product = 'fixed';    break;
    default:          product = 'sliding';
  }
  if (light === 'max' && (room === 'living' || room === 'kitchen')) product = 'sliding';
  if (light === 'min' && room === 'bedroom') product = 'casement';

  // 2. tier from budget
  const tier = budget === 'budget' ? 'essential' : budget === 'premium' ? 'premium' : 'comfort';

  // 3. glass from privacy
  const glass = privacy; // clear | tinted | frosted — keys match GLASS

  // 4. add-ons from security
  const addOns = new Set();
  if (security === 'high') addOns.add('burglar');

  // 5. typical size per room (cm)
  const SIZES = {
    kitchen:  { w: 120, h: 110 },
    bedroom:  { w: 120, h: 120 },
    bathroom: { w: 80,  h: 110 },
    living:   { w: 150, h: 120 },
    shop:     { w: 180, h: 130 },
  };
  const size = SIZES[room] || { w: 120, h: 120 };

  // 6. panels: sliding gets more sections for bigger openings
  const panels = product === 'sliding' && light === 'max' ? 4 : product === 'sliding' ? 2 : 2;

  // 7. why list (deterministic, 3–4 reasons)
  const why = [];
  const prodLabel = RIKA_CONFIG.pricing.products[product]?.label ?? 'Window';
  why.push(`${prodLabel} is the best fit for a ${room === 'shop' ? 'shop front' : room} — smooth daily use${room === 'bathroom' ? ' with a tight seal' : ''}.`);
  if (light === 'max') why.push('Sized for maximum light and airflow — a wide, openable panel.');
  if (light === 'min') why.push('Mostly sealed for quiet and draft-free comfort, with a light-well panel.');
  const tierLabel = RIKA_CONFIG.pricing.tiers[tier].label;
  why.push(`${tierLabel} package matches your budget: ${RIKA_CONFIG.pricing.tiers[tier].features[0].toLowerCase()}.`);
  if (privacy === 'tinted') why.push('Tinted glass cuts glare and UV while keeping the view.');
  if (privacy === 'frosted') why.push('Frosted glass lets light in but blocks the view — ideal for privacy.');
  if (security === 'high') why.push('Anti-burglar grill included as a physical deterrent.');
  why.push(`${FINISHES[finish].label} frame finish to match your ${room === 'shop' ? 'storefront' : 'room'}.`);

  return { product, tier, glass, addOns, panels, finish, size, why, room };
}

// ---------- tiny SVG preview (same style as design studio, simplified) ----------
function previewSVG({ product, glass, finish, panels, size }) {
  const w = Math.min(320, Math.max(160, size.w * 2));
  const h = Math.min(240, Math.max(120, size.h * 2));
  const frameColor = { black: '#1a1a1a', silver: '#b9c0c7', bronze: '#8a6a4f', white: '#f2f2f2' }[finish] || '#1a1a1a';
  const glassFill = { clear: '#cfe6f5', tinted: '#7f9db5', frosted: '#e8eef2' }[glass] || '#cfe6f5';
  const pad = 8;
  const n = product === 'sliding' ? Math.max(2, panels) : (product === 'fixed' ? 1 : 2);
  const innerW = w - pad * 2, innerH = h - pad * 2;
  let mullions = '';
  for (let i = 1; i < n; i++) {
    const x = pad + (innerW / n) * i;
    mullions += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${h - pad}" stroke="${frameColor}" stroke-width="4"/>`;
  }
  const isDoor = false;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Window preview">
  <rect x="0" y="0" width="${w}" height="${h}" fill="${glassFill}"/>
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${frameColor}" stroke-width="${pad * 2}"/>
  ${mullions}
  ${isDoor ? `<circle cx="${w - pad - 14}" cy="${h / 2}" r="5" fill="${frameColor}"/>` : ''}
</svg>`;
}

// ---------- UI ----------
const $ = (s) => document.querySelector(s);
const qBody = $('#quizBody'), qCard = $('#quizCard'), qResult = $('#quizResult');
const qNum = $('#quizQNum'), qTitle = $('#quizQTitle'), qSub = $('#quizQSub'), qAnswers = $('#quizAnswers');
const pBar = $('#quizProgressBar');

let idx = 0;
const answers = {};

function renderQuestion() {
  const q = QUESTIONS[idx];
  qNum.textContent = `${idx + 1} / ${QUESTIONS.length}`;
  qTitle.textContent = q.title;
  qSub.textContent = q.sub;
  qAnswers.innerHTML = '';
  qCard.hidden = false;
  qResult.hidden = true;
  pBar.style.width = `${((idx) / QUESTIONS.length) * 100}%`;

  for (const a of q.answers) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-answer';
    btn.innerHTML = `<span class="qa-ico">${a.ico}</span><span class="qa-txt">${a.txt}<span class="qa-sub">${a.sub}</span></span>`;
    btn.addEventListener('click', () => {
      answers[q.id] = a.id;
      idx += 1;
      if (idx < QUESTIONS.length) renderQuestion();
      else renderResult();
    });
    qAnswers.appendChild(btn);
  }
}

function renderResult() {
  const rec = recommend(answers);
  const { w, h } = rec.size;
  const area = (w / 100) * (h / 100);

  const price = computePrice({
    product: rec.product, area, qty: 1, tier: rec.tier,
    finish: rec.finish, glass: rec.glass, panels: rec.panels,
    addOns: rec.addOns,
  });

  // fill facts
  $('#fType').textContent = RIKA_CONFIG.pricing.products[rec.product].label;
  $('#fSize').textContent = `${w} × ${h} cm (${area.toFixed(2)} m²)`;
  $('#fGlass').textContent = GLASS[rec.glass].label;
  $('#fTier').textContent = RIKA_CONFIG.pricing.tiers[rec.tier].label;
  const extras = [...rec.addOns].map(id => RIKA_CONFIG.pricing.addOns[id].label).join(', ') || 'None';
  $('#fExtras').textContent = extras;

  // price
  $('#pTotal').textContent = formatKsh(price.total);
  $('#pRange').textContent = formatRange(price.total);

  // why
  const whyUl = $('#resultWhy');
  whyUl.innerHTML = '';
  for (const line of rec.why) {
    const li = document.createElement('li');
    li.textContent = line;
    whyUl.appendChild(li);
  }

  // title + visual
  const prodLabel = RIKA_CONFIG.pricing.products[rec.product].label;
  $('#resultTitle').textContent = `${RIKA_CONFIG.pricing.tiers[rec.tier].label} ${prodLabel}`;
  $('#resultSub').textContent =
    `Recommended for your ${rec.room === 'shop' ? 'shop front' : rec.room} · ${FINISHES[rec.finish].label} frame · ${GLASS[rec.glass].label.toLowerCase()} glass`;
  $('#resultVisual').innerHTML = previewSVG(rec);

  // CTAs
  // register snapshot for the shared Save My Design modal
  if (window.__rikaSetDesignSnapshot) {
    window.__rikaSetDesignSnapshot(() => ({
      product: rec.product,
      finish: rec.finish,
      glass: rec.glass,
      panels: rec.panels,
      tier: rec.tier,
      width_cm: w,
      height_cm: h,
      quantity: 1,
      addOns: [...rec.addOns],
      estimate_low: Math.round(price.total * 0.92),
      estimate_high: Math.round(price.total * 1.08),
      summaryHtml: `<strong>${w}×${h}cm</strong> · ${GLASS[rec.glass].label} glass · ${FINISHES[rec.finish].label} · ${RIKA_CONFIG.pricing.tiers[rec.tier].label} · for ${rec.room}`,
    }));
  }

  const quoteUrl =
    `/rika/tools/quotation/?type=${rec.product}&w=${w}&h=${h}&qty=1&finish=${rec.finish}&glass=${rec.glass}` +
    `&tier=${rec.tier}&from=quiz`;
  $('#quoteBtn').href = quoteUrl;

  const waText =
    `Hi Rika! I just ran the "Find Your Window" quiz.\n` +
    `Recommendation: ${RIKA_CONFIG.pricing.tiers[rec.tier].label} ${prodLabel}\n` +
    `Size: ${w}×${h} cm · ${GLASS[rec.glass].label} glass · ${FINISHES[rec.finish].label} frame\n` +
    `Est. total: ${formatKsh(price.total)} (${formatRange(price.total)})\n` +
    `Room: ${rec.room}${rec.addOns.size ? ` · Extras: ${extras}` : ''}\n` +
    `Can I get an exact quote?`;
  $('#waBtn').href = waLink(waText);

  qCard.hidden = true;
  qResult.hidden = false;
  pBar.style.width = '100%';
}

$('#quizRestart').addEventListener('click', () => {
  idx = 0;
  for (const k in answers) delete answers[k];
  renderQuestion();
});

renderQuestion();

// ============================================================
// Rika — "Build My House Windows" guided flow (T-B3-04)
// Deterministic: 5 answers → per-room window schedule + live
// total estimate via the shared pricing engine. No AI, no backend.
// ============================================================
import { computePrice, formatKsh, formatRange, waLink, GLASS, FINISHES } from '../../shared/js/rika-price.js';
import { RIKA_CONFIG } from '../../shared/js/rika-config.js';

// ---------- questions ----------
const QUESTIONS = [
  {
    id: 'house',
    title: 'What are we building?',
    sub: 'Sets the number of rooms to plan.',
    answers: [
      { id: 'bungalow',  ico: '🏠', txt: 'Bungalow',        sub: '1 storey, ~4–5 rooms' },
      { id: 'b3',        ico: '🏡', txt: '3-bedroom house',  sub: 'Standard family home' },
      { id: 'b4',        ico: '🏘️', txt: '4-bedroom house',  sub: 'Larger family home' },
      { id: 'b5',        ico: '🏰', txt: '5+ bedroom house', sub: 'Large / multi-suite' },
    ],
  },
  {
    id: 'budget',
    title: 'Overall window budget?',
    sub: 'This sets the default tier across all rooms.',
    answers: [
      { id: 'budget',   ico: '💸', txt: 'Keep it simple', sub: 'Essential tier across the board' },
      { id: 'mid',      ico: '⚖️', txt: 'Mid-range',      sub: 'Comfort tier — best balance' },
      { id: 'premium',  ico: '💎', txt: 'Go premium',     sub: 'Premium tier throughout' },
    ],
  },
  {
    id: 'glass',
    title: 'Glass preference?',
    sub: 'Applies to all rooms unless overridden per room.',
    answers: [
      { id: 'clear',   ico: '🔍', txt: 'Clear',   sub: 'Max light, full view' },
      { id: 'tinted',  ico: '🌫️', txt: 'Tinted',  sub: 'Glare down, still see out' },
      { id: 'frosted', ico: '🫧', txt: 'Frosted',  sub: 'Light in, privacy — good for baths/beds' },
    ],
  },
  {
    id: 'finish',
    title: 'Frame finish?',
    sub: 'One finish keeps the whole house consistent.',
    answers: [
      { id: 'black',  ico: '⬛', txt: 'Matte Black', sub: 'Modern, sharp' },
      { id: 'silver', ico: '⬜', txt: 'Silver',      sub: 'Classic aluminium' },
      { id: 'bronze', ico: '🟤', txt: 'Bronze',      sub: 'Warm, premium tone' },
      { id: 'white',  ico: '🤍', txt: 'White',       sub: 'Bright, traditional' },
    ],
  },
  {
    id: 'security',
    title: 'Security level?',
    sub: 'Ground-floor / street-facing windows get anti-burglar mesh.',
    answers: [
      { id: 'low',  ico: '🔓', txt: 'Standard',   sub: 'Upper floor or low-risk street' },
      { id: 'high', ico: '🔒', txt: 'Elevated',   sub: 'Ground floor / street-facing / busy area' },
    ],
  },
];

// ---------- house templates ----------
// Each room: product (sliding|casement|fixed), typical size in cm, qty.
const HOUSE_TEMPLATES = {
  bungalow: [
    { room: 'Kitchen',     ico: '🍳', product: 'sliding',  w: 120, h: 110, qty: 1, security: true  },
    { room: 'Living room', ico: '🛋️', product: 'sliding',  w: 180, h: 130, qty: 1, security: true  },
    { room: 'Bedroom 1',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: true  },
    { room: 'Bedroom 2',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: false },
    { room: 'Bathroom',    ico: '🚿', product: 'casement', w: 80,  h: 100, qty: 1, security: false, forceGlass: 'frosted' },
  ],
  b3: [
    { room: 'Kitchen',     ico: '🍳', product: 'sliding',  w: 120, h: 110, qty: 1, security: true  },
    { room: 'Living room', ico: '🛋️', product: 'sliding',  w: 200, h: 140, qty: 1, security: true  },
    { room: 'Dining room', ico: '🍽️', product: 'fixed',    w: 150, h: 130, qty: 1, security: false },
    { room: 'Master bed',  ico: '🛏️', product: 'casement', w: 140, h: 130, qty: 1, security: false },
    { room: 'Bedroom 2',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: true  },
    { room: 'Bedroom 3',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: true  },
    { room: 'Bathroom',    ico: '🚿', product: 'casement', w: 80,  h: 100, qty: 2, security: false, forceGlass: 'frosted' },
    { room: 'Utility',     ico: '🧺', product: 'fixed',    w: 60,  h: 60,  qty: 1, security: true  },
  ],
  b4: [
    { room: 'Kitchen',     ico: '🍳', product: 'sliding',  w: 140, h: 120, qty: 1, security: true  },
    { room: 'Living room', ico: '🛋️', product: 'sliding',  w: 220, h: 150, qty: 1, security: true  },
    { room: 'Dining room', ico: '🍽️', product: 'fixed',    w: 160, h: 140, qty: 1, security: false },
    { room: 'Master bed',  ico: '🛏️', product: 'casement', w: 150, h: 140, qty: 1, security: false },
    { room: 'Master bath', ico: '🛁', product: 'casement', w: 80,  h: 110, qty: 1, security: false, forceGlass: 'frosted' },
    { room: 'Bedroom 2',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: true  },
    { room: 'Bedroom 3',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: true  },
    { room: 'Bedroom 4',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: false },
    { room: 'Bathroom 2',  ico: '🚿', product: 'casement', w: 80,  h: 100, qty: 1, security: false, forceGlass: 'frosted' },
    { room: 'Utility',     ico: '🧺', product: 'fixed',    w: 60,  h: 60,  qty: 1, security: true  },
  ],
  b5: [
    { room: 'Kitchen',     ico: '🍳', product: 'sliding',  w: 160, h: 130, qty: 1, security: true  },
    { room: 'Living room', ico: '🛋️', product: 'sliding',  w: 240, h: 150, qty: 1, security: true  },
    { room: 'Dining room', ico: '🍽️', product: 'fixed',    w: 180, h: 150, qty: 1, security: false },
    { room: 'Master bed',  ico: '🛏️', product: 'casement', w: 160, h: 150, qty: 1, security: false },
    { room: 'Master bath', ico: '🛁', product: 'casement', w: 90,  h: 120, qty: 1, security: false, forceGlass: 'frosted' },
    { room: 'Bedroom 2',   ico: '🛏️', product: 'casement', w: 130, h: 130, qty: 1, security: true  },
    { room: 'Bedroom 3',   ico: '🛏️', product: 'casement', w: 130, h: 130, qty: 1, security: true  },
    { room: 'Bedroom 4',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: false },
    { room: 'Bedroom 5',   ico: '🛏️', product: 'casement', w: 120, h: 120, qty: 1, security: false },
    { room: 'Guest bath',  ico: '🚿', product: 'casement', w: 80,  h: 110, qty: 1, security: false, forceGlass: 'frosted' },
    { room: 'Media room',  ico: '📺', product: 'fixed',    w: 100, h: 80,  qty: 1, security: false },
    { room: 'Utility',     ico: '🧺', product: 'fixed',    w: 60,  h: 60,  qty: 1, security: true  },
  ],
};

const TIER_FOR = { budget: 'essential', mid: 'comfort', premium: 'premium' };

// ---------- schedule builder ----------
function buildSchedule(answers) {
  const { house, budget, glass, finish, security } = answers;
  const tier = TIER_FOR[budget];
  const template = HOUSE_TEMPLATES[house];

  const rooms = template.map(t => {
    const g = t.forceGlass || glass;
    const area = (t.w / 100) * (t.h / 100);
    const addOns = new Set();
    if (t.security && security === 'high') addOns.add('burglar');

    const price = computePrice({
      product: t.product, area, qty: t.qty,
      tier, glass: g, finish, panels: t.product === 'sliding' ? 2 : 2,
      addOns,
    });

    return {
      room: t.room, ico: t.ico, product: t.product,
      w: t.w, h: t.h, qty: t.qty,
      area: (area * t.qty).toFixed(2),
      glass: g, tier, finish,
      security: t.security && security === 'high',
      addOns: [...addOns],
      price: price.total,
      label: RIKA_CONFIG.pricing.products[t.product].label,
    };
  });

  const total = rooms.reduce((s, r) => s + r.price, 0);
  const totalArea = rooms.reduce((s, r) => s + parseFloat(r.area), 0);
  return { rooms, total, totalArea, tier, finish, house, glass, security };
}

// ---------- preview SVG (same style as quiz) ----------
function miniSVG({ product, glass, finish, w, h }) {
  const pw = Math.min(120, Math.max(60, w * 0.8));
  const ph = Math.min(90, Math.max(50, h * 0.8));
  const frameColor = { black: '#1a1a1a', silver: '#b9c0c7', bronze: '#8a6a4f', white: '#f2f2f2' }[finish] || '#1a1a1a';
  const glassFill = { clear: '#cfe6f5', tinted: '#7f9db5', frosted: '#e8eef2' }[glass] || '#cfe6f5';
  const pad = 4;
  const n = product === 'sliding' ? 2 : (product === 'fixed' ? 1 : 2);
  let mullions = '';
  for (let i = 1; i < n; i++) {
    const x = pad + ((pw - pad * 2) / n) * i;
    mullions += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${ph - pad}" stroke="${frameColor}" stroke-width="2"/>`;
  }
  return `<svg viewBox="0 0 ${pw} ${ph}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${w}x${h} window">
    <rect width="${pw}" height="${ph}" fill="${glassFill}"/>
    <rect width="${pw}" height="${ph}" fill="none" stroke="${frameColor}" stroke-width="${pad * 2}"/>
    ${mullions}
  </svg>`;
}

// ---------- UI ----------
const $ = (s) => document.querySelector(s);
const qBody = $('#flowBody'), qCard = $('#flowCard'), qResult = $('#flowResult');
const qNum = $('#flowQNum'), qTitle = $('#flowQTitle'), qSub = $('#flowQSub'), qAnswers = $('#flowAnswers');
const pBar = $('#flowProgressBar');

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
  pBar.style.width = `${(idx / QUESTIONS.length) * 100}%`;

  for (const a of q.answers) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'flow-answer';
    btn.innerHTML = `<span class="fa-ico">${a.ico}</span><span class="fa-txt">${a.txt}<span class="fa-sub">${a.sub}</span></span>`;
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
  const sch = buildSchedule(answers);
  const { rooms, total, totalArea } = sch;
  const tierLabel = RIKA_CONFIG.pricing.tiers[sch.tier].label;

  // schedule table
  const tbody = $('#scheduleBody');
  tbody.innerHTML = '';
  let runningTotal = 0;
  for (const r of rooms) {
    runningTotal += r.price;
    const tr = document.createElement('tr');
    const addOnTxt = r.addOns.length ? ' + ' + r.addOns.map(id => RIKA_CONFIG.pricing.addOns[id].label.split(' ')[0]).join(', ') : '';
    tr.innerHTML = `
      <td><span class="sched-ico">${r.ico}</span> ${r.room}</td>
      <td>${r.label}</td>
      <td>${r.w} × ${r.h} cm${r.qty > 1 ? ` × ${r.qty}` : ''}</td>
      <td>${r.area} m²</td>
      <td>${GLASS[r.glass].label}</td>
      <td class="sched-price">${formatKsh(r.price)}${addOnTxt}</td>
      <td class="sched-sec">${r.security ? '🛡️' : ''}</td>
    `;
    tbody.appendChild(tr);
  }

  // totals
  $('#totRooms').textContent = rooms.length;
  $('#totArea').textContent = totalArea.toFixed(1) + ' m²';
  $('#totPrice').textContent = formatKsh(total);
  $('#totRange').textContent = formatRange(total);

  // summary facts
  $('#sumTier').textContent = tierLabel;
  $('#sumFinish').textContent = FINISHES[sch.finish].label;
  $('#sumGlass').textContent = GLASS[sch.glass].label + ' (default)';
  $('#sumSecurity').textContent = sch.security === 'high' ? 'Elevated — anti-burglar on ground floor' : 'Standard';

  // register snapshot for Save My Design
  if (window.__rikaSetDesignSnapshot) {
    window.__rikaSetDesignSnapshot(() => ({
      product: rooms[0]?.product || 'sliding',
      finish: sch.finish,
      glass: sch.glass,
      panels: 2,
      tier: sch.tier,
      width_cm: rooms[0]?.w || 120,
      height_cm: rooms[0]?.h || 120,
      quantity: rooms.reduce((s, r) => s + r.qty, 0),
      addOns: rooms.filter(r => r.security).length ? ['burglar'] : [],
      estimate_low: Math.round(total * 0.92),
      estimate_high: Math.round(total * 1.08),
      summaryHtml: `<strong>${rooms.length} rooms</strong> · ${totalArea.toFixed(1)} m² · ${tierLabel} · ${FINISHES[sch.finish].label}`,
    }));
  }

  // WhatsApp CTA
  const houseLabel = { bungalow: 'a bungalow', b3: 'a 3-bedroom house', b4: 'a 4-bedroom house', b5: 'a 5+ bedroom house' }[sch.house];
  const waText =
    `Hi Rika! I just used "Build My House Windows".\n` +
    `House: ${houseLabel}\n` +
    `Rooms: ${rooms.length} windows/doors · ${totalArea.toFixed(1)} m²\n` +
    `Tier: ${tierLabel} · ${FINISHES[sch.finish].label} frame\n` +
    `Est. total: ${formatKsh(total)} (${formatRange(total)})\n` +
    `Can I get an exact quote with a free measurement?`;
  $('#flowWa').href = waLink(waText);

  // quote CTA (prefilled with first room + total qty)
  const first = rooms[0];
  $('#flowQuote').href =
    `/rika/tools/quotation/?type=${first?.product || 'sliding'}&w=${first?.w || 120}&h=${first?.h || 120}` +
    `&qty=${rooms.reduce((s, r) => s + r.qty, 0)}&tier=${sch.tier}&from=house-flow`;

  qCard.hidden = true;
  qResult.hidden = false;
  pBar.style.width = '100%';
}

$('#flowRestart').addEventListener('click', () => {
  idx = 0;
  for (const k in answers) delete answers[k];
  renderQuestion();
});

renderQuestion();

// ============================================================
// Rika — "Your House, Your Windows" (T-B3-05 / DESIGN-3)
// House-selection experience: pick a house → style + frame
// colour + glass → live before/after SVG slider + price from
// the shared pricing engine. Deterministic, all on-device.
// ============================================================
import { computePrice, formatKsh, formatRange, waLink, GLASS, FINISHES } from '../../shared/js/rika-price.js';

// ---------- options ----------
const STYLES = [
  { id: 'sliding',  ico: '↔️', txt: 'Sliding'  },
  { id: 'casement', ico: '↔',  txt: 'Casement' },
  { id: 'fixed',    ico: '▢',  txt: 'Fixed'    },
];
const FINISHES_OPT = [
  { id: 'black',  sw: '#1a1a1a', txt: 'Matte Black' },
  { id: 'silver', sw: '#b9c0c7', txt: 'Silver' },
  { id: 'bronze', sw: '#8a6a4f', txt: 'Bronze' },
  { id: 'white',  sw: '#f2f2f2', txt: 'White' },
];
const GLASSES_OPT = [
  { id: 'clear',   txt: 'Clear'   },
  { id: 'tinted',  txt: 'Tinted'  },
  { id: 'frosted', txt: 'Frosted' },
];

const GLASS_FILL = { clear: '#cfe6f5', tinted: '#7f9db5', frosted: '#e8eef2' };
const FRAME = { black: '#1a1a1a', silver: '#b9c0c7', bronze: '#8a6a4f', white: '#f2f2f2' };
const OLD_FRAME = '#7a5c3e';
const OLD_GLASS = '#a8987c';

// ---------- house scenes (viewBox 0 0 800 460) ----------
// Each house: facade (before = after background) + window slots.
// slot: x, y, w, h (in viewBox units), typicalSize (cm) for pricing.
const HOUSES = {
  bungalow: {
    label: 'Bungalow', ico: '🏠',
    area: [100, 240, 600, 180],          // wall
    roof: [[80, 240], [400, 130], [720, 240]],
    door: [370, 320, 60, 100],
    windows: [
      { id: 'w1', x: 140, y: 285, w: 110, h: 95, size: [120, 110] },
      { id: 'w2', x: 300, y: 285, w: 110, h: 95, size: [140, 120] },
      { id: 'w3', x: 550, y: 285, w: 110, h: 95, size: [120, 110] },
    ],
    rooms: '5 openings',
  },
  b3: {
    label: '3-bedroom', ico: '🏡',
    area: [80, 180, 640, 240],
    roof: [[60, 180], [400, 60], [740, 180]],
    door: [370, 320, 60, 100],
    windows: [
      { id: 'g1', x: 110, y: 215, w: 90, h: 75, size: [100, 90] },
      { id: 'g2', x: 240, y: 215, w: 90, h: 75, size: [100, 90] },
      { id: 'g3', x: 470, y: 215, w: 90, h: 75, size: [100, 90] },
      { id: 'g4', x: 600, y: 215, w: 90, h: 75, size: [100, 90] },
      { id: 'w1', x: 110, y: 330, w: 120, h: 95, size: [140, 120] },
      { id: 'w2', x: 260, y: 330, w: 120, h: 95, size: [160, 130] },
      { id: 'w3', x: 520, y: 330, w: 120, h: 95, size: [140, 120] },
    ],
    rooms: '7 openings',
  },
  b5: {
    label: '5-bedroom', ico: '🏰',
    area: [60, 140, 680, 280],
    roof: [[40, 140], [400, 40], [760, 140]],
    door: [370, 320, 60, 100],
    windows: [
      { id: 'a1', x: 100, y: 170, w: 80, h: 65, size: [90, 80] },
      { id: 'a2', x: 220, y: 170, w: 80, h: 65, size: [90, 80] },
      { id: 'a3', x: 340, y: 170, w: 80, h: 65, size: [90, 80] },
      { id: 'a4', x: 460, y: 170, w: 80, h: 65, size: [90, 80] },
      { id: 'a5', x: 580, y: 170, w: 80, h: 65, size: [90, 80] },
      { id: 'w1', x: 100, y: 320, w: 120, h: 100, size: [160, 130] },
      { id: 'w2', x: 250, y: 320, w: 120, h: 100, size: [180, 140] },
      { id: 'w3', x: 430, y: 320, w: 120, h: 100, size: [160, 130] },
      { id: 'w4', x: 580, y: 320, w: 120, h: 100, size: [140, 120] },
    ],
    rooms: '9 openings',
  },
};

// ---------- state ----------
const state = { house: 'b3', style: 'sliding', finish: 'black', glass: 'clear' };

// ---------- SVG builders ----------
function windowSVG(x, y, w, h, { style, finish, glass, old = false }) {
  const frame = old ? OLD_FRAME : FRAME[finish];
  const fill = old ? OLD_GLASS : GLASS_FILL[glass];
  const pad = old ? 3 : Math.max(4, Math.round(w * 0.045));
  let inner = '';
  if (!old) {
    let n = 1;
    if (style === 'sliding') n = 2;
    if (style === 'casement') n = 2;
    // mullions between panels
    for (let i = 1; i < n; i++) {
      const mx = x + pad + ((w - pad * 2) / n) * i;
      inner += `<line x1="${mx}" y1="${y + pad}" x2="${mx}" y2="${y + h - pad}" stroke="${frame}" stroke-width="3"/>`;
    }
    // handle for casement (right side), slide rail for sliding (bottom)
    if (style === 'casement') {
      const hx = x + w - pad - 5;
      inner += `<circle cx="${hx}" cy="${y + h / 2}" r="3.5" fill="${frame}"/>`;
    }
    if (style === 'sliding') {
      const rx = x + w / 2;
      inner += `<line x1="${x + pad}" y1="${y + h - pad - 3}" x2="${x + w - pad}" y2="${y + h - pad - 3}" stroke="${frame}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
    }
  } else {
    // old window: simple cross mullion, dirty look
    inner += `<line x1="${x + w / 2}" y1="${y + pad}" x2="${x + w / 2}" y2="${y + h - pad}" stroke="${OLD_FRAME}" stroke-width="3"/>`;
    inner += `<line x1="${x + pad}" y1="${y + h / 2}" x2="${x + w - pad}" y2="${y + h / 2}" stroke="${OLD_FRAME}" stroke-width="3"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${frame}" stroke-width="${old ? 5 : pad * 1.6}"/>
    ${inner}
    ${old ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000" opacity="0.08"/>` : ''}`;
}

function houseScene(house, { old = false }) {
  const H = HOUSES[house];
  const [ax, ay, aw, ah] = H.area;
  const [dx, dy, dw, dh] = H.door;
  let s = '';
  // sky + ground
  s += `<rect width="800" height="460" fill="#0d1117"/>`;
  s += `<rect y="400" width="800" height="60" fill="#161b22"/>`;
  // roof
  s += `<polygon points="${H.roof.map(p => p.join(',')).join(' ')}" fill="#1c222b"/>`;
  // wall
  s += `<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="#2a313c" stroke="#3a4250" stroke-width="2"/>`;
  // door
  s += `<rect x="${dx}" y="${dy}" width="${dw}" height="${dh}" fill="#3d2f22"/>`;
  s += `<circle cx="${dx + dw - 12}" cy="${dy + dh / 2}" r="3" fill="#b9c0c7"/>`;
  // windows
  for (const w of H.windows) {
    if (old) {
      s += windowSVG(w.x, w.y, w.w, w.h, { style: 'fixed', finish: state.finish, glass: 'clear', old: true });
    } else {
      s += windowSVG(w.x, w.y, w.w, w.h, { style: state.style, finish: state.finish, glass: state.glass });
    }
  }
  return `<svg viewBox="0 0 800 460" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${H.label} ${old ? 'before' : 'after'}">${s}</svg>`;
}

// ---------- price (from shared engine) ----------
function housePackage() {
  const H = HOUSES[state.house];
  // count windows per style for a representative unit price
  const byStyle = {};
  for (const w of H.windows) byStyle[state.style] = (byStyle[state.style] || 0) + 1;
  const qty = H.windows.length;
  // representative m² = avg of slot sizes in the chosen style's typical size
  const sizes = H.windows.map(w => (w.size[0] / 100) * (w.size[1] / 100));
  const avgM2 = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const area = avgM2 * qty;

  const p = computePrice({
    product: state.style,
    area,
    qty,
    finish: state.finish,
    glass: state.glass,
    tier: 'comfort',
    addOns: state.glass === 'frosted' ? ['frosted'] : state.glass === 'tinted' ? ['tint'] : [],
  });
  return { total: p.total, area, qty };
}

// ---------- render ----------
const $ = (s) => document.querySelector(s);
function renderAll() {
  const H = HOUSES[state.house];
  $('#layerBefore').innerHTML = houseScene(state.house, { old: true });
  $('#layerAfter').innerHTML = houseScene(state.house, { old: false });

  const pkg = housePackage();
  $('#priceEst').textContent = formatKsh(pkg.total);
  $('#priceRange').textContent = formatRange(pkg.total);
  $('#priceFacts').innerHTML = [
    `<li><strong>${H.label}</strong> · ${H.rooms}</li>
     <li><strong>${STYLES.find(s => s.id === state.style).txt}</strong> windows · ${pkg.qty} units</li>
     <li><strong>${FINISHES[state.finish]?.label || state.finish}</strong> frame · ${GLASS[state.glass].label} glass</li>
     <li>≈ <strong>${pkg.area.toFixed(1)} m²</strong> of glazing</li>`,
  ].join('');

  const wa = waLink(
    `Hi Rika! I tried "Your House, Your Windows".\n` +
    `House: ${H.label}\nWindows: ${STYLES.find(s => s.id === state.style).txt} × ${pkg.qty}\n` +
    `Frame: ${FINISHES[state.finish]?.label || state.finish} · Glass: ${GLASS[state.glass].label}\n` +
    `Est. total: ${formatKsh(pkg.total)} (${formatRange(pkg.total)})\n` +
    `Can I book a free measurement?`
  );
  $('#ctaWa').href = wa;
  const first = H.windows[0];
  $('#ctaQuote').href =
    `/rika/tools/quotation/?type=${state.style}&w=${first.size[0]}&h=${first.size[1]}` +
    `&qty=${pkg.qty}&tier=comfort&from=house-windows`;
}

// ---------- chips ----------
function buildChips(el, opts, key, withSwatch) {
  el.innerHTML = '';
  for (const o of opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hw-chip' + (state[key] === o.id ? ' active' : '');
    b.innerHTML = (withSwatch ? `<span class="hw-swatch" style="background:${o.sw}"></span>` : '') +
      `<span>${o.ico || ''}${o.txt}</span>`;
    b.addEventListener('click', () => {
      state[key] = o.id;
      renderAll();
    });
    el.appendChild(b);
  }
}

// ---------- house cards ----------
function buildHouses() {
  const g = $('#houseGrid');
  g.innerHTML = '';
  for (const id of Object.keys(HOUSES)) {
    const H = HOUSES[id];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'hw-house-card' + (state.house === id ? ' active' : '');
    card.innerHTML = `<span class="hw-house-ico">${H.ico}</span><span class="hw-house-name">${H.label}</span><span class="hw-house-sub">${H.rooms}</span>`;
    card.addEventListener('click', () => {
      state.house = id;
      renderAll();
    });
    g.appendChild(card);
  }
}

// ---------- slider ----------
function setSplit(pct) {
  $('#splitLine').style.left = pct + '%';
  $('#layerAfter').style.clipPath = `inset(0 0 0 ${pct}%)`;
  $('#handle').style.left = pct + '%';
}
function initSlider() {
  const range = $('#hwRange');
  const stage = $('#stage');
  const move = (clientX) => {
    const r = stage.getBoundingClientRect();
    let pct = ((clientX - r.left) / r.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    range.value = pct;
    setSplit(pct);
  };
  range.addEventListener('input', () => setSplit(parseFloat(range.value)));
  stage.addEventListener('pointerdown', (e) => {
    move(e.clientX);
    const mv = (e2) => move(e2.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  });
  setSplit(50);
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  buildHouses();
  buildChips($('#styleChips'), STYLES, 'style');
  buildChips($('#finishChips'), FINISHES_OPT, 'finish', true);
  buildChips($('#glassChips'), GLASSES_OPT, 'glass');
  initSlider();
  renderAll();
});

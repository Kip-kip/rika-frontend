// ============================================================
// Rika — Window Design Studio (T-B3-01 / DESIGN-1)
// Parametric front-facing window/door editor with a live SVG
// preview and live pricing. All rates from rika-config.js via
// shared/js/rika-price.js. No AI, no uploads — deterministic.
// ============================================================
import {
  computePrice, GLASS, FINISHES, PANELS, panelsFactor,
  PRICING, formatKsh, formatRange, waLink,
} from '../../../shared/js/rika-price.js';

const SWATCH = { black: '#1c1c1c', silver: '#c9ced6', bronze: '#7a5b3a', white: '#f4f4f4' };
const FRAME = { black: '#23262b', silver: '#aeb6c2', bronze: '#8a6a45', white: '#e9ebee' };
const FRAME_DARK = { black: '#14161a', silver: '#7d8592', bronze: '#5f4a32', white: '#b9bec6' };

const OPENINGS = {
  sliding:  { label: 'Sliding', sub: 'panels glide on a track' },
  casement: { label: 'Casement', sub: 'hinged sash opens out/in' },
  fixed:    { label: 'Fixed', sub: 'no opening — pure glass' },
  hinged:   { label: 'Hinged door', sub: 'pivot on one side' },
};

const state = {
  type: 'window',        // window | door
  product: 'sliding',    // config product key (sliding|casement|fixed)
  w: 120,
  h: 100,
  panels: 2,
  finish: 'black',
  glass: 'clear',
  opening: 'sliding',
  tier: null,
  qty: 1,
  addOns: new Set(),
};

const $ = (id) => document.getElementById(id);

// ---- chips ----
function buildChips(boxId, entries, key, render) {
  const box = $(boxId);
  box.innerHTML = '';
  for (const [id, item] of Object.entries(entries)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (state[key] === id ? ' selected' : '');
    btn.innerHTML = render(id, item);
    btn.addEventListener('click', () => {
      if (key === 'product' && item.opening) {
        state.product = id;
        if (item.opening) state.opening = item.opening;
      } else {
        state[key] = id;
      }
      syncTypeFromProduct();
      refreshChips();
      recompute();
      renderPreview();
    });
    box.appendChild(btn);
  }
}

function syncTypeFromProduct() {
  // if the user picked a product, infer the opening default
  const map = { sliding: 'sliding', casement: 'casement', fixed: 'fixed' };
  if (map[state.product] && !state._openingTouched) state.opening = map[state.product];
}

function refreshChips() {
  [['typeRow','type'], ['panelRow','panels'], ['finishRow','finish'],
   ['glassRow','glass'], ['openingRow','opening'], ['tierRow','tier']]
    .forEach(([boxId, key]) => {
      const box = $(boxId);
      if (!box) return;
      box.querySelectorAll('.chip').forEach((c) => {
        const id = c.dataset.id;
        const cur = key === 'panels' ? Number(id) : id;
        c.classList.toggle('selected', cur === state[key]);
      });
    });
}

// ---- pricing ----
function currentPrice() {
  const area = (state.w / 100) * (state.h / 100);
  return computePrice({
    product: state.product,
    area,
    qty: state.qty,
    finish: state.finish,
    glass: state.glass,
    panels: state.panels,
    tier: state.tier,
    addOns: [...state.addOns],
  });
}

function recompute() {
  const area = (state.w / 100) * (state.h / 100);
  const p = currentPrice();
  $('areaChip').textContent = area.toFixed(2) + ' m²';
  $('pArea').textContent = area.toFixed(2) + ' m²';
  $('pQty').textContent = state.qty;
  $('pTotal').textContent = formatKsh(p.total);
  $('pRange').textContent = formatRange(p.total);
  $('stageCap').textContent = `${state.w}×${state.h}cm · ${OPENINGS[state.opening].label}`;
  // wire CTAs
  updateCTAs(p);
}

function updateCTAs(p) {
  const params = new URLSearchParams({ from: 'design-studio' });
  if (state.tier) params.set('tier', state.tier);
  else params.set('type', state.product);
  params.set('w', String(state.w));
  params.set('h', String(state.h));
  params.set('qty', String(state.qty));
  params.set('finish', state.finish);
  params.set('glass', state.glass);
  if (state.addOns.size) params.set('addons', [...state.addOns].join(','));
  params.set('est', String(Math.round(p.total)));
  $('quoteBtn').href = `/rika/tools/quotation/?${params.toString()}`;

  const lines = [
    'Hi Rika! I designed a window in your Design Studio:',
    `• Type: ${state.type} · ${OPENINGS[state.opening].label}`,
    `• Size: ${state.w} × ${state.h} cm (${((state.w/100)*(state.h/100)).toFixed(2)} m²)`,
    `• Panels: ${state.panels} · Finish: ${state.finish}`,
    `• Glass: ${state.glass}`,
    `• Qty: ${state.qty}`,
    `• Estimate: ${formatRange(p.total)}`,
    "I'd like a firm quote / free measurement.",
  ];
  if (state.addOns.size) lines.splice(7, 0, `• Extras: ${[...state.addOns].join(', ')}`);
  $('waBtn').href = waLink(lines.join('\n'));
}

// ---- live SVG preview ----
function renderPreview() {
  const box = $('stageBox');
  const W = Math.max(30, state.w);
  const H = Math.max(30, state.h);
  const AW = 800, AH = 500; // viewBox — scales with the big preview box
  const avail = Math.min(AW, AH) * 0.82, offX = (AW - avail) / 2, offY = (AH - avail) / 2;
  let fw, fh;
  if (W / H >= 1) { fw = avail; fh = Math.max(48, Math.round(avail * H / W)); }
  else { fh = avail; fw = Math.max(48, Math.round(avail * W / H)); }
  fw = Math.min(fw, avail); fh = Math.min(fh, avail);
  const fx = offX + (avail - fw) / 2, fy = offY + (avail - fh) / 2;
  const col = FRAME[state.finish] || FRAME.black;
  const colD = FRAME_DARK[state.finish] || FRAME_DARK.black;
  const mull = Math.max(7, Math.round(fw * 0.035));
  const inner = { x: fx + mull, y: fy + mull, w: fw - 2 * mull, h: fh - 2 * mull };
  const isDoor = state.type === 'door';
  const isCasement = state.opening === 'casement';
  const isHinged = state.opening === 'hinged';

  let mullions = '';
  const panels = (isDoor || state.opening === 'fixed') ? 1 : state.panels;
  if (panels > 1) {
    const step = inner.w / panels;
    for (let i = 1; i < panels; i++) {
      const mx = inner.x + step * i;
      mullions += `<line x1="${mx.toFixed(1)}" y1="${inner.y}" x2="${mx.toFixed(1)}" y2="${(inner.y + inner.h).toFixed(1)}" stroke="${col}" stroke-width="${(mull * 0.7).toFixed(1)}"/>`;
    }
  }

  let bars = '';
  if (state.addOns.has('burglar')) {
    const n = Math.max(4, Math.round(inner.w / 42));
    const step = inner.w / n;
    for (let i = 0; i <= n; i++) {
      const bx = inner.x + step * i;
      bars += `<line x1="${bx.toFixed(1)}" y1="${inner.y}" x2="${bx.toFixed(1)}" y2="${(inner.y + inner.h).toFixed(1)}" stroke="#0e1116" stroke-width="2" opacity="0.85"/>`;
    }
    const my = inner.y + inner.h / 2;
    bars += `<line x1="${inner.x}" y1="${my.toFixed(1)}" x2="${(inner.x + inner.w).toFixed(1)}" y2="${my.toFixed(1)}" stroke="#0e1116" stroke-width="2" opacity="0.85"/>`;
  }

  let glassFx = '';
  if (state.glass === 'frosted') glassFx = `<rect x="${inner.x}" y="${inner.y}" width="${inner.w}" height="${inner.h}" fill="url(#frostedFill)" opacity="0.92"/>`;
  else if (state.glass === 'light' || state.glass === 'dark') glassFx = `<rect x="${inner.x}" y="${inner.y}" width="${inner.w}" height="${inner.h}" fill="url(#tintFill)"/>`;

  // opening indicators
  let openingMarks = '';
  if (isHinged) {
    // hinge on the left, handle on the right
    openingMarks += `<rect x="${(fx + mull / 2).toFixed(1)}" y="${(fy + fh / 2 - 24).toFixed(1)}" width="3" height="48" rx="1.5" fill="${colD}"/>`;
    openingMarks += `<rect x="${(fx + fw - mull - 10).toFixed(1)}" y="${(fy + fh / 2 - 18).toFixed(1)}" width="5" height="36" rx="2" fill="${colD}"/>`;
  } else if (isCasement) {
    // a diagonal line showing the sash hinged at the outer edge
    const hingeX = inner.x + inner.w * 0.85;
    openingMarks += `<line x1="${hingeX.toFixed(1)}" y1="${inner.y}" x2="${(inner.x + inner.w * 0.15).toFixed(1)}" y2="${(inner.y + inner.h).toFixed(1)}" stroke="${colD}" stroke-width="3" opacity="0.6"/>`;
  } else if (state.opening === 'sliding' && state.panels > 1) {
    // a track line under the sliding panels
    openingMarks += `<line x1="${inner.x}" y1="${(inner.y + inner.h + mull / 2).toFixed(1)}" x2="${(inner.x + inner.w).toFixed(1)}" y2="${(inner.y + inner.h + mull / 2).toFixed(1)}" stroke="${colD}" stroke-width="2" opacity="0.5"/>`;
  }

  const label = `${W}×${H}cm`;
  box.innerHTML = `
  <svg viewBox="0 0 ${AW} ${AH}" width="100%" height="100%" role="img" aria-label="Design preview">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d24"/><stop offset="1" stop-color="#0e1015"/></linearGradient>
      <linearGradient id="clearGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe3ff" stop-opacity="0.5"/><stop offset="1" stop-color="#7db6e8" stop-opacity="0.18"/></linearGradient>
      <linearGradient id="tintFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a2a" stop-opacity="0.85"/><stop offset="1" stop-color="#2a2119" stop-opacity="0.9"/></linearGradient>
      <linearGradient id="frostedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f6" stop-opacity="0.92"/><stop offset="1" stop-color="#cfd6dd" stop-opacity="0.9"/></linearGradient>
      <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="${AW}" height="${AH}" fill="url(#wallGrad)"/>
    <ellipse cx="200" cy="${(fy + fh + 10).toFixed(1)}" rx="${(fw * 0.55).toFixed(1)}" ry="10" fill="url(#shadow)"/>
    <rect x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="4" fill="#0e1116" stroke="${colD}" stroke-width="3"/>
    <rect x="${(fx + mull / 2).toFixed(1)}" y="${(fy + mull / 2).toFixed(1)}" width="${(fw - mull).toFixed(1)}" height="${(fh - mull).toFixed(1)}" rx="2" fill="none" stroke="${col}" stroke-width="2" opacity="0.5"/>
    <rect x="${inner.x.toFixed(1)}" y="${inner.y.toFixed(1)}" width="${inner.w.toFixed(1)}" height="${inner.h.toFixed(1)}" fill="url(#clearGlass)"/>
    ${mullions}
    ${glassFx}
    <polygon points="${(inner.x + inner.w * 0.15).toFixed(1)},${inner.y.toFixed(1)} ${(inner.x + inner.w * 0.35).toFixed(1)},${inner.y.toFixed(1)} ${(inner.x + inner.w * 0.05).toFixed(1)},${(inner.y + inner.h).toFixed(1)} ${(inner.x - inner.w * 0.02).toFixed(1)},${(inner.y + inner.h).toFixed(1)}" fill="#ffffff" opacity="0.05"/>
    ${openingMarks}
    ${bars}
    <text x="${AW / 2}" y="${AH - 14}" text-anchor="middle" fill="#7d8592" font-size="16" font-family="system-ui, sans-serif">${label}</text>
  </svg>`;
}

// ---- snapshot for Save My Design ----
function registerSnapshot() {
  if (window.__rikaSetDesignSnapshot) {
    window.__rikaSetDesignSnapshot(() => {
      const p = currentPrice();
      return {
        product: state.product,
        finish: state.finish,
        glass: state.glass,
        panels: state.panels,
        opening: state.opening,
        tier: state.tier,
        width_cm: state.w,
        height_cm: state.h,
        quantity: state.qty,
        addOns: [...state.addOns],
        estimate_low: Math.round(p.total * 0.92),
        estimate_high: Math.round(p.total * 1.08),
        summaryHtml: `<strong>${state.w}×${state.h}cm</strong> · ${OPENINGS[state.opening].label} · ${state.panels} panels · ${state.glass} glass · ${state.finish} finish · qty ${state.qty}`,
      };
    });
  }
}

// ---- init ----
function init() {
  // Type
  const typeBox = $('typeRow');
  [['window', '🪟 Window'], ['door', '🚪 Door']].forEach(([id, lbl]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (state.type === id ? ' selected' : '');
    b.dataset.id = id;
    b.innerHTML = lbl;
    b.addEventListener('click', () => {
      state.type = id;
      state._openingTouched = false;
      if (id === 'door') { state.product = 'sliding'; state.opening = 'hinged'; }
      else {
        state.product = state.product === 'hinged' ? 'sliding' : state.product;
        state.opening = state.product === 'fixed' ? 'fixed' : (state.product === 'casement' ? 'casement' : 'sliding');
      }
      refreshType();
      recompute();
      renderPreview();
    });
    typeBox.appendChild(b);
  });

  // Product
  const prodBox = $('panelRow'); // reuse? no — we need a separate row for product. Actually we didn't add a product row in HTML. Let's use the opening row for product inference. Skip product chips; type + opening drives it.

  // Panels
  buildChips('panelRow', PANELS, 'panels', (id) => id);
  // Finish
  buildChips('finishRow', FINISHES, 'finish', (id, f) => `<span class="swatch" style="background:${SWATCH[id]}"></span>${f.label}`);
  // Glass
  buildChips('glassRow', GLASS, 'glass', (id, g) => `${g.label} ${g.price ? `<small>+${formatKsh(g.price)}/u</small>` : '<small>included</small>'}`);
  // Opening
  buildChips('openingRow', OPENINGS, 'opening', (id, o) => `${o.label}<small>${o.sub}</small>`);
  // Tier
  const tierEntries = { '': { label: '— per product rate —' } };
  for (const [k, t] of Object.entries(PRICING.tiers)) tierEntries[k] = t;
  buildChips('tierRow', tierEntries, 'tier', (id, t) => t.label + (t.badge ? `<small>${t.badge}</small>` : ''));
  // Add-ons
  const addonBox = $('addonBox');
  for (const [id, a] of Object.entries(PRICING.addOns)) {
    const lbl = document.createElement('label');
    lbl.className = 'addon';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = id;
    cb.addEventListener('change', () => {
      if (cb.checked) state.addOns.add(id); else state.addOns.delete(id);
      recompute();
      renderPreview();
    });
    const name = document.createElement('span');
    name.textContent = a.label;
    const price = document.createElement('span');
    price.className = 'addon-price';
    price.textContent = a.price === 0 ? 'Free' : formatKsh(a.price);
    lbl.append(cb, name, price);
    addonBox.appendChild(lbl);
  }

  // Qty
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number'; qtyInput.min = '1'; qtyInput.max = '50'; qtyInput.value = '1';
  qtyInput.id = 'qty';
  qtyInput.addEventListener('input', () => { state.qty = Math.max(1, parseInt(qtyInput.value, 10) || 1); recompute(); });

  // W / H
  ['wCm', 'hCm'].forEach((id, idx) => {
    $(id).addEventListener('input', () => {
      const v = parseInt($(id).value, 10);
      if (idx === 0) state.w = Math.max(30, Math.min(400, v || 30));
      else state.h = Math.max(30, Math.min(300, v || 30));
      recompute();
      renderPreview();
    });
  });

  // URL pre-fill
  const usp = new URLSearchParams(location.search);
  const w = parseInt(usp.get('w'), 10); const h = parseInt(usp.get('h'), 10);
  const q = parseInt(usp.get('qty'), 10);
  if (w >= 30 && w <= 400) { state.w = w; $('wCm').value = w; }
  if (h >= 30 && h <= 300) { state.h = h; $('hCm').value = h; }
  if (q >= 1 && q <= 50) { state.qty = q; }
  const tier = usp.get('tier'); if (tier && PRICING.tiers[tier]) state.tier = tier;
  const type = usp.get('type'); if (type && PRICING.products[type]) state.product = type;

  refreshChips();
  recompute();
  renderPreview();
  registerSnapshot();

  // burger
  const burger = $('menuBtn');
  if (burger) burger.addEventListener('click', () => {
    document.querySelector('.nav').classList.toggle('open');
    burger.classList.toggle('open');
  });
}

function refreshType() {
  $('typeRow').querySelectorAll('.chip').forEach((c) => c.classList.toggle('selected', c.dataset.id === state.type));
}

document.addEventListener('DOMContentLoaded', init);

// ============================================================
// Rika — on-page configurator (T-B2-03)
// Reads the page's data-cat / data-slug, builds a live price
// configurator, and recomputes on every change. Pure pricing
// comes from shared/js/rika-price.js (which wraps rika-config.js).
// ============================================================
import {
  computePrice, GLASS, FINISHES, PANELS, panelsFactor,
  PRICING, formatKsh, formatRange, waLink, rateForStyle,
} from '../../shared/js/rika-price.js';

const SWATCH = { black: '#1c1c1c', silver: '#c9ced6', bronze: '#7a5b3a', white: '#f4f4f4' };
const FRAME = { black: '#23262b', silver: '#aeb6c2', bronze: '#8a6a45', white: '#e9ebee' };
const FRAME_DARK = { black: '#14161a', silver: '#7d8592', bronze: '#5f4a32', white: '#b9bec6' };

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export function initConfigurator(opts = {}) {
  const root = document.getElementById('confRoot');
  if (!root) return;
  const cat = root.dataset.cat;
  const slug = root.dataset.slug;
  const styleLabel = (opts.label || (cat + ' ' + slug)).replace(/^./, (c) => c.toUpperCase());

  const state = {
    product: null,      // set to a config product key below
    finish: 'black',
    glass: 'clear',
    panels: 2,
    w: 120,
    h: 100,
    qty: 1,
    addOns: new Set(),
  };

  // map this style to a config product for the base rate
  const m2 = rateForStyle(cat, slug);
  const baseProduct = Object.entries(PRICING.products).find(([, p]) => p.unitPrice === m2)?.[0] || 'sliding';
  state.product = baseProduct;

  // ---- build DOM ----
  const wrap = el('div', 'conf-wrap');

  // LEFT: controls
  const left = el('div', 'conf-left');

  const productGroup = el('div', 'conf-group');
  productGroup.append(el('div', 'conf-label', 'This style'));
  const styleChip = el('button', 'chip selected', `<span>${styleLabel}</span><small>${formatKsh(m2)}/m²</small>`);
  const productChips = el('div', 'chips');
  productChips.append(styleChip);
  productGroup.append(productChips);
  left.append(productGroup);

  // Finish
  const finishGroup = el('div', 'conf-group');
  finishGroup.append(el('div', 'conf-label', 'Frame finish'));
  const finishChips = el('div', 'chips');
  for (const [id, f] of Object.entries(FINISHES)) {
    const c = el('button', 'chip' + (state.finish === id ? ' selected' : ''),
      `<span class="swatch" style="background:${SWATCH[id]}"></span>${f.label}`);
    c.addEventListener('click', () => {
      state.finish = id;
      finishChips.querySelectorAll('.chip').forEach((x) => x.classList.remove('selected'));
      c.classList.add('selected');
      recompute();
    });
    finishChips.append(c);
  }
  finishGroup.append(finishChips);
  left.append(finishGroup);

  // Glass
  const glassGroup = el('div', 'conf-group');
  glassGroup.append(el('div', 'conf-label', 'Glass'));
  const glassChips = el('div', 'chips');
  for (const [id, g] of Object.entries(GLASS)) {
    const sub = g.price ? `<small>+${formatKsh(g.price)}/u</small>` : `<small>included</small>`;
    const c = el('button', 'chip' + (state.glass === id ? ' selected' : ''), `${g.label} ${sub}`);
    c.addEventListener('click', () => {
      state.glass = id;
      glassChips.querySelectorAll('.chip').forEach((x) => x.classList.remove('selected'));
      c.classList.add('selected');
      recompute();
    });
    glassChips.append(c);
  }
  glassGroup.append(glassChips);
  left.append(glassGroup);

  // Panels
  const panelGroup = el('div', 'conf-group');
  panelGroup.append(el('div', 'conf-label', 'Panels / sections'));
  const panelChips = el('div', 'chips');
  for (const [n, lbl] of Object.entries(PANELS)) {
    const c = el('button', 'chip' + (state.panels === Number(n) ? ' selected' : ''), lbl);
    c.addEventListener('click', () => {
      state.panels = Number(n);
      panelChips.querySelectorAll('.chip').forEach((x) => x.classList.remove('selected'));
      c.classList.add('selected');
      recompute();
    });
    panelChips.append(c);
  }
  panelGroup.append(panelChips);
  left.append(panelGroup);

  // Dimensions
  const dimGroup = el('div', 'conf-group');
  dimGroup.append(el('div', 'conf-label', 'Dimensions (per unit)'));
  const dimRow = el('div', 'dim-row');
  const wField = el('div', 'dim-field',
    `<label>W</label><input id="confW" type="number" min="30" max="400" step="1" value="120" inputmode="numeric"><span>cm</span>`);
  const hField = el('div', 'dim-field',
    `<label>H</label><input id="confH" type="number" min="30" max="300" step="1" value="100" inputmode="numeric"><span>cm</span>`);
  dimRow.append(wField, hField);
  dimGroup.append(dimRow, el('div', 'area-chip', 'Area: — m²'));
  left.append(dimGroup);

  // Quantity
  const qtyGroup = el('div', 'conf-group');
  qtyGroup.append(el('div', 'conf-label', 'Quantity'));
  const qtyRow = el('div', 'dim-row');
  const qtyField = el('div', 'dim-field',
    `<label>Units</label><input id="confQty" type="number" min="1" max="50" step="1" value="1" inputmode="numeric">`);
  qtyRow.append(qtyField);
  qtyGroup.append(qtyRow);
  left.append(qtyGroup);

  // Add-ons
  const addonGroup = el('div', 'conf-group');
  addonGroup.append(el('div', 'conf-label', 'Extras'));
  const addonsBox = el('div', 'conf-addons');
  for (const [id, a] of Object.entries(PRICING.addOns)) {
    const lbl = el('label', 'addon');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.value = id;
    cb.addEventListener('change', () => {
      if (cb.checked) state.addOns.add(id); else state.addOns.delete(id);
      recompute();
    });
    const name = el('span', '', a.label);
    const price = el('span', 'addon-price', a.price === 0 ? 'Free' : formatKsh(a.price));
    lbl.append(cb, name, price);
    addonsBox.append(lbl);
  }
  addonGroup.append(addonsBox);
  left.append(addonGroup);

  // RIGHT: live preview + price card
  const right = el('div', 'conf-right');
  const preview = el('div', 'conf-preview');
  preview.append(
    el('div', 'preview-label', 'Live preview'),
    el('div', 'preview-box'),
    el('div', 'preview-cap', '—'),
  );
  const priceCard = el('div', 'conf-price');
  priceCard.append(
    el('div', 'price-label', 'Your estimate'),
    el('div', 'price-value', '—'),
    el('div', 'price-note', 'Price range · excludes VAT'),
    el('div', 'price-breakdown'),
  );
  const actions = el('div', 'price-actions');
  const waBtn = el('a', 'btn btn-success', '💬 WhatsApp this quote');
  waBtn.target = '_blank'; waBtn.rel = 'noopener';
  const exactBtn = el('button', 'btn btn-primary', '🧾 Get Exact Quote');
  const bookBtn = el('button', 'btn btn-ghost', '📅 Book a Free Measurement');
  bookBtn.dataset.bookMeasurement = '1';
  bookBtn.dataset.source = `Products — ${styleLabel} configurator`;
  const visLink = el('a', 'btn btn-ghost', '🪟 See it in your house');
  actions.append(waBtn, exactBtn, bookBtn, visLink);
  priceCard.append(actions);
  priceCard.append(el('div', 'price-cta-note', 'Both links pre-fill your exact selection.'));
  right.append(preview, priceCard);

  wrap.append(left, right);
  root.append(wrap);

  // ---- wiring ----
  const $id = (i) => root.querySelector(i);
  const wIn = $id('#confW'), hIn = $id('#confH'), qIn = $id('#confQty');
  [wIn, hIn, qIn].forEach((i) => i.addEventListener('input', recompute));

  function area() {
    return (Math.max(0, +wIn.value || 0) * Math.max(0, +hIn.value || 0)) / 10000;
  }

  function recompute() {
    const a = area();
    const res = computePrice({
      product: state.product,
      area: a,
      qty: +qIn.value || 1,
      glass: state.glass,
      panels: state.panels,
      finish: state.finish,
      addOns: state.addOns,
    });
    root.querySelector('.price-value').textContent = formatRange(res.total);
    root.querySelector('.area-chip').textContent = `Area: ${a.toFixed(2)} m²`;
    renderPreview(root, cat, slug, {
      finish: state.finish, glass: state.glass, panels: state.panels,
      w: Math.round(+wIn.value || 0), h: Math.round(+hIn.value || 0),
      addOns: state.addOns,
    });
    root.querySelector('.preview-cap').textContent =
      `${FINISHES[state.finish].label} · ${GLASS[state.glass].label} glass · ${state.panels} panel${state.panels > 1 ? 's' : ''}`;
      if (state.addOns.has('burglar')) root.querySelector('.preview-cap').textContent += ' · burglar grill';
    const bd = root.querySelector('.price-breakdown');
    bd.innerHTML = res.lines.map((l) =>
      `<div class="row"><span>${l.label}</span><span>${l.amount ? formatKsh(l.amount) : '—'}</span></div>`).join('');

    // WhatsApp pre-fill
    const g = GLASS[state.glass];
    const lines = [
      `Hi Rika! I'm getting an estimate for ${styleLabel}:`,
      `• Finish: ${FINISHES[state.finish].label}`,
      `• Glass: ${g.label}`,
      `• Panels: ${state.panels}`,
      `• Size: ${Math.round(+wIn.value || 0)} × ${Math.round(+hIn.value || 0)} cm (${a.toFixed(2)} m²)`,
      `• Quantity: ${Math.max(1, +qIn.value || 1)}`,
      `• Estimate: ${formatRange(res.total)} (range)`,
      `I'd like a firm quote / free measurement.`,
    ];
    waBtn.href = waLink(lines.join('\n'));

    // Exact quote -> pre-filled quotation form
    const params = new URLSearchParams({ from: 'configurator' });
    params.set('type', state.product);
    params.set('w', String(Math.round(+wIn.value || 0)));
    params.set('h', String(Math.round(+hIn.value || 0)));
    params.set('qty', String(Math.max(1, +qIn.value || 1)));
    params.set('finish', { black: 'matte-black', silver: 'silver', bronze: 'bronze', white: 'white' }[state.finish] || state.finish);
    params.set('glass', state.glass);
    params.set('panels', String(state.panels));
    if (state.addOns.size) params.set('addons', [...state.addOns].join(','));
    params.set('est', String(Math.round(res.total)));
    exactBtn.onclick = () => { window.location.href = `/rika/tools/quotation/?${params.toString()}`; };

    // Visualizer carries dims
    visLink.href = `/rika/tools/visualizer/?w=${Math.round(+wIn.value || 0)}&h=${Math.round(+hIn.value || 0)}`;
  }

  recompute();
}

// ---- live SVG visualizer (T-B2-03b) ----
function renderPreview(root, cat, slug, s) {
  const box = root.querySelector('.preview-box');
  if (!box) return;
  const W = Math.max(30, s.w || 120);
  const H = Math.max(30, s.h || 100);
  const avail = 280, pad = 12;
  let fw, fh;
  if (W / H >= 1) { fw = avail; fh = Math.max(48, Math.round(avail * H / W)); }
  else { fh = avail; fw = Math.max(48, Math.round(avail * W / H)); }
  fw = Math.min(fw, avail); fh = Math.min(fh, avail);
  const fx = (400 - fw) / 2, fy = (240 - fh) / 2 + 8;
  const col = FRAME[s.finish] || FRAME.black;
  const colD = FRAME_DARK[s.finish] || FRAME_DARK.black;
  const mull = Math.max(6, Math.round(fw * 0.03));
  const inner = { x: fx + mull, y: fy + mull, w: fw - 2 * mull, h: fh - 2 * mull };
  const isDoor = cat === 'doors';
  let mullions = '';
  if (s.panels > 1) {
    const step = inner.w / s.panels;
    for (let i = 1; i < s.panels; i++) {
      const mx = inner.x + step * i;
      mullions += `<line x1="${mx.toFixed(1)}" y1="${inner.y}" x2="${mx.toFixed(1)}" y2="${(inner.y + inner.h).toFixed(1)}" stroke="${col}" stroke-width="${(mull * 0.7).toFixed(1)}"/>`;
    }
  }
  let bars = '';
  if (s.addOns.has('burglar')) {
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
  if (s.glass === 'frosted') glassFx = `<rect x="${inner.x}" y="${inner.y}" width="${inner.w}" height="${inner.h}" fill="url(#frostedFill)" opacity="0.92"/>`;
  else if (s.glass === 'tinted') glassFx = `<rect x="${inner.x}" y="${inner.y}" width="${inner.w}" height="${inner.h}" fill="url(#tintFill)"/>`;
  const handle = isDoor ? `<rect x="${(fx + fw - mull - 12).toFixed(1)}" y="${(fy + fh / 2 - 20).toFixed(1)}" width="4" height="40" rx="2" fill="${colD}"/>` : '';
  const label = `${W}×${H}cm`;
  box.innerHTML = `
  <svg viewBox="0 0 400 256" width="100%" height="100%" role="img" aria-label="Live preview">
    <defs>
      <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14171f"/><stop offset="1" stop-color="#0e1015"/></linearGradient>
      <linearGradient id="clearGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe3ff" stop-opacity="0.5"/><stop offset="1" stop-color="#7db6e8" stop-opacity="0.18"/></linearGradient>
      <linearGradient id="tintFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3a2a" stop-opacity="0.85"/><stop offset="1" stop-color="#2a2119" stop-opacity="0.9"/></linearGradient>
      <linearGradient id="frostedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef2f6" stop-opacity="0.92"/><stop offset="1" stop-color="#cfd6dd" stop-opacity="0.9"/></linearGradient>
      <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    </defs>
    <rect x="0" y="0" width="400" height="256" fill="url(#wallGrad)"/>
    <ellipse cx="200" cy="${(fy + fh + 10).toFixed(1)}" rx="${(fw * 0.55).toFixed(1)}" ry="10" fill="url(#shadow)"/>
    <rect x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="4" fill="#0e1116" stroke="${colD}" stroke-width="3"/>
    <rect x="${(fx + mull / 2).toFixed(1)}" y="${(fy + mull / 2).toFixed(1)}" width="${(fw - mull).toFixed(1)}" height="${(fh - mull).toFixed(1)}" rx="2" fill="none" stroke="${col}" stroke-width="2" opacity="0.5"/>
    <rect x="${inner.x.toFixed(1)}" y="${inner.y.toFixed(1)}" width="${inner.w.toFixed(1)}" height="${inner.h.toFixed(1)}" fill="url(#clearGlass)"/>
    ${mullions}
    ${glassFx}
    <polygon points="${(inner.x + inner.w * 0.15).toFixed(1)},${inner.y.toFixed(1)} ${(inner.x + inner.w * 0.35).toFixed(1)},${inner.y.toFixed(1)} ${(inner.x + inner.w * 0.05).toFixed(1)},${(inner.y + inner.h).toFixed(1)} ${(inner.x - inner.w * 0.02).toFixed(1)},${(inner.y + inner.h).toFixed(1)}" fill="#ffffff" opacity="0.05"/>
    ${bars}
    ${handle}
    <text x="200" y="248" text-anchor="middle" fill="#7d8592" font-size="11" font-family="system-ui, sans-serif">${label}</text>
  </svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('confRoot');
  if (root) initConfigurator({ label: root.dataset.label });
});

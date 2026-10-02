// ============================================================
// Rika Calculator — app logic
// All rates/numbers come from shared/js/rika-config.js
// (the single source of truth). This file only does math + UI.
// ============================================================

import { RIKA_CONFIG, formatKsh, formatRange, waLink } from '../../../shared/js/rika-config.js';

const $ = (id) => document.getElementById(id);

// --- UI state ---
const ui = {
  product: 'sliding',
  finish: 'black',
  glass: 'clear',
  addOns: new Set(),
  tier: null, // null = per-product pricing, or a tier key
};

// --- Build option chips ---
function buildChips(containerId, entries, key) {
  const box = $(containerId);
  box.innerHTML = '';
  for (const [id, item] of Object.entries(entries)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt-chip' + (ui[key] === id ? ' selected' : '');
    const sub = item.sub ? `<small>${item.sub}</small>` : '';
    btn.innerHTML = `${item.label}${sub}`;
    btn.addEventListener('click', () => {
      ui[key] = id;
      box.querySelectorAll('.opt-chip').forEach((c) => c.classList.remove('selected'));
      btn.classList.add('selected');
      recompute();
    });
    box.appendChild(btn);
  }
}

// --- Build add-on checkboxes ---
function buildAddOns() {
  const box = $('addonsBox');
  box.innerHTML = '';
  for (const [id, item] of Object.entries(RIKA_CONFIG.pricing.addOns)) {
    const label = document.createElement('label');
    label.className = 'addon-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = ui.addOns.has(id);
    cb.addEventListener('change', () => {
      if (cb.checked) ui.addOns.add(id);
      else ui.addOns.delete(id);
      recompute();
    });
    const span = document.createElement('span');
    span.className = 'addon-label';
    span.textContent = item.label;
    const price = document.createElement('span');
    price.className = 'addon-price';
    price.textContent = item.price === 0 ? 'Free' : formatKsh(item.price);
    label.append(cb, span, price);
    box.appendChild(label);
  }
}

// --- Build tier cards ---
function buildTiers() {
  const box = $('tiersBox');
  box.innerHTML = '';
  for (const [id, tier] of Object.entries(RIKA_CONFIG.pricing.tiers)) {
    const card = document.createElement('div');
    card.className = 'tier' + (ui.tier === id ? ' selected' : '');
    const badge = tier.badge ? `<span class="tier-badge">${tier.badge}</span>` : '';
    card.innerHTML = `
      ${badge}
      <div class="tier-head">
        <span class="tier-name">${tier.label}</span>
        <span class="tier-price">${formatKsh(tier.perM2)}/m²</span>
      </div>
      <div class="tier-features">${tier.features.join(' · ')}</div>`;
    card.addEventListener('click', () => {
      ui.tier = ui.tier === id ? null : id;
      box.querySelectorAll('.tier').forEach((c) => c.classList.remove('selected'));
      if (ui.tier === id) card.classList.add('selected');
      recompute();
    });
    box.appendChild(card);
  }
}

// --- Pricing math ---
function getAreaM2() {
  const w = parseFloat($('widthCm').value) || 0;
  const h = parseFloat($('heightCm').value) || 0;
  return (w * h) / 10000; // cm² -> m²
}

function compute() {
  const area = getAreaM2();
  const qty = Math.max(1, parseInt($('qty').value, 10) || 1);

  let basePerUnit;
  let modeLabel;
  if (ui.tier) {
    const t = RIKA_CONFIG.pricing.tiers[ui.tier];
    basePerUnit = t.perM2 * area;
    modeLabel = `${t.label} package (${formatKsh(t.perM2)}/m² × ${area.toFixed(2)} m²)`;
  } else {
    const p = RIKA_CONFIG.pricing.products[ui.product];
    basePerUnit = p.unitPrice * area;
    modeLabel = `${p.label} (${formatKsh(p.unitPrice)}/m² × ${area.toFixed(2)} m²)`;
  }

  // Add-ons (per unit)
  let addonsPerUnit = 0;
  const addonLines = [];
  for (const id of ui.addOns) {
    const a = RIKA_CONFIG.pricing.addOns[id];
    addonsPerUnit += a.price;
    addonLines.push(`<div class="row"><span>${a.label}</span><span>${a.price === 0 ? 'Free' : formatKsh(a.price)}</span></div>`);
  }

  const subtotalPerUnit = basePerUnit + addonsPerUnit;
  const total = subtotalPerUnit * qty;

  return { area, qty, modeLabel, addonLines, subtotalPerUnit, total };
}

function recompute() {
  const { area, qty, modeLabel, addonLines, subtotalPerUnit, total } = compute();

  $('areaChip').textContent = `Area: ${area.toFixed(2)} m²`;
  $('priceValue').textContent = formatRange(total);

  const rows = [];
  rows.push(`<div class="row"><span>${modeLabel}</span><span>${formatKsh(subtotalPerUnit - addonTotal())}</span></div>`);
  if (qty > 1) rows.push(`<div class="row"><span>× ${qty} windows</span><span>—</span></div>`);
  rows.push(...addonLines);
  $('priceBreakdown').innerHTML = rows.join('');

  updateLinks(area, total);
}

function addonTotal() {
  let t = 0;
  for (const id of ui.addOns) t += RIKA_CONFIG.pricing.addOns[id].price;
  return t;
}

// --- CTA links (WASAPP-1: pre-populated wa.me) ---
function updateLinks(area, total) {
  const p = RIKA_CONFIG.pricing.products[ui.product];
  const tier = ui.tier ? RIKA_CONFIG.pricing.tiers[ui.tier] : null;
  const w = Math.round(parseFloat($('widthCm').value) || 0);
  const h = Math.round(parseFloat($('heightCm').value) || 0);
  const qty = Math.max(1, parseInt($('qty').value, 10) || 1);

  const lines = [];
  lines.push(`Hi Rika! I'm getting an estimate from your calculator:`);
  lines.push(`• Product: ${tier ? tier.label + ' package' : p.label}`);
  lines.push(`• Size: ${w} × ${h} cm (${area.toFixed(2)} m²)`);
  if (qty > 1) lines.push(`• Quantity: ${qty} windows`);
  for (const id of ui.addOns) lines.push(`• Extra: ${RIKA_CONFIG.pricing.addOns[id].label}`);
  lines.push(`• Estimate: ${formatRange(total)} (range)`);
  lines.push(`I'd like a firm quote / free measurement.`);
  const text = lines.join('\n');

  $('waBtn').href = waLink(text);
  $('bookingBtn').href = waLink(
    `Hi Rika! I'd like to book a free site measurement. My window is approx ${w} × ${h} cm. Please send me a suitable time.`
  );

  // Visualizer link carries the dimensions (visualizer reads ?w=/?h=)
  $('visLink').href = `/rika/tools/visualizer/?w=${w}&h=${h}`;
}

// --- Init ---
function init() {
  // Disclaimer wording from config (C1 — single source)
  $('disclaimerBox').innerHTML = RIKA_CONFIG.disclaimer.full;

  const products = {};
  for (const [id, p] of Object.entries(RIKA_CONFIG.pricing.products)) {
    products[id] = { label: p.label, sub: `${formatKsh(p.unitPrice)}/m²` };
  }
  buildChips('productRow', products, 'product');

  const finishes = {
    black:  { label: '⬛ Matte Black' },
    silver: { label: '⬜ Silver' },
    bronze: { label: '🟤 Bronze' },
    white:  { label: '⬜ White' },
  };
  buildChips('finishRow', finishes, 'finish');

  const glasses = {
    clear:   { label: '🔲 Clear' },
    light:   { label: '🔲 Light Tint' },
    dark:    { label: '🔲 Dark Tint' },
    frosted: { label: '🔲 Frosted' },
  };
  buildChips('glassRow', glasses, 'glass');

  buildAddOns();
  buildTiers();

  // Live recompute on inputs
  ['widthCm', 'heightCm', 'qty'].forEach((id) => {
    $(id).addEventListener('input', recompute);
  });

  // Burger menu
  const burger = $('burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const nav = document.querySelector('.nav');
      nav.classList.toggle('open');
      burger.classList.toggle('open');
    });
  }

  recompute();
}

document.addEventListener('DOMContentLoaded', init);

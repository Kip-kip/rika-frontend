// ============================================================
// Rika — shared pricing engine (pure, no DOM).
// Single source for the on-page configurator (T-B2-03) and the
// calculator. Rates come from RIKA_CONFIG; per-style m² anchors
// extend it for the 16 catalogue styles.
// ============================================================
import { RIKA_CONFIG, formatKsh, formatRange, waLink } from './rika-config.js';

export const PRICING = RIKA_CONFIG.pricing;

// Per-style m² anchors (per /rika/products/<cat>/<slug>/). Where a style
// matches a config product, it uses that product's unitPrice so the two
// never disagree. The rest use the closest market rate.
const STYLE_M2 = {
  windows:    { sliding: 'sliding', casement: 'casement', fixed: 'fixed', bay: 'sliding' },
  doors:      { sliding: 'sliding', hinged: 'casement', fixed: 'fixed' },
  glass:      { clear: 'fixed', tinted: 'fixed', frosted: 'fixed' },
  shopfronts: { fixed: 'fixed', sliding: 'sliding', hinged: 'casement' },
  partitions: { fixed: 'fixed', sliding: 'sliding', hinged: 'casement' },
};
const FALLBACK_M2 = 11000;

export function rateForStyle(cat, slug) {
  const key = (STYLE_M2[cat] || {})[slug];
  const p = key && RIKA_CONFIG.pricing.products[key];
  return p ? p.unitPrice : FALLBACK_M2;
}
export function labelForStyle(cat, slug) {
  const key = (STYLE_M2[cat] || {})[slug];
  const p = key && RIKA_CONFIG.pricing.products[key];
  return p ? p.label : null;
}

// Glass options (per unit) — tinted/frosted are real add-ons; clear is base.
export const GLASS = {
  clear:   { label: 'Clear',   price: 0 },
  tinted:  { label: 'Tinted',  price: 1500 },
  frosted: { label: 'Frosted', price: 2500 },
};

// Frame finishes (look, not cost)
export const FINISHES = {
  black:  { label: 'Matte Black' },
  silver: { label: 'Silver' },
  bronze: { label: 'Bronze' },
  white:  { label: 'White' },
};
export const FINISH_MAP = { black: 'matte-black', silver: 'silver', bronze: 'bronze', white: 'white' };

// Panels / glass sections — a real config choice; price scales with it.
export const PANELS = { 2: '2 panels', 3: '3 panels', 4: '4 panels' };
export function panelsFactor(n) {
  if (n === 4) return 1.15;
  if (n === 3) return 1.08;
  return 1.0;
}

/**
 * Pure price computation.
 * opts: { product, area, qty, tier, finish, glass, panels, addOns:Set|array }
 * Returns { area, qty, perM2, modeLabel, lines:[{label,amount}], total }
 */
export function computePrice(opts) {
  const {
    product, area, qty = 1, tier = null,
    finish = 'black', glass = 'clear', panels = 2,
    addOns = new Set(),
  } = opts;
  const q = Math.max(1, Math.floor(Number(qty) || 1));
  const a = Math.max(0, Number(area) || 0);

  let perM2, modeLabel;
  if (tier) {
    const t = PRICING.tiers[tier];
    perM2 = t.perM2;
    modeLabel = `${t.label} package`;
  } else {
    const p = PRICING.products[product];
    perM2 = p ? p.unitPrice : FALLBACK_M2;
    modeLabel = p ? p.label : 'Custom build';
  }

  const pf = panelsFactor(panels);
  const base = perM2 * pf * a;

  const lines = [];
  lines.push({ label: `${modeLabel} · ${a.toFixed(2)} m²`, amount: base });
  if (pf > 1) lines.push({ label: `Panel factor (${panels})`, amount: 0 });

  const g = GLASS[glass] || GLASS.clear;
  if (g.price > 0) lines.push({ label: `${g.label} glass (each)`, amount: g.price * q });

  let extras = 0;
  for (const id of addOns) {
    const ad = PRICING.addOns[id];
    if (!ad) continue;
    extras += ad.price * q;
    lines.push({ label: ad.label, amount: ad.price * q });
  }

  const total = base + g.price * q + extras;
  return { area: a, qty: q, perM2, pf, modeLabel, lines, total };
}

export { formatKsh, formatRange, waLink };

// ============================================================
// Rika — SINGLE SOURCE OF TRUTH for site-wide config
// ------------------------------------------------------------
// Everything that used to be a magic number / phone number /
// price is defined HERE, exactly once. No other file hardcodes
// prices, the WhatsApp number, or the disclaimer wording.
//
//   Pricing  ->  RIKA_CONFIG.pricing        (used by: calculator, price index)
//   WhatsApp ->  RIKA_CONFIG.whatsapp       (used by: calculator, quote, homepage)
//   Disclaimer -> RIKA_CONFIG.disclaimer    (used by: measurement, calculator)
//
// To change a price later: edit it in this file ONLY.
// ------------------------------------------------------------

export const RIKA_CONFIG = {  // static fallback — overridden by initPricingConfig()
  currency: 'KSh',

  whatsapp: {
    // D5 — business line. wa.me format: no '+', no spaces, 92 prefix.
    number: '254718700519',
  },

  // ----------------------------------------------------------------
  // Pricing — anchored to real Nairobi market rates (Lasi Interiors,
  // fetched 2026-10-02):
  //   Standard windows & doors:   KSh 6,500–12,000 / m²
  //   Sliding & casement systems:  KSh 7,500–14,000 / m²
  //   Curtain wall / facade:       KSh 10,000–18,000 / m²
  // Our three product lines are priced inside those real ranges.
  // ----------------------------------------------------------------
  pricing: {
    products: {
      sliding:  { label: 'Sliding Window',  unitPrice: 11000, blurb: '2–4 panels, powder-coated frame, smooth rollers. Our best seller for kitchens, lounges and shops.' },
      casement: { label: 'Casement Window', unitPrice: 13500, blurb: 'Hinged sash, tight seal, great for bedrooms and high floors where outward opening matters.' },
      fixed:    { label: 'Fixed Pane',      unitPrice: 8500,  blurb: 'No moving parts — pure glass in a frame. The budget pick for top-lights and feature walls.' },
    },

    // Per-unit add-ons (applied per window, not per m²)
    addOns: {
      tint:       { label: 'Tinted glass (light/dark)', price: 1500 },
      frosted:    { label: 'Frosted (privacy) glass',   price: 2500 },
      burglar:    { label: 'Anti-burglar grills',       price: 6000 },
      installation:{ label: 'Professional installation & fitting', price: 3000 },
      transport:  { label: 'Delivery within Nairobi',   price: 0 }, // free within city
    },

    // The three-tier package shown in the calculator (CALC-2)
    tiers: {
      essential: {
        label: 'Essential',
        perM2: 8500,
        features: ['Standard clear glass', 'Powder-coated frame', 'Basic hardware', '1-year workmanship warranty'],
      },
      comfort: {
        label: 'Comfort',
        perM2: 11000,
        features: ['Light tinted glass', 'Thicker frame profile', 'Soft-close hardware', '3-year workmanship warranty'],
        badge: 'Most popular',
      },
      premium: {
        label: 'Premium',
        perM2: 14500,
        features: ['Dark tint / frosted glass', 'Double-glazed option', 'Anti-burglar mesh included', '10-year workmanship warranty'],
      },
    },

    // Display rounding: prices shown as ranges (CALC-1: ranges, not a single number)
    rangeWidth: 0.08, // ±8% around the calculated total
  },

  // C1 — the only place the measurement disclaimer wording lives.
  // Docs + spec require "Approximate, confirmed at site visit".
  disclaimer: {
    label: 'Approximate — confirmed at site visit',
    full: '⚠️ This is an <strong>approximate</strong> estimate based on your photo. The exact size, price and glass choice are <strong>confirmed at a free site visit</strong>. Final figures will never be higher than the estimate we agree to.',
  },

  // Free-measurement booking CTA wording (MEAS-2)
  booking: {
    headline: 'Book your free site measurement',
    sub: 'A technician visits, measures precisely, and you get a firm price the same day. No obligation.',
  },
};

// --- Category-aware product lookup (live API has 16 products across 5 categories,
//     several sharing the same product_key — e.g. "sliding" in window AND door).
//     flatProducts: { "sliding": {...}, ... } for backwards-compat (last-write-wins,
//     mirrors the static config which also has no category awareness).
//     catProducts:  { "window": {"sliding": {...}, ...}, "door": {...}, ... } for
//     pages that know their category.
export const flatProducts = {};
export const catProducts = {};

// --- Helpers (pure functions, no DOM) ---

export function formatKsh(n) {
  return 'KSh ' + Math.round(n).toLocaleString('en-KE');
}

export function formatRange(total) {
  const w = RIKA_CONFIG.pricing.rangeWidth;
  const lo = total * (1 - w);
  const hi = total * (1 + w);
  return `${formatKsh(lo)} – ${formatKsh(hi)}`;
}

export function waLink(presetText) {
  const n = RIKA_CONFIG.whatsapp.number;
  return `https://wa.me/${n}?text=${encodeURIComponent(presetText)}`;
}

// ============================================================
// Live pricing — fetched from /rika/api/pricing-config
// (Rika Pricing Config DocType, editable in Frappe admin).
// The static values above are the fallback if the API is down.
// ============================================================
export function initPricingConfig() {
  const mapApiToConfig = (api) => {
    const c = api.config;
    // Build both the flat (backwards-compat) and category-aware product maps.
    // Category-aware is the source of truth for pages that know their category;
    // flat is a fallback for tools that don't (calculator, quiz, etc.).
    const products = {};
    for (const [cat, cd] of Object.entries(c.pricing.categories || {})) {
      catProducts[cat] = {};
      for (const [key, p] of Object.entries(cd.products || {})) {
        const entry = { label: p.label, unitPrice: p.unitPrice, blurb: p.blurb || '' };
        catProducts[cat][key] = entry;
        products[key] = entry; // flat: last category wins (window, door, glass, shopfront, partition)
      }
    }
    // Reset flatProducts to the new flat map (clear old keys first)
    Object.keys(flatProducts).forEach((k) => delete flatProducts[k]);
    Object.assign(flatProducts, products);
    // Mutate in place so every importer (rika-price.js, calculator,
    // configurator, product pages) sees the same live object.
    Object.keys(RIKA_CONFIG.pricing.products).forEach((k) => delete RIKA_CONFIG.pricing.products[k]);
    Object.assign(RIKA_CONFIG.pricing.products, flatProducts);
    Object.keys(RIKA_CONFIG.pricing.tiers).forEach((k) => delete RIKA_CONFIG.pricing.tiers[k]);
    Object.assign(RIKA_CONFIG.pricing.tiers, c.pricing.tiers || {});
    Object.keys(RIKA_CONFIG.pricing.addOns).forEach((k) => delete RIKA_CONFIG.pricing.addOns[k]);
    Object.assign(RIKA_CONFIG.pricing.addOns, c.pricing.addOns || {});
    RIKA_CONFIG.pricing.rangeWidth = c.pricing.rangeWidth ?? RIKA_CONFIG.pricing.rangeWidth;
    RIKA_CONFIG.currency = c.currency || RIKA_CONFIG.currency;
    if (c.whatsapp && c.whatsapp.number) RIKA_CONFIG.whatsapp.number = c.whatsapp.number;
    if (c.disclaimer) RIKA_CONFIG.disclaimer = c.disclaimer;
  };

  return fetch('/rika/api/pricing-config', { cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then((api) => {
      const payload = api.message || api; // API wraps in {message: {...}}
      if (!payload.ok) throw new Error(payload.error || 'config not found');
      mapApiToConfig(payload);
      if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('rika:pricing-loaded'));
    })
    .catch((e) => {
      // Static fallback is already in place — log and move on.
      console.warn('[rika] pricing fetch failed, using static fallback:', e.message);
    });
}

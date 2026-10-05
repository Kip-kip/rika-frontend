// Rika — Aluminium vs UPVC price rendering (T-B2-06)
// Fills the aluminium price column LIVE from rika-config.js (single source).
// UPVC market ranges are static reference (industry estimates, stated as such).
import { RIKA_CONFIG, formatKsh, waLink } from '../../shared/js/rika-config.js';

const UPVC = {
  essential: { lo: 7500, hi: 9500 },
  comfort:   { lo: 9000, hi: 11500 },
  premium:   { lo: 11000, hi: 14500 },
};

document.addEventListener('DOMContentLoaded', () => {
  const rows = document.querySelectorAll('#priceTable tr');
  const tierKeys = ['essential', 'comfort', 'premium'];
  rows.forEach((row, i) => {
    const key = tierKeys[i];
    if (!key) return;
    const aluCell = row.querySelector('[data-alu]');
    const tier = RIKA_CONFIG.pricing.tiers[key];
    if (!aluCell || !tier) return;

    // Aluminium: per-m² from config, shown as "from KSh X" (the tier rate is the floor)
    const aluPerM2 = tier.perM2;
    aluCell.textContent = formatKsh(aluPerM2);

    // Delta: aluminium mid vs UPVC mid
    const upvc = UPVC[key];
    const aluMid = aluPerM2;
    const upvcMid = (upvc.lo + upvc.hi) / 2;
    const deltaPct = ((aluMid - upvcMid) / upvcMid) * 100;
    const deltaCell = row.querySelector('.cmp-delta');
    if (deltaCell) {
      if (deltaPct > 0) deltaCell.textContent = `+${deltaPct.toFixed(0)}%`;
      else if (deltaPct < 0) deltaCell.textContent = `${deltaPct.toFixed(0)}% (cheaper)`;
      else deltaCell.textContent = '±0%';
    }
  });

  // WhatsApp CTA
  const msg = "Hello Rika, I'm comparing aluminium vs UPVC for my house. Can you share your 2026 aluminium price list and book me a free measurement?";
  const url = waLink(msg);
  const wa = document.getElementById('cmpWa');
  if (wa) wa.href = url;

  // ----------------------------------------------------------
  // CMP-1 — tier comparison: fill cards + live project price delta
  // ----------------------------------------------------------
  const tiers = RIKA_CONFIG.pricing.tiers;
  const tierKeys = ['essential', 'comfort', 'premium'];

  // Per-m² in cards + spec table (single source: config)
  for (const k of tierKeys) {
    const t = tiers[k];
    if (!t) continue;
    const perM2 = formatKsh(t.perM2);
    document.querySelectorAll(`[data-tier="${k}"] .tier-perm2`).forEach(el => el.textContent = perM2);
    const specCell = document.querySelector(`[data-tier-price="${k}"]`);
    if (specCell) specCell.textContent = perM2;
  }

  const m2Input = document.getElementById('tierM2');
  const sizeLbl = document.querySelector('.tier-delta-size');
  const note = document.getElementById('tierDeltaNote');

  function renderTierDelta() {
    let m2 = Math.floor(Number(m2Input && m2Input.value) || 0);
    if (m2 < 5) m2 = 5; if (m2 > 200) m2 = 200;
    const totals = {};
    for (const k of tierKeys) totals[k] = tiers[k].perM2 * m2;
    const max = Math.max(...Object.values(totals));
    const min = Math.min(...Object.values(totals));

    for (const k of tierKeys) {
      const projEl = document.querySelector(`[data-tier="${k}"] .tier-proj-num`);
      if (projEl) projEl.textContent = formatRange(totals[k]);
      const row = document.querySelector(`[data-delta="${k}"]`);
      if (row) {
        const bar = row.querySelector('.delta-bar');
        const val = row.querySelector('.delta-val');
        if (bar) bar.style.width = ((totals[k] / max) * 100).toFixed(1) + '%';
        if (val) val.textContent = formatKsh(totals[k]);
      }
    }
    if (sizeLbl) sizeLbl.textContent = `${m2} m²`;
    if (note) {
      const extra = totals.premium - totals.essential;
      note.textContent = `Premium costs ${formatKsh(extra)} more than Essential at ${m2} m² — that is ${formatKsh(extra / m2)} per m² of glass for double-glazing option, anti-burglar mesh and a 10-year warranty.`;
    }
    // Prefill CTAs
    const calc = document.getElementById('tierCalcCta');
    if (calc) calc.href = `/rika/tools/calculator/?tier=comfort&qty=${Math.max(1, Math.round(m2))}`;
    const twa = document.getElementById('tierWaCta');
    if (twa) {
      twa.href = waLink(`Hello Rika, I'm choosing between your window tiers (Essential / Comfort / Premium) for a project of about ${m2} m². Can you send the full price list and book a free measurement?`);
    }
  }

  if (m2Input) {
    m2Input.addEventListener('input', renderTierDelta);
    m2Input.addEventListener('change', () => renderTierDelta());
  }
  renderTierDelta();
});

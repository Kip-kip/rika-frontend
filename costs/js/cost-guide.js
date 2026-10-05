// Rika — cost-guide price rendering (T-B2-05)
// Renders the tier "short answer" figures LIVE from the single source of
// truth (rika-config.js via rika-price.js). Nothing is hardcoded here.
import { PRICING, formatKsh, formatRange, waLink } from '../../shared/js/rika-price.js';

const root = document.currentScript;
const n = (root && root.dataset.n) || '';

document.addEventListener('DOMContentLoaded', () => {
  const row = document.querySelector('.cg-tier-row');
  if (!row) return;
  const m2 = parseFloat(row.dataset.m2) || 0;
  const wins = parseInt(row.dataset.windows, 10) || 0;

  const tiers = { essential: 'Essential', comfort: 'Comfort', premium: 'Premium' };
  for (const key of Object.keys(tiers)) {
    const t = PRICING.tiers[key];
    if (!t) continue;
    const total = t.perM2 * m2;
    const priceEl = row.querySelector(`[data-tier="${key}"]`);
    const noteEl = row.querySelector(`[data-perm2="${key}"]`);
    if (priceEl) priceEl.textContent = formatRange(total);
    if (noteEl) noteEl.textContent = `${formatKsh(t.perM2)} / m² · ${wins} windows · supply`;
  }

  // WhatsApp CTA — pre-filled with the house size
  const msg = `Hello Rika, I'm planning to window a ${n}-bedroom house (~${wins} windows). Please share your 2026 price list and book me a free measurement.`;
  const url = waLink(msg);
  const wa = document.getElementById('cgWa');
  if (wa) { wa.href = url; }
});

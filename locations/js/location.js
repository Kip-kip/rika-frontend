// Rika — local landing page behavior (T-B2-04)
// Fills the "from KSh" price anchors from the single source of truth
// (rika-config.js via rika-price.js) and wires the location-specific
// WhatsApp CTAs. No prices hardcoded here.
import { formatKsh, waLink } from '../../shared/js/rika-price.js';
import { RIKA_CONFIG } from '../../shared/js/rika-config.js';

const loc = (document.currentScript && document.currentScript.dataset.loc) || 'Nairobi';

document.addEventListener('DOMContentLoaded', () => {
  // 1) Fill "from KSh —" price anchors (single-sourced)
  document.querySelectorAll('[data-from]').forEach((el) => {
    const key = el.dataset.from;
    const prod = RIKA_CONFIG.pricing.products[key];
    if (prod) el.textContent = `from ${formatKsh(prod.unitPrice)}`;
  });

  // 2) WhatsApp CTAs, location-branded
  const msg = `Hello Rika, I'm interested in aluminium windows/doors in ${loc}. Please share next steps and a free measurement slot.`;
  const url = waLink(msg);
  document.querySelectorAll('#heroWa, #finalWa').forEach((a) => {
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
  });
});

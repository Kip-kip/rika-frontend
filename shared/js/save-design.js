// ============================================================
// Rika — shared "Save My Design" lead capture (SAVE-1, T-B1-03)
// ------------------------------------------------------------
// The moment-of-intent capture: after calculator or visualizer
// use, the visitor gets a "Save my design" CTA that stores the
// full design config + their contact in Frappe (Rika Design +
// Rika Lead) — not localStorage.
//
// Usage:
//   1. Add a CTA: <button data-save-design data-source="Calculator">📥 Save My Design</button>
//   2. Register the page's design snapshot:
//        window.__rikaDesignSnapshot = () => ({
//          product, finish, glass, addons, tier,
//          width_cm, height_cm, quantity,
//          estimate_low, estimate_high, summaryHtml,
//        });
//   3. This module auto-inits: wires [data-save-design] buttons,
//      injects the modal, POSTs to /rika/api/save-design.
// ============================================================

import { RIKA_CONFIG, waLink } from './rika-config.js';
import { toast } from './rika-toast.js';

const API_URL = '/rika/api/save-design';
const WA_NUMBER = RIKA_CONFIG.whatsapp.number;

let snapshotFn = null;
function setSnapshot(fn) {
  snapshotFn = fn;
}

// Allow the calculator/visualizer to register a snapshot getter
window.__rikaSetDesignSnapshot = setSnapshot;

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function modalHtml() {
  return `
  <div class="rik-overlay sd-overlay hidden" id="sdOverlay" role="dialog" aria-modal="true" aria-labelledby="sdTitle">
    <div class="rik-modal sd-modal">
      <button class="rik-close sd-close" id="sdClose" aria-label="Close">&times;</button>

      <h2 class="rik-title sd-title" id="sdTitle">Save your design</h2>
      <p class="rik-sub sd-sub">Store your design so you can pick up exactly where you left off — and get a firm quote when you're ready. No payment needed.</p>

      <div class="rik-summary sd-summary" id="sdSummary"></div>

      <form id="sdForm" class="rik-form sd-form" novalidate>
        <label class="rik-field sd-field">
          <span>Name *</span>
          <input type="text" name="name" required autocomplete="name" placeholder="Your full name" />
        </label>

        <div class="rik-row sd-row">
          <label class="rik-field sd-field">
            <span>Phone / WhatsApp *</span>
            <input type="tel" name="phone" required autocomplete="tel" placeholder="07XX XXX XXX" />
          </label>
          <label class="rik-field sd-field">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" placeholder="you@example.com" />
          </label>
        </div>

        <div class="rik-error sd-error hidden" id="sdError"></div>

        <button type="submit" class="btn btn-primary rik-submit sd-submit" id="sdSubmit">Save my design</button>
        <p class="rik-note sd-note">We'll contact you with a firm quote. Your design is saved to our system — not just your browser.</p>
      </form>

      <!-- Confirmation state -->
      <div id="sdDone" class="rik-done sd-done hidden">
        <div class="rik-done-icon sd-done-icon">✅</div>
        <h2 class="rik-title sd-title">Design saved!</h2>
        <p class="rik-ref sd-ref">Reference: <strong id="sdRef"></strong></p>
        <p class="rik-sub sd-sub" id="sdDoneNote">Your design is saved. We'll call you shortly with a firm quote.</p>
        <div class="rik-done-actions sd-done-actions">
          <a id="sdWaFollow" class="btn btn-success" target="_blank" rel="noopener" href="#">💬 Message us on WhatsApp</a>
          <a id="sdQuoteCta" class="btn btn-primary" href="#">💰 Get an Exact Quote</a>
          <button class="btn btn-ghost" id="sdDoneClose">Close</button>
        </div>
      </div>
    </div>
  </div>`;
}

function initSaveDesign() {
  if (document.getElementById('sdOverlay')) return; // already injected

  const host = document.createElement('div');
  host.innerHTML = modalHtml();
  const overlay = host.firstElementChild;
  document.body.appendChild(overlay);

  const $id = (id) => overlay.querySelector(id);
  const closeBtn = $id('#sdClose');
  const form = $id('#sdForm');
  const errBox = $id('#sdError');
  const submitBtn = $id('#sdSubmit');
  const done = $id('#sdDone');
  const doneClose = $id('#sdDoneClose');
  const waFollow = $id('#sdWaFollow');
  const quoteCta = $id('#sdQuoteCta');

  let busy = false;
  let lastConfig = null;

  function open(source, prefill = {}) {
    form.reset();
    form.dataset.source = source || 'Website';
    done.classList.add('hidden');
    form.classList.remove('hidden');
    errBox.classList.add('hidden');
    submitBtn.disabled = false;
    busy = false;

    // Render the design summary
    const summary = $id('#sdSummary');
    const snap = snapshotFn ? snapshotFn() : null;
    lastConfig = snap;
    if (snap && snap.summaryHtml) {
      summary.innerHTML = snap.summaryHtml;
    } else if (snap) {
      // Fallback: build a minimal summary
      const lines = [];
      if (snap.product) lines.push(`<b>Product:</b> ${esc(snap.product)}`);
      if (snap.finish) lines.push(`<b>Finish:</b> ${esc(snap.finish)}`);
      if (snap.glass) lines.push(`<b>Glass:</b> ${esc(snap.glass)}`);
      if (snap.width_cm && snap.height_cm) lines.push(`<b>Size:</b> ${snap.width_cm} × ${snap.height_cm} cm`);
      if (snap.quantity > 1) lines.push(`<b>Quantity:</b> ${snap.quantity}`);
      if (snap.estimate_low && snap.estimate_high) {
        lines.push(`<b>Estimate:</b> KSh ${snap.estimate_low.toLocaleString()} – ${snap.estimate_high.toLocaleString()}`);
      }
      summary.innerHTML = lines.join('<br>');
    }

    if (prefill) {
      Object.keys(prefill).forEach((k) => {
        const el = form.elements[k];
        if (el) el.value = prefill[k];
      });
    }
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    const first = form.elements.name;
    setTimeout(() => first && first.focus(), 50);
  }

  function close() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function showErr(msg) {
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
  }

  // Wire triggers
  document.querySelectorAll('[data-save-design]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const src = btn.dataset.source || 'Website';
      open(src);
    });
  });

  closeBtn.addEventListener('click', close);
  doneClose.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving…';
    errBox.classList.add('hidden');

    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim();
    const phone = (fd.get('phone') || '').trim();
    const email = (fd.get('email') || '').trim() || undefined;

    if (!name || !phone) {
      showErr('Please enter your name and phone number.');
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save my design';
      return;
    }

    // Build the config payload from the snapshot
    const config = lastConfig || {};
    const payload = {
      name,
      phone,
      email,
      source: form.dataset.source || 'Website',
      config: {
        product: config.product || null,
        finish: config.finish || null,
        glass: config.glass || null,
        addons: config.addons || [],
        tier: config.tier || null,
        width_cm: config.width_cm || null,
        height_cm: config.height_cm || null,
        quantity: config.quantity || 1,
        estimate_low: config.estimate_low || null,
        estimate_high: config.estimate_high || null,
        location: config.location || null,
        notes: config.notes || null,
      },
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('json') ? await res.json() : null;
      if (!res.ok || !body || body.exc_type) {
        const msg = (body && (body.message || (body.error && body.error.message))) || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      // Success -> confirmation + toast
      const ref = body.design || body.ref || body.name || '—';
      form.classList.add('hidden');
      done.classList.remove('hidden');
      document.getElementById('sdRef').textContent = ref;
      toast.success(`Design saved — ref ${ref}. We'll call you shortly with a firm quote.`);

      // WhatsApp follow-up
      const waMsg = `Hi Rika! I just saved my design (ref ${ref}). Name: ${name}. ${config.product ? 'Product: ' + config.product + '.' : ''} I'd like a firm quote.`;
      waFollow.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;

      // Exact-quote CTA — link to the quote tool with pre-fill
      const w = config.width_cm || 100;
      const h = config.height_cm || 100;
      const qty = config.quantity || 1;
      quoteCta.href = `/rika/tools/calculator/?w=${w}&h=${h}&qty=${qty}`;
    } catch (err) {
      showErr(err.message || 'Something went wrong. Please try again.');
    } finally {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save my design';
    }
  });

  return open;
}

export { initSaveDesign, setSnapshot };

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSaveDesign);
} else {
  initSaveDesign();
}

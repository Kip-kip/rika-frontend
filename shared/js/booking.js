// ============================================================
// Rika — shared free-measurement booking modal (MEAS-2)
// ------------------------------------------------------------
// One reusable modal used by the measurement tool, the
// calculator, and the quote page. POSTs to /rika/api/booking
// (Frappe Rika Booking) and shows a confirmation with ref.
//
// Usage:
//   <button data-book-measurement data-source="Measurement Tool">…</button>
//   import { initBooking } from '../../shared/js/booking.js';
//   initBooking();
// ============================================================

import { RIKA_CONFIG } from './rika-config.js';

const API_URL = '/rika/api/booking';
const WA_NUMBER = RIKA_CONFIG.whatsapp.number;

// Minimum booking date = tomorrow (bookings are for the future).
function minDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function modalHtml() {
  return `
  <div class="bk-overlay hidden" id="bkOverlay" role="dialog" aria-modal="true" aria-labelledby="bkTitle">
    <div class="bk-modal">
      <button class="bk-close" id="bkClose" aria-label="Close">&times;</button>

      <h2 class="bk-title" id="bkTitle">Book a free site measurement</h2>
      <p class="bk-sub">A technician visits, measures precisely, and you get a firm price the same day. No obligation.</p>

      <form id="bkForm" class="bk-form" novalidate>
        <label class="bk-field">
          <span>Name *</span>
          <input type="text" name="name" required autocomplete="name" placeholder="Your full name" />
        </label>

        <label class="bk-field">
          <span>Phone *</span>
          <input type="tel" name="phone" required autocomplete="tel" placeholder="07XX XXX XXX" />
        </label>

        <label class="bk-field">
          <span>Location (estate/area) *</span>
          <input type="text" name="location" required autocomplete="address-level2" placeholder="e.g. Karen, Westlands, Kasarani" />
        </label>

        <label class="bk-field">
          <span>Project type</span>
          <select name="project_type">
            <option>Windows</option>
            <option>Doors</option>
            <option>Sliding Windows</option>
            <option>Glass &amp; Glazing</option>
            <option>Both — Windows &amp; Doors</option>
            <option>Other</option>
          </select>
        </label>

        <div class="bk-row">
          <label class="bk-field">
            <span>Preferred date *</span>
            <input type="date" name="date" required />
          </label>
          <label class="bk-field">
            <span>Time</span>
            <select name="time">
              <option>Morning (8am–12pm)</option>
              <option>Midday (12pm–3pm)</option>
              <option>Afternoon (3pm–6pm)</option>
            </select>
          </label>
        </div>

        <div class="bk-row">
          <label class="bk-field">
            <span>Est. width (cm)</span>
            <input type="number" name="width_cm" min="0" step="1" placeholder="e.g. 120" />
          </label>
          <label class="bk-field">
            <span>Est. height (cm)</span>
            <input type="number" name="height_cm" min="0" step="1" placeholder="e.g. 100" />
          </label>
          <label class="bk-field">
            <span>Qty</span>
            <input type="number" name="quantity" min="0" step="1" placeholder="1" />
          </label>
        </div>

        <label class="bk-field">
          <span>Notes (optional)</span>
          <textarea name="notes" rows="2" placeholder="Anything else we should know?"></textarea>
        </label>

        <div class="bk-error hidden" id="bkError"></div>

        <button type="submit" class="btn btn-primary bk-submit" id="bkSubmit">Book my free measurement</button>
        <p class="bk-note">We'll call you to confirm the visit time. No payment needed to book.</p>
      </form>

      <!-- Confirmation state -->
      <div id="bkDone" class="bk-done hidden">
        <div class="bk-done-icon">✅</div>
        <h2 class="bk-title">You're booked!</h2>
        <p class="bk-ref">Booking reference: <strong id="bkRef"></strong></p>
        <p class="bk-sub" id="bkDoneNote">We'll call you shortly to confirm your visit. Keep your phone handy.</p>
        <div class="bk-done-actions">
          <a id="bkWaFollow" class="btn btn-success" target="_blank" rel="noopener" href="#">💬 Message us on WhatsApp</a>
          <button class="btn btn-ghost" id="bkDoneClose">Close</button>
        </div>
      </div>
    </div>
  </div>`;
}

function initBooking() {
  if (document.getElementById('bkOverlay')) return; // already injected

  const host = document.createElement('div');
  host.innerHTML = modalHtml();
  const overlay = host.firstElementChild;
  document.body.appendChild(overlay);

  const $id = (id) => overlay.querySelector(id);
  const closeBtn = $id('#bkClose');
  const form = $id('#bkForm');
  const errBox = $id('#bkError');
  const submitBtn = $id('#bkSubmit');
  const done = $id('#bkDone');
  const doneClose = $id('#bkDoneClose');
  const waFollow = $id('#bkWaFollow');
  const dateInput = form.elements.date;
  dateInput.min = minDate();
  dateInput.value = minDate();

  let busy = false;

  function open(source, prefill = {}) {
    form.reset();
    form.dataset.source = source || 'Website';
    done.classList.add('hidden');
    form.classList.remove('hidden');
    errBox.classList.add('hidden');
    submitBtn.disabled = false;
    busy = false;
    if (prefill) {
      Object.keys(prefill).forEach((k) => {
        const el = form.elements[k];
        if (el) el.value = prefill[k];
      });
    }
    if (!form.elements.date.value) dateInput.value = minDate();
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

  // Wire triggers: any [data-book-measurement]
  document.querySelectorAll('[data-book-measurement]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const src = btn.dataset.source || 'Website';
      const prefill = {};
      // Calculator pages expose #widthCm/#heightCm — prefill from the live inputs
      const wEl = document.getElementById('widthCm');
      const hEl = document.getElementById('heightCm');
      if (wEl && +wEl.value >= 30 && +wEl.value <= 400) prefill.width_cm = wEl.value;
      if (hEl && +hEl.value >= 30 && +hEl.value <= 300) prefill.height_cm = hEl.value;
      const qEl = document.getElementById('qty');
      if (qEl && +qEl.value >= 1) prefill.quantity = qEl.value;
      // Fallback: ?w=&h= (mm) seeded by the measurement tool
      const p = new URLSearchParams(location.search);
      const w = parseInt(p.get('w'), 10);
      const h = parseInt(p.get('h'), 10);
      if (prefill.width_cm == null && w >= 30 && w <= 400) prefill.width_cm = w;
      if (prefill.height_cm == null && h >= 30 && h <= 300) prefill.height_cm = h;
      open(src, prefill);
    });
  });

  // Measurement tool: allow pre-filling width/height from its results
  window.__rikaBookingOpen = open;

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
    submitBtn.textContent = 'Booking…';
    errBox.classList.add('hidden');

    const fd = new FormData(form);
    const payload = {
      name: fd.get('name'),
      phone: fd.get('phone'),
      location: fd.get('location'),
      project_type: fd.get('project_type'),
      date: fd.get('date'),
      time: fd.get('time'),
      width_cm: fd.get('width_cm') || undefined,
      height_cm: fd.get('height_cm') || undefined,
      quantity: fd.get('quantity') || undefined,
      notes: fd.get('notes') || undefined,
      source: form.dataset.source || 'Website',
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
      // Success -> confirmation
      form.classList.add('hidden');
      done.classList.remove('hidden');
      document.getElementById('bkRef').textContent = body.ref || body.name || '—';
      const waMsg = `Hi Rika! I just booked a free measurement (ref ${body.ref || body.name || ''}). Name: ${esc(payload.name)}. Location: ${esc(payload.location)}. Date: ${esc(payload.date)} ${esc(payload.time || '')}.`;
      waFollow.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`;
    } catch (err) {
      showErr(err.message || 'Something went wrong. Please try again.');
    } finally {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Book my free measurement';
    }
  });

  return open;
}

export { initBooking };

// Auto-init on any page that includes this module.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBooking);
} else {
  initBooking();
}

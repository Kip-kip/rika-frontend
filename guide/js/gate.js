// Rika — buying-guide lead gate (T-B2-07 / SEO-5)
// Gating: name + phone required (email optional) -> POST /rika/api/create-lead
// (source "Buying Guide") -> reveal the downloadable/printable guide link.
import { waLink } from '../../shared/js/rika-config.js';

const API_URL = '/rika/api/create-lead';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function gateHtml() {
  return `
  <div class="g-overlay hidden" id="gOverlay" role="dialog" aria-modal="true" aria-labelledby="gTitle">
    <div class="g-modal">
      <button class="g-close" id="gClose" aria-label="Close">&times;</button>
      <h2 class="g-title" id="gTitle">Get the full Buying Guide</h2>
      <p class="g-sub">Enter your details and we'll unlock the full 2026 guide — and a technician can call you with a free measurement. No payment, no pressure.</p>
      <form id="gForm" class="g-form" novalidate>
        <label class="g-field">
          <span>Name *</span>
          <input type="text" name="name" required autocomplete="name" placeholder="Your full name" />
        </label>
        <div class="g-row">
          <label class="g-field">
            <span>Phone / WhatsApp *</span>
            <input type="tel" name="phone" required autocomplete="tel" placeholder="07XX XXX XXX" />
          </label>
          <label class="g-field">
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" placeholder="you@example.com" />
          </label>
        </div>
        <div class="g-error hidden" id="gError"></div>
        <button type="submit" class="btn btn-primary g-submit" id="gSubmit">Unlock the guide</button>
        <p class="g-note">We'll use this to call you about your project. Your details go to our system, not just your browser.</p>
      </form>
      <div id="gDone" class="g-done hidden">
        <div class="g-done-icon">📥</div>
        <h2 class="g-title">Guide unlocked!</h2>
        <p class="g-sub">Thanks. Your download is ready, and we'll call you shortly to book the free measurement.</p>
        <div class="g-done-actions">
          <a id="gDownload" class="btn btn-primary" href="/rika/guide/download/" target="_blank" rel="noopener">⬇️ Download / Save as PDF</a>
          <a id="gWaFollow" class="btn btn-success" target="_blank" rel="noopener" href="#">💬 Message us on WhatsApp</a>
          <button class="btn btn-ghost" id="gDoneClose">Close</button>
        </div>
      </div>
    </div>
  </div>`;
}

function initGuideGate() {
  if (document.getElementById('gOverlay')) return;
  const host = document.createElement('div');
  host.innerHTML = gateHtml();
  const overlay = host.firstElementChild;
  document.body.appendChild(overlay);

  const $id = (i) => overlay.querySelector(i);
  const closeBtn = $id('#gClose');
  const form = $id('#gForm');
  const errBox = $id('#gError');
  const submitBtn = $id('#gSubmit');
  const done = $id('#gDone');
  const doneClose = $id('#gDoneClose');
  const waFollow = $id('#gWaFollow');
  let busy = false;

  function showErr(msg) {
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
  }
  function close() {
    overlay.classList.add('hidden');
  }

  document.querySelectorAll('[data-guide-gate]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      form.reset();
      done.classList.add('hidden');
      form.classList.remove('hidden');
      errBox.classList.add('hidden');
      submitBtn.disabled = false;
      busy = false;
      overlay.classList.remove('hidden');
    });
  });

  closeBtn.addEventListener('click', close);
  doneClose.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    busy = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Unlocking…';
    errBox.classList.add('hidden');

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    if (!name) { showErr('Please enter your name.'); submitBtn.disabled = false; busy = false; return; }
    if (!phone) { showErr('Please enter your phone / WhatsApp number.'); submitBtn.disabled = false; busy = false; return; }

    const payload = {
      name, phone, email: email || undefined,
      source: 'Buying Guide',
      notes: 'Requested the Buying Guide (2026) via /rika/guide/',
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload).toString(),
      });
      const ct = res.headers.get('content-type') || '';
      const body = ct.includes('json') ? await res.json() : null;
      if (!res.ok || !body) {
        const msg = (body && (body.message || (body.error && body.error.message))) || `Request failed (${res.status})`;
        throw new Error(msg);
      }
      // Success -> unlock
      form.classList.add('hidden');
      done.classList.remove('hidden');
      const ref = body.ref || body.name || '—';
      waFollow.href = waLink(`Hi Rika! I just downloaded the Buying Guide (ref ${ref}). Name: ${name}. I'd like to book a free measurement.`);
    } catch (err) {
      showErr(err.message || 'Something went wrong. Please try again, or WhatsApp us directly.');
    } finally {
      busy = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock the guide';
    }
  });
}

document.addEventListener('DOMContentLoaded', initGuideGate);

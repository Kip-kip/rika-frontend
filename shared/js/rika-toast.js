// ============================================================
// Rika — shared toast notifications (UI-1, 2026-10-03)
// Single aesthetic toast system for success/error/info pop-ups.
// Pure vanilla, no dependency. Styling in shared/css/rika-ui.css.
//
// Usage:
//   import { toast } from '../shared/js/rika-toast.js';
//   toast.success('Design saved! Ref RIKA-DESIGN-00012');
//   toast.error('Please enter a valid phone number.', 5000);
//   toast('Thanks!', { type: 'info', title: 'Rika' });
// ============================================================

const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/><path d="M7 12.5l3.2 3.2L17 9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="color:var(--success)"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/><path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="color:var(--danger)"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" opacity="0.35"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" style="color:var(--accent)"/><circle cx="12" cy="7.5" r="1.4" fill="currentColor" style="color:var(--accent)"/></svg>',
};

const DEFAULT_MS = 4000;
let host = null;

function ensureHost() {
  if (host && document.body.contains(host)) return host;
  host = document.createElement('div');
  host.className = 'rik-toasts';
  host.setAttribute('aria-live', 'polite');
  document.body.appendChild(host);
  return host;
}

function show(message, { type = 'success', title = null, ms = DEFAULT_MS, dismissible = true } = {}) {
  if (typeof message !== 'string' || !message.trim()) return;
  const h = ensureHost();
  const el = document.createElement('div');
  el.className = `rik-toast rik-toast-${type}`;
  el.setAttribute('role', 'status');
  const msg = document.createElement('div');
  msg.className = 'rik-toast-msg';
  if (title) {
    const t = document.createElement('strong');
    t.textContent = title;
    t.style.display = 'block';
    t.style.marginBottom = '2px';
    msg.appendChild(t);
  }
  const body = document.createElement('span');
  body.textContent = message;
  msg.appendChild(body);
  el.innerHTML = '';
  const icon = document.createElement('span');
  icon.innerHTML = ICONS[type] || ICONS.info;
  el.prepend(icon);
  el.appendChild(msg);
  const close = () => {
    el.classList.add('leaving');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };
  if (dismissible) el.addEventListener('click', close);
  h.appendChild(el);
  const timer = setTimeout(close, ms);
  el.addEventListener('mouseenter', () => clearTimeout(timer));
  el.addEventListener('mouseleave', () => setTimeout(close, 1500));
  return el;
}

export const toast = {
  show,
  success: (msg, ms) => show(msg, { type: 'success', ms }),
  error: (msg, ms) => show(msg, { type: 'error', ms: ms || DEFAULT_MS + 2000 }),
  info: (msg, ms) => show(msg, { type: 'info', ms }),
};
export default toast;

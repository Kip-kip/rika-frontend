// ============================================================
// Rika — App auth client (T-B4-01)
// JWT session for /rika/app/: signup, login, me, logout.
// Tokens live in localStorage (app is a logged-in section of the
// public site, not a separate origin).
// ============================================================

const API = '/rika/api/auth';
const KEY = 'rika_app_session';

export async function api(path, body = {}, opts = {}) {
  const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
  if (!opts.public) {
    const s = getSession();
    if (s?.access_token) headers['Authorization'] = 'Bearer ' + s.access_token;
  }
  const res = await fetch(API + path, {
    method: opts.method || 'POST',
    headers,
    body: new URLSearchParams(body),
  });
  let data = {};
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    const msg = (data && (data._server_messages || data.exc_type || 'Error')) ;
    const text = Array.isArray(msg) ? msg[0] : (typeof msg === 'string' && msg.startsWith('{') ? (JSON.parse(msg).message || msg) : msg);
    const err = new Error(typeof text === 'string' ? text.replace(/^\d+:\s*/, '') : 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  // Frappe wraps payloads in `message`; unwrap so callers get the object directly.
  return (data && typeof data === 'object' && 'message' in data) ? data.message : data;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
  catch { return null; }
}

export function saveSession(tokens, user) {
  const s = { ...tokens, user, saved_at: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

export function clearSession() {
  localStorage.removeItem(KEY);
}

export function isLoggedIn() {
  const s = getSession();
  if (!s?.access_token) return false;
  // access tokens are ~8h; don't hard-fail on expiry here, let /me decide
  return true;
}

/** Fetch the current user profile; clears the session on 401. */
export async function me() {
  try {
    const r = await api('/me', {}, { method: 'GET', public: false });
    return r.user;
  } catch (e) {
    if (e.status === 401) clearSession();
    throw e;
  }
}

export async function signup(fields) {
  const r = await api('/signup', fields, { public: true });
  return r.user;
}

export async function login(fields) {
  const r = await api('/login', { ...fields, platform: 'desktop' }, { public: true });
  saveSession(r, r.user);
  return r;
}

export async function logout() {
  try { await api('/logout', {}, { method: 'POST', public: false }); }
  catch { /* token already dead — fine */ }
  clearSession();
}

// ============================================================
// Rika Quotation — app (form validation, submission, success)
// ============================================================

// --- DOM refs ---
const $ = (id) => document.getElementById(id);

const form = $('quoteForm');
const success = $('quoteSuccess');

// --- Reference code generation ---
function generateRef() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ALU-${ts}-${rand}`;
}

// --- Validation ---
const validators = {
  name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
  phone: (v) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length < 9) return 'Please enter a valid phone number.';
    return '';
  },
  email: (v) => {
    if (!v.trim()) return '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Please enter a valid email.';
    return '';
  },
  location: (v) => (v.trim().length >= 2 ? '' : 'Please enter your location.'),
  type: (v) => (v ? '' : 'Please select a window type.'),
  quantity: (v) => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1 || n > 999) return 'Enter a quantity between 1 and 999.';
    return '';
  },
  width: (v) => {
    if (!v) return '';
    const n = parseFloat(v);
    if (isNaN(n) || n < 10 || n > 300) return 'Width should be 10–300 cm.';
    return '';
  },
  height: (v) => {
    if (!v) return '';
    const n = parseFloat(v);
    if (isNaN(n) || n < 10 || n > 300) return 'Height should be 10–300 cm.';
    return '';
  },
  consent: (v, el) => (el.checked ? '' : 'Please agree to be contacted.'),
};

function validateField(name) {
  const el = $(`f${name[0].toUpperCase() + name.slice(1)}`);
  const errEl = $(`err-${name}`);
  if (!el || !errEl) return true;

  let message;
  if (name === 'consent') {
    message = validators.consent('', el);
  } else {
    message = validators[name] ? validators[name](el.value) : '';
  }

  const field = el.closest('.field') || el.closest('.consent');
  if (message) {
    if (field) field.classList.add('invalid');
    errEl.textContent = message;
    return false;
  } else {
    if (field) field.classList.remove('invalid');
    errEl.textContent = '';
    return true;
  }
}

function validateForm() {
  const fields = ['name', 'phone', 'email', 'location', 'type', 'quantity', 'width', 'height', 'consent'];
  let allValid = true;
  let firstInvalid = null;

  for (const name of fields) {
    const valid = validateField(name);
    if (!valid && !firstInvalid) firstInvalid = name;
    allValid = allValid && valid;
  }

  if (firstInvalid) {
    const el = $(`f${firstInvalid[0].toUpperCase() + firstInvalid.slice(1)}`);
    if (el) el.focus();
  }

  return allValid;
}

// --- Submission ---
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const btn = $('btnSubmit');
  btn.disabled = true;
  btn.textContent = 'Submitting…';

  // Gather data
  const data = {
    name: $('fName').value.trim(),
    phone: $('fPhone').value.trim(),
    email: $('fEmail').value.trim(),
    location: $('fLocation').value.trim(),
    type: $('fType').value,
    quantity: parseInt($('fQty').value, 10),
    width: $('fWidth').value ? parseFloat($('fWidth').value) : null,
    height: $('fHeight').value ? parseFloat($('fHeight').value) : null,
    finish: $('fFinish').value || null,
    glass: $('fGlass').value || null,
    notes: $('fNotes').value.trim() || null,
    ref: generateRef(),
    submittedAt: new Date().toISOString(),
  };

  try {
    // POST to backend if available, fallback to localStorage
    let saved = false;
    try {
      const resp = await fetch('/rika/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (resp.ok) saved = true;
    } catch {
      // Backend not available — save locally
    }

    if (!saved) {
      const existing = JSON.parse(localStorage.getItem('rika_quotes') || '[]');
      existing.push(data);
      localStorage.setItem('rika_quotes', JSON.stringify(existing));
    }

    // Show success
    $('successName').textContent = data.name;
    $('successRef').textContent = data.ref;
    form.classList.add('hidden');
    success.classList.remove('hidden');
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Submit Request';
  }
}

// --- Wire up ---
function initQuotation() {
  form.addEventListener('submit', handleSubmit);

  // Live validation on blur
  const fields = ['name', 'phone', 'email', 'location', 'type', 'quantity', 'width', 'height'];
  for (const name of fields) {
    const el = $(`f${name[0].toUpperCase() + name.slice(1)}`);
    if (el) {
      el.addEventListener('blur', () => validateField(name));
      el.addEventListener('input', () => {
        const field = el.closest('.field');
        if (field && field.classList.contains('invalid')) validateField(name);
      });
    }
  }

  $('fConsent').addEventListener('change', () => validateField('consent'));

  // New request
  $('btnNewRequest').addEventListener('click', () => {
    form.reset();
    form.classList.remove('hidden');
    success.classList.add('hidden');
    // Clear any validation states
    document.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
    document.querySelectorAll('.field-error').forEach((e) => (e.textContent = ''));
    window.scrollTo(0, 0);
  });

  // Burger
  const burger = $('burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const nav = document.querySelector('.nav');
      nav.classList.toggle('open');
      burger.classList.toggle('open');
    });
  }
}

document.addEventListener('DOMContentLoaded', initQuotation);

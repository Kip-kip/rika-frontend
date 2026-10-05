// ============================================================
// Rika — "House Window Map" (T-B3-06 / DESIGN-4)
// Sample floor plan → click openings → window schedule with
// live budget estimate from the shared pricing engine.
// Deterministic, all on-device.
// ============================================================
import { computePrice, formatKsh, formatRange, waLink, GLASS, FINISHES } from '../../shared/js/rika-price.js';

// ---------- options ----------
const STYLES = [
  { id: 'sliding',  txt: 'Sliding'  },
  { id: 'casement', txt: 'Casement' },
  { id: 'fixed',    txt: 'Fixed'    },
];
const FINISHES_OPT = [
  { id: 'black',  sw: '#1a1a1a', txt: 'Matte Black' },
  { id: 'silver', sw: '#b9c0c7', txt: 'Silver' },
  { id: 'bronze', sw: '#8a6a4f', txt: 'Bronze' },
  { id: 'white',  sw: '#f2f2f2', txt: 'White' },
];
const GLASSES_OPT = [
  { id: 'clear',   txt: 'Clear'   },
  { id: 'tinted',  txt: 'Tinted'  },
  { id: 'frosted', txt: 'Frosted' },
];

// ---------- floor plans (viewBox 0 0 800 560) ----------
// openings: x,y (marker center), room, default type, size [w,h] cm
const PLANS = {
  bungalow: {
    label: 'Bungalow (1 storey)', ico: '🏠',
    rooms: [
      { name: 'LIVING',   x: 40,  y: 80,  w: 280, h: 200 },
      { name: 'DINING',   x: 320, y: 80,  w: 200, h: 200 },
      { name: 'KITCHEN',  x: 520, y: 80,  w: 240, h: 200 },
      { name: 'BEDROOM 1',x: 40,  y: 280, w: 240, h: 200 },
      { name: 'BEDROOM 2',x: 280, y: 280, w: 220, h: 200 },
      { name: 'BATH',     x: 500, y: 280, w: 120, h: 200 },
      { name: 'UTILITY',  x: 620, y: 280, w: 140, h: 200 },
    ],
    openings: [
      { id: 'W01', x: 180, y: 80,  room: 'Living',   type: 'sliding',  size: [180, 130] },
      { id: 'W02', x: 420, y: 80,  room: 'Dining',   type: 'fixed',    size: [150, 130] },
      { id: 'W03', x: 640, y: 80,  room: 'Kitchen',  type: 'sliding',  size: [140, 110] },
      { id: 'W04', x: 160, y: 480, room: 'Bedroom 1',type: 'casement', size: [120, 120] },
      { id: 'W05', x: 390, y: 480, room: 'Bedroom 2',type: 'casement', size: [120, 120] },
      { id: 'W06', x: 560, y: 480, room: 'Bath',     type: 'casement', size: [80,  100], glass: 'frosted' },
      { id: 'W07', x: 690, y: 280, room: 'Utility',  type: 'fixed',    size: [60,  60]  },
      { id: 'D01', x: 40,  y: 380, room: 'Entry',    type: 'sliding',  size: [110, 200], door: true },
    ],
  },
  b3: {
    label: '3-bedroom', ico: '🏡',
    rooms: [
      { name: 'LIVING',   x: 40,  y: 80,  w: 300, h: 180 },
      { name: 'DINING',   x: 340, y: 80,  w: 180, h: 180 },
      { name: 'KITCHEN',  x: 520, y: 80,  w: 240, h: 180 },
      { name: 'MASTER',   x: 40,  y: 260, w: 240, h: 220 },
      { name: 'BED 2',    x: 280, y: 260, w: 200, h: 220 },
      { name: 'BED 3',    x: 480, y: 260, w: 180, h: 220 },
      { name: 'BATH',     x: 660, y: 260, w: 100, h: 220 },
    ],
    openings: [
      { id: 'W01', x: 190, y: 80,  room: 'Living',   type: 'sliding',  size: [200, 140] },
      { id: 'W02', x: 430, y: 80,  room: 'Dining',   type: 'fixed',    size: [150, 130] },
      { id: 'W03', x: 640, y: 80,  room: 'Kitchen',  type: 'sliding',  size: [140, 110] },
      { id: 'W04', x: 160, y: 480, room: 'Master',   type: 'casement', size: [150, 130] },
      { id: 'W05', x: 380, y: 480, room: 'Bed 2',    type: 'casement', size: [120, 120] },
      { id: 'W06', x: 570, y: 480, room: 'Bed 3',    type: 'casement', size: [120, 120] },
      { id: 'W07', x: 710, y: 480, room: 'Bath',     type: 'casement', size: [80, 100], glass: 'frosted' },
      { id: 'D01', x: 340, y: 260, room: 'Entry',    type: 'sliding',  size: [110, 200], door: true },
    ],
  },
  b5: {
    label: '5-bedroom', ico: '🏰',
    rooms: [
      { name: 'GREAT ROOM', x: 40,  y: 80,  w: 340, h: 180 },
      { name: 'DINING',     x: 380, y: 80,  w: 180, h: 180 },
      { name: 'KITCHEN',    x: 560, y: 80,  w: 200, h: 180 },
      { name: 'MASTER',     x: 40,  y: 260, w: 220, h: 140 },
      { name: 'M-BATH',     x: 260, y: 260, w: 120, h: 140 },
      { name: 'BED 2',      x: 380, y: 260, w: 160, h: 140 },
      { name: 'BED 3',      x: 540, y: 260, w: 160, h: 140 },
      { name: 'BED 4',      x: 700, y: 260, w: 60,  h: 140 },
      { name: 'BED 5',      x: 40,  y: 400, w: 220, h: 100 },
      { name: 'MEDIA',      x: 260, y: 400, w: 200, h: 100 },
      { name: 'BATH 2',     x: 460, y: 400, w: 120, h: 100 },
      { name: 'UTILITY',    x: 580, y: 400, w: 180, h: 100 },
    ],
    openings: [
      { id: 'W01', x: 210, y: 80,  room: 'Great room', type: 'sliding',  size: [240, 150] },
      { id: 'W02', x: 470, y: 80,  room: 'Dining',     type: 'fixed',    size: [160, 140] },
      { id: 'W03', x: 660, y: 80,  room: 'Kitchen',    type: 'sliding',  size: [160, 130] },
      { id: 'W04', x: 150, y: 260, room: 'Master',     type: 'casement', size: [160, 140] },
      { id: 'W05', x: 320, y: 260, room: 'M-Bath',     type: 'casement', size: [80, 110], glass: 'frosted' },
      { id: 'W06', x: 460, y: 400, room: 'Bed 2',      type: 'casement', size: [140, 130] },
      { id: 'W07', x: 620, y: 400, room: 'Bed 3',      type: 'casement', size: [130, 130] },
      { id: 'W08', x: 730, y: 330, room: 'Bed 4',      type: 'casement', size: [120, 120] },
      { id: 'W09', x: 150, y: 500, room: 'Bed 5',      type: 'casement', size: [130, 130] },
      { id: 'W10', x: 360, y: 500, room: 'Media',      type: 'fixed',    size: [120, 90]  },
      { id: 'W11', x: 520, y: 500, room: 'Bath 2',     type: 'casement', size: [80, 100], glass: 'frosted' },
      { id: 'W12', x: 670, y: 500, room: 'Utility',    type: 'fixed',    size: [60, 60]   },
      { id: 'D01', x: 380, y: 170, room: 'Entry',      type: 'sliding',  size: [120, 200], door: true },
    ],
  },
};

// ---------- state ----------
const state = { plan: 'b3', style: 'sliding', finish: 'black', glass: 'clear' };
// schedule: [{id, room, type, w, h, qty, glass, door}]
let schedule = [];

// ---------- floor plan SVG ----------
function planSVG() {
  const P = PLANS[state.plan];
  let s = '';
  s += `<rect width="800" height="560" fill="#0d1117"/>`;
  // rooms
  for (const r of P.rooms) {
    s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="#161b22" stroke="#2a313c" stroke-width="3"/>`;
    s += `<text x="${r.x + 10}" y="${r.y + 22}" fill="#8b95a1" font-size="12" font-family="sans-serif" letter-spacing="1">${r.name}</text>`;
  }
  // openings (markers)
  for (const o of P.openings) {
    const inSched = schedule.some(x => x.id === o.id);
    const r = o.door ? 16 : 12;
    s += `<g class="hm-marker ${inSched ? 'hm-placed' : ''}" data-oid="${o.id}" style="cursor:pointer">
      <circle cx="${o.x}" cy="${o.y}" r="${r + 6}" fill="${inSched ? 'rgba(184,116,26,.25)' : 'rgba(139,149,161,.12)'}"/>
      <circle cx="${o.x}" cy="${o.y}" r="${r}" fill="${inSched ? '#b8741a' : '#1c222b'}" stroke="${inSched ? '#b8741a' : '#4a5568'}" stroke-width="2"/>
      <text x="${o.x}" y="${o.y + 4}" text-anchor="middle" fill="${inSched ? '#fff' : '#c7cdd4'}" font-size="${o.door ? 10 : 11}" font-weight="700" font-family="sans-serif">${o.id}</text>
    </g>`;
  }
  return `<svg viewBox="0 0 800 560" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${P.label} floor plan">${s}</svg>`;
}

// ---------- price ----------
function itemPrice(item) {
  const area = (item.w / 100) * (item.h / 100) * item.qty;
  const addOns = item.glass === 'frosted' ? ['frosted'] : item.glass === 'tinted' ? ['tint'] : [];
  return computePrice({
    product: item.door ? 'sliding' : item.type,
    area, qty: item.qty,
    finish: state.finish, glass: item.glass,
    tier: 'comfort', addOns,
  }).total;
}

// ---------- render ----------
const $ = (s) => document.querySelector(s);

function renderPlan() {
  const wrap = $('#mapWrap');
  wrap.innerHTML = planSVG();
  wrap.querySelectorAll('.hm-marker').forEach(m => {
    m.addEventListener('click', () => {
      const oid = m.dataset.oid;
      const idx = schedule.findIndex(x => x.id === oid);
      if (idx >= 0) {
        schedule.splice(idx, 1);
      } else {
        const P = PLANS[state.plan];
        const o = P.openings.find(x => x.id === oid);
        schedule.push({
          id: o.id, room: o.room,
          type: o.door ? 'sliding' : (o.type || state.style),
          w: o.size[0], h: o.size[1], qty: 1,
          glass: o.glass || state.glass,
          door: !!o.door,
        });
      }
      renderAll();
    });
  });
}

function renderSchedule() {
  const tbody = $('#schedBody');
  tbody.innerHTML = '';
  let total = 0, totalArea = 0, totalQty = 0;
  for (const item of schedule) {
    const price = itemPrice(item);
    const area = (item.w / 100) * (item.h / 100) * item.qty;
    total += price; totalArea += area; totalQty += item.qty;
    const typeLabel = item.door ? 'Door' : (STYLES.find(s => s.id === item.type)?.txt || item.type);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${item.id}</strong>${item.door ? ' 🚪' : ''}</td>
      <td>${item.room}</td>
      <td>${typeLabel}</td>
      <td>${item.w} × ${item.h}</td>
      <td>${item.qty}</td>
      <td>${area.toFixed(1)}</td>
      <td>${formatKsh(price)}</td>
      <td><button class="hm-del" data-oid="${item.id}" title="Remove" type="button">✕</button></td>`;
    tr.querySelector('.hm-del').addEventListener('click', () => {
      schedule = schedule.filter(x => x.id !== item.id);
      renderAll();
    });
    tbody.appendChild(tr);
  }
  $('#totCount').textContent = schedule.length;
  $('#totArea').textContent = totalArea.toFixed(1);
  $('#totPrice').textContent = total ? formatKsh(total) : '—';
  $('#totPrice').dataset.range = total ? formatRange(total) : '';

  // CTAs
  if (schedule.length) {
    const wa = waLink(
      `Hi Rika! I used the House Window Map.\n` +
      `Plan: ${PLANS[state.plan].label}\nOpenings: ${schedule.length}\n` +
      `Total: ${formatKsh(total)} (${formatRange(total)})\n` +
      schedule.map(i => `${i.id} ${i.room}: ${i.w}x${i.h} ×${i.qty}`).join('\n') +
      `\nCan I book a free measurement?`
    );
    $('#ctaWa').href = wa;
    const first = schedule[0];
    $('#ctaQuote').href =
      `/rika/tools/quotation/?type=${first.type}&w=${first.w}&h=${first.h}` +
      `&qty=${totalQty}&tier=comfort&from=house-map`;
  }
  const estEl = $('#totPrice');
  estEl.title = estEl.dataset.range || '';
}

function buildChips(el, opts, key, withSwatch) {
  el.innerHTML = '';
  for (const o of opts) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = o.id;
    b.className = 'hm-chip' + (state[key] === o.id ? ' active' : '');
    b.innerHTML = (withSwatch ? `<span class="hm-swatch" style="background:${o.sw}"></span>` : '') + `<span>${o.txt}</span>`;
    b.addEventListener('click', () => {
      state[key] = o.id;
      // apply default to not-yet-placed glass/type choices only for new additions;
      // existing items keep their own choice
      renderAll();
    });
    el.appendChild(b);
  }
}

function renderAll() {
  renderPlan();
  renderSchedule();
  // update chip active states
  for (const [id, key] of [['#planChips','plan'],['#styleChips','style'],['#finishChips','finish'],['#glassChips','glass']]) {
    document.querySelectorAll(`${id} .hm-chip`).forEach(c => {
      c.classList.toggle('active', c.dataset.id === state[key]);
    });
  }
}

function buildPlanChips() {
  const g = $('#planChips');
  g.innerHTML = '';
  for (const id of Object.keys(PLANS)) {
    const P = PLANS[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = id;
    b.className = 'hm-chip hm-plan-chip' + (state.plan === id ? ' active' : '');
    b.innerHTML = `<span>${P.ico} ${P.label}</span>`;
    b.addEventListener('click', () => {
      state.plan = id;
      schedule = schedule.filter(x => false); // new plan = new schedule
      renderAll();
    });
    g.appendChild(b);
  }
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  buildPlanChips();
  buildChips($('#styleChips'), STYLES, 'style');
  buildChips($('#finishChips'), FINISHES_OPT, 'finish', true);
  buildChips($('#glassChips'), GLASSES_OPT, 'glass');
  document.querySelectorAll('#styleChips .hm-chip, #finishChips .hm-chip, #glassChips .hm-chip').forEach(c => {
    c.dataset.id = c.textContent.trim().split(' ')[0].toLowerCase();
  });
  // fix data-id mapping (simpler: set explicitly)
  $('#styleChips').querySelectorAll('.hm-chip').forEach((c, i) => c.dataset.id = STYLES[i].id);
  $('#finishChips').querySelectorAll('.hm-chip').forEach((c, i) => c.dataset.id = FINISHES_OPT[i].id);
  $('#glassChips').querySelectorAll('.hm-chip').forEach((c, i) => c.dataset.id = GLASSES_OPT[i].id);
  $('#btnClear').addEventListener('click', () => { schedule = []; renderAll(); });
  renderAll();
});

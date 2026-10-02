// ============================================================
// Rika Visualizer — UI wiring
// All DOM access, event handlers, and step navigation live here.
// Pure logic is imported from geometry.js, templates.js, image.js.
// ============================================================
import { state, CORNER_ORDER, CORNER_NUM, cornerMarkers, FINISHES, GLASSES, T_W, T_H, FRAME_W } from './state.js';
import { computeHomography, applyH, validateQuad } from './geometry.js';
import { renderTemplate, templateThumbSvg, DESIGNS } from './templates.js';
import { loadImageWithOrientation, downscale, validateImageFile } from './image.js';

// ---------- Toast ----------
let toastTimer = null;
export function toast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 3000);
}

// ---------- Step navigation ----------
export function showStep(step) {
  state.step = step;
  document.getElementById('uploadScreen').classList.toggle('hidden', step !== 'upload');
  document.getElementById('editScreen').classList.toggle('hidden', step !== 'edit');
  document.getElementById('previewScreen').classList.toggle('hidden', step !== 'preview');
  document.getElementById('baScreen').classList.toggle('hidden', step !== 'beforeafter');
  const hints = {
    upload: 'Upload a photo',
    edit: 'Mark the 4 corners',
    preview: 'Choose your design',
    beforeafter: 'Compare before & after',
  };
  const hintEl = document.getElementById('stepHint');
  if (hintEl) hintEl.textContent = hints[step] || '';
}

// ---------- Photo upload ----------
export function setupUpload() {
  const fileInput = document.getElementById('fileInput');
  document.getElementById('btnUpload').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const errEl = document.getElementById('uploadError');
    errEl.classList.add('hidden');

    const err = validateImageFile(file);
    if (err) {
      errEl.textContent = err;
      errEl.classList.remove('hidden');
      return;
    }

    loadImageWithOrientation(file).then(([src, w, h]) => {
      if (!src) {
        errEl.textContent = 'Could not load image. Please try another file.';
        errEl.classList.remove('hidden');
        return;
      }
      if (w < 200 || h < 200) {
        errEl.textContent = 'Image is too small to work with.';
        errEl.classList.remove('hidden');
        return;
      }
      const workCanvas = downscale(src, 1400);
      state.photo = { img: src, naturalW: w, naturalH: h, workCanvas, workW: workCanvas.width, workH: workCanvas.height };
      state.opening = { tl: null, tr: null, br: null, bl: null };
      state.cornersPlaced = 0;
      state.design = 'sliding3';
      state.finish = 'black';
      state.glass = 'clear';
      cornerMarkers.length = 0;
      showStep('edit');
      initEditCanvas();
    });
    fileInput.value = '';
  });
}

// ---------- Corner selection ----------
function initEditCanvas() {
  const canvas = document.getElementById('stageCanvas');
  const { workCanvas, workW, workH } = state.photo;
  canvas.width = workW;
  canvas.height = workH;
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
  state.opening = { tl: null, tr: null, br: null, bl: null };
  state.cornersPlaced = 0;
  cornerMarkers.length = 0;
  drawEditFrame();
  document.getElementById('cornerHint').classList.remove('hidden');
  document.getElementById('btnShowPreview').disabled = true;
}

function drawEditFrame() {
  const canvas = document.getElementById('stageCanvas');
  const ctx = canvas.getContext('2d');
  const { workCanvas, workW, workH } = state.photo;
  ctx.clearRect(0, 0, workW, workH);
  ctx.drawImage(workCanvas, 0, 0, workW, workH);

  for (const m of cornerMarkers) {
    const px = m.x * workW, py = m.y * workH;
    const r = Math.max(14, workW * 0.02);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(59,130,246,0.3)';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${r * 0.9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CORNER_NUM[m.key], px, py);
  }

  if (state.cornersPlaced >= 4) {
    const pts = CORNER_ORDER.map((k) => cornerMarkers.find((m) => m.key === k));
    if (pts.every((p) => p)) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x * workW, pts[0].y * workH);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x * workW, pts[i].y * workH);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(34,197,94,0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}

function getCanvasPos(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}

function nearestMarker(pos, threshold) {
  const workW = state.photo.workW, workH = state.photo.workH;
  const th = threshold * Math.min(workW, workH);
  let best = null, bestDist = Infinity;
  for (const m of cornerMarkers) {
    const dx = (m.x - pos.x) * workW, dy = (m.y - pos.y) * workH;
    const d = Math.hypot(dx, dy);
    if (d < th && d < bestDist) { best = m; bestDist = d; }
  }
  return best;
}

export function setupEditCanvas() {
  const canvas = document.getElementById('stageCanvas');
  let dragKey = null;

  canvas.addEventListener('pointerdown', (e) => {
    if (!state.photo) return;
    e.preventDefault();
    const pos = getCanvasPos(canvas, e);
    const near = nearestMarker(pos, 0.04);
    if (near) {
      dragKey = near.key;
      return;
    }
    if (state.cornersPlaced < 4) {
      const key = CORNER_ORDER[state.cornersPlaced];
      const marker = { key, x: pos.x, y: pos.y };
      cornerMarkers.push(marker);
      state.opening[key] = { x: pos.x, y: pos.y };
      state.cornersPlaced++;
      if (state.cornersPlaced === 4) {
        document.getElementById('cornerHint').classList.add('hidden');
        document.getElementById('btnShowPreview').disabled = false;
      }
      drawEditFrame();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragKey) return;
    e.preventDefault();
    const pos = getCanvasPos(canvas, e);
    const marker = cornerMarkers.find((m) => m.key === dragKey);
    if (marker) {
      marker.x = pos.x;
      marker.y = pos.y;
      state.opening[dragKey] = { x: pos.x, y: pos.y };
      drawEditFrame();
    }
  });

  canvas.addEventListener('pointerup', () => { dragKey = null; });
  canvas.addEventListener('pointerleave', () => { dragKey = null; });
}

document.getElementById('btnBackPhoto').addEventListener('click', () => {
  state.photo = null;
  state.opening = null;
  cornerMarkers.length = 0;
  showStep('upload');
});

document.getElementById('btnShowPreview').addEventListener('click', () => {
  if (state.cornersPlaced < 4) {
    toast('Please mark all four corners first.');
    return;
  }
  const o = state.opening;
  const v = validateQuad(o.tl, o.tr, o.br, o.bl);
  if (!v.valid) {
    toast(v.reason);
    return;
  }
  showStep('preview');
  initPreview();
});

// ---------- Preview rendering ----------
async function initPreview() {
  const canvas = document.getElementById('previewCanvas');
  const { workW, workH } = state.photo;
  canvas.width = workW;
  canvas.height = workH;
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
  renderPreview();
}

export async function renderPreview() {
  const canvas = document.getElementById('previewCanvas');
  const ctx = canvas.getContext('2d');
  const { workCanvas, workW, workH } = state.photo;
  if (!workCanvas) return;

  ctx.clearRect(0, 0, workW, workH);
  ctx.drawImage(workCanvas, 0, 0, workW, workH);

  const finishColor = FINISHES[state.finish].color;
  const glassColor = GLASSES[state.glass].tint;
  const glassAlpha = GLASSES[state.glass].alpha;
  const tplCanvas = await renderTemplate(state.design, finishColor, glassColor, glassAlpha);
  if (!tplCanvas) return;

  const H = computeOpeningHomography();
  if (!H) return;

  warpToQuad(ctx, tplCanvas, H, workW, workH);
  drawQuadOutline(ctx, workW, workH);
}

function computeOpeningHomography() {
  const o = state.opening;
  if (!o || !o.tl || !o.tr || !o.br || !o.bl) return null;
  const { workW, workH } = state.photo;
  const srcPts = [
    [FRAME_W, FRAME_W],
    [T_W - FRAME_W, FRAME_W],
    [T_W - FRAME_W, T_H - FRAME_W],
    [FRAME_W, T_H - FRAME_W],
  ];
  const dstPts = [
    [o.tl.x * workW, o.tl.y * workH],
    [o.tr.x * workW, o.tr.y * workH],
    [o.br.x * workW, o.br.y * workH],
    [o.bl.x * workW, o.bl.y * workH],
  ];
  return computeHomography(srcPts, dstPts);
}

function drawQuadOutline(ctx, w, h) {
  const o = state.opening;
  if (!o) return;
  ctx.beginPath();
  ctx.moveTo(o.tl.x * w, o.tl.y * h);
  ctx.lineTo(o.tr.x * w, o.tr.y * h);
  ctx.lineTo(o.br.x * w, o.br.y * h);
  ctx.lineTo(o.bl.x * w, o.bl.y * h);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(59,130,246,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Warp a template canvas into the destination quad via mesh-based perspective mapping
function warpToQuad(ctx, srcCanvas, H, dW, dH) {
  const srcW = srcCanvas.width, srcH = srcCanvas.height;
  const cellSrc = 4;
  const cols = Math.ceil(T_W / cellSrc);
  const rows = Math.ceil(T_H / cellSrc);
  const cw = srcW / cols, ch = srcH / rows;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = c * cellSrc, y0 = r * cellSrc;
      const x1 = Math.min(x0 + cellSrc, T_W), y1 = Math.min(y0 + cellSrc, T_H);
      const sx0 = c * cw, sy0 = r * ch;
      const sx1 = (c + 1) * cw, sy1 = Math.min((r + 1) * ch, srcH);
      if (sx1 <= sx0 || sy1 <= sy0) continue;

      const [dx0, dy0] = applyH(H, x0, y0);
      const [dx1, dy1] = applyH(H, x1, y0);
      const [dx2, dy2] = applyH(H, x1, y1);
      const [dx3, dy3] = applyH(H, x0, y1);

      const minX = Math.max(0, Math.min(dx0, dx1, dx2, dx3) - 1);
      const minY = Math.max(0, Math.min(dy0, dy1, dy2, dy3) - 1);
      const maxX = Math.min(dW, Math.max(dx0, dx1, dx2, dx3) + 1);
      const maxY = Math.min(dH, Math.max(dy0, dy1, dy2, dy3) + 1);
      const bw = maxX - minX, bh = maxY - minY;
      if (bw < 0.5 || bh < 0.5) continue;

      ctx.beginPath();
      ctx.moveTo(dx0 - minX, dy0 - minY);
      ctx.lineTo(dx1 - minX, dy1 - minY);
      ctx.lineTo(dx2 - minX, dy2 - minY);
      ctx.lineTo(dx3 - minX, dy3 - minY);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(srcCanvas, sx0, sy0, sx1 - sx0, sy1 - sy0, minX, minY, bw, bh);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- Selectors (design / finish / glass) ----------
export function buildSelectors() {
  const ds = document.getElementById('designScroll');
  ds.innerHTML = '';
  for (const [id, d] of Object.entries(DESIGNS)) {
    const card = document.createElement('div');
    card.className = 'design-card' + (state.design === id ? ' selected' : '');
    card.innerHTML = `<canvas class="thumb" width="44" height="34"></canvas><span class="name">${d.label}</span>`;
    card.addEventListener('click', () => {
      state.design = id;
      document.querySelectorAll('.design-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      renderPreview();
    });
    const tc = card.querySelector('.thumb').getContext('2d');
    const blob = new Blob([templateThumbSvg(id, '#333')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const tmpImg = new Image();
    tmpImg.onload = () => {
      tc.drawImage(tmpImg, 0, 0, 44, 34);
      URL.revokeObjectURL(url);
    };
    tmpImg.src = url;
    ds.appendChild(card);
  }

  const fr = document.getElementById('finishRow');
  fr.innerHTML = '';
  for (const [id, fin] of Object.entries(FINISHES)) {
    const chip = document.createElement('div');
    chip.className = 'finish-chip' + (state.finish === id ? ' selected' : '');
    chip.innerHTML = `<div class="swatch" style="background:${fin.color}"></div>${fin.label}`;
    chip.addEventListener('click', () => {
      state.finish = id;
      document.querySelectorAll('.finish-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      renderPreview();
    });
    fr.appendChild(chip);
  }

  const gr = document.getElementById('glassRow');
  gr.innerHTML = '';
  for (const [id, g] of Object.entries(GLASSES)) {
    const chip = document.createElement('div');
    chip.className = 'glass-chip' + (state.glass === id ? ' selected' : '');
    chip.textContent = g.label;
    chip.addEventListener('click', () => {
      state.glass = id;
      document.querySelectorAll('.glass-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      renderPreview();
    });
    gr.appendChild(chip);
  }
}

document.getElementById('btnAdjustOpening').addEventListener('click', () => {
  showStep('edit');
  initEditCanvas();
});

// ---------- Before/After ----------
let baPos = 0.5;
async function initBeforeAfter() {
  const canvas = document.getElementById('baCanvas');
  const { workW, workH } = state.photo;
  canvas.width = workW;
  canvas.height = workH;

  const off = document.createElement('canvas');
  off.width = workW; off.height = workH;
  const octx = off.getContext('2d');
  octx.drawImage(state.photo.workCanvas, 0, 0);
  const finishColor = FINISHES[state.finish].color;
  const glassColor = GLASSES[state.glass].tint;
  const glassAlpha = GLASSES[state.glass].alpha;
  const tplCanvas = await renderTemplate(state.design, finishColor, glassColor, glassAlpha);
  if (tplCanvas) {
    const H = computeOpeningHomography();
    if (H) warpToQuad(octx, tplCanvas, H, workW, workH);
  }

  state._baOff = off;
  showStep('beforeafter');
  drawBA();
}

function drawBA() {
  const canvas = document.getElementById('baCanvas');
  const ctx = canvas.getContext('2d');
  const { workW, workH } = state.photo;
  if (!state._baOff) return;
  ctx.clearRect(0, 0, workW, workH);
  ctx.drawImage(state._baOff, 0, 0);
  const splitX = baPos * workW;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, splitX, workH);
  ctx.clip();
  ctx.drawImage(state.photo.workCanvas, 0, 0);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(splitX, 0); ctx.lineTo(splitX, workH);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.stroke();
}

function setupBA() {
  const divider = document.getElementById('baDivider');
  let dragging = false;

  const update = (clientX) => {
    const rect = document.getElementById('baCanvas').getBoundingClientRect();
    baPos = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    divider.style.left = (baPos * 100) + '%';
    drawBA();
  };

  divider.addEventListener('pointerdown', (e) => { dragging = true; e.preventDefault(); });
  window.addEventListener('pointermove', (e) => { if (dragging) update(e.clientX); });
  window.addEventListener('pointerup', () => { dragging = false; });

  document.getElementById('btnBAOrig').addEventListener('click', () => { baPos = 0.02; divider.style.left = '2%'; drawBA(); });
  document.getElementById('btnBAVis').addEventListener('click', () => { baPos = 0.98; divider.style.left = '98%'; drawBA(); });
  document.getElementById('btnBABack').addEventListener('click', () => showStep('preview'));
}

document.getElementById('btnBeforeAfter').addEventListener('click', () => initBeforeAfter());

// ---------- Quote ----------
function openQuote() {
  const summary = document.getElementById('quoteSummary');
  const d = DESIGNS[state.design];
  summary.innerHTML = `<b>Design:</b> ${d.label}<br><b>Frame:</b> ${FINISHES[state.finish].label}<br><b>Glass:</b> ${GLASSES[state.glass].label}`;
  document.getElementById('quoteModal').classList.remove('hidden');
}
function closeQuote() {
  document.getElementById('quoteModal').classList.add('hidden');
}
document.getElementById('btnQuote').addEventListener('click', openQuote);
document.getElementById('btnBAQuote').addEventListener('click', openQuote);
document.getElementById('btnCloseModal').addEventListener('click', closeQuote);
document.getElementById('btnCancelQuote').addEventListener('click', closeQuote);
document.getElementById('btnSubmitQuote').addEventListener('click', () => {
  const name = document.getElementById('qName').value.trim();
  const phone = document.getElementById('qPhone').value.trim();
  if (!name || !phone) {
    toast('Please enter your name and phone number.');
    return;
  }
  closeQuote();
  toast('Thank you! Our team will contact you shortly with a quote. 🎉');
});

// ---------- Init ----------
export function initVisualizer() {
  buildSelectors();
  setupUpload();
  setupEditCanvas();
  setupBA();
  showStep('upload');
}

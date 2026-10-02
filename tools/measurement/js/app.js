// ============================================================
// Rika Measurement — app (UI wiring, corner selection, results)
// ============================================================

import { loadImageWithOrientation, downscale } from './image.js';
import { measureOpening, validateQuad } from './geometry.js';

// --- State ---
const state = {
  photo: null,      // { image, width, height, dataUrl }
  refCorners: [],   // 4 pts in image-pixel coords [x, y]
  openCorners: [],  // 4 pts in image-pixel coords [x, y]
  step: 'upload',   // 'upload' | 'reference' | 'opening' | 'results'
};

const CORNER_LABELS = ['Top-left', 'Top-right', 'Bottom-right', 'Bottom-left'];

// --- DOM refs ---
const $ = (id) => document.getElementById(id);
const stepUpload = $('stepUpload');
const stepReference = $('stepReference');
const stepOpening = $('stepOpening');
const stepResults = $('stepResults');

const refCanvas = $('refCanvas');
const openCanvas = $('openCanvas');
const resultCanvas = $('resultCanvas');

const refHint = $('refHint');
const openHint = $('openHint');

// --- Navigation ---
function showStep(name) {
  state.step = name;
  [stepUpload, stepReference, stepOpening, stepResults].forEach((s) => s.classList.add('hidden'));
  const map = { upload: stepUpload, reference: stepReference, opening: stepOpening, results: stepResults };
  map[name].classList.remove('hidden');
  window.scrollTo(0, 0);
}

// --- Photo upload ---
async function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }
  try {
    const loaded = await loadImageWithOrientation(file);
    const scaled = await downscale(loaded.dataUrl, 1400);
    state.photo = scaled;
    state.refCorners = [];
    state.openCorners = [];
    setupCanvas(refCanvas, state.photo);
    setupCanvas(openCanvas, state.photo);
    setupCanvas(resultCanvas, state.photo);
    showStep('reference');
    drawRefCanvas();
  } catch (err) {
    console.error(err);
    alert('Could not load the image. Please try another photo.');
  }
}

// --- Canvas helpers ---
function setupCanvas(canvas, photo) {
  canvas.width = photo.width;
  canvas.height = photo.height;
  canvas.style.aspectRatio = `${photo.width} / ${photo.height}`;
}

function getCanvasCoords(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (cx - rect.left) * scaleX,
    y: (cy - rect.top) * scaleY,
  };
}

// --- Drawing ---
function drawQuad(ctx, corners, color, fill) {
  if (corners.length < 4) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(corners[0][0], corners[0][1]);
  for (let i = 1; i < 4; i++) ctx.lineTo(corners[i][0], corners[i][1]);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, ctx.canvas.width / 200);
  ctx.stroke();
  ctx.restore();
}

function drawMarkers(ctx, corners, color) {
  corners.forEach(([x, y], i) => {
    ctx.save();
    const r = Math.max(10, ctx.canvas.width / 40);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${r * 0.9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x, y);
    ctx.restore();
  });
}

function drawRefCanvas() {
  const ctx = refCanvas.getContext('2d');
  ctx.clearRect(0, 0, refCanvas.width, refCanvas.height);
  if (state.photo) ctx.drawImage(state.photo.image, 0, 0);
  drawQuad(ctx, state.refCorners, '#3b82f6', 'rgba(59,130,246,0.15)');
  drawMarkers(ctx, state.refCorners, '#3b82f6');
  updateHint(refHint, state.refCorners.length);
}

function drawOpenCanvas() {
  const ctx = openCanvas.getContext('2d');
  ctx.clearRect(0, 0, openCanvas.width, openCanvas.height);
  if (state.photo) ctx.drawImage(state.photo.image, 0, 0);
  // Draw reference in faint
  if (state.refCorners.length === 4) {
    drawQuad(ctx, state.refCorners, 'rgba(59,130,246,0.3)', 'rgba(59,130,246,0.05)');
  }
  drawQuad(ctx, state.openCorners, '#22c55e', 'rgba(34,197,94,0.15)');
  drawMarkers(ctx, state.openCorners, '#22c55e');
  updateHint(openHint, state.openCorners.length);
}

function drawResultCanvas() {
  const ctx = resultCanvas.getContext('2d');
  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  if (state.photo) ctx.drawImage(state.photo.image, 0, 0);
  if (state.refCorners.length === 4) {
    drawQuad(ctx, state.refCorners, '#3b82f6', 'rgba(59,130,246,0.1)');
  }
  drawQuad(ctx, state.openCorners, '#22c55e', 'rgba(34,197,94,0.15)');
  drawMarkers(ctx, state.openCorners, '#22c55e');
}

function updateHint(hintEl, count) {
  if (count >= 4) {
    hintEl.classList.add('hidden');
  } else {
    hintEl.classList.remove('hidden');
    const num = count + 1;
    const label = CORNER_LABELS[count];
    hintEl.innerHTML = `<span class="hint-badge">${num}</span> Tap the ${label.toLowerCase()} corner`;
  }
}

// --- Corner selection handlers ---
function handleRefClick(e) {
  if (state.refCorners.length >= 4) return;
  const { x, y } = getCanvasCoords(refCanvas, e);
  state.refCorners.push([x, y]);
  drawRefCanvas();
  if (state.refCorners.length === 4) {
    const v = validateQuad(state.refCorners, 500);
    if (!v.valid) {
      setTimeout(() => {
        alert(v.reason);
        state.refCorners = [];
        drawRefCanvas();
      }, 100);
      return;
    }
    setTimeout(() => showStep('opening'), 400);
  }
}

function handleOpenClick(e) {
  if (state.openCorners.length >= 4) return;
  const { x, y } = getCanvasCoords(openCanvas, e);
  state.openCorners.push([x, y]);
  drawOpenCanvas();
  if (state.openCorners.length === 4) {
    const v = validateQuad(state.openCorners, 500);
    if (!v.valid) {
      setTimeout(() => {
        alert(v.reason);
        state.openCorners = [];
        drawOpenCanvas();
      }, 100);
      return;
    }
    setTimeout(() => computeResults(), 400);
  }
}

// --- Drag existing markers ---
function addDragHandlers(canvas, corners) {
  let dragging = -1;
  const hitTest = (x, y) => {
    const r = Math.max(15, canvas.width / 25);
    for (let i = 0; i < corners.length; i++) {
      if (Math.hypot(x - corners[i][0], y - corners[i][1]) < r) return i;
    }
    return -1;
  };

  const onDown = (e) => {
    const { x, y } = getCanvasCoords(canvas, e);
    dragging = hitTest(x, y);
    if (dragging >= 0) e.preventDefault();
  };

  const onMove = (e) => {
    if (dragging < 0) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(canvas, e);
    corners[dragging] = [x, y];
    if (canvas === refCanvas) drawRefCanvas();
    else drawOpenCanvas();
  };

  const onUp = () => { dragging = -1; };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onUp);
}

// --- Compute results ---
function computeResults() {
  try {
    const result = measureOpening(state.refCorners, state.openCorners);
    if (result.width < 50 || result.height < 50) {
      alert('The measured dimensions seem too small. Please check that the A4 paper and opening are both correctly marked.');
      return;
    }
    if (result.width > 5000 || result.height > 5000) {
      alert('The measured dimensions seem too large. Please check that the A4 paper and opening are both correctly marked.');
      return;
    }

    // Format: mm -> cm
    const w = result.width, h = result.height;
    $('resWidth').textContent = `${Math.round(w)} mm`;
    $('resHeight').textContent = `${Math.round(h)} mm`;
    $('resWidthCm').textContent = `${(w / 10).toFixed(1)} cm`;
    $('resHeightCm').textContent = `${(h / 10).toFixed(1)} cm`;
    $('resDiagonal').textContent = `${Math.round(result.diagonal)} mm`;
    $('resArea').textContent = `${(result.area / 1e6).toFixed(2)} m²`;
    $('resAspect').textContent = `1 : ${result.aspect.toFixed(2)}`;

    drawResultCanvas();
    showStep('results');
  } catch (err) {
    console.error(err);
    alert('Could not compute the measurement. Please try again with clearer corners.');
  }
}

// --- Wire up ---
function initMeasurement() {
  // Upload
  $('fileInput').addEventListener('change', onFileChange);

  // Reference step
  refCanvas.addEventListener('click', handleRefClick);
  addDragHandlers(refCanvas, state.refCorners);
  $('btnRefBack').addEventListener('click', () => {
    state.photo = null;
    state.refCorners = [];
    state.openCorners = [];
    showStep('upload');
  });
  $('btnRefClear').addEventListener('click', () => {
    state.refCorners = [];
    drawRefCanvas();
  });

  // Opening step
  openCanvas.addEventListener('click', handleOpenClick);
  addDragHandlers(openCanvas, state.openCorners);
  $('btnOpenBack').addEventListener('click', () => {
    state.openCorners = [];
    drawRefCanvas();
    showStep('reference');
  });
  $('btnOpenClear').addEventListener('click', () => {
    state.openCorners = [];
    drawOpenCanvas();
  });

  // Results
  $('btnStartOver').addEventListener('click', () => {
    state.photo = null;
    state.refCorners = [];
    state.openCorners = [];
    $('fileInput').value = '';
    showStep('upload');
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

document.addEventListener('DOMContentLoaded', initMeasurement);

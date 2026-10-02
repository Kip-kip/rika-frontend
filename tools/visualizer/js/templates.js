// ============================================================
// Rika Visualizer — window design templates
// Each template is a pure function: (frameColor, glassColor, glassAlpha) -> SVG string
// SVG is in T_W x T_H coordinate space. Frame colour is a parameter,
// so no separate images are needed per finish.
// ============================================================
import { T_W, T_H, FRAME_W } from './state.js';

function tplFixed(f, g, ga) {
  return `
  <rect x="0" y="0" width="${T_W}" height="${T_H}" fill="${f}"/>
  <rect x="${FRAME_W}" y="${FRAME_W}" width="${T_W-2*FRAME_W}" height="${T_H-2*FRAME_W}" fill="none" stroke="${f}" stroke-width="${FRAME_W*0.6}"/>
  <rect x="${FRAME_W}" y="${FRAME_W}" width="${T_W-2*FRAME_W}" height="${T_H-2*FRAME_W}" fill="${g}" opacity="${ga}"/>`;
}

function slidingPanels(n, f, g, ga) {
  const innerW = T_W - 2 * FRAME_W;
  const innerH = T_H - 2 * FRAME_W;
  const mull = FRAME_W * 0.5;
  let panes = '';
  for (let i = 0; i < n; i++) {
    const x = FRAME_W + i * (innerW / n);
    const w = innerW / n;
    panes += `<rect x="${x}" y="${FRAME_W}" width="${w - mull}" height="${innerH}" fill="${g}" opacity="${ga}"/>`;
    if (i < n - 1) {
      panes += `<rect x="${x + w - mull}" y="${FRAME_W}" width="${mull*1.5}" height="${innerH}" fill="${f}"/>`;
    }
  }
  const hx = FRAME_W + innerW * 0.62;
  const hy = T_H / 2;
  const handle = `<rect x="${hx-1.2}" y="${hy-5}" width="2.4" height="10" rx="1" fill="${f==='#e8eaed'?'#888':'#fff'}" opacity="0.7"/>`;
  return `
  <rect x="0" y="0" width="${T_W}" height="${T_H}" fill="${f}"/>
  ${panes}
  ${handle}`;
}

function tplCasement(f, g, ga) {
  const innerW = T_W - 2 * FRAME_W;
  const innerH = T_H - 2 * FRAME_W;
  const mull = FRAME_W * 0.5;
  const cx = T_W / 2;
  const handle = `<rect x="${cx - 2}" y="${T_H/2 - 6}" width="4" height="12" rx="1.5" fill="${f==='#e8eaed'?'#888':'#fff'}" opacity="0.7"/>`;
  return `
  <rect x="0" y="0" width="${T_W}" height="${T_H}" fill="${f}"/>
  <rect x="${FRAME_W}" y="${FRAME_W}" width="${innerW/2 - mull}" height="${innerH}" fill="${g}" opacity="${ga}"/>
  <rect x="${FRAME_W + innerW/2}" y="${FRAME_W}" width="${innerW/2 - mull}" height="${innerH}" fill="${g}" opacity="${ga}"/>
  <rect x="${cx - mull/2}" y="${FRAME_W}" width="${mull}" height="${innerH}" fill="${f}"/>
  ${handle}`;
}

export const DESIGNS = {
  fixed:    { label: 'Fixed',     gen: tplFixed },
  sliding2: { label: '2-Panel',   gen: (f) => slidingPanels(2, f) },
  sliding3: { label: '3-Panel',   gen: (f) => slidingPanels(3, f) },
  sliding4: { label: '4-Panel',   gen: (f) => slidingPanels(4, f) },
  casement: { label: 'Casement',  gen: tplCasement },
};

// Render a design to an offscreen canvas (scaled up for quality).
// Returns a Promise<canvas|null>.
export function renderTemplate(designId, finishColor, glassColor, glassAlpha) {
  const scale = 8;
  const canvas = document.createElement('canvas');
  canvas.width = T_W * scale;
  canvas.height = T_H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const design = DESIGNS[designId];
  const svg = design.gen(finishColor, glassColor, glassAlpha);

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.clearRect(0, 0, T_W, T_H);
      ctx.drawImage(img, 0, 0, T_W, T_H);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

// Build an SVG data URL for a design thumbnail (used in the selector cards).
export function templateThumbSvg(designId, frameColor) {
  const design = DESIGNS[designId];
  return design.gen(frameColor, 'rgba(180,205,225,0.3)', 1.0);
}

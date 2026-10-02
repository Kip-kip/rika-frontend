// ============================================================
// Rika Visualizer — shared state
// All modules import from here so state is a single source of truth.
// ============================================================

export const state = {
  step: 'upload', // upload | edit | preview | beforeafter
  photo: null, // { img, naturalW, naturalH, workCanvas, workW, workH }
  opening: null, // { tl, tr, br, bl } normalized [0,1] to work image
  design: 'sliding3',
  finish: 'black',
  glass: 'clear',
  cornersPlaced: 0,
};

export const CORNER_ORDER = ['tl', 'tr', 'br', 'bl'];
export const CORNER_NUM = { tl: 1, tr: 2, br: 3, bl: 4 };

export const cornerMarkers = []; // { key, x, y } normalized [0,1]

// Frame finishes
export const FINISHES = {
  black:  { label: 'Matte Black', color: '#1a1a1a' },
  silver: { label: 'Silver',      color: '#b8bcc2' },
  bronze: { label: 'Bronze',      color: '#6b5544' },
  white:  { label: 'White',       color: '#e8eaed' },
};

// Glass types
export const GLASSES = {
  clear:   { label: 'Clear',      alpha: 1.0,  tint: 'rgba(180,205,225,0.12)' },
  light:   { label: 'Light Tint', alpha: 0.55, tint: 'rgba(40,60,80,0.30)' },
  dark:    { label: 'Dark Tint',  alpha: 0.35, tint: 'rgba(15,25,40,0.50)' },
  frosted: { label: 'Frosted',    alpha: 0.70, tint: 'rgba(220,225,230,0.45)' },
};

// Template coordinate space
export const FRAME_W = 8;
export const T_W = 100;
export const T_H = 75;

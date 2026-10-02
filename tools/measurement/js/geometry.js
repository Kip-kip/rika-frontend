// ============================================================
// Rika Measurement — geometry (pure, DOM-free, testable)
// Uses the same homography approach as the visualizer.
// ============================================================

// A4 reference in mm
export const A4 = { width: 210, height: 297 };

// Solve 8x8 linear system via Gaussian elimination with partial pivoting
function solve8(A, b) {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let r = col + 1; r < n; r++)
      if (Math.abs(M[r][col]) > Math.abs(M[maxRow][col])) maxRow = r;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    const pv = M[col][col];
    if (Math.abs(pv) < 1e-12) continue;
    for (let j = col; j <= n; j++) M[col][j] /= pv;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let j = col; j <= n; j++) M[r][j] -= factor * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}

// Solve H such that H * src ≈ dst for 4 point correspondences.
export function computeHomography(srcPts, dstPts) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = srcPts[i];
    const [dx, dy] = dstPts[i];
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dy);
  }
  const h = solve8(A, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

// Apply homography to a point (src -> dst)
export function applyH(H, x, y) {
  const [h11, h12, h13, h21, h22, h23, h31, h32] = H;
  const w = h31 * x + h32 * y + 1;
  return [(h11 * x + h12 * y + h13) / w, (h21 * x + h22 * y + h23) / w];
}

// Invert a 3x3 homography
export function invertH(H) {
  const [a, b, c, d, e, f, g, h] = H;
  // H = [[a,b,c],[d,e,f],[g,h,1]]
  const det = a * (e - f * h) - b * (d - f * g) + c * (d * h - e * g);
  if (Math.abs(det) < 1e-12) throw new Error('Singular matrix');
  const inv = [
    (e - f * h) / det,
    (c * h - b) / det,
    (b * f - c * e) / det,
    (f * g - d) / det,
    (a - c * g) / det,
    (c * d - a * f) / det,
    (d * h - e * g) / det,
    (b * g - a * h) / det,
    (a * e - b * d) / det,
  ];
  return inv;
}

/**
 * Compute the real-world dimensions of a quad (the opening)
 * given a reference quad (the A4 paper) in the same image.
 *
 * @param {number[][]} refCorners  - 4 corners of A4 in image pixels: [tl, tr, br, bl]
 * @param {number[][]} openCorners - 4 corners of opening in image pixels: [tl, tr, br, bl]
 * @returns {{ width: number, height: number, diagonal: number, area: number, aspect: number }}
 *          dimensions in mm
 */
export function measureOpening(refCorners, openCorners) {
  // The reference quad is an A4 sheet: 210mm wide, 297mm tall (portrait).
  // We build a homography from the A4's known rectangle (in mm) to the
  // photographed reference quad (in image pixels). Then we invert that
  // homography and apply it to the opening corners to get opening dims in mm.

  // A4 rectangle in mm (portrait: width=210, height=297)
  const a4mm = [
    [0, 0],        // tl
    [A4.width, 0], // tr
    [A4.width, A4.height], // br
    [0, A4.height], // bl
  ];

  // Reference quad in image pixels
  const refPx = refCorners.map((p) => [p[0], p[1]]);

  // H_ref: maps A4-mm coords -> image-pixel coords
  const H_ref = computeHomography(a4mm, refPx);

  // Invert: maps image-pixel coords -> A4-mm coords
  const H_inv = invertH(H_ref);

  // Apply H_inv to the opening corners to get their positions in mm
  const openMm = openCorners.map(([x, y]) => {
    const [a, b2, c2, d, e, f, g, h] = H_inv;
    const w = g * x + h * y + 1;
    return [(a * x + b2 * y + c2) / w, (d * x + e * y + f) / w];
  });

  // Now compute the dimensions from the 4 mm points
  // Width = average of top and bottom edge lengths
  // Height = average of left and right edge lengths
  const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

  const topW = dist(openMm[0], openMm[1]);
  const botW = dist(openMm[3], openMm[2]);
  const leftH = dist(openMm[0], openMm[3]);
  const rightH = dist(openMm[1], openMm[2]);

  const width = (topW + botW) / 2;
  const height = (leftH + rightH) / 2;
  const diagonal = Math.hypot(width, height);
  const area = width * height;
  const aspect = width > 0 ? height / width : 0;

  return { width, height, diagonal, area, aspect };
}

// Validate that 4 points form a sensible convex quadrilateral.
export function validateQuad(pts, minArea = 0.0001) {
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      if (Math.hypot(dx, dy) < 5)
        return { valid: false, reason: 'Two corners are too close together.' };
    }
  }

  let area = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 4];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area) / 2;
  if (area < minArea)
    return { valid: false, reason: 'The selection is too small. Please mark a larger area.' };

  const crosses = (p1, p2, p3, p4) => {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p1, p2, p3);
    const d2 = d(p1, p2, p4);
    const d3 = d(p3, p4, p1);
    const d4 = d(p3, p4, p2);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };
  if (crosses(pts[0], pts[1], pts[2], pts[3]) || crosses(pts[1], pts[2], pts[3], pts[0])) {
    return { valid: false, reason: 'The corners cross each other. Please adjust them.' };
  }

  return { valid: true, reason: null };
}

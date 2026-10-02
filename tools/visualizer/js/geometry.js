// ============================================================
// Rika Visualizer — geometry (pure, DOM-free, testable)
// Projective homography: template rectangle -> photographed quad
// ============================================================

// Solve H such that H * src ≈ dst for 4 point correspondences.
// src: [[x,y] x4] in template space
// dst: [[x,y] x4] in destination (work-image) space
// Returns 3x3 matrix [h11,h12,h13, h21,h22,h23, h31,h32, h33=1]
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

// Solve 8x8 linear system via Gaussian elimination with partial pivoting
export function solve8(A, b) {
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

// Apply homography to a point (src -> dst)
export function applyH(H, x, y) {
  const [h11, h12, h13, h21, h22, h23, h31, h32] = H;
  const w = h31 * x + h32 * y + 1;
  return [(h11 * x + h12 * y + h13) / w, (h21 * x + h22 * y + h23) / w];
}

// Validate that 4 points form a sensible convex quadrilateral.
// Returns { valid, reason } — reason is a user-friendly message when invalid.
export function validateQuad(tl, tr, br, bl, minArea = 0.0005) {
  const pts = [tl, tr, br, bl].map((p) => [p.x, p.y]);

  // Duplicated points
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const dx = pts[i][0] - pts[j][0];
      const dy = pts[i][1] - pts[j][1];
      if (Math.hypot(dx, dy) < 0.01)
        return { valid: false, reason: 'Two corners are too close together.' };
    }
  }

  // Shoelace area (normalized space)
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 4];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area) / 2;
  if (area < minArea)
    return { valid: false, reason: 'The selection is too small. Please mark a larger opening.' };

  // Crossing edges: check if the polygon is simple (no self-intersection)
  const crosses = (p1, p2, p3, p4) => {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p1, p2, p3);
    const d2 = d(p1, p2, p4);
    const d3 = d(p3, p4, p1);
    const d4 = d(p3, p4, p2);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };
  if (crosses(pts[0], pts[1], pts[2], pts[3]) || crosses(pts[1], pts[2], pts[3], pts[0])) {
    return { valid: false, reason: 'The corners cross each other. Please adjust them to follow the opening.' };
  }

  return { valid: true, reason: null };
}

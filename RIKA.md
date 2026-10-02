# RIKA.md — Project Brain

> **Read this first.** This file is the single source of truth for the Rika project.
> It captures every architectural decision, every module's internals, every known limitation,
> and the "work how" of each tool. If you are working on Rika and lack context, read this file
> before touching any code. After any significant change, update this file.
>
> **Companion file:** `RIKA_ROADMAP.md` (in this same folder) is the combined technical report,
> marking scheme, and progress tracker that consolidates the three strategy documents
> (Business / Platform / Phase 1). Read the brain for *current code internals*; read the roadmap
> for *what to build next, in what order, and how to know it's done*.

---

## 1. What Rika Is

Rika is a **multi-tool web platform** for an aluminium & glass installation business.
Customers use it to:

1. **Visualize** a window design in their own photo (before buying)
2. **Measure** their window opening from a photo (using A4 paper as a scale reference)
3. **Request a quotation** for their project

All three tools are **100% client-side**. No photos are uploaded to a server. No AI APIs,
no paid computer-vision services, no image generation. All geometry is hand-rolled (homography).
All rendering is Canvas 2D + SVG.

**Live URLs:**
- Homepage: `http://51.44.11.18:8000/rika/`
- Visualizer: `http://51.44.11.18:8000/rika/tools/visualizer/`
- Measurement: `http://51.44.11.18:8000/rika/tools/measurement/`
- Quotation: `http://51.44.11.18:8000/rika/tools/quotation/`

**Project root:** `/home/ubuntu/Rika/frontend/` (this is also the repo root and the served root).

**Served by:** `threaded-server.py` on port 3101 (serves the repo root).
**Proxied by:** Nginx on port 8000, route `/rika/` → `http://127.0.0.1:3101/` (repo root).
**Nginx config:** `/etc/nginx/sites-enabled/frappe-dev`.

---

## 2. Architecture

### 2.1 Technology Stack

- **No framework.** Vanilla HTML, CSS, JavaScript (ES modules).
- **No build step.** No `package.json`, no bundler, no transpiler.
- **No external dependencies.** No npm packages, no CDN scripts, no fonts.
- **Canvas 2D** for all image rendering and perspective warping.
- **SVG** for window design templates (generated as strings, rasterized via `Blob` + `Image`).
- **Hand-rolled homography** (8×8 linear system, Gaussian elimination) for perspective transforms.
- **ES modules** (`type="module"`) for code organization and import/export.

### 2.2 Why These Choices

| Decision | Rationale |
|----------|-----------|
| No framework | Single static server, zero build complexity, trivial to deploy by editing files |
| No build step | Same reason — `threaded-server.py` serves raw files |
| Hand-rolled homography | 40 lines of linear algebra vs loading OpenCV.js (~1MB) — lighter, no lazy-load |
| SVG templates | Frame color is a *parameter*, not a separate image. Adding a design = one generator function |
| Canvas 2D warp (mesh) | No WebGL context needed. 4px cells are smooth enough for 1400px working images |
| ES modules | Pure logic (`geometry.js`, `templates.js`, `image.js`) is DOM-free and unit-testable |

### 2.3 Directory Structure

```
Rika/frontend/                  # ★ The Rika project (repo root = the served root)
├── threaded-server.py          # Static file server on :3101
├── index.html                  # Homepage (hero, tools grid, about, stats)
├── shared/
│   ├── css/
│   │   ├── rika.css      # Design system: CSS variables, app shell, buttons, cards
│   │   └── booking.css
│   └── js/
│       ├── rika-config.js# SINGLE SOURCE OF TRUTH: price rates, 3 tiers, WhatsApp number,
│       │                 # disclaimer wording, design specs. All tools read from here.
│       └── booking.js
└── tools/
    ├── calculator/
    │   ├── index.html      # Price calculator (type, dims, qty, profile, glass → KSh range)
    │   ├── css/
    │   │   └── calculator.css
    │   └── js/
    │       └── app.js      # Calculator UI + pricing engine (rates from rika-config.js)
    ├── visualizer/
    │   ├── index.html      # Tool page (upload → corner select → preview → before/after)
    │   ├── css/
    │   │   └── visualizer.css
    │   └── js/
    │       ├── state.js    # State model + constants (single source of truth)
    │       ├── geometry.js # Homography, solve8, applyH, validateQuad (pure, testable)
    │       ├── templates.js# SVG window generators, renderTemplate, templateThumbSvg
    │       ├── image.js    # EXIF orientation, downscale, file validation
    │       └── app.js      # UI wiring, step navigation, corner editor, preview, BA, quote
    ├── measurement/
    │   ├── index.html      # Tool page (upload → mark A4 → mark opening → results)
    │   ├── css/
    │   │   └── measurement.css
    │   └── js/
    │       ├── geometry.js # Homography + invertH + measureOpening (pure, testable)
    │       ├── image.js    # EXIF orientation, downscale (slightly different API from visualizer)
    │       └── app.js      # 4-step UI flow, corner selection, drag, results
    └── quotation/
        ├── index.html      # Tool page (form → validation → submission → success)
        ├── css/
        │   └── quotation.css
        └── js/
            └── app.js      # Form validation, submission, localStorage fallback
```

### 2.4 Adding a New Tool

1. Create `tools/<name>/` with `index.html`, `css/<name>.css`, `js/app.js`
2. Import `/rika/shared/css/rika.css` in the `<head>`
3. Use the same header/footer markup (copy from an existing tool)
4. Add a card in the homepage's `tools-grid` section
5. No changes to the server or nginx needed — the `/rika/` route already covers everything

> **Pricing single-source:** any tool that shows a KSh number must pull rates from
> `shared/js/rika-config.js` (the one place prices/tiers/WhatsApp/disclaimer live).
> Never hard-code a price in a tool file.

---

## 3. Design System (rika.css)

### 3.1 CSS Custom Properties

```css
:root {
  --rk-accent:       #3b82f6;    /* Primary blue */
  --rk-accent2:      #2563eb;    /* Hover blue */
  --rk-accent-soft:  rgba(59,130,246,0.12);
  --rk-success:      #22c55e;
  --rk-danger:       #ef4444;

  --rk-bg:           #0f1117;    /* Page background (dark) */
  --rk-surface:      #171a23;    /* Card/header background */
  --rk-surface2:     #1e222e;    /* Input/secondary surface */
  --rk-border:       #2a2f3d;

  --rk-text:         #e8eaef;
  --rk-muted:        #9aa3b5;

  --rk-header-h:     60px;
  --rk-footer-h:     48px;
  --rk-radius:       12px;
  --rk-radius-sm:    8px;

  --rk-font:         -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --rk-shadow:       0 4px 16px rgba(0,0,0,0.3);
}
```

### 3.2 Components

| Class | Purpose |
|-------|---------|
| `.rk-app` | Flex column, min-height 100vh (wraps header + main + footer) |
| `.rk-header` | Sticky top bar, 60px, logo + nav + burger |
| `.rk-logo` | "Alu**fit**" with accent-colored span |
| `.rk-nav` | Horizontal links; collapses to dropdown on mobile (≤640px) |
| `.rk-nav a.active` | Highlighted current page (accent bg + text) |
| `.rk-main` | Flex:1 content area |
| `.rk-footer` | 48px bottom bar |
| `.rk-btn` | Base button (rounded, 12px 24px padding, 15px font) |
| `.rk-btn-primary` | Blue filled button |
| `.rk-btn-ghost` | Dark bordered button |
| `.rk-btn-success` | Green button (used for CTA "Get a Quote") |
| `.rk-btn-sm` | Smaller variant (8px 14px padding, 13px font) |
| `.rk-card` | Card container (20px padding, border, radius) |
| `.rk-container` | Max-width 1100px, centered, 20px horizontal padding |
| `.hidden` / `.rk-hidden` | `display: none !important` — used to toggle sections |
| `.rk-menu-btn` | Mobile burger (☰), hidden on desktop |

### 3.3 Mobile Behavior

- `max-width: 640px`: nav collapses, burger appears
- `.rk-nav.open`: dropdown visible
- All tools are mobile-first (390px viewport tested)
- `touch-action: none` on canvases to prevent scroll interference

---

## 4. Tool: Window Visualizer

**URL:** `/rika/tools/visualizer/`
**Purpose:** Customer uploads a photo of their window opening, marks the 4 corners,
and previews different aluminium window designs fitted in place with perspective correction.

### 4.1 User Flow

```
upload → edit (corner selection) → preview (design/finish/glass) → beforeafter (slider)
                                   ↕ (adjust opening)
                                   → quote modal (CTA)
```

### 4.2 State Model (state.js)

```js
state = {
  step: 'upload',        // 'upload' | 'edit' | 'preview' | 'beforeafter'
  photo: null,           // { img, naturalW, naturalH, workCanvas, workW, workH }
  opening: null,         // { tl, tr, br, bl } — normalized [0,1] coords in work image
  design: 'sliding3',    // key into DESIGNS
  finish: 'black',       // key into FINISHES
  glass: 'clear',        // key into GLASSES
  cornersPlaced: 0,      // 0–4, drives UI enable/disable
}

cornerMarkers = []       // [{ key: 'tl'|'tr'|'br'|'bl', x: 0–1, y: 0–1 }] — mutable, shared
```

**Constants:**
```js
CORNER_ORDER = ['tl', 'tr', 'br', 'bl']   // tap order
CORNER_NUM   = { tl: 1, tr: 2, br: 3, bl: 4 }  // marker labels
FRAME_W = 8    // frame width in template units
T_W = 100      // template width
T_H = 75       // template height
```

**Finishes:**
| Key | Label | Color |
|-----|-------|-------|
| `black` | Matte Black | `#1a1a1a` |
| `silver` | Silver | `#b8bcc2` |
| `bronze` | Bronze | `#6b5544` |
| `white` | White | `#e8eaed` |

**Glass types:**
| Key | Label | Alpha | Tint |
|-----|-------|-------|------|
| `clear` | Clear | 1.0 | `rgba(180,205,225,0.12)` |
| `light` | Light Tint | 0.55 | `rgba(40,60,80,0.30)` |
| `dark` | Dark Tint | 0.35 | `rgba(15,25,40,0.50)` |
| `frosted` | Frosted | 0.70 | `rgba(220,225,230,0.45)` |

### 4.3 Geometry (geometry.js)

**`computeHomography(srcPts, dstPts)`**
- Solves for a 3×3 projective transformation matrix H
- 4 point correspondences → 8×8 linear system
- `srcPts` / `dstPts`: arrays of `[x, y]` pairs
- Returns `[h11, h12, h13, h21, h22, h23, h31, h32, 1]`

**`solve8(A, b)`**
- Gaussian elimination with partial pivoting
- 8×8 augmented matrix → solution vector

**`applyH(H, x, y)`**
- Applies homography to a single point
- Returns `[dx, dy]`

**`validateQuad(tl, tr, br, bl, minArea)`**
- Checks: no duplicate corners, area > minArea, no self-intersecting edges
- Returns `{ valid: boolean, reason: string|null }`

### 4.4 Templates (templates.js)

Each design is a pure function: `(frameColor, glassColor, glassAlpha) → SVG string`.
SVG is in `T_W × T_H` coordinate space (100×75).

**DESIGNS:**
| Key | Label | Generator |
|-----|-------|-----------|
| `fixed` | Fixed | `tplFixed` — single pane, no mullions |
| `sliding2` | 2-Panel | `slidingPanels(2, f)` — 2 panes + handle |
| `sliding3` | 3-Panel | `slidingPanels(3, f)` — 3 panes + handle (default) |
| `sliding4` | 4-Panel | `slidingPanels(4, f)` — 4 panes + handle |
| `casement` | Casement | `tplCasement` — 2 panes split vertically + center handle |

**`renderTemplate(designId, finishColor, glassColor, glassAlpha)`**
- Renders SVG to an offscreen canvas at 8× scale (800×600) for quality
- Returns `Promise<canvas|null>`

**`templateThumbSvg(designId, frameColor)`**
- Returns SVG string for selector card thumbnails (44×34)

### 4.5 Image Pipeline (image.js)

**`loadImageWithOrientation(file)`**
- Loads image, reads EXIF orientation (0x0112 tag)
- Applies rotation/flip via canvas transforms for orientations 2–8
- Returns `Promise<[source, width, height]>` or `[null, 0, 0]` on error

**`getExifOrientation(file)`**
- Reads first 256 bytes, parses JPEG EXIF APP1 marker
- Returns orientation value 1–8 (1 = normal)

**`downscale(source, maxEdge)`**
- Scales image so longest side ≤ maxEdge (default 1400px)
- Returns a canvas (high-quality smoothing)

**`validateImageFile(file)`**
- Checks: type is JPEG/PNG/WebP, size ≤ 20MB
- Returns error string or null

### 4.6 Rendering Pipeline (app.js)

**Step: upload**
- File input → `validateImageFile` → `loadImageWithOrientation` → `downscale(1400)`
- Sets `state.photo`, resets corners, shows edit screen

**Step: edit (corner selection)**
- Canvas shows work image at full size
- 4 corners are placed in order: tl → tr → br → bl
- Each corner is a draggable numbered marker (blue circle + white number)
- When all 4 placed: `validateQuad` → enables "Show Preview" button
- Marker hit-testing: nearest marker within 4% of min(canvasW, canvasH)

**Step: preview**
- Canvas shows work image + warped window template
- **Warp algorithm** (`warpToQuad`):
  1. Compute homography H: template rect (inset by FRAME_W) → opening quad
  2. Divide template into 4×4 pixel cells
  3. For each cell: map 4 corners through H, clip to destination quad, drawImage
  4. Result: perspective-correct overlay that follows the photo's angle
- Design/finish/glass selectors trigger `renderPreview()` on change
- "Adjust Opening" returns to edit step (preserves corner positions)

**Step: beforeafter**
- Offscreen canvas renders the full visualization
- Draggable vertical divider (baPos: 0–1)
- Left of divider: original photo; right: visualization
- "Show Original" / "Show Visualization" buttons jump divider to ends

**Quote modal**
- Bottom-sheet modal (`.modal-backdrop`, fixed, z-index 100)
- Shows design/finish/glass summary + form (name, phone, location, qty, comments)
- On submit: toast notification (no backend persistence yet)

### 4.7 Known Limitations & Gotchas

1. **EXIF parsing** reads only first 256 bytes — works for standard JPEGs but may miss EXIF in extended segments. The measurement tool's `image.js` has a more robust parser (65KB, handles TIFF offsets).
2. **Warp uses 4px cells** — smooth at 1400px but slightly blocky if zoomed in very close. Could increase to 8px cells or use WebGL for production.
3. **Template is always portrait** (T_W=100, T_H=75). If a customer marks a landscape opening, the window will be stretched. Not an issue for typical window photos.
4. **No touch drag on markers after placement** — the `pointermove` handler in `setupEditCanvas` does support dragging, but it's tied to the edit step only.
5. **Quote form doesn't persist** — toast only, no backend. The quotation *tool* does persist to localStorage.

---

## 5. Tool: Measurement

**URL:** `/rika/tools/measurement/`
**Purpose:** Estimate real-world window dimensions from a photo using an A4 sheet (210×297mm)
as a scale reference.

### 5.1 User Flow

```
upload → reference (mark A4 corners) → opening (mark window corners) → results (dimensions)
```

### 5.2 State (local to app.js)

```js
state = {
  photo: null,        // { image, width, height, dataUrl }
  refCorners: [],     // 4 pts in image-pixel coords [x, y] (A4 paper)
  openCorners: [],    // 4 pts in image-pixel coords [x, y] (window opening)
  step: 'upload',     // 'upload' | 'reference' | 'opening' | 'results'
}
```

**Key difference from visualizer:** corners are stored in **image-pixel coordinates**,
not normalized [0,1]. The canvas is set to the image's natural (downscaled) dimensions.

### 5.3 Geometry (geometry.js)

Same `computeHomography`, `solve8`, `applyH` as the visualizer, plus:

**`invertH(H)`**
- Inverts a 3×3 homography matrix
- Used to map from image-pixel space back to mm space

**`measureOpening(refCorners, openCorners)`**
- The core algorithm:
  1. Define A4 rectangle in mm: `[[0,0], [210,0], [210,297], [0,297]]`
  2. Compute homography H_ref: A4-mm → ref-pixel (4 point correspondences)
  3. Invert H_ref → H_inv: ref-pixel → A4-mm
  4. Apply H_inv to the opening corners → opening positions in mm
  5. Compute width/height as average of opposite edge lengths
  6. Return `{ width, height, diagonal, area, aspect }` in mm

**`validateQuad(pts, minArea)`**
- Same logic as visualizer but works on pixel coords (minArea=500 px²)

### 5.4 Image Pipeline (measurement/js/image.js)

**Different API from the visualizer's image.js:**
- `loadImageWithOrientation(file)` returns `Promise<{ image, width, height, dataUrl }>`
  (an object, not a tuple)
- `downscale(dataUrl, maxEdge)` returns `Promise<{ image, width, height, dataUrl }>`
  (takes a data URL string, not an image element)
- More robust EXIF parser: reads 65KB, handles both little/big endian TIFF

### 5.5 Rendering

- Three canvases: `refCanvas`, `openCanvas`, `resultCanvas` (all same size as work image)
- Reference quad drawn in **blue** (`#3b82f6`), opening quad in **green** (`#22c55e`)
- Markers are numbered circles (1–4) with white text
- On the opening step, the reference quad is drawn faintly (30% opacity) for context
- On the results step, both quads are drawn with full opacity

### 5.6 Accuracy & Limitations

1. **Assumes A4 is flat** — if the paper is curved, folded, or partially obscured, the
   homography is wrong and the measurement is unreliable.
2. **Assumes A4 is portrait** — 210mm width × 297mm height. If the user places the A4
   in landscape, the width and height will be swapped.
3. **Perspective correction is only as good as the corner placement** — a few pixels of
   error in corner marking can lead to several mm of error in the result.
4. **No camera intrinsics** — this is a pure perspective-geometry approach. It doesn't
   model the camera's focal length or sensor size. For a rough estimate (±5–10%), it works.
5. **Sanity checks:** width/height must be 50–5000mm. Outside that range, the user is
   alerted and asked to re-mark.

### 5.7 Known Bug (Fixed)

**Bug:** `drawQuad` and `drawMarkers` referenced `canvas.width` (undefined variable) instead of
`ctx.canvas.width`. Fixed by changing to `ctx.canvas.width`.

---

## 6. Tool: Quotation

**URL:** `/rika/tools/quotation/`
**Purpose:** Customer submits a quote request with project details.

### 6.1 User Flow

```
form → validation → submission → success screen (with reference code)
```

### 6.2 Form Fields

| Field | ID | Required | Validation |
|-------|-----|----------|------------|
| Full Name | `fName` | ✓ | ≥ 2 chars |
| Phone | `fPhone` | ✓ | ≥ 9 digits |
| Email | `fEmail` | ✗ | valid email format |
| Location | `fLocation` | ✓ | ≥ 2 chars |
| Window Type | `fType` | ✓ | selected from dropdown |
| Quantity | `fQty` | ✓ | 1–999 |
| Width (cm) | `fWidth` | ✗ | 10–300 |
| Height (cm) | `fHeight` | ✗ | 10–300 |
| Frame Finish | `fFinish` | ✗ | dropdown |
| Glass Type | `fGlass` | ✗ | dropdown |
| Notes | `fNotes` | ✗ | free text |
| Consent | `fConsent` | ✓ | checkbox |

### 6.3 Validation

- Live validation on blur (re-validates on input if field is already invalid)
- Error messages shown inline under each field (`.field-error`)
- Invalid fields get `.invalid` class (red border)
- On submit: validates all fields, focuses first invalid field

### 6.4 Submission

1. Generate reference code: `ALU-{timestamp-base36}-{random4}` (e.g. `ALU-MUPOC4CO-LUJI`)
2. Try `POST /rika/api/quote` (JSON body)
3. If backend unavailable → save to `localStorage` under key `rika_quotes` (array of objects)
4. Show success screen with name + reference code
5. "Submit Another" resets form

### 6.5 Data Shape

```json
{
  "name": "Cyrus Kiprotich",
  "phone": "+254 712 345 678",
  "email": "cyrus@example.com",
  "location": "Westlands, Nairobi",
  "type": "3-panel",
  "quantity": 2,
  "width": 180,
  "height": 120,
  "finish": "matte-black",
  "glass": "light-tint",
  "notes": "Ground floor, easy access",
  "ref": "ALU-MUPOC4CO-LUJI",
  "submittedAt": "2026-10-01T15:00:00.000Z"
}
```

### 6.6 Known Limitations

1. **No backend yet** — `/rika/api/quote` returns 501. Data falls back to localStorage.
   A real backend (Frappe doc type or simple JSON endpoint) is needed for production.
2. **No duplicate detection** — a customer can submit multiple times.
3. **No CAPTCHA / rate limiting** — open to spam.
4. **Reference code is client-generated** — not verifiable server-side.

---

## 7. Homepage

**URL:** `/rika/`

### 7.1 Sections

1. **Hero** — headline, subtext, two CTAs (Visualizer + Explore Tools)
2. **Tools Grid** — 3 cards (Visualizer, Measurement, Quotation), all active
3. **About** — company blurb + stats (500+ windows, 10yr warranty, 4.9★)

### 7.2 Tool Cards

Each card is an `<a>` with `.tool-card` class:
- Icon (emoji in a rounded box)
- Title
- Description
- (Previously "coming soon" badges — all removed, all tools now active)

---

## 8. Server & Deployment

### 8.1 Static Server

- **File:** `threaded-server.py` (Python, runs on `127.0.0.1:3101`)
- **Serves:** `/home/ubuntu/Rika/frontend/` directory (the repo root)
- **Protocol:** HTTP/1.1, threaded (handles concurrent requests)
- **Start:** `python3 threaded-server.py` (run in background or via systemd)

### 8.2 Nginx

- **Config:** `/etc/nginx/sites-enabled/frappe-dev`
- **Route:** `/rika/` → `http://127.0.0.1:3101/` (the server's root is the repo root, so the `/rika/` prefix maps straight onto it)
- **Port:** 8000 (public)
- **Reload:** `sudo nginx -s reload`

### 8.3 Public URL

`http://51.44.11.18:8000/rika/` (and sub-paths)

> Legacy `/visualizer/` and `/window-demo/` routes were retired 2026-10-02 when `house-demo/` was deleted — the Rika tools fully replace them.

---

## 9. Testing

### 9.1 How to Test

All tools are tested with **Playwright** (headless Chromium):
- 390×844 viewport (iPhone 12 Pro size)
- `deviceScaleFactor: 2` for retina-quality screenshots
- Synthetic test images generated with Pillow (PIL)

### 9.2 Test Scenarios

**Visualizer:**
1. Navigate to `/rika/tools/visualizer/`
2. Upload a synthetic window photo (1200×900, dark opening on light background)
3. Click 4 corners (normalized coords matching the synthetic opening)
4. Verify "Show Preview" button becomes enabled
5. Click "Show Preview" → verify preview renders
6. Check for JS errors (should be zero)

**Measurement:**
1. Navigate to `/rika/tools/measurement/`
2. Upload synthetic photo (window + A4 paper)
3. Click 4 A4 corners → verify auto-advance to opening step
4. Click 4 opening corners → verify results appear
5. Check width/height are in a reasonable range (e.g. 400–800mm)

**Quotation:**
1. Navigate to `/rika/tools/quotation/`
2. Submit empty form → verify validation errors appear
3. Fill all fields → submit → verify success screen with reference code

### 9.3 Known Test Gotchas

- **Modal backdrop bug:** `.hidden` class uses `display: none !important`, but the
  `.modal-backdrop` base class has `display: flex`. The fix is to use
  `.modal-backdrop:not(.hidden) { display: flex; }` so the modal only renders when
  the `hidden` class is removed. Without this, the full-screen backdrop intercepts
  all canvas clicks.
- **Canvas hit-testing:** Use `page.mouse.click()` (real pointer events), not
  `dispatchEvent(new PointerEvent(...))` — the latter doesn't trigger the same
  event pipeline in Playwright.

---

## 10. Change History

| Date | Change |
|------|--------|
| 2026-10-01 | Initial visualizer MVP (single file, `/visualizer/`) |
| 2026-10-01 | Restructure into Rika platform (multi-tool architecture) |
| 2026-10-01 | Visualizer split into 5 JS modules + shared CSS |
| 2026-10-01 | Measurement tool built (A4 reference + homography inversion) |
| 2026-10-01 | Quotation tool built (form + validation + localStorage) |
| 2026-10-01 | All 3 tools verified end-to-end with Playwright |
| 2026-10-01 | RIKA.md project brain created |
| 2026-10-02 | Price calculator + 3-tier pricing built (CALC-1/CALC-2), live at `/rika/tools/calculator/` |
| 2026-10-02 | Measurement disclaimer fixed ("Approximate — confirmed at site visit") |
| 2026-10-02 | Homepage reframed; WhatsApp pre-fill wired (`254718700519`) |
| 2026-10-02 | Migrated from `house-demo/rika/` to `~/Rika/frontend/` (repo root served at `/rika/`); `house-demo/` deleted; legacy routes retired |
| 2026-10-02 | RIKA_ROADMAP.md rewritten as a detailed, resumable coding plan (feature register + per-batch tasks + data model) |

### Pending / Future

- [ ] Wire quotation form to real backend (Frappe doc type or JSON API) — now a tracked task: `LEAD-3` / `T-B0-05` in the roadmap
- [ ] All future feature work is tracked in `RIKA_ROADMAP.md` (§6 Detailed Coding Plan). This brain documents *what exists*; the roadmap tracks *what to build next and its state*.
- [ ] Add more window designs (arched, bay, panoramic, etc.)
- [ ] Mobile testing on real device (Playwright tests pass, but real touch is different)
- [ ] Consider WebGL for smoother warp rendering
- [ ] Camera intrinsic calibration for more accurate measurements
- [ ] i18n (currently English only)
- [ ] Dark/light theme toggle (currently dark only)

---

## 11. Rules & Constraints

1. **No paid APIs.** No OpenAI, Gemini, Claude, or any paid image/CV service.
2. **Client-side only.** Photos never leave the browser.
3. **Mobile-first.** Test at 390px viewport. Touch targets ≥ 44px.
4. **No build step.** Vanilla JS, no bundler, no transpiler.
5. **No framework.** Vanilla HTML/CSS/JS.
6. **No external dependencies.** No npm, no CDN, no fonts.
7. **Hand-rolled geometry.** No OpenCV.js, no math libraries.
8. **Update this file** after any significant change to the project.

---

*This document is the project brain. Read it before touching code. Update it after changing anything.*

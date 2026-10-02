# RIKA_ROADMAP.md — Combined Technical Report, Coding Plan & Progress Tracker

> **Purpose:** the single source of truth for *what to build, in what order, and how to know it's done*.
> Consolidates the three strategy documents (Business / Platform / Phase 1) into one **detailed coding plan**:
> every feature is decomposed into concrete, independently buildable tasks, each with a status,
> an owner (Cyrus / Agent), and its Definition of Done. Read `RIKA.md` for *current code internals*;
> read this file for *the plan and its state*.
>
> **Why it's organized this way:** to let us pick up the project at any time, in any session,
> and be immediately up to speed — no feature forgotten, no half-built thing that can't be resumed.
>
> **Rules of this file (read once):**
> 1. Every piece of planned work has exactly one ID (e.g. `T-B1-03`, `CALC-1`).
> 2. Status is one of: `⬜` not started · `🔧` in progress · `🟨` partial (≤50% credit) · `✅` done (DoD met) · `⏸️` blocked (name the blocker) · `📝` spec needed.
> 3. After ANY change to the code, update the task status here AND the affected `RIKA.md` section.
> 4. A task counts as done only when its Definition of Done (DoD) is verifiable.
> 5. New work always gets an ID and a task line before coding starts. If it doesn't fit, add it.

---

## 0. The Three Documents, in One Sentence Each

| Doc | One-line essence |
|-----|------------------|
| **Business** | Don't buy a workshop first — build demand, outsource fabrication, own the customer relationship, let data be the competitive advantage. |
| **Platform** | Two systems: a **public website** (acquisition, SEO, interactive tools) and a **customer application** (project management, payments, post-sale), sharing one brand and one data core. |
| **Phase 1** | Make it *feel* like an AI assistant using **zero AI** — deterministic rules, pricing math, SVG/Canvas/Three.js, and a carefully staged customer journey. |

**The unifying thesis (all three agree):**
> Attract → Engage → Educate → Design → Visualize → Estimate → Capture → Convert → Refer.

---

## 1. What Is ALREADY BUILT (from RIKA.md)

This is the baseline. Everything below is measured against it.

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| **SHELL-1** | App shell (header/nav/footer) + design system CSS | ✅ | `rika.css`, CSS tokens, mobile burger |
| **HOME-1** | Homepage: hero + tools grid + about + stats | ✅ | Tool-hub framing (re-frame = HOME-2) |
| **VIS-1** | Window Visualizer (photo → 4 corners → perspective overlay) | ✅ | Homography, 5 designs, 4 finishes, 4 glass types, before/after slider |
| **VIS-2** | Quote CTA in visualizer (modal form) | ✅ | Toast-only, no persistence |
| **MEAS-1** | Measurement tool (A4 reference → real-world dims) | ✅ | Homography + `invertH`, 4-step flow |
| **QUOTE-1** | Quotation tool (lead form + validation + localStorage) | ✅ | No pricing logic, no backend yet |
| **CALC-1** | Price calculator (type, dims, qty, profile, glass → KSh range) | ✅ Built 2026-10-02 | Live at `/rika/tools/calculator/`; prices from `shared/js/rika-config.js` (single source) |
| **CALC-2** | Three-tier pricing (Essential / Comfort / Premium) | ✅ Built 2026-10-02 | 3 tiers in the calculator, tap-to-apply per-m² |
| **INFRA-1** | `threaded-server.py` + nginx `/rika/` route | ✅ | Serves `~/Rika/frontend/` on :3101, nginx :8000 |
| **TEST-1** | Playwright end-to-end tests (tools) | ✅ | 390px viewport, synthetic images |
| **WASAPP-1** | WhatsApp integration (pre-populated `wa.me` messages) | 🟨 | wa.me pre-fill on calculator CTAs + homepage float; number `254718700519` in `rika-config.js` — needs wiring to *every* major CTA (see T-B2-04) |

**What is NOT built (the gap):** everything else in this roadmap.

---

## 2. Feature Register (the complete inventory)

Every feature from the three docs, mapped to an ID. This is the *master checklist* — if a doc says it and it's not here, that's a bug in this file; add it.

Priorities: **P0** = do now (unblocks everything) · **P1** = build next · **P2** = build after · **P3** = later/optional.

### 2A. Public Website (Acquisition)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **SEO-1** | Product catalog pages (Windows, Doors, Glass, Shopfronts, Partitions) | Platform §2, §17, Phase1 §17 | P0 | ⬜ |
| **SEO-2** | Local SEO landing pages (Nairobi, Ruiru, Kiambu…) + Google Ads landing pages per search intent | Business §6, Platform §3, Phase1 §20 | P1 | ⬜ |
| **SEO-3** | Price-index page (Kenya aluminium window price index, regularly updated) | Phase1 §15 | P1 | ⬜ |
| **SEO-4** | Project gallery as case studies (Before → Measure → Install → Finished) | Phase1 §16, Business §13 | P1 | ⬜ |
| **SEO-5** | Buying guide (downloadable, lead-gated) | Phase1 §12 | P2 | ⬜ |
| **SEO-6** | Cost guides per search intent ("cost of windows for a 4-bed" etc.) | Phase1 §14, §22 | P2 | ⬜ |
| **SEO-7** | "Aluminium vs UPVC" comparison content | Platform §3, Phase1 §14 | P3 | ⬜ |
| **HOME-2** | Re-frame homepage from tool-hub → product + experience hub | Platform §2, §24 | P0 | 🟨 |
| **HOME-3** | Flagship CTA: "Design Your Windows" / "Build Your Window" / "Calculate Your Project" | Platform §6, §24 | P0 | 🟨 |

### 2B. Interactive Tools (Engagement)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **CALC-1** | Price calculator (type, dims, qty, profile, glass → KSh range) | Business §7, Platform §8, Phase1 §6 | P0 | ✅ |
| **CALC-2** | Three-tier pricing (Essential / Comfort / Premium) | Phase1 §7 | P1 | ✅ |
| **CALC-3** | Construction budget calculator (broad house budget → window slice) | Phase1 §22 | P3 | ⬜ |
| **DESIGN-1** | Window Design Studio (interactive front-facing editor: drag width/height, add/remove panels, move mullions) | Platform §7, Phase1 §1–2 | P0 | 🟨 (visualizer exists but is photo-based; studio is parametric — see conflict C3) |
| **DESIGN-2** | "Build My House Windows" guided flow (house type → per-room recommendations) | Phase1 §3 | P1 | ⬜ |
| **DESIGN-3** | "Your House, Your Windows" (pre-built house scenes, before/after) | Phase1 §4 | P2 | ⬜ |
| **DESIGN-4** | House window map (floor plan, click openings → window schedule) | Phase1 §5 | P2 | ⬜ |
| **RECO-1** | Recommendation engine / "Find Your Window" quiz | Platform §9, Phase1 §8 | P1 | ⬜ |
| **CMP-1** | Compare options (side-by-side, live price delta) | Phase1 §9, Platform §2 | P1 | ⬜ |
| **SECOND-1** | "Get a Second Quote" (upload competitor quote → rules-based analysis) | Phase1 §10–11 | P2 | ⬜ |
| **AUDIT-1** | Free house window audit (plans + photos → budget review) | Phase1 §13 | P3 | ⬜ |
| **MEAS-2** | Free measurement *booking* (date/time/location form) | Platform §15, Phase1 §19 | P0 | ⬜ |
| **MEAS-3** | Installer-facing measurement recorder (W01, W02… + photos + notes) | Business §9 | P2 | ⬜ |
| **MEAS-4** | Fix measurement disclaimer → "Approximate, confirm on site" | Phase1 + earlier spec | P0 | ✅ Fixed 2026-10-02 |
| **WASAPP-1** | WhatsApp integration everywhere (pre-populated messages) | Platform §14, Phase1 §18 | P1 | 🟨 |
| **SAVE-1** | "Save My Design" lead capture (name/WhatsApp/email at the moment of intent) | Platform §10 | P0 | ⬜ |
| **CAT-1** | Interactive product catalogue (change colour/glass/panels/dims on product cards; see price impact) | Phase1 §17 | P1 | ⬜ |

### 2C. Lead & Sales (Conversion)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **LEAD-1** | Lead model + pipeline (anonymous → lead → customer) | Platform §13, Business §11 | P0 | ⬜ |
| **LEAD-2** | CRM / lead management (source tracking, funnel analytics) | Business §11 | P1 | ⬜ |
| **LEAD-3** | Quote persistence (backend, not just localStorage) | Business §7, Platform | P0 | 🟨 (quote form POSTs to `/rika/api/quote`, falls back to localStorage) |
| **QUOTE-2** | Quote engine tied to calculator + design studio | Business §7, Platform §8 | P0 | 🟨 (calculator produces range; exact-quote flow not wired) |
| **DEP-1** | Deposit collection (M-Pesa) | Business §2 | P1 | ⬜ |
| **REF-1** | Referral engine (post-project reward + case study) | Phase1 §23, Business §5 | P2 | ⬜ |
| **GBP-1** | Google Business Profile (local presence + review collection) | Phase1 §24 | P1 | 📝 (marketing task, not code — tracked for completeness) |

### 2D. Customer Application (Post-Sale) — `app.rika.co.ke` (or `/rika/app/` per D2)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **APP-1** | Auth (customer accounts) | Platform §11, §17 | P1 | ⬜ |
| **APP-2** | "My Project" (stage tracker: measure → design → approve → fabricate → install → handover) | Business §8, Platform §11, §13 | P1 | ⬜ |
| **APP-3** | My Designs / My Quotations | Platform §11 | P1 | ⬜ |
| **APP-4** | Payments + install schedule + documents | Platform §11, §21 | P2 | ⬜ |
| **APP-5** | Warranty + messages | Platform §11, §21 | P2 | ⬜ |
| **APP-6** | Naming: call it "My Project", never "Customer Portal" | Platform §12 | P1 | ⬜ (terminology, applied when the app is built) |

### 2E. Internal / Operational (Admin + Fabricator)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **ADM-1** | Admin app (`admin.rika.co.ke`) | Platform §18, §22 | P2 | ⬜ |
| **FAB-1** | Fabricator portal (production orders; status accepted→in-prod→complete→collected) | Business §10, Platform §18 | P2 | ⬜ |
| **FAB-2** | Customer-relationship protection rules (what the fabricator sees/doesn't see) | Business §15 | P1 | 📝 (policy, not code) |
| **PRICE-1** | Pricing intelligence (per-project cost + margin tracking) | Business §12 | P2 | ⬜ |
| **PORTF-1** | Portfolio pipeline (before → measure → fab → install → finished, auto-captured) | Business §13, Phase1 §16 | P2 | ⬜ |
| **PARTNER-1** | Fabricator relationship strategy: primary + backup supplier, trade pricing, supplier agreement | Business §14 | P1 | 📝 (business task, not code) |
| **SOFT-1** | Long-term: extract the internal platform as a standalone software product for other contractors | Business §18 | P3 | 📝 (vision, revisit after Phase 1) |

### 2F. Cross-cutting / Data

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **DATA-1** | Single source of truth: `shared/js/rika-config.js` (prices, tiers, WhatsApp number, disclaimer wording, design specs) | Phase1 §26 | P0 | ✅ (exists; keep it as the one place all numbers live) |
| **ANALYTICS-1** | Track: visitor, tool usage, configuration, lead, quote, conversion, revenue, source | Phase1 §27 | P2 | ⬜ |

---

## 3. Architecture: Two Systems, One Core

```
                       ┌─────────────────────────────────────┐
   Google/Ads/Social → │        PUBLIC WEBSITE               │
                       │  rika.co.ke                       │
                       │  SEO · Products · Projects · Guides  │
                       │  Calculator · Designer · Compare     │
                       └───────────────┬─────────────────────┘
                                       │ lead capture
                                       ▼
                       ┌─────────────────────────────────────┐
                       │           SALES CRM                 │
                       │  (leads, quotes, deposits)          │
                       └───────────────┬─────────────────────┘
                                       │ quotation accepted
                                       ▼
         ┌────────────────────────────┴────────────────────────────┐
         │                     CORE (shared)                        │
         │  product-models · pricing-engine · window-configurator   │
         │  types · APIs · customer data                            │
         └────────────────────────────┬────────────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌─────────────────┐        ┌─────────────────────┐        ┌──────────────────┐
│  CUSTOMER APP   │        │      ADMIN          │        │  FABRICATOR APP  │
│  app.rika…    │        │  admin.rika…      │        │  fabricator.….   │
│  My Project     │        │  operations         │        │  production      │
└─────────────────┘        └─────────────────────┘        └──────────────────┘
```

**Key rule (Platform §17):** the two (three, four) front-ends **share** branding, design system,
product database, pricing engine, customer data, auth, and APIs. They are *technically separated*
but *logically one brand*.

**Implication for our current vanilla stack:** we do NOT need to adopt Vue/TypeScript/Three.js
right now (Phase 1 §27 suggests them, but it's "potential"). We can reach 80% of the value with
the existing vanilla + Canvas + SVG stack and defer a framework migration. See decision D1.

---

## 4. Conflicts (must resolve before building)

These are places where the docs and the current implementation disagree. Flagged, not decided.

| # | Conflict | Current code | Docs say | Resolution / my read |
|---|----------|--------------|----------|---------|
| **C1** | **Measurement disclaimer** | Shows a hard number with a soft "estimate" note | Label it "Approximate measurement" + "Final dimensions confirmed at site visit" | ✅ Resolved 2026-10-02 — wording now "Approximate — confirmed at site visit", injected from `rika-config.js`; measurement → calculator CTA carries measured dims |
| **C2** | **Homepage framing** | "Tool hub" — 3 abstract tool cards | Product catalog + "Design Your Windows" as flagship CTA | **Hybrid:** product pages (SEO-1) + one hero "Design Your Windows" CTA that opens the studio. |
| **C3** | **Visualizer vs Design Studio** | Photo-based (upload your photo, mark corners) | Parametric form-based (enter width/height, drag panels) | **Two different tools, not a conflict.** Ours = "see it in *your* house"; studio = "build a window on a blank canvas." **Build both; they complement.** |
| **C4** | **Tech stack** | Vanilla JS, no framework, no build step | Phase 1 §27 suggests Vue 3 + TS + Tailwind + Three.js | **Stay vanilla** (D1). Add Three.js only when the Design Studio needs real 3D. No full framework rewrite. |
| **C5** | **"Portal" naming** | N/A (no app yet) | Call it "My Project", never "Customer Portal" | Adopt in the app (APP-6). |
| **C6** | **Workshop positioning** | About says "Rika is a modern aluminium and glass installation company" | Do NOT claim in-house fabrication; say "Supply · Design · Installation" | Adjust copy in homepage about section. |

---

## 5. Gaps (doc asks for it, we have nothing)

Ordered by impact. The top 5 are the ones that actually move the business:

1. **Lead Capture (SAVE-1, LEAD-1)** — quote form saves to `localStorage` on the *visitor's* device. We literally cannot see their lead. Need a backend lead store. The foundation everything else (CRM, pricing intelligence, the app) sits on.
2. **Product Pages (SEO-1)** — a person searching "aluminium windows Ruiru" needs to see *windows*. We currently show three tools + a calculator. The difference between "cool demo" and "I can buy from them."
3. **Free Measurement Booking (MEAS-2)** — the docs' "ultimate public CTA." Turns digital engagement into a physical site visit. We have a *measurement tool* but no *booking* flow.
4. **Save-at-intent (SAVE-1)** — capture the lead *after* they've designed + priced (highest intent), not before.
5. **My Project / Customer App (APP-2)** — the differentiator the Business doc keeps returning to: "the customer doesn't call to ask for updates."

**Head start we have that the docs don't even consider:**
- The **Measurement tool (MEAS-1)** — the Business doc assumes on-site physical measurement; we let the *customer* pre-estimate from a photo. Keep + reframe + feeds the booking.
- The **Visualizer** — none of the three docs mention "see the window in *your own photo*." That's our unique wedge. Lead with it.

---

## 6. Detailed Coding Plan (the build order, decomposed into tasks)

This is the section to read when picking up work. Each task is self-contained: read the task,
build it, verify the DoD, flip the status. Batches end in a *shippable, demo-able* state.

**Status legend:** `⬜` not started · `🔧` in progress · `🟨` partial · `✅` done · `⏸️` blocked · `📝` spec needed.
**Owner:** `C` = Cyrus (business/content) · `A` = Agent (code) · `C+A` = both.

### Batch 0 — Fixes & foundation
> *Ship: leads land in a real DB; homepage leads with "Design Your Windows."*

| ID | Task | Status | Owner | DoD (definition of done) |
|----|------|--------|-------|---------------------------|
| T-B0-01 | MEAS-4 — measurement disclaimer (C1) | ✅ 2026-10-02 | A | Results screen says "Approximate — confirmed at site visit"; wording from `rika-config.js` |
| T-B0-02 | HOME-2/HOME-3 — reframe homepage, flagship CTA (C2) | 🟨 | A | Homepage leads with "Design Your Windows" hero CTA → opens studio; product cards present (SEO-1 fills content) |
| T-B0-03 | D3/D4/D5 — confirm backend=Frappe, pricing rates, WhatsApp number | ✅ 2026-10-02 | C | D3=Frappe · D4=real Nairobi market rates in `rika-config.js` · D5=`254718700519` |
| T-B0-04 | LEAD-1 — Frappe doc types: `Rika Lead`, `Rika Quotation`, `Rika Project` | ✅ 2026-10-02 | A | All 5 DocTypes created in the live `rika` app (Lead+Booking already existed; added Quotation, Project, Design); Rika Lead enriched with `design_config`/`created_from`; `bench migrate` clean; test inserts passed (`RIKA-QUOTE-00001`, `RIKA-PROJ-00001`, `RIKA-DESIGN-00001`) |
| T-B0-05 | LEAD-3 — wire quote form to `Rika Quotation` (guest endpoint) | ✅ 2026-10-02 | A | `/rika/api/quote` → `rika.rika.api.quotations.create_quotation` (guest-whitelisted); auto-creates linked `Rika Lead`; verified live via nginx (`RIKA-QUOTE-00004`); nginx module path fixed to `rika.rika.api.*` |
| T-B0-06 | QUOTE-1 fix — quote form persists server-side | ✅ 2026-10-02 | A | Quote persists in Frappe `Rika Quotation` doc; verified end-to-end via nginx; auto-linked to `Rika Lead`; test data cleaned |
| T-B0-07 | MEAS-2 — free measurement *booking* (date/time/location form) | ✅ 2026-10-02 | A | Frontend CTA + modal form (already built in `shared/js/booking.js`) → `/rika/api/booking` → `rika.rika.api.bookings.create_booking` (guest-whitelisted). Fixed: en-dash normalization in time slots, nginx module path. Verified live end-to-end; test data cleaned |

**Batch 0: ✅ COMPLETE (all 7 tasks done). Next: Batch 1 — Conversion engine (T-B1-03 first).**

---

### Batch 1 — The conversion engine
> *Ship: a stranger can estimate their project in 60 seconds and become a stored lead.*

| ID | Task | Status | Owner | DoD |
|----|------|--------|-------|-----|
| T-B1-01 | CALC-1 — price calculator (per-m² engine, KSh range) | ✅ 2026-10-02 | A | `/rika/tools/calculator/` live; type+dims+qty+profile+glass → KSh *range* in <1s, no login, "Get Exact Quote" CTA; rates from `rika-config.js` |
| T-B1-02 | CALC-2 — three-tier packages (Essential/Comfort/Premium) | ✅ 2026-10-02 | A | 3 tiers in calculator with spec + price deltas; tap-to-apply per-m² |
| T-B1-03 | SAVE-1 — "Save My Design" lead capture at moment of intent | ⬜ | A | After calculator *or* designer use, a "Save My Design" prompt asks name/WhatsApp/email; stores design config + lead in `Rika Lead` (not localStorage); shows confirmation + "get exact quote" CTA |
| T-B1-04 | QUOTE-2 — exact-quote flow from calculator | ⬜ | A | "Get Exact Quote" from calculator → pre-fills quote form (type/dims/qty) → `Rika Quotation` created → reference code returned |
| T-B1-05 | WASAPP-1 completion — pre-populate WhatsApp from design state | ⬜ | A | Every major CTA (calculator, designer, compare, second-quote) generates a `wa.me/254718700519` link with the current config + price pre-filled |

**When resuming:** T-B1-03 (biggest gap) → T-B1-04 → T-B1-05.

---

### Batch 2 — Product & SEO spine
> *Ship: "aluminium windows Ruiru" lands on real product + price + book-a-measurement.*

| ID | Task | Status | Owner | DoD |
|----|------|--------|-------|-----|
| T-B2-01 | SEO-1 — 5 product catalog pages (Windows, Doors, Glass, Shopfronts, Partitions) | ⬜ | C+A | 5 indexable pages under `/rika/products/`; real content (not lorem); each has calculator + quote + WhatsApp CTA; nav updated |
| T-B2-02 | SEO-3 — price-index page (living price table) | ⬜ | A | `/rika/prices/` shows sliding/casement/fixed/doors/shopfronts/partitions + glass + tiers; pulls from `rika-config.js`; dated "last updated"; authority framing |
| T-B2-03 | CAT-1 — interactive product catalogue | ⬜ | A | Product cards let user change colour/glass/panels/dims and see live price impact (reuses calculator engine) |
| T-B2-04 | SEO-2 — local SEO landing pages (Nairobi, Ruiru, Kiambu) + Google Ads landing pages | ⬜ | C+A | One page per location + per high-intent search; each: info → calculator → quote → WhatsApp; designed to convert paid traffic |
| T-B2-05 | SEO-6 — cost guides per search intent ("cost of windows for a 3/4/5-bed") | ⬜ | C+A | 3–5 cost-guide pages targeting high-intent searches; each ends in calculator + quote |
| T-B2-06 | SEO-7 — "Aluminium vs UPVC" comparison | ⬜ | C+A | Comparison page: spec table + price delta + calculator |
| T-B2-07 | SEO-5 — buying guide (downloadable, lead-gated) | ⬜ | C+A | Guide PDF/HTML; download requires name/WhatsApp/email → `Rika Lead` |
| T-B2-08 | SECOND-1 — "Get a Second Quote" (upload competitor quote) | ⬜ | A | `/rika/second-quote/`: upload/enter quote → rules-based analysis (price/m² vs our reference range) → "want a competitive quote?" CTA |
| T-B2-09 | AUDIT-1 — free house window audit | ⬜ | C+A | `/rika/audit/`: submit plans/photos/project details → human review → preliminary budget; stored in `Rika Audit Request` |
| T-B2-10 | CALC-3 — construction budget calculator (broad house budget → window slice) | ⬜ | A | `/rika/tools/budget/`: house size/bedrooms/location/stage → broad budgets, highlights window slice → quote CTA |

**When resuming:** T-B2-01 first (unblocks local pages + ad landing pages), then T-B2-02, then the rest in priority order.

---

### Batch 3 — The "feels like AI" layer
> *Ship: the full DISCOVER→DESIGN→ESTIMATE→CAPTURE journey, zero AI.*

| ID | Task | Status | Owner | DoD |
|----|------|--------|-------|-----|
| T-B3-01 | DESIGN-1 — Window Design Studio (parametric front-facing editor) | ⬜ | A | `/rika/tools/design/`: choose type/dims/panels/frame/glass/opening/handle; visual updates instantly (SVG/Canvas); live price; "Save My Design" CTA. Distinct from photo-based visualizer (C3) |
| T-B3-02 | RECO-1 — recommendation quiz ("Find Your Window") | ⬜ | A | 5–7 question quiz (room, budget, security, ventilation, light, noise, style, new/reno) → deterministic recommendation + price → "Get Quote" CTA |
| T-B3-03 | CMP-1 — compare options (side-by-side, live price delta) | ⬜ | A | `/rika/compare/`: Essential vs Comfort vs Premium table (profile/glass/hardware/security/price); switching options updates project price live |
| T-B3-04 | DESIGN-2 — "Build My House Windows" guided flow | ⬜ | A | Guided flow: house type → style → priorities → budget → per-room recommendations + total window budget estimate |
| T-B3-05 | DESIGN-3 — "Your House, Your Windows" (pre-built house scenes) | ⬜ | A | House-selection experience: style + window style + colour + glass → before/after slider (layered images/SVG/Canvas) |
| T-B3-06 | DESIGN-4 — house window map (floor plan → schedule) | ⬜ | A | `/rika/tools/house-map/`: sample floor plan; click openings → add to window schedule; shows total windows/doors + budget estimate → exact quote CTA |

**When resuming:** T-B3-01 first (it's the flagship the docs keep naming), then T-B3-02, T-B3-03, then the rest.

---

### Batch 4 — The customer app
> *Ship: a customer who accepts a quote gets a live view of their project. No more "any update?" calls.*

| ID | Task | Status | Owner | DoD |
|----|------|--------|-------|-----|
| T-B4-01 | APP-1 — auth (customer accounts, Frappe) | ⬜ | A | Login/signup at `/rika/app/` (or `app.rika.co.ke` per D2); Frappe User + role; session via existing JWT flow |
| T-B4-02 | APP-2 — "My Project" stage tracker | ⬜ | A | Logged-in customer sees project with stage tracker (measure→design→approve→fabricate→install→handover), current stage highlighted, dates per stage |
| T-B4-03 | APP-3 — My Designs / My Quotations | ⬜ | A | `/rika/app/designs` + `/rika/app/quotations`: list of saved designs + quotations; open/edit; re-quote |
| T-B4-04 | APP-4 — payments + install schedule + documents | ⬜ | A | `/rika/app/payments`: deposit status, payment history (M-Pesa); install schedule; downloadable documents (quote, contract, warranty) |
| T-B4-05 | APP-5 — warranty + messages | ⬜ | A | `/rika/app/warranty`: warranty details + status; `/rika/app/messages`: thread with the company |
| T-B4-06 | APP-6 — naming: "My Project", never "Customer Portal" | ⬜ | A | All customer-facing copy uses "My Project" / "Open My Project" (not "Portal") |

**When resuming:** T-B4-01 → T-B4-02 (the differentiator) → T-B4-03 → T-B4-04/05 → T-B4-06.

---

### Batch 5 — Operations & the flywheel
> *Ship: every completed project feeds more photos, reviews, SEO pages, data, and referrals.*

| ID | Task | Status | Owner | DoD |
|----|------|--------|-------|-----|
| T-B5-01 | FAB-1 — fabricator portal (production orders + status) | ⬜ | A | `fabricator.rika.co.ke` (or `/rika/fabricator/`): receive production orders digitally; status accepted→in-prod→complete→collected; monitor without phone calls |
| T-B5-02 | FAB-2 — customer-relationship protection (policy + access rules) | ⬜ | C+A | Fabricator sees only what's needed to fabricate; customer contact info not exposed; access roles enforce it |
| T-B5-03 | PRICE-1 — pricing intelligence (per-project cost + margin) | ⬜ | A | Record per project: selling price, alu/glass/hardware/fabrication/installation/transport/wastage/marketing cost, gross profit, margin; report by product type |
| T-B5-04 | PORTF-1 — portfolio pipeline (before→measure→fab→install→finished) | ⬜ | A | Auto-capture project photos/stages; feed case-study pages (SEO-4) |
| T-B5-05 | SEO-4 — project case studies (not a photo grid) | ⬜ | C+A | Case-study template: Before→Measurement→Installation→Finished + "want something similar?" CTA; one page per project |
| T-B5-06 | REF-1 — referral engine | ⬜ | A | Post-project "Refer a friend" + reward; each completed project → review + referral + photos + case study |
| T-B5-07 | DEP-1 — M-Pesa deposits | ⬜ | A | Deposit collection via M-Pesa (STK push / C2B); linked to `Rika Quotation`/`Rika Project`; receipt shown |
| T-B5-08 | MEAS-3 — installer measurement recorder (mobile) | ⬜ | A | Installer app/page: record every opening (W01, W02…) with dims, type, photos, notes; flows into quote + production |
| T-B5-09 | LEAD-2 — CRM / lead management (source tracking, funnel) | ⬜ | A | Lead pipeline with source tracking (Google/FB/Contractor/Referral); funnel report (leads→customers→revenue per source) |
| T-B5-10 | ADM-1 — admin app | ⬜ | A | `admin.rika.co.ke`: dashboard, leads, quotes, projects, fabricator orders, pricing analytics in one place |
| T-B5-11 | ANALYTICS-1 — usage + conversion tracking | ⬜ | A | Track visitor/tool usage/configuration/lead/quote/conversion/revenue/source; feed back into pricing + marketing |
| T-B5-12 | GBP-1 — Google Business Profile + reviews | ⬜ | C | Strong local presence; post-project review collection; target high rating + portfolio |
| T-B5-13 | PARTNER-1 — fabricator relationship (primary + backup, trade pricing, agreement) | ⬜ | C | Named primary + backup supplier; trade pricing negotiated; written agreement (pricing, quality, delivery, rework, confidentiality, customer protection, non-solicitation, payment) |

**When resuming:** T-B5-07 (deposits) and T-B5-01 (fabricator) first once real projects start flowing; the rest as volume justifies.

---

## 7. Data Model (the Frappe DocTypes everything hangs off)

Defined up front so no feature builds on a missing table. All in `rika_backend` app.

### `Rika Lead`
| Field | Type | Notes |
|-------|------|-------|
| name | Autono | `RIKA-LEAD-####` |
| full_name | Data | |
| phone | Data | +254… |
| email | Data | optional |
| whatsapp | Data | for `wa.me` |
| source | Select | Google Ads / SEO / Social / Referral / Contractor / Direct / WhatsApp |
| project_type | Select | Windows / Doors / Glass / Mixed |
| location | Data | |
| notes | Small Text | |
| design_config | JSON | the saved design (type/dims/glass/finish/qty) at capture |
| status | Select | Anonymous / Lead / Site Visit / Quoted / Won / Lost |
| created_from | Link | `Rika Quotation` or `Rika Design` if it came from one |

### `Rika Quotation`
| Field | Type | Notes |
|-------|------|-------|
| name | Autono | `RIKA-QUOTE-####` |
| lead | Link → `Rika Lead` | |
| line_items | JSON / Child Table | per-window: type, dims, qty, profile, glass, finish, unit price, total |
| tier | Select | Essential / Comfort / Premium |
| total_low | Currency | KSh range low |
| total_high | Currency | KSh range high |
| status | Select | Draft / Sent / Accepted / Declined |
| ref_code | Data | client-generated `RIKA-XXXX-XXXX` (kept for continuity) |
| submitted_at | Datetime | |

### `Rika Project`
| Field | Type | Notes |
|-------|------|-------|
| name | Autono | `RIKA-PROJ-####` |
| quotation | Link → `Rika Quotation` | |
| customer | Link → `Rika Lead` (or Frappe Customer) | |
| stage | Select | Measurement / Design / Approval / Fabrication / Installation / Handover |
| stage_dates | JSON | per-stage dates |
| deposit_paid | Check | |
| install_date | Date | |
| handover_date | Date | |
| warranty_expires | Date | |

### `Rika Design` (saved-at-intent, SAVE-1)
| Field | Type | Notes |
|-------|------|-------|
| name | Autono | `RIKA-DESIGN-####` |
| owner | Data (guest) / Link (user) | |
| config | JSON | full design state (type/dims/panels/glass/finish/handle/opening) |
| estimate_low | Currency | |
| estimate_high | Currency | |
| source_tool | Select | Calculator / Designer / Studio / House Map |
| saved_at | Datetime | |

### `Rika Measurement Booking`
| Field | Type | Notes |
|-------|------|-------|
| name | Autono | `RIKA-BOOK-####` |
| full_name / phone / location | Data | |
| project_type | Select | |
| preferred_date | Date | |
| preferred_time | Data | |
| status | Select | Requested / Confirmed / Completed / Cancelled |

### `Rika Audit Request` / `Rika Fabrication Order` / `Rika Measurement Record`
(defined when their batch starts; follow the same pattern)

---

## 8. What We Keep (do NOT dilute)

1. **Photo-based Visualizer** — the docs never mention "see it in your own photo." This is the wedge. Keep it as the flagship experience, not a footnote.
2. **Hand-rolled homography** — no AI, no paid APIs, no OpenCV. The Phase 1 doc's entire identity is "feels like AI, uses zero AI." Our geometry is the proof. Keep.
3. **A4 measurement** — the docs assume on-site physical measurement. Our photo-based pre-estimate is a real capability they don't have. Keep + reframe + add the disclaimer (C1).
4. **Vanilla, no-build stack** — trivial to deploy, zero dependencies, matches the existing `threaded-server.py`. Don't rip it out for a framework before we've proven demand. (See C4.)
5. **Client-side everything** — photos never leave the browser. This is a *privacy* selling point the docs don't even mention. Lead with it.
6. **`rika-config.js` as single source of truth** (DATA-1) — every number (price, tier, WhatsApp, disclaimer) lives in one file. Keep it that way.

---

## 9. Decisions (status)

| # | Decision | Status | Value |
|---|----------|--------|-------|
| **D1** | Tech stack for the growth | ✅ Resolved | **(a) Stay vanilla** + Canvas/SVG. Add Three.js only when the Design Studio needs real 3D. No full framework rewrite. |
| **D2** | Two-system split now or later | ✅ Resolved | **(a) Same origin** (`/rika/app/`) for now. Move to `app.rika.co.ke` once the app has real auth + its own data load. |
| **D3** | Backend for leads/quotes | ✅ Resolved | **(a) Frappe doc types** — we already run Frappe; gives auth, REST API, real DB for free. |
| **D4** | Pricing data | ✅ Resolved 2026-10-02 | Rates anchored to real Nairobi market data (windows 6.5k–12k, sliding/casement 7.5k–14k /m²). All in `rika-config.js`. Swap in real trade rates there when ready — zero other changes. |
| **D5** | WhatsApp number | ✅ Resolved 2026-10-02 | `0718 700 519` → `wa.me/254718700519`. Wired into calculator CTAs, homepage float, footer. In `rika-config.js`. |
| **D6** | Domain | ⬜ Open | **(b) Get `rika.co.ke`** for real SEO (the whole SEO strategy depends on a clean domain). For now everything works on the IP. |
| **D7** | Fabrication partner | ⬜ Open | Named partner + pricing model (trade vs retail). Needed before FAB-1 and pricing intelligence. |

---

## 10. Marking Scheme (how we score progress)

Each feature has a **weight**. Total = 100 points. A feature is `✅` only when its DoD is met. `🟨` = partial (50%).

| Group | Features (IDs) | Weight |
|-------|----------------|--------|
| **Acquisition Foundation** | SEO-1, HOME-2, HOME-3, CALC-1, MEAS-2, SAVE-1, LEAD-1, QUOTE-2, LEAD-3 | **30** |
| **Engagement Depth** | CALC-2, RECO-1, CMP-1, DESIGN-1, DESIGN-2, WASAPP-1, MEAS-4 | **20** |
| **SEO & Content** | SEO-2, SEO-3, SEO-4, SEO-5, SEO-6, SEO-7, AUDIT-1, SECOND-1 | **15** |
| **Customer App** | APP-1, APP-2, APP-3, APP-4, APP-5, APP-6 | **20** |
| **Operations** | ADM-1, FAB-1, FAB-2, PRICE-1, PORTF-1, REF-1, DEP-1, MEAS-3 | **15** |

### Per-feature Definition of Done (the ones that matter)

| ID | Definition of Done (must be true to count) |
|----|---------------------------------------------|
| **CALC-1** | Entering type+dims+qty+profile+glass+location returns a KSh *range* in <1s, no login, "Get Exact Quote" CTA. Real rates from D4. ✅ |
| **SEO-1** | 5 product pages (Windows, Doors, Glass, Shopfronts, Partitions) indexable, real content, each with calculator + quote + WhatsApp CTA. |
| **SAVE-1** | After calculator *or* designer use, a "Save My Design" prompt asks name/WhatsApp/email and stores the lead in the backend (not localStorage). |
| **LEAD-1/3** | Leads and quotes stored server-side (Frappe doc types), queryable, survive the visitor closing their browser. |
| **MEAS-2** | "Book a Free Measurement" form (name/phone/location/project-type/date/time) captures a booking and shows confirmation. |
| **MEAS-4** | Measurement results screen says "Approximate measurement" + "Final dimensions confirmed at site visit"; does NOT present the number as exact. ✅ |
| **RECO-1** | A 5–7 question quiz returns a deterministic window recommendation + price, no AI. |
| **APP-2** | A logged-in customer sees "My Project" with the stage tracker (measure→design→approve→fabricate→install→handover), current stage highlighted. |
| **WASAPP-1** | Every major CTA produces a `wa.me` link pre-populated with the visitor's current design/pricing. |

**Scoring:** sum the weights of `✅` features + 50% of `🟨` ones. Report after every build.
Target: **50 pts** = the platform is a *real* acquisition machine, not a demo. **100 pts** = full Phase 1.

---

## 11. What the Docs Get Wrong or Under-Specify (my critique)

1. **None of the three docs mention the photo-based visualizer.** That's *our* best feature. Don't let the roadmap bury it.
2. **The docs over-index on SEO content volume** (local pages, cost guides, comparisons, price index, buying guide). That's a *content-marketing* program, not a software build. It's real work but it's copywriting + publishing, not engineering. Budget separately.
3. **"Feels like AI, uses zero AI"** is a great *marketing* line but a weak *engineering* spec. "Deterministic rules engine" isn't buildable until we define the actual rules (which window, which glass, which price, for which inputs). That's D4 (resolved).
4. **The customer app is sketched, not specified.** "My Project, payments, documents, warranty" — no data model, no permissions, no state machine. Section 7 above now defines the data model; the state machine is the stage tracker (APP-2).
5. **Pricing is the whole game, and all three docs hand-wave it.** No actual price list in any doc. D4 resolved — rates live in `rika-config.js`; swap in real trade rates when ready.
6. **M-Pesa deposits (DEP-1)** mentioned but never specified. We have M-Pesa experience; needs merchant setup (D7 / T-B5-07).

---

## 12. Status Snapshot (updated 2026-10-02)

| Group | Weight | Earned | % |
|-------|--------|--------|---|
| Acquisition Foundation | 30 | 0 | 0% |
| Engagement Depth | 20 | CALC-2 ✅ + MEAS-4 ✅ (10) + WASAPP-1 🟨 (2.5) ≈ 12.5 | 62% |
| SEO & Content | 15 | 0 | 0% |
| Customer App | 20 | 0 | 0% |
| Operations | 15 | 0 | 0% |
| **Total** | **100** | **≈ 12.5** | **≈ 13%** |

> The *existing* tools (visualizer, measurement, quotation) are **pre-roadmap** work — the proof-of-concept the acquisition engine is built on. They don't score under the scheme (the scheme measures the *business platform*, not the MVP). They are the strongest asset we have.

### Current build state
- **Done:** CALC-1, CALC-2, MEAS-4, WASAPP-1 (partial), DATA-1, T-B0-04 (Frappe doc types), all Batch 0 decisions (D3/D4/D5), homepage reframe (partial).
- **In flight:** Batch 0 code tasks T-B0-05 → T-B0-07 (lead wiring → measurement booking). T-B0-04 (Frappe doc types) ✅ done.
- **Next up after Batch 0:** Batch 1 (SAVE-1, QUOTE-2, WASAPP-1 completion) → Batch 2 (SEO spine) → Batch 3 (the "feels like AI" layer) → Batch 4 (customer app) → Batch 5 (operations flywheel).

### How to pick up at any time
1. Read this snapshot + the **Rules of this file** at the top.
2. Find the current `🔧` / first `⬜` task in the active batch.
3. Read its DoD, build it, verify the DoD, flip the status, update `RIKA.md` if code changed.
4. If a task is blocked, mark it `⏸️` with the blocker named.
5. If something doesn't fit, add it to the register (§2) + plan (§6) with a new ID — never leave work un-ID'd.

---

*Update this file after every build. It is the tracker. `RIKA.md` is the code brain. Together they are the project's memory.*

# RIKA_ROADMAP.md — Combined Technical Report & Progress Tracker

> **Purpose:** This is the single marking scheme and progress tracker for the Rika platform.
> It consolidates three strategy documents into one buildable roadmap, cross-references every
> feature against what is already implemented, flags conflicts and gaps, and defines a scoring
> system so progress is measurable. Read `RIKA.md` for the *current code internals*; read this
> file for *what to build next, in what order, and how to know it's done*.
>
> **Sources consolidated:**
> 1. `TECHNOLOGY-ENABLED ALUMINIUM & GLASS BUSINESS` (business strategy)
> 2. `ALUMINIUM & GLASS DIGITAL PLATFORM` (website + customer app architecture)
> 3. `PHASE 1 — THE ULTIMATE ZERO-AI CUSTOMER ACQUISITION PLATFORM` (feature spec)
>
> **How to use this file:**
> - Each feature has an **ID** (e.g. `CALC-1`), a **priority**, and a **status**.
> - Statuses: `✅ built` · `🟨 partial` · `⬜ not started` · `⚠️ conflict`
> - After building anything, update the status here AND in `RIKA.md`.
> - The "Marking Scheme" (Section 9) is how we score progress. Don't skip it.

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
| **SHELL-1** | App shell (header/nav/footer) + design system CSS | ✅ | `rika.css`, `--af-*` tokens, mobile burger |
| **HOME-1** | Homepage: hero + tools grid + about + stats | ✅ | Tool-hub framing, not product catalog |
| **VIS-1** | Window Visualizer (photo → 4 corners → perspective overlay) | ✅ | Homography, 5 designs, 4 finishes, 4 glass types, before/after slider |
| **VIS-2** | Quote CTA in visualizer (modal form) | ✅ | Toast-only, no persistence |
| **MEAS-1** | Measurement tool (A4 reference → real-world dims) | ✅ | Homography + `invertH`, 4-step flow |
| **QUOTE-1** | Quotation tool (lead form + validation + localStorage) | ✅ | No pricing logic, no backend |
| **INFRA-1** | `threaded-server.py` + nginx `/rika/` route | ✅ | Serves `house-demo/rika/` |
| **TEST-1** | Playwright end-to-end tests (3 tools) | ✅ | 390px viewport, synthetic images |

**What is NOT built (the gap):** everything below.

---

## 2. Feature Inventory (the full roadmap)

Each feature is tagged with its source doc section. Priority:
**P0** = do now (unblocks everything) · **P1** = build next · **P2** = build after · **P3** = later/optional.

### 2A. Public Website (Acquisition)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **SEO-1** | Product catalog pages (Windows, Doors, Glass, Shopfronts, Partitions) | Platform §2, Phase1 §17 | P0 | ⬜ |
| **SEO-2** | Local SEO landing pages (Nairobi, Ruiru, Kiambu…) | Business §6, Platform §3, Phase1 §20 | P1 | ⬜ |
| **SEO-3** | Price-index page (Kenya aluminium window price index) | Phase1 §15 | P1 | ⬜ |
| **SEO-4** | Project gallery as case studies (not a photo grid) | Phase1 §16, Business §13 | P1 | ⬜ |
| **SEO-5** | Buying guide (downloadable, lead-gated) | Phase1 §12 | P2 | ⬜ |
| **SEO-6** | Cost guides per search intent ("cost of windows for a 4-bed") | Phase1 §14, §22 | P2 | ⬜ |
| **SEO-7** | "Aluminium vs UPVC" comparison content | Platform §3, Phase1 §14 | P3 | ⬜ |
| **HOME-2** | Re-frame homepage from tool-hub → product + experience hub | Platform §2, §24 | P0 | ⚠️ |
| **HOME-3** | Change flagship CTA to "Design Your Windows" / "Build Your Window" | Platform §6, §24 | P0 | ⚠️ |

### 2B. Interactive Tools (Engagement)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **CALC-1** | Price calculator (type, dims, qty, profile, glass → KSh range) | Business §7, Platform §8, Phase1 §6 | P0 | ✅ Built 2026-10-02 — live at /rika/tools/calculator/ (prices from shared/js/rika-config.js, the single source) |
| **CALC-2** | Three-tier pricing (Essential / Comfort / Premium) | Phase1 §7 | P1 | ✅ Built 2026-10-02 — 3 tiers in the calculator, tap-to-apply per-m² |
| **CALC-3** | Construction budget calculator (broad house budget → window slice) | Phase1 §22 | P3 | ⬜ |
| **DESIGN-1** | Window Design Studio (interactive front-facing editor) | Platform §7, Phase1 §2 | P0 | 🟨 (visualizer is photo-based; studio is form/parametric-based — different thing) |
| **DESIGN-2** | "Build My House Windows" guided flow (house type → per-room recs) | Phase1 §3 | P1 | ⬜ |
| **DESIGN-3** | "Your House, Your Windows" (pre-built house scenes, before/after) | Phase1 §4 | P2 | ⬜ |
| **DESIGN-4** | House window map (floor plan, click openings → schedule) | Phase1 §5 | P2 | ⬜ |
| **RECO-1** | Recommendation engine / "Find Your Window" quiz | Platform §9, Phase1 §8 | P1 | ⬜ |
| **CMP-1** | Compare options (side-by-side, live price delta) | Phase1 §9, Platform §2 | P1 | ⬜ |
| **SECOND-1** | "Get a Second Quote" (upload competitor quote → analysis) | Phase1 §10, §11 | P2 | ⬜ |
| **AUDIT-1** | Free house window audit (plans + photos → budget review) | Phase1 §13 | P3 | ⬜ |
| **MEAS-2** | Free measurement *booking* (date/time/location form) | Platform §15, Phase1 §19 | P0 | ⬜ |
| **MEAS-3** | Installer-facing measurement recorder (W01, W02… + photos + notes) | Business §9 | P2 | ⬜ |
| **MEAS-4** | Fix measurement disclaimer → "Approximate, confirm on site" | Phase1 + earlier spec | P0 | ⚠️ conflict |
| **WASAPP-1** | WhatsApp integration everywhere (pre-populated messages) | Platform §14, Phase1 §18 | P1 | 🟡 Partial — wa.me pre-fill on calculator CTAs + homepage float; number in config (254718700519) |
| **SAVE-1** | "Save My Design" lead capture (name/WhatsApp/email at the moment of intent) | Platform §10 | P0 | ⬜ |

### 2C. Lead & Sales (Conversion)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **LEAD-1** | Lead model + pipeline (anonymous → lead → customer) | Platform §13, Business §11 | P0 | ⬜ |
| **LEAD-2** | CRM / lead management (source tracking, funnel) | Business §11 | P1 | ⬜ |
| **LEAD-3** | Quote persistence (backend, not just localStorage) | Business §7, Platform | P0 | ⚠️ (currently localStorage only) |
| **QUOTE-2** | Quote engine tied to calculator + design studio | Business §7, Platform §8 | P0 | ⬜ |
| **DEP-1** | Deposit collection (M-Pesa) | Business §2 | P1 | ⬜ |
| **REF-1** | Referral engine (post-project reward + case study) | Phase1 §23, Business §5 | P2 | ⬜ |

### 2D. Customer Application (Post-Sale) — `app.rika.co.ke`

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **APP-1** | Auth (customer accounts) | Platform §11, §17 | P1 | ⬜ |
| **APP-2** | "My Project" (stage tracker: measure → design → approve → fabricate → install → handover) | Business §8, Platform §11, §13 | P1 | ⬜ |
| **APP-3** | My Designs / My Quotations | Platform §11 | P1 | ⬜ |
| **APP-4** | Payments + install schedule + documents | Platform §11, §21 | P2 | ⬜ |
| **APP-5** | Warranty + messages | Platform §11, §21 | P2 | ⬜ |
| **APP-6** | Naming: call it "My Project", not "Customer Portal" | Platform §12 | P1 | ⚠️ (terminology) |

### 2E. Internal / Operational (Admin + Fabricator)

| ID | Feature | Src | Priority | Status |
|----|---------|-----|----------|--------|
| **ADM-1** | Admin app (`admin.rika.co.ke`) | Platform §18, §22 | P2 | ⬜ |
| **FAB-1** | Fabricator portal (production orders, status: accepted→in-prod→complete→collected) | Business §10, Platform §18 | P2 | ⬜ |
| **FAB-2** | Customer-relationship protection rules (what the fabricator sees/doesn't see) | Business §15 | P1 | ⚠️ (policy, not code) |
| **PRICE-1** | Pricing intelligence (per-project cost + margin tracking) | Business §12 | P2 | ⬜ |
| **PORTF-1** | Portfolio pipeline (before → measure → fab → install → finished, auto-captured) | Business §13, Phase1 §16 | P2 | ⬜ |

---

## 3. Architecture: Two Systems, One Core

The Platform doc is explicit about this. We currently have **one** system. We need to become **two**, sharing a core.

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
the existing vanilla + Canvas + SVG stack and defer a framework migration. **Decision needed:**
keep vanilla (recommended for now) or migrate to a framework. See Section 8.

---

## 4. Conflicts (must resolve before building)

These are places where the docs and the current implementation disagree. I'm flagging, not deciding.

| # | Conflict | Current code | Docs say | My read |
|---|----------|--------------|----------|---------|
| **C1** | **Measurement disclaimer** | Shows a hard number ("Your Measurement: 539 mm") with a soft "estimate" note | Phase 1 + your earlier spec: label it **"Approximate measurement"** + "Final dimensions confirmed at site visit" | ✅ Fixed 2026-10-02 — wording now "Approximate — confirmed at site visit", injected from rika-config.js (single source); measurement → calculator CTA carries measured dims |
| **C2** | **Homepage framing** | "Tool hub" — 3 abstract tool cards | Product catalog + "Design Your Windows" as the flagship CTA | The doc is right for *acquisition*. But our tools *are* the differentiation. **Hybrid:** product pages + one hero "Design Your Windows" CTA that opens the studio. |
| **C3** | **Visualizer vs Design Studio** | Photo-based (upload your photo, mark corners, see it in place) | Parametric form-based (enter width/height, drag panels, see a *generic* window) | These are **two different tools**, not a conflict. Ours is the "see it in *your* house" tool; the studio is the "build a window on a blank canvas" tool. **Build both; they complement.** |
| **C4** | **Tech stack** | Vanilla JS, no framework, no build step | Phase 1 §27 suggests Vue 3 + TS + Tailwind + Three.js | A suggestion, not a requirement. We can deliver every P0/P1 feature in vanilla. **Recommend: stay vanilla until the configurator needs 3D, then consider Three.js (no full framework rewrite).** |
| **C5** | **"Portal" naming** | N/A (no app yet) | Call it **"My Project"**, never "Customer Portal" | Adopt the terminology in the app. Trivial. |
| **C6** | **Workshop positioning** | About says "Rika is a modern aluminium and glass installation company" | Business §13: do NOT claim in-house fabrication; say "Supply · Design · Installation" | Adjust copy. We're accurate today (we don't claim a workshop) but should be *explicit* about the supply/design/install positioning. |

---

## 5. Gaps (doc asks for it, we have nothing)

Ordered by impact. The top 5 are the ones that actually move the business:

1. **Price Calculator (CALC-1)** — the single biggest gap. The Business doc calls it "a major future feature" and Phase 1 builds the whole acquisition engine around it. Right now a visitor gets *no number*. This is the conversion engine.
2. **Product Pages (SEO-1)** — a person searching "aluminium windows Ruiru" needs to see *windows*. We currently show three abstract tools. This is the difference between "cool demo" and "I can buy from them."
3. **Lead Capture (SAVE-1, LEAD-1)** — our quote form saves to `localStorage` on the *visitor's* device. We literally cannot see their lead. We need a backend lead store. This is the foundation everything else (CRM, pricing intelligence, the app) sits on.
4. **Free Measurement Booking (MEAS-2)** — the docs' "ultimate public CTA." Turns digital engagement into a physical site visit. We have a *measurement tool* but no *booking* flow.
5. **My Project / Customer App (APP-2)** — the differentiator the Business doc keeps coming back to: "the customer doesn't call to ask for updates." The stage tracker is the highest-perceived-value post-sale feature.

**Notable "we already have a head start" items:**
- The **Measurement tool (MEAS-1)** is a genuine head start the Business doc's §9 doesn't even consider (it assumes installers measure on-site; we let the *customer* pre-estimate from a photo). Keep and reframe it as the "instant pre-estimate" that feeds the booking.
- The **Visualizer** is *better* than anything in the docs — none of the three documents mention "see the window in *your own photo*." That's our unique wedge. Lead with it.

---

## 6. Improvements (doc is better than what we built — adopt it)

| What | Why the doc wins | Action |
|------|------------------|--------|
| **Price ranges, not single numbers** (CALC-1) | Ours has no price at all; the doc's range ("KSh 380k–430k") is honest *and* a strong hook | Add a deterministic pricing function (per-m² rates by tier) — no AI, just math |
| **Three-tier packages** (CALC-2) | Ours has one flat quote; tiers create price anchoring and push toward premium | Essential/Comfort/Premium with real spec + price deltas |
| **Recommendation engine** (RECO-1) | "Feels like it understands me" without AI — pure rules | A 5-question quiz → deterministic recommendation + price |
| **WhatsApp pre-population** (WASAPP-1) | Ours has no WhatsApp; the doc's pre-filled message ("Hi, I'd like 6 sliding windows, Ruiru, 2m×2m, black, est. 300k") is a *qualified* lead, not "Hi." | Build a `wa.me` link generator from the current design state |
| **Save-at-moment-of-intent** (SAVE-1) | Ours asks for a quote up front; the doc captures the lead *after* they've designed + priced — when intent is highest | Trigger lead form after calculator/design, not before |
| **"Get a Second Quote"** (SECOND-1) | Targets the highest-intent segment (people who already have a quote) — a competitor-conversion weapon we don't have at all | Rules-based quote analysis (price/m² vs our reference range) |
| **Project case studies** (SEO-4) | A photo grid is weak; a before→measure→install→finished *story* with a "want something similar?" CTA is an SEO + conversion page | Template for case studies; populate as projects complete |
| **Price index** (SEO-3) | Becomes the *authority* page that owns "aluminium window prices Kenya" in search | A living price table, updated as real data accumulates |

---

## 7. What We Keep (do NOT dilute)

These are things the docs under-specify or that we've done better than the docs:

1. **Photo-based Visualizer** — the docs never mention "see it in your own photo." This is the wedge. Keep it as the flagship experience, not a footnote.
2. **Hand-rolled homography** — no AI, no paid APIs, no OpenCV. The Phase 1 doc's entire identity is "feels like AI, uses zero AI." Our geometry is the proof of that. Keep.
3. **A4 measurement** — the docs assume on-site physical measurement. Our photo-based pre-estimate is a real capability they don't have. Keep + reframe + add the disclaimer (C1).
4. **Vanilla, no-build stack** — trivial to deploy, zero dependencies, matches the existing `threaded-server.py`. Don't rip it out for a framework before we've proven demand. (See C4.)
5. **Client-side everything** — photos never leave the browser. This is a *privacy* selling point the docs don't even mention. Lead with it.

---

## 8. Decisions Cyrus Must Make (I won't decide these for you)

| # | Decision | Options | My recommendation |
|---|----------|---------|-------------------|
| **D1** | Tech stack for the growth | (a) Stay vanilla + Canvas/SVG · (b) Migrate to Vue 3 + TS · (c) Add Three.js for 3D only | **(a) now**, add **(c)** only when the Design Studio needs real 3D. A full framework rewrite is premature. |
| **D2** | Two-system split *now* or later | (a) Build the customer app on the same origin (`/rika/app/`) · (b) Separate subdomain (`app.rika.co.ke`) | **(a) now** (simpler, same nginx). Move to **(b)** once the app has real auth + its own data load. |
| **D3** | Backend for leads/quotes | (a) Frappe doc types (we already run Frappe) · (b) A small JSON/SQLite endpoint · (c) Stay localStorage (no) | **(a)** — we already have Frappe on this box, and it gives us auth, REST API, and a real DB for free. (c) is a dead end for a business. |
| **D4** | Pricing data | (a) Hard-coded KSh per-m² rates I define · (b) Cyrus gives me real rates | ✅ **Resolved 2026-10-02** — Cyrus: "pick a figure online". Engine built with rates anchored to real Nairobi market data (Lasi Interiors live list: windows 6.5k–12k, sliding/casement 7.5k–14k / m²). All numbers live in ONE place: `shared/js/rika-config.js`. Swap in real trade rates there when ready — zero other changes. |
| **D5** | WhatsApp number | (a) A business number for `wa.me` links | ✅ **Resolved 2026-10-02** — `0718 700 519` → `wa.me/254718700519`. Wired into calculator CTAs, homepage float, footer. Number stored in `rika-config.js`. |
| **D6** | Domain | (a) Keep `51.44.11.18:8000` · (b) Get `rika.co.ke` | **(b)** for real SEO (the whole SEO strategy depends on a clean domain). For now, everything works on the IP. |
| **D7** | Fabrication partner | Named partner + pricing model (trade vs retail) | Needed before FAB-1 and pricing intelligence. |

---

## 9. Marking Scheme (how we score progress)

Each feature has a **weight** (how much it moves the business). Total = 100 points.
A feature is `✅` only when its **Definition of Done** (DoD) is met. `🟨` = partial credit (50%).

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
| **CALC-1** | Entering type+dims+qty+profile+glass+location returns a KSh *range* in <1s, with no login, and a "Get Exact Quote" CTA. Uses real rates from D4. |
| **SEO-1** | 5 product pages (Windows, Doors, Glass, Shopfronts, Partitions) are indexable, have real content (not lorem), and each has a calculator + quote + WhatsApp CTA. |
| **SAVE-1** | After a visitor uses the calculator *or* designer, a "Save My Design" prompt asks name/WhatsApp/email and stores the lead in the backend (not localStorage). |
| **LEAD-1/3** | Leads and quotes are stored server-side (Frappe doc types), queryable, and survive the visitor closing their browser. |
| **MEAS-2** | A "Book a Free Measurement" form (name/phone/location/project-type/date/time) captures a booking and shows confirmation. |
| **MEAS-4** | Measurement results screen says "Approximate measurement" + "Final dimensions confirmed at site visit" and does **not** present the number as exact. |
| **RECO-1** | A 5–7 question quiz returns a deterministic window recommendation + price, no AI. |
| **APP-2** | A logged-in customer sees "My Project" with the stage tracker (measure→design→approve→fabricate→install→handover) and current stage highlighted. |
| **WASAPP-1** | Every major CTA produces a `wa.me` link pre-populated with the visitor's current design/pricing. |

**Scoring:** sum the weights of `✅` features + 50% of `🟨` ones. Report after every build.
Target: **50 pts (Acquisition Foundation + half of Engagement)** = the platform is a *real*
acquisition machine, not a demo. **100 pts** = full Phase 1.

---

## 10. Recommended Build Order (what I'd actually do, in sequence)

Batched so each batch ends in a *shippable, demo-able* state:

### Batch 0 — Fixes & foundation (1 day)
- [ ] **MEAS-4** — measurement disclaimer (C1)
- [ ] **HOME-2 / HOME-3** — reframe homepage, flagship CTA (C2)
- [ ] **D3/D4/D5** — confirm backend=Frappe, get real pricing rates, get WhatsApp number
- [ ] **LEAD-1/3** — Frappe doc types: `Lead`, `Quotation`, `Project`; wire quote form to them
> *Ship: leads now land in a real DB; homepage leads with "Design Your Windows."*

### Batch 1 — The conversion engine (2–3 days)
- [ ] **CALC-1** — price calculator (per-m² engine, KSh range)
- [ ] **CALC-2** — three-tier packages
- [ ] **SAVE-1** — save-at-intent lead capture
> *Ship: a stranger can estimate their project in 60 seconds and become a stored lead.*

### Batch 2 — Product & SEO spine (2–3 days)
- [ ] **SEO-1** — 5 product catalog pages
- [ ] **SEO-3** — price index page
- [ ] **MEAS-2** — free measurement booking
- [ ] **WASAPP-1** — WhatsApp pre-population
> *Ship: "aluminium windows Ruiru" now lands on real product + price + book-a-measurement.*

### Batch 3 — The "feels like AI" layer (2–3 days)
- [ ] **RECO-1** — recommendation quiz
- [ ] **CMP-1** — compare options
- [ ] **DESIGN-1** — parametric Design Studio (blank-canvas builder, complements the photo visualizer)
- [ ] **DESIGN-2** — "Build My House Windows" guided flow
> *Ship: the full DISCOVER→DESIGN→ESTIMATE→CAPTURE journey, zero AI.*

### Batch 4 — The customer app (3–4 days)
- [ ] **APP-1** — auth (Frappe)
- [ ] **APP-2** — "My Project" stage tracker
- [ ] **APP-3** — My Designs / My Quotations
- [ ] **APP-6** — "My Project" naming
> *Ship: a customer who accepts a quote gets a live view of their project. No more "any update?" calls.*

### Batch 5 — Operations & the flywheel (ongoing)
- [ ] **FAB-1** — fabricator portal · **FAB-2** — customer-protection policy
- [ ] **PRICE-1** — per-project cost/margin tracking
- [ ] **PORTF-1** — case-study pipeline · **SEO-4** — project case studies
- [ ] **REF-1** — referral engine · **DEP-1** — M-Pesa deposits
- [ ] **SEO-2/5/6/7** — local pages, buying guide, cost guides, comparisons
> *Ship: every completed project feeds more photos, reviews, SEO pages, data, and referrals.*

---

## 11. What the Docs Get Wrong or Under-Specify (my critique)

Honest, so we don't build blindly:

1. **None of the three docs mention the photo-based visualizer.** That's *our* best feature. The docs would have us build a generic parametric configurator and a price calculator — both good, but the "see it in *your* photo" tool is the one a competitor can't copy in a week. **Don't let the roadmap bury it.**
2. **The docs over-index on SEO content volume** (local pages, cost guides, comparisons, price index, buying guide). That's a *content-marketing* program, not a software build. It's real work but it's copywriting + publishing, not engineering. Budget for it separately.
3. **"Feels like AI, uses zero AI"** is a great *marketing* line but a weak *engineering* spec. "Deterministic rules engine" is not a buildable feature until we define the actual rules (which window, which glass, which price, for which inputs). That's D4.
4. **The customer app is sketched, not specified.** "My Project, payments, documents, warranty" — but no data model, no permissions, no state machine. Before APP-* work, we need a one-page spec of the project lifecycle states and who can do what.
5. **Pricing is the whole game, and all three docs hand-wave it.** "KSh XXX,XXX" everywhere. There is no actual price list in any doc. **Until D4 is answered, no calculator is buildable.** This is the #1 blocker.
6. **M-Pesa deposits (DEP-1)** are mentioned in the Business doc's responsibilities but never specified. We have M-Pesa experience from other work; this is a well-trodden path, but it needs the merchant setup.

---

## 12. Status Snapshot (today, 2026-10-01)

| Group | Weight | Earned | % |
|-------|--------|--------|---|
| Acquisition Foundation | 30 | 0 | 0% |
| Engagement Depth | 20 | 0 | 0% |
| SEO & Content | 15 | 0 | 0% |
| Customer App | 20 | 0 | 0% |
| Operations | 15 | 0 | 0% |
| **Total** | **100** | **0** | **0%** |

> The *existing* three tools (visualizer, measurement, quotation) are **pre-roadmap** work —
> they're the proof-of-concept that the docs' acquisition engine is built on. They don't score
> under the marking scheme because the scheme measures the *business platform*, not the MVP.
> They are the strongest asset we have and the foundation every batch builds on.

**Next action (updated 2026-10-02):** D4 + D5 resolved. Batch 0 core done: price calculator (CALC-1), three tiers (CALC-2), C1 disclaimer, homepage reframe, WhatsApp pre-fill (WASAPP-1). **Remaining Batch 0:** wire leads to Frappe (LEAD-1 / QUOTE-2 — needs D3 confirmation) and measurement booking flow (MEAS-2).

---

*Update this file after every build. It is the tracker. `RIKA.md` is the code brain. Together they are the project's memory.*

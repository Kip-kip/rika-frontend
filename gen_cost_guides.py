#!/usr/bin/env python3
"""Generate cost-guide landing pages (T-B2-05).

One page per search intent: "how much to window a 3/4/5-bedroom house".
Each: hero -> "the short answer" (3 tier price cards, computed live from
rika-config.js) -> transparent assumptions table -> price drivers -> CTA
(calculator pre-filled with the assumed count + size, quote, WhatsApp) -> FAQ.

Prices are NOT hardcoded in the HTML: a tiny JS module reads
shared/js/rika-config.js at runtime and renders the tier ranges, so the
figures stay single-sourced and auto-update when rates change.
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "costs")

# Assumptions per house size (stated transparently on the page).
# avg window ~1.2 m² (typical 120×100cm). Count reflects a typical KE house.
GUIDES = {
    "3-bed": {
        "n": 3,
        "title": "How Much to Window a 3-Bedroom House in Kenya (2026 Prices)",
        "slug": "3-bedroom-house",
        "windows": 10,
        "avg_w": 120, "avg_h": 100,  # cm
        "rooms": "Living room, kitchen, 3 bedrooms, and the utility/ensuite windows — roughly 10 openings in a typical 3-bed.",
        "intro": "A 3-bedroom house in Kenya usually has about 10 windows. Here's what replacing or upgrading them all really costs in 2026, broken down by tier — with no 'call for price'.",
        "faq": [
            ("How many windows does a 3-bed house have?",
             "Most 3-bedroom houses in Kenya have 9–12 window openings. We use 10 as a planning figure; the free measurement gives you the exact count and sizes."),
            ("Is this price for supply only or supply and install?",
             "These figures are supply. Add our standard installation fee (stated up front at measurement) for a fully fitted price. Delivery within Nairobi is free."),
            ("Can I mix tiers across the house?",
             "Yes — e.g. Premium for the front lounge and Comfort for the bedrooms. The calculator lets you price each window separately."),
            ("What's the difference between the tiers?",
             "Essential = standard clear glass, 1-year warranty. Comfort = light tint, soft-close, 3-year warranty. Premium = dark tint/frosted, double-glazed option, 10-year warranty."),
        ],
    },
    "4-bed": {
        "n": 4,
        "title": "How Much to Window a 4-Bedroom House in Kenya (2026 Prices)",
        "slug": "4-bedroom-house",
        "windows": 12,
        "avg_w": 120, "avg_h": 100,
        "rooms": "Living, dining, kitchen, 4 bedrooms, and the utility — roughly 12 openings in a typical 4-bed.",
        "intro": "A 4-bedroom house in Kenya usually has about 12 windows. Here's what a full window replacement costs in 2026 by tier — transparent, no 'call for price'.",
        "faq": [
            ("How many windows does a 4-bed house have?",
             "Most 4-bedroom houses have 11–14 openings. We use 12 as a planning figure; the free measurement confirms the exact count and sizes."),
            ("Is this supply only or supply and install?",
             "These figures are supply. Add the standard installation fee (stated up front at measurement) for a fully fitted price. Delivery within Nairobi is free."),
            ("Do bigger houses get a discount?",
             "Volume on its own doesn't change the per-m² rate, but a single larger order means one measurement, one delivery and one fit-out visit — which keeps total cost down versus piecemeal orders."),
            ("Can I phase it — do the bedrooms first?",
             "Yes. Price and quote each phase separately; the calculator handles it. Many clients do the main areas first, bedrooms after."),
        ],
    },
    "5-bed": {
        "n": 5,
        "title": "How Much to Window a 5-Bedroom House in Kenya (2026 Prices)",
        "slug": "5-bedroom-house",
        "windows": 15,
        "avg_w": 125, "avg_h": 110,
        "rooms": "Living, dining, kitchen, 5 bedrooms, study and utility — roughly 15 openings in a typical 5-bed.",
        "intro": "A 5-bedroom house in Kenya usually has about 15 windows, often larger than in smaller houses. Here's what a full replacement costs in 2026 by tier — transparent, no 'call for price'.",
        "faq": [
            ("How many windows does a 5-bed house have?",
             "Most 5-bedroom houses have 13–18 openings, and the windows tend to be larger. We use 15 at ~1.4 m² each as a planning figure; the free measurement confirms."),
            ("Is this supply only or supply and install?",
             "These figures are supply. Add the standard installation fee (stated up front at measurement) for a fully fitted price. Delivery within Nairobi is free."),
            ("Should I go Premium on a house this size?",
             "Many 5-bed owners choose Premium for the main living areas (dark tint, double-glazed option, 10-year warranty) and Comfort for the rest — a good balance of comfort and budget."),
            ("How long does a full 5-bed window job take?",
             "Typically 2–3 weeks from measurement to full fit-out, depending on order size and any custom sizes. We schedule the fit-out in phases so you're not without windows."),
        ],
    },
}

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>{title} — Rika</title>
  <meta name="description" content="How much does it cost to window a {n}-bedroom house in Kenya in 2026? Real prices by tier (Essential / Comfort / Premium), what drives the cost, and a free measurement. Rika, Ruiru & Nairobi." />
  <link rel="canonical" href="https://51.44.11.18:8000/rika/costs/{slug}/" />
  <link rel="stylesheet" href="/rika/shared/css/rika.css" />
  <link rel="stylesheet" href="/rika/costs/css/costs.css" />
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{title}",
    "description": "2026 cost guide: what it costs to window a {n}-bedroom house in Kenya, by tier.",
    "author": {{ "@type": "Organization", "name": "Rika" }},
    "publisher": {{ "@type": "Organization", "name": "Rika", "url": "https://51.44.11.18:8000/rika/" }},
    "datePublished": "2026-10-02"
  }}
  </script>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
{faq_schema}
    ]
  }}
  </script>
</head>
<body>
  <nav class="nav">
    <div class="container nav-inner">
      <a href="/rika/" class="nav-logo">RIKA</a>
      <div class="nav-links">
        <a href="/rika/products/windows/" class="nav-link">Windows</a>
        <a href="/rika/products/doors/" class="nav-link">Doors</a>
        <a href="/rika/products/glass/" class="nav-link">Glass</a>
        <a href="/rika/products/shopfronts/" class="nav-link">Shopfronts</a>
        <a href="/rika/products/partitions/" class="nav-link">Partitions</a>
        <a href="/rika/tools/calculator/" class="nav-link">Calculator</a>
        <a href="/rika/locations/nairobi/" class="nav-link">Locations</a>
        <a href="/rika/prices/" class="nav-link">Prices</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="container hero-inner">
      <p class="hero-eyebrow">2026 Cost Guide · {n}-bedroom house</p>
      <h1 class="hero-title">{title}</h1>
      <p class="hero-sub">{intro}</p>
    </div>
  </header>

  <main class="container cg-main">
    <!-- THE SHORT ANSWER -->
    <section class="cg-section">
      <h2 class="cg-h2">The short answer</h2>
      <p class="cg-intro">For {n} bedrooms ({windows} windows at ~{avg_m2} m² each, supply), here's what it costs by tier. Ranges are ±8% and confirmed at the free measurement.</p>
      <div class="cg-tier-row" data-m2="{total_m2}" data-windows="{windows}">
        <div class="cg-tier-card">
          <div class="ct-label">Essential</div>
          <div class="ct-price" data-tier="essential">—</div>
          <div class="ct-note" data-perm2="essential">—</div>
          <ul class="ct-feats">
            <li>Standard clear glass</li>
            <li>Powder-coated frame</li>
            <li>Basic hardware</li>
            <li>1-year workmanship warranty</li>
          </ul>
        </div>
        <div class="cg-tier-card featured">
          <span class="ct-badge">Most popular</span>
          <div class="ct-label">Comfort</div>
          <div class="ct-price" data-tier="comfort">—</div>
          <div class="ct-note" data-perm2="comfort">—</div>
          <ul class="ct-feats">
            <li>Light tinted glass</li>
            <li>Thicker frame profile</li>
            <li>Soft-close hardware</li>
            <li>3-year workmanship warranty</li>
          </ul>
        </div>
        <div class="cg-tier-card">
          <div class="ct-label">Premium</div>
          <div class="ct-price" data-tier="premium">—</div>
          <div class="ct-note" data-perm2="premium">—</div>
          <ul class="ct-feats">
            <li>Dark tint / frosted glass</li>
            <li>Double-glazed option</li>
            <li>Anti-burglar mesh included</li>
            <li>10-year workmanship warranty</li>
          </ul>
        </div>
      </div>
      <noscript><p class="cg-note">Figures are calculated from Rika's live price list. Please enable JavaScript, or <a href="/rika/tools/calculator/">use the calculator</a> for your exact price.</p></noscript>
    </section>

    <!-- ASSUMPTIONS -->
    <section class="cg-section">
      <h2 class="cg-h2">What we assumed</h2>
      <p class="cg-intro">{rooms}</p>
      <table class="cg-table">
        <thead>
          <tr><th>Assumption</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Window openings</td><td>{windows}</td></tr>
          <tr><td>Average window size</td><td>{avg_w} × {avg_h} cm</td></tr>
          <tr><td>Total glazing area</td><td>~{total_m2} m²</td></tr>
          <tr><td>Pricing basis</td><td>Per m², supply (excludes installation fee)</td></tr>
        </tbody>
      </table>
      <p class="cg-intro">Your exact count, sizes and glass choice are confirmed at the <strong>free measurement</strong> — the final price is never higher than the estimate we agree to.</p>
    </section>

    <!-- PRICE DRIVERS -->
    <section class="cg-section">
      <h2 class="cg-h2">What moves the price up or down</h2>
      <div class="cg-drivers">
        <div class="driver"><div class="driver-t">Total m²</div><div class="driver-b">The biggest factor. A 5-bed with large living windows costs more per house than a 3-bed, mostly because of area.</div></div>
        <div class="driver"><div class="driver-t">Tier</div><div class="driver-b">Essential → Comfort → Premium moves the per-m² rate. Glass and warranty move with it.</div></div>
        <div class="driver"><div class="driver-t">Glass upgrade</div><div class="driver-b">Tinted (+KSh 1,500), frosted (+KSh 2,500) or anti-burglar grills (+KSh 6,000) per window.</div></div>
        <div class="driver"><div class="driver-t">Panels</div><div class="driver-b">3–4 panel windows cost a little more than 2 panel for the extra frame and hardware.</div></div>
        <div class="driver"><div class="driver-t">Custom sizes</div><div class="driver-b">Non-standard or very large panes can shift the price; we flag it at measurement, never after.</div></div>
        <div class="driver"><div class="driver-t">Location</div><div class="driver-b">Delivery within Nairobi is free; wider Kiambu corridor may add a small transport fee, stated up front.</div></div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cg-section cg-cta">
      <h2 class="cg-h2">Get your exact price in 30 seconds</h2>
      <p class="cg-intro">We've pre-filled the calculator with a typical {n}-bed ({windows} windows at {avg_w}×{avg_h} cm). Tweak it to your house, or book the free measurement for a firm, written price.</p>
      <div class="cg-cta-btns">
        <a class="btn btn-primary" href="/rika/tools/calculator/?w={avg_w}&h={avg_h}&qty={windows}">🧮 Open the calculator</a>
        <a class="btn btn-ghost" href="/rika/tools/quotation/?location=cost-guide-{slug}&w={avg_w}&h={avg_h}&qty={windows}">🧾 Request a quote</a>
        <a class="btn btn-ghost" href="/rika/tools/measurement/" data-book-measurement="1" data-source="Cost Guide — {n}-bed">📅 Book a free measurement</a>
        <a class="btn btn-success" id="cgWa" href="#" target="_blank" rel="noopener">💬 WhatsApp us</a>
      </div>
    </section>

    <!-- FAQ -->
    <section class="cg-section">
      <h2 class="cg-h2">FAQ — {n}-bed window cost</h2>
      <div class="cg-faq">
{faq_html}
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <span>© 2026 Rika · Aluminium &amp; Glass, Ruiru, Kenya</span>
      <span class="footer-links">
        <a href="/rika/prices/">Prices</a> ·
        <a href="/rika/tools/calculator/">Calculator</a> ·
        <a href="/rika/tools/quotation/">Quote</a>
      </span>
    </div>
  </footer>

  <script type="module" src="/rika/costs/js/cost-guide.js" data-slug="{slug}" data-n="{n}"></script>
</body>
</html>
"""


def faq_schema_html(faqs):
    items = []
    for q, a in faqs:
        items.append(
            '      { "type": "Question", "name": "' + q.replace('"', '\\"') + '", '
            '"acceptedAnswer": { "type": "Answer", "text": "' + a.replace('"', '\\"') + '" } }'
        )
    return ",\n".join(items)


def faq_html(faqs):
    out = []
    for q, a in faqs:
        out.append(f'        <details><summary>{q}</summary><p>{a}</p></details>')
    return "\n".join(out)


def main():
    os.makedirs(os.path.join(OUT, "css"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "js"), exist_ok=True)
    for key, g in GUIDES.items():
        avg_m2 = (g["avg_w"] * g["avg_h"]) / 10000
        total_m2 = round(avg_m2 * g["windows"], 1)
        html = (
            TEMPLATE
            .replace("{title}", g["title"])
            .replace("{slug}", g["slug"])
            .replace("{n}", str(g["n"]))
            .replace("{intro}", g["intro"])
            .replace("{rooms}", g["rooms"])
            .replace("{windows}", str(g["windows"]))
            .replace("{avg_w}", str(g["avg_w"]))
            .replace("{avg_h}", str(g["avg_h"]))
            .replace("{avg_m2}", f"{avg_m2:.1f}")
            .replace("{total_m2}", f"{total_m2:.1f}")
            .replace("{faq_schema}", faq_schema_html(g["faq"]))
            .replace("{faq_html}", faq_html(g["faq"]))
        )
        path = os.path.join(OUT, g["slug"], "index.html")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(html)
        print(f"wrote {path} (m2={total_m2})")


if __name__ == "__main__":
    main()

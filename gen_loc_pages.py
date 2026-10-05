#!/usr/bin/env python3
"""Generate local SEO / Google Ads landing pages for Rika (T-B2-04).

One page per location. Each follows the DoD:
  info → calculator → quote → WhatsApp
designed to convert paid traffic (single clear CTA path, local trust signals,
FAQ + LocalBusiness structured data for local SEO).

Static HTML (vanilla, no build step). Prices are NOT hardcoded here — the
"from KSh" anchors are filled by a tiny inline script that reads rika-config.js
so rates stay single-sourced. Local trust copy is location-specific.
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "locations")

# ---- location data (single source for the generator) -----------------
LOCATIONS = {
    "nairobi": {
        "name": "Nairobi",
        "tag": "Aluminium windows & doors in Nairobi",
        "hero": "Aluminium windows, doors & glass, made and fitted across Nairobi.",
        "sub": "From Kasarani to the CBD — we measure free, fit fast, and stand behind every fit with a written warranty.",
        "area": "Nairobi city, including CBD, Westlands, Kilimani, Lang'ata, Eastleigh, Embakasi, Roysambu and surrounding estates.",
        "trust": [
            ("Free same-day measurement", "A technician comes to your site in Nairobi, measures precisely, and you get a firm price the same day."),
            ("Free delivery within Nairobi", "We deliver anywhere in the city at no extra cost — no hidden transport fee."),
            ("Ruiru-based workshop, Nairobi-fitted", "Our factory is in Ruiru; our fitters work across Nairobi every week, so you get factory prices and local fit."),
            ("Written warranty", "1 to 10 years depending on tier — in writing, not a promise."),
        ],
        "lat": -1.286389, "lng": 36.817223,
    },
    "ruiru": {
        "name": "Ruiru",
        "tag": "Aluminium windows & doors in Ruiru",
        "hero": "Your aluminium windows and doors, made right here in Ruiru.",
        "sub": "Our workshop is in Ruiru — walk in, see the profiles, and get your fit done by the same team that built it.",
        "area": "Ruiru, Ruiru CBD, Ruiru industrial area, and the greater Ruiru / Kiambu corridor.",
        "trust": [
            ("Factory-direct pricing", "No middleman. You buy from the workshop, so you pay workshop prices, not dealer prices."),
            ("See it before you buy", "Walk into the Ruiru workshop and see real profiles, hardware and finished samples."),
            ("Fast local fitting", "We fit across Ruiru and the Kiambu corridor on the same week — short lead times."),
            ("Written warranty", "1 to 10 years depending on tier — in writing, not a promise."),
        ],
        "lat": -1.243100, "lng": 36.915500,
    },
    "kiambu": {
        "name": "Kiambu",
        "tag": "Aluminium windows & doors in Kiambu",
        "hero": "Aluminium windows, doors & glass across the Kiambu corridor.",
        "sub": "Ruiru, Limuru, Karuri, Thika road estates — we measure free, fit fast, and back every fit with a written warranty.",
        "area": "Kiambu county: Ruiru, Karuri, Limuru, Gathunga, Mathare, and estates along the Mombasa/N2 corridor.",
        "trust": [
            ("Ruiru workshop, minutes away", "Our factory sits in Ruiru, so the Kiambu corridor is our home patch — fast response, low transport cost."),
            ("Free measurement across Kiambu", "We cover the whole corridor, free, with a same-week visit."),
            ("Factory-direct pricing", "Buy from the workshop — no dealer markup."),
            ("Written warranty", "1 to 10 years depending on tier — in writing, not a promise."),
        ],
        "lat": -1.320200, "lng": 36.852000,
    },
}

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>{tag} — Rika | Free Measurement</title>
  <meta name="description" content="{hero} Free measurement, factory-direct pricing, written warranty. Windows, doors, glass, shopfronts and partitions in {name}. Get a firm price the same day with Rika." />
  <link rel="canonical" href="https://51.44.11.18:8000/rika/locations/{slug}/" />
  <link rel="stylesheet" href="/rika/shared/css/rika.css" />
  <link rel="stylesheet" href="/rika/locations/css/locations.css" />
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Rika",
    "description": "Aluminium windows, doors, glass, shopfronts and partitions, made and fitted across {name}.",
    "address": {{
      "@type": "PostalAddress",
      "addressLocality": "Ruiru",
      "addressRegion": "Kiambu",
      "addressCountry": "KE"
    }},
    "areaServed": [{area_list}],
    "geo": {{ "@type": "GeoCoordinates", "latitude": {lat}, "longitude": {lng} }},
    "url": "https://51.44.11.18:8000/rika/locations/{slug}/"
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
        <a href="/rika/locations/{slug}/" class="nav-link active">{name}</a>
        <a href="/rika/prices/" class="nav-link">Prices</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="container hero-inner">
      <p class="hero-eyebrow">{name}</p>
      <h1 class="hero-title">{hero}</h1>
      <p class="hero-sub">{sub}</p>
      <div class="hero-ctas">
        <a class="btn btn-primary" href="/rika/tools/measurement/" data-book-measurement="1" data-source="Locations — {name}">📅 Book a Free Measurement</a>
        <a class="btn btn-success" id="heroWa" href="#">💬 WhatsApp us</a>
        <a class="btn btn-ghost" href="/rika/tools/calculator/">🧮 Get a live price</a>
      </div>
    </div>
  </header>

  <main class="container loc-main">
    <!-- INFO -->
    <section class="loc-section">
      <h2 class="loc-h2">Why Rika in {name}?</h2>
      <p class="loc-intro">We serve {area}</p>
      <div class="loc-grid">
        {trust_cards}
      </div>
    </section>

    <!-- PRICES anchor (single-sourced from rika-config.js) -->
    <section class="loc-section">
      <h2 class="loc-h2">What it costs in {name}</h2>
      <p class="loc-intro">Real, published pricing. No "call for price" games.</p>
      <div class="loc-price-row">
        <div class="loc-price-card">
          <div class="lp-name" data-prod="sliding">Sliding Window</div>
          <div class="lp-from" data-from="sliding">from KSh —</div>
          <div class="lp-note">per m², delivered in {name}</div>
          <a class="btn btn-ghost" href="/rika/products/windows/sliding/">See this style</a>
        </div>
        <div class="loc-price-card">
          <div class="lp-name" data-prod="casement">Casement Window</div>
          <div class="lp-from" data-from="casement">from KSh —</div>
          <div class="lp-note">per m², delivered in {name}</div>
          <a class="btn btn-ghost" href="/rika/products/windows/casement/">See this style</a>
        </div>
        <div class="loc-price-card">
          <div class="lp-name" data-prod="fixed">Fixed Pane</div>
          <div class="lp-from" data-from="fixed">from KSh —</div>
          <div class="lp-note">per m², delivered in {name}</div>
          <a class="btn btn-ghost" href="/rika/products/windows/fixed/">See this style</a>
        </div>
      </div>
      <p class="loc-more"><a href="/rika/prices/">See the full price index →</a></p>
    </section>

    <!-- CALCULATOR CTA -->
    <section class="loc-section loc-cta">
      <h2 class="loc-h2">Price it yourself in 30 seconds</h2>
      <p class="loc-intro">Set the style, size and finish — the price updates live. Then lock it in with a free measurement.</p>
      <div class="loc-cta-btns">
        <a class="btn btn-primary" href="/rika/tools/calculator/">🧮 Open the calculator</a>
      </div>
    </section>

    <!-- QUOTE CTA -->
    <section class="loc-section loc-cta">
      <h2 class="loc-h2">Get a firm quote for {name}</h2>
      <p class="loc-intro">Tell us the job. We send back a firm price — not a range — after the free visit.</p>
      <div class="loc-cta-btns">
        <a class="btn btn-primary" href="/rika/tools/quotation/?location={name}">🧾 Request a quote</a>
        <a class="btn btn-ghost" href="/rika/tools/measurement/" data-book-measurement="1" data-source="Locations — {name}">📅 Book a free measurement</a>
      </div>
    </section>

    <!-- FAQ -->
    <section class="loc-section">
      <h2 class="loc-h2">Frequently asked in {name}</h2>
      <div class="loc-faq">
        <details>
          <summary>Do you deliver in {name}?</summary>
          <p>Yes. {area} Delivery within Nairobi is free; across the wider corridor a small transport fee applies and is stated up front.</p>
        </details>
        <details>
          <summary>Is the measurement really free?</summary>
          <p>Yes — free, no obligation. A technician measures on site and you get a firm price the same day.</p>
        </details>
        <details>
          <summary>What's your warranty?</summary>
          <p>A written workmanship warranty from 1 to 10 years depending on the tier you pick. It's in writing, not a verbal promise.</p>
        </details>
        <details>
          <summary>How fast can you fit?</summary>
          <p>Most {name} orders are measured, made and fitted within the same week to two weeks, depending on size.</p>
        </details>
      </div>
    </section>

    <!-- WHATSAPP CTA (final conversion) -->
    <section class="loc-section loc-final">
      <h2 class="loc-h2">Ready to start?</h2>
      <p class="loc-intro">Message us your project on WhatsApp and we'll reply with next steps and the free measurement slot.</p>
      <a class="btn btn-success" id="finalWa" href="#" target="_blank" rel="noopener">💬 WhatsApp Rika — {name}</a>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <span>© {year} Rika · Aluminium &amp; Glass, Ruiru, Kenya</span>
      <span class="footer-links">
        <a href="/rika/prices/">Prices</a> ·
        <a href="/rika/tools/calculator/">Calculator</a> ·
        <a href="/rika/tools/quotation/">Quote</a>
      </span>
    </div>
  </footer>

  <script type="module" src="/rika/locations/js/location.js" data-loc="{name}"></script>
</body>
</html>
"""


def trust_cards_html(items):
    out = []
    for title, body in items:
        out.append(
            '      <div class="trust-card">\n'
            f'        <div class="trust-title">{title}</div>\n'
            f'        <div class="trust-body">{body}</div>\n'
            "      </div>"
        )
    return "\n".join(out)


def main():
    os.makedirs(os.path.join(OUT, "css"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "js"), exist_ok=True)
    year = 2026
    for slug, loc in LOCATIONS.items():
        area_list = loc["area"].replace("Nairobi city, including", "Nairobi")
        html = (
            TEMPLATE
            .replace("{tag}", loc["tag"])
            .replace("{name}", loc["name"])
            .replace("{slug}", slug)
            .replace("{hero}", loc["hero"])
            .replace("{sub}", loc["sub"])
            .replace("{area_list}", area_list.replace('"', "&quot;"))
            .replace("{area}", loc["area"])
            .replace("{lat}", str(loc["lat"]))
            .replace("{lng}", str(loc["lng"]))
            .replace("{trust_cards}", trust_cards_html(loc["trust"]))
            .replace("{year}", str(year))
        )
        path = os.path.join(OUT, slug, "index.html")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(html)
        print(f"wrote {path}")


if __name__ == "__main__":
    main()

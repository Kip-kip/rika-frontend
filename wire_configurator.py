#!/usr/bin/env python3
"""Inject the live configurator (T-B2-03) into all 16 style pages.
Adds: configurator.css link, a confRoot section (with cat/slug/label),
and the configurator.js module before the booking script."""
import os, re, glob

BASE = os.path.dirname(os.path.abspath(__file__))  # .../frontend

# labels per style (from the title / card)
LABELS = {
    ("windows","sliding"):"Sliding Window", ("windows","casement"):"Casement Window",
    ("windows","fixed"):"Fixed Pane", ("windows","bay"):"Bay / Combination",
    ("doors","sliding"):"Sliding Door", ("doors","hinged"):"Hinged / Casement Door",
    ("doors","fixed"):"Fixed + Door",
    ("glass","clear"):"Clear Glass", ("glass","tinted"):"Tinted Glass", ("glass","frosted"):"Frosted Glass",
    ("shopfronts","fixed"):"Fixed Display Panels", ("shopfronts","sliding"):"Sliding Shopfront Doors",
    ("shopfronts","hinged"):"Security Doors",
    ("partitions","fixed"):"Fixed Glass Panels", ("partitions","sliding"):"Sliding Partitions",
    ("partitions","hinged"):"Hinged Partition Panels",
}

CSS_LINK = '<link rel="stylesheet" href="/rika/products/css/configurator.css" />'
CONF_SECTION = '''      <!-- Live configurator (T-B2-03) -->
      <section class="card prod-section">
        <div class="card-title">Configure &amp; price this style</div>
        <p class="card-desc" style="margin-bottom:16px">Pick your finish, glass, panels and size — the estimate updates as you go. The firm figure is confirmed at a free site measurement.</p>
        <div id="confRoot" data-cat="{cat}" data-slug="{slug}" data-label="{label}"></div>
      </section>

      <section class="card prod-section price-band">'''
CONF_SCRIPT = '  <script type="module" src="/rika/products/js/configurator.js"></script>\n'

count = 0
for path in sorted(glob.glob(os.path.join(BASE, "products", "*", "*", "index.html"))):
    rel = os.path.relpath(path, os.path.join(BASE, "products"))
    parts = rel.replace(os.sep, "/").split("/")
    if len(parts) != 3 or parts[2] != "index.html":
        continue
    cat, slug = parts[0], parts[1]
    with open(path) as f:
        html = f.read()

    if 'id="confRoot"' in html:
        print(f"  skip (already wired): {cat}/{slug}")
        continue

    # 1) css link after style-detail.css
    html = html.replace(
        '<link rel="stylesheet" href="/rika/products/css/style-detail.css" />',
        '<link rel="stylesheet" href="/rika/products/css/style-detail.css" />\n' + CSS_LINK,
        1,
    )
    # 2) inject conf section right before the existing price-band section
    html = html.replace(
        '<section class="card prod-section price-band">',
        CONF_SECTION.format(cat=cat, slug=slug, label=LABELS.get((cat,slug), cat)),
        1,
    )
    # 3) add configurator module before the booking script
    html = html.replace(
        '  <script type="module" src="/rika/shared/js/booking.js"></script>',
        CONF_SCRIPT + '  <script type="module" src="/rika/shared/js/booking.js"></script>',
        1,
    )
    with open(path, "w") as f:
        f.write(html)
    count += 1
    print(f"  wired: {cat}/{slug}")

print(f"\nWired {count} style pages.")

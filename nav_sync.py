#!/usr/bin/env python3
"""
Rika site header — SINGLE SOURCE OF TRUTH.

`render_header(active)` returns the canonical <header>...</header> block.
Every public Rika page must contain this exact block (with `active` pointing
at its own top-level section). The `--sync` pass regenerates every page's
header in place; the `--check` pass (run by the pre-commit hook) fails if any
page's header has drifted from the canonical form.

To change the nav: edit the LINKS/DROPDOWNS below, then run
  python3 nav_sync.py --sync
and push the changed pages. Do NOT hand-edit headers in individual pages.
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

# ---- the nav, defined ONCE -------------------------------------------------
DROPDOWNS = {
    "Products": [
        ("/rika/products/windows/", "Windows"),
        ("/rika/products/doors/", "Doors"),
        ("/rika/products/glass/", "Glass"),
        ("/rika/products/shopfronts/", "Shopfronts"),
        ("/rika/products/partitions/", "Partitions"),
    ],
    "Tools": [
        ("/rika/tools/calculator/", "Calculator"),
        ("/rika/tools/design/", "Design Studio"),
        ("/rika/tools/quiz/", "Find Your Window"),
        ("/rika/tools/house-windows/", "Your House, Your Windows"),
        ("/rika/tools/house-map/", "House Window Map"),
        ("/rika/tools/visualizer/", "Visualizer"),
        ("/rika/tools/build/", "Build My House Windows"),
        ("/rika/tools/measurement/", "Book a Measurement"),
        ("/rika/tools/quotation/", "Request a Quotation"),
    ],
    "Guides": [
        ("/rika/guide/", "Buying Guide"),
        ("/rika/costs/3-bedroom-house/", "Cost Guides"),
        ("/rika/compare/", "Compare: Aluminium vs UPVC"),
    ],
}

# (href, label, top-level-key-for-active) — order matters
LINKS = [
    ("/rika/", "Home", "home"),
    ("__DROPDOWN:Products__", None, None),
    ("__DROPDOWN:Tools__", None, None),
    ("/rika/locations/nairobi/", "Locations", "locations"),
    ("/rika/prices/", "Prices", "prices"),
    ("__DROPDOWN:Guides__", None, None),
    ("/rika/reviews/", "Reviews", "reviews"),
    ("/rika/case-studies/", "Case Studies", "case-studies"),
]


def _dropdown(label):
    items = []
    for href, text in DROPDOWNS[label]:
        items.append(f'          <a href="{href}" class="nav-drop-item">{text}</a>')
    return (
        '      <div class="nav-drop">\n'
        f'        <a class="nav-drop-toggle" data-section="{label.lower()}">{label} <span class="caret">&#9662;</span></a>\n'
        '        <div class="nav-drop-menu">\n'
        + "\n".join(items) + "\n"
        "        </div>\n"
        "      </div>"
    )


def render_header(active):
    """Canonical header. `active` is one of: home|locations|costs|guide|prices|reviews|case-studies|<dropdown key>"""
    parts = []
    parts.append('<header class="header">')
    parts.append('    <a class="logo" href="/rika/">Ri<span>ka</span></a>')
    parts.append('    <nav class="nav">')
    for href, label, key in LINKS:
        if href.startswith("__DROPDOWN:"):
            dlabel = href.split(":", 1)[1].rstrip("_")
            block = _dropdown(dlabel)
            if key == dlabel.lower():
                block = block.replace('<a class="nav-drop-toggle"', '<a class="nav-drop-toggle active"', 1)
            parts.append(block)
        else:
            cls = "nav-link" + (" active" if key == active else "")
            parts.append(f'      <a href="{href}" class="{cls}">{label}</a>')
    parts.append("    </nav>")
    parts.append("  </header>")
    return "\n".join(parts)


def detect_active(path):
    """Return the top-level active key for a page's canonical header."""
    rel = path.lower()
    # product / tool sub-pages light up their dropdown toggle
    if re.search(r"/products/", rel):
        return "products"
    if re.search(r"/tools/", rel):
        return "tools"
    # canonical top-level keys, most specific first
    if rel.endswith("/reviews/index.html"):
        return "reviews"
    if rel.endswith("/case-studies/index.html"):
        return "case-studies"
    if rel.endswith("/prices/index.html"):
        return "prices"
    if rel.endswith("/compare/index.html"):
        return "guides"
    if re.search(r"/locations/", rel):
        return "locations"
    if re.search(r"/costs/", rel):
        return "guides"
    if re.search(r"/guide/", rel):
        return "guides"
    if rel == os.path.join(ROOT, "index.html"):
        return "home"
    # sub-pages without a top-level item (product/tool/category) — nothing active
    return ""


# ---- public page set --------------------------------------------------------
def public_pages():
    out = []
    for f in glob.glob(os.path.join(ROOT, "**", "index.html"), recursive=True):
        if ".git" in f:
            continue
        if re.search(r"/(app|admin|fabricator|analytics)/", f):
            continue  # app/admin/fabricator have their own shells
        out.append(f)
    return sorted(out)


def extract_header(html):
    m = re.search(r'<header class="header">.*?</header>', html, re.S)
    return m.group(0) if m else None


def sync():
    changed = []
    for f in public_pages():
        html = open(f).read()
        old = extract_header(html)
        new = render_header(detect_active(f))
        if old is None:
            # no header at all -> insert right after <body>
            html = re.sub(r"(<body[^>]*>)", r"\1\n" + new.replace("\\", "\\\\"), html, count=1)
            open(f, "w").write(html)
            changed.append(("INSERT", os.path.relpath(f, ROOT)))
        elif old != new:
            html = html.replace(old, new, 1)
            open(f, "w").write(html)
            changed.append(("REPLACE", os.path.relpath(f, ROOT)))
    print(f"sync: {len(changed)} pages updated")
    for kind, p in changed:
        print(f"  {kind:7s} {p}")


def check():
    bad = []
    for f in public_pages():
        html = open(f).read()
        got = extract_header(html)
        want = render_header(detect_active(f))
        if got is None:
            bad.append(f"NO HEADER: {os.path.relpath(f, ROOT)}")
        elif got != want:
            bad.append(f"DRIFTED:   {os.path.relpath(f, ROOT)}")
    if bad:
        print("Header drift detected. Run `python3 nav_sync.py --sync`:\n")
        print("\n".join(bad))
        return 1
    print("Header OK on all public pages.")
    return 0


if __name__ == "__main__":
    if "--sync" in sys.argv:
        sync()
    elif "--check" in sys.argv:
        sys.exit(check())
    else:
        print(__doc__)

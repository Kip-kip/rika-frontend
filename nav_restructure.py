#!/usr/bin/env python3
"""Idempotent nav restructure: flat product/tool links -> Products/Tools dropdowns,
plus Reviews + Case Studies top-level. Tolerant of the per-page nav markup drift.

Usage: python3 nav_restructure.py [path-to-nav.py]   (runs over every index.html)
"""
import glob, os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

# links that get absorbed into dropdowns (match by href, any class/attr drift)
PRODUCT_HREFS = {
    "/rika/products/windows/",
    "/rika/products/doors/",
    "/rika/products/glass/",
    "/rika/products/shopfronts/",
    "/rika/products/partitions/",
}
TOOL_HREFS = {
    "/rika/tools/calculator/",
    "/rika/tools/design/",
    "/rika/tools/quiz/",
    "/rika/tools/house-windows/",
    "/rika/tools/house-map/",
    "/rika/tools/visualizer/",
    "/rika/tools/measurement/",
    "/rika/tools/quotation/",
    "/rika/tools/measure/",
}
ADD_IF_MISSING = [
    ('/rika/reviews/', 'Reviews'),
    ('/rika/case-studies/', 'Case Studies'),
]

DROPDOWN = """
      <div class="nav-drop">
        <a class="nav-drop-toggle {active}">{label} <span class="caret">&#9662;</span></a>
        <div class="nav-drop-menu">
{items}
        </div>
      </div>
"""


def active_for(href):
    """Return class string for a link based on the page's own active markers."""
    return ""  # per-page active is preserved on the remaining flat links


def link(href, label, extra_class=""):
    cls = "nav-drop-item" + (f" {extra_class}" if extra_class else "")
    return f'        <a href="{href}" class="{cls}">{label}</a>'


def build_dropdown(label, pairs, page):
    """pairs: list of (href, label, is_active_on_this_page)."""
    items = []
    for href, text, act in pairs:
        cls = "nav-drop-item" + (" active" if act else "")
        items.append(f'        <a href="{href}" class="{cls}">{text}</a>')
    return (
        '      <div class="nav-drop">\n'
        f'        <a class="nav-drop-toggle{" active" if any(a for _, _, a in pairs) else ""}">{label} <span class="caret">&#9662;</span></a>\n'
        '        <div class="nav-drop-menu">\n'
        + "\n".join(items) + "\n"
        '        </div>\n'
        '      </div>\n'
    )


A_TAG = re.compile(r'<a\b[^>]*>.*?</a>', re.S)


def href_of(tag):
    m = re.search(r'href="([^"]+)"', tag)
    return m.group(1) if m else None


def label_of(tag):
    m = re.search(r'>([^<]+)</a>$', tag)
    return m.group(1).strip() if m else ""


def is_active(tag):
    return "active" in (re.search(r'class="([^"]*)"', tag).group(1) if re.search(r'class="([^"]*)"', tag) else "")


def process(path):
    with open(path) as f:
        html = f.read()

    m = re.search(r'(<nav[^>]*>)(.*?)(</nav>)', html, re.S)
    if not m:
        return "no-nav"
    open_tag, inner, close_tag = m.group(1), m.group(2), m.group(3)

    if "nav-drop" in inner:
        return "already-done"

    # split inner into segments: link tags (with their surrounding whitespace) kept in order
    tokens = []  # ('a', tag) or ('ws', text)
    pos = 0
    for am in A_TAG.finditer(inner):
        if am.start() > pos:
            tokens.append(("ws", inner[pos:am.start()]))
        tokens.append(("a", am.group(0)))
        pos = am.end()
    if pos < len(inner):
        tokens.append(("ws", inner[pos:]))

    products, tools = [], []
    kept = []  # rebuilt token list
    for kind, val in tokens:
        if kind == "a":
            href = href_of(val)
            if href in PRODUCT_HREFS:
                products.append((href, label_of(val), is_active(val)))
                continue  # absorbed
            if href in TOOL_HREFS:
                tools.append((href, label_of(val), is_active(val)))
                continue  # absorbed
        kept.append((kind, val))

    if not products and not tools:
        return "no-match"

    new_inner = ""
    inserted = False
    for i, (kind, val) in enumerate(kept):
        if not inserted:
            if kind == "a" and href_of(val) not in (None,):
                # insert dropdowns right after the first surviving link (Home/RIKA logo)
                new_inner += val + "\n"
                if products:
                    new_inner += build_dropdown("Products", products, None)
                if tools:
                    new_inner += build_dropdown("Tools", tools, None)
                inserted = True
                continue
            # before first link: just keep whitespace
            new_inner += val
            continue
        new_inner += val + ("\n" if kind == "a" else "")

    # add Reviews / Case Studies if missing (append before nav close, after last link)
    existing_hrefs = [href_of(v) for k, v in kept if k == "a"]
    add_html = ""
    for href, label in ADD_IF_MISSING:
        if href not in existing_hrefs and href not in inner:
            add_html += f'      <a href="{href}" class="nav-link">{label}</a>\n'
    if add_html:
        new_inner = new_inner.rstrip("\n") + "\n" + add_html

    new_html = html[: m.start()] + open_tag + "\n" + new_inner + "    " + close_tag + html[m.end():]
    with open(path, "w") as f:
        f.write(new_html)
    return f"ok(products={len(products)},tools={len(tools)},added={add_html.count('<a')})"


def main():
    files = glob.glob(os.path.join(ROOT, "**", "index.html"), recursive=True)
    files = [f for f in files if ".git" not in f and "/app/" not in f and "/admin/" not in f and "/fabricator/" not in f]
    summary = {}
    for f in sorted(files):
        try:
            r = process(f)
        except Exception as e:
            r = f"error: {e}"
        summary[r] = summary.get(r, 0) + 1
        if r not in ("already-done", "no-nav"):
            print(f"{os.path.relpath(f, ROOT)}: {r}")
    print("\n--- summary ---")
    for k, v in sorted(summary.items()):
        print(f"{v:3d}  {k}")


if __name__ == "__main__":
    main()

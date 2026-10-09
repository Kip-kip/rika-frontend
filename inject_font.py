#!/usr/bin/env python3
"""Inject the Inter font link into every Rika page head (idempotent).
Inserts <link rel="stylesheet" href="/rika/fonts/inter.css" /> right before
the first rika.css link. Safe to re-run."""
import glob, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))
LINK = '<link rel="stylesheet" href="/rika/fonts/inter.css" />'

for f in glob.glob(os.path.join(ROOT, "**", "index.html"), recursive=True):
    if ".git" in f:
        continue
    html = open(f).read()
    if "/rika/fonts/inter.css" in html:
        continue
    # anchor: the first rika.css stylesheet link
    m = re.search(r'<link[^>]*shared/css/rika\.css[^>]*/>', html)
    if not m:
        print("NO-RIKA-CSS:", os.path.relpath(f, ROOT))
        continue
    html = html[:m.start()] + LINK + "\n" + html[m.start():]
    open(f, "w").write(html)
    print("ok:", os.path.relpath(f, ROOT))

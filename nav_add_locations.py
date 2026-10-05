#!/usr/bin/env python3
"""Add a 'Locations' nav link to every Rika page that has the standard nav.
Inserts it right after the 'Prices' nav link (or before Calculator if absent).
Idempotent: skips pages that already have a locations link."""
import os, re, glob

BASE = os.path.dirname(os.path.abspath(__file__))
NAV = '<a href="/rika/locations/nairobi/" class="nav-link">Locations</a>'

changed, skipped = [], 0
for path in glob.glob(os.path.join(BASE, '**', 'index.html'), recursive=True):
    rel = os.path.relpath(path, BASE)
    if 'node_modules' in rel:
        continue
    with open(path) as f:
        html = f.read()
    if '/rika/locations/' in html and 'class="nav-link">Locations' in html:
        skipped += 1
        continue
    if 'class="nav-link active">Prices</a>' in html:
        anchor = '<a href="/rika/prices/" class="nav-link active">Prices</a>'
        # insert Locations before Prices (keeps right-side grouping)
        html = html.replace(anchor, NAV + '\n        ' + anchor, 1)
    elif '<a href="/rika/prices/" class="nav-link">Prices</a>' in html:
        anchor = '<a href="/rika/prices/" class="nav-link">Prices</a>'
        html = html.replace(anchor, NAV + '\n        ' + anchor, 1)
    else:
        # no Prices link; append after Calculator
        m = re.search(r'(<a href="/rika/tools/calculator/" class="nav-link[^"]*">[^<]*</a>)', html)
        if m:
            html = html.replace(m.group(1), m.group(1) + '\n        ' + NAV, 1)
        else:
            skipped += 1
            continue
    with open(path, 'w') as f:
        f.write(html)
    changed.append(rel)

print(f"nav updated: {len(changed)}")
for c in changed:
    print("  " + c)
print(f"already had it / no nav: {skipped}")

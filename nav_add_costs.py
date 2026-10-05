#!/usr/bin/env python3
"""Add a 'Cost Guides' nav link to every Rika page that has the standard nav.
Inserts it right before the 'Prices' nav link. Idempotent."""
import os, re, glob

BASE = os.path.dirname(os.path.abspath(__file__))
NAV = '<a href="/rika/costs/3-bedroom-house/" class="nav-link">Cost Guides</a>'

changed, skipped = [], 0
for path in glob.glob(os.path.join(BASE, '**', 'index.html'), recursive=True):
    rel = os.path.relpath(path, BASE)
    if 'node_modules' in rel:
        continue
    with open(path) as f:
        html = f.read()
    if 'costs/3-bedroom-house' in html and 'Cost Guides' in html:
        skipped += 1
        continue
    anchor = '<a href="/rika/prices/" class="nav-link">Prices</a>'
    anchor_active = '<a href="/rika/prices/" class="nav-link active">Prices</a>'
    if anchor in html:
        html = html.replace(anchor, NAV + '\n        ' + anchor, 1)
    elif anchor_active in html:
        html = html.replace(anchor_active, NAV + '\n        ' + anchor_active, 1)
    else:
        m = re.search(r'(<a href="/rika/locations/nairobi/" class="nav-link[^"]*">[^<]*</a>)', html)
        if m:
            html = html.replace(m.group(1), m.group(1) + '\n        ' + NAV, 1)
        else:
            skipped += 1
            continue
    with open(path, 'w') as f:
        f.write(html)
    changed.append(rel)

print(f"cost-guides nav added: {len(changed)}")
for c in changed:
    print("  " + c)
print(f"already had it / no nav: {skipped}")

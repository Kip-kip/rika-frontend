#!/usr/bin/env python3
"""Push specific changed files to Kip-kip/rika-frontend main via the GitHub
Git API (blob -> tree -> commit -> ref). The single durable push helper for
Rika frontend work.

Usage:
    python3 push_changed.py <commit-message> [file1 file2 ...]

- Token is read from ~/.git-credentials (line 1, https://USER:TOKEN@github.com).
- Paths are relative to the repo root (~/Rika/frontend).
- Files not in the list are left untouched in the tree (incremental, not a
  full re-upload).
- If a listed file is missing locally, it is skipped with a warning.
- Exit 0 on success, non-zero on any failure (safe to gate on).
"""
import base64, json, os, sys, urllib.request, urllib.error

API = "https://api.github.com"
REPO = "Kip-kip/rika-frontend"
REPO_DIR = os.path.expanduser("~/Rika/frontend")
CRED = os.path.expanduser("~/.git-credentials")


def load_token():
    with open(CRED) as f:
        line = f.read().strip().splitlines()[0]
    cred = line.split("@")[0].replace("https://", "")
    return cred.split(":", 1)[1]


def req(method, path, token, payload=None):
    r = urllib.request.Request(
        API + path,
        data=json.dumps(payload).encode() if payload is not None else None,
        method=method,
    )
    r.add_header("Authorization", "Bearer " + token)
    r.add_header("Accept", "application/vnd.github+json")
    r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        b = e.read().decode()
        return e.code, json.loads(b) if b else {}


def main():
    if len(sys.argv) < 3:
        print("usage: push_changed.py <msg> [file...]", file=sys.stderr)
        return 2
    msg = sys.argv[1]
    paths = sys.argv[2:]
    token = load_token()

    blob_map = {}
    for rel in paths:
        full = os.path.join(REPO_DIR, rel)
        if not os.path.exists(full):
            print("WARN: missing %s (skipped)" % rel, file=sys.stderr)
            continue
        with open(full, "rb") as f:
            blob_payload = {
                "content": "base64",
                "encoding": "base64",
                "data": base64.b64encode(f.read()).decode(),
            }
            code, d = req("POST", "/repos/%s/git/blobs" % REPO, token, blob_payload)
        if code not in (200, 201):
            print("FAIL: blob %r" % d, file=sys.stderr)
            return 1
        blob_map[rel] = d["sha"]
        print("blob", rel)

    if not blob_map:
        print("nothing to push", file=sys.stderr)
        return 1

    code, d = req("GET", "/repos/%s/git/trees/main?recursive=1" % REPO, token)
    if code != 200:
        print("FAIL: tree fetch %r" % d, file=sys.stderr)
        return 1
    entries = [
        {"path": t["path"], "mode": t["mode"], "type": "blob", "sha": t["sha"]}
        for t in d.get("tree", []) if t["type"] == "blob"
    ]
    for rel, sha in blob_map.items():
        entries = [e for e in entries if e["path"] != rel]
        entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": sha})

    code, d = req("POST", "/repos/%s/git/trees" % REPO, token, {"tree": entries})
    if code not in (200, 201):
        print("FAIL: tree build %r" % d, file=sys.stderr)
        return 1
    tree_sha = d["sha"]

    code, d = req("GET", "/repos/%s/commits?per_page=1" % REPO, token)
    parents = [d[0]["sha"]] if isinstance(d, list) and d else []
    code, d = req(
        "POST", "/repos/%s/git/commits" % REPO, token,
        {"message": msg, "tree": tree_sha, "parents": parents})
    if code not in (200, 201):
        print("FAIL: commit %r" % d, file=sys.stderr)
        return 1
    csha = d["sha"]

    code, d = req("PATCH", "/repos/%s/git/refs/heads/main" % REPO, token, {"sha": csha})
    if code not in (200, 201):
        print("FAIL: ref update %r" % d, file=sys.stderr)
        return 1
    print("committed %s -> main" % csha[:10])
    return 0


if __name__ == "__main__":
    sys.exit(main())

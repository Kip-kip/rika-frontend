#!/usr/bin/env python3
"""Push local rika-frontend + rika-backend files to GitHub via the
Git Trees + Git Commits API in a single commit per repo.

Fixes the empty-file / 422 problem from the naive Contents-API loop,
because we fetch the current sha of each existing path first, then
build one tree + one commit per repo.
"""
import base64, json, os, sys, urllib.request, urllib.error

TOKEN = sys.argv[1]
API = "https://api.github.com"

def req(method, path, payload=None):
    url = API + path
    data = json.dumps(payload).encode() if payload is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Authorization", "token " + TOKEN)
    r.add_header("Accept", "application/vnd.github+json")
    r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return e.code, json.loads(body) if body else {}

def repo_root(repo_name):
    code, d = req("GET", "/repos/" + repo_name)
    return d.get("default_branch", "main"), d.get("id")

def current_tree_files(repo):
    """Map path -> sha for every file in HEAD of the repo."""
    code, d = req("GET", "/repos/" + repo + "/git/trees/main?recursive=1")
    out = {}
    for t in d.get("tree", []):
        if t["type"] == "blob":
            out[t["path"]] = t["sha"]
    return out

def create_blob(repo, content_bytes):
    code, d = req("POST", "/repos/" + repo + "/git/blobs",
                  {"content": "base64", "encoding": "base64",
                   "content": base64.b64encode(content_bytes).decode()})
    if code not in (200, 201):
        raise RuntimeError("blob create failed %s: %r" % (code, d))
    return d["sha"]

def build_tree(repo, entries):
    """entries: list of (type, path, sha, mode)."""
    code, d = req("POST", "/repos/" + repo + "/git/trees", {"tree": entries})
    if code not in (200, 201):
        raise RuntimeError("tree build failed %s: %r" % (code, d))
    return d["sha"]

def commit(repo, message, tree_sha, parents=None):
    code, d = req("POST", "/repos/" + repo + "/git/commits",
                  {"message": message, "tree": tree_sha,
                   "parents": parents or []})
    if code not in (200, 201):
        raise RuntimeError("commit failed %s: %r" % (code, d))
    return d["sha"]

def update_ref(repo, sha):
    code, d = req("PATCH", "/repos/" + repo + "/git/refs/heads/main",
                  {"sha": sha})
    if code not in (200, 201):
        raise RuntimeError("ref update failed %s: %r" % (code, d))

def sync_repo(repo, local_dir):
    files = []
    for root, _, names in os.walk(local_dir):
        for n in sorted(names):
            full = os.path.join(root, n)
            rel = os.path.relpath(full, local_dir)
            if rel.startswith(".git"):
                continue
            files.append((rel, full))
    print("[%s] %d files to upload" % (repo, len(files)))

    # 1) create blobs for every file
    blob_map = {}
    for rel, full in files:
        with open(full, "rb") as f:
            content = f.read()
        sha = create_blob(repo, content)
        blob_map[rel] = sha
        print("  blob %s" % rel)

    # 2) build the tree — files only; GitHub auto-creates directories
    tree_entries = []
    for rel, _ in files:
        tree_entries.append({"path": rel, "mode": "100644", "type": "blob", "sha": blob_map[rel]})

    # 3) get current HEAD to chain parents
    code, d = req("GET", "/repos/" + repo + "/commits?per_page=1")
    parents = [d[0]["sha"]] if d and isinstance(d, list) and d else []

    tree_sha = build_tree(repo, tree_entries)
    print("  tree: %s" % tree_sha[:8])
    csha = commit(repo, "Full scaffold via API (fix empty-file bug)", tree_sha, parents)
    update_ref(repo, csha)
    print("[%s] committed %s -> main" % (repo, csha[:8]))

if __name__ == "__main__":
    token = sys.argv[1]
    sync_repo("Kip-kip/rika-frontend", "/home/ubuntu/house-demo/rika")
    # rika-backend: upload local scaffold files
    sync_repo("Kip-kip/rika-backend", "/home/ubuntu/rika-backend")

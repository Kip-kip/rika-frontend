#!/usr/bin/env python3
"""Integrity check for ~/Rika/frontend — catches 4-byte stub corruption.
Runs every 15 min via cron. On hit: auto-restore from last good git blob + log.
Exit 0 = clean, 1 = corruption found (and restored)."""
import os, subprocess, sys, time

REPO = os.path.expanduser("~/Rika/frontend")
LOG = os.path.join(REPO, ".integrity.log")
STUB_SIG = bytes([0x6d, 0xab, 0x1e, 0xeb])  # the known 4-byte stub blob
MIN_SIZE = 500  # bytes; .html files below this are suspect

def log(msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}\n"
    try:
        with open(LOG, "a") as f:
            f.write(line)
    except OSError:
        pass
    sys.stderr.write(line)

def is_git_ignored(path):
    r = subprocess.run(
        ["git", "-C", REPO, "check-ignore", "-q", path],
        capture_output=True
    )
    return r.returncode == 0

def find_stub_files():
    """Return list of (relpath, size, reason) for suspect files."""
    suspects = []
    for root, dirs, files in os.walk(REPO):
        # skip .git
        if ".git" in dirs:
            dirs.remove(".git")
        for name in files:
            full = os.path.join(root, name)
            rel = os.path.relpath(full, REPO)
            if is_git_ignored(rel):
                continue
            try:
                sz = os.path.getsize(full)
            except OSError:
                continue
            # check 1: tiny file
            if sz < MIN_SIZE:
                # is it a stub signature?
                try:
                    with open(full, "rb") as f:
                        head = f.read(4)
                    if head == STUB_SIG:
                        suspects.append((rel, sz, "4-byte stub (known signature)"))
                        continue
                except OSError:
                    pass
                # small file but not the known stub — still flag if .html/.css/.js
                ext = os.path.splitext(name)[1].lower()
                if ext in (".html", ".css", ".js", ".py"):
                    suspects.append((rel, sz, f"tiny file ({sz}B, expected >= {MIN_SIZE}B)"))
            # check 2: known stub signature at any size
            elif sz == 4:
                try:
                    with open(full, "rb") as f:
                        if f.read(4) == STUB_SIG:
                            suspects.append((rel, sz, "4-byte stub (known signature)"))
                except OSError:
                    pass
    return suspects

def restore_from_git(rel):
    """Try to restore a stubbed file from the last commit that had real content."""
    r = subprocess.run(
        ["git", "-C", REPO, "log", "--all", "--format=%h", "--", rel],
        capture_output=True, text=True
    )
    if r.returncode != 0 or not r.stdout.strip():
        return False, "no git history for path"
    commits = r.stdout.strip().splitlines()
    for c in commits:
        r2 = subprocess.run(
            ["git", "-C", REPO, "show", f"{c}:{rel}", "--", "2>/dev/null"],
            capture_output=True
        )
        content = r2.stdout
        if len(content) >= MIN_SIZE and content[:4] != STUB_SIG:
            try:
                with open(os.path.join(REPO, rel), "wb") as f:
                    f.write(content)
                return True, f"restored from commit {c} ({len(content)} bytes)"
            except OSError as e:
                return False, f"write failed: {e}"
    return False, "no clean version found in git history"

def main():
    suspects = find_stub_files()
    if not suspects:
        return 0
    restored, failed = [], []
    for rel, sz, reason in suspects:
        ok, msg = restore_from_git(rel)
        if ok:
            restored.append((rel, reason, msg))
        else:
            failed.append((rel, reason, msg))
    # log everything
    log(f"CORRUPTION DETECTED: {len(suspects)} file(s)")
    for rel, reason, msg in restored:
        log(f"  RESTORED {rel} ({reason}) -> {msg}")
    for rel, reason, msg in failed:
        log(f"  FAILED   {rel} ({reason}) -> {msg}")
    # exit 1 if anything was found (so cron/alerting can catch it)
    return 1 if suspects else 0

if __name__ == "__main__":
    sys.exit(main())

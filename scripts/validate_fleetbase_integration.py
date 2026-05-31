#!/usr/bin/env python
import re
from pathlib import Path

ROOT = Path("afruheritage-platform")
PATTERNS = [
    r"fleetbase\.io",
    r"https?://.*fleetbase",
    r"FLEETBASE_API_KEY",
    r"FLEETBASE_",
]

def scan():
    hits = []
    for path in ROOT.rglob("*.py"):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pat in PATTERNS:
            for m in re.finditer(pat, text):
                hits.append((path, pat, m.group(0)))
    return hits

if __name__ == "__main__":
    results = scan()
    if not results:
        print("✔ No hardcoded Fleetbase references found (only whitelabel config likely in use).")
    else:
        print("⚠ Potential hardcoded Fleetbase references:")
        for path, pat, match in results:
            print(f"  {path}: pattern={pat} match={match}")

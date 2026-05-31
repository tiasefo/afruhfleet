#!/usr/bin/env python3
import re
from pathlib import Path

ROOT = Path("afruheritage-platform/app")
CONFIG_IMPORT = "from app.core.config import settings"

# Patterns to replace
URL_PATTERNS = [
    r"https://api\.fleetbase[^\"']*",
    r"https://.*fleetbase[^\"']*",
    r"fleetbase\.io",
]

def patch_file(path: Path):
    text = path.read_text(encoding="utf-8")

    original = text

    # Ensure config import exists
    if CONFIG_IMPORT not in text:
        text = CONFIG_IMPORT + "\n" + text

    # Replace URLs with settings
    for pat in URL_PATTERNS:
        text = re.sub(pat, "settings.FLEET_ENGINE_BASE_URL", text)

    # Replace API key usage
    text = re.sub(r"FLEETBASE_API_KEY", "settings.FLEET_ENGINE_API_KEY", text)

    # Replace any leftover Fleetbase references
    text = re.sub(r"FLEETBASE_", "FLEET_ENGINE_", text)

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True

    return False

def main():
    patched = []
    for py in ROOT.rglob("*.py"):
        if patch_file(py):
            patched.append(str(py))

    print("Patched Fleetbase references:")
    for p in patched:
        print("  -", p)

if __name__ == "__main__":
    main()

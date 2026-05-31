#!/usr/bin/env python3
from pathlib import Path
import re

TEST_FILE = Path("afruheritage-platform/tests/conftest.py")

def patch():
    if not TEST_FILE.exists():
        print("✔ No conftest.py found — nothing to patch.")
        return

    text = TEST_FILE.read_text(encoding="utf-8")
    original = text

    # Replace ONLY the specific env var prefix
    text = re.sub(
        r"RUNNER_DEFAULT_FLEETBASE_ROOT",
        "RUNNER_DEFAULT_FLEET_ENGINE_ROOT",
        text
    )

    # Replace any remaining prefix references
    text = re.sub(r"\bFLEETBASE_", "FLEET_ENGINE_", text)

    if text != original:
        TEST_FILE.write_text(text, encoding="utf-8")
        print(f"✔ Patched Fleetbase references in {TEST_FILE}")
    else:
        print("✔ No Fleetbase references found in test file.")

if __name__ == "__main__":
    patch()

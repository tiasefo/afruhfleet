#!/usr/bin/env python3
import sys
from pathlib import Path

BASE = Path("data/tenants")

FOLDERS = [
    "imports/manifests",
    "imports/customers",
    "imports/marketplace",
    "imports/processed",
    "branding/logo",
    "branding/banners",
    "branding/flyers",
    "branding/marketing",
    "warehouse/lost-and-found",
    "warehouse/unidentified-items",
    "warehouse/damaged-items",
    "warehouse/customer-claims",
    "notices/arrival-schedules",
    "notices/warehouse-updates",
    "notices/customs-notices",
    "documents/rates",
    "documents/policies",
    "documents/terms",
    "documents/invoices",
    "exports",
]

def main():
    if len(sys.argv) < 2:
        print("Usage: scripts/bootstrap_tenant_template.py <tenant-slug>")
        sys.exit(1)

    slug = sys.argv[1].strip()
    root = BASE / slug

    for folder in FOLDERS:
        path = root / folder
        path.mkdir(parents=True, exist_ok=True)

    readme = root / "README.md"
    if not readme.exists():
        readme.write_text(f"""# {slug} tenant workspace

This tenant uses the freight_forwarding_china_ghana template.

Put XLSX manifests in:
- imports/manifests/

Put customer CSV/XLSX files in:
- imports/customers/

Put unidentified item photos in:
- warehouse/unidentified-items/

Put arrival flyers in:
- notices/arrival-schedules/

Put warehouse notices in:
- notices/warehouse-updates/
""")

    print(f"Bootstrapped tenant template folders: {root}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Add BackButton component to pages that don't have back navigation.
Works for both frontend and admin-console pages.
"""

import re
import os

FRONTEND_PAGES = [
    "frontend/app/billing/page.tsx",
    "frontend/app/billing/callback/page.tsx",
    "frontend/app/crm/page.tsx",
    "frontend/app/crm/contacts/page.tsx",
    "frontend/app/crm/quotes/page.tsx",
    "frontend/app/customs/page.tsx",
    "frontend/app/customs/ghana/page.tsx",
    "frontend/app/customs/kenya/page.tsx",
    "frontend/app/customs/nigeria/page.tsx",
    "frontend/app/customs/rwanda/page.tsx",
    "frontend/app/customs/south-africa/page.tsx",
    "frontend/app/customs/tanzania/page.tsx",
    "frontend/app/customs/uganda/page.tsx",
    "frontend/app/dashboard/fleetops/drivers/page.tsx",
    "frontend/app/dashboard/fleetops/fleets/page.tsx",
    "frontend/app/dashboard/fleetops/orders/page.tsx",
    "frontend/app/dashboard/fleetops/page.tsx",
    "frontend/app/dashboard/fleetops/vehicles/page.tsx",
    "frontend/app/dashboard/page.tsx",
    "frontend/app/fleetbase/console-gate/page.tsx",
    "frontend/app/fleetbase/console/page.tsx",
    "frontend/app/fleetbase/drivers/page.tsx",
    "frontend/app/fleetbase/extensions/page.tsx",
    "frontend/app/fleetbase/fleets/page.tsx",
    "frontend/app/fleetbase/live-map/page.tsx",
    "frontend/app/fleetbase/orders/page.tsx",
    "frontend/app/fleetbase/vehicles/page.tsx",
    "frontend/app/locations/page.tsx",
    "frontend/app/locations/china/page.tsx",
    "frontend/app/locations/djibouti/page.tsx",
    "frontend/app/locations/ghana/page.tsx",
    "frontend/app/locations/kenya/page.tsx",
    "frontend/app/locations/nigeria/page.tsx",
    "frontend/app/locations/somalia/page.tsx",
    "frontend/app/members/page.tsx",
    "frontend/app/portal/page.tsx",
    "frontend/app/products/page.tsx",
    "frontend/app/profile/page.tsx",
    "frontend/app/settings/page.tsx",
    "frontend/app/shipments/page.tsx",
    "frontend/app/storefront/page.tsx",
    "frontend/app/support/dashboard/page.tsx",
    "frontend/app/support/ticket/[token]/page.tsx",
    "frontend/app/templates/page.tsx",
    "frontend/app/tenant-request/page.tsx",
]

ADMIN_PAGES = [
    "admin-console/frontend/app/dashboard/analytics/page.tsx",
    "admin-console/frontend/app/dashboard/billing/page.tsx",
    "admin-console/frontend/app/dashboard/blueprint/page.tsx",
    "admin-console/frontend/app/dashboard/domains/page.tsx",
    "admin-console/frontend/app/dashboard/knowledge-base/page.tsx",
    "admin-console/frontend/app/dashboard/kyc/page.tsx",
    "admin-console/frontend/app/dashboard/page.tsx",
    "admin-console/frontend/app/dashboard/runners/page.tsx",
    "admin-console/frontend/app/dashboard/runtimes/page.tsx",
    "admin-console/frontend/app/dashboard/templates/page.tsx",
    "admin-console/frontend/app/dashboard/tenants/page.tsx",
    "admin-console/frontend/app/dashboard/tickets/page.tsx",
    "admin-console/frontend/app/dashboard/tracking/page.tsx",
    "admin-console/frontend/app/dashboard/users/page.tsx",
    "admin-console/frontend/app/dashboard/vendor-actions/page.tsx",
    "admin-console/frontend/app/dashboard/vendors/page.tsx",
]

# Fallback URLs for specific pages
FRONTEND_FALLBACKS = {
    "frontend/app/billing/page.tsx": "/dashboard",
    "frontend/app/billing/callback/page.tsx": "/billing",
    "frontend/app/crm/page.tsx": "/dashboard",
    "frontend/app/crm/contacts/page.tsx": "/crm",
    "frontend/app/crm/quotes/page.tsx": "/crm",
    "frontend/app/customs/page.tsx": "/dashboard",
    "frontend/app/dashboard/fleetops/page.tsx": "/dashboard",
    "frontend/app/dashboard/fleetops/drivers/page.tsx": "/dashboard/fleetops",
    "frontend/app/dashboard/fleetops/fleets/page.tsx": "/dashboard/fleetops",
    "frontend/app/dashboard/fleetops/orders/page.tsx": "/dashboard/fleetops",
    "frontend/app/dashboard/fleetops/vehicles/page.tsx": "/dashboard/fleetops",
    "frontend/app/fleetbase/console-gate/page.tsx": "/dashboard",
    "frontend/app/fleetbase/console/page.tsx": "/dashboard",
    "frontend/app/fleetbase/drivers/page.tsx": "/dashboard",
    "frontend/app/fleetbase/extensions/page.tsx": "/dashboard",
    "frontend/app/fleetbase/fleets/page.tsx": "/dashboard",
    "frontend/app/fleetbase/live-map/page.tsx": "/dashboard",
    "frontend/app/fleetbase/orders/page.tsx": "/dashboard",
    "frontend/app/fleetbase/vehicles/page.tsx": "/dashboard",
    "frontend/app/locations/page.tsx": "/",
    "frontend/app/members/page.tsx": "/dashboard",
    "frontend/app/portal/page.tsx": "/dashboard",
    "frontend/app/products/page.tsx": "/",
    "frontend/app/profile/page.tsx": "/dashboard",
    "frontend/app/settings/page.tsx": "/dashboard",
    "frontend/app/shipments/page.tsx": "/dashboard",
    "frontend/app/storefront/page.tsx": "/dashboard",
    "frontend/app/support/dashboard/page.tsx": "/dashboard",
    "frontend/app/support/ticket/[token]/page.tsx": "/support",
    "frontend/app/templates/page.tsx": "/dashboard",
    "frontend/app/tenant-request/page.tsx": "/",
}

ADMIN_FALLBACKS = {
    "admin-console/frontend/app/dashboard/analytics/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/billing/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/blueprint/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/domains/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/knowledge-base/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/kyc/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/page.tsx": "/",
    "admin-console/frontend/app/dashboard/runners/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/runtimes/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/templates/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/tenants/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/tickets/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/tracking/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/users/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/vendor-actions/page.tsx": "/dashboard",
    "admin-console/frontend/app/dashboard/vendors/page.tsx": "/dashboard",
}


def add_back_button(filepath: str, is_admin: bool = False):
    """Add BackButton import and component to a page."""
    if not os.path.exists(filepath):
        print(f"  SKIP (not found): {filepath}")
        return False

    with open(filepath, "r") as f:
        content = f.read()

    if "BackButton" in content:
        print(f"  SKIP (already has): {filepath}")
        return False

    import_path = "@/components/back-button"
    fallback = "/dashboard"

    if is_admin:
        fallback = ADMIN_FALLBACKS.get(filepath, "/dashboard")
    else:
        fallback = FRONTEND_FALLBACKS.get(filepath, "/dashboard")

    # Determine the fallback prop string
    fallback_prop = f' fallback="{fallback}"' if fallback != "/dashboard" else ""

    # Add import after the last import line
    lines = content.split("\n")
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.startswith("import ") or (line.startswith("'use client'") and i == 0):
            if line.startswith("import "):
                last_import_idx = i

    if last_import_idx == -1:
        # No imports found, add after 'use client' or at top
        for i, line in enumerate(lines):
            if line.startswith("'use client'"):
                last_import_idx = i
                break

    if last_import_idx == -1:
        print(f"  SKIP (no imports found): {filepath}")
        return False

    # Insert import
    lines.insert(last_import_idx + 1, f"import {{ BackButton }} from '{import_path}'")

    # Now find the return statement and add BackButton at the top of the JSX
    # Look for "return (" or "return <"
    content = "\n".join(lines)

    # Find the return statement with JSX
    # Pattern: return ( followed by whitespace and then opening tag
    return_match = re.search(r'(return\s*\(\s*\n)(\s*)(<)', content)
    if return_match:
        indent = return_match.group(2)
        # Insert BackButton before the first JSX element inside return
        insert_pos = return_match.end()
        # Find the end of the first opening tag line
        content = content[:insert_pos] + f"{indent}<BackButton{fallback_prop} />\n{indent}" + content[insert_pos:]
    else:
        # Try pattern: return < directly
        return_match = re.search(r'(return\s+)(<)', content)
        if return_match:
            insert_pos = return_match.start()
            content = content[:insert_pos] + f"return (\n  <BackButton{fallback_prop} />\n  " + content[insert_pos:]
            # Need to close the paren — find the end and add )
            # This is tricky, let's use a simpler approach
            # Actually, let's just insert before return
            content = content[:insert_pos] + f"<BackButton{fallback_prop} />\n" + content[insert_pos:]
        else:
            print(f"  SKIP (no return found): {filepath}")
            return False

    with open(filepath, "w") as f:
        f.write(content)

    print(f"  DONE: {filepath}")
    return True


def main():
    base = "/home/afruheritage/fleetbase/afruhfleet/afruheritage-platform"

    print("\n=== Frontend pages ===")
    fe_count = 0
    for page in FRONTEND_PAGES:
        filepath = os.path.join(base, page)
        if add_back_button(filepath, is_admin=False):
            fe_count += 1

    print(f"\n=== Admin pages ===")
    admin_count = 0
    for page in ADMIN_PAGES:
        filepath = os.path.join(base, page)
        if add_back_button(filepath, is_admin=True):
            admin_count += 1

    print(f"\n=== Summary ===")
    print(f"  Frontend: {fe_count} pages updated")
    print(f"  Admin: {admin_count} pages updated")
    print(f"  Total: {fe_count + admin_count} pages updated")


if __name__ == "__main__":
    main()

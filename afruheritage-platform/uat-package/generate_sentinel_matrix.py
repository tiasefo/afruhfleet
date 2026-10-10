#!/usr/bin/env python3
"""Generate SENTINEL_CUSTOMER_ADMIN_GAP_MATRIX.xlsx.

Documents every Sentinel console page, the APIs behind it, the defects found
during the 2026-10-10 browser recon, the fix applied, and the verified outcome.
"""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

HEADER_FILL = PatternFill("solid", fgColor="1F2937")
PASS_FILL = PatternFill("solid", fgColor="D1FAE5")
FIXED_FILL = PatternFill("solid", fgColor="DBEAFE")
GAP_FILL = PatternFill("solid", fgColor="FEE2E2")
DEFER_FILL = PatternFill("solid", fgColor="FEF3C7")
THIN = Border(*[Side(style="thin", color="D1D5DB")] * 4)

ROWS = [
    # Page, Capability, Endpoint(s), Issue found, Fix, Status
    ("Login", "Admin + control-plane sign-in", "POST /sentinel/auth/login",
     "Worked after creating matching CP superuser", "Created CP superuser for admin email", "VERIFIED"),
    ("Dashboard", "Platform overview stats + health", "GET /sentinel/dashboard/stats, /sentinel/dashboard/health",
     "Hardcoded mock metrics (156 users / 1284 shipments); fake health checks; missing fields",
     "Replaced mocks with real SQL counts, real DB/Redis/CP health checks, added missing fields", "FIXED + VERIFIED"),
    ("Tenants", "Tenant list, suspend/activate/delete, storefront preview, launch", "GET /sentinel/tenants, POST .../suspend|activate|provision",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("User Management", "Admin user list + create", "GET /sentinel/users/, POST /sentinel/auth/users",
     "List always empty — page expected array, API returns {items}", "Page reads data.items", "FIXED + VERIFIED"),
    ("Billing", "Plans, promotions, wallets, subscriptions, assign plan, adjust credits",
     "GET /sentinel/billing/*",
     "Frontend called CP paths directly with wrong token; fake plan fallback in API; promotions proxy missing; plan edit scope bug",
     "Repointed all calls to /sentinel/billing/*; removed fake-plan fallback; added promotions + plan PATCH/DELETE proxies; fixed payload keys and CP query params", "FIXED + VERIFIED"),
    ("Payments", "Payment list, detail, manual payment", "GET /sentinel/payments",
     "Proxy called /payments/statistics (aggregates, not records); no CP admin list endpoint",
     "Added GET /payments/admin (+ /admin/{id}) on control plane; proxy + page updated to real list shape", "FIXED + VERIFIED"),
    ("Shipments", "Cross-tenant shipment list + detail", "GET /sentinel/shipments",
     "Page read data.items but API returns {shipments}", "Page reads data.shipments", "FIXED + VERIFIED"),
    ("Fleetbase Ops", "Per-tenant runtime status, restart, debug, logs", "GET/POST /sentinel/fleetbase/tenant/*",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Runners", "Runner node list + register", "GET/POST /sentinel/runners",
     "Entire route file served MOCK_RUNNERS — fake nodes, fake create, fake restart/shutdown",
     "Rewrote route as control-plane proxy (/fleetbase-runtime/runners); unsupported actions return honest 501", "FIXED + VERIFIED"),
    ("Runtimes", "Deploy tenant Fleetbase runtime", "POST /sentinel/runtime/deploy",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Domains", "Custom domain activation", "GET /sentinel/domains/tenant/{id}, POST /sentinel/domains/activate",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("KYC", "Submission list, approve, revoke", "GET /sentinel/kyc/list, POST /sentinel/kyc/{approve,revoke}/{id}",
     "Page used raw fetch without auth headers (401) then crashed on e.map; silent empty-list fallback hid errors",
     "Page uses authenticated api client; list errors now surface as 502 instead of fake empty", "FIXED + VERIFIED"),
    ("Tickets", "Support ticket list + status updates", "GET /sentinel/tickets, PATCH .../status",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Tracking", "Admin public tracking lookup", "GET /sentinel/tracking/public",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Templates", "Storefront template CRUD + selection", "GET/POST/PATCH/DELETE /sentinel/templates/*",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Vendors", "Vendor list, review, suspend, detail", "GET/POST /sentinel/vendors/*",
     "Frontend called /api/v1/vendors/admin directly (404 on admin host)",
     "Repointed to /sentinel/vendors* proxies", "FIXED + VERIFIED"),
    ("Vendor Actions", "Approve/reject pending vendors", "GET /sentinel/vendors?status=pending",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Analytics", "Platform metrics overview", "GET /sentinel/dashboard/stats",
     "Page read non-existent field names (summary.tenants) and stats lacked payments/KYC",
     "Field names corrected; stats extended with real payments/KYC counts", "FIXED + VERIFIED"),
    ("Control Center", "Global feature flags + per-tenant assignments", "GET/POST /sentinel/control-center/*",
     "Worked (real DB-backed feature control)", "None needed", "VERIFIED"),
    ("Feature Flags", "Global flag list + toggle", "GET /sentinel/feature-flags/global, PATCH .../global/{key}",
     "Page treated flag list as map — rendered [object Object]; toggle PATCH hit nonexistent bulk endpoint",
     "Page renders flag objects; added per-key PATCH proxy to /admin/features/{key}", "FIXED + VERIFIED"),
    ("Diagnostics", "System + endpoint health, audit logs", "GET /sentinel/diagnostics/*",
     "Worked once CP token present", "None needed beyond auth chain", "VERIFIED"),
    ("Documentation / KB / Architecture / Blueprint", "Internal reference docs", "static pages",
     "Route-resolution bug sent all subpages back to dashboard", "Static resolver now serves directory index.html", "FIXED + VERIFIED"),
    ("Static routing", "All /sentinel/dashboard/* pages", "static export",
     "Every subpage redirected to /sentinel/dashboard/ (SPA fallback)",
     "Resolver checks exact file -> dir index.html -> root shell", "FIXED + VERIFIED"),
    ("Stale bundle", "Navigation missing Payments/Shipments/Fleetbase/FeatureFlags/Diagnostics",
     "deployed static bundle", "Deployed bundle predated source routes", "Rebuilt Next static export, redeployed", "FIXED + VERIFIED"),
    ("Payment refund/dispute", "Refund and dispute actions", "POST /sentinel/payments/{id}/refund|dispute",
     "No CP backend for refund/dispute — calls return honest 404", "Deferred — needs CP refund/dispute endpoints", "GAP (backend missing)"),
    ("Runner restart/shutdown/metrics", "Runner lifecycle controls", "POST /sentinel/runners/{id}/restart|shutdown",
     "No CP backend — previously fake-succeeded on mock data", "Now returns honest 501 until CP supports it", "GAP (backend missing)"),
    ("Tenant detail stats", "Per-tenant shipments/storage/API metrics", "tenants_advanced.py",
     "Router not mounted; placeholder zeros", "Unmounted dead code — needs real implementation if enabled", "GAP (unmounted)"),
]


def main():
    wb = Workbook()
    ws = wb.active
    ws.title = "Sentinel Gap Matrix"

    headers = ["Sentinel Page", "Capability", "Backing Endpoint(s)", "Issue Found (2026-10-10 recon)", "Resolution", "Status"]
    ws.append(headers)
    for c in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = HEADER_FILL
        cell.alignment = Alignment(vertical="center")
        cell.border = THIN

    for row in ROWS:
        ws.append(row)

    for r in range(2, ws.max_row + 1):
        status = ws.cell(row=r, column=6).value or ""
        fill = PASS_FILL if "VERIFIED" in status else (GAP_FILL if "GAP" in status else DEFER_FILL)
        for c in range(1, 7):
            cell = ws.cell(row=r, column=c)
            cell.border = THIN
            cell.alignment = Alignment(vertical="top", wrap_text=True)
            if c == 6:
                cell.fill = fill
                cell.font = Font(bold=True)

    widths = [22, 42, 44, 52, 52, 18]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"

    # Summary sheet
    ws2 = wb.create_sheet("Summary")
    verified = sum(1 for r in ROWS if "VERIFIED" in r[5])
    gaps = [r for r in ROWS if "GAP" in r[5]]
    ws2.append(["Metric", "Value"])
    ws2.append(["Pages/capabilities inventoried", len(ROWS)])
    ws2.append(["Verified working through real browser UI", verified])
    ws2.append(["Fixed during this pass", sum(1 for r in ROWS if "FIXED" in r[5])])
    ws2.append(["Remaining backend gaps (honest errors, not fake success)", len(gaps)])
    ws2.append([])
    ws2.append(["Remaining gaps"])
    for g in gaps:
        ws2.append([g[0], g[3]])
    for c in range(1, 3):
        ws2.column_dimensions[get_column_letter(c)].width = 60
    ws2["A1"].font = Font(bold=True)
    ws2["A7"].font = Font(bold=True)

    out = "uat-package/SENTINEL_CUSTOMER_ADMIN_GAP_MATRIX.xlsx"
    wb.save(out)
    print(f"Wrote {out}: {verified} verified, {len(gaps)} gaps")


if __name__ == "__main__":
    main()

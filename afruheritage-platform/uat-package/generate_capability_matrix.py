"""Generate PRODUCT_CAPABILITY_MATRIX.xlsx + .md — PO reconciliation artifact.

Every capability is classified by EVIDENCE, and deferral decisions are returned
to the Product Owner — no developer-decided scope.
"""
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

HEAD = ["Capability", "Business purpose", "Requirement evidence", "Implementation status (verified)",
        "Launch criticality", "Customer impact", "Sentinel dependency", "Remediation required",
        "Proposed release", "PO decision required"]

# status: VERIFIED / IMPLEMENTED-UNVERIFIED / DEFECTIVE / PARTIAL / MISSING / PO-DEFER / UNSUPPORTED
R = [
# ── Registration & onboarding journeys ─────────────────────────────
("Company registration", "Freight/logistics company signs up, gets tenant + portal",
 "Core product purpose (AGENT.md)", "VERIFIED — /register → plan modal → template → onboarding (P21-01..03)",
 "Core", "Cannot onboard customers without it", "Tenants page: approve/suspend/launch (WORKING)",
 "None for basic flow", "Launch", "—"),
("Individual shipper registration", "Personal account for individuals shipping goods",
 "PO registration model", "VERIFIED — /register personal flow, sign-in, personal dashboard",
 "Core", "Individual customers blocked otherwise", "Users list (WORKING)",
 "None", "Launch", "—"),
("Staff invitation", "Company owner invites employees with roles",
 "PO registration model", "VERIFIED — invite email → accept → password → workspace; roles enforced (P21-08..10)",
 "Core", "Multi-user companies blocked otherwise", "Users page; team oversight",
 "None", "Launch", "—"),
("Vendor registration + marketplace", "Partner/vendor onboarding, approval, bookings, dispatch",
 "PO D-01 ratified — platform marketplace model",
 "VERIFIED — 2026-10-13: full browser journey on deployed prod (P27): public /vendor/register → Sentinel approve → membership link → real invite email → /vendor-accept password setup → vendor login redirects to /vendor → profile/approved dashboard → availability update → tenant booking → vendor accept via UI → /vendor/documents. Membership-only auth, suspended→403, no booked_by PII",
 "PO ruled: complete marketplace — platform-global vendors, tenant-scoped bookings", "Vendor portal UI not yet built",
 "Vendor pages: list/review/suspend/membership-link (WORKING + audited)",
 "Build vendor portal UI + tenant marketplace UI", "Under implementation",
 "NO"),
("Driver self-service (sign-in, job updates)", "Drivers authenticate and update jobs",
 "PO: conditional — needed for driver-operated workflow",
 "MISSING — drivers exist only as managed records (Fleetbase proxy); vendor bookings carry driver_name/phone + position tracking, but no driver auth or app",
 "PO decision — managed-record fleet mgmt may suffice initially", "Drivers cannot interact with the platform",
 "None currently",
 "Build driver identity + mobile flow if approved", "PO decision",
 "YES — launch with managed drivers only, or require driver portal?"),

# ── Shipments & notifications ──────────────────────────────────────
("Shipment create/list/lifecycle/tracking", "Core freight operations",
 "Core product purpose", "VERIFIED — create, status transitions, public tracking (P21-04..07, UAT tests)",
 "Core", "Platform is meaningless without it", "Shipments admin list (WORKING)",
 "None for operations", "Launch", "—"),
("Shipment status notifications", "Customers informed of status changes",
 "PO: core gap — customers should receive updates",
 "VERIFIED — 2026-10-12: transition endpoint now calls shared notify_shipment_status_change; D-03 both recipients (tenant contact + receiver_email, new optional field) notified; real mail.tm inbox delivery proven on transition AND event paths; email link fixed to public /track?tracking_number=; cross-tenant blocked 403 (P22)",
 "Core", "Customers previously got zero shipment updates",
 "None", "Done — see PHASE1_EVIDENCE.md",
 "Fixed before launch", "—"),
("Public tracking", "Anyone tracks shipment by reference",
 "Core", "VERIFIED — apex + tenant portal tracking (P21-07)", "Core", "—", "Tracking page (WORKING)", "None", "Launch", "—"),

# ── Support ────────────────────────────────────────────────────────
("Tenant-portal support tickets", "Public submits tickets on a company's portal",
 "Core", "VERIFIED — submit, confirmation email, token tracking, admin list + status updates (P21-12; write path verified)",
 "Core", "—", "Tickets list + status PATCH (WORKING)", "None", "Launch", "—"),
("Central Afruheritage platform support", "Platform-level support independent of tenant tickets",
 "PO: core gap",
 "VERIFIED — 2026-10-13: apex /support form submits platform-scope tickets (reserved afruheritage-platform tenant alias); public token tracking + guest reply work unauthenticated on apex; Sentinel UI lists/threads/replies/changes status on platform tickets (P28, 14/14); GLPI sync logs durable skipped when unconfigured",
 "High if PO requires central support at launch", "No channel for platform-level issues (billing disputes, onboarding help)",
 "Admin tickets view covers all tenants — intake path missing only",
 "Add platform-scope ticket path (tenant_id optional) + apex intake form, or stand up support@ workflow", "PO decision",
 "YES — is central ticket intake required at launch?"),

# ── Billing ────────────────────────────────────────────────────────
("Plan/trial subscription lifecycle", "Trial activation, cancel/pause/resume, plan view",
 "Core", "VERIFIED — trial activation ~550ms, subscription lifecycle endpoints, billing page",
 "Core", "—", "Billing admin: plans/promotions/wallets/subscriptions proxies (WORKING)",
 "None for trial scope", "Launch", "—"),
("Live payment collection (charges)", "Real-money subscription payments",
 "PO: commercial blocker for paid launch",
 "IMPLEMENTED-UNVERIFIED — Paystack + Flutterwave clients exist (initialize/verify, webhooks, authorization_url flow); never exercised end-to-end with real keys in UAT",
 "Depends on launch model — required if charging at launch", "Cannot collect revenue if broken",
 "Payments admin list (WORKING); refund/dispute MISSING",
 "End-to-end charge test with live keys; decide refund/dispute scope", "PO decision",
 "YES — go-live with paid billing now, or trial-only launch?"),

# ── CRM ────────────────────────────────────────────────────────────
("CRM contacts + quotes", "Manage customers and quotations",
 "Product scope", "VERIFIED — /crm, /crm/contacts, /crm/quotes pages + backend CRUD",
 "Core if CRM sold", "—", "None currently", "None", "Launch", "—"),
("CRM activity history", "Follow-up notes, calls, activity log per customer",
 "PO: needs remediation",
 "VERIFIED — 2026-10-13: tenant-facing /crm/customers page (create/stage/delete/expandable activity log via real crmApi); crm_customers+crm_activities now tenant_id-scoped (cross-tenant exposure fixed); Sentinel crm-panel rewritten from mock to real API; P28b browser-verified create+stage+activity persisted (5/5)",
 "PO decision", "Cannot record customer follow-ups via UI",
 "None", "Add activities UI to CRM customer detail", "PO decision",
 "YES — is CRM activity UI required at launch?"),

# ── Storefront & templates ─────────────────────────────────────────
("Tenant storefront (fleet/freight templates)", "Published branded company portal",
 "Core", "VERIFIED — template selection, publish, live tenant storefront; fabricated vendor/stat/route content removed",
 "Core", "—", "Templates page (WORKING)", "None", "Launch", "—"),
("Additional storefront templates (5 demos)", "Mall/ecommerce/restaurant/booking/real-estate themes",
 "Optional", "PARTIAL — previewable, publish-blocked (fake-content themes now degrade to generic shell)",
 "Low — PO: reasonable deferral", "Cannot publish these themes", "Templates page",
 "Make tenant-configurable before publishing", "Post-launch", "Confirm deferral"),
("Custom domains", "Customer-owned domain for portal",
 "Domain policy: subdomain first", "PARTIAL — custom_domain_events + domains admin exist; end-to-end custom-domain flow unverified",
 "Low for launch", "Subdomain works as recovery route", "Domains page (WORKING)",
 "Verify or defer", "Post-launch", "Confirm deferral"),

# ── Operations extras ──────────────────────────────────────────────
("Warehouse operations", "Warehouse management module",
 "Unclear if in product scope",
 "MISSING — no implementation found; not in customer nav",
 "PO: depends on product scope — works or remove from offering", "—", "None",
 "Implement, or explicitly remove from offering/docs", "PO decision",
 "YES — does Afruheritage sell warehouse management?"),
("Dedicated analytics dashboards", "Advanced BI/analytics views",
 "Optional per PO — basic counts required",
 "PARTIAL — basic operational stats exist (tenant dashboard endpoint, Sentinel analytics: real users/tenants/shipments/revenue/KYC counts); no dedicated analytics module",
 "PO: basic counts suffice", "—", "Analytics page (WORKING, real data)",
 "None if basic counts acceptable", "Post-launch", "Confirm basic-counts-only is acceptable"),
("AI help assistant", "Public Q&A widget",
 "Platform feature", "VERIFIED — responds, bounded fallback, no unhandled errors (FIN-10)",
 "Core", "—", "None", "Optional: richer KB", "Launch", "—"),
("Native mobile app", "iOS/Android apps",
 "Roadmap", "UNSUPPORTED — responsive web only", "PO: reasonable deferral", "—", "—",
 "None — web works on mobile browsers", "Post-launch/roadmap", "Confirm deferral"),

# ── Platform/admin ─────────────────────────────────────────────────
("Tenant isolation", "Cross-tenant data separation",
 "AGENT.md non-negotiable", "VERIFIED — distinct Fleetbase orgs; P21-14 zero cross-tenant records",
 "Core", "—", "—", "None", "Launch", "—"),
("Admin audit logging", "Immutable record of admin actions",
 "AGENT.md audit mandate; PO requirement",
 "VERIFIED — 2026-10-12: all sentinel writes audited; append-only enforced at DB layer (UPDATE/DELETE/TRUNCATE triggers); fail-closed on sensitive mutations (attempt row first, 503+reject on audit-store failure); atomic business+audit commits on same-DB mutations",
 "Core for supportability", "—", "Diagnostics audit view exists",
 "Done — see PHASE1_EVIDENCE.md", "Fixed before launch", "—"),
("Feature flags — tenant scope", "Per-tenant feature entitlements",
 "Operational control", "VERIFIED — 2026-10-12: governed overrides live (lock→override→plan precedence); grant/revoke/expiry/reason via Sentinel tenant-feature assignments; grant guard blocks unimplemented features (409); resolution live-verified grant+revoke+expiry",
 "Medium", "—", "Control Center tenant-features + Feature Flags pages (WORKING, atomic-audited)",
 "Done — see PHASE1_EVIDENCE.md Round 2", "Fixed before launch", "—"),
("Sentinel refund/dispute", "Payment operations controls",
 "Depends on billing launch", "MISSING — honest 404/501, no CP backend", "With paid billing", "—", "Payments page",
 "CP refund/dispute endpoints", "With billing launch", "—"),
("Runner lifecycle controls", "Restart/shutdown runtime runners",
 "Ops tooling", "MISSING — honest 501, no CP backend", "Low", "—", "Runners page (list WORKING)",
 "CP runner control endpoints", "Post-launch", "—"),
("Branded sender domain (@afruheritage.com email)", "Customer emails from platform domain",
 "Branding/trust; PO requirement",
 "BLOCKED — provider account rejects @afruheritage.com senders; mail sends as advisory@emidentity.com; SPF strict, no DKIM, DMARC p=none",
 "High for brand trust at public launch", "Customers see non-branded sender",
 "—", "Provision sender domain + publish DKIM + tighten DMARC (ops action)", "Before public pilot", "—"),
]

def status_of(row): return row[3].split(" — ")[0]

wb = openpyxl.Workbook()
ws = wb.active; ws.title = "Capability Matrix"
FILLS = {"VERIFIED": "D1FAE5", "IMPLEMENTED-UNVERIFIED": "BFDBFE", "DEFECTIVE": "FECACA",
         "PARTIAL": "FEF3C7", "MISSING": "FEE2E2", "UNSUPPORTED": "E5E7EB", "BLOCKED": "FBCFE8"}
ws.append(HEAD)
for c in ws[1]:
    c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="1F2937")
    c.alignment = Alignment(wrap_text=True, vertical="top")
for row in R:
    ws.append(list(row))
    fill = FILLS.get(status_of(row), "FFFFFF")
    for c in ws[ws.max_row]:
        c.fill = PatternFill("solid", fgColor=fill); c.alignment = Alignment(wrap_text=True, vertical="top")
for i, w in enumerate([26,30,26,60,26,30,30,34,16,34], 1):
    ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w

s = wb.create_sheet("PO Decisions Required")
s.append(["#", "Decision", "Context", "Options"])
for c in s[1]: c.font = Font(bold=True)
n = 0
for row in R:
    if row[9] != "—":
        n += 1
        s.append([n, row[9], row[0] + ": " + row[3][:140], row[8] + " / launch scope"])
for i, w in enumerate([5, 55, 70, 30], 1):
    s.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w

wb.save("uat-package/PRODUCT_CAPABILITY_MATRIX.xlsx")

lines = ["# Afruheritage — Product Capability Reconciliation Matrix",
         "", "**Date:** 2026-10-11. Evidence-based; deferral decisions belong to the PO.", "",
         "| Capability | Purpose | Requirement | Status (verified) | Criticality | Customer impact | Sentinel dep. | Remediation | Proposed | PO decision |", "|---|---|---|---|---|---|---|---|---|---|"]
for row in R:
    lines.append("| " + " | ".join(str(c).replace("|", "\\|").replace("\n", " ") for c in row) + " |")
open("uat-package/PRODUCT_CAPABILITY_MATRIX.md", "w").write("\n".join(lines) + "\n")

from collections import Counter
print("matrix rows:", len(R), Counter(status_of(r) for r in R))
print("PO decisions:", n)

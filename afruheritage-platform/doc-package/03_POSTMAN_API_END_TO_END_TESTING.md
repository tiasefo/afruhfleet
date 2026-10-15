# Postman API Testing — Overview

## What to use

| File | Purpose |
|---|---|
| `AFRUHERITAGE_UAT.postman_collection.json` | The executable UAT suite — 79 requests, dependency-ordered, tokens/IDs auto-captured |
| `AFRUHERITAGE_UAT.postman_environment.json` | Environment template (emails pre-filled, passwords blank) |
| `POSTMAN_SIMPLE_START_GUIDE.md` | Click-by-click instructions |
| `POSTMAN_EXECUTION_REPORT.md` | The actual run results — 79/79 PASS |
| `AFRUHERITAGE_PILOT_POSTMAN_COLLECTION.json` | Legacy pilot-scoped collection (53 requests) — kept for reference; the UAT pack above supersedes it |

## What the UAT suite covers

- **Authentication** for 9 identities across both APIs, plus wrong-password and no-credential negatives.
- **Team invitations** — create → list → public lookup → accept → membership verified.
- **Shipments** — create → list → status transitions → events → public tracking, with cross-tenant denial checks.
- **Marketplace** — post job → driver search → accept → tracking → GPS write/read, plus the full R-001 negative battery (401 unauth, 403 cross-tenant, 403 wrong-driver).
- **Customs** — capped guest estimate, signed-in Ghana and Kenya duties, unauth denial, unsupported-country denial.
- **Support & CRM** — public ticket create/read/reply, internal list, CRM account + customer records, unauth denial.
- **Vendors** — vendor profile/bookings, public marketplace, admin list, tenant-user denial.
- **Billing** — plans, subscription, wallet, transactions; negative checks on payment-hub init and cross-tenant history. No live charges.
- **Sentinel** — identity, tenants, dashboard, diagnostics, shipments/tickets (control-plane token), audit log, admin users, viewer-role denial, unauth denial.

## What it deliberately does not run

- Live payment charges, payment verification, provider webhooks, OAuth handshakes.
- Destructive or privileged writes that mutate UAT tenant state (deletes, suspends, plan changes, provisioning, refunds).
- The WhatsApp integration (not enabled).

Full operation-level classification (577 operations: automated pass / manual pass / manual / excluded) is in `API_COVERAGE_MATRIX.md` and `evidence/api_coverage_matrix.json`.

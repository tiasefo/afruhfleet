# Route → Document Traceability Matrix

Generated from `evidence/api_route_inventory.txt` (452 ops) + `evidence/sentinel_route_permissions.txt` (141 routes) + `evidence/frontend_pages.txt` (108 pages). Commit `ee57ba5d`.

## API route groups → where documented / tested

| API group (prefix) | Ops | Documented in | Postman folder | Live-verified? |
|---|---|---|---|---|
| `/api/v1/auth` | 16 | Doc2 §1–4 | 01 | ✅ login/me/register-gate |
| `/api/v1/companies` | reg | Doc2 §3 | 02 | inspected (409/403 verified earlier) |
| `/api/v1/tenant-context` | 3 | Doc3 §3 | 03 | ✅ |
| `/api/v1/admin/features` (+feature flags) | — | Doc1 §4.10 / Doc3 | 03 | inspected |
| `/api/v1/shipments` | 19 | Doc2 §4.2–4.3 | 04 | ✅ list/track |
| `/api/v1/team` | 6 | Doc2 §5 | 05 | inspected |
| `/api/v1/customs` + `/customs/guest` | 11+ | Doc2 §4.4 / Doc3 §5 / Doc4 P-001..004 | 06 | ✅ GH/KE/cap/NG |
| `/api/v1/support-crm` | 16 | Doc2 §4.5 | 07 | ✅ public ticket (prior) |
| `/api/v1/crm` | 8 | Doc2 §4 | 08 | inspected |
| `/api/v1/vendors` | 21 | Doc2 §6 / Doc4 P-005 | 09 | surface only |
| `/api/v1/billing` + `/payments` | 28 | Doc2 §4.7 / Doc4 X/E | 10 | read paths only — no charges |
| `/api/v1/marketplace` | 13 | **Doc4 R-001 — unauthenticated writes** | — | inspected |
| `/api/v1/fleetbase-*` / `navigator` / `pallet` | ~25 | Doc4 F-001/002 | — | inspected |
| `/api/v1/admin/*` (49 ops) | 49 | Doc1 (Sentinel surfaces) + Doc3 §7 | — | inspected |
| `/api/v1/kyc`, `domains`, `templates`, `plugins`, `storefront`, `geo`, `whatsapp`, `rbac`, `commercial`, `estimate`, `checkout`, `products`, `assets`, misc | rest | inventory only | — | inspected |

## Sentinel routes → Doc 1 sections

| Sentinel group | Permission | Doc 1 |
|---|---|---|
| `/sentinel/auth/login` `…/me` `…/users` `…/bootstrap` | open / admin / **super_admin** / open-guarded | §2, §4.1 |
| `/sentinel/tenants*` (approve/provision/launch/suspend/activate/requests) | admin | §4.2 |
| `/sentinel/shipments`, `/tracking` | admin | §4.3, §4.5 |
| `/sentinel/tickets*` | admin | §4.4 |
| `/sentinel/vendors*` | admin | §4.6 |
| `/sentinel/billing/*`, `/payments*` | admin | §4.7, §4.8 |
| `/sentinel/kyc/*` | admin | §4.9 |
| `/sentinel/feature-flags/*`, `/control-center/*` | admin / **super_admin** for tenant-feature writes | §4.10 |
| `/sentinel/domains/*` | admin | §4.11 |
| `/sentinel/runtime/*`, `/runners`, `/fleetbase/*` | admin | §4.12 |
| `/sentinel/diagnostics/*` | admin | §4.13, §7 |
| `/sentinel/uat-handover/*` | open (tokenized) | — |
| **Pilot allowlist** | — | **§5 — CLI ONLY, not in Sentinel** |

## Frontend pages → Doc 2 journeys

| Page(s) | Journey |
|---|---|
| `/register`, `/register/company` | Doc2 §1–3 |
| `/login`, `/forgot-password`, `/reset-password` | §4.1 |
| `/dashboard`, `/shipments*`, `/track` | §4.2–4.3 |
| `/customs*` | §4.4 |
| `/support*`, `/support/ticket/[token]` | §4.5 |
| `/billing`, `/pricing`, `/checkout` | §4.7 (pilot-limited) |
| `/invite/accept`, `/members*` | §5 |
| `/vendor*`, `/vendor-accept` | §6 |
| `/admin/*` (customer app) | superuser-gated internal pages — Doc4 note |
| `/fleetbase/*` | redirect shims — Doc4 P-007 |

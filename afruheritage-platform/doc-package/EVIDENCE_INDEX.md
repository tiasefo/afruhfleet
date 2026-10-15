# Evidence Index — Source-Verified Pilot Documentation Package

**Repository:** `afruheritage-platform` · **Branch:** `amooskco-storefront-v2` · **Baseline commit:** `ee57ba5d` · **Round-1 authorization fix commit:** `2b4c7a0a` (deployed; verified by the r1 battery)
**Deployment model:** `api`/`worker`/`beat` run bind-mounted `./app:/app/app` → running Python = working tree. `frontend` image rebuilt per frontend change (last 2026-10-14/15). `sentinel` backend bind-mounted `sentinel/sentinel_app:ro`; **Sentinel UI image last built 2026-08-25** — components do NOT all run the same revision (Doc 4, R-004).
**Round-1 update:** authorization fixes for R-001/R-002/R-007/R-008/R-009 applied in working tree (commit in this package's header); verified by `live/r1_security_round.json`.
**Verified live:** 2026-10-14 against `api.afruheritage.com`, `afruheritage.com`, `admin.afruheritage.com`.

## Inventory artifacts (generated, not hand-written)

| File | Contents |
|---|---|
| `evidence/openapi.json` | Live OpenAPI — 389 paths / 452 ops |
| `evidence/sentinel_openapi.json` | Sentinel OpenAPI — 107 paths / 125 ops |
| `evidence/api_route_inventory.txt` | Every API route: method, path, tag, auth flag |
| `evidence/sentinel_route_permissions.txt` | 141 Sentinel routes → open / admin / super_admin / cp-token |
| `evidence/frontend_pages.txt` | 108 customer Next.js pages |
| `evidence/sentinel_frontend_pages.txt` | 26 Sentinel pages |

## Live API results (redacted — JWTs masked as `<REDACTED_JWT>`)

| File | Result |
|---|---|
| `live/01_health.json` | 200 ok |
| `live/02_login.json` | 200 — token + tenant_id `209738f3-…` |
| `live/03_me.json` | 200 |
| `live/04_shipments_list.json` | 200 real shipments |
| `live/05_ghana_vehicle.json` | 200 GH estimate, HDV repricing `15000→6800`, FX `15.0`, `official:false` |
| `live/06_kenya_crsp.json` | 200 KRA CRSP result |
| `live/07_ng_unsupported.json` | 422 controlled |
| `live/08_countries.json` | 200 |
| `live/09_no_token_401.json` | 401 |
| `live/10_register_unadmitted.json` | 403 pilot-closed (individual type) |
| `live/11_tenant_context.json` | 200 |
| `live/s01_login.json` … `s05_no_token_401.json` | Sentinel 200/200/200/200/401 |
| `live/r1_security_round.json` | Round-1 authorization battery: 21 checks — 401 unauth on all fixed mutations, 403 cross-tenant, 200 legitimate flows |

## Screenshots (`screenshots/`)

28 PNGs. Sentinel: `s01` login → `s02` dashboard → `s-tenants|users|shipments|tickets|tracking|vendors|billing|payments|control-center|feature-flags|domains|diagnostics|analytics`. Customer: `c01` home → `c02` register → `c03` login → `c04` customs → `c05` duty-calc → `c06` track → `c07` pricing → `c08` dashboard → `c09` shipments → `c10` billing → `c11` settings → `c12` crm → `c13` support. Captured by `prod-ui-cert/docshots.js` (Playwright, real authenticated sessions).

## Prior-cycle evidence carried forward (not re-run)

- Email: `prod-ui-cert/rc2-mime-*.txt` — 4 journeys, DKIM `s=zmail d=emidentity.com`, dkim/spf/dmarc pass.
- Persistence: Redis AOF + `redis_data` volume — allowlist survived restart + recreate.
- Remediation gates: R1 12/12, R2 19/19, R3 21/21; expanded UAT 16/16.

## Unresolved verification gaps

Vendor e2e, team-invite accept, Sentinel write ops, per-route isolation sweep, Redis-outage fail-closed, all paid paths — listed in Doc 4 §H.

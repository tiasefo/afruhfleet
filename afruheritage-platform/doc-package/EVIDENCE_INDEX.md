# Evidence Index — Source-Verified Pilot Documentation Package

**Repository:** `afruheritage-platform` · **Branch:** `amooskco-storefront-v2` · **Commit:** `ee57ba5d0a0860d7a705d18baa5b7f9eca6b87a2` (`ee57ba5d`)
**Deployment model:** `api`/`worker`/`beat` run bind-mounted `./app:/app/app` → running Python = working tree at `ee57ba5d`. `frontend` image built 2026-10-14 19:20 UTC from same tree; `sentinel` backend bind-mounted `sentinel/sentinel_app:ro`, sentinel UI image built 2026-08-25 (see Doc 4, R-004).
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

## Screenshots (`screenshots/`)

28 PNGs. Sentinel: `s01` login → `s02` dashboard → `s-tenants|users|shipments|tickets|tracking|vendors|billing|payments|control-center|feature-flags|domains|diagnostics|analytics`. Customer: `c01` home → `c02` register → `c03` login → `c04` customs → `c05` duty-calc → `c06` track → `c07` pricing → `c08` dashboard → `c09` shipments → `c10` billing → `c11` settings → `c12` crm → `c13` support. Captured by `prod-ui-cert/docshots.js` (Playwright, real authenticated sessions).

## Prior-cycle evidence carried forward (not re-run)

- Email: `prod-ui-cert/rc2-mime-*.txt` — 4 journeys, DKIM `s=zmail d=emidentity.com`, dkim/spf/dmarc pass.
- Persistence: Redis AOF + `redis_data` volume — allowlist survived restart + recreate.
- Remediation gates: R1 12/12, R2 19/19, R3 21/21; expanded UAT 16/16.

## Unresolved verification gaps

Vendor e2e, team-invite accept, Sentinel write ops, per-route isolation sweep, Redis-outage fail-closed, all paid paths — listed in Doc 4 §H.

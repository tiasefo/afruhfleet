# PO Review Round 1 — Authorization Closeout Evidence

Addresses review items R-001 (marketplace authorization) and R-002 (warehouse notices), plus same-class unauthenticated-write findings discovered during the mandated sweep (R-007 customs cap-bypass, R-008 cargo-lifecycle, R-009 payment-hub).

## Routes identified and disposition

| Route | Was | Now | File |
|---|---|---|---|
| `POST /api/v1/marketplace/shipments` | open | `require_active_subscription` + `tenant_id` must equal caller's tenant (or superuser); sets `created_by_user_id` | `app/api/routes/marketplace.py` |
| `POST /api/v1/marketplace/drivers/search` | open | `get_current_user`; `delivery_driver` must search as own user id | same |
| `POST /api/v1/marketplace/shipments/{id}/accept` | open | `get_current_user`; drivers accept only as themselves; platform_admin may assign | same |
| `POST /api/v1/marketplace/shipments/{id}/tracking/{status}` | open | `get_current_user` + `_can_operate_job` (assigned driver / owning tenant / platform admin) | same |
| `POST /api/v1/marketplace/shipments/{id}/gps` | open | `get_current_user` + `_can_operate_job`; payload `driver_id` must still match assigned driver | same |
| `GET /api/v1/marketplace/shipments/{id}/gps` | open | `get_current_user` + `_can_operate_job` | same |
| `POST /api/v1/warehouse-notices` | open | `get_current_user` + tenant match (was arbitrary content injection into any storefront) | `app/api/routes/warehouse_notices.py` |
| `PUT /api/v1/cargo-lifecycle/{tracking}/status` | open | `get_current_user` + tenant match | `app/api/routes/cargo_lifecycle.py` |
| `POST /api/v1/customs/{calculate,ghana/*,kenya/*,vehicle-value}` | open | `get_current_user` — closed the guest-cap bypass | `app/api/routes/customs.py` |
| `POST /api/v1/payment-hub/initialize` | open | `get_current_user` | `app/api/routes/payment_hub.py` |
| `GET /api/v1/payment-hub/transactions/{tenant_id}` | open | `get_current_user` + tenant match | same |

**Left public by design:** `/customs/guest/calculate` (the capped guest path — now the sole unauthenticated duty-check route, wired into the public calculator page), `/customs/vin-decode` (utility, not a duty check), payment `webhook` (signature-verified), `payment-hub/verify` + `receipt` (callback flow / opaque reference), `marketplace` GET shipment reads were already authed.

## Live test results (`live/r1_security_round.json`, run post-deploy)

| Check | Result |
|---|---|
| Marketplace post/accept/track/gps/gps-get/search — no token | **6× 401** |
| Tenant A posts job under Tenant B `tenant_id` | **403 `tenant_mismatch`** |
| `warehouse-notices` — no token | **401** |
| `warehouse-notices` — Tenant A under Tenant B slug | **403** |
| `warehouse-notices` — Tenant A own slug | **200** (test row deleted after) |
| `cargo-lifecycle` status — no token | **401** |
| Customs calculate / ghana / kenya — no token | **3× 401** |
| Customs calculate — Tenant A token | **200** |
| `payment-hub/initialize`, `/transactions` — no token | **2× 401** |
| `payment-hub/transactions/{B}` with Tenant A token | **403** |
| Guest customs calculate (public path) | **200 — preserved** |
| `vin-decode` (public utility) | **200 — preserved** |
| `auth/me` — Tenant A | **200 — no auth regression** |

## Legitimate-flow verification

- Signed-in customs calculation still works for the tenant session (200).
- The public `/customs/duty-calculator` page now sends guests to `/api/v1/customs/guest/calculate` with a localStorage `customs_guest_id` (existing fingerprint cap applies); signed-in users continue on the authed endpoints with `Authorization: Bearer`.
- Marketplace owner/driver/admin workflows keep the same role checks already present (`_can_operate_job` mirrors `get_shipment`'s owner/admin/driver model).
- No live payments touched; no credentials changed; pilot allowlist untouched.

## Deployed-SHA evidence

`api`/`worker`/`beat` run bind-mounted `./app` — the fix is live as soon as the API restarted (verified by the 401 battery above hitting `api.afruheritage.com`). `frontend` image rebuilt for the calculator page change. Exact commit: see package header (`EVIDENCE_INDEX.md`).

## Remaining risk / not verified

- `accept_job` driver-role path verified by code inspection only — no `delivery_driver` test account exists.
- `commercial_orchestration` open signup-provision endpoints: contained by internal `payment_not_completed` gate; recommend auth or env-gating at paid launch (R-010).
- The R1 sweep covered **all POST/PUT/PATCH/DELETE routes without auth deps** outside `*guest*`/`*public*` modules — remaining open writes are webhooks/signup-intent flows listed above.

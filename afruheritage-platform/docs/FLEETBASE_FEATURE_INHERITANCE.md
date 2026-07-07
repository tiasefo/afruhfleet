# Fleetbase Feature-Inheritance Contract (P1.4)

**Status:** Discovery + documentation. Answers "are tenants inheriting Fleetbase features properly, and are they plan-gated?"
**Method:** Read from actual code (proxies, plugins, feature_flags, control_center) on Jul 6. No behavior change in this pass.
**Model:** ONE shared Fleetbase instance; each tenant = a Fleetbase Organization (`fleetbase_org_id`). Every tenant org structurally inherits Fleetbase's full `/int/v1/*` surface; Afruheritage wraps it, scopes by `company_uuid`, and is *supposed* to gate by plan.

---

## How a Fleetbase feature actually reaches a tenant today

There are exactly three code paths to Fleetbase `/int/v1/*`:

| Path | File | Scope mechanism | Methods | Plan/flag gate? |
|------|------|-----------------|---------|-----------------|
| Curated read-only proxy | `app/api/routes/fleetbase_proxy.py` | `company_uuid` param (P0.3 fix) | GET only | **NONE** |
| Curated read+write proxy | `app/api/routes/fleetbase_tenant_proxy.py` | `company_uuid` param + body | GET/POST | **NONE** |
| Catch-all | `fleetbase_tenant_proxy.py` `/proxy/{path}` | `company_uuid` param + body | GET/POST/PUT/PATCH/DELETE | **NONE** |

Both proxies check only: (1) authenticated user, (2) tenant has a provisioned `fleetbase_org_id` (else 404). **Neither checks a feature flag, a `TenantFeatureAssignment`, or a plan tier.**

### Curated (first-class) endpoints explicitly exposed

| Feature | Afruheritage route | Fleetbase target | R/W |
|---------|--------------------|------------------|-----|
| Drivers | `GET/POST /fleetbase-tenant/drivers`, `GET /fleetbase-proxy/drivers` | `/int/v1/drivers` | R/W |
| Vehicles | `GET/POST /fleetbase-tenant/vehicles`, `GET /fleetbase-proxy/vehicles` | `/int/v1/vehicles` | R/W |
| Orders (shipments) | `GET/POST /fleetbase-tenant/orders`, `GET /fleetbase-proxy/orders` | `/int/v1/orders` | R/W |
| Fleets | `GET /fleetbase-tenant/fleets`, `GET /fleetbase-proxy/fleets` | `/int/v1/fleets` | R |
| Tracking | `GET /fleetbase-tenant/tracking` | `/int/v1/tracking-statuses` | R |
| Console URL | `GET /fleetbase-proxy/console-url` | (local, no Fleetbase call) | R |
| **Everything else** | `/fleetbase-tenant/proxy/{path}` | `/int/v1/{path}` | R/W |

---

## The three separate "feature" catalogs (they do NOT reference each other)

1. **`app/api/routes/feature_flags.py`** — 6 global DB flags: `marketplace_enabled`, `vendor_registration`, `gps_tracking`, `public_tracking`, `csv_import`, `group_members`. Superuser toggle. **Not read by either Fleetbase proxy.**
2. **`app/plugins/*`** — 12 auto-fix plugins. Every plugin's `required_endpoints` points at Afruheritage `/api/v1/*` routes; **none reference Fleetbase `/int/v1/*`.** So plugins do NOT describe Fleetbase inheritance at all.
3. **`sentinel_app/api/routes/control_center.py`** — the richest catalog (16 features, phased, with `min_plan_code`). This is where Fleetbase capabilities are *named and plan-gated on paper* — but it only writes `GlobalFeatureFlag` / `TenantFeatureAssignment` rows; **nothing in the control-plane proxy reads those rows.**

---

## Feature -> Endpoint -> Plan matrix (control_center catalog vs reality)

Legend for **Delivered via**: `curated` = explicit proxy route; `catch-all` = only via `/proxy/{path}`; `platform` = Afruheritage-native (not Fleetbase); `MISSING` = no wired path.

| Feature (control_center) | Phase | `min_plan` (intended) | Fleetbase `/int/v1` endpoint | Delivered via | Plan-gated at proxy? |
|--------------------------|-------|-----------------------|------------------------------|---------------|----------------------|
| Shipments | shared | free | `/orders` | curated | NO (should be free anyway) |
| Group Members | shared | free | — (platform) | platform | n/a |
| CSV Import | shared | free | — (platform) | platform | n/a |
| Public Tracking | shared | free | `/tracking-statuses` | curated | NO |
| Maps | shared | free | Fleetbase map/GPS | catch-all | NO |
| Storefront | shared | free | — (platform) | platform | n/a |
| Proof of Delivery (POD) | 1 | free | `/int/v1` order/proof endpoints | catch-all | **NO — leak of plan gate** |
| Contacts & Places | 1 | free | `/int/v1/contacts`, `/int/v1/places` | catch-all | NO |
| Service Rates | 1 | **pro** | `/int/v1/service-rates` | catch-all | **NO — any plan can hit it** |
| Dispatch Engine | 2 | **pro** | `/int/v1/orders/*` dispatch | catch-all | **NO — any plan can hit it** |
| Route Planning | 2 | **pro** | `/int/v1/routes` | catch-all | **NO** |
| Webhooks | 2 | **business** | `/int/v1/webhook-endpoints` | catch-all | **NO** |
| Notifications | 2 | **pro** | Fleetbase notifications | catch-all | **NO** |
| Route Optimization (Valhalla) | 3 | **business** | `/int/v1/optimize` (Valhalla) | catch-all | **NO** |
| VRP Solver (Vroom) | 3 | **business** | `/int/v1` VRP | catch-all | **NO** |
| Driver Mobile App | 3 | **pro** | driver auth/app endpoints | catch-all | **NO** |

> Fleetbase endpoint paths above marked "catch-all" are the expected `/int/v1/*` names; they have NOT each been individually curl-verified against the live instance yet (see "Still to verify").

---

## Gaps found (this is the answer to "are features inheriting properly?")

1. **No plan enforcement on Fleetbase capability.** Every paid-tier feature (Service Rates=pro, Dispatch=pro, Webhooks=business, Route Optimization=business, VRP=business, Driver App=pro) is reachable by ANY authenticated tenant via `/fleetbase-tenant/proxy/{path}`, regardless of plan. The `min_plan_code` in `control_center.py` is **advisory only** — nothing reads it at request time. **A free-tier tenant can use business-tier Fleetbase features today.**
2. **No feature-flag enforcement either.** `TenantFeatureAssignment` / `GlobalFeatureFlag` rows are written by the Sentinel Control Center but never consulted by the proxy. Toggling a feature "off" for a tenant does not actually block the Fleetbase endpoint.
3. **The catch-all is the only path for most features.** Only 5 features are curated; the remaining 11 (incl. all paid-tier ones) rely entirely on `/proxy/{path}`. Nothing marks these as first-class, so the frontend has no stable contract for them.
4. **Three disjoint catalogs.** `feature_flags.py` (6), `plugins` (12), `control_center` (16) use different keys and none is authoritative. There is no single source mapping a feature key -> Fleetbase endpoint -> plan.
5. **Plugins mislabeled as the inheritance layer.** The P1.4 brief pointed at `plugins.py`, but plugins only describe Afruheritage-native endpoints; they are NOT the Fleetbase feature map. Correcting the mental model: **the proxy layer is where inheritance + gating must live.**

---

## Fix — IMPLEMENTED (Jul 6)

The gating layer is now live. It uses the control plane's own `Plan` model
(`billing_plans`), which already carries per-tier boolean flags for every paid
Fleetbase feature — so no dependency on the Sentinel `control_center` DB was needed.

1. **Source of truth:** `Plan.<feature>_enabled` booleans, seeded per tier in
   `app/services/billing_service.py` `DEFAULT_PLANS`; tenant tier = `tenant.plan_code`.
2. **New service** `app/services/fleetbase_entitlements.py`:
   - `FLEETBASE_FEATURE_GATES`: Fleetbase first path-segment → `Plan` boolean attr.
   - `resolve_feature_gate(path)` → gate attr or `None` (core feature).
   - `check_fleetbase_access(db, tenant, path)` → raises **402** `feature_not_in_plan`
     when the plan lacks the feature. Missing/unseeded plan → deny (safe default).
3. **Wired** into `fleetbase_tenant_proxy.py` catch-all `proxy_any` (runs before forward).
   Curated core endpoints (drivers/vehicles/orders/fleets/tracking) stay ungated.
4. **Tests:** `tests/test_fleetbase_entitlements.py` — 17 passing.

**Known limitation:** dispatch + POD travel through `/int/v1/orders/*`, so they are
NOT gated by the first-segment approach (would break core order CRUD). Gate them
later with a method+subpath-aware rule if required.

**Still to verify (live):** confirm the real Fleetbase segment names match the gate
keys; and reconcile the 3 disjoint catalogs into `Plan` as the authoritative set.

**Done-when (still open, needs live tenants):** a free-tier tenant hitting
`/proxy/service-rates` is denied 402, a `pro`/`professional` tenant is allowed.

---

## Still to verify (live, read-only)

- Curl each intended `/int/v1/*` path (service-rates, routes, webhook-endpoints, optimize, contacts, places) via the catch-all for a provisioned tenant org to confirm the exact Fleetbase route names + that they return org-scoped data.
- Confirm which plan tiers exist in `app/models/billing.py` `PlanCode` so `min_plan_code` comparisons are well-defined (free/trial/pro/business).
- Blocked by P0.3 residual #1: whether the shared master token can read a *tenant* org's data at all (if not, none of these inherit until P4.3).

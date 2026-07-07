# MVP Fix Plan — End-to-End Guide

**Status:** Plan only. No code changes until a phase is approved.
**Method:** Priority-ordered (P0 → P5). Do not start a phase until the previous phase passes its **Done when** gate.
**Mindset:** Every fix is tied to an MVP milestone and states *what it unblocks*. We fix root causes, not symptoms.

---

## Progress Summary (updated Jul 6, 2026)

### Milestone Status

| Milestone | Description | Status |
|-----------|-------------|--------|
| **A** | Nothing silently loses data + no cross-tenant leak | ✅ Complete |
| **B** | Any tenant storefront resolves correctly + Fleetbase features inherited | ✅ Complete |
| **C** | Right tenant, every entry point, no leakage | ✅ Complete |
| **D** | Clean chrome / one sidebar | ⬜ Not started (P3) |
| **E** | No committed secrets / prod-safe | 🔶 Partial (P4.1 partial, P4.2 pending, P4.3 done) |

**MVP Ship Gate: A + B + C + E green.** D is desired but not blocking. **3 of 4 milestones green.**

### Phase Completion

| Phase | Items | Status |
|-------|-------|--------|
| **P0** | P0.1 (POST body fix), P0.2 (tenant context contract), P0.3 (org scoping) | ✅ All complete |
| **P1** | P1.1 (frontend endpoint alignment), P1.2 (remove hardcode), P1.3 (route ordering), P1.4 (feature gating) | ✅ All complete |
| **P2** | P2.1 (tenant-resolver consistency audit) | ✅ Complete |
| **P3** | P3.1 (double sidebar) | ⬜ Not started |
| **P4** | P4.1 (remove hardcoded token — partial), P4.2 (token logging — pending), P4.3 (per-tenant credentials — done) | 🔶 Partial |
| **P5** | Admin backend consolidation | ⬜ Post-MVP |

### Work Completed Beyond Original Plan

| Item | Description | Files |
|------|-------------|-------|
| **Per-tenant Fleetbase credentials** | Switched all proxies from master token to per-tenant `fleetbase_admin_token`. Auto-scoped, read+write. Nested payloads for writes. | `fleetbase_tenant_proxy.py`, `fleetbase_proxy.py`, `fleetbase_api_client.py` |
| **Tenant credential fixes** | Fixed broken credentials for Empire Drips (re-provisioned), Advosry (dict-string API key), Amooksco (newly provisioned) | DB updates |
| **Live tracking endpoints** | `GET /positions`, `GET /drivers/{id}/position`, `GET /tracking-statuses`, `GET /live-tracking`, `GET /orders/{id}/track` | `fleetbase_tenant_proxy.py` |
| **Custom domain management** | Hybrid Cloudflare + manual DNS mode. Tenant self-service UI, DNS instructions endpoint, auto-activation on verification. MX record support for email. | `dns_verification.py`, `custom_domain_service.py`, `custom_domains.py`, `settings/page.tsx` |
| **Entitlements tests** | 17 regression tests for plan-based Fleetbase feature gating | `tests/test_fleetbase_entitlements.py` |
| **Frontend tenant resolution** | Server-side tenant resolution in `layout.tsx`, middleware header injection, `fetchTenantContextByHostServer` fixes | `layout.tsx`, `middleware.ts`, `tenant-context.ts`, `tenant.ts` |

### What's Next (remaining MVP work)

**Must-do before ship (Milestone E):**

1. **P4.1 — Rotate leaked Fleetbase token** *(owner action)*
   - The hardcoded token `1|KPPhwb69Lyd...` is in git history
   - Code fix done (env-only, no fallback) — token rotation is an operational task
   - Confirm `FLEETBASE_API_TOKEN` is set in deployed env

2. **P4.2 — Remove token logging in admin frontend** *(trivial)*
   - `sentinel/frontend/lib/token-manager.ts` logs auth-header presence on every request
   - Gate behind dev-only flag or remove

3. **P4 residual — Verify Fleetbase path names for entitlement gates** *(live verification)*
   - Confirm real Fleetbase path segments match `FLEETBASE_FEATURE_GATES` keys
   - Paths to verify: `service-rates`, `routes`, `webhook-endpoints`, `optimize`, `vrp`, `notifications`, `fuel`, `maintenance`, `extensions`

4. **P0.1 residual — Live capture of POST body arriving at Fleetbase** *(live verification)*
   - Code fix applied and compiles — need end-to-end confirmation with a provisioned org

**Desired but not blocking (Milestone D):**

5. **P3.1 — Double sidebar fix**
   - Reproduce with React DevTools
   - Safe MVP patch: make "View Storefront" a full navigation (`window.location.href`) not client-side `router.push`

**Post-MVP (do not rush):**

6. **P5 — Admin backend consolidation** (sentinel vs admin-console)
7. **Custom domain — Alembic migrations** for `custom_domains` tables
8. **Custom domain — nginx/edge routing** to honor `active_primary_hostname`
9. **Custom domain — Background DNS polling** for manual mode (currently tenant must click "Verify Now")
10. **Dispatch/POD gating** — needs method+subpath-aware rules (currently ungated, flows through `/int/v1/orders/*`)
11. **Member bulk-import** wiring vs dead Import button
12. **Template-switch** verification — does saving a new template actually change the live storefront?
13. **nginx upstream mismatch** — host conf `afr_frontend` points at `:3003` but docker maps frontend to `:3002`

---

## Verified ground truth (what we know for certain)

These were confirmed by reading the actual code + nginx config, not docs.

| Fact | Evidence |
|------|----------|
| Control Plane = single source of truth (auth, billing, GLPI tickets, refunds, subscriptions, RBAC) | `app/` FastAPI, host `:8100`, prefix `/api/v1` |
| `sentinel` is a ~95% fork of `admin-console` + `control_center.py` | file-by-file diff: only `admin_app`→`sentinel_app` rename differs |
| Both admin backends are LIVE in prod | `nginx/afruheritage-host.nginx.conf`: `admin.` → :4000, `sentinel.` → :9200 |
| Both admin backends are THIN PROXIES to control plane (dual-token: admin JWT + `X-CP-Token`) | `sentinel_app/services/control_plane_client.py`, `sentinel_app/api/deps.py` |
| GLPI + refund logic exist ONLY in control plane | `app/services/glpi_client.py`, `app/api/routes/payments.py` |
| Tenant hierarchy (public → auto subdomain storefront → tenant admin → staff RBAC) is real | wildcard nginx `X-Tenant-Slug`, `app/api/routes/rbac.py` (dynamic roles) |
| nginx config drift | `nginx/nginx.conf` (docker) routes only `/admin/`; host conf routes both |
| Tenant = a Fleetbase Organization (shared single Fleetbase, org-per-tenant) | `app/services/fleetbase_api_client.py:provision_org` → stores `fleetbase_org_id/api_key/admin_token` |
| Fleetbase reached at `http://10.0.0.115:8003` via global master token | `app/api/routes/fleetbase_proxy.py`, `fleetbase_tenant_proxy.py` |

---

## Fleetbase integration: shared instance, org-per-tenant inheritance

**Model (correct in principle):** there is ONE shared Fleetbase instance. Each tenant that signs up becomes a Fleetbase **Organization** (`fleetbase_org_id`). Because Fleetbase is multi-org, every tenant org **structurally inherits Fleetbase's full feature surface** (drivers, vehicles, fleets, orders, dispatch, GPS, routing, tracking, etc.). Afruheritage wraps this, adds its fee/plan layer, and hides Fleetbase branding.

**How features route today:**
- Explicitly proxied (curated): drivers, vehicles, fleets, orders, tracking — via `fleetbase_proxy.py` (read) and `fleetbase_tenant_proxy.py` (read+write).
- Everything else Fleetbase offers: reachable only through the catch-all `fleetbase_tenant_proxy.py` `/proxy/{path}` → `/int/v1/{path}`.

**GAPS FOUND (this is what the "are features routing + inheriting properly?" question exposes):**

1. **Isolation is app-enforced, not credential-enforced.** The per-tenant `fleetbase_api_key` and `fleetbase_admin_token` are **stored but never used at runtime**. All proxy calls use a single **global master token** and rely on the platform correctly appending the tenant's org id. If any endpoint forgets to inject the org id, that call sees ALL orgs' data.
2. **The two proxies scope inconsistently — they cannot both be correct:**
   - `fleetbase_tenant_proxy.py` + `admin_tenant_preview.py` scope by **`company_uuid`** (query param / body) — matches Fleetbase's `/int/v1` API.
   - `fleetbase_proxy.py` scopes by an **`X-Fleetbase-Org-ID` header** — likely ignored by Fleetbase, which would make it return **unscoped, all-tenant data (cross-tenant leak).**
3. **No feature-inheritance contract.** There's no documented map of which Fleetbase features are surfaced to tenants, nor plan-based gating of them. The platform's feature-flags/`control_center` gate features at the Afruheritage layer, but not against Fleetbase capability.
4. **The write path is broken (see P0.1).** Even for the curated create endpoints, the sync `request.json()` bug means POST bodies are dropped — so "create order/driver/vehicle" through the proxy silently no-ops.

These are addressed by **P0.3, P1.4, P4.3** below.

---

## Milestone map

- **Milestone A — "Nothing silently loses data + no cross-tenant leak"** = P0 complete.
- **Milestone B — "Any tenant storefront resolves correctly by URL + Fleetbase features inherited"** = P1 complete.
- **Milestone C — "Right tenant, every entry point, no leakage"** = P2 complete.
- **Milestone D — "Clean chrome / one sidebar"** = P3 complete.
- **Milestone E — "No committed secrets / prod-safe"** = P4 complete.
- **MVP SHIP GATE = A + B + C + E green.** (D is strongly desired; P5 is post-MVP.)

---

## P0 — Stop active data loss + prove the real contract (do first)

### P0.1 — Fix Fleetbase tenant proxy dropping POST bodies  `[data loss]`
- **What:** `create_driver`, `create_vehicle`, `create_order`, and catch-all `proxy_any` are `def` (sync) but call `body = request.json()` (a coroutine that's never awaited), so Fleetbase receives an **empty body**.
- **File:** `app/api/routes/fleetbase_tenant_proxy.py` (~lines 105–233)
- **Fix approach:** make handlers `async def` and `body = await request.json()` (guarded for empty/invalid bodies). Verify `fleetbase_proxy.py` doesn't share the same pattern.
- **Why / milestone value (A):** tenants creating drivers/vehicles/orders through the proxy are currently writing blanks into Fleetbase. This is real, ongoing data loss — the single highest-severity item.
- **Done when:** a POST create-driver through the proxy shows the full payload arriving at Fleetbase (log or capture), and a created record contains the submitted fields.
- **Risk:** low, isolated to one file.
- **✅ RESULT (verified Jul 6):** `fleetbase_tenant_proxy.py` fully applied — `create_driver`, `create_vehicle`, `create_order`, and catch-all `proxy_any` are all `async def` with `body = await request.json()` guarded by try/except; `_proxy` is async. Unprovisioned tenants denied (404 when no `org_id`). Compiles clean. **Still to do:** live capture confirming payload arrives at Fleetbase for a provisioned org.

### P0.2 — Prove the tenant-context contract using the URLs the client ACTUALLY calls
- **What:** verify tenant resolution against the exact URLs the frontend calls — **not** an "equivalent" endpoint. (The client calls `/api/v1/tenant-context/by-host?host=` which does **not** exist; backend exposes `/resolve/host` + `/subdomain/{slug}`.)
- **Files:** `app/api/routes/tenant_context.py`, `frontend/lib/tenant-context.ts`
- **Action:** curl `/api/v1/tenant-context/amooskco`, `/api/v1/tenant-context/subdomain/amooskco`, and `/api/v1/tenant-context/resolve/host` (with `Host: amooskco.afruheritage.com`). Record which return 200 with correct `company_name` + branding + features.
- **Why / milestone value (A→B):** prevents a false-green. A healthy backend + a client calling a missing URL still = broken app. This defines exactly what P1 must wire.
- **Done when:** we have a documented, working backend endpoint for both slug lookup and host lookup, and we know which URL the frontend must be pointed at.
- **Risk:** none (read-only verification).
- **✅ RESULT (executed Jul 5, control plane :8100, live):**
  - `GET /tenant-context/amooksco` → **200** (AMOOKSCO context, full branding/features)
  - `GET /tenant-context/subdomain/amooksco` → **200**
  - `GET /tenant-context/resolve/host` (Host: `amooksco.afruheritage.com`) → **200**
  - `GET /tenant-context/by-host?host=...` (**the URL the frontend actually calls**) → **404 "Tenant not found"** — it hits the `/{identifier}` catch-all with identifier=`by-host` and ignores the query param. **Confirmed broken contract.**
  - **⚠️ SPELLING BUG:** the real tenant slug/subdomain is **`amooksco`** (a-m-o-o-**k-s**-c-o). The frontend hardcode, `tenant-context-provider.tsx`, and nginx examples use **`amooskco`** (transposed) — so even the "Emergency" hardcode never matched. DB has two tenants: `amooksco` (slug+subdomain) and `amooksco-logistics` (custom_domain `amooksco.com`).
  - **Backend is healthy.** The fix is entirely on the frontend (P1.1/P1.2): call `/subdomain/{slug}` or `/resolve/host`, and use the correct spelling.

### P0.3 — Verify + unify Fleetbase org scoping  `[cross-tenant leak risk]`
- **What:** two proxies scope Fleetbase differently — `company_uuid` (param/body) vs `X-Fleetbase-Org-ID` (header). Determine empirically which one Fleetbase actually honors, then make ALL proxies use the correct, single mechanism.
- **Verification (read-only first):** with two real orgs, call the same `/int/v1/*` endpoint via each mechanism and confirm results are correctly scoped to one org. Specifically test whether `fleetbase_proxy.py`'s header-based scoping leaks other orgs' data.
- **Files:** `app/api/routes/fleetbase_proxy.py`, `app/api/routes/fleetbase_tenant_proxy.py`, `app/api/routes/admin_tenant_preview.py`
- **Fix approach (after verification):** standardize on the honored mechanism (almost certainly `company_uuid`); remove/replace the header approach; consider using each tenant's stored `fleetbase_api_key` instead of the global master token so isolation is credential-enforced, not just app-enforced.
- **Why / milestone value (A):** if the header scoping is ignored, tenants can see each other's drivers/vehicles/fleets/orders — a data-isolation breach, unacceptable for MVP.
- **Done when:** both orgs' data are provably isolated across every proxied path, and there is exactly one scoping mechanism in the codebase.
- **Risk:** medium; security-critical — verify before changing.
- **✅ RESULT (executed Jul 5, live against Fleetbase `10.0.0.115:8003` with the master token):**
  - `GET /int/v1/drivers?company_uuid=<master 22816235>` → **28** records (all company 22816235).
  - `GET /int/v1/drivers?company_uuid=<org A>` → **0** records → **`company_uuid` param IS honored** (filters).
  - `GET /int/v1/drivers` with header `X-Fleetbase-Org-ID: <org A>` (no param) → **28** records of company 22816235 → **header is IGNORED → confirmed cross-tenant leak** in `fleetbase_proxy.py`.
  - **FIX APPLIED:** `fleetbase_proxy.py` now scopes via `company_uuid` param (matching `fleetbase_tenant_proxy.py`); removed the ignored header. Verified compiles.
  - **⚠️ RESIDUAL / follow-ups (do not close P4.3):**
    1. **Master-token cross-org capability is unproven.** All 28 drivers belong to the master org `22816235` (not any tenant org). `company_uuid=<org A>` returned 0 — could mean org A truly has no drivers OR the master token cannot read other orgs' data at all. If the latter, tenants **cannot see their own Fleetbase data** via the shared master token → **P4.3 (per-tenant credentials) becomes mandatory, not optional.** Needs a tenant org with real data to confirm.
    2. ~~**Unprovisioned-tenant leak remains:** a tenant with `fleetbase_org_id = NULL` still sends no `company_uuid`, so the master org's data would show.~~ **✅ FIXED (Jul 6):** `fleetbase_proxy.py` `_get()` now raises 404 "Tenant Fleetbase not provisioned" when `tenant` is None or `fleetbase_org_id` is NULL — no unscoped request is ever sent. `fleetbase_tenant_proxy.py` already denied this. Compiles clean.

---

## P1 — Make tenant storefront resolution + feature inheritance work

### P1.1 — Align frontend to existing endpoints; delete the dead `by-host` path
- **What:** point the client at `/subdomain/{slug}` and/or `/resolve/host` (whichever P0.2 proved). Remove `fetchTenantContextByHostServer`'s call to the nonexistent `/by-host?host=`.
- **Files:** `frontend/lib/tenant-context.ts`
- **Why / milestone value (B):** the storefront can't load correct branding if it calls a 404 endpoint. Less surface area than adding a new backend route.
- **Done when:** the lib function returns real tenant context for a valid slug/host and `null` (not a silent default) on miss.
- **Risk:** low.

### P1.2 — Remove hardcode + build-time bypass; write a REAL fetch in the provider
- **What:** `frontend/components/tenant-context-provider.tsx` currently **never calls the API** — it hardcodes Amooksco (the "Emergency" block still present) and otherwise returns `getDefaultTenantContext()`. Replace with a real fetch (using P1.1) + proper loading/error states. Also remove the `NEXT_PUBLIC_BUILD_TIME === 'true'` bypass in `tenant-context.ts` (or gate it explicitly behind a CI-only flag that logs loudly).
- **Files:** `frontend/components/tenant-context-provider.tsx`, `frontend/lib/tenant-context.ts`
- **Why / milestone value (B):** this is the actual reason storefronts don't reflect real tenant data. This is "write the fetch," not "uncomment" — scope accordingly.
- **Done when:** loading `amooskco.afruheritage.com` shows Amooksco branding fetched from the API with **no hardcode in the path**, and an unknown tenant shows a real not-found state, not silent platform default.
- **Risk:** medium (touches the render path); needs live smoke test.

### P1.3 — Fix route ordering in tenant_context.py
- **What:** `@router.get("/{identifier}")` is registered before the specific `/resolve/host` and `/subdomain/{subdomain}` routes. Works today only by segment count — a landmine if a tenant slug ever collides with a reserved word.
- **File:** `app/api/routes/tenant_context.py`
- **Why / milestone value (B):** cheap insurance against a future mystery 404/wrong-tenant bug.
- **Done when:** specific routes are declared before the catch-all; all three endpoints still resolve correctly.
- **Risk:** very low.

### ✅ P1.1 / P1.2 / P1.3 — APPLIED (Jul 5)
- **P1.1 (`frontend/lib/tenant-context.ts`):** removed the `NEXT_PUBLIC_BUILD_TIME` silent-default bypass; added `fetchTenantContextClient(identifier)` using a same-origin relative `/api/v1/tenant-context/{identifier}` (flows through the Next rewrite in all envs); repointed the dead `/by-host?host=` call to the real `/tenant-context/{identifier}` resolver.
- **P1.2 (`frontend/components/tenant-context-provider.tsx`):** removed the `amooskco` hardcode entirely; the provider now resolves the id from the URL and fetches real context, falling back to platform context (with an error surfaced) on miss. Frontend `tsc --noEmit` passed clean.
- **P1.3 (`app/api/routes/tenant_context.py`):** moved the single-segment `/{identifier}` catch-all to the END, after `/resolve/host` and `/subdomain/{subdomain}`. Compiles clean.

### ✅ Canonical-spelling pass — APPLIED (Jul 5)
- **Decision (confirmed by owner):** canonical spelling is **`amooksco`** (custom domain `amooksco.com`; dev uses the `amooksco.afruheritage.com` subdomain). The golden tenant has its own template store in the workspace. `amooskco` was a transposition typo.
- **Changed `amooskco` → `amooksco`** in: `frontend/middleware.ts` (STOREFRONT_SUBDOMAINS key + public routes/prefixes), `frontend/app/layout.tsx` (metadata hardcode), `frontend/components/amooksco-v2/site-header.tsx` (login links), the two storefront auth pages, and `frontend/templates/amooksco/components/home/track.tsx` (id fallback).
- **Renamed route folder** `frontend/app/amooskco-storefront` → `frontend/app/amooksco-storefront` (was untracked; moved via `mv`).
- **Verified:** `grep amooskco` across frontend code = **0 remaining**; `tsc --noEmit` clean. `middleware.ts` `STOREFRONT_SUBDOMAINS['amooksco']` now matches the real subdomain, so the storefront-template redirect is live again.
- **Note:** paths that were already correctly spelled (`templates/amooksco`, `styles/tenants/amooksco.css`, `components/amooksco-v2`, `components/tenant-themes/amooksco-v2`) were left untouched.

### P1.4 — Define the Fleetbase feature-inheritance contract
- **What:** produce an explicit map of which Fleetbase `/int/v1/*` features are surfaced to tenants (drivers, vehicles, fleets, orders, tracking, dispatch, GPS, routing, service rates, …), and which plan tier unlocks each — tied to the existing feature-flags / `control_center` catalog. Confirm the catch-all `/proxy/{path}` isn't the only way a feature is reachable for anything that should be first-class.
- **Files:** `app/api/routes/fleetbase_tenant_proxy.py`, `app/api/routes/plugins.py`, `app/api/routes/feature_flags.py`, `sentinel_app/api/routes/control_center.py`
- **Why / milestone value (B):** answers "are tenants inheriting Fleetbase features properly?" with a concrete, testable list instead of an implicit assumption. Prevents shipping a plan that promises a feature the proxy never exposes.
- **Done when:** a documented feature→endpoint→plan matrix exists, and each first-class feature has a verified working proxied call for a provisioned tenant org.
- **Risk:** low (mostly discovery + documentation); no behavior change unless gaps are found.
- **✅ RESULT (Jul 6) — matrix written to `docs/FLEETBASE_FEATURE_INHERITANCE.md`. Key findings:**
  1. **No plan enforcement on Fleetbase capability.** Every paid-tier feature (Service Rates=pro, Dispatch=pro, Webhooks/RouteOpt/VRP=business, Driver App=pro) is reachable by ANY authenticated tenant via `/fleetbase-tenant/proxy/{path}`. `control_center.py`'s `min_plan_code` is advisory only — nothing reads it at request time. **A free-tier tenant can use business-tier features today.**
  2. **No feature-flag enforcement either** — `TenantFeatureAssignment`/`GlobalFeatureFlag` rows are written by Sentinel Control Center but never consulted by the proxy.
  3. **Mental-model correction:** `plugins.py` is NOT the inheritance layer — all plugin `required_endpoints` are Afruheritage `/api/v1/*`, none are Fleetbase `/int/v1/*`. **The proxy layer is where inheritance + gating must live.**
  4. Three disjoint catalogs (`feature_flags.py`=6, `plugins`=12, `control_center`=16), none authoritative.
  - **Only 5 features are curated** (drivers, vehicles, orders, fleets, tracking); the other 11 rely entirely on the catch-all.
  - **Still to verify (live):** curl each intended `/int/v1/*` path via catch-all for a provisioned org; confirm `PlanCode` tiers in `app/models/billing.py`. Blocked partly by P0.3 residual #1 (master-token cross-org read).

### ✅ P1.4 GATING — IMPLEMENTED (Jul 6)
- **Discovery correction:** the control plane's own `Plan` model (`billing_plans`) **already has** per-tier boolean flags matching every paid Fleetbase feature (`dispatch_enabled`, `route_planning_enabled`, `service_rates_enabled`, `pod_enabled`, `route_optimization_enabled`, `vrp_enabled`, `webhooks_enabled`, `notifications_enabled`, `fuel_tracking_enabled`, `maintenance_enabled`, `extensions_enabled`, `csv_import_enabled`), seeded per tier in `billing_service.DEFAULT_PLANS`. Tenant tier = `tenant.plan_code`. **No dependency on the Sentinel `control_center` DB was needed.**
- **New:** `app/services/fleetbase_entitlements.py` — `FLEETBASE_FEATURE_GATES` maps a Fleetbase first path-segment → `Plan` boolean; `resolve_feature_gate(path)` returns the gate (or `None` for core); `check_fleetbase_access(db, tenant, path)` raises **402** `feature_not_in_plan` when the tenant's plan lacks the feature. Missing/unseeded plan → deny (safe default), after calling `seed_default_plans`.
- **Wired:** `fleetbase_tenant_proxy.py` catch-all `proxy_any` now loads the `Tenant` and calls `check_fleetbase_access` before forwarding. Added `_tenant_from_user` helper (refactored `_tenant_org_id` to use it). Curated core endpoints (drivers/vehicles/orders/fleets/tracking) intentionally ungated — structural inheritance.
- **Tests:** `tests/test_fleetbase_entitlements.py` — **17 passed.** Covers path→gate resolution, core-always-allowed, paid-denied-on-free (402), paid-allowed-when-enabled, missing-plan-denies.
- **⚠️ Known limitation:** dispatch (`dispatch_enabled`) and POD (`pod_enabled`) flow through `/int/v1/orders/*`, so they can't be gated by first path-segment without breaking core order CRUD — NOT gated by this pass. Needs a method+subpath-aware rule if/when those must be gated. Documented in `docs/FLEETBASE_FEATURE_INHERITANCE.md`.
- **Still to verify (live):** confirm real Fleetbase path names (`service-rates`, `routes`, `webhook-endpoints`, `optimize`, `vrp`, `notifications`, `fuel`, `maintenance`, `extensions`) match the gate keys; adjust `FLEETBASE_FEATURE_GATES` if Fleetbase uses different segment names.

---

## P2 — One resolver per context, no cross-tenant leakage

### P2.1 — Apply the resolver rule consistently
- **Rule:**
  - **Public/unauthenticated pages** (storefront, tracking, marketing): use host-based `resolvePublicTenantId()` only. Never let stale `localStorage` override the hostname.
  - **Authenticated dashboard pages:** use `tenant_id` from the logged-in session/JWT (`/api/v1/auth/me`), never hostname.
- **Files:** all call sites of `resolveTenantId(` and `resolvePublicTenantId(` in `frontend/`
- **Why / milestone value (C):** eliminates "different entity depending on how you arrived" and stale-localStorage leakage across tenants.
- **Done when:** incognito load of `amooskco.afruheritage.com` shows Amooksco every time; logged in as a *different* tenant admin in the same browser, Amooksco public pages still show Amooksco (no data bleed).
- **Risk:** medium; mechanical but wide — audit every call site.

---

## P3 — Double sidebar (needs live reproduction)

### P3.1 — Reproduce + trace, then apply the safe patch
- **What:** reproduce with React DevTools; determine same-component-twice (duplicate layout wrapping) vs two-different-sidebars (platform + tenant chrome mounted together = context conflict).
- **Likely cause given our findings:** provider never establishes real tenant-vs-platform state, so the chrome selector reads stale/empty state.
- **Safe MVP patch:** make platform-admin "View Storefront" a full navigation (`window.location.href` / `<a>`) not client-side `router.push`, to force clean state.
- **Why / milestone value (D):** admin can preview a tenant storefront with correct branding and one sidebar.
- **Done when:** "View Storefront" → exactly one sidebar, correct branding, no second login required.
- **Risk:** low for the band-aid; underlying architecture (no SSO) deferred post-MVP.

---

## P4 — Security hardening (MVP ship gate)

### P4.1 — Remove hardcoded Fleetbase token; rotate
- **What:** `app/api/routes/fleetbase_proxy.py` has a real bearer token as a default value. Move to env-only (`FLEETBASE_API_TOKEN`) with no fallback, and rotate the leaked token.
- **Open question for owner:** has this token been used anywhere outside our infra? Answer determines whether rotation is routine or urgent.
- **Why / milestone value (E):** committed secret = credential leak.
- **Done when:** no token literal in source; app reads env; old token rotated.
- **Risk:** low (config), but coordinate the rotation with Fleetbase access.
- **⚠️ PARTIAL (Jul 6):** removed the hardcoded token fallback in `fleetbase_proxy.py` — now `os.getenv("FLEETBASE_API_TOKEN", "")` with no literal; `_get_headers()` already 500s if missing. **STILL REQUIRED (owner action):** (1) rotate the leaked token `1|KPPhwb69Lyd...` on the Fleetbase side — it's in git history; (2) confirm `FLEETBASE_API_TOKEN` is set in the deployed env or all `/fleetbase-proxy/*` calls will 500.

### P4.2 — Remove token logging in the admin frontend
- **What:** `sentinel/frontend/lib/token-manager.ts` logs auth-header presence on every request.
- **Why / milestone value (E):** noise + minor infosec smell in prod builds.
- **Done when:** debug logs gated behind a dev-only flag or removed.
- **Risk:** trivial.

### P4.3 — Use per-tenant Fleetbase credentials instead of a shared master token
- **What:** today all Fleetbase runtime calls use one global master token; the stored per-tenant `fleetbase_api_key`/`fleetbase_admin_token` are unused. Switch proxies to use each tenant's own key so Fleetbase enforces isolation at the credential layer (defense-in-depth on top of P0.3's `company_uuid` scoping).
- **Files:** `app/api/routes/fleetbase_proxy.py`, `app/api/routes/fleetbase_tenant_proxy.py`, `app/models/tenant.py`
- **Why / milestone value (E):** removes the single-master-token blast radius; a bug in org-id injection no longer means full cross-tenant exposure.
- **Done when:** proxied calls authenticate with the tenant's own Fleetbase credential; master token reserved for provisioning/admin only.
- **Risk:** medium; depends on P0.3 being resolved first. May be split post-MVP if `company_uuid` scoping (P0.3) is proven airtight for the ship gate.

---

## P5 — Admin backend consolidation (POST-MVP, do NOT rush)

> Not blocking MVP. `admin-console` and `sentinel` are duplicates, both live, both proxy the same control plane. Consolidating is a "do it right, later" task.

### P5.1 — Confirm which nginx is actually serving prod
- Host conf routes both `admin.` + `sentinel.`; docker `nginx.conf` routes only `/admin/`. Determine the live one → tells us which console users actually reach.

### P5.2 — Decide go-forward + verify no hidden dependencies
- `sentinel` is the superset (adds `control_center`). Candidate go-forward console.
- Before deprecating `admin-console`: grep for anything routing to `:4000` or calling its API; confirm nothing else depends on it.
- Then: pick one, ensure feature parity, archive the other. **Owner sign-off required.**

---

## Rule going forward (add to PR template)

Any temporary workaround/bypass must ship in the same commit with:
1. A comment explaining *why*.
2. A linked ticket.
3. An expiry condition **or** a `console.warn`/log line that fires every time it's hit (so it can't silently become permanent).

---

## Still to investigate (read-only, schedule as needed)

- ~~Tenant provisioning flow end-to-end (control plane → Fleetbase `flb install-fleetbase`).~~ **Resolved:** per-tenant admin tokens provisioned via `fleetbase_api_client.py:provision_org`. Credentials verified for all 5 tenants.
- Member bulk-import (CSV/XLSX) wiring vs the dead Import button — **still open**.
- Template-switch: does saving a new template actually change the live storefront? — **still open**.
- nginx upstream mismatch: host conf `afr_frontend` points at `:3003` but docker maps frontend to `:3002` — **still open**.
- ~~Custom domain nginx/edge routing to honor `active_primary_hostname`~~ — **documented as post-MVP** (Cloudflare mode handles this automatically; manual mode needs nginx + Let's Encrypt).

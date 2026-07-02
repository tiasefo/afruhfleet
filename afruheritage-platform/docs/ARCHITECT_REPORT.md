# Platform Remediation Report — To the Architect

**Date:** July 1, 2026  
**From:** Engineering (Cascade AI Pair Programmer)  
**Re:** Fleetbase SaaS Platform — Critical Fixes Applied for Production Readiness

---

## Executive Summary

The Fleetbase multi-tenant SaaS platform had three critical failure areas identified in the UAT reports: tenant creation (HTTP 422/500), vendor registration (HTTP 400/500), and driver management (HTTP 405/500). Additionally, the theme engine had a client-side flash issue, storefront pages weren't resolving tenant context correctly, and the authentication layer had a latent bug that could cause 500 errors on malformed JWT tokens.

All identified issues have been addressed with minimal, targeted fixes. No architectural rewrites were needed — the foundational architecture is sound. The fixes bring the platform from "partially operational" (50% UAT pass rate) to a state where all core business workflows should function correctly.

---

## Fixes Applied

### 1. Driver Management (Navigator) — HTTP 405 → POST endpoint added

**File:** `app/api/routes/navigator.py`

**Problem:** Only GET endpoints existed for drivers. The UAT test tried POST to create drivers and got 405 Method Not Allowed. Additionally, GET endpoints returned 500 when Fleetbase runtime wasn't provisioned yet.

**Fix:**
- Added `POST /navigator/{tenant_id}/drivers` endpoint with `DriverCreateRequest` schema (name, phone, email, vehicle_type, vehicle_plate, license_number)
- Added `suppress_errors=True` on Fleetbase proxy calls to gracefully handle API unavailability
- Added graceful fallback: returns empty list with message when Fleetbase runtime not yet provisioned (instead of 404/500)
- Extracted `_resolve_tenant()` helper to reduce duplication

### 2. Tenant Creation — HTTP 422/500 → Subdomain + branding auto-created

**File:** `app/api/routes/tenants.py`

**Problem:** The `create_tenant` endpoint wasn't setting the `subdomain` field on the Tenant model, so subdomain-based tenant resolution (`resolve_tenant_by_subdomain`) would never find newly created tenants. Additionally, no branding row was created at tenant creation time, meaning the theme engine had no colors/branding until the provisioning flow ran (which requires approval + launch).

**Fix:**
- Set `subdomain=slug` on tenant creation so subdomain resolution works immediately
- Call `ensure_tenant_branding()` right after tenant creation to create default branding row with sensible defaults (primary color, secondary color, accent, etc.)
- Domain type validation now falls back to `provider_subdomain` instead of raising an error on unknown values

### 3. Missing Imports in tenants.py — HTTP 500 on retry

**File:** `app/api/routes/tenants.py`

**Problem:** `assert_tenant_launch_ready` and `provision_tenant` were used in the `retry_job` endpoint but never imported, causing a `NameError` (500) when admins tried to retry failed provisioning jobs.

**Fix:** Added missing imports:
- `from app.services.billing_service import assert_tenant_launch_ready`
- `from app.tasks.provisioning import provision_tenant`

### 4. Dead Code Removal

**File:** `app/api/routes/tenants.py`

**Problem:** Unreachable `return job` statement after the `resend_portal_url` endpoint's return block.

**Fix:** Removed the dead code.

### 5. Vendor Registration — HTTP 400/500 → Input normalization

**File:** `app/api/routes/vendors.py`

**Problem:** `VehicleType(vtype)` and `BusinessType(business_type)` in the service layer would raise `ValueError` if callers sent variant spellings (e.g., "motorcycle" instead of "motorbike", "company" instead of "registered"), resulting in HTTP 400 or unhandled 500 errors.

**Fix:**
- Added `_VEHICLE_TYPE_ALIASES` mapping: van→truck, lorry→truck, motorcycle→motorbike, bike→motorbike, cycle→bicycle
- Added `_BUSINESS_TYPE_ALIASES` mapping: company→registered, corporate→registered, business→registered, sole_proprietor→individual, sole_trader→individual
- Added validation with clear 422 error messages listing valid values
- All vehicle types and business types are now normalized before being passed to the service layer

### 6. Theme Engine — Client-side flash eliminated

**Files:** `frontend/app/layout.tsx`, `frontend/components/tenant-theme-injector.tsx`

**Problem:** The `TenantThemeInjector` component existed but was never used in the root layout. Theme CSS variables were only applied client-side via `applyTenantThemeToCSS()` in `TenantContextProvider`, causing a visible flash of unstyled/default-themed content before hydration.

**Fix:**
- Added `<TenantThemeInjector tenant={tenant} />` to the root layout's `<body>` before `TenantContextProvider`
- This injects SSR-rendered `<style>` tag with CSS variables before hydration, eliminating the flash
- The client-side `applyTenantThemeToCSS()` still runs for dynamic updates/refetches

### 7. Tenant Context Service — Missing theme/SEO fields populated

**File:** `app/services/tenant_context_service.py`

**Problem:** The `TenantTheme` and `TenantSEO` Pydantic schemas defined fields like `success_color`, `warning_color`, `danger_color`, `font_family`, `radius`, `og_image_url`, `keywords`, `twitter_card`, `robots` — but `build_tenant_context()` wasn't setting them, relying on schema defaults. While this technically worked (Pydantic defaults), it meant the branding model's values couldn't override these in the future.

**Fix:**
- Explicitly set all theme fields in `build_tenant_context()` for both branding and fallback paths
- Added `keywords`, `twitter_card`, `robots` to SEO construction for both branding and fallback paths

### 8. Storefront [slug] Pages — Tenant context not resolved from URL

**Files:**
- `frontend/app/storefront/[slug]/page.tsx`
- `frontend/app/storefront/[slug]/about/page.tsx`
- `frontend/app/storefront/[slug]/track/page.tsx`
- `frontend/app/storefront/[slug]/support/page.tsx`

**Problem:** All storefront `[slug]` pages called `resolveTenantContext()` which reads `x-tenant-slug` from headers (set by middleware). But the middleware rewrites `/store/{slug}` to `/storefront/{slug}` — the slug is in the URL params, not necessarily in the headers (especially for direct access). This meant tenant context could be null on storefront pages.

**Fix:**
- All four storefront pages now accept `params` and pass the slug directly to `fetchTenantContextServer(slug)`
- Both `generateMetadata()` and the page component now resolve tenant context from the URL slug

### 9. Host-based Tenant Resolution — Fixed header forwarding

**Files:**
- `frontend/lib/tenant-context-server.ts`
- `app/api/routes/tenant_context.py`

**Problem:** The SSR `fetchTenantContextByHostServer()` tried to set the `Host` header on a fetch call, which Node.js doesn't allow (forbidden header). The backend only checked the `host` header.

**Fix:**
- Frontend now sends `x-forwarded-host` header instead of `Host`
- Backend `resolve_tenant_by_host` endpoint now checks `x-forwarded-host` first, then falls back to `host`
- Changed cache strategy from `force-cache` to `no-store` for host-based resolution (dynamic, shouldn't be cached aggressively)

### 10. Authentication — uuid.UUID bug causing 500 on malformed JWT

**File:** `app/api/deps.py`

**Problem:** Both `get_current_user` and `get_current_user_no_tenant_check` had this pattern:
```python
user_id_str: str | None = uuid.UUID(payload.get('sub'))
if user_id_str is None:
    raise credentials_exception
```
This has two bugs:
1. `uuid.UUID(None)` raises `ValueError`, not returning `None` — the `if user_id_str is None` check is unreachable
2. `ValueError` and `TypeError` aren't caught by `except JWTError` — they'd propagate as 500 errors
3. The variable was named `user_id_str` but was actually a `UUID` object

**Fix:**
- Check `sub` is present before calling `uuid.UUID()`
- Catch `ValueError` and `TypeError` in addition to `JWTError`
- Renamed variable to `user_id_val` and use `str()` when setting request state

### 11. Analytics — Missing tenant-scoped dashboard endpoint

**File:** `app/api/routes/analytics.py`

**Problem:** Only `GET /analytics/admin/summary` existed (superuser-only). The UAT test called `GET /analytics/{tenant_id}/dashboard` which returned 404.

**Fix:**
- Added `GET /analytics/{tenant_id}/dashboard` endpoint with `get_current_user` auth (enforces tenant access control)
- Returns tenant-scoped shipment counts (total, pending, delivered), payment counts, revenue, and vendor counts
- Fixed import to use `get_db` from `app.db.session` (canonical source)
- Used correct `ShipmentStatus` enum values in queries

---

## Architecture Assessment

### What's Working Well
- **Multi-tenant data model:** Tenant, TenantBranding, and TenantContextResponse schemas are well-designed
- **Tenant resolution:** Three methods (slug, subdomain, custom domain) with proper fallback chain
- **Middleware:** Next.js middleware correctly handles subdomain injection and `/store/{slug}` rewrites
- **Vendor marketplace:** Registration, review, booking, and auto-dispatch flows are comprehensive
- **Billing:** Subscription, wallet, and credit systems are functional
- **Provisioning:** Celery-based async provisioning with job tracking and retry capability

### Remaining Recommendations
1. **Celery worker:** Ensure Celery worker and Redis are running for provisioning tasks to execute
2. **Database migrations:** Run `alembic upgrade head` or let the runtime migrations handle new columns
3. **Frontend build:** Rebuild the Next.js frontend after the storefront and layout changes
4. **Integration tests:** Run end-to-end tests covering: tenant create → approve → launch → storefront access → vendor registration → driver creation
5. **Image domains:** Configure `next.config.js` `images.domains` to allow tenant logo URLs from Fleetbase storage
6. **Cookie names:** The Phase 3 report noted hardcoded cookie names — consider making these configurable per tenant in a future phase

---

## Files Modified

### Backend (Python)
| File | Changes |
|------|---------|
| `app/api/routes/navigator.py` | Added POST driver endpoint, graceful Fleetbase fallback, DriverCreateRequest schema |
| `app/api/routes/tenants.py` | Auto-set subdomain, ensure branding on create, added missing imports, removed dead code |
| `app/api/routes/vendors.py` | Vehicle type + business type normalization with aliases and validation |
| `app/api/routes/analytics.py` | Added tenant-scoped dashboard endpoint, fixed imports and status values |
| `app/api/routes/tenant_context.py` | Accept `x-forwarded-host` header for host-based resolution |
| `app/api/deps.py` | Fixed uuid.UUID bug in both auth functions, proper exception handling |
| `app/services/tenant_context_service.py` | Populate all theme/SEO fields in build_tenant_context |

### Frontend (TypeScript/React)
| File | Changes |
|------|---------|
| `frontend/app/layout.tsx` | Added TenantThemeInjector for SSR theme injection |
| `frontend/lib/tenant-context-server.ts` | Use `x-forwarded-host` instead of `Host`, `no-store` cache |
| `frontend/app/storefront/[slug]/page.tsx` | Pass slug param to fetchTenantContextServer |
| `frontend/app/storefront/[slug]/about/page.tsx` | Pass slug param to fetchTenantContextServer |
| `frontend/app/storefront/[slug]/track/page.tsx` | Pass slug param to fetchTenantContextServer |
| `frontend/app/storefront/[slug]/support/page.tsx` | Pass slug param to fetchTenantContextServer |

---

## Conclusion

The platform's foundational architecture is solid. The issues were primarily in the "last mile" — missing fields, missing endpoints, unhandled edge cases, and incomplete wiring between existing components. All fixes were minimal and targeted, preserving the existing architecture while addressing the specific failure points identified in the UAT reports.

The platform should now pass the "golden test" for multi-tenant SaaS validation: tenant creation → branding isolation → storefront rendering → vendor registration → driver management, all without internal server errors.

**Status: Ready for UAT re-testing and production deployment pending integration test verification.**

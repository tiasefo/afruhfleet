# Phase 8 — Authentication Separation
## Architecture Refactor Report

> Phase 8 separates authentication flows by role. The login form now correctly
> distinguishes `platform_admin`, `admin` (tenant), and `customer` roles, redirects
> each to their appropriate area, and replaces hardcoded "Afruheritage" branding
> with tenant-aware components.

---

## 1. What Was Changed

### Modified Files

| File | Change |
|---|---|
| `lib/auth.ts` | Added `platform_admin` to `UserRole` type; added `isPlatformAdmin()` helper; `isAdmin()` now returns true for both `admin` and `platform_admin` |
| `components/auth/login-form.tsx` | Fixed role determination (`is_superuser` → `platform_admin`, `is_tenant_admin` → `admin`); fixed redirect logic (`platform_admin` → `/admin`, `admin` → `/portal`, `customer` → `/customer`); replaced hardcoded logo with `TenantLogo`; made "Powered by" text tenant-aware |
| `components/auth/register-form.tsx` | Added `useTenant()` hook; replaced hardcoded "Afruheritage" in description with `{companyName}` |

---

## 2. Role-Based Redirect Flow

```
User submits login form
  ↓
POST /auth/login → access_token
  ↓
GET /auth/me → user profile
  ↓
Determine role:
  is_superuser     → 'platform_admin'
  is_tenant_admin  → 'admin'
  (default)        → 'customer'
  ↓
Set cookies (afruheritage_access_token, afruheritage_user)
  ↓
Redirect:
  platform_admin → /admin     (Platform Admin dashboard)
  admin          → /portal    (Tenant Portal dashboard)
  customer       → /customer  (Customer Dashboard)
```

### Before (broken):
```
role = is_superuser || is_tenant_admin ? 'admin' : 'customer'
redirect = role === 'admin' ? '/admin' : '/customer'
```
- Superusers and tenant admins both went to `/admin` (same area)
- No tenant portal redirect existed

### After (fixed):
```
role = is_superuser ? 'platform_admin' : (is_tenant_admin ? 'admin' : 'customer')
redirect = platform_admin → /admin, admin → /portal, customer → /customer
```
- Three distinct areas with proper separation

---

## 3. Auth Guards by Area

| Area | Route Prefix | Auth Guard | Required Role |
|---|---|---|---|
| Public Website | `/` | None | None (open access) |
| Tenant Portal | `/portal` | `portal/layout.tsx` | Any authenticated user |
| Platform Admin | `/admin` | `admin/layout.tsx` | `platform_admin` only |
| Customer Dashboard | `/customer` | Inline in page | `customer` |

---

## 4. Tenant-Aware Login Branding

| Element | Before | After |
|---|---|---|
| Login header logo | Hardcoded "A" icon + "Afruheritage" text | `TenantLogo` component (uses tenant logo/name or fallback) |
| "Powered by" text (EN) | `"Powered by Afruheritage"` | `"Powered by {tenant.company_name}"` or fallback |
| "Powered by" text (ZH) | `"由 Afruheritage 提供支持"` | `"由 {tenant.company_name}"` or fallback |
| Register description | `"...managing logistics with Afruheritage"` | `"...managing logistics with {companyName}"` |

---

## 5. Verification Results

### TypeScript
- ✅ `tsc --noEmit` — clean, no errors

### Next.js Build
- ✅ `next build` — successful, all 38 routes built
- ✅ All pages dynamic (server-rendered on demand)
- ✅ Middleware active

---

## 6. What Was NOT Changed

- No database schema changes
- No backend auth endpoints changed
- Cookie names unchanged (`afruheritage_access_token`, `afruheritage_user`)
- Social login flow unchanged (uses same `finalizeLogin` with updated role logic)
- Password reset flow unchanged
- Customer dashboard auth guard unchanged (inline in page)

---

## 7. Next Steps

Phase 9 will implement Routing separation:
- Support `/store/{slug}` route group for tenant storefronts
- Subdomain-based tenant resolution (already in middleware)
- Custom domain support with same rendering engine
- Ensure all areas work correctly with different tenant resolution methods

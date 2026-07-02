# Phase 9 — Routing
## Architecture Refactor Report

> Phase 9 implements tenant routing via `/store/{slug}`, subdomains, and custom domains.
> The middleware rewrites `/store/{slug}/...` to `/storefront/[slug]/...` and sets
> the `x-tenant-slug` header. The root layout resolves tenant context from headers
> and wraps all pages with `TenantContextProvider`.

---

## 1. What Was Built

### New Files

| File | Purpose |
|---|---|
| `app/storefront/[slug]/page.tsx` | Storefront home page (hero, features, how-it-works, testimonials, CTA) |
| `app/storefront/[slug]/track/page.tsx` | Storefront tracking page |
| `app/storefront/[slug]/about/page.tsx` | Storefront about page |
| `app/storefront/[slug]/support/page.tsx` | Storefront support page |

### Existing (Already Working)

| File | Role |
|---|---|
| `middleware.ts` | Rewrites `/store/{slug}/...` → `/storefront/[slug]/...`, sets `x-tenant-slug` header; handles subdomains and custom domains |
| `app/layout.tsx` | Root layout resolves tenant context from headers, wraps with `TenantContextProvider` |
| `lib/tenant-metadata.ts` | `resolveTenantContext()` reads `x-tenant-slug` or `x-tenant-host` from headers |

---

## 2. Routing Resolution Flow

```
Three tenant resolution methods:

1. /store/{slug} path
   User visits: /store/empire-drips/about
   Middleware: rewrites to /storefront/empire-drips/about
   Middleware: sets x-tenant-slug: empire-drips
   Root layout: resolveTenantContext() → fetchTenantContextServer('empire-drips')
   Result: Tenant context loaded, all components render with tenant branding

2. Subdomain
   User visits: empire-drips.afruheritage.com/about
   Middleware: detects subdomain 'empire-drips'
   Middleware: sets x-tenant-slug: empire-drips
   Root layout: resolveTenantContext() → fetchTenantContextServer('empire-drips')
   Result: Same as /store/{slug} — tenant context loaded

3. Custom domain
   User visits: empire-drips.com/about
   Middleware: detects custom domain (not subdomain, not localhost)
   Middleware: sets x-tenant-host: empire-drips.com
   Root layout: resolveTenantContext() → fetchTenantContextByHostServer('empire-drips.com')
   Result: Backend resolves tenant by host header
```

---

## 3. Storefront Routes

| Route | Renders | Tenant Context Source |
|---|---|---|
| `/storefront/[slug]` | Home (hero, features, testimonials, CTA) | `x-tenant-slug` header |
| `/storefront/[slug]/track` | Tracking search | `x-tenant-slug` header |
| `/storefront/[slug]/about` | About page with tenant content | `x-tenant-slug` header |
| `/storefront/[slug]/support` | Support (hero, tickets, FAQ) | `x-tenant-slug` header |

All storefront pages:
- Use `generateMetadata()` with `resolveTenantContext()` for per-tenant SEO
- Render within root layout's `TenantContextProvider` (no double-wrapping)
- Use same components as main public pages (Navigation, Footer, AIChatWidget, etc.)

---

## 4. URL Structure

| URL Pattern | Route | Tenant Resolution |
|---|---|---|
| `/store/empire-drips` | `/storefront/[slug]` | Path-based |
| `/store/empire-drips/track` | `/storefront/[slug]/track` | Path-based |
| `/store/empire-drips/about` | `/storefront/[slug]/about` | Path-based |
| `/store/empire-drips/support` | `/storefront/[slug]/support` | Path-based |
| `empire-drips.afruheritage.com` | `/` (root pages) | Subdomain |
| `empire-drips.com` | `/` (root pages) | Custom domain |
| `afruheritage.com` | `/` (root pages) | Platform default (no tenant) |
| `localhost:3000` | `/` (root pages) | Platform default (no tenant) |

---

## 5. Verification Results

### TypeScript
- ✅ `tsc --noEmit` — clean, no errors

### Next.js Build
- ✅ `next build` — successful, all 42 routes built
- ✅ 4 new storefront routes: `/storefront/[slug]`, `/storefront/[slug]/about`, `/storefront/[slug]/support`, `/storefront/[slug]/track`
- ✅ All pages dynamic (server-rendered on demand)
- ✅ Middleware active ("Proxy (Middleware)")

---

## 6. What Was NOT Changed

- No database schema changes
- No backend route changes
- Middleware logic unchanged (already had /store/{slug} rewrite)
- Cookie names unchanged
- Auth flow unchanged

---

## 7. Next Steps

Phase 10 will perform final validation:
- Frontend builds cleanly
- Backend healthy
- Storefront works for different tenants
- Dashboards work (portal, admin, customer)
- No branding leakage (no hardcoded "Afruheritage" in tenant-facing content)
- No broken routes

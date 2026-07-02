# Phase 4 — Metadata Engine
## Architecture Refactor Report

> Phase 4 builds a dynamic per-tenant metadata engine that generates SEO titles, OpenGraph,
> Twitter cards, canonical URLs, robots directives, favicons, and JSON-LD structured data
> from the TenantContext — no hardcoded "Afruheritage" metadata remains in page-level exports.

---

## 1. What Was Built

### New Files

| File | Purpose |
|---|---|
| `lib/tenant-metadata.ts` | Server-side metadata generator: `resolveTenantContext()`, `generateTenantMetadata()`, `generateTenantViewport()`, `generateTenantJsonLd()`, `generateTenantIcons()` |
| `components/tenant-structured-data.tsx` | Renders JSON-LD `<script>` tag with Organization schema from tenant context |

### Modified Files

| File | Change |
|---|---|
| `app/layout.tsx` | Replaced static `metadata` and `viewport` exports with `generateMetadata()` and `generateViewport()` that resolve tenant context from middleware headers; added `<TenantStructuredData>` injection; passes `slug` to `TenantContextProvider` |
| `app/track/page.tsx` | Replaced static `metadata` with `generateMetadata()` — per-tenant title/description |
| `app/about/page.tsx` | Replaced static `metadata` with `generateMetadata()` — per-tenant title/description |
| `app/support/page.tsx` | Replaced static `metadata` with `generateMetadata()` — per-tenant title/description |
| `app/login/page.tsx` | Replaced static `metadata` with `generateMetadata()` — per-tenant title/description with platform fallback |
| `app/register/page.tsx` | Replaced static `metadata` with `generateMetadata()` — per-tenant title/description with platform fallback |

---

## 2. Metadata Resolution Flow

```
Next.js middleware (middleware.ts)
  ↓ sets x-tenant-slug or x-tenant-host header
  ↓
layout.tsx generateMetadata()
  ↓ calls resolveTenantContext()
  ↓   → reads x-tenant-slug from headers()
  ↓   → fetches /api/v1/tenant-context/{slug} (server-side, cached)
  ↓   → returns TenantContext | null
  ↓
generateTenantMetadata(tenant)
  ↓ Builds Metadata object:
  ↓   title: tenant.seo.title or "{companyName} | Logistics & Freight Forwarding"
  ↓   description: tenant.seo.description
  ↓   keywords: tenant.seo.keywords
  ↓   openGraph: { title, description, siteName, images }
  ↓   twitter: { card, title, description, images }
  ↓   robots: { index, follow } from tenant.seo.robots
  ↓   alternates: { canonical } from tenant.seo.canonical_url
  ↓   icons: { icon, shortcut, apple } from tenant.theme.favicon_url
  ↓
generateTenantViewport(tenant)
  ↓ themeColor: tenant.theme.primary_color (light), secondary_color (dark)
  ↓
TenantStructuredData
  ↓ Renders JSON-LD <script> with Organization schema:
  ↓   name, description, url, logo, email, telephone, address
```

---

## 3. Hardcoded Metadata Removed

| File | Before | After |
|---|---|---|
| `app/layout.tsx` | `title: 'Afruheritage \| ...'` | `generateMetadata()` → tenant.seo.title |
| `app/layout.tsx` | `description: 'The complete logistics platform...'` | `generateMetadata()` → tenant.seo.description |
| `app/layout.tsx` | `keywords: ['freight forwarding', ...]` | `generateMetadata()` → tenant.seo.keywords |
| `app/layout.tsx` | `openGraph: { title: 'Afruheritage...' }` | `generateMetadata()` → tenant.seo.og_title |
| `app/layout.tsx` | `themeColor: ['#1a3a4a', '#0f1f28']` | `generateViewport()` → tenant.theme.primary_color |
| `app/track/page.tsx` | `title: 'Track Shipment \| Afruheritage'` | `generateMetadata()` → `Track Shipment \| {tenant.company_name}` |
| `app/about/page.tsx` | `title: 'About Us \| Afruheritage'` | `generateMetadata()` → `About Us \| {tenant.company_name}` |
| `app/support/page.tsx` | `title: 'Support \| Afruheritage'` | `generateMetadata()` → `Support \| {tenant.company_name}` |
| `app/login/page.tsx` | `title: 'Sign In \| Afruheritage'` | `generateMetadata()` → `Sign In \| {tenant.company_name}` (fallback: Afruheritage) |
| `app/register/page.tsx` | `title: 'Create Account \| Afruheritage'` | `generateMetadata()` → `Create Account \| {tenant.company_name}` (fallback: Afruheritage) |

---

## 4. Fallback Behavior

When no tenant is resolved (e.g., localhost, platform's own domain):
- Title: `"Afruheritage | AI-Powered Freight Forwarding Platform"`
- Description: `"The complete logistics platform for Africa..."`
- Keywords: `['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'China trade', 'supply chain', 'AI logistics']`
- Theme color: `#1a3a4a` (light), `#0f1f28` (dark)
- No JSON-LD structured data rendered
- No favicon override

---

## 5. Verification Results

### TypeScript
- ✅ `tsc --noEmit` — clean, no errors

### Next.js Build
- ✅ `next build` — successful, all 24 routes built
- ✅ All pages now `ƒ (Dynamic)` — server-rendered on demand (expected for `generateMetadata`)
- ✅ Middleware active ("Proxy (Middleware)")

### Backend
- ✅ `GET /api/v1/tenant-context/empire-drips` returns:
  - `seo.title`: "Empire Drips | Logistics & Freight Forwarding"
  - `seo.og_title`: "Empire Drips"
  - `seo.twitter_card`: "summary_large_image"
  - `seo.canonical_url`: "https://empire-drips"
  - `seo.robots`: "index, follow"
- ✅ Health check passing

---

## 6. What Was NOT Changed

- No database schema changes
- No backend route changes (beyond Phase 2)
- No authentication flow altered
- No existing page routes removed
- Pages without hardcoded metadata (pricing, privacy, terms, solutions, etc.) inherit from layout's `generateMetadata()`

---

## 7. Risks

1. **All pages now dynamic** — `generateMetadata()` makes all pages server-rendered on demand. Static prerendering is no longer used. This is expected for multi-tenant metadata but may slightly increase TTFB.
2. **API call on every page load** — `resolveTenantContext()` fetches from the backend. The `fetch` uses `cache: 'force-cache'` so Next.js will cache the response, but the cache duration depends on the backend's cache headers.
3. **Custom domain resolution** — For custom domains, the `x-tenant-host` header is passed, but `resolveTenantContext()` currently uses the host-based API endpoint which sends the Host header. This may need adjustment depending on how the backend resolves the host.

---

## 8. Next Steps

Phase 5 will build the Tenant Public Website:
- All public pages (home, about, services, tracking, support, privacy, etc.) use TenantContext
- Page content adapts to tenant: company name, tagline, services, contact info
- Storefront pages served from `/store/{slug}` route group
- No hardcoded AfruHeritage content in tenant-facing pages

# Phase 2 — Tenant Context Engine
## Architecture Refactor Report

> Phase 2 creates a single source of truth for tenant identity, branding, theme, features, and subscription status.

---

## 1. What Was Built

### Backend (FastAPI)

#### New Files

| File | Purpose |
|---|---|
| `app/schemas/tenant_context.py` | Pydantic schema for unified TenantContext response (theme, contact, legal, features, subscription, SEO) |
| `app/services/tenant_context_service.py` | Service layer: resolves tenant by slug/subdomain/domain/UUID, assembles full context from Tenant + TenantBranding + TenantSubscription |
| `app/api/routes/tenant_context.py` | Public API endpoints: `GET /tenant-context/{identifier}` and `GET /tenant-context/resolve/host` |

#### Modified Files

| File | Change |
|---|---|
| `app/main.py` | Added import and router registration for `tenant_context_router` |

### Frontend (Next.js)

#### New Files

| File | Purpose |
|---|---|
| `lib/tenant-context.ts` | TypeScript types for TenantContext, fetcher functions, CSS variable injection, sessionStorage caching |
| `components/tenant-context-provider.tsx` | React Context provider that fetches tenant context, applies theme CSS variables and favicon |
| `middleware.ts` | Next.js middleware: resolves tenant from `/store/{slug}` paths and subdomains, injects `x-tenant-slug` header |

---

## 2. API Endpoints

### `GET /api/v1/tenant-context/{identifier}`
- **Auth**: None (public)
- **Identifier**: slug, subdomain, custom domain, or UUID
- **Returns**: Full TenantContextResponse with theme, contact, legal, features, subscription, SEO

### `GET /api/v1/tenant-context/resolve/host`
- **Auth**: None (public)
- **Resolves**: Tenant from Host header (custom domain first, then subdomain extraction)
- **Returns**: Full TenantContextResponse

---

## 3. TenantContext Schema

```
TenantContextResponse
├── id, slug, company_name, tagline
├── domain, subdomain, custom_domain
├── default_language, supported_languages[]
├── template_code, storefront_config
├── theme
│   ├── primary_color, secondary_color, accent_color
│   ├── background_color, foreground_color
│   ├── success_color, warning_color, danger_color
│   ├── font_family, radius
│   └── logo_url, favicon_url, og_image_url
├── contact
│   └── support_email, support_phone, support_url
│       notification_from_name, notification_from_email
├── legal
│   └── legal_company_name, legal_footer_text
│       terms_url, privacy_url
├── features
│   └── maps_enabled, public_tracking_enabled
│       csv_import_enabled, group_members_enabled
│       ai_enabled, marketplace_enabled
│       custom_domains_enabled, max_group_members
├── subscription
│   └── plan_code, status, trial, credits_balance, features[]
├── seo
│   └── title, description, keywords[]
│       og_title, og_description, twitter_card
│       canonical_url, robots
└── created_at, updated_at
```

---

## 4. Frontend Integration

### React Provider
```tsx
<TenantContextProvider slug="amooksco-logistics">
  <App />
</TenantContextProvider>
```

### Hooks
```tsx
const { tenant, loading, error } = useTenantContext();
const tenant = useTenant();
```

### CSS Variable Injection
The provider automatically injects tenant theme colors as CSS custom properties:
- `--primary`, `--secondary`, `--accent`
- `--background`, `--foreground`
- `--success`, `--warning`, `--danger`
- `--radius`, `--font-sans`

### Middleware Routing
- `/store/{slug}/*` → rewrites to `/storefront/{slug}/*` with `x-tenant-slug` header
- Subdomain detection → injects `x-tenant-slug` header
- Custom domain detection → injects `x-tenant-host` header

---

## 5. Verification Results

### Backend
- ✅ Python imports: clean
- ✅ Docker container: restarted with new code
- ✅ `GET /api/v1/tenant-context/amooksco-logistics` → 200 with full context
- ✅ `GET /api/v1/tenant-context/empire-drips` → 200 with custom branding (#1A73E8)
- ✅ Tenant without branding → returns defaults
- ✅ Nonexistent tenant → 404
- ✅ Health check: passing

### Frontend
- ✅ TypeScript compilation: clean (`tsc --noEmit`)
- ✅ Next.js build: successful
- ✅ Middleware detected as "Proxy (Middleware)" in build output

### Test Results
```
amooksco-logistics:
  Company: Amooksco Logistics
  Theme primary: #0ea5e9 (default — no branding row)
  Features: all defaults, custom_domains_enabled=true
  Subscription: free/active

empire-drips:
  Company: Empire Drips
  Theme primary: #1A73E8 (custom branding)
  Contact: support_email=niblzsv@gmail.com
  Subscription: free/active
```

---

## 6. Architecture Diagram (Phase 2)

```
                    ┌─────────────────────────────────┐
                    │   Next.js Frontend               │
                    │                                  │
                    │  middleware.ts                   │
                    │    → /store/{slug} → rewrite     │
                    │    → subdomain → x-tenant-slug   │
                    │    → custom domain → x-tenant-host│
                    │                                  │
                    │  <TenantContextProvider>         │
                    │    → fetches /api/v1/tenant-context/{slug}│
                    │    → injects CSS variables       │
                    │    → sets favicon                │
                    │    → provides useTenant() hook   │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │   FastAPI Backend                │
                    │                                  │
                    │  /api/v1/tenant-context/{id}     │
                    │    → resolve_tenant()            │
                    │    → build_tenant_context()      │
                    │    → Tenant + Branding + Sub     │
                    │    → Returns unified context     │
                    │                                  │
                    │  /api/v1/tenant-context/resolve/host│
                    │    → Resolves from Host header   │
                    └──────────────────────────────────┘
```

---

## 7. What Was NOT Changed

- No existing routes modified or removed
- No database schema changes
- No existing components modified
- No authentication flow altered
- All existing functionality preserved

---

## 8. Risks

1. **Docker image not rebuilt** — new files were `docker cp`'d into the running container. A full rebuild is needed for persistence across container recreation.
2. **SessionStorage caching** — tenant context is cached for 5 minutes in the browser. A `refetch()` method is available for manual refresh.
3. **No branding row for some tenants** — `amooksco-logistics` has no branding row, so it receives default colors. This is expected behavior.

---

## 9. Next Steps

Phase 3 will build the Theme Engine on top of this TenantContext:
- Dynamic CSS variable injection from tenant theme
- Per-tenant typography, logo, favicon
- Remove all hardcoded AfruHeritage colors from components
- No AfruHeritage theme imports in tenant components

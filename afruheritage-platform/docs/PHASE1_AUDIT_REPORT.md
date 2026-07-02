# Phase 1 — Architecture Audit Report
## AfruHeritage Multi-Tenant Platform

> Produced as part of the Tenant Architecture Refactor.
> This is a read-only audit. No code was modified.

---

## 1. Repository Structure

```
/home/afruheritage/fleetbase/afruhfleet/
├── frontend/                          # Next.js 15 app (tenant-facing)
│   ├── app/                           # App Router pages
│   ├── components/                    # React components
│   ├── lib/                           # Auth, API utils
│   ├── styles/globals.css             # Tailwind + CSS variables (platform colors)
│   └── next.config.mjs                # API proxy rewrites
├── afruheritage-platform/             # FastAPI backend
│   ├── app/
│   │   ├── api/routes/                # 45+ API route files
│   │   ├── models/                    # SQLAlchemy models
│   │   ├── services/                  # Business logic
│   │   ├── middleware/                # Rate limiting only
│   │   └── main.py                    # Router registration
│   ├── admin-console/                 # Separate Next.js admin app
│   │   └── frontend/                  # Admin console UI
│   ├── data/tenants/amooksco/         # Tenant file storage
│   └── backups/                       # Prior refactoring attempts
└── tenants/uat-freight-co/            # UAT tenant deployment
```

---

## 2. Frontend Routes (Next.js App Router)

### Public Pages (no auth)
| Route | Purpose |
|---|---|
| `/` | Landing page (AfruHeritage branded) |
| `/about` | About page |
| `/solutions` | Solutions overview |
| `/solutions/freight-management` | Freight management detail |
| `/solutions/customs-clearance` | Customs clearance detail |
| `/solutions/warehouse-services` | Warehouse services detail |
| `/platform` | Platform capabilities overview |
| `/platform/ai-assistant` | AI assistant feature page |
| `/platform/document-management` | Document management feature |
| `/platform/api-integration` | API integration feature |
| `/pricing` | Pricing page |
| `/track` | Shipment tracking (public) |
| `/support` | Support hub |
| `/support/ticket/[token]` | Ticket detail |
| `/vendors` | Vendor landing |
| `/vendors/whatsapp-csv` | WhatsApp CSV upload |
| `/privacy` | Privacy policy |
| `/cookies` | Cookie policy |
| `/terms` | Terms of service |

### Auth Pages
| Route | Purpose |
|---|---|
| `/login` | Login form |
| `/register` | Registration form |
| `/kyc` | KYC submission |

### Authenticated Pages
| Route | Purpose | Role |
|---|---|---|
| `/admin` | Admin dashboard | `admin` |
| `/admin/users` | User management | `admin` |
| `/customer` | Customer dashboard | `customer` |

### Missing Routes
| Expected | Status |
|---|---|
| `/store/[slug]` | **Not in app/** — exists only in backups |
| `/dashboard/*` | **Does not exist** — no tenant portal |
| `/portal/*` | **Does not exist** — no tenant portal |
| Tenant subdomain routing | **No middleware** — no tenant resolver |

---

## 3. Backend Routes (FastAPI)

### Router Registration (app/main.py — 40+ routers)

All routes are prefixed with `/api/v1/`:

| Prefix | Route File | Purpose | Scope |
|---|---|---|---|
| `/auth` | auth.py | Login, register, me | Shared |
| — | auth_pages.py | Auth page rendering | Shared |
| `/tenants` | tenants.py | CRUD tenants | Platform Admin |
| `/tenants` | tenant_requests.py | Registration requests | Public |
| `/tenants` | tenant_creation.py | Tenant provisioning | Platform Admin |
| `/branding` | branding.py | Tenant branding CRUD | Tenant |
| `/storefront` | storefront.py | Storefront data proxy | Tenant |
| `/storefront-templates` | storefront_templates.py | Template management | Platform Admin |
| `/billing` | billing.py | Billing & subscriptions | Tenant |
| `/payments` | payments.py | Payment processing | Tenant |
| `/payment-hub` | payment_hub.py | Payment hub | Tenant |
| `/shipments` | shipments.py | Shipment management | Tenant |
| `/cargo-lifecycle` | cargo_lifecycle.py | Cargo lifecycle | Tenant |
| `/customers` | customer_portal.py | Customer portal | Tenant |
| `/customers` | customer_cargo_portal.py | Customer cargo | Tenant |
| `/customs` | customs.py | Customs management | Tenant |
| `/customs` | customs_guest.py | Public customs lookup | Public |
| `/warehouse-notices` | warehouse_notices.py | Warehouse notices | Tenant |
| `/pallet` | pallet.py | Pallet management | Tenant |
| `/ai` | ai.py | AI services | Tenant |
| `/ai/widget` | ai_widget.py | AI widget config | Tenant |
| `/analytics` | analytics.py | Analytics | Tenant/Admin |
| `/i18n` | i18n.py | Internationalization | Shared |
| `/geo` | geo.py | Geographic data | Shared |
| `/navigator` | navigator.py | Navigator | Shared |
| `/vendors` | vendors.py | Vendor management | Tenant |
| `/whatsapp` | whatsapp.py | WhatsApp notifications | Tenant |
| `/whatsapp-csv` | whatsapp_csv.py | WhatsApp CSV import | Tenant |
| `/runners` | runners.py | Runner execution | Platform Admin |
| `/fleetbase-runtime` | fleetbase_runtime.py | Runtime management | Platform Admin |
| `/fleetbase-proxy` | fleetbase_proxy.py | API proxy | Shared |
| `/fleetbase-tenant-proxy` | fleetbase_tenant_proxy.py | Tenant API proxy | Tenant |
| `/products` | products.py | Product catalog | Tenant |
| `/marketplace` | marketplace.py | Marketplace | Platform Admin |
| `/admin/marketplace` | admin_marketplace.py | Admin marketplace | Platform Admin |
| `/admin/subscriptions` | admin_subscriptions.py | Admin subscriptions | Platform Admin |
| `/admin/credits` | admin_credits.py | Admin credits | Platform Admin |
| `/admin/dns` | admin_dns.py | DNS management | Platform Admin |
| `/admin/tenant-preview` | admin_tenant_preview.py | Tenant preview | Platform Admin |
| `/admin/billing-config` | admin_billing_config.py | Billing config | Platform Admin |
| `/support-crm` | support_crm.py | Support CRM | Tenant |
| `/custom-domains` | custom_domains.py | Custom domain mgmt | Platform Admin |
| `/users` | users.py | User management | Shared |
| `/company-registration` | company_registration.py | Company registration | Public |
| `/kyc` | kyc.py | KYC management | Tenant |
| `/social-auth` | social_auth.py | Social authentication | Shared |

### Key Problem: No tenant-scoped route prefixes
All tenant operational routes are flat under `/api/v1/`. There is no:
- `/api/v1/portal/*` for tenant portal
- `/api/v1/platform/*` for platform admin
- `/api/v1/public/*` for storefront

---

## 4. Tenant Middleware & Resolver

### Frontend
- **No middleware.ts exists** — there is no tenant resolution at the Next.js level
- No subdomain detection
- No `/store/{slug}` routing
- No cookie/header-based tenant context

### Backend
- **Only `rate_limit.py`** in `app/middleware/` — no tenant resolution middleware
- Tenant is resolved via:
  - `request.path_params.get('tenant_id')` or `request.query_params.get('tenant_id')` in `deps.py`
  - `user.tenant_id` from JWT token
- No host/subdomain-based tenant resolution
- No middleware to inject tenant context into all requests

### Tenant Resolution Flow
```
User JWT → user.tenant_id → manual check in get_current_user()
                                    ↓
                    Compare against path/query param tenant_id
                                    ↓
                    403 if mismatch
```
**Problem:** No automatic tenant resolution from domain/subdomain. Every API call must manually pass `tenant_id`.

---

## 5. Authentication Flow

### Current State
```
/login → POST /api/v1/auth/login → JWT access token
                                    ↓
                    Set cookies: afruheritage_access_token, afruheritage_user
                                    ↓
                    Role check: admin → /admin, customer → /customer
```

### Issues
1. **Single auth surface** — no separation between Platform Admin, Tenant Staff, and Customer
2. **Cookie names hardcoded** as `afruheritage_*` — visible to tenant customers
3. **Role model is binary** — only `admin` or `customer` (no tenant staff, super admin, etc.)
4. **Backend has `is_superuser` flag** but frontend doesn't expose it
5. **Social auth** exists (`social_auth.py`) but returns `${provider}@afruheritage.social` — platform-branded
6. **No tenant-scoped login** — login page doesn't know which tenant the user belongs to

---

## 6. Storefront Flow

### Current State
- **No `/store/[slug]` route exists in `app/`** — it was removed or only exists in backups
- Backup at `backups/tenant-refactor-20260628-065949/store/` contains:
  - `store/page.tsx` — store listing
  - `store/[slug]/page.tsx` — tenant storefront page
  - `storefront/page.tsx` — alternate storefront
- `amooksco.ts` backup contains hardcoded AMOOKSCO brand data
- Backend has `/api/v1/storefront/{tenant_id}/*` endpoints
- **The storefront is completely disconnected from the frontend**

### What Exists (Backend)
- `storefront.py` — proxies to Fleetbase API for tenant data
- `storefront_templates.py` — template management
- `branding.py` — `GET /branding/public/{tenant_id}` returns public branding (no auth)

### What's Missing
- No Next.js route to render storefront pages
- No tenant slug → tenant_id resolution on frontend
- No dynamic theme loading from `/branding/public/{tenant_id}`
- No storefront layout that uses tenant branding instead of platform branding

---

## 7. Dashboard Flow

### Current State
- `/admin` — Admin dashboard with analytics (role: `admin`)
- `/customer` — Customer dashboard with shipments, billing (role: `customer`)
- `/platform` — Platform feature pages (public, marketing)

### Issues
1. **Admin and Customer are in the same app** — no separation
2. **No tenant portal** — staff users have no dedicated dashboard
3. **Admin dashboard is tenant-scoped** but uses platform branding
4. **Customer dashboard receives `tenantId` as prop** but doesn't use tenant branding
5. **Platform admin console** is a separate app (`admin-console/frontend/`) — good, but not integrated

### Admin Console (Separate App)
Located at `afruheritage-platform/admin-console/frontend/`:
- `/dashboard` — Admin overview
- `/dashboard/tenants` — Tenant management
- `/dashboard/tenants/[id]` — Tenant detail
- `/dashboard/billing` — Billing
- `/dashboard/analytics` — Analytics
- `/dashboard/domains` — Domain management
- `/dashboard/runners` — Runner management
- `/dashboard/runtimes` — Runtime management
- `/dashboard/vendors` — Vendor management
- `/dashboard/tickets` — Support tickets
- `/dashboard/users` — User management
- `/dashboard/kyc` — KYC management
- `/dashboard/architecture` — Architecture view
- `/dashboard/blueprint` — Blueprint view
- `/dashboard/knowledge-base` — Knowledge base
- `/dashboard/vendor-actions` — Vendor actions
- `/dashboard/tracking` — Tracking overview

**This is the Platform Admin app. It is separate but duplicates UI components.**

---

## 8. Branding Flow

### Backend (Good Foundation)
- `TenantBranding` model exists with: company_name, tagline, logo_url, favicon_url, primary_color, secondary_color, accent_color, background_color, support_email, support_phone, etc.
- `GET /api/v1/branding/public/{tenant_id}` — public endpoint (no auth)
- `PATCH /api/v1/branding/{tenant_id}` — update branding (auth required)
- `POST /api/v1/branding/{tenant_id}/logo` — upload logo
- `tenant_branding_service.py` — service layer

### Frontend (Completely Broken)
1. **No component fetches tenant branding** — everything is hardcoded
2. `app/layout.tsx` exports static metadata: `title: 'Afruheritage | AI-Powered Freight Forwarding Platform'`
3. `components/landing/navigation.tsx` — hardcoded AfruHeritage nav links
4. `components/landing/footer.tsx` — likely hardcoded AfruHeritage footer
5. `components/landing/cta-section.tsx` — `support@afruheritage.com` hardcoded
6. `components/support/track-ticket-section.tsx` — `support@afruheritage.com` hardcoded
7. `styles/globals.css` — static CSS variables (platform colors, not tenant colors)
8. **No TenantContext or TenantProvider** exists in the frontend

### Hardcoded AfruHeritage References (Frontend)
| File | Reference |
|---|---|
| `app/layout.tsx` | Title, description, keywords, openGraph, authors |
| `components/landing/navigation.tsx` | Cookie names `afruheritage_*` |
| `components/landing/cta-section.tsx` | `support@afruheritage.com` |
| `components/support/track-ticket-section.tsx` | `support@afruheritage.com` |
| `components/auth/login-form.tsx` | Cookie names, social auth `${provider}@afruheritage.social` |
| `components/shared/page-actions-bar.tsx` | Cookie names |
| `components/admin/user-management.tsx` | Cookie names |
| `components/vendors/vendor-operations.tsx` | Cookie names |
| `components/ai-chat-widget.tsx` | Model name `afruheritage-copilot:latest` |
| `lib/auth.ts` | Cookie name `afruheritage_user` |
| `lib/auth-server.ts` | Cookie name `afruheritage_user` |

---

## 9. Metadata Flow

### Current State
- **Static metadata** in `app/layout.tsx` — always shows "Afruheritage"
- No `generateMetadata()` function for dynamic per-tenant metadata
- No per-page metadata exports (except layout)
- No OG image, Twitter card, or structured data per tenant
- No favicon customization
- `themeColor` hardcoded to `#1a3a4a` / `#0f1f28`

### What's Needed
- `generateMetadata()` in layout/page that reads from TenantContext
- Per-tenant OG images
- Per-tenant favicons
- Per-tenant structured data (JSON-LD)
- Per-tenant canonical URLs

---

## 10. Theme Flow

### Current State
- `styles/globals.css` defines CSS custom properties (Tailwind v4 syntax)
- Colors are **achromatic** (grayscale oklch values) — not AfruHeritage-branded but also not tenant-branded
- `ThemeProvider` uses `next-themes` for dark/light mode only — no tenant theming
- No dynamic CSS variable injection from tenant branding

### What's Needed
- Runtime CSS variable injection from `TenantBranding` data
- `--primary`, `--secondary`, `--accent`, `--background`, `--foreground` per tenant
- Typography, radius, logo, favicon — all dynamic

---

## 11. Summary of Critical Issues

### A. Three Apps Mixed Into One
The frontend `app/` directory contains:
1. **Platform marketing pages** (`/platform`, `/about`, `/solutions`, `/pricing`)
2. **Tenant operational pages** (`/admin`, `/customer`, `/track`, `/support`)
3. **Public storefront pages** — **missing entirely**

There is no route-level separation between these concerns.

### B. No Tenant Context
- No middleware to resolve tenant from subdomain/path
- No `TenantContext` provider in React tree
- No dynamic branding/theme/metadata loading
- All branding is hardcoded as AfruHeritage

### C. Storefront Is Disconnected
- Backend has storefront APIs and branding APIs
- Frontend has no `/store/[slug]` route
- Prior attempts exist in backups but were removed

### D. Admin Console Is Separate But Duplicated
- `admin-console/frontend/` is a separate Next.js app (good)
- But it duplicates all UI components from the main frontend
- No shared component library

### E. Authentication Is Flat
- Single login page for all roles
- Binary role model (admin/customer)
- No tenant-scoped authentication
- Cookie names leak platform brand

### F. No Middleware At All
- No `middleware.ts` in frontend
- No tenant resolution from URL
- No route protection at the edge

---

## 12. Architecture Diagram (Current)

```
                    ┌─────────────────────────────────┐
                    │     AfruHeritage Frontend        │
                    │     (Next.js — single app)       │
                    │                                  │
                    │  /          → Platform landing   │
                    │  /about     → Platform about     │
                    │  /solutions → Platform features  │
                    │  /pricing   → Platform pricing   │
                    │  /platform  → Platform features  │
                    │  /admin     → Tenant admin       │
                    │  /customer  → Tenant customer    │
                    │  /track     → Public tracking     │
                    │  /support   → Public support      │
                    │  /login     → Shared auth         │
                    │  /vendors   → Vendor pages        │
                    │                                  │
                    │  NO /store/[slug]                │
                    │  NO tenant middleware             │
                    │  NO dynamic branding              │
                    │  NO TenantContext                 │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │     AfruHeritage API              │
                    │     (FastAPI — single app)        │
                    │                                   │
                    │  /api/v1/auth      → Shared       │
                    │  /api/v1/tenants   → Platform     │
                    │  /api/v1/branding  → Tenant       │
                    │  /api/v1/storefront→ Tenant       │
                    │  /api/v1/shipments → Tenant       │
                    │  /api/v1/billing   → Tenant       │
                    │  /api/v1/admin/*   → Platform     │
                    │  /api/v1/customs   → Tenant       │
                    │  ... 40+ flat routes              │
                    │                                   │
                    │  NO tenant middleware              │
                    │  NO route namespacing              │
                    └──────────┬───────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │  Admin Console (separate app)     │
                    │  /dashboard/tenants               │
                    │  /dashboard/billing               │
                    │  /dashboard/domains               │
                    │  ...                              │
                    │  (Duplicates UI components)       │
                    └───────────────────────────────────┘
```

---

## 13. Target Architecture (Proposed)

```
                    ┌─────────────────────────────────┐
                    │   Next.js Frontend (one app)     │
                    │   with route groups:             │
                    │                                  │
                    │  (platform) /platform/*          │
                    │    → Super admin only            │
                    │    → Platform branding           │
                    │                                  │
                    │  (portal) /portal/*              │
                    │    → Tenant staff + customers    │
                    │    → Tenant branding             │
                    │    → TenantContext injected      │
                    │                                  │
                    │  (store) /store/[slug]/*         │
                    │    → Public storefront           │
                    │    → Tenant branding             │
                    │    → SEO metadata                │
                    │                                  │
                    │  middleware.ts                   │
                    │    → Resolve tenant from URL     │
                    │    → Inject TenantContext        │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │   FastAPI Backend                │
                    │   with route prefixes:           │
                    │                                   │
                    │  /api/v1/platform/*  → Admin      │
                    │  /api/v1/portal/*    → Tenant     │
                    │  /api/v1/public/*    → Storefront │
                    │  /api/v1/auth/*      → Shared     │
                    │                                   │
                    │  Tenant middleware:               │
                    │    → Resolve from subdomain/path │
                    │    → Inject tenant_id into request│
                    └───────────────────────────────────┘
```

---

## 14. Files Inventory

### Frontend (main app)
- **Pages**: 26 route files
- **Components**: 88 component files
- **Lib**: 4 utility files
- **Styles**: 1 global CSS file

### Admin Console (separate app)
- **Pages**: 18 route files
- **Components**: ~100+ (duplicated UI library)

### Backend
- **API routes**: 45+ route files
- **Models**: 26 model files
- **Services**: 40+ service files
- **Middleware**: 1 file (rate limiting only)

---

## 15. Risks & Constraints

1. **Backend is running in production** via systemd (`afruheritage-api.service` on port 8100)
2. **Database is remote** at `10.0.0.138` — schema changes require careful migration
3. **Admin console is deployed separately** — changes must be coordinated
4. **Prior refactoring attempts exist in backups** — some code may be reusable
5. **Tenant data directory** (`data/tenants/amooksco/`) has file-based storage that must be preserved
6. **No test suite** — verification will require manual testing + build checks

---

## Next Steps

Phase 1 audit is complete. No code was modified.

**Phase 2** will create the `TenantContext` engine — a single source of truth for tenant identity, branding, theme, features, and subscription status, accessible from both frontend and backend.

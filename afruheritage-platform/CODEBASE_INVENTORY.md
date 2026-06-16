# Afruheritage Platform - Complete Codebase Inventory

## 1. Services & Ports

| Service | Port | Stack | Status |
|---------|------|-------|--------|
| **Control Plane Backend** | 8000 | FastAPI + PostgreSQL + Celery | Running |
| **SaaS Frontend** | 3000 | Next.js (customer-facing) | Running |
| **Admin Console Backend** | 4000 | FastAPI (legacy admin) | Running |
| **Admin Console Frontend** | 3001 | Next.js (legacy admin UI) | Running |
| **Sentinel Backend** | 9200 | FastAPI (new admin console) | Running |
| **Sentinel Frontend** | *static* | Next.js static export (served by 9200) | **BROKEN - 404 after login** |
| **PostgreSQL** | 5432 | Database | Running |
| **Redis** | 6379 | Cache + Celery broker | Running |
| **Nginx** | 80/443 | Reverse proxy | Configured |

---

## 2. Backend APIs (Control Plane - Port 8000)

| Feature | Endpoint | Method | Status |
|---------|----------|--------|--------|
| Auth | `/api/v1/auth/bootstrap` | POST | Working |
| Auth | `/api/v1/auth/login` | POST | Working |
| Auth | `/api/v1/auth/me` | GET | Working |
| Tenants | `/api/v1/tenants` | GET/POST | Working |
| Tenants | `/api/v1/tenants/{id}` | GET/PATCH | Working |
| Billing | `/api/v1/billing/plans` | GET | Working |
| Billing | `/api/v1/billing/subscriptions/{tenant_id}` | GET/POST | Working |
| Billing | `/api/v1/billing/payments/init` | POST | Working |
| Billing | `/api/v1/billing/wallets/{tenant_id}` | GET | Working |
| AI Chat | `/api/v1/ai/chat` | POST | Working |
| AI Widget | `/api/v1/ai-widget/config` | GET | Working |
| Support | `/api/v1/support-crm/public/tickets` | POST | Working |
| Support | `/api/v1/support-crm/tickets` | GET | Working |
| Tracking | `/api/v1/shipments/public/track/{tenant_id}/{tracking}` | GET | Working |
| Vendors | `/api/v1/vendors/register` | POST | Working |
| Custom Domains | `/api/v1/custom-domains` | GET/POST | Working |
| Runners | `/api/v1/runners` | GET/POST | Working |
| Fleetbase Runtime | `/api/v1/runtime` | GET/POST | Working |

---

## 3. Sentinel Backend (Port 9200)

| Feature | Endpoint | Method | Status |
|---------|----------|--------|--------|
| Health | `/sentinel/health` | GET | Working |
| Auth Bootstrap | `/sentinel/auth/bootstrap` | POST | Working |
| Auth Login | `/sentinel/auth/login` | POST | Working |
| Auth Me | `/sentinel/auth/me` | GET | Working |
| Auth Users | `/sentinel/auth/users` | GET/POST | Working |
| Dashboard Stats | `/sentinel/dashboard/stats` | GET | Working |
| Dashboard Health | `/sentinel/dashboard/health` | GET | Working |
| Dashboard Performance | `/sentinel/dashboard/performance` | GET | Working |
| Tenants | `/sentinel/tenants` | GET/POST | Working |
| Tenants Detail | `/sentinel/tenants/{id}` | GET | Working |
| Tenants Actions | `/sentinel/tenants/{id}/approve` | POST | Working |
| Tenants Actions | `/sentinel/tenants/{id}/launch` | POST | Working |
| Tenants Actions | `/sentinel/tenants/{id}/activate` | POST | Working |
| Tenants Actions | `/sentinel/tenants/{id}/suspend` | POST | Working |
| Billing Plans | `/sentinel/billing/plans` | GET | Working |
| Billing Subscriptions | `/sentinel/billing/subscriptions/{tenant_id}` | GET | Working |
| Billing Wallets | `/sentinel/billing/wallets/{tenant_id}` | GET | Working |
| Control Center | `/sentinel/control-center/summary` | GET | Working |
| Control Center | `/sentinel/control-center/features` | GET | Working |
| Control Center | `/sentinel/control-center/tenant-features` | GET/POST | Working |
| Runners | `/sentinel/runners` | GET/POST | Working |
| Runners | `/sentinel/runners/{id}` | GET/DELETE | Working |
| Runtimes | `/sentinel/runtime/tenant/{tenant_id}` | GET | Working |
| Domains | `/sentinel/domains/tenant/{tenant_id}` | GET | Working |
| KYC | `/sentinel/kyc/list` | GET | Working |
| Tickets | `/sentinel/tickets` | GET | Working |
| Tracking | `/sentinel/tracking/public` | GET | Working |
| Vendors | `/sentinel/vendors` | GET | Working |
| Analytics | `/sentinel/analytics/summary` | GET | Working |
| OAuth | `/sentinel/oauth/{provider}/login` | GET | Working |
| OAuth | `/sentinel/oauth/{provider}/callback` | GET | Working |

---

## 4. Sentinel Admin Console Frontend

| Page | Route | Client API Calls | Status |
|------|-------|------------------|--------|
| Login | `/sentinel/login` | `POST /sentinel/auth/login` | Working |
| Dashboard | `/sentinel/dashboard` | `GET /sentinel/dashboard/stats` | **BROKEN - 404** |
| Dashboard Analytics | `/sentinel/dashboard/analytics` | `GET /sentinel/analytics/summary` | **BROKEN - 404** |
| Control Center | `/sentinel/dashboard/control-center` | `GET /sentinel/control-center/*` | **BROKEN - 404** |
| Tenants | `/sentinel/dashboard/tenants` | `GET /sentinel/tenants` | **BROKEN - 404** |
| Tenant Detail | `/sentinel/dashboard/tenants/{id}` | `GET /sentinel/tenants/{id}` | **BROKEN - 404** |
| Users | `/sentinel/dashboard/users` | `GET /sentinel/auth/users` | **BROKEN - 404** |
| Billing | `/sentinel/dashboard/billing` | `GET /sentinel/billing/*` | **BROKEN - 404** |
| Runners | `/sentinel/dashboard/runners` | `GET /sentinel/runners` | **BROKEN - 404** |
| Runtimes | `/sentinel/dashboard/runtimes` | `GET /sentinel/runtime/*` | **BROKEN - 404** |
| Domains | `/sentinel/dashboard/domains` | `GET /sentinel/domains/*` | **BROKEN - 404** |
| KYC | `/sentinel/dashboard/kyc` | `GET /sentinel/kyc/*` | **BROKEN - 404** |
| Tickets | `/sentinel/dashboard/tickets` | `GET /sentinel/tickets` | **BROKEN - 404** |
| Tracking | `/sentinel/dashboard/tracking` | `GET /sentinel/tracking/*` | **BROKEN - 404** |
| Vendors | `/sentinel/dashboard/vendors` | `GET /sentinel/vendors` | **BROKEN - 404** |
| Documentation | `/sentinel/dashboard/documentation` | Static | **BROKEN - 404** |
| Architecture | `/sentinel/dashboard/architecture` | Static | **BROKEN - 404** |
| Blueprint | `/sentinel/dashboard/blueprint` | Static | **BROKEN - 404** |
| Knowledge Base | `/sentinel/dashboard/knowledge-base` | Static | **BROKEN - 404** |

**ROOT CAUSE:** All pages redirect to `/dashboard/*` (without `/sentinel` prefix) after login because Next.js `basePath` is not set. FastAPI serves static files at `/sentinel/*`, so `/dashboard` returns 404.

---

## 5. Main SaaS Frontend (Port 3000)

| Page | Route | Client API Calls | Status |
|------|-------|------------------|--------|
| Home | `/` | Static | Working |
| Docs | `/docs` | Static | Working |
| Docs Features | `/docs/features` | Static | Working |
| Login | `/login` | `POST /api/v1/auth/login` | Working |
| Register | `/register` | `POST /api/v1/auth/bootstrap` | Working |
| Onboarding | `/onboarding` | `POST /api/v1/auth/complete-onboarding` | Working |
| Dashboard | `/dashboard` | `GET /api/v1/auth/me` + `GET /api/v1/tenants` | Working |
| Shipments | `/shipments` | `GET /api/v1/shipments` | Working |
| Members | `/members` | `GET /api/v1/members` | Working |
| Storefront | `/storefront` | Static | Working |
| Store | `/store` | `GET /api/v1/storefront` | Working |
| Support | `/support` | `POST /api/v1/support-crm/public/tickets` | Working |
| Track | `/track` | `GET /api/v1/shipments/public/track/{tenant_id}/{tracking}` | Working |
| Customs | `/customs` | `GET /api/v1/customs/duty` | Working |
| Billing | `/billing` | `GET /api/v1/billing/*` | Working |
| Profile | `/profile` | `GET /api/v1/auth/me` | Working |
| Settings | `/settings` | `GET/POST /api/v1/auth/me` | Working |
| CRM | `/crm` | `GET /api/v1/support-crm/accounts` | Working |
| Fleetbase Console | `/fleetbase/console` | External iframe | Working |
| Live Map | `/fleetbase/live-map` | External | Working |
| Admin (legacy) | `/admin` | Redirects to port 3001 | Working |

---

## 6. Legacy Admin Console (Port 3001 → 4000)

| Page | Route | Client API Calls | Status |
|------|-------|------------------|--------|
| Login | `/` | `POST /api/v1/auth/login` | Working |
| Dashboard | `/dashboard` | `GET /api/v1/auth/me` | Working |
| Tenants | `/tenants` | `GET /api/v1/tenants` | Working |
| Runtime | `/runtime` | `GET /api/v1/runtime` | Working |

---

## 7. Control Center Features (16 Total)

| # | Feature | Phase | Level | Status |
|---|---------|-------|-------|--------|
| 1 | Shipments | Shared | Tenant | Working |
| 2 | Group Members | Shared | Tenant | Working |
| 3 | CSV Import | Shared | Tenant | Working |
| 4 | Public Tracking | Shared | Tenant | Working |
| 5 | Maps | Shared | Tenant | Working |
| 6 | Storefront | Shared | Tenant | Working |
| 7 | Role-Based Access | Phase 1 | Global | Working |
| 8 | Tenant Management | Phase 1 | Global | Working |
| 9 | Billing Engine | Phase 1 | Global | Working |
| 10 | Runner Management | Phase 2 | Global | Working |
| 11 | KYC Verification | Phase 2 | Global | Working |
| 12 | Custom Domain | Phase 2 | Global | Working |
| 13 | AI Chat | Phase 2 | Global | Working |
| 14 | Analytics Dashboard | Phase 3 | Global | Working |
| 15 | Vendor Marketplace | Phase 3 | Global | Working |
| 16 | Support CRM | Phase 3 | Global | Working |

---

## 8. Root Cause of Sentinel 404

**Problem:** After successful login at `POST /sentinel/auth/login` (returns 200 + token), the browser does `router.push('/dashboard')`. This navigates to `http://10.0.0.115:9200/dashboard`.

**Why it fails:** FastAPI's static file mount is at `/sentinel`, so:
- `/sentinel/login` → serves `login/index.html` (works)
- `/sentinel/dashboard` → serves `dashboard/index.html` (works)
- `/dashboard` → no FastAPI route matches → 404

**Fix needed:** Set `basePath: '/sentinel'` in `next.config.mjs` so all client-side navigation includes the `/sentinel` prefix.

**Files to fix:**
- `sentinel/frontend/next.config.mjs` — add `basePath: '/sentinel'`
- Rebuild static export
- Rebuild Docker image
- Redeploy container

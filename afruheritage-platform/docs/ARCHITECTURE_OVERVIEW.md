# Architecture Overview

For new team members onboarding to the Afruheritage platform.

---

## What Is Afruheritage?

Afruheritage is a **multi-tenant SaaS platform** that lets freight forwarders, logistics companies, and other vertical businesses launch their own branded storefront with a Fleetbase-powered backend — without touching Fleetbase directly.

**Think of it as:** WordPress.com for freight/logistics companies. Tenants sign up, pick a template, customize branding, and get a fully functional storefront + Fleetbase runtime.

---

## High-Level Architecture

```
                    ┌──────────────────────────┐
                    │     Tenant Customer       │
                    │  (visits storefront URL)  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │    Next.js Frontend       │
                    │   (tenant-branded UI)     │
                    │   Port 3002               │
                    └────────────┬─────────────┘
                                 │ API calls (rewritten to same origin)
                    ┌────────────▼─────────────┐
                    │   FastAPI Control Plane   │
                    │   Port 8100               │
                    │   - Auth, Tenants, Billing│
                    │   - Branding, Domains     │
                    │   - AI Chat, Support      │
                    │   - Runtime Management    │
                    └──┬────────┬────────┬─────┘
                       │        │        │
              ┌────────▼──┐ ┌───▼───┐ ┌──▼──────────┐
              │PostgreSQL │ │ Redis │ │ Celery      │
              │Port 5433  │ │:6380  │ │ Worker+Beat │
              │(all data) │ │(cache)│ │(async jobs) │
              └───────────┘ └───────┘ └──────┬──────┘
                                             │ SSH
                                      ┌──────▼──────┐
                                      │ Runner Node │
                                      │ (Fleetbase  │
                                      │  runtime)   │
                                      │ Per tenant  │
                                      └─────────────┘
```

---

## Key Concepts

### 1. Control Plane vs Tenant Runtime

- **Control Plane** (Afruheritage): Manages tenants, billing, branding, domains, support, AI. This is the codebase in `afruheritage-platform/`.
- **Tenant Runtime** (Fleetbase): Each tenant gets an isolated Fleetbase installation on a dedicated runner node. The control plane provisions these via SSH + Fleetbase CLI.

### 2. Multi-Tenancy Model

- **Shared database**: All tenants share one PostgreSQL database, isolated by `tenant_id` foreign keys.
- **Isolated runtimes**: Each tenant's Fleetbase instance runs on a separate runner node.
- **Tenant context**: Propagated via URL path (`/store/[slug]`), cookies (`tenant_slug`), and HTTP headers (`x-tenant-slug`).

### 3. Storefront Templates

7 templates available: `freight`, `fleet`, `ecommerce`, `mall`, `bookings`, `realestate`, `restaurant`.

Each template defines:
- Theme colors and layout
- Feature flags (tracking, maps, AI, marketplace, etc.)
- Required API endpoints
- Auto-fix plugins that ensure features work on selection
- Import profiles for bulk data upload

### 4. Branding System

Each tenant has a `TenantBranding` record containing:
- Company name, tagline, domain
- Theme colors (primary, secondary, accent, background)
- Contact info (support email, notification names)
- Feature flags (maps, tracking, CSV import, AI, marketplace)
- SEO metadata (title, description, keywords)

The frontend reads branding from the API and applies it dynamically — no rebuild needed when branding changes.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend API | FastAPI | Python 3.12 |
| Frontend | Next.js | 15+ (App Router) |
| Database | PostgreSQL | 16 |
| Cache/Queue | Redis | 7 |
| Async Jobs | Celery | 5 |
| AI | Ollama | Local LLM |
| Payments | Paystack | API |
| DNS/SSL | Cloudflare | API |
| Support | GLPI | API integration |
| SSH | Paramiko | Python |
| Container | Docker Compose | v2+ |

---

## Project Structure

```
afruheritage-platform/
├── app/                         # Backend (FastAPI)
│   ├── main.py                  # App entry, router registration, middleware
│   ├── core/
│   │   ├── config.py            # Pydantic settings from .env
│   │   ├── security.py          # JWT auth, password hashing
│   │   ├── middleware.py        # RequestId, SecurityHeaders middleware
│   │   └── structured_logging.py # Structured log formatter
│   ├── db/session.py            # SQLAlchemy engine + session factory
│   ├── models/                  # ORM models (tenant, user, billing, etc.)
│   ├── schemas/                 # Pydantic request/response schemas
│   ├── api/
│   │   ├── deps.py              # Auth dependencies (get_current_user, etc.)
│   │   └── routes/              # All API route files
│   ├── services/                # Business logic (provisioning, billing, etc.)
│   ├── middleware/              # Rate limiting, CORS
│   ├── tasks/                   # Celery tasks (provisioning)
│   ├── ai/                      # Ollama client, RAG retriever
│   └── plugins/                 # Auto-fix plugins for templates
├── frontend/                    # Frontend (Next.js)
│   ├── app/                     # App Router pages
│   │   ├── store/[slug]/        # Tenant storefront pages
│   │   ├── admin/               # Admin console pages
│   │   ├── sign-in/             # Auth pages
│   │   ├── sign-up/
│   │   └── dashboard/           # Tenant dashboard
│   ├── components/              # React components
│   ├── lib/                     # API client, utilities
│   ├── hooks/                   # Custom React hooks
│   └── middleware.ts            # Next.js middleware (tenant context)
├── alembic/                     # Database migrations
├── docs/                        # Documentation
├── docker-compose.yml           # Service definitions
├── Dockerfile                   # API container
├── requirements.txt             # Python dependencies
└── .env                         # Environment configuration
```

---

## Key Flows

### Tenant Onboarding

```
1. Admin creates tenant (POST /tenants)
2. Admin approves tenant (POST /tenants/{id}/approve)
3. Admin launches tenant (POST /tenants/{id}/launch)
4. Celery job runs:
   a. Select runner node
   b. SSH to runner
   c. Run `flb install-fleetbase` in tenant's directory
   d. Configure Fleetbase with tenant settings
   e. Return runtime URL
5. Tenant storefront live at /store/{slug}
```

### Customer Auth Flow

```
1. Customer visits /store/{slug}
2. Next.js middleware sets tenant_slug cookie
3. Customer clicks "Sign In"
4. Login page shows tenant branding (from API)
5. POST /auth/login → JWT token
6. Token stored in localStorage
7. Dashboard shows tenant-specific data
```

### Billing Flow

```
1. Tenant subscribes to plan (trial/pro/business)
2. POST /billing/payments/paystack/init → Paystack checkout URL
3. Customer pays on Paystack
4. Paystack webhook → POST /billing/payments/paystack/verify
5. Subscription activated, wallet credited
6. Usage debits from wallet over time
7. Wallet exhausted → tenant goes read-only
```

---

## Fleetbase Integration

The platform uses **per-tenant admin tokens** for all Fleetbase API calls. This auto-scopes queries to the tenant's organization.

Key endpoints proxied to Fleetbase:
- `GET /fleetbase-tenant/positions` — Live driver positions
- `GET /fleetbase-tenant/tracking-statuses` — Shipment tracking
- `GET /fleetbase-tenant/live-tracking` — Unified tracking view
- `GET /fleetbase-tenant/orders/{id}/track` — Order tracking

Fleetbase internal URL: `http://10.0.0.115:8003`

---

## Security

- **Auth**: JWT tokens (bcrypt password hashing)
- **Rate limiting**: Redis-backed (slowapi), per-endpoint limits
- **Security headers**: X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy
- **CORS**: Restricted to configured origins (no wildcard in production)
- **Tenant isolation**: Database-level (tenant_id FK), runtime-level (separate Fleetbase instances)
- **No branding leakage**: Fleetbase name never visible to tenant customers

---

## Development Workflow

### Making Changes

1. Edit code in `app/` (backend) or `frontend/` (frontend)
2. For backend: `docker cp app/file.py afruheritage-api:/app/app/file.py && docker restart afruheritage-api`
3. For frontend: `docker compose build frontend && docker compose up -d --force-recreate frontend`
4. Run `./e2e_uat_test.sh` to verify no regressions

### Adding a New API Endpoint

1. Create route in `app/api/routes/your_route.py`
2. Add schema in `app/schemas/your_schema.py`
3. Register router in `app/main.py`:
   ```python
   from app.api.routes.your_route import router as your_router
   app.include_router(your_router, prefix=settings.api_v1_prefix)
   ```
4. Add frontend API client method in `frontend/lib/api.ts`
5. Build and restart

### Adding a Database Migration

```bash
# Auto-generate migration from model changes
docker compose exec api alembic revision --autogenerate -m "description"

# Apply
docker compose exec api alembic upgrade head
```

---

## Key Files to Know

| File | Purpose |
|---|---|
| `app/main.py` | App entry — all routers, middleware, startup |
| `app/core/config.py` | All environment variables |
| `app/api/deps.py` | Auth dependencies (get_current_user, require_superuser) |
| `app/models/tenant.py` | Tenant, ProvisioningJob models |
| `app/models/billing.py` | Plan, Subscription, Wallet, Payment models |
| `app/services/fleetbase_provisioner.py` | SSH-based Fleetbase installation |
| `frontend/middleware.ts` | Tenant context propagation |
| `frontend/lib/api.ts` | Frontend API client |
| `docker-compose.yml` | All service definitions |
| `.env` | All configuration |

---

## Where to Find Things

| I need to... | Look at... |
|---|---|
| Add an API endpoint | `app/api/routes/` |
| Change database schema | `app/models/` + `alembic/` |
| Modify tenant branding | `app/api/routes/branding.py` |
| Change frontend page | `frontend/app/` |
| Add a new template | `app/api/routes/storefront_templates.py` |
| Configure rate limits | `app/middleware/rate_limit.py` |
| Change security headers | `app/core/middleware.py` |
| Add Celery task | `app/tasks/` |
| Configure Fleetbase proxy | `app/api/routes/fleetbase_tenant_proxy.py` |
| Deploy the platform | `docs/DEPLOYMENT_RUNBOOK.md` |
| Understand the API | `docs/API_REFERENCE.md` |
| Operate the platform | `docs/OPERATIONAL_GUIDE.md` |
| Run UAT tests | `e2e_uat_test.sh` + `docs/UAT_MANUAL_TESTING_GUIDE.md` |

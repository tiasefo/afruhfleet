# Afruheritage Admin Console

Independent service that controls the Afruheritage SaaS Control Plane exclusively via API.

## Architecture

- **Separate service** — runs on its own domain/port (default: 4000)
- **Own database table** — `admin_users` and `admin_audit_logs` (same Postgres server, different tables)
- **No customer access** — admin-only JWT auth with `iss: admin-console` claim
- **Controls SaaS via API** — proxies all tenant/billing/runtime/domain operations through the Control Plane API
- **Immutable audit trail** — every admin action is logged

## Quick Start

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env with your ADMIN_SECRET_KEY and ADMIN_DATABASE_URL

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run
uvicorn admin_app.main:app --host 0.0.0.0 --port 4000
```

## Docker

```bash
docker build -t afruheritage-admin-console .
docker run -p 4000:4000 --env-file .env afruheritage-admin-console
```

## Authentication Flow

1. Bootstrap the first super_admin: `POST /admin/auth/bootstrap`
2. Login: `POST /admin/auth/login` → returns admin JWT
3. All other endpoints require `Authorization: Bearer <admin-jwt>`
4. To proxy to the Control Plane, also include `X-CP-Token: <control-plane-jwt>` header

## Roles

| Role | Permissions |
|------|------------|
| `super_admin` | Full access, can create other admins |
| `admin` | Manage tenants, billing, runtime, domains |
| `viewer` | Read-only access |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/auth/bootstrap` | Create first super_admin |
| POST | `/admin/auth/login` | Admin login |
| GET | `/admin/auth/me` | Current admin info |
| POST | `/admin/auth/users` | Create admin user (super_admin only) |
| GET | `/admin/auth/users` | List admin users (super_admin only) |
| GET | `/admin/tenants` | List all tenants |
| POST | `/admin/tenants` | Create tenant |
| POST | `/admin/tenants/{id}/approve` | Approve tenant |
| POST | `/admin/tenants/{id}/launch` | Launch tenant |
| GET | `/admin/tenants/jobs/{id}` | Get job status |
| GET | `/admin/billing/plans` | List billing plans |
| GET | `/admin/billing/subscriptions/{tenant_id}` | Get subscription |
| GET | `/admin/billing/wallets/{tenant_id}` | Get wallet |
| POST | `/admin/billing/assign-plan` | Assign plan to tenant |
| POST | `/admin/billing/adjust-credits` | Adjust wallet credits |
| POST | `/admin/billing/set-read-only` | Set tenant read-only |
| GET | `/admin/runners` | List runner nodes |
| POST | `/admin/runners` | Create runner node |
| GET | `/admin/runtime/tenant/{id}` | Get tenant runtime |
| POST | `/admin/runtime/deploy` | Deploy runtime |
| POST | `/admin/runtime/suspend` | Suspend runtime |
| POST | `/admin/runtime/retry` | Retry runtime |
| GET | `/admin/domains/tenant/{id}` | List tenant domains |
| POST | `/admin/domains/activate` | Activate domain |
| GET | `/admin/health` | Health check |

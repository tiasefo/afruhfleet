# Deployment Runbook

Step-by-step guide to deploy the Afruheritage platform from a clean Linux host to a running production system.

---

## 1. Prerequisites

### Control Plane Host
- Ubuntu 22.04/24.04 LTS
- Docker Engine 24+
- Docker Compose plugin v2+
- 8+ GB RAM, 4+ vCPU, 100+ GB SSD
- Public IP with DNS records for:
  - `api.afruheritage.com` → control plane API
  - `afruheritage.com` → frontend
  - `admin.afruheritage.com` → admin console (optional)

### Runner Nodes (for tenant Fleetbase runtimes)
- Ubuntu 22.04/24.04 LTS
- Docker Engine, Docker Compose
- Node.js 20+ and npm
- Fleetbase CLI (`npm install -g @fleetbase/cli`)
- SSH key access from control plane
- 4+ vCPU, 8+ GB RAM, 80+ GB SSD per runner

### External Services
- PostgreSQL 16 (included in docker-compose)
- Redis 7 (included in docker-compose)
- Cloudflare account (for DNS/SSL management)
- Paystack account (for payments)
- SMTP server (for email)
- Ollama instance (for AI chat, optional)

---

## 2. Initial Setup

### 2.1 Clone the Repository

```bash
git clone <repo-url> ~/fleetbase/afruhfleet/afruheritage-platform
cd ~/fleetbase/afruhfleet/afruheritage-platform
```

### 2.2 Configure Environment

```bash
cp .env.example .env
nano .env
```

**Critical variables to set:**

| Variable | Description | Example |
|---|---|---|
| `APP_ENV` | Environment | `production` |
| `SECRET_KEY` | JWT signing key | Random 32+ char string |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://afruheritage:PASSWORD@postgres:5432/afruheritage` |
| `REDIS_URL` | Redis connection | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Same as Redis URL | `redis://redis:6379/1` |
| `CORS_ORIGINS` | Allowed origins (JSON array) | `["https://afruheritage.com","https://api.afruheritage.com"]` |
| `BASE_URL` | Frontend URL | `https://afruheritage.com` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | From Cloudflare dashboard |
| `PAYSTACK_SECRET_KEY` | Paystack secret key | `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key | `pk_live_...` |
| `FLEETBASE_API_URL` | Fleetbase API (internal) | `http://10.0.0.115:8003` |
| `FLEETBASE_API_TOKEN` | Fleetbase master token | `flb_live_...` |
| `OLLAMA_BASE_URL` | Ollama AI endpoint | `http://localhost:11434` |
| `ENABLE_BOOTSTRAP_ADMIN` | Allow first admin creation | `true` (set to `false` after bootstrap) |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email server | Your SMTP provider |

### 2.3 Configure PostgreSQL Password

Edit `docker-compose.yml` and set a strong password for PostgreSQL:
```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: <your-strong-password>
```

Ensure `DATABASE_URL` in `.env` matches this password.

---

## 3. Build and Start Services

### 3.1 Build All Images

```bash
docker compose build
```

**Note:** The API build takes ~2.5 hours due to the `chown` step. For faster iteration, see [Hot-copy method](#hot-copy-method-for-fast-updates) below.

### 3.2 Start Services

```bash
docker compose up -d
```

### 3.3 Verify Services

```bash
docker compose ps
```

All containers should show `Up` and `healthy`:
- `afruheritage-api` — port 8100
- `afruheritage-frontend` — port 3002
- `afruheritage-postgres` — port 5433
- `afruheritage-redis` — port 6380
- `afruheritage-worker` — Celery worker
- `afruheritage-beat` — Celery beat scheduler

### 3.4 Run Database Migrations

```bash
docker compose exec api alembic upgrade head
```

---

## 4. Bootstrap Admin User

### 4.1 Create First Superuser

```bash
curl -X POST http://localhost:8100/api/v1/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "YourStrongPassword!",
    "full_name": "Platform Admin"
  }'
```

### 4.2 Verify Login

```bash
curl -X POST http://localhost:8100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin@yourcompany.com", "password": "YourStrongPassword!"}'
```

Should return `{"access_token": "...", "token_type": "bearer"}`.

### 4.3 Disable Bootstrap

After creating the admin, set in `.env`:
```
ENABLE_BOOTSTRAP_ADMIN=false
```
Restart the API:
```bash
docker compose restart api
```

---

## 5. Register Runner Nodes

Runner nodes are where tenant Fleetbase instances are deployed.

### 5.1 Prepare Runner Node

On the runner node:
```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install Fleetbase CLI
npm install -g @fleetbase/cli

# Create SSH key for control plane access
ssh-keygen -t ed25519 -f ~/.ssh/afruheritage_runner
```

### 5.2 Register Runner in Platform

```bash
TOKEN=$(curl -s -X POST http://localhost:8100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@yourcompany.com","password":"YourStrongPassword!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -X POST http://localhost:8100/api/v1/fleetbase-runtime/runners \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "runner-01",
    "hostname": "10.0.0.115",
    "ssh_port": 22,
    "ssh_user": "deploy",
    "root_runtime_path": "/mnt/storage/fleetbase-runtimes",
    "max_tenants": 10
  }'
```

---

## 6. Create First Tenant

### 6.1 Via API

```bash
curl -X POST http://localhost:8100/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "AMOOKSCO Logistics",
    "contact_email": "admin@amooksco.com",
    "slug": "amooksco-logistics",
    "template_code": "freight"
  }'
```

### 6.2 Configure Tenant Branding

```bash
TENANT_ID="<uuid from previous response>"

curl -X POST http://localhost:8100/api/v1/branding/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "AMOOKSCO Logistics",
    "theme": {
      "primary_color": "#1f5d72",
      "secondary_color": "#3aa6b9"
    }
  }'
```

### 6.3 Verify Storefront

```bash
curl -s http://localhost:3002/store/amooksco-logistics | grep -o '<title>[^<]*</title>'
```

---

## 7. Configure DNS and SSL

### 7.1 Cloudflare DNS

Point tenant domains to the control plane:
- `amooksco-logistics.afruheritage.com` → control plane IP
- `amooksco.com` (custom domain) → control plane IP

### 7.2 Custom Domain Registration

```bash
curl -X POST http://localhost:8100/api/v1/domains/request-simple \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "$TENANT_ID",
    "domain": "amooksco.com"
  }'
```

---

## 8. Set Up Fleetbase Credentials

For each tenant, store their Fleetbase admin token:

```bash
docker compose exec postgres psql -U afruheritage -d afruheritage -c \
  "INSERT INTO tenant_fleetbase_credentials (tenant_id, admin_token, org_uuid)
   VALUES ('$TENANT_ID', 'N|xxxx...', 'org-uuid-here')"
```

---

## 9. Run E2E Tests

```bash
./e2e_uat_test.sh
```

All tests must pass before going live.

---

## 10. Production Checklist

- [ ] `.env` configured with all production values
- [ ] `APP_ENV=production` set
- [ ] `ENABLE_BOOTSTRAP_ADMIN=false` after admin creation
- [ ] Database migrations run (`alembic upgrade head`)
- [ ] Admin user created and login verified
- [ ] At least one runner node registered
- [ ] First tenant created with correct branding
- [ ] Storefront accessible and showing correct branding
- [ ] DNS records configured (Cloudflare or equivalent)
- [ ] SSL/TLS active (via Cloudflare proxy or Let's Encrypt)
- [ ] CORS origins restricted to production domains only
- [ ] Security headers verified (run `e2e_uat_test.sh`)
- [ ] Rate limiting verified
- [ ] Backups configured (see [Operational Guide](OPERATIONAL_GUIDE.md))
- [ ] Monitoring configured
- [ ] No Fleetbase branding visible on tenant storefronts
- [ ] No TODO/FIXME in production code paths

---

## Hot-Copy Method for Fast Updates

When you need to push a code change without waiting for the full Docker build:

```bash
# Copy changed files directly into the running container
docker cp app/main.py afruheritage-api:/app/app/main.py
docker cp app/core/middleware.py afruheritage-api:/app/app/core/middleware.py

# Restart to pick up changes
docker restart afruheritage-api
```

**Warning:** This is for development/staging only. Always do a full `docker compose build` before deploying to production to ensure the image is reproducible.

---

## Rollback Procedure

If a deployment causes issues:

```bash
# Stop services
docker compose down

# Revert code
git checkout <previous-stable-commit>

# Rebuild and restart
docker compose build api frontend
docker compose up -d

# Run migrations down if needed
docker compose exec api alembic downgrade -1
```

---

## Port Reference

| Service | Container Port | Host Port |
|---|---|---|
| API (FastAPI) | 8000 | 8100 |
| Frontend (Next.js) | 3000 | 3002 |
| Admin Console | 4000 | 4000 |
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6380 |
| Sentinel | 9200 | 9200 |
| Nginx (prod) | 80/443 | 80/443 |

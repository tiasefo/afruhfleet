# Operational Guide

Guide for operating, monitoring, and troubleshooting the Afruheritage platform in production.

---

## 1. Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Control Plane Host                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Frontend │  │   API    │  │  Worker  │  │   Beat   │   │
│  │ (Next.js)│  │(FastAPI) │  │ (Celery) │  │ (Celery) │   │
│  │ :3002    │  │ :8100    │  │          │  │          │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │          │
│       └─────────────┼─────────────┼─────────────┘          │
│                     │             │                        │
│              ┌──────┴─────┐ ┌─────┴──────┐                 │
│              │ PostgreSQL │ │   Redis    │                 │
│              │   :5433    │ │   :6380    │                 │
│              └────────────┘ └────────────┘                 │
│                                                              │
│  ┌──────────────┐  ┌─────────────┐                         │
│  │ Admin Console│  │  Sentinel   │                         │
│  │    :4000     │  │   :9200     │                         │
│  └──────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                        │ SSH
                   ┌────┴────┐
                   │ Runner  │  (Fleetbase tenant runtimes)
                   │  Node   │
                   └─────────┘
```

---

## 2. Daily Operations

### 2.1 Check Service Health

```bash
# Quick check — all containers
docker compose ps

# Detailed health
docker ps --filter name=afruheritage --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# API health endpoint
curl -s http://localhost:8100/health | python3 -m json.tool

# Frontend check
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/
```

### 2.2 View Logs

```bash
# API logs (last 100 lines)
docker logs afruheritage-api --tail 100

# Follow API logs in real-time
docker logs -f afruheritage-api

# Frontend logs
docker logs afruheritage-frontend --tail 100

# Celery worker logs (provisioning jobs)
docker logs afruheritage-worker --tail 100

# Celery beat logs (scheduled tasks)
docker logs afruheritage-beat --tail 100

# PostgreSQL logs
docker logs afruheritage-postgres --tail 50

# Redis logs
docker logs afruheritage-redis --tail 50
```

### 2.3 Run E2E Tests

```bash
cd ~/fleetbase/afruhfleet/afruheritage-platform
./e2e_uat_test.sh
```

Results saved to `e2e_uat_results_<timestamp>.txt`. All tests should pass.

---

## 3. Backups

### 3.1 Database Backup

```bash
# Manual backup
docker exec afruheritage-postgres pg_dump -U afruheritage afruheritage | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
gunzip -c backup_20260712_060000.sql.gz | docker exec -i afruheritage-postgres psql -U afruheritage afruheritage
```

### 3.2 Automated Daily Backups (Cron)

Add to crontab (`crontab -e`):

```bash
# Daily database backup at 2 AM
0 2 * * * docker exec afruheritage-postgres pg_dump -U afruheritage afruheritage | gzip > /backups/afruheritage_$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 3 * * * find /backups -name "afruheritage_*.sql.gz" -mtime +30 -delete
```

### 3.3 Volume Backup

```bash
# Backup all Docker volumes
docker run --rm -v afruheritage-platform_postgres_data:/data -v /backups:/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz /data

# Backup .env and config files
tar czf /backups/config_$(date +%Y%m%d).tar.gz .env docker-compose.yml
```

### 3.4 Redis Backup

Redis is used for rate limiting and Celery queues. No persistent data needs backup — it's all in PostgreSQL.

---

## 4. Monitoring

### 4.1 Key Metrics to Watch

| Metric | How to Check | Alert Threshold |
|---|---|---|
| API response time | `curl -sw '%{time_total}' http://localhost:8100/health` | > 2 seconds |
| API error rate | `docker logs afruheritage-api --tail 1000 \| grep -c '500'` | > 1% of requests |
| Database connections | `docker exec afruheritage-postgres psql -U afruheritage -c "SELECT count(*) FROM pg_stat_activity"` | > 80 |
| Redis memory | `docker exec afruheritage-redis redis-cli info memory \| grep used_memory_human` | > 80% of max |
| Disk space | `df -h` | > 85% used |
| Container restarts | `docker ps --format "{{.Names}} {{.Status}}" \| grep -i restart` | Any unexpected restarts |
| Failed provisioning jobs | `docker exec afruheritage-postgres psql -U afruheritage -c "SELECT count(*) FROM provisioning_jobs WHERE status='failed'"` | > 0 |

### 4.2 Simple Health Check Script

Create `/opt/afruheritage/healthcheck.sh`:

```bash
#!/bin/bash
ALERT_EMAIL="ops@yourcompany.com"
HOST="http://localhost:8100"

# Check API
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HOST/health)
if [ "$API_STATUS" != "200" ]; then
  echo "API DOWN — HTTP $API_STATUS" | mail -s "Afruheritage API Alert" $ALERT_EMAIL
fi

# Check frontend
FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/)
if [ "$FE_STATUS" != "200" ]; then
  echo "Frontend DOWN — HTTP $FE_STATUS" | mail -s "Afruheritage Frontend Alert" $ALERT_EMAIL
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$DISK_USAGE" -gt 85 ]; then
  echo "Disk space critical: ${DISK_USAGE}%" | mail -s "Afruheritage Disk Alert" $ALERT_EMAIL
fi
```

Add to crontab:
```bash
*/5 * * * * /opt/afruheritage/healthcheck.sh
```

---

## 5. Common Operations

### 5.1 Restart a Single Service

```bash
docker compose restart api
docker compose restart frontend
docker compose restart worker
```

### 5.2 Apply Code Changes

**Fast (development/staging):**
```bash
# Copy changed files into container
docker cp app/main.py afruheritage-api:/app/app/main.py
docker restart afruheritage-api
```

**Full (production):**
```bash
git pull
docker compose build api frontend
docker compose up -d --force-recreate api frontend
```

### 5.3 Run Database Migration

```bash
# Apply pending migrations
docker compose exec api alembic upgrade head

# Check current migration version
docker compose exec api alembic current

# Rollback one migration
docker compose exec api alembic downgrade -1

# View migration history
docker compose exec api alembic history --verbose
```

### 5.4 Create a New Tenant

```bash
TOKEN=$(curl -s -X POST http://localhost:8100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@afruheritage.com","password":"YOUR_PASSWORD"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl -X POST http://localhost:8100/api/v1/tenants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "New Tenant Co",
    "contact_email": "admin@newtenant.com",
    "slug": "new-tenant-co",
    "template_code": "freight"
  }'
```

### 5.5 Suspend a Tenant

```bash
curl -X PATCH http://localhost:8100/api/v1/tenants/$TENANT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended"}'
```

### 5.6 View Database Tables

```bash
# List all tables
docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "\dt"

# Count rows in key tables
docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c "
  SELECT 'tenants' as t, count(*) FROM tenants
  UNION ALL SELECT 'users', count(*) FROM users
  UNION ALL SELECT 'tenant_branding', count(*) FROM tenant_branding
  UNION ALL SELECT 'fleetbase_runners', count(*) FROM fleetbase_runner_nodes
  UNION ALL SELECT 'fleetbase_runtimes', count(*) FROM fleetbase_runtimes
  UNION ALL SELECT 'subscriptions', count(*) FROM subscriptions
  UNION ALL SELECT 'support_tickets', count(*) FROM support_tickets
  UNION ALL SELECT 'custom_domains', count(*) FROM custom_domains
  UNION ALL SELECT 'audit_events', count(*) FROM audit_events
;"
```

---

## 6. Troubleshooting

### 6.1 API Container Won't Start

```bash
# Check logs for startup errors
docker logs afruheritage-api --tail 50

# Common causes:
# - Database connection failed → check DATABASE_URL in .env
# - Migration pending → run: docker compose exec api alembic upgrade head
# - Port conflict → check: lsof -i :8100
# - Missing env var → check: docker compose exec api env | grep REQUIRED_VAR
```

### 6.2 Frontend Shows Blank Page

```bash
# Check if frontend container is running
docker ps --filter name=afruheritage-frontend

# Check frontend logs for build errors
docker logs afruheritage-frontend --tail 50

# Verify API is reachable from frontend container
docker exec afruheritage-frontend curl -s http://api:8000/health
```

### 6.3 Tenant Storefront Shows 404

```bash
# Verify tenant exists in database
docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c \
  "SELECT id, slug, status FROM tenants WHERE slug = 'tenant-slug'"

# Check branding exists
docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c \
  "SELECT * FROM tenant_branding WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'tenant-slug')"

# Test API directly
curl -s http://localhost:8100/api/v1/branding/public/tenant-slug
```

### 6.4 Provisioning Job Stuck

```bash
# Check job status
docker exec afruheritage-postgres psql -U afruheritage -d afruheritage -c \
  "SELECT id, status, error_message FROM provisioning_jobs ORDER BY created_at DESC LIMIT 5"

# Check worker logs
docker logs afruheritage-worker --tail 100

# Check SSH connectivity to runner
docker exec afruheritage-api ssh -i /path/to/key deploy@runner-host "echo connected"
```

### 6.5 Rate Limiting Not Working

```bash
# Verify Redis is running
docker exec afruheritage-redis redis-cli ping
# Should return: PONG

# Check limiter storage
docker exec afruheritage-api python3 -c "
from app.middleware.rate_limit import limiter
print('Storage URI:', limiter._storage_uri)
print('Enabled:', limiter.enabled)
"

# Test rate limit
for i in $(seq 1 7); do
  echo -n "  attempt $i: "
  curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8100/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -H "X-Forwarded-For: 1.1.1.1" \
    -d '{"username":"test@test.com","password":"x"}'
  echo
done
# 6th attempt should return 429
```

### 6.6 Database Connection Pool Exhausted

```bash
# Check active connections
docker exec afruheritage-postgres psql -U afruheritage -c \
  "SELECT state, count(*) FROM pg_stat_activity GROUP BY state"

# Kill idle connections
docker exec afruheritage-postgres psql -U afruheritage -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes'"
```

---

## 7. Security Checklist

- [ ] `APP_ENV=production` in `.env`
- [ ] `ENABLE_BOOTSTRAP_ADMIN=false` after admin creation
- [ ] `SECRET_KEY` is a strong random string (32+ chars)
- [ ] `CORS_ORIGINS` restricted to production domains (no `*`)
- [ ] PostgreSQL password is strong and not default
- [ ] Redis has password set (if exposed)
- [ ] SSH keys for runner access are dedicated (not shared)
- [ ] Cloudflare API token has minimal permissions
- [ ] Paystack keys are production keys (not test)
- [ ] Security headers verified via `e2e_uat_test.sh`
- [ ] Rate limiting verified (login returns 429 after 5 attempts)
- [ ] API docs disabled in production (`/api/docs` returns 404)
- [ ] Firewall configured: only ports 80/443/22 exposed externally
- [ ] SSH root login disabled
- [ ] Fail2ban installed for SSH brute-force protection

---

## 8. Upgrade Procedure

### 8.1 Standard Upgrade

```bash
# 1. Backup database
docker exec afruheritage-postgres pg_dump -U afruheritage afruheritage | gzip > backup_pre_upgrade_$(date +%Y%m%d).sql.gz

# 2. Pull latest code
git pull origin main

# 3. Build new images
docker compose build api frontend

# 4. Run migrations
docker compose run --rm api alembic upgrade head

# 5. Restart services
docker compose up -d --force-recreate api frontend worker beat

# 6. Verify
sleep 30
docker compose ps
./e2e_uat_test.sh
```

### 8.2 Rollback if Upgrade Fails

```bash
# 1. Stop services
docker compose down

# 2. Revert code
git checkout <previous-stable-commit>

# 3. Restore database if migrations changed schema
gunzip -c backup_pre_upgrade_YYYYMMDD.sql.gz | docker exec -i afruheritage-postgres psql -U afruheritage afruheritage

# 4. Rebuild and restart
docker compose build api frontend
docker compose up -d
```

---

## 9. Log Rotation

Docker logs can grow large. Configure log rotation in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5"
  }
}
```

Restart Docker: `sudo systemctl restart docker`

---

## 10. Capacity Planning

| Component | Current Limit | Scale When | How to Scale |
|---|---|---|---|
| API | Single container | CPU > 70% | Add replicas behind load balancer |
| Frontend | Single container | CPU > 70% | Add replicas behind load balancer |
| PostgreSQL | Single instance | Connections > 80 | Connection pooler (PgBouncer) |
| Redis | Single instance | Memory > 80% | Redis Cluster |
| Worker | Single container | Queue backlog growing | Add worker replicas |
| Runner | 10 tenants/node | current_tenants = max_tenants | Register new runner node |

---

## 11. Disaster Recovery

### 11.1 Full System Recovery

```bash
# 1. Install Docker on new host
# 2. Clone repository
git clone <repo-url> ~/fleetbase/afruhfleet/afruheritage-platform
cd ~/fleetbase/afruhfleet/afruheritage-platform

# 3. Restore .env from backup
tar xzf /backups/config_YYYYMMDD.tar.gz .env docker-compose.yml

# 4. Start PostgreSQL and Redis first
docker compose up -d postgres redis
sleep 10

# 5. Restore database
gunzip -c /backups/afruheritage_YYYYMMDD.sql.gz | docker exec -i afruheritage-postgres psql -U afruheritage afruheritage

# 6. Build and start all services
docker compose build
docker compose up -d

# 7. Run migrations
docker compose exec api alembic upgrade head

# 8. Verify
./e2e_uat_test.sh
```

### 11.2 Recovery Time Objectives

| Scenario | RTO | RPO |
|---|---|---|
| Single service failure | 5 minutes | 0 (no data loss) |
| Database failure | 30 minutes | 24 hours (last backup) |
| Full host failure | 2 hours | 24 hours (last backup) |

---

## 12. Useful Aliases

Add to `~/.bashrc`:

```bash
alias afru-ps='docker ps --filter name=afruheritage --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'
alias afru-logs='docker logs -f afruheritage-api --tail 100'
alias afru-fe-logs='docker logs -f afruheritage-frontend --tail 100'
alias afru-worker-logs='docker logs -f afruheritage-worker --tail 100'
alias afru-db='docker exec -it afruheritage-postgres psql -U afruheritage -d afruheritage'
alias afru-redis='docker exec -it afruheritage-redis redis-cli'
alias afru-test='cd ~/fleetbase/afruhfleet/afruheritage-platform && ./e2e_uat_test.sh'
alias afru-restart='docker compose restart api frontend worker beat'
alias afru-build='docker compose build api frontend && docker compose up -d --force-recreate api frontend'
```

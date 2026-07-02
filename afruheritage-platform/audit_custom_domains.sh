#!/usr/bin/env bash
set -euo pipefail

OUT="custom_domains_audit_$(date +%Y%m%d_%H%M%S).txt"
API="${API:-http://127.0.0.1:8100}"
WEB="${WEB:-http://127.0.0.1:3002}"

: > "$OUT"

log(){ echo "$@" | tee -a "$OUT"; }
section(){
  echo "" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
  echo "$@" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
}

section "CUSTOM DOMAIN AUDIT"
log "PWD: $(pwd)"
log "API=$API"
log "WEB=$WEB"

section "OPENAPI DOMAIN ROUTES"
curl -s "$API/openapi.json" > /tmp/afru_openapi_domains.json || true
jq -r '.paths | keys[]' /tmp/afru_openapi_domains.json | grep -Ei "domain|dns|tenant" | sort | tee -a "$OUT" || true

section "SOURCE ROUTES / SERVICES"
grep -RIn \
  --exclude-dir=__pycache__ \
  --exclude-dir=node_modules \
  "domains/resolve\|custom_domain\|custom_domains\|custom-domain\|dns\|hostname\|CNAME\|verification\|ssl" \
  app frontend admin-console \
  | head -400 | tee -a "$OUT" || true

section "FRONTEND MIDDLEWARE DOMAIN RESOLUTION"
sed -n '1,180p' frontend/middleware.ts | tee -a "$OUT"

section "DATABASE TABLES"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage -c "\dt *domain*" | tee -a "$OUT" || true

section "CUSTOM DOMAIN SCHEMAS"
for t in custom_domains custom_domain_events tenants; do
  log ""
  log "---- $t ----"
  docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage -c "\d $t" 2>/dev/null | tee -a "$OUT" || log "missing table: $t"
done

section "CUSTOM DOMAIN DATA"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT * FROM custom_domains ORDER BY created_at DESC LIMIT 20;
SELECT * FROM custom_domain_events ORDER BY created_at DESC LIMIT 20;
SQL

section "TENANT DOMAIN FIELDS"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT
id,
company_name,
slug,
requested_domain,
domain_type,
launch_status,
live_console_url,
live_api_url
FROM tenants
ORDER BY created_at DESC;
SQL

section "DOMAIN RESOLVE SMOKE"
for h in \
afruheritage.com \
www.afruheritage.com \
empire.com \
portal.empire.com \
susukredit-workspace.afruheritage.com \
empire-drips.afruheritage.com
do
  log "---- hostname=$h ----"
  curl -s "$API/api/v1/domains/resolve?hostname=$h" | tee -a "$OUT" || true
  echo "" | tee -a "$OUT"
done

section "ADMIN DOMAIN PAGE CHECK"
find admin-console frontend/app -type f | grep -Ei "domain|dns" | sort | tee -a "$OUT" || true

section "SUMMARY FLAGS"
log "Questions this audit must answer:"
log "1. Does /api/v1/domains/resolve exist?"
log "2. Does custom_domains table support status/verification?"
log "3. Does middleware call the right API URL?"
log "4. Is there an admin UI for approving/verifying domains?"
log "5. Can custom domain map host → tenant?"
log "6. Do we need migrations for verification_token, dns_target, ssl_status?"

section "AUDIT COMPLETE"
log "Audit written to: $OUT"

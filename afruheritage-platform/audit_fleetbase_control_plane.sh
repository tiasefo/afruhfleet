#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
OUT="fleetbase_control_plane_audit_$TS.txt"
API_BASE="${API_BASE:-http://127.0.0.1:8100}"
FRONTEND_BASE="${FRONTEND_BASE:-http://127.0.0.1:3002}"

: > "$OUT"

log(){ echo "$@" | tee -a "$OUT"; }
section(){
  echo "" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
  echo "$@" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
}

section "FLEETBASE CONTROL PLANE AUDIT"
log "PWD: $(pwd)"
log "DATE: $(date)"
log "API_BASE=$API_BASE"
log "FRONTEND_BASE=$FRONTEND_BASE"

section "DOCKER STATUS"
docker compose ps | tee -a "$OUT" || true

section "FLEETBASE RUNTIME LOCATIONS"
find /mnt/storage /home/afruheritage -maxdepth 6 -type d -iname "fleetbase" 2>/dev/null | sort | tee -a "$OUT" || true

section "FLEETBASE RUNTIME COMPOSE FILES"
find /mnt/storage /home/afruheritage -path "*fleetbase*docker-compose*.yml" -o -path "*fleetbase*compose*.yaml" 2>/dev/null | sort | tee -a "$OUT" || true

section "AFRUHERITAGE API OPENAPI FEATURE MATCHES"
curl -s "$API_BASE/openapi.json" > /tmp/afru_openapi.json || true

if [ -s /tmp/afru_openapi.json ]; then
  for key in fleetbase runtime provision driver drivers vehicle vehicles fleet fleets gps tracking dispatch route routes shipment shipments order orders vendor vendors marketplace customer customers member members billing subscription credits wallet kyc crm contact quote support ticket domain tenant; do
    log ""
    log "---- $key ----"
    jq -r '.paths | keys[]' /tmp/afru_openapi.json | grep -i "$key" | sort | tee -a "$OUT" || true
  done
else
  log "FAILED: could not fetch $API_BASE/openapi.json"
fi

section "FRONTEND FLEETBASE / OPERATIONS PAGES"
find frontend/app -type f -name "page.tsx" | egrep "fleetbase|drivers|vehicles|shipments|vendors|marketplace|tracking|members|billing|crm|support|tenant" | sort | tee -a "$OUT" || true

section "FRONTEND API CALLS RELATED TO FLEETBASE OVERLAP"
grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  "fetch(\|axios\|api.get\|api.post\|/api/v1/" \
  frontend admin-console/frontend \
  | egrep -i "fleetbase|runtime|provision|driver|vehicle|shipment|tracking|vendor|marketplace|member|billing|crm|support|tenant|domain" \
  | tee -a "$OUT" || true

section "DATABASE TABLE INVENTORY"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage -c "\dt" | tee -a "$OUT" || true

section "DATABASE SCHEMAS FOR CONTROL PLANE TABLES"
for t in \
fleetbase_runtimes fleetbase_runtime_events fleetbase_runner_nodes provisioning_jobs \
billing_plans billing_subscriptions billing_wallets billing_wallet_transactions billing_payments \
crm_accounts crm_contacts crm_opportunities crm_quotes \
delivery_vendors marketplace_shipments marketplace_gps_pings \
custom_domains custom_domain_events tenant_requests tenants users group_members \
kyc_submissions support_tickets support_ticket_messages \
guest_customs_checks customs_payment_intents
do
  log ""
  log "---- $t ----"
  docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage -c "\d $t" 2>/dev/null | tee -a "$OUT" || log "missing table: $t"
done

section "DATABASE COUNTS"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT 'fleetbase_runtimes' AS table_name, count(*) FROM fleetbase_runtimes
UNION ALL SELECT 'fleetbase_runtime_events', count(*) FROM fleetbase_runtime_events
UNION ALL SELECT 'fleetbase_runner_nodes', count(*) FROM fleetbase_runner_nodes
UNION ALL SELECT 'provisioning_jobs', count(*) FROM provisioning_jobs
UNION ALL SELECT 'billing_plans', count(*) FROM billing_plans
UNION ALL SELECT 'billing_subscriptions', count(*) FROM billing_subscriptions
UNION ALL SELECT 'billing_wallets', count(*) FROM billing_wallets
UNION ALL SELECT 'crm_accounts', count(*) FROM crm_accounts
UNION ALL SELECT 'crm_contacts', count(*) FROM crm_contacts
UNION ALL SELECT 'crm_quotes', count(*) FROM crm_quotes
UNION ALL SELECT 'delivery_vendors', count(*) FROM delivery_vendors
UNION ALL SELECT 'marketplace_shipments', count(*) FROM marketplace_shipments
UNION ALL SELECT 'marketplace_gps_pings', count(*) FROM marketplace_gps_pings
UNION ALL SELECT 'custom_domains', count(*) FROM custom_domains
UNION ALL SELECT 'kyc_submissions', count(*) FROM kyc_submissions;
SQL

section "RUNTIME RECORD SAMPLE"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT id, tenant_id, status, base_url, console_url, api_url, created_at
FROM fleetbase_runtimes
ORDER BY created_at DESC
LIMIT 10;
SQL

section "PROVISIONING JOB SAMPLE"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT id, tenant_id, job_type, status, created_at, updated_at
FROM provisioning_jobs
ORDER BY created_at DESC
LIMIT 20;
SQL

section "RUNTIME FILE SIGNALS"
grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  "fleetbase_runtimes\|fleetbase_runtime\|provisioning_jobs\|provision-runtime\|reconcile-runtime\|console_url\|api_url\|base_url" \
  app admin-console frontend scripts \
  | head -400 | tee -a "$OUT" || true

section "FLEETBASE FEATURES TO AVOID REBUILDING"
log "If Fleetbase runtime/console supports these, AfruHeritage should redirect/embed/SSO instead of rebuilding:"
log "- Drivers"
log "- Vehicles"
log "- Fleets"
log "- Dispatch"
log "- Routes"
log "- Orders"
log "- Live tracking/GPS"
log "- Operational fleet analytics"
log "- Customer delivery tracking"
log "- Driver mobile workflow"

section "AFRUHERITAGE FEATURES TO KEEP IN CONTROL PLANE"
log "AfruHeritage should own these even if Fleetbase exists:"
log "- Tenant registration and approval"
log "- Subscription/billing/credits"
log "- KYC/vendor verification"
log "- CRM/accounts/contacts/quotes"
log "- Customs duty guest payment and usage"
log "- Domain/branding"
log "- CSV identity resolution/import"
log "- Fleetbase runtime provisioning and health"
log "- SSO/redirect into Fleetbase"

section "CSV IMPORT / IDENTITY RESOLUTION AUDIT"
grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  "bulk-import\|csv\|xlsx\|import\|phone\|duplicate\|dedupe\|merge\|send_invite" \
  app frontend admin-console \
  | head -500 | tee -a "$OUT" || true

section "RECOMMENDED DECISION MATRIX"
cat <<'EOF' | tee -a "$OUT"
Feature | Keep in AfruHeritage | Redirect/Use Fleetbase | Needs Proof
---|---|---|---
Tenant onboarding | YES | NO | API + DB already present
Billing/subscription | YES | NO | Admin billing UI/API present
CRM | YES | NO | Tables present, CRUD needs smoke test
KYC | YES | NO | Admin KYC route needs smoke test
CSV import/identity resolution | YES | NO | Needs upgrade
Fleetbase provisioning | YES | Fleetbase runtime target | Verify job -> runtime
Drivers | NO, except summary | YES | Check Fleetbase console/API
Vehicles | NO, except summary | YES | Check Fleetbase console/API
Dispatch/jobs/routes | NO, except summary | YES | Check Fleetbase console/API
Live tracking | NO, except marketing/status | YES | Check Fleetbase GPS/live map
Shipment operations | Maybe summary only | YES if Fleetbase supports | Compare API overlap
Vendor marketplace | YES for onboarding/verification | Fleetbase for execution | Needs mapping
Support tickets | YES | Maybe integrate | Keep public support
Customs | YES | NO | Already unique to AfruHeritage
EOF

section "AUDIT COMPLETE"
log "Audit written to: $OUT"

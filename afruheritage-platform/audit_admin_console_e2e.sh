#!/usr/bin/env bash
set -euo pipefail

OUT="admin_console_e2e_audit_$(date +%Y%m%d_%H%M%S).txt"
BASE_API="${BASE_API:-http://127.0.0.1:8100}"
ADMIN_URL="${ADMIN_URL:-http://127.0.0.1:4000}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3002}"

: > "$OUT"

log(){ echo "$@" | tee -a "$OUT"; }
section(){
  echo "" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
  echo "$@" | tee -a "$OUT"
  echo "============================================================" | tee -a "$OUT"
}

section "ADMIN CONSOLE END-TO-END AUDIT"
log "PWD: $(pwd)"
log "DATE: $(date)"
log "BASE_API=$BASE_API"
log "ADMIN_URL=$ADMIN_URL"
log "FRONTEND_URL=$FRONTEND_URL"

section "DOCKER SERVICES"
docker compose ps | tee -a "$OUT" || true

section "GIT STATUS"
git status --short | tee -a "$OUT" || true

section "PROJECT STRUCTURE: ADMIN CONSOLE"
find admin-console -maxdepth 5 -type f | sort | tee -a "$OUT" || true

section "ADMIN FRONTEND ROUTES"
find admin-console/frontend -type f \( -name "page.tsx" -o -name "layout.tsx" -o -name "*.tsx" \) | sort | tee -a "$OUT" || true

section "ADMIN BACKEND ROUTES"
find admin-console/admin_app -type f \( -name "*.py" \) | sort | tee -a "$OUT" || true

section "CONTROL PLANE ROUTES IN MAIN API"
find app/api/routes -type f -name "*.py" | sort | tee -a "$OUT" || true

section "OPENAPI: MAIN API PATH INVENTORY"
curl -s "$BASE_API/openapi.json" > /tmp/afru_api_openapi.json || true

if [ -s /tmp/afru_api_openapi.json ]; then
  jq -r '.paths | keys[]' /tmp/afru_api_openapi.json | sort | tee -a "$OUT" || true
else
  log "FAILED: Could not fetch main API openapi.json"
fi

section "OPENAPI: FEATURE GROUPS"
if [ -s /tmp/afru_api_openapi.json ]; then
  for key in auth tenant tenants billing subscription payment paystack invoice crm support customs guest fleetbase domain branding product storefront admin runtime dashboard user role permission; do
    log ""
    log "---- $key ----"
    jq -r '.paths | keys[]' /tmp/afru_api_openapi.json | grep -i "$key" | sort | tee -a "$OUT" || true
  done
fi

section "ADMIN CONSOLE HTTP HEALTH"
for p in / /health /api/health /dashboard /dashboard/tenants /dashboard/billing /dashboard/runtime; do
  log "---- admin-console $p ----"
  curl -I -s "$ADMIN_URL$p" | egrep -i "HTTP/|location:|content-type" | tee -a "$OUT" || true
done

section "MAIN FRONTEND ADMIN ROUTES HEALTH"
for p in /admin /admin/runtime /admin/customs/guest-usage /dashboard /billing /crm /crm/contacts /crm/quotes /support/dashboard; do
  log "---- frontend $p ----"
  curl -I -s "$FRONTEND_URL$p" | egrep -i "HTTP/|location:|content-type" | tee -a "$OUT" || true
done

section "ADMIN CONSOLE FEATURE KEYWORDS"
for key in tenant billing subscription invoice paystack payment crm quote contact support ticket customs guest usage runtime provisioning domain branding role permission approval dashboard analytics; do
  log ""
  log "---- keyword: $key ----"
  grep -R "$key" admin-console app frontend/app/admin frontend/app/dashboard frontend/app/billing frontend/app/crm frontend/app/support -n -i | head -120 | tee -a "$OUT" || true
done

section "BILLING / SUBSCRIPTION CODE INVENTORY"
grep -R "subscription\|billing\|invoice\|paystack\|payment\|plan\|credit" app admin-console frontend/app/billing frontend/app/pricing frontend/components/auth -n -i | head -300 | tee -a "$OUT" || true

section "CRM CODE INVENTORY"
grep -R "crm\|contact\|quote\|opportunit\|lead\|account" app admin-console frontend/app/crm frontend/app/support -n -i | head -300 | tee -a "$OUT" || true

section "TENANT / PROVISIONING CODE INVENTORY"
grep -R "tenant\|provision\|domain\|subdomain\|workspace\|fleetbase" app admin-console frontend/app/tenant-request frontend/app/admin frontend/app/dashboard -n -i | head -400 | tee -a "$OUT" || true

section "CUSTOMS ADMIN / GUEST PAYMENT CODE INVENTORY"
grep -R "guest_customs\|customs_payment\|Paystack\|payment_required\|free_remaining\|guest_id\|fingerprint" app admin-console frontend/app/admin frontend/app/customs -n -i | head -300 | tee -a "$OUT" || true

section "DATABASE TABLES"
docker compose exec -T postgres psql -U afruheritage -d afruheritage -c "\dt" | tee -a "$OUT" || true

section "DATABASE TABLE SCHEMAS: BILLING / CRM / TENANT / CUSTOMS"
for t in \
tenants tenant_branding billing_accounts subscription_plans subscriptions invoices payments payment_transactions paystack_transactions \
crm_accounts crm_contacts crm_quotes support_tickets support_ticket_messages \
guest_customs_checks customs_payment_intents tenant_requests companies users roles permissions audit_logs
do
  log ""
  log "---- table: $t ----"
  docker compose exec -T postgres psql -U afruheritage -d afruheritage -c "\d $t" 2>/dev/null | tee -a "$OUT" || log "missing table: $t"
done

section "DATABASE COUNTS"
docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT 'tenants' table_name, count(*) FROM tenants
UNION ALL SELECT 'guest_customs_checks', count(*) FROM guest_customs_checks
UNION ALL SELECT 'customs_payment_intents', count(*) FROM customs_payment_intents;
SQL

section "API SMOKE TESTS: PUBLIC / HEALTH"
for p in /api/v1/health /api/v1/docs /api/v1/openapi.json; do
  log "---- $p ----"
  curl -I -s "http://127.0.0.1:8100$p" | egrep -i "HTTP/|content-type" | tee -a "$OUT" || true
done

section "API SMOKE TESTS: LIKELY ADMIN / BILLING / CRM ROUTES"
if [ -s /tmp/afru_api_openapi.json ]; then
  jq -r '.paths | keys[]' /tmp/afru_api_openapi.json \
    | egrep -i "admin|billing|subscription|invoice|payment|crm|support|tenant|customs|fleetbase|domain|branding" \
    | head -80 \
    | while read -r p; do
        # Replace path params with sample IDs to avoid curl syntax issues.
        path="$(echo "$p" | sed -E 's/\{[^}]+\}/test/g')"
        log "---- HEAD $path ----"
        curl -I -s "$BASE_API$path" | egrep -i "HTTP/|location:|content-type" | tee -a "$OUT" || true
      done
fi

section "MAPPING: ADMIN UI PAGES TO API CALLS"
grep -R "fetch(\|apiClient\|axios\|/api/v1\|NEXT_PUBLIC_API" admin-console/frontend frontend/app/admin frontend/app/dashboard frontend/app/billing frontend/app/crm frontend/app/support -n | tee -a "$OUT" || true

section "RISK FLAGS"
log "Unimplemented / TODO / placeholder / mock / fake references:"
grep -R "TODO\|FIXME\|placeholder\|mock\|fake\|coming soon\|stub\|Wire this route" admin-console app frontend/app/admin frontend/app/dashboard frontend/app/billing frontend/app/crm frontend/app/support -n -i | head -300 | tee -a "$OUT" || true

section "SUMMARY QUESTIONS TO ANSWER FROM THIS AUDIT"
log "1. What Admin Console pages exist?"
log "2. Which admin pages call real APIs?"
log "3. Which features are implemented only in frontend but not backend?"
log "4. Which backend routes exist but are not wired to admin UI?"
log "5. How are subscription, billing, Paystack, invoices, and credits controlled?"
log "6. What CRM capabilities exist: contacts, accounts, quotes, support tickets?"
log "7. What tenant lifecycle controls exist: request, approve, provision, suspend, domain, branding?"
log "8. What customs guest usage controls exist?"
log "9. What admin features are still stubbed or unsafe for UAT?"

section "AUDIT COMPLETE"
log "Audit written to: $OUT"

#!/usr/bin/env bash
#
# UAT MVP Verification Script
# Tests AMOOKSCO (Freight Engine), MetroMass (Fleet Engine), and Platform Admin
# end-to-end. Exits non-zero if any check fails.
#
# Usage: bash scripts/uat_mvp_verification.sh
#

set -euo pipefail

API_BASE="http://localhost:8100"
FRONTEND_BASE="http://localhost:3002"
ADMIN_BASE="http://localhost:3001"
DB_CONTAINER="afruheritage-postgres"
DB_USER="afruheritage"
DB_NAME="afruheritage"

PASS=0
FAIL=0
WARN=0
FAILURES=()

green()  { printf "\033[32m%s\033[0m\n" "$1"; }
red()    { printf "\033[31m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
bold()   { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local label="$1"
  local condition="$2"
  local detail="${3:-}"
  if [ "$condition" = "true" ] || [ "$condition" = "0" ]; then
    green "  [PASS] $label"
    PASS=$((PASS + 1))
  else
    red "  [FAIL] $label"
    FAIL=$((FAIL + 1))
    FAILURES+=("$label${detail:+ — $detail}")
  fi
}

warn() {
  local label="$1"
  yellow "  [WARN] $label"
  WARN=$((WARN + 1))
}

psql_query() {
  docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -c "$1" 2>/dev/null
}

http_status() {
  curl -s -o /dev/null -w "%{http_code}" "$1" 2>/dev/null
}

http_body() {
  curl -s "$1" 2>/dev/null
}

contains() {
  echo "$1" | grep -q "$2" && echo "true" || echo "false"
}

not_contains() {
  echo "$1" | grep -q "$2" && echo "false" || echo "true"
}

bold "=========================================="
bold "  UAT MVP Verification — $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
bold "=========================================="
echo ""

# ─── 1. Container Health ─────────────────────────────────────────────────────

bold "1. Container Health"
echo ""

CONTAINERS=(
  "afruheritage-api"
  "afruheritage-frontend"
  "afruheritage-worker"
  "afruheritage-beat"
  "afruheritage-postgres"
  "afruheritage-redis"
  "afruheritage-admin-console"
)

for c in "${CONTAINERS[@]}"; do
  status=$(docker ps --filter "name=$c" --format "{{.Status}}" 2>/dev/null)
  if echo "$status" | grep -qi "healthy\|Up"; then
    check "$c is up and healthy" "true" "$status"
  else
    check "$c is up and healthy" "false" "$status"
  fi
done

echo ""

# ─── 2. Tenant Database Records ──────────────────────────────────────────────

bold "2. Tenant Database Records"
echo ""

# AMOOKSCO
AMOOKSCO_ID=$(psql_query "SELECT id FROM tenants WHERE slug = 'amooksco-logistics';")
AMOOKSCO_NAME=$(psql_query "SELECT company_name FROM tenants WHERE slug = 'amooksco-logistics';")
AMOOKSCO_LAUNCH=$(psql_query "SELECT launch_status FROM tenants WHERE slug = 'amooksco-logistics';")
AMOOKSCO_TEMPLATE=$(psql_query "SELECT template_code FROM tenant_branding WHERE tenant_id = '$AMOOKSCO_ID';")
AMOOKSCO_PRIMARY=$(psql_query "SELECT primary_color FROM tenant_branding WHERE tenant_id = '$AMOOKSCO_ID';")
AMOOKSCO_BILL_STATUS=$(psql_query "SELECT status::text FROM billing_subscriptions WHERE tenant_id = '$AMOOKSCO_ID';")
AMOOKSCO_TENANT_SUB=$(psql_query "SELECT status FROM tenant_subscriptions WHERE tenant_id = '$AMOOKSCO_ID';")

check "AMOOKSCO tenant exists" "$([ -n "$AMOOKSCO_ID" ] && echo true || echo false)"
check "AMOOKSCO company_name = Amooksco Logistics" "$([ "$AMOOKSCO_NAME" = "Amooksco Logistics" ] && echo true || echo false)" "got: $AMOOKSCO_NAME"
check "AMOOKSCO launch_status = active" "$([ "$AMOOKSCO_LAUNCH" = "active" ] && echo true || echo false)" "got: $AMOOKSCO_LAUNCH"
check "AMOOKSCO template_code = freight" "$([ "$AMOOKSCO_TEMPLATE" = "freight" ] && echo true || echo false)" "got: $AMOOKSCO_TEMPLATE"
check "AMOOKSCO primary_color = #1f5d72" "$([ "$AMOOKSCO_PRIMARY" = "#1f5d72" ] && echo true || echo false)" "got: $AMOOKSCO_PRIMARY"
check "AMOOKSCO billing subscription ACTIVE" "$([ "$AMOOKSCO_BILL_STATUS" = "ACTIVE" ] && echo true || echo false)" "got: $AMOOKSCO_BILL_STATUS"
check "AMOOKSCO tenant subscription synced" "$([ -n "$AMOOKSCO_TENANT_SUB" ] && echo true || echo false)" "got: $AMOOKSCO_TENANT_SUB"

# MetroMass
METROMASS_ID=$(psql_query "SELECT id FROM tenants WHERE slug = 'metromass-transit';")
METROMASS_NAME=$(psql_query "SELECT company_name FROM tenants WHERE slug = 'metromass-transit';")
METROMASS_LAUNCH=$(psql_query "SELECT launch_status FROM tenants WHERE slug = 'metromass-transit';")
METROMASS_TEMPLATE=$(psql_query "SELECT template_code FROM tenant_branding WHERE tenant_id = '$METROMASS_ID';")
METROMASS_PRIMARY=$(psql_query "SELECT primary_color FROM tenant_branding WHERE tenant_id = '$METROMASS_ID';")
METROMASS_BUS_FLEET=$(psql_query "SELECT bus_fleet_enabled FROM tenant_branding WHERE tenant_id = '$METROMASS_ID';")
METROMASS_BILL_STATUS=$(psql_query "SELECT status::text FROM billing_subscriptions WHERE tenant_id = '$METROMASS_ID';")
METROMASS_TENANT_SUB=$(psql_query "SELECT status FROM tenant_subscriptions WHERE tenant_id = '$METROMASS_ID';")

check "MetroMass tenant exists" "$([ -n "$METROMASS_ID" ] && echo true || echo false)"
check "MetroMass company_name = MetroMass Transit Ltd" "$([ "$METROMASS_NAME" = "MetroMass Transit Ltd" ] && echo true || echo false)" "got: $METROMASS_NAME"
check "MetroMass launch_status = active" "$([ "$METROMASS_LAUNCH" = "active" ] && echo true || echo false)" "got: $METROMASS_LAUNCH"
check "MetroMass template_code = fleet" "$([ "$METROMASS_TEMPLATE" = "fleet" ] && echo true || echo false)" "got: $METROMASS_TEMPLATE"
check "MetroMass primary_color = #1a3a5c" "$([ "$METROMASS_PRIMARY" = "#1a3a5c" ] && echo true || echo false)" "got: $METROMASS_PRIMARY"
check "MetroMass bus_fleet_enabled = true" "$([ "$METROMASS_BUS_FLEET" = "t" ] && echo true || echo false)" "got: $METROMASS_BUS_FLEET"
check "MetroMass billing subscription ACTIVE" "$([ "$METROMASS_BILL_STATUS" = "ACTIVE" ] && echo true || echo false)" "got: $METROMASS_BILL_STATUS"
check "MetroMass tenant subscription synced" "$([ -n "$METROMASS_TENANT_SUB" ] && echo true || echo false)" "got: $METROMASS_TENANT_SUB"

echo ""

# ─── 3. Tenant Context API ───────────────────────────────────────────────────

bold "3. Tenant Context API"
echo ""

AMOOKSCO_CTX=$(http_body "$API_BASE/api/v1/tenant-context/amooksco-logistics")
AMOOKSCO_CTX_CODE=$(http_status "$API_BASE/api/v1/tenant-context/amooksco-logistics")

check "AMOOKSCO tenant-context returns 200" "$([ "$AMOOKSCO_CTX_CODE" = "200" ] && echo true || echo false)" "got: $AMOOKSCO_CTX_CODE"
check "AMOOKSCO context has template_code=freight" "$(contains "$AMOOKSCO_CTX" 'freight')"
check "AMOOKSCO context has company_name=Amooksco" "$(contains "$AMOOKSCO_CTX" 'Amooksco')"
check "AMOOKSCO context has #1f5d72" "$(contains "$AMOOKSCO_CTX" '#1f5d72')"

METROMASS_CTX=$(http_body "$API_BASE/api/v1/tenant-context/metromass-transit")
METROMASS_CTX_CODE=$(http_status "$API_BASE/api/v1/tenant-context/metromass-transit")

check "MetroMass tenant-context returns 200" "$([ "$METROMASS_CTX_CODE" = "200" ] && echo true || echo false)" "got: $METROMASS_CTX_CODE"
check "MetroMass context has template_code=fleet" "$(contains "$METROMASS_CTX" 'fleet')"
check "MetroMass context has company_name=MetroMass" "$(contains "$METROMASS_CTX" 'MetroMass')"
check "MetroMass context has #1a3a5c" "$(contains "$METROMASS_CTX" '#1a3a5c')"

echo ""

# ─── 4. Storefront Rendering ─────────────────────────────────────────────────

bold "4. Storefront Rendering"
echo ""

AMOOKSCO_PAGE=$(http_body "$FRONTEND_BASE/store/amooksco-logistics")
AMOOKSCO_PAGE_CODE=$(http_status "$FRONTEND_BASE/store/amooksco-logistics")

check "AMOOKSCO storefront returns 200" "$([ "$AMOOKSCO_PAGE_CODE" = "200" ] && echo true || echo false)" "got: $AMOOKSCO_PAGE_CODE"
check "AMOOKSCO renders Freight Forwarding" "$(contains "$AMOOKSCO_PAGE" 'Freight Forwarding')"
check "AMOOKSCO renders Track Your Shipment" "$(contains "$AMOOKSCO_PAGE" 'Track Your Shipment')"
check "AMOOKSCO renders Customs Calculator" "$(contains "$AMOOKSCO_PAGE" 'Customs Calculator')"
check "AMOOKSCO renders Warehouse Notices" "$(contains "$AMOOKSCO_PAGE" 'Warehouse')"
check "AMOOKSCO shows #1f5d72 branding" "$(contains "$AMOOKSCO_PAGE" '#1f5d72')"
check "AMOOKSCO no GenericStorefront text" "$(not_contains "$AMOOKSCO_PAGE" 'Professional logistics and freight forwarding services. Track your shipments in real-time')"
check "AMOOKSCO no default blue #0ea5e9" "$(not_contains "$AMOOKSCO_PAGE" '#0ea5e9')"
# Platform shell has nav links like "Features", "Pricing", "About" in a horizontal nav
# The freight/fleet storefronts have their own headers without these platform links
AMOOKSCO_PLATFORM_SHELL=$(echo "$AMOOKSCO_PAGE" | grep -cE 'href="/login".*href="/register"|href="/register".*href="/login"' || true)
check "AMOOKSCO no AfruHeritage platform shell" "$([ "$AMOOKSCO_PLATFORM_SHELL" = "0" ] && echo true || echo false)" "platform auth links found: $AMOOKSCO_PLATFORM_SHELL"

METROMASS_PAGE=$(http_body "$FRONTEND_BASE/store/metromass-transit")
METROMASS_PAGE_CODE=$(http_status "$FRONTEND_BASE/store/metromass-transit")

check "MetroMass storefront returns 200" "$([ "$METROMASS_PAGE_CODE" = "200" ] && echo true || echo false)" "got: $METROMASS_PAGE_CODE"
check "MetroMass renders Vehicle Tracking" "$(contains "$METROMASS_PAGE" 'Vehicle Tracking')"
check "MetroMass renders Track Your Vehicle" "$(contains "$METROMASS_PAGE" 'Track Your Vehicle')"
check "MetroMass renders Routes section" "$(contains "$METROMASS_PAGE" 'Routes')"
check "MetroMass renders Fleet section" "$(contains "$METROMASS_PAGE" 'Fleet')"
check "MetroMass renders Marketplace" "$(contains "$METROMASS_PAGE" 'Marketplace')"
check "MetroMass shows #1a3a5c branding" "$(contains "$METROMASS_PAGE" '#1a3a5c')"
check "MetroMass no GenericStorefront text" "$(not_contains "$METROMASS_PAGE" 'Professional logistics and freight forwarding services. Track your shipments in real-time')"
check "MetroMass no default blue #0ea5e9" "$(not_contains "$METROMASS_PAGE" '#0ea5e9')"
METROMASS_PLATFORM_SHELL=$(echo "$METROMASS_PAGE" | grep -cE 'href="/login".*href="/register"|href="/register".*href="/login"' || true)
check "MetroMass no AfruHeritage platform shell" "$([ "$METROMASS_PLATFORM_SHELL" = "0" ] && echo true || echo false)" "platform auth links found: $METROMASS_PLATFORM_SHELL"

echo ""

# ─── 5. Protected Portal Redirect ────────────────────────────────────────────

bold "5. Protected Portal Redirect (Unauthenticated)"
echo ""

DASHBOARD_CODE=$(http_status "$FRONTEND_BASE/dashboard")
check "/dashboard redirects unauthenticated (307/302)" "$([ "$DASHBOARD_CODE" = "307" ] || [ "$DASHBOARD_CODE" = "302" ] && echo true || echo false)" "got: $DASHBOARD_CODE"

BILLING_CODE=$(http_status "$FRONTEND_BASE/billing")
check "/billing redirects unauthenticated (307/302)" "$([ "$BILLING_CODE" = "307" ] || [ "$BILLING_CODE" = "302" ] && echo true || echo false)" "got: $BILLING_CODE"

ONBOARDING_CODE=$(http_status "$FRONTEND_BASE/onboarding")
check "/onboarding redirects unauthenticated (307/302)" "$([ "$ONBOARDING_CODE" = "307" ] || [ "$ONBOARDING_CODE" = "302" ] && echo true || echo false)" "got: $ONBOARDING_CODE"

echo ""

# ─── 6. Tenant Admin Users ───────────────────────────────────────────────────

bold "6. Tenant Admin Users"
echo ""

AMOOKSCO_ADMIN=$(psql_query "SELECT COUNT(*) FROM users WHERE tenant_id = '$AMOOKSCO_ID' AND role = 'company_admin';")
check "AMOOKSCO has tenant_admin user" "$([ "$AMOOKSCO_ADMIN" -gt 0 ] 2>/dev/null && echo true || echo false)" "count: $AMOOKSCO_ADMIN"

METROMASS_ADMIN=$(psql_query "SELECT COUNT(*) FROM users WHERE tenant_id = '$METROMASS_ID' AND role = 'company_admin';")
if [ "$METROMASS_ADMIN" -gt 0 ] 2>/dev/null; then
  check "MetroMass has tenant_admin user" "true" "count: $METROMASS_ADMIN"
else
  warn "MetroMass has no tenant_admin user yet (tenant created without auth user)"
fi

echo ""

# ─── 7. Platform Admin ───────────────────────────────────────────────────────

bold "7. Platform Admin"
echo ""

ADMIN_CODE=$(http_status "$ADMIN_BASE/")
check "Platform admin console reachable" "$([ "$ADMIN_CODE" = "200" ] || [ "$ADMIN_CODE" = "307" ] || [ "$ADMIN_CODE" = "302" ] && echo true || echo false)" "got: $ADMIN_CODE"

ADMIN_PLANS_CODE=$(http_status "$API_BASE/api/v1/admin/billing-config/plans")
check "Admin API /admin/billing-config/plans responds (200 or 401/403)" "$([ "$ADMIN_PLANS_CODE" = "200" ] || [ "$ADMIN_PLANS_CODE" = "401" ] || [ "$ADMIN_PLANS_CODE" = "403" ] && echo true || echo false)" "got: $ADMIN_PLANS_CODE"

ADMIN_TEMPLATES_CODE=$(http_status "$API_BASE/api/v1/storefront-templates/admin/all")
check "Admin API /storefront-templates/admin/all responds (200 or 401/403)" "$([ "$ADMIN_TEMPLATES_CODE" = "200" ] || [ "$ADMIN_TEMPLATES_CODE" = "401" ] || [ "$ADMIN_TEMPLATES_CODE" = "403" ] && echo true || echo false)" "got: $ADMIN_TEMPLATES_CODE"

ADMIN_ANALYTICS_CODE=$(http_status "$API_BASE/api/v1/analytics/admin/summary")
check "Admin API /analytics/admin/summary responds (200 or 401/403)" "$([ "$ADMIN_ANALYTICS_CODE" = "200" ] || [ "$ADMIN_ANALYTICS_CODE" = "401" ] || [ "$ADMIN_ANALYTICS_CODE" = "403" ] && echo true || echo false)" "got: $ADMIN_ANALYTICS_CODE"

FREIGHT_TEMPLATE=$(psql_query "SELECT COUNT(*) FROM storefront_templates WHERE template_code = 'freight' AND is_active = true;")
FLEET_TEMPLATE=$(psql_query "SELECT COUNT(*) FROM storefront_templates WHERE template_code = 'fleet' AND is_active = true;")
AMOOKSCO_TEMPLATE_DB=$(psql_query "SELECT COUNT(*) FROM storefront_templates WHERE template_code = 'amooksco' AND is_active = true;")

check "freight template exists and is active" "$([ "$FREIGHT_TEMPLATE" -gt 0 ] 2>/dev/null && echo true || echo false)"
check "fleet template exists and is active" "$([ "$FLEET_TEMPLATE" -gt 0 ] 2>/dev/null && echo true || echo false)"
check "amooksco template still preserved (not deleted)" "$([ "$AMOOKSCO_TEMPLATE_DB" -gt 0 ] 2>/dev/null && echo true || echo false)"

PLANS_COUNT=$(psql_query "SELECT COUNT(*) FROM billing_plans;")
check "Billing plans exist in DB" "$([ "$PLANS_COUNT" -gt 0 ] 2>/dev/null && echo true || echo false)" "count: $PLANS_COUNT"

ADMIN_PAGE=$(http_body "$ADMIN_BASE/" 2>/dev/null)
check "No AMOOKSCO branding in admin console" "$(not_contains "$ADMIN_PAGE" '#1f5d72')"
check "No MetroMass branding in admin console" "$(not_contains "$ADMIN_PAGE" '#1a3a5c')"

echo ""

# ─── 8. Billing Plans API ────────────────────────────────────────────────────

bold "8. Billing Plans API"
echo ""

PLANS_CODE=$(http_status "$API_BASE/api/v1/billing/plans")
PLANS_BODY=$(http_body "$API_BASE/api/v1/billing/plans")

check "Billing plans API returns 200" "$([ "$PLANS_CODE" = "200" ] && echo true || echo false)" "got: $PLANS_CODE"
check "Plans include professional" "$(contains "$PLANS_BODY" 'professional')"
check "Plans include business" "$(contains "$PLANS_BODY" 'business')"

echo ""

# ─── 9. Checkout Flow ────────────────────────────────────────────────────────

bold "9. Checkout Flow"
echo ""

CHECKOUT_CODE=$(http_status "$FRONTEND_BASE/checkout")
check "/checkout page returns 200" "$([ "$CHECKOUT_CODE" = "200" ] && echo true || echo false)" "got: $CHECKOUT_CODE"

SIGNUP_RES=$(curl -s -X POST "$API_BASE/api/v1/commercial/signup/start" \
  -H "Content-Type: application/json" \
  -d '{"email":"uat-verify@test.com","account_type":"tenant_org"}' 2>/dev/null)
SIGNUP_ID=$(echo "$SIGNUP_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('signup_id',''))" 2>/dev/null || echo "")
check "Commercial signup/start works" "$([ -n "$SIGNUP_ID" ] && echo true || echo false)"

if [ -n "$SIGNUP_ID" ]; then
  PLAN_RES=$(curl -s -X POST "$API_BASE/api/v1/commercial/signup/select-plan" \
    -H "Content-Type: application/json" \
    -d "{\"signup_id\":\"$SIGNUP_ID\",\"plan_code\":\"free\",\"addons\":[],\"payment_method\":\"paystack\"}" 2>/dev/null)
  PLAN_STATUS=$(echo "$PLAN_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
  check "Commercial select-plan (free) returns free_tier_ready" "$([ "$PLAN_STATUS" = "free_tier_ready" ] && echo true || echo false)" "got: $PLAN_STATUS"
fi

echo ""

# ─── 10. Celery Worker Health ────────────────────────────────────────────────

bold "10. Celery Worker Health"
echo ""

WORKER_LOGS=$(docker logs afruheritage-worker --tail 50 2>&1)
check "No NewArrival mapper error in worker logs" "$(not_contains "$WORKER_LOGS" 'NewArrival')"
check "No SQLAlchemy mapper error in worker logs" "$(not_contains "$WORKER_LOGS" 'mapper')"
check "No traceback in recent worker logs" "$(not_contains "$WORKER_LOGS" 'Traceback')"

BEAT_LOGS=$(docker logs afruheritage-beat --tail 50 2>&1)
check "Beat scheduler is running" "$(contains "$BEAT_LOGS" 'Scheduler')"
check "No errors in recent beat logs" "$(not_contains "$BEAT_LOGS" 'Error')"

echo ""

# ─── Summary ─────────────────────────────────────────────────────────────────

bold "=========================================="
bold "  UAT SUMMARY"
bold "=========================================="
echo ""
green "  PASSED:  $PASS"
red   "  FAILED:  $FAIL"
yellow "  WARNED:  $WARN"
echo ""

if [ "$FAIL" -gt 0 ]; then
  red "FAILURES:"
  for f in "${FAILURES[@]}"; do
    red "  - $f"
  done
  echo ""
  bold "Result: FAIL"
  exit 1
else
  green "All critical checks passed."
  if [ "$WARN" -gt 0 ]; then
    yellow "Warnings (non-blocking): $WARN"
  fi
  echo ""
  bold "Result: PASS"
  exit 0
fi

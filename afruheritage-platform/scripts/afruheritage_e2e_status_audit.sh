#!/usr/bin/env bash
set -u

API="${API:-http://127.0.0.1:8100}"
FRONTEND="${FRONTEND:-http://127.0.0.1:3002}"
DB_USER="${DB_USER:-afruheritage}"
DB_NAME="${DB_NAME:-afruheritage}"
TENANT_SLUG="${TENANT_SLUG:-amooksco-logistics}"
OUT="reports/e2e-status-$(date +%Y%m%d-%H%M%S).md"

mkdir -p reports

GREEN="🟢 PASS"
YELLOW="🟡 WARN"
RED="🔴 FAIL"
BLUE="🔵 INFO"

line(){ printf '%s\n' "$*" | tee -a "$OUT"; }
section(){ line ""; line "## $1"; line ""; }
check_http(){
  local name="$1" url="$2" expected="${3:-200}"
  code=$(curl -sk -o /tmp/e2e_body.txt -w "%{http_code}" "$url" || echo "000")
  if [ "$code" = "$expected" ]; then status="$GREEN"; elif [ "$code" = "000" ] || [ "$code" = "500" ]; then status="$RED"; else status="$YELLOW"; fi
  line "| $name | $url | $code | $status |"
}

psqlq(){
  docker compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -At -c "$1" 2>/tmp/e2e_psql_err || true
}

line "# AfruHeritage End-to-End Platform Status Audit"
line ""
line "**Date:** $(date -Is)"
line "**API:** $API"
line "**Frontend:** $FRONTEND"
line "**Tenant:** $TENANT_SLUG"

section "1. Container Health"
line "| Service | Status |"
line "|---|---|"
docker compose ps --format '{{.Name}}|{{.State}}' | while IFS='|' read -r n s; do
  if echo "$s" | grep -qi "running\|healthy"; then st="$GREEN"; else st="$RED"; fi
  line "| $n | $s $st |"
done

section "2. Core HTTP Routes"
line "| Check | URL | Code | Status |"
line "|---|---|---:|---|"
check_http "API health" "$API/health" "200"
check_http "OpenAPI" "$API/openapi.json" "200"
check_http "Frontend home" "$FRONTEND/" "200"
check_http "Login page" "$FRONTEND/login" "200"
check_http "Register page" "$FRONTEND/register" "200"
check_http "Reset password page" "$FRONTEND/reset-password?token=test" "200"
check_http "Amooskco storefront" "$FRONTEND/store/$TENANT_SLUG" "200"

section "3. OpenAPI Endpoint Coverage"
line "| Endpoint Group | Count | Status |"
line "|---|---:|---|"
OPENAPI=$(curl -sk "$API/openapi.json")
for g in auth users billing-config billing subscriptions warehouse-notices customer-cargo shipments tenants domains; do
  c=$(echo "$OPENAPI" | jq -r '.paths | keys[]' 2>/dev/null | grep -c "$g" || true)
  if [ "$c" -gt 0 ]; then st="$GREEN"; else st="$RED"; fi
  line "| $g | $c | $st |"
done

section "4. Tenant Database Status"
line "| Check | Result | Status |"
line "|---|---|---|"

TENANT_ID=$(psqlq "SELECT id FROM tenants WHERE slug='$TENANT_SLUG' LIMIT 1;")
if [ -n "$TENANT_ID" ]; then line "| Tenant exists | $TENANT_ID | $GREEN |"; else line "| Tenant exists | missing | $RED |"; fi

TEMPLATE=$(psqlq "SELECT tt.code FROM tenant_template_assignments a JOIN tenant_templates tt ON tt.id=a.template_id WHERE a.tenant_id='$TENANT_ID' LIMIT 1;")
[ -n "$TEMPLATE" ] && line "| Tenant template | $TEMPLATE | $GREEN |" || line "| Tenant template | none | $YELLOW |"

CUSTOMERS=$(psqlq "SELECT count(*) FROM tenant_customers WHERE tenant_id='$TENANT_ID';")
line "| Tenant customers | ${CUSTOMERS:-0} | $([ "${CUSTOMERS:-0}" -gt 0 ] && echo "$GREEN" || echo "$YELLOW") |"

BULK=$(psqlq "SELECT count(*) FROM tenant_customers WHERE tenant_id='$TENANT_ID' AND source='bulk_member_import';")
line "| Bulk-imported members | ${BULK:-0} | $([ "${BULK:-0}" -gt 0 ] && echo "$GREEN" || echo "$YELLOW") |"

CARGO=$(psqlq "SELECT count(*) FROM cargo_records WHERE tenant_id='$TENANT_ID';")
line "| Cargo records | ${CARGO:-0} | $([ "${CARGO:-0}" -gt 0 ] && echo "$GREEN" || echo "$YELLOW") |"

NOTICES=$(psqlq "SELECT count(*) FROM warehouse_notices WHERE tenant_id='$TENANT_ID';")
line "| Warehouse notices | ${NOTICES:-0} | $([ "${NOTICES:-0}" -gt 0 ] && echo "$GREEN" || echo "$YELLOW") |"

section "5. Amooskco Admin Account"
line "| Field | Value | Status |"
line "|---|---|---|"
psqlq "SELECT email || '|' || role || '|' || is_superuser || '|' || is_tenant_admin || '|' || is_active || '|' || must_reset_password FROM users WHERE email='admin@amooksco.com';" | while IFS='|' read -r email role super tenant_admin active reset; do
  line "| Email | $email | $GREEN |"
  line "| Role | $role | $GREEN |"
  line "| Is superuser | $super | $([ "$super" = "false" ] || [ "$super" = "f" ] && echo "$GREEN" || echo "$RED") |"
  line "| Is tenant admin | $tenant_admin | $([ "$tenant_admin" = "true" ] || [ "$tenant_admin" = "t" ] && echo "$GREEN" || echo "$YELLOW") |"
  line "| Active | $active | $([ "$active" = "true" ] || [ "$active" = "t" ] && echo "$GREEN" || echo "$RED") |"
  line "| Must reset password | $reset | $BLUE |"
done

section "6. Billing / Subscription / Feature Gating"
line "| Check | Result | Status |"
line "|---|---|---|"
PLANS=$(psqlq "SELECT count(*) FROM billing_plans;" )
line "| Billing plans | ${PLANS:-0} | $([ "${PLANS:-0}" -gt 0 ] && echo "$GREEN" || echo "$RED") |"
PROVIDERS=$(psqlq "SELECT string_agg(provider_code || ':' || enabled, ', ') FROM billing_payment_providers;" )
line "| Payment providers | ${PROVIDERS:-none} | $GREEN |"
RATES=$(psqlq "SELECT string_agg(target_currency || '=' || rate, ', ') FROM billing_exchange_rates WHERE is_active=true;" )
line "| Exchange rates | ${RATES:-none} | $([ -n "${RATES:-}" ] && echo "$GREEN" || echo "$YELLOW") |"
SUB=$(psqlq "SELECT count(*) FROM billing_subscriptions WHERE tenant_id::text='$TENANT_ID';" )
line "| Tenant subscription rows | ${SUB:-0} | $([ "${SUB:-0}" -gt 0 ] && echo "$GREEN" || echo "$YELLOW") |"

section "7. Static Assets / Storefront Media"
line "| Asset | Code | Status |"
line "|---|---:|---|"
for asset in \
"/tenant-assets/amooksco/logo.png" \
"/tenant-assets/amooksco/new-arrivals.jpeg" \
"/tenant-assets/amooksco/warehouse/unidentified-items/unidentified-items-1.jpeg"; do
  code=$(curl -sk -o /dev/null -w "%{http_code}" "$FRONTEND$asset" || echo 000)
  [ "$code" = "200" ] && st="$GREEN" || st="$RED"
  line "| $asset | $code | $st |"
done

section "8. Source Code Risk Scan"
line "| Check | Count | Status |"
line "|---|---:|---|"
for pat in "mock" "placeholder" "TODO" "localStorage.getItem('token')" "localStorage.getItem('access_token')" "Admin Console"; do
  cnt=$(grep -RIn --exclude-dir=.next --exclude-dir=node_modules "$pat" frontend app 2>/dev/null | wc -l | tr -d ' ')
  if [ "$pat" = "Admin Console" ]; then st="$YELLOW"; elif [ "$cnt" -eq 0 ]; then st="$GREEN"; else st="$YELLOW"; fi
  line "| $pat | $cnt | $st |"
done

section "9. Fleetbase / Fleet Operations Surface"
line "| Check | URL | Code | Status |"
line "|---|---|---:|---|"
check_http "FleetOps dashboard" "$FRONTEND/dashboard/fleetops" "200"
check_http "FleetOps drivers" "$FRONTEND/dashboard/fleetops/drivers" "200"
check_http "FleetOps vehicles" "$FRONTEND/dashboard/fleetops/vehicles" "200"
check_http "FleetOps fleets" "$FRONTEND/dashboard/fleetops/fleets" "200"
check_http "FleetOps orders" "$FRONTEND/dashboard/fleetops/orders" "200"

section "10. Final Summary"
FAILS=$(grep -c "🔴 FAIL" "$OUT" || true)
WARNS=$(grep -c "🟡 WARN" "$OUT" || true)
PASSES=$(grep -c "🟢 PASS" "$OUT" || true)
line "| Pass | Warn | Fail |"
line "|---:|---:|---:|"
line "| $PASSES | $WARNS | $FAILS |"

if [ "$FAILS" -gt 0 ]; then
  line ""
  line "## Decision"
  line "$RED Platform is not ready for stakeholder access. Fix FAIL items first."
elif [ "$WARNS" -gt 0 ]; then
  line ""
  line "## Decision"
  line "$YELLOW Platform is demo-capable but not production-ready. Review WARN items."
else
  line ""
  line "## Decision"
  line "$GREEN Platform passes the current audit."
fi

echo ""
echo "Report written to: $OUT"

#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
OUT="fleetbase_functionality_smoke_$TS.txt"

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

section "FLEETBASE FUNCTIONALITY SMOKE TEST"
log "DATE: $(date)"
log "API=$API"
log "WEB=$WEB"

section "1. FRONTEND PAGE SMOKE"
for p in \
/fleetbase/console \
/fleetbase/console-gate \
/fleetbase/live-map \
/fleetbase/drivers \
/fleetbase/vehicles \
/fleetbase/fleets \
/shipments \
/shipments/new \
/vendors \
/marketplace \
/track
do
  log "---- $p ----"
  curl -I -s "$WEB$p" | egrep -i "HTTP/|location:|content-type" | tee -a "$OUT" || true
done

section "2. API ROUTE SMOKE - FLEETBASE PROXY"
for p in \
/api/v1/fleetbase-proxy/console-url \
/api/v1/fleetbase-proxy/drivers \
/api/v1/fleetbase-proxy/vehicles \
/api/v1/fleetbase-proxy/fleets \
/api/v1/fleetbase-proxy/orders
do
  log "---- GET $p ----"
  body="$(curl -s -w '\nHTTP_STATUS:%{http_code}\n' "$API$p" || true)"
  echo "$body" | head -40 | tee -a "$OUT"
done

section "3. API ROUTE SMOKE - TENANT FLEETBASE"
for p in \
/api/v1/fleetbase-tenant/drivers \
/api/v1/fleetbase-tenant/vehicles \
/api/v1/fleetbase-tenant/fleets \
/api/v1/fleetbase-tenant/orders \
/api/v1/fleetbase-tenant/tracking
do
  log "---- GET $p ----"
  body="$(curl -s -w '\nHTTP_STATUS:%{http_code}\n' "$API$p" || true)"
  echo "$body" | head -40 | tee -a "$OUT"
done

section "4. RUNTIME RECORDS"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage <<'SQL' | tee -a "$OUT" || true
SELECT id, tenant_id, status, base_url, console_url, api_url, created_at
FROM fleetbase_runtimes
ORDER BY created_at DESC
LIMIT 10;
SQL

section "5. TEST REAL FLEETBASE RUNTIME URLS FROM DB"
docker exec -i afruheritage-postgres psql -U afruheritage -d afruheritage -At <<'SQL' > /tmp/fleetbase_runtime_urls.txt || true
SELECT DISTINCT unnest(array[base_url, console_url, api_url])
FROM fleetbase_runtimes
WHERE base_url IS NOT NULL OR console_url IS NOT NULL OR api_url IS NOT NULL;
SQL

while read -r url; do
  [ -z "$url" ] && continue
  log "---- Runtime URL: $url ----"
  curl -I -s "$url" | egrep -i "HTTP/|location:|content-type" | tee -a "$OUT" || true
done < /tmp/fleetbase_runtime_urls.txt

section "6. SHIPMENT / TRACKING / CSV IMPORT ROUTES"
for p in \
/api/v1/shipments/test \
/api/v1/shipments/test/summary \
/api/v1/customer-portal/test/shipments \
/api/v1/customer-portal/test/tracking \
/api/v1/navigator/test/drivers \
/api/v1/navigator/test/tracking
do
  log "---- GET $p ----"
  body="$(curl -s -w '\nHTTP_STATUS:%{http_code}\n' "$API$p" || true)"
  echo "$body" | head -40 | tee -a "$OUT"
done

section "7. PLACEHOLDER / DUMMY RESPONSE DETECTION"
grep -RIn \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  "dummy\|mock\|placeholder\|coming soon\|not implemented\|TODO\|stub\|sample" \
  app frontend/app/fleetbase frontend/app/shipments frontend/app/vendors frontend/app/marketplace frontend/app/members admin-console/frontend/app/dashboard \
  | tee -a "$OUT" || true

section "8. FRONTEND ROUTES THAT DO NOT CALL API"
for f in \
frontend/app/fleetbase/console/page.tsx \
frontend/app/fleetbase/console-gate/page.tsx \
frontend/app/fleetbase/live-map/page.tsx \
frontend/app/fleetbase/drivers/page.tsx \
frontend/app/fleetbase/vehicles/page.tsx \
frontend/app/fleetbase/fleets/page.tsx \
frontend/app/shipments/page.tsx \
frontend/app/vendors/page.tsx \
frontend/app/marketplace/page.tsx \
frontend/app/members/import/page.tsx
do
  [ -f "$f" ] || continue
  log "---- $f ----"
  if grep -Eq "fetch\(|api\.get|api\.post|/api/v1" "$f"; then
    log "API_WIRED: YES"
    grep -nE "fetch\(|api\.get|api\.post|/api/v1" "$f" | tee -a "$OUT"
  else
    log "API_WIRED: NO"
  fi
done

section "9. DECISION FLAGS"
log "If frontend page = 200 but API_WIRED=NO, treat as marketing/static only."
log "If API returns 401/403, route may be real but needs authenticated smoke test."
log "If API returns 404/501/placeholder text, do NOT rely on Fleetbase for that feature yet."
log "If runtime URL returns 200/302 to real Fleetbase console, redirect is acceptable."
log "If proxy routes return meaningful JSON/list data, feature can be reused instead of rebuilt."

section "SMOKE COMPLETE"
log "Output: $OUT"

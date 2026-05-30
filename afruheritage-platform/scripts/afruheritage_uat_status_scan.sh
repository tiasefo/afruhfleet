#!/usr/bin/env bash
set -u

BASE_API="${BASE_API:-http://localhost:8100}"
PUBLIC_API="${PUBLIC_API:-https://api.afruheritage.com/api/v1}"
PUBLIC_FRONTEND="${PUBLIC_FRONTEND:-https://afruheritage.com}"
RUNTIME_ROOT="${RUNTIME_ROOT:-/mnt/storage/afruheritage-runtimes}"
REPORT_DIR="reports/uat_status_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

pass(){ echo "✅ $1" | tee -a "$REPORT_DIR/summary.txt"; }
fail(){ echo "❌ $1" | tee -a "$REPORT_DIR/summary.txt"; }
warn(){ echo "⚠️ $1" | tee -a "$REPORT_DIR/summary.txt"; }

echo "Afruheritage UAT Status Scan - $(date)" | tee "$REPORT_DIR/summary.txt"
echo "=================================================" | tee -a "$REPORT_DIR/summary.txt"

echo "[1] Docker containers" | tee -a "$REPORT_DIR/summary.txt"
docker compose ps | tee "$REPORT_DIR/docker_compose_ps.txt"
docker ps -a | tee "$REPORT_DIR/docker_ps_all.txt"

echo "[2] API health" | tee -a "$REPORT_DIR/summary.txt"
if curl -fsS "$BASE_API/health" > "$REPORT_DIR/api_health.json"; then pass "API health OK"; else fail "API health failed"; fi

echo "[3] Public domain checks" | tee -a "$REPORT_DIR/summary.txt"
curl -I "$PUBLIC_FRONTEND/onboarding" > "$REPORT_DIR/frontend_onboarding_headers.txt" 2>&1 && pass "Frontend onboarding reachable" || fail "Frontend onboarding not reachable"
curl -i "$PUBLIC_API/commercial/catalog" > "$REPORT_DIR/commercial_catalog.txt" 2>&1 && pass "Commercial catalog reachable" || fail "Commercial catalog failed"

echo "[4] OpenAPI route scan" | tee -a "$REPORT_DIR/summary.txt"
curl -fsS "$BASE_API/openapi.json" > "$REPORT_DIR/openapi.json" || true
for route in \
  "/commercial/signup/start" \
  "/commercial/signup/select-plan" \
  "/payment-hub/initialize" \
  "/payment-hub/webhook/paystack" \
  "/marketplace/shipments" \
  "/fleetbase-runtime/deploy" \
  "provision-runtime" \
  "provision-runtime-async" \
  "reconcile-runtime"
do
  if grep -q "$route" "$REPORT_DIR/openapi.json"; then pass "Route exists: $route"; else warn "Route missing/not exposed: $route"; fi
done

echo "[5] Backend source scan" | tee -a "$REPORT_DIR/summary.txt"
grep -R "provision-runtime\|reconcile-runtime\|payment_completed\|runtime_active\|FleetbaseRuntime\|PaymentTransaction" -n app \
  > "$REPORT_DIR/backend_runtime_payment_signal.txt" 2>&1 || true

echo "[6] Frontend integration scan" | tee -a "$REPORT_DIR/summary.txt"
grep -R "commercialApi\|paymentHubApi\|marketplaceApi\|fleetbase-runtime\|reconcile-runtime\|provision-runtime" -n frontend admin-console \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules --exclude-dir=.next \
  > "$REPORT_DIR/frontend_integration_signal.txt" 2>&1 || true

echo "[7] Database runtime/subscription status" | tee -a "$REPORT_DIR/summary.txt"
docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' > "$REPORT_DIR/db_status.txt" 2>&1
SELECT id,email,payment_completed,runtime_provisioned,provisioning_status,tenant_id,subscription_id,created_at
FROM commercial_signups
ORDER BY created_at DESC
LIMIT 20;

SELECT tenant_id,plan_code,status,credits_balance,selected_addons_json
FROM tenant_subscriptions
ORDER BY tenant_id DESC
LIMIT 20;

SELECT id,tenant_id,tenant_slug,status,runtime_url,console_url,api_url,last_error,created_at
FROM fleetbase_runtimes
ORDER BY created_at DESC
LIMIT 20;

SELECT id,name,hostname,ssh_port,ssh_user,root_runtime_path,status,current_tenants,max_tenants
FROM fleetbase_runner_nodes
ORDER BY created_at DESC;
SQL

echo "[8] Runtime filesystem scan" | tee -a "$REPORT_DIR/summary.txt"
if [ -d "$RUNTIME_ROOT" ]; then
  find "$RUNTIME_ROOT" -maxdepth 3 -type f \( -name docker-compose.yml -o -name "*.log" -o -name ".afruheritage-runtime.env" \) \
    > "$REPORT_DIR/runtime_files.txt" 2>&1
  du -sh "$RUNTIME_ROOT"/* > "$REPORT_DIR/runtime_disk_usage.txt" 2>&1 || true
  pass "Runtime root exists: $RUNTIME_ROOT"
else
  fail "Runtime root missing: $RUNTIME_ROOT"
fi

echo "[9] Fleetbase running runtime scan" | tee -a "$REPORT_DIR/summary.txt"
docker ps -a | grep -i fleetbase > "$REPORT_DIR/fleetbase_containers.txt" 2>&1 || true

echo "[10] Runtime port checks" | tee -a "$REPORT_DIR/summary.txt"
for port in 4202 8003 38002 3308; do
  if curl -I "http://10.0.0.115:$port" > "$REPORT_DIR/port_${port}.txt" 2>&1; then
    pass "Port $port reachable"
  else
    warn "Port $port not HTTP reachable or not expected HTTP"
  fi
done

echo "[11] Fresh client + subscription + runtime readiness dry-run" | tee -a "$REPORT_DIR/summary.txt"
EMAIL="uat-client-$(date +%s)@example.com"
SIGNUP_RESPONSE=$(curl -s -X POST "$PUBLIC_API/commercial/signup/start" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"phone\":\"+233244999999\",\"account_type\":\"tenant_org\"}")

echo "$SIGNUP_RESPONSE" > "$REPORT_DIR/new_signup_response.json"

SIGNUP_ID=$(python3 - <<PY 2>/dev/null
import json
try:
 print(json.loads('''$SIGNUP_RESPONSE''')["signup_id"])
except Exception:
 print("")
PY
)

if [ -n "$SIGNUP_ID" ]; then
  pass "Fresh signup created: $SIGNUP_ID"

  PLAN_RESPONSE=$(curl -s -X POST "$PUBLIC_API/commercial/signup/select-plan" \
    -H "Content-Type: application/json" \
    -d "{\"signup_id\":\"$SIGNUP_ID\",\"plan_code\":\"business\",\"addons\":[\"marketplace\",\"gps_tracking\"],\"payment_method\":\"paystack\",\"callback_url\":\"$PUBLIC_FRONTEND/billing/callback\"}")

  echo "$PLAN_RESPONSE" > "$REPORT_DIR/new_plan_response.json"

  REFERENCE=$(python3 - <<PY 2>/dev/null
import json
try:
 print(json.loads('''$PLAN_RESPONSE''')["payment_reference"])
except Exception:
 print("")
PY
)

  if [ -n "$REFERENCE" ]; then
    pass "Paystack checkout initialized: $REFERENCE"
    echo "$SIGNUP_ID" > "$REPORT_DIR/latest_signup_id.txt"
    echo "$REFERENCE" > "$REPORT_DIR/latest_payment_reference.txt"
  else
    fail "Plan selection/payment initialization failed"
  fi
else
  fail "Fresh signup failed"
fi

echo "[12] Build checks" | tee -a "$REPORT_DIR/summary.txt"
npm --prefix frontend run build > "$REPORT_DIR/frontend_build.txt" 2>&1 && pass "Frontend build passed" || fail "Frontend build failed"
python3 -m compileall app > "$REPORT_DIR/backend_compile.txt" 2>&1 && pass "Backend Python compile passed" || fail "Backend compile failed"

echo "=================================================" | tee -a "$REPORT_DIR/summary.txt"
echo "Report directory: $REPORT_DIR" | tee -a "$REPORT_DIR/summary.txt"
echo "Open summary: cat $REPORT_DIR/summary.txt"

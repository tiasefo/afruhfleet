#!/usr/bin/env bash
set -u

REPORT_DIR="reports/fleetbase_feature_scan_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

API_BASE="${API_BASE:-http://localhost:8100}"
FLEETBASE_API="${FLEETBASE_API:-http://10.0.0.115:8004}"
FLEETBASE_CONSOLE="${FLEETBASE_CONSOLE:-http://10.0.0.115:4203}"
FLEETBASE_SOCKET="${FLEETBASE_SOCKET:-http://10.0.0.115:38003}"

summary="$REPORT_DIR/summary.md"

status_line(){
  echo "| $1 | $2 | $3 |" >> "$summary"
}

probe_http(){
  local url="$1"
  curl -fsS -I "$url" >/dev/null 2>&1
}

probe_openapi(){
  curl -fsS "$API_BASE/openapi.json" > "$REPORT_DIR/afruheritage_openapi.json" 2>/dev/null
}

route_exists(){
  local pattern="$1"
  grep -Eqi "$pattern" "$REPORT_DIR/afruheritage_openapi.json" 2>/dev/null
}

container_exists(){
  docker ps -a --format '{{.Names}}' | grep -qi "$1"
}

container_running(){
  docker ps --format '{{.Names}}' | grep -qi "$1"
}

echo "# Fleetbase Feature Status Scan" > "$summary"
echo "" >> "$summary"
echo "Generated: $(date)" >> "$summary"
echo "" >> "$summary"

echo "## Runtime Health" >> "$summary"
echo "| Component | Status | Evidence |" >> "$summary"
echo "|---|---|---|" >> "$summary"

if probe_http "$FLEETBASE_API"; then status_line "Fleetbase API / HTTPD" "✅ Working" "$FLEETBASE_API reachable"; else status_line "Fleetbase API / HTTPD" "❌ Not reachable" "$FLEETBASE_API failed"; fi
if probe_http "$FLEETBASE_CONSOLE"; then status_line "Fleetbase Console" "✅ Working" "$FLEETBASE_CONSOLE reachable"; else status_line "Fleetbase Console" "❌ Not reachable" "$FLEETBASE_CONSOLE failed"; fi
if probe_http "$FLEETBASE_SOCKET"; then status_line "Fleetbase Socket" "✅ Working" "$FLEETBASE_SOCKET reachable"; else status_line "Fleetbase Socket" "⚠️ Unknown" "Socket may not respond to HTTP HEAD"; fi

echo "" >> "$summary"
echo "## Container Status" >> "$summary"
echo "| Container Group | Status | Evidence |" >> "$summary"
echo "|---|---|---|" >> "$summary"

for c in fleetbase-application fleetbase-httpd fleetbase-console fleetbase-database fleetbase-cache fleetbase-queue fleetbase-scheduler fleetbase-socket; do
  if container_running "$c"; then
    status_line "$c" "✅ Running" "container is up"
  elif container_exists "$c"; then
    status_line "$c" "⚠️ Exists but not running" "container exists"
  else
    status_line "$c" "❌ Missing" "container not found"
  fi
done

docker ps -a | grep -i fleetbase > "$REPORT_DIR/fleetbase_containers.txt" 2>&1 || true

probe_openapi

echo "" >> "$summary"
echo "## AfruHeritage Wrapper Coverage for Fleetbase Features" >> "$summary"
echo "| Fleetbase Feature Area | Status | Evidence |" >> "$summary"
echo "|---|---|---|" >> "$summary"

declare -A features
features["Shipments / Orders"]="shipment|shipments|orders"
features["Fleet / Vehicles"]="vehicle|vehicles|fleetbase/vehicles"
features["Drivers"]="driver|drivers"
features["Dispatch / Jobs"]="dispatch|jobs|booking|accept"
features["Marketplace / Vendors"]="vendor|vendors|marketplace"
features["GPS / Live Tracking"]="gps|tracking|location|route"
features["Customer Portal / Members"]="members|users|customers"
features["Billing / Credits"]="billing|subscription|credits|wallet"
features["Runtime Provisioning"]="fleetbase-runtime|provision-runtime|reconcile-runtime"
features["Domains / Tenant Portal"]="domains|resolve|activate"
features["KYC / Vendor Verification"]="kyc|documents|liveness|ocr"
features["CRM"]="crm|contacts|quotes|opportunities"
features["AI Assistant"]="ai/chat|ai/widget"
features["Support / Tickets"]="support|ticket"

for feature in "${!features[@]}"; do
  pattern="${features[$feature]}"
  if route_exists "$pattern"; then
    status_line "$feature" "✅ Exposed in AfruHeritage API" "matched: $pattern"
  else
    status_line "$feature" "❌ Not exposed / not detected" "no OpenAPI route match"
  fi
done

echo "" >> "$summary"
echo "## Fleetbase Source/Runtime Files" >> "$summary"
echo "| Check | Status | Evidence |" >> "$summary"
echo "|---|---|---|" >> "$summary"

for dir in /mnt/storage/afruheritage-runtimes/*/fleetbase; do
  [ -d "$dir" ] || continue
  echo "$dir" >> "$REPORT_DIR/fleetbase_runtime_dirs.txt"
  if [ -f "$dir/docker-compose.yml" ]; then
    status_line "Runtime compose found" "✅ Yes" "$dir/docker-compose.yml"
  fi
  if [ -d "$dir/api" ]; then
    status_line "Fleetbase API source" "✅ Present" "$dir/api"
  fi
  if [ -d "$dir/console" ]; then
    status_line "Fleetbase Console source" "✅ Present" "$dir/console"
  fi
done

echo "" >> "$summary"
echo "## Raw Route Evidence" >> "$summary"
echo '```' >> "$summary"
grep -ioE '/api/v1/[a-zA-Z0-9_/\{\}-]+' "$REPORT_DIR/afruheritage_openapi.json" 2>/dev/null \
  | sort -u \
  | grep -Ei 'shipment|fleet|vehicle|driver|vendor|marketplace|gps|tracking|billing|runtime|domain|kyc|crm|support|ai|user|member' \
  >> "$summary" || true
echo '```' >> "$summary"

echo ""
echo "Generated report:"
echo "$summary"

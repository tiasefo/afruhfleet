#!/usr/bin/env bash
set -u

API="http://localhost:8100"
PUBLIC_API="https://api.afruheritage.com/api/v1"
REPORT="reports/gps_tracking_scan_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT"

echo "# GPS / Live Tracking Deep Scan" > "$REPORT/summary.md"
echo "Generated: $(date)" >> "$REPORT/summary.md"
echo "" >> "$REPORT/summary.md"

row(){ echo "| $1 | $2 | $3 |" >> "$REPORT/summary.md"; }

echo "## API Route Coverage" >> "$REPORT/summary.md"
echo "| Feature | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

curl -fsS "$API/openapi.json" > "$REPORT/openapi.json" || true

check_route(){
  local name="$1"
  local pattern="$2"
  if grep -Eqi "$pattern" "$REPORT/openapi.json"; then
    row "$name" "✅ Exposed" "$pattern"
  else
    row "$name" "❌ Missing" "$pattern"
  fi
}

check_route "Marketplace GPS ping" "/marketplace/shipments/.*/gps"
check_route "Marketplace tracking status" "/marketplace/shipments/.*/tracking"
check_route "Navigator tracking" "/navigator/.*/tracking"
check_route "Navigator drivers" "/navigator/.*/drivers"
check_route "Shipment latest tracking" "/shipments/.*/tracking/latest"
check_route "Shipment tracking history" "/shipments/.*/tracking/history"
check_route "Shipment tracking point" "/shipments/.*/tracking/point"
check_route "Shipment location update" "/shipments/.*/location"
check_route "Public shipment tracking" "/shipments/public/track"
check_route "Geo routes" "/geo/.*/shipment-routes"
check_route "Customer portal tracking" "/customer-portal/.*/tracking"

echo "" >> "$REPORT/summary.md"
echo "## Runtime / Socket / Fleetbase GPS Layer" >> "$REPORT/summary.md"
echo "| Component | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

for url in \
  "http://10.0.0.115:38003" \
  "http://10.0.0.115:8004" \
  "http://10.0.0.115:4203"
do
  if curl -fsSI "$url" >/dev/null 2>&1; then
    row "$url" "✅ Reachable" "HTTP reachable"
  else
    row "$url" "⚠️ Not HTTP reachable" "May be socket/non-HTTP or down"
  fi
done

echo "" >> "$REPORT/summary.md"
echo "## Database Tracking Tables" >> "$REPORT/summary.md"
echo "| Table Check | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

sudo docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' > "$REPORT/db_tracking_tables.txt" 2>&1
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public'
AND (
  table_name ILIKE '%track%' OR
  table_name ILIKE '%gps%' OR
  table_name ILIKE '%location%' OR
  table_name ILIKE '%driver%' OR
  table_name ILIKE '%route%'
)
ORDER BY table_name;
SQL

if grep -Eiq "track|gps|location|driver|route" "$REPORT/db_tracking_tables.txt"; then
  row "Tracking-related DB tables" "✅ Found" "See db_tracking_tables.txt"
else
  row "Tracking-related DB tables" "❌ Not found" "No tracking/gps/location tables detected"
fi

echo "" >> "$REPORT/summary.md"
echo "## Frontend GPS UI Coverage" >> "$REPORT/summary.md"
echo "| UI Feature | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

grep -R "gps\|tracking\|latitude\|longitude\|map\|driver location\|live_tracking" -ni frontend admin-console \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.next \
  > "$REPORT/frontend_gps_signal.txt" 2>&1 || true

if [ -s "$REPORT/frontend_gps_signal.txt" ]; then
  row "Frontend tracking UI/code" "✅ Signals found" "See frontend_gps_signal.txt"
else
  row "Frontend tracking UI/code" "❌ Weak/missing" "No frontend GPS signals"
fi

echo "" >> "$REPORT/summary.md"
echo "## Backend GPS Implementation Coverage" >> "$REPORT/summary.md"
echo "| Backend Feature | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

grep -R "gps\|tracking\|latitude\|longitude\|socket\|Socket\|broadcast\|route" -ni app \
  --include="*.py" \
  > "$REPORT/backend_gps_signal.txt" 2>&1 || true

if [ -s "$REPORT/backend_gps_signal.txt" ]; then
  row "Backend tracking logic" "✅ Signals found" "See backend_gps_signal.txt"
else
  row "Backend tracking logic" "❌ Weak/missing" "No backend GPS signals"
fi

echo "" >> "$REPORT/summary.md"
echo "## Conclusion Template" >> "$REPORT/summary.md"
echo "| Area | Meaning |" >> "$REPORT/summary.md"
echo "|---|---|" >> "$REPORT/summary.md"
echo "| Routes exposed | API has GPS endpoints |" >> "$REPORT/summary.md"
echo "| DB tables found | GPS data can persist |" >> "$REPORT/summary.md"
echo "| Frontend signals | Users can see maps/tracking |" >> "$REPORT/summary.md"
echo "| Socket reachable | Live updates may be possible |" >> "$REPORT/summary.md"
echo "| End-to-end test | Still required to prove real live tracking |" >> "$REPORT/summary.md"

echo "Report: $REPORT/summary.md"

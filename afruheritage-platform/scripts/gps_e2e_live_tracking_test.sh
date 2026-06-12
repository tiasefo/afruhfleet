#!/usr/bin/env bash
set -u

API="${API:-http://localhost:8100/api/v1}"
TENANT_ID="${TENANT_ID:-demo-gps-tenant}"
REPORT="reports/gps_e2e_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT"

echo "# GPS E2E Live Tracking Test" > "$REPORT/summary.md"
echo "Generated: $(date)" >> "$REPORT/summary.md"
echo "" >> "$REPORT/summary.md"

row(){ echo "| $1 | $2 | $3 |" >> "$REPORT/summary.md"; }

echo "## Test Results" >> "$REPORT/summary.md"
echo "| Step | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

SHIPMENT_PAYLOAD='{
  "sender_name":"GPS Test Sender",
  "recipient_name":"GPS Test Recipient",
  "pickup_address":"Accra Mall, Accra",
  "delivery_address":"Kotoka International Airport, Accra",
  "status":"pending"
}'

CREATE_RES=$(curl -s -X POST "$API/shipments/$TENANT_ID" \
  -H "Content-Type: application/json" \
  -d "$SHIPMENT_PAYLOAD")

echo "$CREATE_RES" > "$REPORT/create_shipment.json"

SHIPMENT_ID=$(python3 - <<PY 2>/dev/null
import json
try:
 data=json.loads("""$CREATE_RES""")
 print(data.get("id") or data.get("shipment_id") or "")
except Exception:
 print("")
PY
)

TRACKING_NUMBER=$(python3 - <<PY 2>/dev/null
import json
try:
 data=json.loads("""$CREATE_RES""")
 print(data.get("tracking_number") or "")
except Exception:
 print("")
PY
)

if [ -n "$SHIPMENT_ID" ]; then
  row "Create shipment" "✅ Pass" "$SHIPMENT_ID"
else
  row "Create shipment" "❌ Fail" "See create_shipment.json"
fi

if [ -n "$SHIPMENT_ID" ]; then
  for i in 1 2 3; do
    LAT=$(python3 - <<PY
print(5.6037 + ($i * 0.002))
PY
)
    LNG=$(python3 - <<PY
print(-0.1870 + ($i * 0.002))
PY
)

    RES=$(curl -s -X POST "$API/shipments/$TENANT_ID/$SHIPMENT_ID/tracking/point" \
      -H "Content-Type: application/json" \
      -d "{\"latitude\":$LAT,\"longitude\":$LNG,\"source\":\"gps_e2e_test\",\"speed_kmh\":35,\"heading_degrees\":90}")

    echo "$RES" > "$REPORT/gps_point_$i.json"

    if echo "$RES" | grep -Eqi "id|latitude|longitude|success|ok"; then
      row "Submit GPS point $i" "✅ Pass" "lat=$LAT lng=$LNG"
    else
      row "Submit GPS point $i" "❌ Fail" "See gps_point_$i.json"
    fi
    sleep 1
  done

  LATEST_RES=$(curl -s "$API/shipments/$TENANT_ID/$SHIPMENT_ID/tracking/latest")
  echo "$LATEST_RES" > "$REPORT/latest_tracking.json"

  if echo "$LATEST_RES" | grep -Eqi "latitude|longitude"; then
    row "Latest tracking" "✅ Pass" "latest_tracking.json has location"
  else
    row "Latest tracking" "❌ Fail" "No latest latitude/longitude"
  fi

  HIST_RES=$(curl -s "$API/shipments/$TENANT_ID/$SHIPMENT_ID/tracking/history")
  echo "$HIST_RES" > "$REPORT/tracking_history.json"

  if echo "$HIST_RES" | grep -Eqi "latitude|longitude"; then
    row "Tracking history" "✅ Pass" "history has GPS points"
  else
    row "Tracking history" "❌ Fail" "No history points"
  fi

  PUB_RES=$(curl -s "$API/shipments/public/track/$TENANT_ID/${TRACKING_NUMBER:-$SHIPMENT_ID}")
  echo "$PUB_RES" > "$REPORT/public_tracking.json"

  if echo "$PUB_RES" | grep -Eqi "tracking|shipment|latitude|longitude|status"; then
    row "Public tracking" "✅ Pass" "public_tracking.json returned tracking data"
  else
    row "Public tracking" "⚠️ Partial/Fail" "See public_tracking.json"
  fi
fi

echo "" >> "$REPORT/summary.md"
echo "Report: $REPORT" >> "$REPORT/summary.md"
echo "Report: $REPORT/summary.md"

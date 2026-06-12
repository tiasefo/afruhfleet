#!/usr/bin/env bash
set -euo pipefail

TS=$(date +%Y%m%d_%H%M%S)
REPORT="reports/ui_fleetbase_mapping/$TS"
mkdir -p "$REPORT"

echo "# AfruHeritage UI → Fleetbase Feature Mapping" > "$REPORT/summary.md"
echo "Generated: $(date)" >> "$REPORT/summary.md"
echo >> "$REPORT/summary.md"

echo "## 1. Frontend Route/Page Inventory" >> "$REPORT/summary.md"
echo '```' >> "$REPORT/summary.md"
find . \
  -path "./node_modules" -prune -o \
  -path "./.next" -prune -o \
  -path "./dist" -prune -o \
  -type f \( \
    -path "*app/*page.*" -o \
    -path "*pages/*" -o \
    -path "*routes/*" -o \
    -path "*src/*routes*" \
  \) | sort | tee "$REPORT/frontend_routes.txt" >> "$REPORT/summary.md"
echo '```' >> "$REPORT/summary.md"
echo >> "$REPORT/summary.md"

echo "## 2. Sidebar/Menu Signals" >> "$REPORT/summary.md"
echo '```' >> "$REPORT/summary.md"
grep -RInE "sidebar|navigation|menu|navItems|routes|Dashboard|Tracking|Drivers|Vehicles|Fleet|Orders|Shipments|GPS|Map|Customs|Payments|Analytics" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  . 2>/dev/null \
  | tee "$REPORT/menu_signals.txt" \
  | head -300 >> "$REPORT/summary.md"
echo '```' >> "$REPORT/summary.md"
echo >> "$REPORT/summary.md"

echo "## 3. Fleetbase Overlap Scan" >> "$REPORT/summary.md"
echo "| Feature | AfruHeritage Signal | Recommended Owner | Action |" >> "$REPORT/summary.md"
echo "|---|---|---|---|" >> "$REPORT/summary.md"

declare -A OWNER
OWNER["driver"]="Fleetbase"
OWNER["vehicle"]="Fleetbase"
OWNER["fleet"]="Fleetbase"
OWNER["shipment"]="Fleetbase"
OWNER["order"]="Fleetbase"
OWNER["tracking"]="Fleetbase"
OWNER["gps"]="Fleetbase"
OWNER["map"]="Fleetbase-powered AfruHeritage UI"
OWNER["dispatch"]="Fleetbase"
OWNER["route"]="Fleetbase"
OWNER["warehouse"]="Fleetbase/Pallet if active"
OWNER["inventory"]="Fleetbase/Pallet if active"
OWNER["analytics"]="Fleetbase-powered AfruHeritage UI"
OWNER["billing"]="AfruHeritage"
OWNER["subscription"]="AfruHeritage"
OWNER["payment"]="AfruHeritage"
OWNER["kyc"]="AfruHeritage"
OWNER["customs"]="AfruHeritage"
OWNER["duty"]="AfruHeritage"
OWNER["vin"]="AfruHeritage"
OWNER["marketplace"]="AfruHeritage + Fleetbase orders"

for feature in driver vehicle fleet shipment order tracking gps map dispatch route warehouse inventory analytics billing subscription payment kyc customs duty vin marketplace; do
  hits=$(grep -RIl "$feature" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    . 2>/dev/null | wc -l || true)

  if [ "$hits" -gt 0 ]; then
    signal="Found in $hits files"
  else
    signal="No obvious signal"
  fi

  owner="${OWNER[$feature]}"
  action="Review"
  case "$owner" in
    Fleetbase*) action="Rewire to Fleetbase API; retire duplicate custom logic where possible" ;;
    AfruHeritage*) action="Keep in AfruHeritage; integrate with Fleetbase only when logistics order is needed" ;;
  esac

  echo "| $feature | $signal | $owner | $action |" >> "$REPORT/summary.md"
done

echo >> "$REPORT/summary.md"
echo "## 4. API Usage Signals" >> "$REPORT/summary.md"
echo '```' >> "$REPORT/summary.md"
grep -RInE "fetch\(|axios|/api/|tracking|drivers|vehicles|fleets|orders|shipments|gps|map|customs|payment|subscription" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  . 2>/dev/null \
  | tee "$REPORT/api_signals.txt" \
  | head -400 >> "$REPORT/summary.md"
echo '```' >> "$REPORT/summary.md"

echo
echo "Report created: $REPORT/summary.md"

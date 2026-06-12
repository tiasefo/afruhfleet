#!/usr/bin/env bash
set -u

REPORT="reports/native_fleetbase_investigation_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT"

echo "# Native Fleetbase Investigation" > "$REPORT/summary.md"
echo "Generated: $(date)" >> "$REPORT/summary.md"
echo "" >> "$REPORT/summary.md"

row(){ echo "| $1 | $2 | $3 |" >> "$REPORT/summary.md"; }

echo "## Native Fleetbase Containers" >> "$REPORT/summary.md"
echo "| Component | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

docker ps -a | grep -Ei 'fleetbase|navigator|storefront|ledger|pallet|socket' > "$REPORT/containers.txt" || true

for name in application httpd console database cache queue scheduler socket navigator storefront ledger pallet; do
  if docker ps --format '{{.Names}}' | grep -Eiq "fleetbase.*$name|$name.*fleetbase"; then
    row "$name" "✅ Running" "container found"
  elif docker ps -a --format '{{.Names}}' | grep -Eiq "fleetbase.*$name|$name.*fleetbase"; then
    row "$name" "⚠️ Exists not running" "container exists"
  else
    row "$name" "❌ Not found" "no container"
  fi
done

echo "" >> "$REPORT/summary.md"
echo "## Fleetbase Runtime Source Modules" >> "$REPORT/summary.md"
echo "| Runtime | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

for d in /mnt/storage/afruheritage-runtimes/*/fleetbase /tmp/fleetbase-test; do
  [ -d "$d" ] || continue
  echo "$d" >> "$REPORT/runtime_dirs.txt"
  find "$d" -maxdepth 2 -type d \( \
    -iname "*navigator*" -o \
    -iname "*storefront*" -o \
    -iname "*ledger*" -o \
    -iname "*pallet*" -o \
    -iname "*fleet-ops*" -o \
    -iname "*extension*" \
  \) >> "$REPORT/source_modules.txt" 2>/dev/null || true

  if [ -d "$d/api" ]; then row "$d/api" "✅ Core API present" "Fleetbase API source"; fi
  if [ -d "$d/console" ]; then row "$d/console" "✅ Console present" "Fleetbase Console source"; fi
done

echo "" >> "$REPORT/summary.md"
echo "## Fleetbase Native Routes / Code Signals" >> "$REPORT/summary.md"
echo "| Feature | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

for d in /mnt/storage/afruheritage-runtimes/*/fleetbase /tmp/fleetbase-test; do
  [ -d "$d" ] || continue

  grep -R "socketcluster\|SocketCluster\|navigator\|tracking\|latitude\|longitude\|proof of delivery\|pod\|dispatch\|fleet-ops\|orders" -ni "$d/api" "$d/console" \
    > "$REPORT/native_code_signals.txt" 2>/dev/null || true
done

check_signal(){
  local name="$1"
  local pattern="$2"
  if grep -Eiq "$pattern" "$REPORT/native_code_signals.txt" 2>/dev/null; then
    row "$name" "✅ Native signal found" "$pattern"
  else
    row "$name" "❌ Native signal missing/hidden" "$pattern"
  fi
}

check_signal "Native GPS coordinates" "latitude|longitude"
check_signal "SocketCluster live channel" "socketcluster|SocketCluster"
check_signal "Navigator integration" "navigator"
check_signal "Dispatch / orders" "dispatch|orders"
check_signal "Proof of delivery" "proof|pod|signature|photo"
check_signal "Fleet-Ops" "fleet-ops|fleetops"

echo "" >> "$REPORT/summary.md"
echo "## Fleetbase Environment" >> "$REPORT/summary.md"
echo "| Check | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

for f in /mnt/storage/afruheritage-runtimes/*/fleetbase/.env /mnt/storage/afruheritage-runtimes/*/fleetbase/api/.env /tmp/fleetbase-test/.env /tmp/fleetbase-test/api/.env; do
  [ -f "$f" ] || continue
  cp "$f" "$REPORT/$(echo "$f" | sed 's|/|_|g').env.copy" 2>/dev/null || true
  grep -Ei "SOCKET|BROADCAST|FLEETBASE|NAVIGATOR|STORE|LEDGER|EXTENSION|MAP|GOOGLE|OSRM|LOCATION|TRACK" "$f" \
    >> "$REPORT/env_signals.txt" 2>/dev/null || true
done

if [ -s "$REPORT/env_signals.txt" ]; then
  row "Fleetbase env GPS/module settings" "✅ Found" "See env_signals.txt"
else
  row "Fleetbase env GPS/module settings" "⚠️ Weak/missing" "No env signals"
fi

echo "" >> "$REPORT/summary.md"
echo "## Native Fleetbase HTTP Probes" >> "$REPORT/summary.md"
echo "| Probe | Status | Evidence |" >> "$REPORT/summary.md"
echo "|---|---|---|" >> "$REPORT/summary.md"

for url in \
  "http://10.0.0.115:8004" \
  "http://10.0.0.115:8004/api" \
  "http://10.0.0.115:8004/v1" \
  "http://10.0.0.115:8004/int/v1" \
  "http://10.0.0.115:4203" \
  "http://10.0.0.115:38003"
do
  code=$(curl -k -s -o "$REPORT/probe_$(echo "$url" | tr '/:' '__').txt" -w "%{http_code}" "$url")
  if [ "$code" = "200" ] || [ "$code" = "401" ] || [ "$code" = "403" ]; then
    row "$url" "✅ Responds" "HTTP $code"
  else
    row "$url" "⚠️ Check" "HTTP $code"
  fi
done

echo "" >> "$REPORT/summary.md"
echo "## Key Interpretation" >> "$REPORT/summary.md"
echo "| Finding | Meaning |" >> "$REPORT/summary.md"
echo "|---|---|" >> "$REPORT/summary.md"
echo "| Core API/console/socket running | Fleetbase runtime exists |" >> "$REPORT/summary.md"
echo "| Navigator container missing | Driver app not deployed locally |" >> "$REPORT/summary.md"
echo "| Storefront/Ledger/Pallet missing | Those modules are not installed in this runtime |" >> "$REPORT/summary.md"
echo "| Native GPS code exists but not visible | Wrapper/UI is bypassing Fleetbase intelligence |" >> "$REPORT/summary.md"
echo "| Native GPS code missing | Wrong Fleetbase package/version/module set |" >> "$REPORT/summary.md"

echo "Report: $REPORT/summary.md"

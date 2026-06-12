#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d_%H%M%S)"
OUT="customs_frontend_audit_${TS}.txt"

CUSTOMS_PAGE="frontend/app/customs/page.tsx"
CALC_PAGE="frontend/app/customs/duty-calculator/page.tsx"
TENANT_PAGE="frontend/app/tenant-request/page.tsx"
NAV_PAGE="frontend/components/landing/navigation.tsx"

echo "=== AfruHeritage Customs Frontend Integrity Audit ===" | tee "$OUT"
echo "Timestamp: $TS" | tee -a "$OUT"
echo "Project: $(pwd)" | tee -a "$OUT"
echo "" | tee -a "$OUT"

echo "## 1. File presence" | tee -a "$OUT"
for f in "$CUSTOMS_PAGE" "$CALC_PAGE" "$TENANT_PAGE" "$NAV_PAGE"; do
  if [ -f "$f" ]; then
    echo "OK: $f" | tee -a "$OUT"
  else
    echo "MISSING: $f" | tee -a "$OUT"
  fi
done
echo "" | tee -a "$OUT"

echo "## 2. Git status for touched frontend files" | tee -a "$OUT"
git status --short frontend/app/customs frontend/app/tenant-request frontend/components/landing 2>/dev/null | tee -a "$OUT" || true
echo "" | tee -a "$OUT"

echo "## 3. Customs calculator critical flow checks" | tee -a "$OUT"
if [ -f "$CALC_PAGE" ]; then
  grep -n "const decodeVin\|vin-decode\|Decode VIN\|Continue to Duty Calculation\|const calculate\|guest/calculate\|setMode('manual')\|setMode(\"manual\")" "$CALC_PAGE" | tee -a "$OUT" || true
else
  echo "Calculator page missing." | tee -a "$OUT"
fi
echo "" | tee -a "$OUT"

echo "## 4. Supported country checks in calculator" | tee -a "$OUT"
if [ -f "$CALC_PAGE" ]; then
  echo "Country option lines:" | tee -a "$OUT"
  grep -n "<option value=" "$CALC_PAGE" | tee -a "$OUT" || true

  BAD_COUNTRIES="$(grep -Eo '<option value="[^"]+"' "$CALC_PAGE" | grep -Ev 'value="GH"|value="KE"' || true)"
  if [ -n "$BAD_COUNTRIES" ]; then
    echo "WARNING: Unsupported countries found in calculator:" | tee -a "$OUT"
    echo "$BAD_COUNTRIES" | tee -a "$OUT"
  else
    echo "OK: Only GH/KE options detected in calculator." | tee -a "$OUT"
  fi
fi
echo "" | tee -a "$OUT"

echo "## 5. Backend endpoint references from calculator" | tee -a "$OUT"
if [ -f "$CALC_PAGE" ]; then
  grep -n "/api/v1/customs" "$CALC_PAGE" | tee -a "$OUT" || true
fi
echo "" | tee -a "$OUT"

echo "## 6. Header/Footer wrapper checks" | tee -a "$OUT"
for f in "$CUSTOMS_PAGE" "$CALC_PAGE" "$TENANT_PAGE"; do
  if [ -f "$f" ]; then
    echo "--- $f ---" | tee -a "$OUT"
    grep -n "Navigation\|Footer\|components/landing/navigation\|components/landing/footer" "$f" | tee -a "$OUT" || echo "WARNING: Navigation/Footer not found in $f" | tee -a "$OUT"
  fi
done
echo "" | tee -a "$OUT"

echo "## 7. Suspicious syntax markers" | tee -a "$OUT"
for f in "$CUSTOMS_PAGE" "$CALC_PAGE" "$TENANT_PAGE" "$NAV_PAGE"; do
  if [ -f "$f" ]; then
    echo "--- $f ---" | tee -a "$OUT"
    grep -n "undefined\|TODO\|Coming soon\|countries\|Nigeria\|South Africa\|Uganda\|Rwanda\|Tanzania\|Côte\|Cote\|USA\|United States" "$f" | tee -a "$OUT" || true
  fi
done
echo "" | tee -a "$OUT"

echo "## 8. TypeScript / JSX compile check" | tee -a "$OUT"
if [ -f frontend/package.json ]; then
  (
    cd frontend
    echo "Running pnpm build dry check via normal build command..." 
    pnpm build
  ) 2>&1 | tee -a "$OUT" || {
    echo "" | tee -a "$OUT"
    echo "BUILD_FAILED: Review error above." | tee -a "$OUT"
  }
else
  echo "frontend/package.json missing." | tee -a "$OUT"
fi

echo "" | tee -a "$OUT"
echo "Audit written to: $OUT" | tee -a "$OUT"

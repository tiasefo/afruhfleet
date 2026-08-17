#!/usr/bin/env bash
#
# Afruheritage Performance & Capacity Test
# Runs realistic journey-based performance tests against the platform.
#
# Usage:
#   ./scripts/performance_test.sh [concurrent_users] [total_requests]
#
set -euo pipefail

API_URL="${API_URL:-http://localhost:8100}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3002}"
CONCURRENT="${1:-10}"
TOTAL_REQUESTS="${2:-100}"
RESULTS_DIR="${RESULTS_DIR:-/tmp/afruheritage-perf}"
TENANT_SLUG="${TENANT_SLUG:-amooksco}"

mkdir -p "$RESULTS_DIR"

echo "=== Afruheritage Performance Test ==="
echo "Concurrent users: ${CONCURRENT}"
echo "Total requests per endpoint: ${TOTAL_REQUESTS}"
echo "API: ${API_URL}"
echo "Frontend: ${FRONTEND_URL}"
echo ""

# Ensure ab (Apache Bench) or wrk is available
if command -v ab >/dev/null 2>&1; then
    BENCH_TOOL="ab"
elif command -v wrk >/dev/null 2>&1; then
    BENCH_TOOL="wrk"
else
    echo "ERROR: Neither 'ab' nor 'wrk' found. Install apache2-utils or wrk."
    exit 1
fi

run_ab() {
    local name="$1"
    local url="$2"
    local outfile="${RESULTS_DIR}/${name}.txt"

    echo "--- Testing: ${name} ---"
    ab -n "$TOTAL_REQUESTS" -c "$CONCURRENT" -s 10 -l "$url" > "$outfile" 2>&1 || true

    # Extract key metrics
    local rps failed median p95
    rps=$(grep "Requests per second" "$outfile" | awk '{print $4}' || echo "N/A")
    failed=$(grep "Failed requests" "$outfile" | awk '{print $3}' || echo "N/A")
    median=$(grep "50%" "$outfile" | awk '{print $2}' || echo "N/A")
    p95=$(grep "95%" "$outfile" | awk '{print $2}' || echo "N/A")

    printf "  RPS: %s | Failed: %s | Median: %s ms | p95: %s ms\n" "$rps" "$failed" "$median" "$p95"
    echo ""
}

echo "=== Journey 1: Public Storefront ==="
run_ab "storefront" "${FRONTEND_URL}/store/${TENANT_SLUG}"

echo "=== Journey 2: Tenant Context API ==="
run_ab "tenant_context" "${API_URL}/api/v1/tenant-context/${TENANT_SLUG}"

echo "=== Journey 3: Health Check ==="
run_ab "health" "${API_URL}/api/v1/health"

echo "=== Journey 4: Detailed Health ==="
run_ab "health_detailed" "${API_URL}/api/v1/health/detailed"

echo "=== Journey 5: Plans Listing ==="
run_ab "plans" "${API_URL}/api/v1/billing/plans"

echo "=== Journey 6: Pricing ==="
run_ab "pricing" "${API_URL}/api/v1/billing/pricing/professional"

echo ""
echo "=== Summary ==="
echo "Results saved to: ${RESULTS_DIR}/"
echo ""
echo "Initial Operating Envelope:"
echo "  - Concurrent users tested: ${CONCURRENT}"
echo "  - Requests per endpoint: ${TOTAL_REQUESTS}"
echo "  - Review individual results for latency percentiles"
echo ""
echo "Note: This is a synthetic baseline. Production capacity depends on"
echo "hardware, database size, Fleetbase response times, and real user patterns."

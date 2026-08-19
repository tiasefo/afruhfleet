#!/usr/bin/env bash
#
# Afruheritage Monitoring & Alerting Script
# Checks critical services and generates alerts when failures are detected.
#
# Usage:
#   ./scripts/monitor.sh              # One-shot check
#   ./scripts/monitor.sh --watch      # Continuous monitoring (60s interval)
#
set -uo pipefail

API_URL="${API_URL:-http://localhost:8100}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3002}"
FLEETBASE_URL="${FLEETBASE_URL:-http://10.0.0.115:8003}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # Optional: Slack/Discord webhook URL
LOG_FILE="${LOG_FILE:-/tmp/afruheritage-monitor.log}"

log() {
    local level="$1"; shift
    local msg="$*"
    local ts
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "[${ts}] [${level}] ${msg}" | tee -a "$LOG_FILE"
}

send_alert() {
    local component="$1"
    local detail="$2"
    local msg="🚨 Afruheritage Alert: ${component} — ${detail}"

    log "ALERT" "${component}: ${detail}"

    if [[ -n "$ALERT_WEBHOOK" ]]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"${msg}\"}" >/dev/null 2>&1 || true
    fi
}

check_http() {
    local name="$1"
    local url="$2"
    local expected_code="${3:-200}"

    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$url" 2>/dev/null || echo "000")

    if [[ "$code" == "$expected_code" ]]; then
        log "OK" "${name}: HTTP ${code} (${url})"
        return 0
    else
        send_alert "$name" "HTTP ${code} (expected ${expected_code}) at ${url}"
        return 1
    fi
}

check_db() {
    local db_host="${DB_HOST:-localhost}"
    local db_port="${DB_PORT:-5432}"

    if pg_isready --host="$db_host" --port="$db_port" --timeout=5 >/dev/null 2>&1; then
        log "OK" "Database: reachable at ${db_host}:${db_port}"
        return 0
    else
        send_alert "Database" "Cannot connect to PostgreSQL at ${db_host}:${db_port}"
        return 1
    fi
}

check_redis() {
    local redis_url="${REDIS_URL:-redis://localhost:6379}"

    if redis-cli -u "$redis_url" ping >/dev/null 2>&1; then
        log "OK" "Redis: reachable at ${redis_url}"
        return 0
    else
        send_alert "Redis" "Cannot connect to Redis at ${redis_url}"
        return 1
    fi
}

check_fleetbase() {
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 --max-time 10 "$FLEETBASE_URL/health" 2>/dev/null || echo "000")

    if [[ "$code" == "200" ]] || [[ "$code" == "204" ]]; then
        log "OK" "Fleetbase: reachable at ${FLEETBASE_URL} (HTTP ${code})"
        return 0
    else
        send_alert "Fleetbase" "HTTP ${code} at ${FLEETBASE_URL}/health"
        return 1
    fi
}

check_detailed_health() {
    local result
    result=$(curl -s --connect-timeout 5 --max-time 10 "${API_URL}/health" 2>/dev/null || echo '{"status":"error"}')

    local status
    status=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "parse_error")

    if [[ "$status" == "ok" ]]; then
        log "OK" "API detailed health: all components healthy"
        return 0
    elif [[ "$status" == "degraded" ]]; then
        local details
        details=$(echo "$result" | python3 -c "
import sys,json
data=json.load(sys.stdin)
comps=data.get('components',{})
failed=[k for k,v in comps.items() if v.get('status')=='error']
print(', '.join(failed))
" 2>/dev/null || echo "unknown")
        send_alert "API Health" "Degraded — failed components: ${details}"
        return 1
    else
        send_alert "API Health" "Cannot parse health response (status: ${status})"
        return 1
    fi
}

run_checks() {
    log "INFO" "=== Starting health check cycle ==="
    local failures=0

    check_http "API" "${API_URL}/health" "200" || ((failures++))
    check_http "Frontend" "${FRONTEND_URL}" "200" || ((failures++))
    check_db || ((failures++))
    check_redis || ((failures++))
    check_fleetbase || ((failures++))
    check_detailed_health || ((failures++))

    log "INFO" "=== Check cycle complete: ${failures} failure(s) ==="
    echo ""

    return $failures
}

case "${1:-}" in
    --watch)
        while true; do
            run_checks || true
            sleep 60
        done
        ;;
    *)
        run_checks
        ;;
esac

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ADMIN_DIR="$ROOT_DIR/admin-console"
FRONTEND_DIR="$ROOT_DIR/frontend"
ADMIN_FRONTEND_DIR="$ADMIN_DIR/frontend"

API_LOG="/tmp/afru-api.log"
ADMIN_API_LOG="/tmp/afru-admin-api.log"
FRONTEND_LOG="/tmp/afru-frontend.log"
ADMIN_FRONTEND_LOG="/tmp/afru-admin-frontend.log"

python_has_backend_deps() {
  local pybin="$1"
  "$pybin" - <<'PY' >/dev/null 2>&1
import fastapi  # noqa: F401
import uvicorn  # noqa: F401
import requests  # noqa: F401
try:
    import psycopg2  # noqa: F401
except ModuleNotFoundError:
    import psycopg  # noqa: F401
PY
}

pick_python() {
  local candidates=(
    "$ROOT_DIR/.venv/bin/python"
    "$ROOT_DIR/venv/bin/python"
    "python3"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if command -v "$candidate" >/dev/null 2>&1 && python_has_backend_deps "$candidate"; then
      echo "$candidate"
      return 0
    fi
  done

  echo "python3"
}

kill_port() {
  local port="$1"
  local pids
  pids=$(ss -ltnp "( sport = :$port )" 2>/dev/null | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)
  if [[ -z "$pids" ]] && command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u)
  fi
  if [[ -z "$pids" ]] && command -v fuser >/dev/null 2>&1; then
    pids=$(fuser "$port"/tcp 2>/dev/null | tr ' ' '\n' | sed '/^$/d' | sort -u)
  fi
  if [[ -n "$pids" ]]; then
    echo "Stopping process(es) on :$port -> $pids"
    kill $pids || true
    sleep 1
  fi
}

wait_for_port() {
  local port="$1"
  local timeout="${2:-20}"
  local elapsed=0

  while (( elapsed < timeout )); do
    if ss -ltnp | rg -q ":${port}\\b"; then
      echo "✅ Port $port is listening"
      return 0
    fi
    sleep 1
    ((elapsed+=1))
  done

  echo "❌ Port $port did not start within ${timeout}s"
  return 1
}

load_env_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return 0
  fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" == *"="* ]]; then
      local key="${line%%=*}"
      local value="${line#*=}"
      key="${key//[[:space:]]/}"
      export "$key=$value"
    fi
  done < "$file"
}

echo "Loading environment files..."
load_env_file "$ROOT_DIR/.env"
load_env_file "$ADMIN_DIR/.env"

if [[ -n "${DATABASE_URL:-}" ]]; then
  export ADMIN_DATABASE_URL="$DATABASE_URL"
fi
export CONTROL_PLANE_BASE_URL="${CONTROL_PLANE_BASE_URL:-http://localhost:8100}"

PYTHON_BIN="$(pick_python)"

echo "Stopping existing listeners on 3200/3001/4000/8100..."
kill_port 3200
kill_port 3001
kill_port 4000
kill_port 8100

echo "Starting control-plane API (:8100)..."
nohup "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8100 --app-dir "$ROOT_DIR" --env-file "$ROOT_DIR/.env" > "$API_LOG" 2>&1 &

echo "Starting admin backend (:4000)..."
nohup "$PYTHON_BIN" -m uvicorn admin_app.main:app --host 0.0.0.0 --port 4000 --app-dir "$ADMIN_DIR" --env-file "$ADMIN_DIR/.env" > "$ADMIN_API_LOG" 2>&1 &

echo "Starting SaaS frontend (:3200)..."
nohup npm --prefix "$FRONTEND_DIR" run dev -- --port 3200 --webpack > "$FRONTEND_LOG" 2>&1 &

echo "Starting admin frontend (:3001)..."
nohup npm --prefix "$ADMIN_FRONTEND_DIR" run dev -- --port 3001 --webpack > "$ADMIN_FRONTEND_LOG" 2>&1 &

wait_for_port 8100
wait_for_port 4000
wait_for_port 3200
wait_for_port 3001

echo
echo "Services are up."
echo "- API:           http://10.0.0.115:8100"
echo "- Admin API:     http://10.0.0.115:4000/admin/health"
echo "- Frontend:      http://10.0.0.115:3200"
echo "- Admin UI:      http://10.0.0.115:3001"
echo
echo "Logs:"
echo "- $API_LOG"
echo "- $ADMIN_API_LOG"
echo "- $FRONTEND_LOG"
echo "- $ADMIN_FRONTEND_LOG"

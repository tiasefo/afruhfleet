#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-dry-run}"
TS="$(date +%Y%m%d_%H%M%S)"
REPORT="reports/autofix_${TS}"
mkdir -p "$REPORT/backups"

log(){ echo "$1" | tee -a "$REPORT/autofix.log"; }

backup(){
  local f="$1"
  if [ -f "$f" ]; then
    mkdir -p "$REPORT/backups/$(dirname "$f")"
    cp "$f" "$REPORT/backups/$f"
  fi
}

apply_sed(){
  local file="$1"
  local search="$2"
  local replace="$3"
  if [ ! -f "$file" ]; then return; fi
  if grep -q "$search" "$file"; then
    log "PATCH: $file :: $search -> $replace"
    backup "$file"
    if [ "$MODE" = "apply" ]; then
      sed -i "s|$search|$replace|g" "$file"
    fi
  fi
}

log "AfruHeritage Safe Autofix - $MODE"
log "Report: $REPORT"

# 1. Admin console DB localhost fix
apply_sed "admin-console/.env" "@localhost:5432" "@postgres:5432"
apply_sed "admin-console/.env.docker" "@localhost:5432" "@postgres:5432"

# 2. Admin healthcheck fix: app exposes /openapi.json, not /health or /docs
apply_sed "docker-compose.yml" "http://localhost:4000/docs" "http://localhost:4000/openapi.json"
apply_sed "docker-compose.yml" "http://localhost:4000/health" "http://localhost:4000/openapi.json"
apply_sed "docker-compose.prod.yml" "http://localhost:4000/health" "http://localhost:4000/openapi.json"

# 3. Frontend API fallback should not point to localhost:8000
apply_sed "frontend/middleware.ts" "http://localhost:8000/api/v1" "http://api:8000/api/v1"

# 4. Remove hardcoded dashboard IP links
apply_sed "frontend/app/dashboard/page.tsx" "http://10.0.0.115:3001/dashboard/tenants" "/admin/runtime"
apply_sed "frontend/app/dashboard/page.tsx" "http://10.0.0.115:3001/dashboard" "/admin/runtime"

# 5. Docker env production-ish frontend API
apply_sed "frontend/.env.docker" "NEXT_PUBLIC_APP_URL=http://localhost:3000" "NEXT_PUBLIC_APP_URL=https://afruheritage.com"
apply_sed ".env.docker" "http://localhost:3000" "https://afruheritage.com"
apply_sed ".env.docker" "http://localhost:8100" "https://api.afruheritage.com"

# 6. Clean duplicate frontend API exports by keeping first occurrence
if [ -f "frontend/lib/api.ts" ]; then
  backup "frontend/lib/api.ts"
  if [ "$MODE" = "apply" ]; then
python3 - <<'PY'
from pathlib import Path
p = Path("frontend/lib/api.ts")
text = p.read_text()
names = [
    "commercialApi",
    "paymentHubApi",
    "adminCreditsApi",
    "adminSubscriptionsApi",
    "marketplaceApi",
    "adminMarketplaceApi",
]
for name in names:
    marker = f"export const {name} = {{"
    first = text.find(marker)
    second = text.find(marker, first + 1) if first != -1 else -1
    while second != -1:
        # remove duplicate block by brace counting
        start = second
        i = text.find("{", start)
        depth = 0
        end = i
        while end < len(text):
            if text[end] == "{":
                depth += 1
            elif text[end] == "}":
                depth -= 1
                if depth == 0:
                    end += 1
                    # remove trailing semicolon/newlines
                    while end < len(text) and text[end] in ";\n\r ":
                        end += 1
                    break
            end += 1
        text = text[:start] + text[end:]
        second = text.find(marker, first + 1)
p.write_text(text)
print("Duplicate API exports cleaned")
PY
  else
    grep -n "export const .*Api" frontend/lib/api.ts | sort | tee "$REPORT/frontend_api_exports.txt" || true
  fi
fi

# 7. Ensure admin DB exists
if [ "$MODE" = "apply" ]; then
  docker compose exec -T postgres psql -U afruheritage -d afruheritage <<'SQL' || true
SELECT 'CREATE DATABASE admin_console'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='admin_console')\gexec
SQL
fi

# 8. Build/test checks
log "Running checks..."
if [ "$MODE" = "apply" ]; then
  python3 -m compileall app admin-console/admin_app > "$REPORT/python_compile.txt" 2>&1 || true
  npm --prefix frontend run build > "$REPORT/frontend_build.txt" 2>&1 || true
  docker compose config > "$REPORT/docker_compose_config.txt" 2>&1 || true
else
  log "Dry-run only. Run with: bash scripts/safe_autofix_platform.sh apply"
fi

log "Done. Review: $REPORT"

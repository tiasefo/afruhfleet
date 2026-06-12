#!/usr/bin/env bash
# deep_audit.sh — Full codebase audit for UAT readiness
# Run from your project root: bash deep_audit.sh > audit_output.txt 2>&1
set -euo pipefail

ROOT="${1:-.}"
OUT="audit_$(date +%Y%m%d_%H%M%S).txt"
exec > >(tee "$OUT") 2>&1

hr() { echo ""; echo "════════════════════════════════════════════════════════"; echo "  $1"; echo "════════════════════════════════════════════════════════"; }
h2() { echo ""; echo "  ── $1"; }

echo "DEEP CODEBASE AUDIT — $(date)"
echo "Root: $(realpath $ROOT)"

# ── 1. PORT INVENTORY ────────────────────────────────────────────────────────
hr "1. ALL PORT REFERENCES (every hardcoded port in every file)"
echo "[Grouped by port number]"
grep -rn --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" \
     --include="*.mjs" --include="*.json" --include="*.yaml" --include="*.yml" \
     --include="*.env*" --include="*.cfg" --include="*.toml" \
     -E "localhost:[0-9]{4}|127\.0\.0\.1:[0-9]{4}|0\.0\.0\.0:[0-9]{4}" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" \
  | sort -t: -k4 -n || true

# ── 2. HARDCODED IPs ─────────────────────────────────────────────────────────
hr "2. ALL HARDCODED IP ADDRESSES (non-localhost)"
grep -rn --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" \
     --include="*.mjs" --include="*.env*" \
     -E "[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" \
  | grep -v "0\.0\.0\.0" | grep -v "127\.0\.0\.1" | grep -v "255\.255" \
  | grep -v "example\.com" || true

# ── 3. ENVIRONMENT VARIABLES ────────────────────────────────────────────────
hr "3. ENVIRONMENT VARIABLE AUDIT"

h2 "3a. All env vars READ in code (process.env.* / os.environ / os.getenv)"
grep -rn --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.mjs" \
     -E 'os\.environ\.get\(|os\.getenv\(|process\.env\.' "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" \
  | grep -oE '(os\.environ\.get\(|os\.getenv\(|process\.env\.)[A-Z_a-z0-9"'"'"']+' \
  | sed 's/os\.environ\.get(//;s/os\.getenv(//;s/process\.env\.//;s/['"'"'"]//g' \
  | sort -u || true

h2 "3b. All .env files found"
find "$ROOT" -name ".env*" ! -path "*/node_modules/*" ! -path "*/.next/*" | sort || true

h2 "3c. Variables defined in .env files"
find "$ROOT" -name ".env*" ! -path "*/node_modules/*" ! -path "*/.next/*" \
  -exec echo "--- {} ---" \; -exec grep -v "^#" {} \; 2>/dev/null | grep -v "^$" || true

# ── 4. API ROUTE INVENTORY ───────────────────────────────────────────────────
hr "4. BACKEND API ROUTES — FULL INVENTORY"

h2 "4a. FastAPI/Flask route decorators (Python)"
grep -rn --include="*.py" \
     -E "@(router|app)\.(get|post|put|patch|delete|options)\(" "$ROOT" \
  | grep -v "node_modules" | grep -v "__pycache__" \
  | sed 's/.*@/  @/' | sort || true

h2 "4b. Routers registered in main.py / app factory"
find "$ROOT" -name "main.py" ! -path "*/node_modules/*" ! -path "*/__pycache__/*" \
  -exec echo "--- {} ---" \; -exec grep -n "include_router\|add_route\|register_blueprint" {} \; || true

h2 "4c. Route files that EXIST but may not be registered"
echo "[Python route files found vs registered]"
ROUTE_FILES=$(find "$ROOT" -path "*/routes/*.py" ! -path "*/__pycache__/*" \
  ! -name "__init__.py" | sort)
MAIN_FILES=$(find "$ROOT" -name "main.py" ! -path "*/__pycache__/*")
for rf in $ROUTE_FILES; do
  module=$(basename "$rf" .py)
  found=false
  for mf in $MAIN_FILES; do
    if grep -q "$module" "$mf" 2>/dev/null; then
      found=true; break
    fi
  done
  if [ "$found" = false ]; then
    echo "  ⚠ NOT REGISTERED: $rf"
  else
    echo "  ✓ registered:     $rf"
  fi
done

# ── 5. FRONTEND API CALLS ────────────────────────────────────────────────────
hr "5. FRONTEND API CALL INVENTORY"

h2 "5a. All fetch() calls"
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
     -E "fetch\(['\`\"]" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" || true

h2 "5b. All axios calls"
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
     -E "axios\.(get|post|put|patch|delete)\(" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" || true

h2 "5c. All API path strings (quoted /api/ paths)"
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
     -oE "['\"\`]/api/v[0-9]/[a-zA-Z0-9/_-]+" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | sort -u || true

h2 "5d. Next.js rewrites / proxies"
find "$ROOT" -name "next.config*" ! -path "*/node_modules/*" \
  -exec echo "--- {} ---" \; -exec cat {} \; || true

# ── 6. AUTHENTICATION FLOW ───────────────────────────────────────────────────
hr "6. AUTHENTICATION & HEADER AUDIT"

h2 "6a. All Authorization header usages"
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.py" \
     -E "Authorization|Bearer|X-CP-Token|X-Admin-Token|X-API-Key|api.key|apikey" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" || true

h2 "6b. Token storage locations (localStorage, cookies, context)"
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
     -E "localStorage|sessionStorage|cookie|setToken|getToken|TokenManager" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" || true

h2 "6c. Auth middleware / dependency injection (Python)"
grep -rn --include="*.py" \
     -E "Depends\(|require_auth|require_superuser|get_current_user|verify_token" "$ROOT" \
  | grep -v "__pycache__" || true

# ── 7. DATABASE / MODEL AUDIT ────────────────────────────────────────────────
hr "7. DATABASE & MODEL AUDIT"

h2 "7a. Database connection strings"
grep -rn --include="*.py" --include="*.env*" --include="*.yaml" --include="*.toml" \
     -E "DATABASE_URL|SQLALCHEMY|mongodb://|postgres://|mysql://|sqlite" "$ROOT" \
  | grep -v "node_modules" | grep -v "__pycache__" || true

h2 "7b. SQLAlchemy models defined"
grep -rn --include="*.py" \
     -E "class [A-Z][a-zA-Z]+\(.*Base.*\)|class [A-Z][a-zA-Z]+\(.*Model.*\)" "$ROOT" \
  | grep -v "__pycache__" || true

h2 "7c. Migration files present"
find "$ROOT" -name "alembic.ini" -o -name "versions" -type d \
  ! -path "*/node_modules/*" ! -path "*/__pycache__/*" | head -20 || true

# ── 8. CORS & SECURITY ───────────────────────────────────────────────────────
hr "8. CORS & SECURITY CONFIG"

h2 "8a. CORS configuration"
grep -rn --include="*.py" --include="*.ts" --include="*.js" --include="*.mjs" \
     -E "CORSMiddleware|cors\(|allow_origins|allowedOrigins|Access-Control" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" || true

h2 "8b. Secret keys / JWT secrets (check for hardcoded values)"
grep -rn --include="*.py" --include="*.ts" --include="*.js" --include="*.env*" \
     -E "SECRET_KEY|JWT_SECRET|secret_key|jwt_secret" "$ROOT" \
  | grep -v "node_modules" | grep -v "__pycache__" || true

h2 "8c. Debug mode flags"
grep -rn --include="*.py" --include="*.ts" --include="*.js" --include="*.env*" \
     -E "DEBUG\s*=\s*True|debug:\s*true|NODE_ENV.*development" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" || true

# ── 9. FRONTEND PAGES vs API COVERAGE ───────────────────────────────────────
hr "9. FRONTEND PAGES vs API CLIENT COVERAGE"

h2 "9a. All frontend page routes (Next.js app dir)"
find "$ROOT" -path "*/app/*" -name "page.tsx" -o -name "page.ts" \
  ! -path "*/node_modules/*" ! -path "*/.next/*" | sort \
  | sed "s|$ROOT||" || true

h2 "9b. API client function names defined"
grep -rn --include="*.ts" --include="*.js" \
     -E "^export (const|async function|function) [a-zA-Z]+" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -i "api\|client\|fetch\|request" || true

# ── 10. DOCKER / DEPLOYMENT CONFIG ──────────────────────────────────────────
hr "10. DOCKER & DEPLOYMENT"

h2 "10a. docker-compose service ports"
find "$ROOT" -name "docker-compose*.yml" -o -name "docker-compose*.yaml" \
  ! -path "*/node_modules/*" \
  | xargs grep -n "ports:" -A5 2>/dev/null || true

h2 "10b. Dockerfile CMD / ENTRYPOINT"
find "$ROOT" -name "Dockerfile*" ! -path "*/node_modules/*" \
  -exec echo "--- {} ---" \; \
  -exec grep -E "CMD|ENTRYPOINT|EXPOSE|ENV" {} \; || true

h2 "10c. Service names vs env var references"
echo "[Services in docker-compose vs what code expects]"
find "$ROOT" -name "docker-compose*.yml" ! -path "*/node_modules/*" \
  -exec grep -E "^\s+[a-z_-]+:" {} \; 2>/dev/null | grep -v "#" | sort -u || true

# ── 11. DEPENDENCY AUDIT ─────────────────────────────────────────────────────
hr "11. DEPENDENCY FILES"

h2 "11a. Python requirements"
find "$ROOT" -name "requirements*.txt" ! -path "*/node_modules/*" \
  -exec echo "--- {} ---" \; -exec cat {} \; || true

h2 "11b. package.json dependencies (non node_modules)"
find "$ROOT" -name "package.json" ! -path "*/node_modules/*" ! -path "*/.next/*" \
  -exec echo "--- {} ---" \; \
  -exec python3 -c "
import json,sys
try:
  d=json.load(open(sys.argv[1]))
  deps={**d.get('dependencies',{}),**d.get('devDependencies',{})}
  [print(f'  {k}: {v}') for k,v in sorted(deps.items())]
except: pass
" {} \; 2>/dev/null || true

# ── 12. DEAD CODE / TODO / FIXME ────────────────────────────────────────────
hr "12. TODO / FIXME / HACK / STUB / PLACEHOLDER"
grep -rn --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" \
     -E "TODO|FIXME|HACK|STUB|PLACEHOLDER|NOT IMPLEMENTED|raise NotImplementedError" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" | grep -v "__pycache__" || true

# ── 13. ERROR HANDLING ───────────────────────────────────────────────────────
hr "13. BARE EXCEPTION HANDLERS (catch-all error masking)"

h2 "13a. Python bare except"
grep -rn --include="*.py" \
     -E "except Exception|except:$|except \*:" "$ROOT" \
  | grep -v "__pycache__" || true

h2 "13b. JS/TS empty catch blocks"
grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
     -E "catch\s*\([a-z_]*\)\s*\{?\s*\}|catch\s*\{\s*\}" "$ROOT" \
  | grep -v "node_modules" | grep -v ".next" || true

# ── 14. MULTI-TENANT ISOLATION ───────────────────────────────────────────────
hr "14. TENANT ISOLATION CHECKS"

h2 "14a. Tenant ID usage in queries"
grep -rn --include="*.py" \
     -E "tenant_id|org_id|organization_id" "$ROOT" \
  | grep -v "__pycache__" | grep -v "test_" || true

h2 "14b. Routes that filter by tenant vs routes that don't"
echo "[Routes with no tenant filter — potential data leak]"
grep -rn --include="*.py" \
     -E "@(router|app)\.(get|post|put|delete)\(" "$ROOT" \
  | grep -v "__pycache__" \
  | while IFS=: read file line content; do
      # Get next 20 lines after route decorator
      context=$(sed -n "${line},$((line+20))p" "$file" 2>/dev/null)
      if ! echo "$context" | grep -qE "tenant_id|current_user|require_auth"; then
        echo "  ⚠ $file:$line — no tenant/auth filter visible"
        echo "    $content"
      fi
    done 2>/dev/null | head -60 || true

# ── SUMMARY ──────────────────────────────────────────────────────────────────
hr "AUDIT COMPLETE"
echo "Output saved to: $OUT"
echo ""
echo "QUICK WINS TO CHECK FIRST:"
echo "  1. Section 1  — port mismatches (critical blocking issues)"
echo "  2. Section 4c — unregistered route files"
echo "  3. Section 6a — missing auth headers"
echo "  4. Section 8b — hardcoded secrets"
echo "  5. Section 14b — tenant isolation gaps"

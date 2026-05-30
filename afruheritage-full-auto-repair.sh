#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

echo "===================================================="
echo " AFRUHERITAGE FULL-STACK AUTO-REPAIR ENGINE "
echo "===================================================="
echo "Root: $ROOT"
echo

have() { command -v "$1" >/dev/null 2>&1; }

###############################################
# 0. Detect key paths
###############################################
BACKEND_DIR="$ROOT/afruheritage-platform"
FRONTEND_DIR="$ROOT/afruheritage-platform/frontend"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ Backend dir not found at $BACKEND_DIR"
  exit 1
fi

###############################################
# 1. Git hygiene repair
###############################################
echo "[1] Repairing Git hygiene..."

# Ensure .gitignore exists
touch .gitignore

# Append ignores if not already present
grep -q "venv/" .gitignore || echo "venv/" >> .gitignore
grep -q "__pycache__/" .gitignore || echo "__pycache__/" >> .gitignore
grep -q "*.pyc" .gitignore || echo "*.pyc" >> .gitignore
grep -q "node_modules/" .gitignore || echo "node_modules/" >> .gitignore

# Remove junk from index (but not from disk)
git rm -r --cached venv/ 2>/dev/null || true
git rm -r --cached */__pycache__/ 2>/dev/null || true
git rm -r --cached node_modules/ 2>/dev/null || true

echo "✔ Git hygiene repaired (venv, __pycache__, node_modules untracked)"

###############################################
# 2. Python auto-fix: future imports + syntax
###############################################
echo
echo "[2] Auto-fixing Python files (future imports, basic cleanup)..."

# Move "from __future__ import annotations" to top of each file
find "$BACKEND_DIR" -type f -name "*.py" | while read -r file; do
  if grep -q "from __future__ import annotations" "$file"; then
    tmp=$(mktemp)
    {
      # keep shebang if present
      head -n 1 "$file" | grep -q "^#!" && head -n 1 "$file" || true
      # ensure future import immediately after shebang/comments
      echo "from __future__ import annotations"
      # rest of file without duplicate future imports and without shebang
      tail -n +2 "$file" | grep -v "from __future__ import annotations"
    } > "$tmp"
    mv "$tmp" "$file"
  fi
done

echo "✔ Future imports normalized"

echo
echo "[2b] Validating Python syntax (compileall)..."
if python -m compileall "$BACKEND_DIR"; then
  echo "✔ Backend compiles cleanly"
else
  echo "❌ Backend still has syntax errors (see compileall output above)"
fi

###############################################
# 3. Install tools (Python + ripgrep)
###############################################
echo
echo "[3] Ensuring analysis tools are installed..."

pip install -q ruff flake8 mypy bandit safety pip-audit pytest || true
if ! have rg; then
  sudo apt update -y && sudo apt install -y ripgrep || true
fi

echo "✔ Tools installed (where possible)"

###############################################
# 4. Python linting, types, security
###############################################
echo
echo "[4] Running Python linting, typing, security..."

cd "$BACKEND_DIR"

have ruff && ruff check . || echo "⚠ ruff not available or failed"
have flake8 && flake8 . || echo "⚠ flake8 not available or failed"
have mypy && mypy . || echo "⚠ mypy not available or failed"
have bandit && bandit -r . || echo "⚠ bandit not available or failed"
if have safety; then
  safety check || echo "⚠ safety reported issues or failed"
elif have pip-audit; then
  pip-audit || echo "⚠ pip-audit reported issues or failed"
else
  echo "⚠ No safety/pip-audit available"
fi

cd "$ROOT"

###############################################
# 5. Multi-tenant auto-heuristics (report)
###############################################
echo
echo "[5] Multi-tenant heuristics (report only)..."

TENANT_REPORT="$ROOT/tenant_warnings.txt"

if have rg; then
  rg -n "APIRouter|@router\.get|@router\.post|@app\.get|@app\.post" "$BACKEND_DIR/app/api/routes" \
    | rg -v "tenant_id" > "$TENANT_REPORT" || true

  if [ -s "$TENANT_REPORT" ]; then
    echo "⚠ Potential endpoints missing tenant_id (see $TENANT_REPORT)"
  else
    echo "✔ Heuristic: all scanned endpoints reference tenant_id somewhere"
  fi
else
  echo "⚠ rg not installed; skipping multi-tenant heuristic"
fi

###############################################
# 6. TypeScript / React auto-fix
###############################################
echo
echo "[6] Auto-fixing common TypeScript/React patterns..."

if [ -d "$FRONTEND_DIR" ]; then
  # Fix pattern like: useState<string | null)(null)
  find "$FRONTEND_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r file; do
    # Only touch files that contain the broken pattern
    if grep -q "useState<" "$file"; then
      # Fix the specific error you hit: `useState<string | null)(null)`
      sed -i 's/useState<\([^>]*\))(/useState<\1>(/g' "$file"
    fi
  done
  echo "✔ TypeScript useState generic call patterns normalized"
else
  echo "⚠ Frontend dir not found at $FRONTEND_DIR; skipping TS auto-fix"
fi

###############################################
# 7. Next.js / Turbopack config auto-fix
###############################################
echo
echo "[7] Next.js / Turbopack config normalization..."

if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/next.config.mjs" ]; then
  cd "$FRONTEND_DIR"

  # Prefer pnpm if lockfile exists, else yarn, else npm
  PKG_MGR=""
  if [ -f "pnpm-lock.yaml" ] && have pnpm; then
    PKG_MGR="pnpm"
  elif [ -f "yarn.lock" ] && have yarn; then
    PKG_MGR="yarn"
  elif have npm; then
    PKG_MGR="npm"
  fi

  # Normalize next.config.mjs to set turbopack.root if not present
  if ! grep -q "turbopack" next.config.mjs; then
    cat <<'EOF' >> next.config.mjs

// Auto-injected by afrheritage full-stack repair
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
EOF
    echo "✔ turbopack.root injected into next.config.mjs"
  else
    echo "ℹ turbopack config already present; not modifying"
  fi

  # Install deps & build
  if [ -n "$PKG_MGR" ]; then
    echo "Using package manager: $PKG_MGR"
    if [ "$PKG_MGR" = "pnpm" ]; then
      pnpm install --silent || echo "⚠ pnpm install failed"
      pnpm run build || echo "⚠ pnpm build failed"
    elif [ "$PKG_MGR" = "yarn" ]; then
      yarn install --silent || echo "⚠ yarn install failed"
      yarn build || echo "⚠ yarn build failed"
    else
      npm install --silent || echo "⚠ npm install failed"
      npm run build || echo "⚠ npm build failed"
    fi
  else
    echo "⚠ No package manager available; skipping frontend build"
  fi

  cd "$ROOT"
else
  echo "⚠ Frontend dir or next.config.mjs missing; skipping Next.js config fix"
fi

###############################################
# 8. Stage all changes
###############################################
echo
echo "[8] Staging all changes..."

git add -A || true

echo "✔ All modifications staged (review before commit)"

###############################################
# 9. Summary
###############################################
echo
echo "===================================================="
echo " FULL-STACK AUTO-REPAIR COMPLETE "
echo "===================================================="
echo "• Git hygiene repaired (venv, __pycache__, node_modules ignored)"
echo "• Python future imports normalized and syntax checked"
echo "• Linting / typing / security tools invoked"
echo "• Multi-tenant heuristic report: $TENANT_REPORT (if generated)"
echo "• TypeScript useState patterns auto-fixed"
echo "• Next.js/Turbopack config normalized (if possible)"
echo "• All changes staged: run 'git diff --cached' then commit"
echo "===================================================="

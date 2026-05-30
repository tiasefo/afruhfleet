#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
BACKEND_DIR="$ROOT/afruheritage-platform"
FRONTEND_DIR="$ROOT/afruheritage-platform/frontend"
TENANT_REPORT="$ROOT/tenant_warnings.txt"

have() { command -v "$1" >/dev/null 2>&1; }

echo "===================================================="
echo " AFRUHERITAGE FULL-STACK AUTO-REPAIR ENGINE v2 (pnpm)"
echo "===================================================="
echo "Root: $ROOT"
echo

###############################################
# 0. Sanity checks
###############################################
if [ ! -d "$BACKEND_DIR" ]; then
  echo "❌ Backend dir not found at $BACKEND_DIR"
  exit 1
fi

###############################################
# 1. Git hygiene + .gitignore
###############################################
echo "[1] Repairing Git hygiene..."

touch .gitignore

add_ignore() {
  local pattern="$1"
  grep -qF "$pattern" .gitignore || echo "$pattern" >> .gitignore
}

add_ignore "venv/"
add_ignore "__pycache__/"
add_ignore "*.pyc"
add_ignore "node_modules/"
add_ignore ".next/"
add_ignore ".pytest_cache/"
add_ignore ".mypy_cache/"

git rm -r --cached venv/ 2>/dev/null || true
git rm -r --cached */__pycache__/ 2>/dev/null || true
git rm -r --cached node_modules/ 2>/dev/null || true
git rm -r --cached */.next/ 2>/dev/null || true

echo "✔ Git hygiene normalized"

###############################################
# 2. Enforce pnpm as single package manager
###############################################
echo
echo "[2] Enforcing pnpm as the only package manager..."

# Remove other lockfiles
find "$ROOT" -maxdepth 3 -type f \( -name "yarn.lock" -o -name "package-lock.json" \) -print -delete || true

# Keep one canonical pnpm-lock.yaml at repo root if present
if [ -f "$ROOT/pnpm-lock.yaml" ] && [ -f "$FRONTEND_DIR/pnpm-lock.yaml" ]; then
  # Prefer root lockfile, remove frontend one
  rm -f "$FRONTEND_DIR/pnpm-lock.yaml"
fi

echo "✔ Non-pnpm lockfiles removed; pnpm is canonical"

###############################################
# 3. Python auto-fix: future imports + upgrades
###############################################
echo
echo "[3] Python auto-fix (future imports + upgrades)..."

# Normalize future imports
find "$BACKEND_DIR" -type f -name "*.py" | while read -r file; do
  if grep -q "from __future__ import annotations" "$file"; then
    tmp=$(mktemp)
    {
      # Preserve shebang if present
      first_line="$(head -n 1 "$file")"
      if [[ "$first_line" == "#!"* ]]; then
        echo "$first_line"
        echo "from __future__ import annotations"
        tail -n +2 "$file" | grep -v "from __future__ import annotations"
      else
        echo "from __future__ import annotations"
        grep -v "from __future__ import annotations" "$file"
      fi
    } > "$tmp"
    mv "$tmp" "$file"
  fi
done

echo "✔ Future imports normalized"

# Upgrade key Python packages to reduce vulnerability noise
echo
echo "[3b] Upgrading key Python packages (pip, urllib3, starlette, python-multipart, python-jose, ecdsa)..."

pip install -q --upgrade pip urllib3 "starlette>=0.49.1" "python-multipart>=0.0.22" "python-jose>=3.4.0" cryptography || true

echo "✔ Python core deps upgraded (where possible)"

echo
echo "[3c] Validating Python syntax (compileall)..."
if python -m compileall "$BACKEND_DIR"; then
  echo "✔ Backend compiles cleanly"
else
  echo "❌ Backend still has syntax errors (see compileall output above)"
fi

###############################################
# 4. Install analysis tools
###############################################
echo
echo "[4] Ensuring analysis tools are installed..."

pip install -q ruff flake8 mypy bandit safety pip-audit pytest || true
if ! have rg; then
  sudo apt update -y && sudo apt install -y ripgrep || true
fi

echo "✔ Tools installed (where possible)"

###############################################
# 5. Python linting / typing / security
###############################################
echo
echo "[5] Running Python linting / typing / security..."

cd "$BACKEND_DIR"

have ruff && ruff check . || echo "⚠ ruff not available or reported issues"
have flake8 && flake8 . || echo "⚠ flake8 not available or reported issues"
have mypy && mypy . || echo "⚠ mypy not available or reported issues"
have bandit && bandit -r . || echo "⚠ bandit not available or reported issues"

if have safety; then
  safety check || echo "⚠ safety reported issues or failed (see above)"
elif have pip-audit; then
  pip-audit || echo "⚠ pip-audit reported issues or failed (see above)"
else
  echo "⚠ No safety/pip-audit available"
fi

cd "$ROOT"

###############################################
# 6. Multi-tenant heuristics (report only)
###############################################
echo
echo "[6] Multi-tenant heuristics (report only)..."

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
# 7. TypeScript / React auto-fix
###############################################
echo
echo "[7] Auto-fixing common TypeScript/React patterns..."

if [ -d "$FRONTEND_DIR" ]; then
  # Fix useState<...)(...) → useState<...>(...)
  find "$FRONTEND_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r file; do
    sed -i 's/useState<\([^>]*\))(/useState<\1>(/g' "$file"
  done

  echo "✔ TypeScript useState generic call patterns normalized"
else
  echo "⚠ Frontend dir not found at $FRONTEND_DIR; skipping TS auto-fix"
fi

###############################################
# 8. Next.js / Turbopack config normalization
###############################################
echo
echo "[8] Next.js / Turbopack config normalization (pnpm)..."

if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/next.config.mjs" ]; then
  cd "$FRONTEND_DIR"

  # Ensure pnpm is available
  if ! have pnpm; then
    npm install -g pnpm || true
  fi

  # Safely inject turbopack.root into existing next.config.mjs
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.cwd(), 'next.config.mjs');
let src = fs.readFileSync(configPath, 'utf8');

// If there's already a turbopack block, don't duplicate; just leave it.
if (src.includes('turbopack')) {
  console.log('ℹ turbopack config already present in next.config.mjs; not modifying');
  process.exit(0);
}

// If there's an existing nextConfig, extend it; otherwise define it.
if (src.includes('nextConfig')) {
  // Try to append turbopack to existing nextConfig object
  // This is a heuristic: we append a turbopack field near the end.
  const idx = src.lastIndexOf('export default nextConfig');
  if (idx === -1) {
    console.log('⚠ Could not locate export default nextConfig; appending new config block');
    src += `

/** Auto-injected by afrheritage repair v2 */
nextConfig.turbopack = { root: __dirname };
`;
  } else {
    src =
      src.slice(0, idx) +
      `
// Auto-injected by afrheritage repair v2
nextConfig.turbopack = { root: __dirname };

` +
      src.slice(idx);
  }
} else {
  // No nextConfig at all: define a minimal one
  src += `

/** Auto-injected by afrheritage repair v2 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
`;
}

fs.writeFileSync(configPath, src, 'utf8');
console.log('✔ turbopack.root configured in next.config.mjs');
NODE

  echo
  echo "[8b] Installing deps and building frontend with pnpm..."

  pnpm install --silent || echo "⚠ pnpm install failed"
  pnpm run build || echo "⚠ pnpm build failed (see above)"

  cd "$ROOT"
else
  echo "⚠ Frontend dir or next.config.mjs missing; skipping Next.js config fix"
fi

###############################################
# 9. Stage all changes
###############################################
echo
echo "[9] Staging all changes..."

git add -A || true

echo "✔ All modifications staged (review with 'git diff --cached')"

###############################################
# 10. Summary
###############################################
echo
echo "===================================================="
echo " FULL-STACK AUTO-REPAIR v2 COMPLETE (pnpm) "
echo "===================================================="
echo "• Git hygiene repaired (.gitignore, venv/pycache/node_modules cleaned)"
echo "• Python future imports normalized and syntax checked"
echo "• Key Python deps upgraded (pip, urllib3, starlette, python-multipart, python-jose, cryptography)"
echo "• Linting / typing / security tools invoked (ruff, flake8, mypy, bandit, safety/pip-audit)"
echo "• Multi-tenant heuristic report: $TENANT_REPORT (if generated)"
echo "• TypeScript useState patterns auto-fixed"
echo "• Next.js/Turbopack config normalized with pnpm as canonical"
echo "• All changes staged: run 'git diff --cached' then commit"
echo "===================================================="

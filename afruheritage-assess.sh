#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== Afruheritage Unified Pre-UAT Assessment ==="
echo "Root: $ROOT_DIR"
echo

# -----------------------------
# Helpers
# -----------------------------
have() { command -v "$1" >/dev/null 2>&1; }

section() {
  echo
  echo "--------------------------------------------------"
  echo ">> $1"
  echo "--------------------------------------------------"
}

substep() {
  echo
  echo "▶ $1"
}

fail() {
  echo "❌ $1"
}

ok() {
  echo "✅ $1"
}

warn() {
  echo "⚠ $1"
}

# -----------------------------
# 1. Git status & hygiene
# -----------------------------
section "Git status & hygiene"

echo "Git branch & remote:"
git status -sb || warn "Git status failed (not a git repo?)"

echo
echo "Tracked changes:"
git status --short || true

echo
echo "Checking for venv and __pycache__ in Git..."
if git ls-files | grep -E '(^|/)venv/|__pycache__/' >/dev/null 2>&1; then
  fail "venv/ or __pycache__/ are tracked in Git. Clean & .gitignore them before UAT."
else
  ok "No venv/ or __pycache__/ tracked in Git."
fi

echo
echo "Untracked files (top-level signal only):"
git status --short | sed -n 's/^?? //p' | head -50 || true

# -----------------------------
# 2. Backend: Python static analysis & security
# -----------------------------
section "Backend: Python static analysis & security"

BACKEND_DIR="$ROOT_DIR/afruheritage-platform"
if [ ! -d "$BACKEND_DIR" ]; then
  warn "Backend directory '$BACKEND_DIR' not found. Adjust BACKEND_DIR in script."
else
  cd "$BACKEND_DIR"

  substep "Syntax check (compileall)"
  if python -m compileall . >/dev/null 2>&1; then
    ok "Syntax check passed."
  else
    fail "Syntax check FAILED. Some Python files do not compile."
  fi

  substep "Ruff linting (if available)"
  if have ruff; then
    if ruff check .; then
      ok "Ruff linting passed."
    else
      fail "Ruff linting reported issues."
    fi
  else
    warn "ruff not installed; skipping Ruff linting."
  fi

  substep "Flake8 linting (if available)"
  if have flake8; then
    if flake8 .; then
      ok "Flake8 linting passed."
    else
      fail "Flake8 reported issues."
    fi
  else
    warn "flake8 not installed; skipping Flake8."
  fi

  substep "Mypy type checking (if available)"
  if have mypy; then
    if mypy .; then
      ok "Mypy type checking passed."
    else
      fail "Mypy reported type issues."
    fi
  else
    warn "mypy not installed; skipping type checking."
  fi

  substep "Bandit security scan (if available)"
  if have bandit; then
    if bandit -r .; then
      ok "Bandit security scan passed."
    else
      fail "Bandit reported security issues."
    fi
  else
    warn "bandit not installed; skipping security scan."
  fi

  substep "Dependency vulnerability scan (safety or pip-audit)"
  if have safety; then
    if safety check; then
      ok "safety found no known vulnerable dependencies."
    else
      fail "safety reported vulnerable dependencies."
    fi
  elif have pip-audit; then
    if pip-audit; then
      ok "pip-audit found no known vulnerable dependencies."
    else
      fail "pip-audit reported vulnerable dependencies."
    fi
  else
    warn "Neither safety nor pip-audit installed; skipping dependency vulnerability scan."
  fi

  cd "$ROOT_DIR"
fi

# -----------------------------
# 3. Backend: Tests
# -----------------------------
section "Backend: Tests"

cd "$BACKEND_DIR" 2>/dev/null || true

if [ -d "tests" ] || ls | grep -qE '^test_.*\.py$'; then
  if have pytest; then
    substep "Running pytest"
    if pytest; then
      ok "Backend tests passed."
    else
      fail "Backend tests FAILED."
    fi
  else
    warn "pytest not installed; cannot run backend tests."
  fi
else
  warn "No backend tests detected (no tests/ directory or test_*.py files)."
fi

cd "$ROOT_DIR"

# -----------------------------
# 4. Backend: Multi-tenant & security heuristics
# -----------------------------
section "Backend: Multi-tenant & security heuristics"

cd "$BACKEND_DIR" 2>/dev/null || true

if have rg; then
  substep "Checking for endpoints missing tenant_id in path (heuristic)"
  if rg -n "APIRouter|@app\.get|@app\.post|@router\.get|@router\.post" app/api/routes \
      | rg -v "tenant_id" >/tmp/afruheritage_missing_tenant_endpoints.txt || true; then
    if [ -s /tmp/afruheritage_missing_tenant_endpoints.txt ]; then
      fail "Some endpoints may be missing tenant_id in path or logic (see /tmp/afruheritage_missing_tenant_endpoints.txt)."
      sed -n '1,20p' /tmp/afruheritage_missing_tenant_endpoints.txt
    else
      ok "Heuristic: all scanned endpoints reference tenant_id somewhere."
    fi
  fi

  substep "Checking for hardcoded secrets / keys"
  if rg -n "SECRET_KEY|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY" . >/tmp/afruheritage_secrets.txt || true; then
    if [ -s /tmp/afruheritage_secrets.txt ]; then
      warn "Potential hardcoded secrets found (see /tmp/afruheritage_secrets.txt)."
      sed -n '1,20p' /tmp/afruheritage_secrets.txt
    else
      ok "No obvious hardcoded secrets detected by heuristic."
    fi
  fi

  substep "Checking for raw SQL usage (potential SQL injection risk)"
  if rg -n "SELECT |INSERT |UPDATE |DELETE |FROM " . >/tmp/afruheritage_raw_sql.txt || true; then
    if [ -s /tmp/afruheritage_raw_sql.txt ]; then
      warn "Raw SQL usage detected (see /tmp/afruheritage_raw_sql.txt). Review for SQL injection risks."
      sed -n '1,20p' /tmp/afruheritage_raw_sql.txt
    else
      ok "No obvious raw SQL usage detected."
    fi
  fi
else
  warn "rg (ripgrep) not installed; skipping multi-tenant & security heuristics."
fi

cd "$ROOT_DIR"

# -----------------------------
# 5. Frontend: TypeScript / Next.js checks
# -----------------------------
section "Frontend: TypeScript / Next.js checks"

# Try to detect frontend root
FRONTEND_DIR=""
if [ -d "$ROOT_DIR/afruheritage-platform/frontend" ]; then
  FRONTEND_DIR="$ROOT_DIR/afruheritage-platform/frontend"
elif [ -f "$ROOT_DIR/package.json" ]; then
  FRONTEND_DIR="$ROOT_DIR"
elif [ -f "$ROOT_DIR/afruheritage-platform/frontend/package.json" ]; then
  FRONTEND_DIR="$ROOT_DIR/afruheritage-platform/frontend"
fi

if [ -z "$FRONTEND_DIR" ]; then
  warn "Frontend directory not found (no package.json in expected locations); skipping frontend checks."
else
  echo "Frontend detected at: $FRONTEND_DIR"
  cd "$FRONTEND_DIR"

  if have pnpm; then
    PKG_MGR="pnpm"
  elif have yarn; then
    PKG_MGR="yarn"
  elif have npm; then
    PKG_MGR="npm"
  else
    PKG_MGR=""
  fi

  if [ -z "$PKG_MGR" ]; then
    warn "No npm/pnpm/yarn found; skipping frontend install/build checks."
  else
    substep "Installing frontend dependencies (if needed)"
    if [ "$PKG_MGR" = "pnpm" ]; then
      pnpm install --silent || warn "pnpm install failed."
    elif [ "$PKG_MGR" = "yarn" ]; then
      yarn install --silent || warn "yarn install failed."
    else
      npm install --silent || warn "npm install failed."
    fi

    substep "TypeScript check (if script configured)"
    if jq -e '.scripts["tsc"]' package.json >/dev/null 2>&1; then
      if [ "$PKG_MGR" = "pnpm" ]; then
        pnpm run tsc || fail "TypeScript check FAILED."
      elif [ "$PKG_MGR" = "yarn" ]; then
        yarn tsc || fail "TypeScript check FAILED."
      else
        npm run tsc || fail "TypeScript check FAILED."
      fi
    else
      warn "No 'tsc' script in package.json; skipping TS check."
    fi

    substep "Next.js build (if script configured)"
    if jq -e '.scripts["build"]' package.json >/dev/null 2>&1; then
      if [ "$PKG_MGR" = "pnpm" ]; then
        pnpm run build || fail "Frontend build FAILED."
      elif [ "$PKG_MGR" = "yarn" ]; then
        yarn build || fail "Frontend build FAILED."
      else
        npm run build || fail "Frontend build FAILED."
      fi
    else
      warn "No 'build' script in package.json; skipping frontend build."
    fi
  fi

  cd "$ROOT_DIR"
fi

# -----------------------------
# 6. Project-wide: secrets & config smells
# -----------------------------
section "Project-wide: secrets & config smells"

cd "$ROOT_DIR"

if have rg; then
  substep "Scanning for secrets in repo root"
  if rg -n "SECRET_KEY|API_KEY|TOKEN|PASSWORD|PRIVATE_KEY" . \
      --glob '!.git' --glob '!venv' --glob '!node_modules' >/tmp/afruheritage_repo_secrets.txt || true; then
    if [ -s /tmp/afruheritage_repo_secrets.txt ]; then
      warn "Potential secrets found in repo (see /tmp/afruheritage_repo_secrets.txt)."
      sed -n '1,20p' /tmp/afruheritage_repo_secrets.txt
    else
      ok "No obvious secrets detected in repo by heuristic."
    fi
  fi
else
  warn "rg not installed; skipping repo-wide secrets scan."
fi

# -----------------------------
# 7. Project-wide: TODOs & FIXMEs
# -----------------------------
section "Project-wide: TODOs & FIXMEs"

if have rg; then
  if rg -n "TODO|FIXME" . --glob '!.git' --glob '!venv' --glob '!node_modules' >/tmp/afruheritage_todos.txt || true; then
    if [ -s /tmp/afruheritage_todos.txt ]; then
      warn "TODOs/FIXMEs present (see /tmp/afruheritage_todos.txt)."
      sed -n '1,20p' /tmp/afruheritage_todos.txt
    else
      ok "No TODO/FIXME markers detected."
    fi
  fi
else
  warn "rg not installed; skipping TODO/FIXME scan."
fi

cd "$ROOT_DIR"

# -----------------------------
# 8. Summary
# -----------------------------
section "Summary"

echo "Review FAILED and WARNING items above as UAT blockers or risks."
ok "Unified pre-UAT assessment script completed."

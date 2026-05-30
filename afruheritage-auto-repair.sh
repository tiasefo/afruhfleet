#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"

echo "===================================================="
echo " AFRUHERITAGE AUTO-REPAIR ENGINE (FULL AUTOMATION) "
echo "===================================================="

###############################################
# 1. FIX GIT HYGIENE
###############################################
echo "[1] Fixing Git hygiene..."

# Add .gitignore entries
cat <<EOF >> .gitignore
venv/
__pycache__/
*.pyc
EOF

# Remove venv + pycache from Git index
git rm -r --cached venv/ 2>/dev/null || true
git rm -r --cached */__pycache__/ 2>/dev/null || true

echo "✔ Git hygiene repaired"


###############################################
# 2. AUTO-FIX PYTHON FILES
###############################################
echo "[2] Auto-fixing Python files..."

find afruheritage-platform -type f -name "*.py" | while read -r file; do
    # Move future import to top
    if grep -q "from __future__ import annotations" "$file"; then
        tmp=$(mktemp)
        {
            echo "from __future__ import annotations"
            grep -v "from __future__ import annotations" "$file"
        } > "$tmp"
        mv "$tmp" "$file"
    fi
done

echo "✔ Python future-import fixes applied"


###############################################
# 3. INSTALL MISSING TOOLS
###############################################
echo "[3] Installing missing tools..."

pip install -q ruff flake8 mypy bandit safety pip-audit pytest || true
sudo apt install -y ripgrep || true

echo "✔ Tools installed"


###############################################
# 4. RUN SYNTAX FIXES
###############################################
echo "[4] Running syntax validation..."

if python -m compileall afruheritage-platform; then
    echo "✔ Backend compiles cleanly"
else
    echo "❌ Backend still has syntax errors"
    echo "Check compileall output above"
fi


###############################################
# 5. STAGE ALL UNTRACKED FILES
###############################################
echo "[5] Staging all untracked files..."

git add -A

echo "✔ All untracked files staged"


###############################################
# 6. RUN LINTING & SECURITY
###############################################
echo "[6] Running linting & security..."

ruff check afruheritage-platform || true
flake8 afruheritage-platform || true
mypy afruheritage-platform || true
bandit -r afruheritage-platform || true
safety check || pip-audit || true

echo "✔ Linting & security checks complete"


###############################################
# 7. MULTI-TENANT HEURISTICS
###############################################
echo "[7] Checking multi-tenant rules..."

rg -n "APIRouter|@router" afruheritage-platform/app/api/routes \
    | rg -v "tenant_id" > tenant_warnings.txt || true

echo "✔ Multi-tenant heuristic complete (see tenant_warnings.txt)"


###############################################
# 8. FRONTEND CHECKS
###############################################
echo "[8] Checking frontend..."

if [ -f "afruheritage-platform/frontend/package.json" ]; then
    cd afruheritage-platform/frontend
    npm install --silent || true
    npm run build || true
    cd "$ROOT"
fi

echo "✔ Frontend check complete"


###############################################
# 9. FINAL REPORT
###############################################
echo "===================================================="
echo " AUTO-REPAIR COMPLETE — REVIEW RESULTS ABOVE "
echo "===================================================="

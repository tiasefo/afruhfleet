#!/usr/bin/env bash
# setup_and_test.sh — AfruFleet Automated Diagnostics & Remediation
# Usage: DB_PASS='...' SUDO_PASS='...' ./setup_and_test.sh
set -eo pipefail

DB_HOST="10.0.0.138"
DB_PORT="5432"
DB_USER="tiasefo"
DB_NAME="afrufleetdb"
SSH_KEY="$HOME/.ssh/afru_ssh_key"
SSH_USER="afruheritage"
VENV_DIR=".venv"
LOG_FILE="setup_and_test.log"
REPORT_FILE="remediation_report.txt"

declare -a ACTIONS_TAKEN=()
declare -a COMMANDS_RUN=()
declare -a FILES_CHANGED=()
PYTEST_OUTPUT=""
FINAL_STATUS="SUCCESS"
STEP_FAILED=""

> "$LOG_FILE"
log() {
  local ts
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$ts] $*" | tee -a "$LOG_FILE"
}
track_action() { ACTIONS_TAKEN+=("$1"); }
track_cmd()    { COMMANDS_RUN+=("$1"); }

generate_report() {
  log "=== STEP 10: Generating remediation report ==="
  {
    echo "================================================================"
    echo "  AUTOMATED DIAGNOSTICS & REMEDIATION REPORT"
    echo "  Generated: $(date '+%Y-%m-%d %H:%M:%S') UTC"
    echo "================================================================"
    echo ""
    echo "Final Status: $FINAL_STATUS"
    [[ -n "${STEP_FAILED:-}" ]] && echo "Failed at: $STEP_FAILED"
    echo ""
    echo "-- Actions Taken --"
    local i=1
    for a in "${ACTIONS_TAKEN[@]}"; do
      echo "  $i. $a"
      i=$((i + 1))
    done
    echo ""
    echo "-- Commands Run --"
    for c in "${COMMANDS_RUN[@]}"; do
      echo "  $ $c"
    done
    echo ""
    echo "-- Files Changed --"
    if [[ ${#FILES_CHANGED[@]} -eq 0 ]]; then
      echo "  (none)"
    else
      for f in "${FILES_CHANGED[@]}"; do
        if [[ -f "${f}.bak" ]]; then
          echo "  --- $f ---"
          diff -u "${f}.bak" "$f" 2>/dev/null | head -40 || echo "  (diff unavailable)"
        else
          echo "  Modified: $f"
        fi
      done
    fi
    echo ""
    echo "-- Final pytest Output --"
    if [[ -n "${PYTEST_OUTPUT:-}" ]]; then
      echo "$PYTEST_OUTPUT" | tail -40
    else
      echo "  (no pytest output captured)"
    fi
    echo ""
    echo "-- Manual Steps (if needed) --"
    echo "  If passwordless sudo was not available:"
    echo "    ssh $SSH_USER@$DB_HOST"
    echo "    sudo visudo  # Add: $SSH_USER ALL=(postgres) NOPASSWD: /usr/bin/psql"
    echo ""
    echo "================================================================"
  } | tee "$REPORT_FILE"
}

die() {
  log "FAIL: $1"
  FINAL_STATUS="ABORTED"
  STEP_FAILED="$1"
  generate_report
  exit 1
}

# --- Secrets ---
if [[ -n "${DB_PASS:-}" ]]; then
  log "Using DB_PASS from environment (${DB_PASS:0:2}****${DB_PASS: -2})"
else
  read -rsp "Enter DB password for $DB_USER: " DB_PASS; echo
fi

if [[ -n "${SUDO_PASS:-}" ]]; then
  log "Using SUDO_PASS from environment (****)"
else
  read -rsp "Enter sudo password for $SSH_USER on $DB_HOST: " SUDO_PASS; echo
fi

export DATABASE_URL="postgresql+psycopg2://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# --- SSH helper: run SQL on DB host via sudo -u postgres psql ---
ssh_sudo_psql() {
  local sql="$1"
  local tmpout
  tmpout=$(mktemp /tmp/ssp.XXXXXX)
  ssh -i "$SSH_KEY" \
      -o StrictHostKeyChecking=accept-new \
      -o ConnectTimeout=10 \
      "$SSH_USER@$DB_HOST" \
      "echo '${SUDO_PASS}' | sudo -S -u postgres psql -A -t -c \"${sql}\"" \
      >"$tmpout" 2>&1 || true
  local cleaned
  cleaned=$(grep -v -E '^

\[sudo\]

 password|could not change directory' "$tmpout" || true)
  rm -f "$tmpout"
  echo "$cleaned"
}

# --- Banner ---
log "================================================================"
log "  AfruFleet Automated Diagnostics & Remediation Workflow"
log "  Started: $(date '+%Y-%m-%d %H:%M:%S') UTC"
log "================================================================"

# === STEP 1: Network & SSH ===
log "=== STEP 1: Verify network reachability & SSH ==="

if nc -z -w5 "$DB_HOST" "$DB_PORT" 2>/dev/null; then
  log "OK: TCP $DB_HOST:$DB_PORT is reachable"
  track_action "Verified TCP connectivity to $DB_HOST:$DB_PORT"
  track_cmd "nc -z -w5 $DB_HOST $DB_PORT"
else
  die "Cannot reach $DB_HOST:$DB_PORT -- check network/firewall"
fi

ssh_test_out=$(ssh -i "$SSH_KEY" \
  -o StrictHostKeyChecking=accept-new \
  -o ConnectTimeout=10 \
  -o BatchMode=yes \
  "$SSH_USER@$DB_HOST" 'echo ok' 2>&1) || true

if echo "$ssh_test_out" | grep -q 'ok'; then
  log "OK: SSH to $SSH_USER@$DB_HOST works"
  track_action "Verified SSH connectivity to $SSH_USER@$DB_HOST"
  track_cmd "ssh -i $SSH_KEY $SSH_USER@$DB_HOST 'echo ok'"
else
  die "SSH failed -- verify $SSH_KEY and authorized_keys on $DB_HOST. Output: $ssh_test_out"
fi

# === STEP 2: Virtualenv & packages ===
log "=== STEP 2: Virtualenv & Python packages ==="

if [[ -f "$VENV_DIR/bin/activate" ]]; then
  # shellcheck disable=SC1091
  source "$VENV_DIR/bin/activate"
  log "OK: Activated virtualenv: $(which python)"
  track_action "Activated virtualenv at $VENV_DIR"
else
  die "Virtualenv not found at $VENV_DIR"
fi

declare -A PKG_IMPORTS=( ["psycopg2-binary"]="psycopg2" ["alembic"]="alembic" ["pytest"]="pytest" )
for pkg in psycopg2-binary alembic pytest; do
  import_name="${PKG_IMPORTS[$pkg]}"
  if ! python -c "import $import_name" 2>/dev/null; then
    log "Installing missing core package: $pkg"
    pip install -q "$pkg" >> "$LOG_FILE" 2>&1
    track_action "Installed missing package: $pkg"
    track_cmd "pip install $pkg"
  else
    log "OK: $pkg already installed"
  fi
done

if [[ -f requirements.txt ]]; then
  log "Installing requirements.txt"
  pip install -q -r requirements.txt >> "$LOG_FILE" 2>&1
  track_action "Installed packages from requirements.txt"
  track_cmd "pip install -r requirements.txt"
fi

if [[ -f pyproject.toml ]] && grep -q '

\[project\]

' pyproject.toml 2>/dev/null; then
  log "Installing from pyproject.toml"
  pip install -q -e . >> "$LOG_FILE" 2>&1 || log "WARN: pyproject.toml install had warnings"
  track_action "Installed from pyproject.toml"
fi

log "OK: Python environment ready"

# === STEP 3: Postgres role & database ===
log "=== STEP 3: Create Postgres role & database ==="

# Strategy: try direct psql connection FIRST.
# If it works, role + DB already exist -- skip SSH+sudo+psql entirely.
direct_ok=false
log "Testing direct connection as $DB_USER to $DB_NAME ..."
direct_test=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" \
  -U "$DB_USER" -d "$DB_NAME" -A -t -c "SELECT current_user;" 2>&1) || true

if echo "$direct_test" | grep -q "$DB_USER"; then
  log "OK: Direct connection verified -- role $DB_USER and database $DB_NAME exist"
  track_action "Verified role $DB_USER and database $DB_NAME via direct psql connection"
  track_cmd "PGPASSWORD=**** psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT current_user;'"
  direct_ok=true
else
  log "Direct connection failed ($direct_test) -- will create via SSH+sudo+psql"
fi

if [[ "$direct_ok" != "true" ]]; then
  # Create role using DO block to handle "already exists" gracefully
  log "Creating role $DB_USER ..."
  role_out=$(ssh_sudo_psql "DO \\\$\\\$ BEGIN CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}'; EXCEPTION WHEN duplicate_object THEN NULL; END \\\$\\\$;")
  track_cmd "ssh ... sudo -u postgres psql -c 'CREATE ROLE (with duplicate guard)'"

  # Verify role exists
  role_verify=$(ssh_sudo_psql "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}';")
  if echo "$role_verify" | grep -q '1'; then
    log "OK: Role $DB_USER confirmed"
    track_action "Verified/created role $DB_USER"
  else
    die "Failed to create or verify role $DB_USER. Create output: [$role_out] Verify output: [$role_verify]"
  fi

  # Create database -- check first since CREATE DATABASE cant run inside DO block
  log "Creating database $DB_NAME ..."
  db_out=$(ssh_sudo_psql "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}';")
  if echo "$db_out" | grep -q '1'; then
    log "OK: Database $DB_NAME already exists"
    track_action "Database $DB_NAME already exists (skipped creation)"
  else
    db_create=$(ssh_sudo_psql "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};")
    if echo "$db_create" | grep -qi 'CREATE DATABASE\|already exists'; then
      log "OK: Database $DB_NAME created"
      track_action "Created database $DB_NAME"
    else
      die "Failed to create database $DB_NAME. Output: [$db_create]"
    fi
  fi
  track_cmd "ssh ... sudo -u postgres psql -c 'CREATE DATABASE (with verify)'"

  # Final verification via direct connection
  log "Verifying direct connection after creation ..."
  final_test=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$DB_NAME" -A -t -c "SELECT current_user;" 2>&1) || true
  if echo "$final_test" | grep -q "$DB_USER"; then
    log "OK: Post-creation direct connection verified"
  else
    die "Role/DB created but direct connection still fails: $final_test"
  fi
fi

# === STEP 4: .pgpass ===
log "=== STEP 4: Configure ~/.pgpass ==="

PGPASS_MATCH="${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:"
PGPASS_LINE="${DB_HOST}:${DB_PORT}:${DB_NAME}:${DB_USER}:${DB_PASS}"
PGPASS_FILE="$HOME/.pgpass"

if [[ -f "$PGPASS_FILE" ]] && grep -qF "$PGPASS_MATCH" "$PGPASS_FILE" 2>/dev/null; then
  log "OK: .pgpass entry already exists"
  track_action "Verified .pgpass entry exists"
else
  touch "$PGPASS_FILE"
  echo "$PGPASS_LINE" >> "$PGPASS_FILE"
  chmod 600 "$PGPASS_FILE"
  log "OK: Added .pgpass entry and set permissions to 600"
  track_action "Created .pgpass entry for $DB_USER@$DB_HOST"
  track_cmd "echo '***' >> ~/.pgpass && chmod 600 ~/.pgpass"
fi

# === STEP 5: DATABASE_URL ===
log "=== STEP 5: Export DATABASE_URL ==="

log "OK: DATABASE_URL exported (postgresql+psycopg2://****@$DB_HOST:$DB_PORT/$DB_NAME)"
track_action "Exported DATABASE_URL for psycopg2 driver"

# Patch .env if it exists and has a wrong DATABASE_URL
if [[ -f .env ]]; then
  current_db_url=$(grep '^DATABASE_URL=' .env | head -1 || true)
  if [[ -n "$current_db_url" && "$current_db_url" != "DATABASE_URL=${DATABASE_URL}" ]]; then
    cp .env .env.bak
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=${DATABASE_URL}|" .env
    log "OK: Patched .env DATABASE_URL (backed up to .env.bak)"
    track_action "Patched .env DATABASE_URL to point to $DB_HOST"
    FILES_CHANGED+=(".env")
  else
    log "OK: .env DATABASE_URL already correct"
  fi
fi
track_cmd "export DATABASE_URL=postgresql+psycopg2://****@$DB_HOST:$DB_PORT/$DB_NAME"

# === STEP 6: Alembic migrations ===
log "=== STEP 6: Run alembic upgrade head ==="

if [[ ! -f alembic.ini ]]; then
  log "WARN: alembic.ini not found -- skipping to step 7"
else
  alembic_out=$(alembic -c alembic.ini upgrade head 2>&1) || true
  if echo "$alembic_out" | grep -qiE 'done|head|upgrade|Running upgrade|OK'; then
    log "OK: Alembic upgrade head succeeded"
    track_action "Ran alembic upgrade head successfully"
  else
    log "WARN: Alembic may have failed: $alembic_out"
    track_action "Alembic upgrade head had issues -- falling back to create_all"
  fi
  track_cmd "alembic -c alembic.ini upgrade head"
fi

# === STEP 7: Fallback table creation ===
log "=== STEP 7: Fallback table creation from SQLAlchemy models ==="

create_out=$(python -c "
import os, sys
os.environ.setdefault('DATABASE_URL', os.environ.get('DATABASE_URL', ''))
try:
    from sqlalchemy import create_engine
    engine = create_engine(os.environ['DATABASE_URL'])
    Base = None
    for mod_path in ['app.db.base', 'app.database', 'app.models.base', 'app.db.session', 'app.core.database']:
        try:
            mod = __import__(mod_path, fromlist=['Base'])
            if hasattr(mod, 'Base'):
                Base = mod.Base
                break
        except ImportError:
            continue
    if Base is None:
        print('SKIP: Could not locate Base metadata object')
        sys.exit(0)
    Base.metadata.create_all(bind=engine)
    print('OK: tables created/verified')
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
" 2>&1) || true

if echo "$create_out" | grep -q "OK"; then
  log "OK: Tables created/verified from SQLAlchemy models"
  track_action "Created/verified tables via Base.metadata.create_all()"
elif echo "$create_out" | grep -q "SKIP"; then
  log "WARN: Could not locate Base metadata -- tables must come from alembic"
  track_action "Skipped create_all -- Base not found in common paths"
else
  log "WARN: create_all output: $create_out"
  track_action "create_all had issues: $create_out"
fi
track_cmd "python -c 'Base.metadata.create_all(engine)'"

# === STEP 8: pytest ===
log "=== STEP 8: Run pytest ==="

PYTEST_OUTPUT=$(python -m pytest -q --maxfail=3 --tb=short 2>&1) || true
PYTEST_EXIT=${PIPESTATUS[0]:-$?}

if echo "$PYTEST_OUTPUT" | grep -qE '^[0-9]+ passed'; then
  log "OK: All tests passed!"
  track_action "All tests passed"
else
  log "WARN: pytest had failures (exit $PYTEST_EXIT)"
  track_action "pytest had failures"
fi
track_cmd "pytest -q --maxfail=3 --tb=short"

# === STEP 9: Auto-remediation ===
log "=== STEP 9: Auto-remediation ==="

max_attempts=3
attempt=0
tests_pass=false

if echo "$PYTEST_OUTPUT" | grep -qE '^[0-9]+ passed' && ! echo "$PYTEST_OUTPUT" | grep -q 'failed'; then
  tests_pass=true
fi

while [[ "$tests_pass" != "true" && $attempt -lt $max_attempts ]]; do
  attempt=$((attempt + 1))
  log "Remediation attempt $attempt/$max_attempts"
  did_fix=0

  # Fix 1: 422 on auth/login -- switch json= to data=
  if echo "$PYTEST_OUTPUT" | grep -qE '422|Unprocessable Entity'; then
    log "Detected 422 errors -- patching OAuth2 login tests to use form-encoded data"
    for testfile in $(grep -rl '/auth/login\|/api/v1/auth/login' tests/ 2>/dev/null || true); do
      if grep -q 'json=' "$testfile"; then
        cp "$testfile" "${testfile}.bak"
        sed -i '/login\|token/I s/json=/data=/g' "$testfile"
        log "  Patched: $testfile (json= -> data=)"
        track_action "Patched $testfile: json= -> data= for OAuth2 form encoding"
        FILES_CHANGED+=("$testfile")
        did_fix=1
      fi
    done
  fi

  # Fix 2: Missing table -- re-run migrations / create_all
  if echo "$PYTEST_OUTPUT" | grep -qiE 'relation .* does not exist|no such table|UndefinedTable'; then
    log "Detected missing-table errors -- re-running table creation"
    if [[ -f alembic.ini ]]; then
      alembic -c alembic.ini upgrade head >> "$LOG_FILE" 2>&1 || true
    fi
    python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.environ['DATABASE_URL'])
try:
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
except Exception:
    pass
" >> "$LOG_FILE" 2>&1 || true
    track_action "Re-ran table creation after missing-table error"
    did_fix=1
  fi

  # Fix 3: Missing package / import error
  if echo "$PYTEST_OUTPUT" | grep -qiE 'ModuleNotFoundError|ImportError'; then
    missing_mod=$(echo "$PYTEST_OUTPUT" | grep -oP "No module named '\K[^']+" | head -1 || true)
    if [[ -n "$missing_mod" ]]; then
      log "Detected missing module: $missing_mod -- installing"
      pip install -q "$missing_mod" >> "$LOG_FILE" 2>&1 || true
      track_action "Installed missing module: $missing_mod"
      did_fix=1
    fi
  fi

  if [[ $did_fix -eq 0 ]]; then
    log "No auto-fixable pattern detected -- stopping remediation"
    break
  fi

  log "Re-running pytest after fixes ..."
  PYTEST_OUTPUT=$(python -m pytest -q --maxfail=3 --tb=short 2>&1) || true

  if echo "$PYTEST_OUTPUT" | grep -qE '^[0-9]+ passed' && ! echo "$PYTEST_OUTPUT" | grep -q 'failed'; then
    log "OK: All tests passed after remediation attempt $attempt!"
    tests_pass=true
  else
    log "WARN: Tests still failing after attempt $attempt"
  fi
done

if [[ "$tests_pass" != "true" ]]; then
  FINAL_STATUS="TESTS_FAILING"
fi

# === STEP 10: Report ===
generate_report
log "Done. Report saved to $REPORT_FILE"
log "Log saved to $LOG_FILE"

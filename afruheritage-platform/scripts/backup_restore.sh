#!/usr/bin/env bash
#
# Afruheritage Backup & Restore Script
# Performs pg_dump backup and pg_restore recovery rehearsal.
#
# Usage:
#   ./scripts/backup_restore.sh backup
#   ./scripts/backup_restore.sh restore <backup_file>
#   ./scripts/backup_restore.sh list
#
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/tmp/afruheritage-backups}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-afruheritage}"
DB_USER="${DB_USER:-afruheritage}"

mkdir -p "$BACKUP_DIR"

cmd_backup() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/afruheritage_${timestamp}.dump"

    echo "=== Starting backup ==="
    echo "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    echo "Output:   ${backup_file}"

    pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --no-owner \
        --no-privileges \
        --file="$backup_file"

    local size
    size=$(du -h "$backup_file" | cut -f1)
    echo "=== Backup complete ==="
    echo "File: ${backup_file}"
    echo "Size: ${size}"
    echo ""
    echo "Backup contains:"
    pg_restore --list "$backup_file" | grep "DATABASE" | head -5
    echo "..."

    # Record backup metadata
    echo "{\"timestamp\":\"${timestamp}\",\"file\":\"${backup_file}\",\"size\":\"${size}\"}" >> "${BACKUP_DIR}/backup_log.jsonl"
}

cmd_restore() {
    local backup_file="${1:-}"
    if [[ -z "$backup_file" ]]; then
        echo "ERROR: Must specify backup file to restore"
        echo "Usage: $0 restore <backup_file>"
        exit 1
    fi

    if [[ ! -f "$backup_file" ]]; then
        echo "ERROR: Backup file not found: ${backup_file}"
        exit 1
    fi

    echo "=== Starting restore rehearsal ==="
    echo "Source:  ${backup_file}"
    echo "Target:  ${DB_NAME}@${DB_HOST}:${DB_PORT}"
    echo ""
    echo "WARNING: This will DROP and recreate the database."
    echo "Press Ctrl+C within 5 seconds to abort..."
    sleep 5

    # Drop and recreate
    echo "Dropping existing database..."
    psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname=postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
    psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname=postgres -c "CREATE DATABASE ${DB_NAME};"

    # Restore
    echo "Restoring from backup..."
    pg_restore \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        "$backup_file"

    echo "=== Restore complete ==="
    echo ""

    # Verify critical data
    echo "=== Verifying critical data ==="

    local tenant_count
    tenant_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM tenants;")
    echo "Tenants: ${tenant_count}"

    local user_count
    user_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM users;")
    echo "Users: ${user_count}"

    local sub_count
    sub_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM billing_subscriptions;")
    echo "Subscriptions: ${sub_count}"

    local payment_count
    payment_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM billing_payments;")
    echo "Payments: ${payment_count}"

    local branding_count
    branding_count=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM tenant_branding;")
    echo "Tenant branding: ${branding_count}"

    local active_tenants
    active_tenants=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM tenants WHERE launch_status = 'active';")
    echo "Active tenants: ${active_tenants}"

    local fleetbase_orgs
    fleetbase_orgs=$(psql --host="$DB_HOST" --port="$DB_PORT" --username="$DB_USER" --dbname="$DB_NAME" -t -c "SELECT COUNT(*) FROM tenants WHERE fleetbase_org_id IS NOT NULL;")
    echo "Fleetbase org mappings: ${fleetbase_orgs}"

    echo ""
    echo "=== RPO/RTO Observations ==="
    echo "RPO: Backup captures all data up to backup start time"
    echo "RTO: Restore completed — measure time from drop to verification"
    echo ""
    echo "Next step: Run Golden Test to verify application functionality after restore."
}

cmd_list() {
    echo "Available backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"/afruheritage_*.dump 2>/dev/null || echo "No backups found."
}

case "${1:-}" in
    backup)  cmd_backup ;;
    restore) cmd_restore "${2:-}" ;;
    list)    cmd_list ;;
    *) echo "Usage: $0 {backup|restore <file>|list}"; exit 1 ;;
esac

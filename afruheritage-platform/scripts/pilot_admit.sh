#!/usr/bin/env bash
# Pilot admission tool — PO directive: admission recorded with who/when/why.
#
# Usage:
#   ./scripts/pilot_admit.sh --email user@example.com --by "ops-name" --reason "Pilot cohort 1" [--invite "First Last"]
#
# Effects:
#   1. SADD pilot:allowed_emails <email>   (immediate registration access)
#   2. Appends a JSON audit line to logs/pilot_admissions.log (durable host volume)
#   3. With --invite: sends a branded pilot invitation email via the API container
#
# Domain-wide admission is deliberately NOT offered here — per PO ruling it
# requires explicit Operations approval and must use SADD pilot:allowed_domains
# manually so the decision is a conscious action.
set -euo pipefail

EMAIL="" BY="" REASON="" INVITE_NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --email) EMAIL="$2"; shift 2;;
    --by) BY="$2"; shift 2;;
    --reason) REASON="$2"; shift 2;;
    --invite) INVITE_NAME="$2"; shift 2;;
    *) echo "unknown arg: $1" >&2; exit 2;;
  esac
done
[[ -n "$EMAIL" && -n "$BY" && -n "$REASON" ]] || {
  echo 'required: --email <addr> --by <admitter> --reason <why> [--invite "Name"]' >&2; exit 2; }

EMAIL=$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]')
cd "$(dirname "$0")/.."
RP=$(grep -E '^REDIS_PASSWORD=' .env | cut -d= -f2-)

docker exec afruheritage-redis redis-cli --no-auth-warning -a "$RP" \
  SADD pilot:allowed_emails "$EMAIL" >/dev/null

mkdir -p logs
printf '{"ts":"%s","action":"admit","email":"%s","by":"%s","reason":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$EMAIL" "$BY" "$REASON" \
  >> logs/pilot_admissions.log
echo "admitted: $EMAIL (by $BY — $REASON)"

if [[ -n "$INVITE_NAME" ]]; then
  EMAIL_ENV="$EMAIL" INVITE_NAME_ENV="$INVITE_NAME" docker exec -i -e EMAIL_ENV -e INVITE_NAME_ENV afruheritage-api python - <<'PYEOF'
import os
from app.services.notification_service import NotificationService
email, name = os.environ["EMAIL_ENV"], os.environ["INVITE_NAME_ENV"]
html = f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
  <h1 style="color:#1e293b;font-size:24px;margin-bottom:16px;">You're invited to the Afruheritage pilot</h1>
  <p style="color:#475569;font-size:16px;line-height:1.6;">Hi {name},</p>
  <p style="color:#475569;font-size:16px;line-height:1.6;">
    You've been approved to join the Afruheritage invitation-only pilot — a free
    early-access program for our freight-forwarding platform.
  </p>
  <div style="margin:32px 0;">
    <a href="https://afruheritage.com/register"
       style="background:#0ea5e9;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600;">
      Create Your Account
    </a>
  </div>
  <p style="color:#475569;font-size:14px;line-height:1.6;">
    Register with <strong>{email}</strong> — your email is already authorized.
    During the pilot you can create shipments, track deliveries, invite team
    members, and contact support — all free.
  </p>
  <p style="color:#64748b;font-size:13px;">
    Pilot feedback matters: if anything breaks or confuses you, use the in-app
    support or reply to this email.
  </p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0;" />
  <p style="color:#cbd5e1;font-size:12px;">Afruheritage — Freight Forwarding Platform</p>
</div>"""
ok = NotificationService().send_generic_email(
    email, "You're invited to the Afruheritage pilot", html,
    plain_body=f"Hi {name}, you're invited to the Afruheritage pilot. Register at https://afruheritage.com/register with {email}.")
print("invitation email:", "sent" if ok else "FAILED")
PYEOF
  printf '{"ts":"%s","action":"invite_sent","email":"%s","by":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$EMAIL" "$BY" >> logs/pilot_admissions.log
fi

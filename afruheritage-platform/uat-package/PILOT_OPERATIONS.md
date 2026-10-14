# Controlled Pilot — Operations Runbook

**Baseline:** `1639e8fd` + `07e798c7` + pilot-controls round.
**Classification:** Invitation-only free pilot — GO.

## Active pilot controls

| Control | Mechanism | Verified |
|---|---|---|
| Invitation-only registration | `PILOT_INVITE_ONLY=true` gates `/auth/register` and `/companies/register`; unlisted emails → 403 | yes — 403 unlisted, 200 after admit |
| Admit list | Redis sets `pilot:allowed_emails` / `pilot:allowed_domains` | yes |
| Allowlist persistence | AOF + `redis_data` named volume | **verified across `compose restart redis` AND `--force-recreate`** |
| Post-restart enforcement | Gate + allowlist re-verified after full `compose restart` of api/worker/beat | yes — still 403, allowlist intact |
| Sender disclosure | Email footer + dismissible in-app banner + register-page note | yes — decoded MIME confirmed |
| Live payments | No live keys; sandbox path only | standing |
| Flutterwave | Disabled at init/verify/webhook | standing |

## Admitting a pilot participant — `scripts/pilot_admit.sh`

```bash
./scripts/pilot_admit.sh \
  --email customer@example.com \
  --by "<your-name>" \
  --reason "<why this participant>" \
  --invite "Customer Firstname"     # optional: sends branded invite email
```

- SADDs the email (immediate effect, no restart)
- Appends a JSON audit line to `logs/pilot_admissions.log` —
  `{ts, action, email, by, reason}` — durable on the host-mounted
  `logs/` volume
- `--invite` sends the branded pilot invitation (register link + pilot
  explanation) through the real NotificationService — DKIM-signed,
  disclosure footer included (verified end-to-end)

**Who may admit:** Operations and the Product Owner only. Every
admission MUST go through this script so `who/when/why` is recorded —
do not run bare `SADD` for participants.

**Domain admission:** deliberately not in the script. Requires explicit
Operations approval; if approved, run
`SADD pilot:allowed_domains <domain>` manually and log it yourself in
`logs/pilot_admissions.log`. Default is always individual emails.

**Revoking:** `SREM pilot:allowed_emails <email>` + an audit line.

## Persistence & recovery

- Redis runs `--appendonly yes` on named volume `redis_data` —
  verified: entries survive `compose restart redis` and
  `up -d --force-recreate redis`.
- Worst case (volume loss): allowlist rebuild = re-run
  `pilot_admit.sh` per line of `logs/pilot_admissions.log` (the audit
  log IS the recovery source).
- Caveat: `maxmemory-policy allkeys-lru` could evict under extreme
  memory pressure — the audit log covers recovery.

## Support channel

Public ticket portal + in-app support create real tickets, notify the
submitter, and appear in Sentinel.

## Pilot defect log — real customer failures (distinct from certified tests)

| # | Date | Severity | Journey | Tenant | Reproduction | Status |
|---|---|---|---|---|---|---|
| — | — | — | — | — | _no customer failures yet — invitations not yet sent_ | — |

Severity: S1 blocker / S2 workflow-degraded / S3 cosmetic-confusion.

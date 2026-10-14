# Controlled Pilot — Operations Runbook

**Baseline:** `1639e8fd` + pilot controls. **Classification:** Invitation-only free pilot — GO.

## Active pilot controls

| Control | Mechanism | Verified |
|---|---|---|
| Invitation-only registration | `PILOT_INVITE_ONLY=true` gates `/auth/register` and `/companies/register`; unlisted emails → 403 with pilot message | yes — 403 unlisted, 200 after admit |
| Admit list (no restart) | Redis sets `pilot:allowed_emails` / `pilot:allowed_domains` | yes — SADD → 200 same request |
| Temporary-sender disclosure | Email footer line appended to every outbound message + dismissible in-app banner + register-page note | yes — decoded MIME confirmed |
| Live payments | Paystack live keys absent; only sandbox path certified | standing |
| Flutterwave | Disabled at init/verify/webhook (RC-1) | standing |
| Credential authority | PO-only; developer takes no rotation action | standing |

## Admitting a pilot participant

```bash
docker exec afruheritage-redis redis-cli -a "$REDIS_PASSWORD" \
  SADD pilot:allowed_emails customer@example.com
# or a whole domain:
docker exec afruheritage-redis redis-cli -a "$REDIS_PASSWORD" \
  SADD pilot:allowed_domains example.org
```

Admission takes effect immediately — no restart. Remove with `SREM`.
Staff/vendor invitations sent from inside a tenant bypass this gate by
design (they are already invitations).

## Disclosure shown to participants

- Every outbound email footer: "Pilot notice: Afruheritage emails are
  currently sent from advisory@emidentity.com."
- Registration page: invitation-only + sender note.
- Authenticated pages: dismissible banner naming the sender.

## Support channel for pilot participants

Public ticket portal (`/support/ticket/…` links in notification emails)
and in-app support both create real tickets that notify
`advisory@emidentity.com`-addressed mailboxes and appear in Sentinel.

## Pilot defect log — format

Real customer failures are recorded here, **distinct from certified
engineering tests**. New entries appended below.

| # | Date | Severity | Journey | Tenant | Reproduction | Status |
|---|---|---|---|---|---|---|
| — | — | — | — | — | _no customer failures recorded yet — pilot starting_ | — |

Severity: S1 blocker / S2 workflow-degraded / S3 cosmetic-confusion.

## Pilot journey coverage to observe

Registration, login, password recovery, shipment creation, tracking,
notifications, vendor workflows, support, subscription/billing state
(no charges — manual state only during pilot).

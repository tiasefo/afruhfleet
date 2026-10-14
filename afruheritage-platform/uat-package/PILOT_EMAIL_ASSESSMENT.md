# RC-2 — Pilot Email Exception Assessment

**Date:** 2026-10-14. **Deployed SHA:** `e00ce84c`+.

## Temporary sender identity

- **From:** `Afruheritage <advisory@emidentity.com>`
- **Envelope/Return-Path:** `advisory@emidentity.com`
- **Sending provider:** Zoho Mail (outbound via `sender5-of-o56.zoho.com`)
- **Sending domain:** `emidentity.com` — NOT `afruheritage.com`

## Authentication status (measured, not assumed)

| Layer | Status | Evidence |
|---|---|---|
| DNS SPF (`emidentity.com`) | `v=spf1 include:zohomail.com ~all` — covers Zoho | `dig TXT` |
| DNS DMARC (`emidentity.com`) | `v=DMARC1; p=none` — non-enforcing | `dig TXT _dmarc` |
| DKIM signing on messages | **NONE** — no `DKIM-Signature` header present on any delivered message | raw MIME capture |
| ARC (provider hop) | `spf=pass`, `dmarc=pass` on `emidentity.com` | raw MIME headers |
| Receiver-side verification (mail.tm/Haraka) | `spf:false, dkim:false` reported by receiving MTA | parsed delivery metadata |
| Transport | TLS 1.3 | headers |

**Net:** messages are *delivered* and the envelope domain is
SPF-covered at the sending provider, but nothing is DKIM-signed and the
receiving MTA does not confirm end-to-end authentication. The sender is
traceable to `emidentity.com` but is **not** authenticated to the
standard a branded sender would be.

## Delivery evidence — all four required journeys (real mailboxes)

| Journey | Result | Subject (captured) |
|---|---|---|
| Staff invitation | DELIVERED | "You have been invited to join UATCERT Meridian Freight 3 on Afruheritage" |
| Password reset | DELIVERED | "Afruheritage — Password Reset Request" |
| Shipment notification | DELIVERED | "UATCERT Meridian Freight 3 — Shipment Update: AFR-…" |
| Support notification | DELIVERED | "Afruheritage Platform Support — Support Ticket Created: #f74209a9" |

All four arrive as `Afruheritage <advisory@emidentity.com>`.

## Assessment for the pilot exception

Per the PO's criteria — "an operational email address that is
authenticated and reliably delivers" — the temporary sender is:

- ✅ Reliable: repeated real-mailbox delivery across all required
  journeys, TLS transport.
- ⚠️ Partially authenticated: SPF passes at the provider hop; **no DKIM
  signature exists on the wire**; DMARC is `p=none` (non-enforcing).
- ⚠️ Branded display name ("Afruheritage") but visibly foreign domain
  (`emidentity.com`) to any customer who inspects the sender.

**Honest ruling:** this sender meets *deliverability* but only partially
meets *authentication*. Whether SPF-only authentication + a foreign
domain is acceptable for an invitation-only pilot is a **PO decision** —
recommended options:

1. Accept for pilot only, with sender plainly disclosed to pilot
   participants.
2. Have Ops enable DKIM on `emidentity.com` in Zoho first (cheap,
   hours-long; gives both SPF+DKIM authentication on the temp domain).
3. Hold until full `afruheritage.com` authorization (G-04 proper).

Option 2 is the low-cost middle path that satisfies "authenticated"
without waiting for the full branded-domain rollout.

# RC-2 — Pilot Email Exception Assessment — AUTHENTICATED

**Date:** 2026-10-14 (verified post-DKIM). **Deployed SHA:** `549c8ea5`.

## Temporary sender identity

- **From:** `Afruheritage <advisory@emidentity.com>`
- **Envelope/Return-Path:** `advisory@emidentity.com`
- **Sending provider:** Zoho Mail (outbound via `sender5-of-o56.zoho.com`)
- **Sending domain:** `emidentity.com` — NOT `afruheritage.com`

## Authentication status — VERIFIED (raw MIME evidence)

| Layer | Status | Evidence |
|---|---|---|
| DNS SPF (`emidentity.com`) | `v=spf1 include:zohomail.com ~all` — covers Zoho | `dig TXT` |
| DNS DKIM (`zmail._domainkey`) | `v=DKIM1; k=rsa; p=…` published, selector verified in Zoho | `dig TXT` + Zoho verify |
| DKIM signature on wire | **PRESENT** — `DKIM-Signature: v=1; a=rsa-sha256; s=zmail; d=emidentity.com; i=advisory@emidentity.com` | raw MIME, all 4 journeys |
| ARC (provider hop) | `dkim=pass`, `spf=pass`, `dmarc=pass` on `emidentity.com` | raw MIME headers |
| DMARC | `p=none` (non-enforcing, legitimate monitoring policy) — **alignment passes** | `dig` + headers |
| DKIM↔From alignment | `d=emidentity.com` == `header.from=advisory@emidentity.com` — aligned | raw MIME |
| Transport | TLS 1.3 | headers |

**Net:** messages are now **authenticated end-to-end** — real RSA-SHA256
DKIM signatures on `emidentity.com` aligned with `From`, SPF covered at
the provider, DMARC alignment passes. The sender is traceable, signed,
and cryptographically verifiable.

## Delivery + authentication evidence — all four journeys (real mailboxes)

| Journey | Delivered | DKIM | Aligned | DMARC | Subject |
|---|---|---|---|---|---|
| Staff invitation | ✅ | `s=zmail d=emidentity.com` | ✅ | pass | "You have been invited to join UATCERT Meridian Freight 3 on Afruheritage" |
| Password reset | ✅ | `s=zmail d=emidentity.com` | ✅ | pass | "Afruheritage — Password Reset Request" |
| Shipment notification | ✅ | `s=zmail d=emidentity.com` | ✅ | pass | "UATCERT Meridian Freight 3 — Shipment Update: AFR-…" |
| Support notification | ✅ | `s=zmail d=emidentity.com` | ✅ | pass | "UATCERT Meridian Freight 3 — Support Ticket Created: #8f37e740" |

Raw MIME per journey: `prod-ui-cert/rc2-mime-{staff-invitation,
password-reset,shipment-notification,support-notification}.txt`.
Harness: `prod-ui-cert/rc2-email-evidence.js` (12/12 PASS — each journey
checked for delivery AND `dkim+align+dmarc`, not delivery alone).

## Assessment

Per the PO's criteria — "an operational email address that is
authenticated and reliably delivers" — the temporary sender now meets
**both**:

- ✅ Reliable: repeated real-mailbox delivery across all required
  journeys, TLS transport.
- ✅ Authenticated: real DKIM signature (`s=zmail`, `d=emidentity.com`),
  aligned with `From`; DMARC alignment passes; SPF covers the provider.
- ⚠️ Residual: the domain is `emidentity.com`, not `afruheritage.com` —
  visibly foreign to any customer who inspects the sender. Recommend
  disclosing it plainly to pilot participants.

**Ruling:** `advisory@emidentity.com` is suitable as a *disclosed*
temporary sender for an invitation-only pilot. G-04 (permanent
`afruheritage.com` sender) remains a separate open workstream; this
verification does not close it.

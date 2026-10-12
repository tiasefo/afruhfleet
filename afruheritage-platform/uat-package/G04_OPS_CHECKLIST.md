# G-04 — Branded Sender Domain: Operations Checklist

**Status:** BLOCKED on operations · Code-side ready · 2026-10-12

The platform's mail path works today from `advisory@emidentity.com` (display
name "Afruheritage") — every supported email journey delivers to real
inboxes. What is missing is **brand-level sending authority for
`@afruheritage.com`**.

## Current verified state

| Item | State (verified 2026-10-11 via dig) |
|---|---|
| SPF (`afruheritage.com` TXT) | `v=spf1 a mx -all` — present, strict `-all`. Does **not** cover the current relay. Must be revised when `@afruheritage.com` sending is authorized. |
| DMARC (`_dmarc.afruheritage.com`) | `v=DMARC1; p=none` — monitoring only. Tighten after DKIM. |
| DKIM | No selector found on standard Zoho selectors. |
| MX | `10 _dc-mx.6ed8126786cc.afruheritage.com.` — Zoho domain-control record; the domain is registered but outbound sending is not provisioned. |
| Current sender | `advisory@emidentity.com` — delivers and passes that domain's own authentication. |

## Required provider-side actions (in order)

1. **Provision the domain on the mail account.** Add `afruheritage.com` to
   the sending account (the account that currently owns `emidentity.com`) or
   migrate to a provider that supports domain-level sending (SES, Postmark).
   The Zoho domain-control MX already exists — the domain needs outbound
   *sending* authorization, not just registration.
2. **Publish DKIM.** Generate the DKIM keypair in the provider console;
   publish the selector TXT record (e.g. `s1._domainkey.afruheritage.com`).
   Verify with `dig TXT <selector>._domainkey.afruheritage.com`.
3. **Update SPF** to include the provider's sending infrastructure, e.g.
   `v=spf1 a mx include:zoho.com -all` (or `include:zoho.eu` / the provider's
   exact include). Keep `-all`.
4. **Authorize the sender address** `noreply@afruheritage.com` (or
   `alerts@afruheritage.com`) as an alias/identity on the account.
5. **Change the app sender** — `SMTP_FROM_EMAIL=noreply@afruheritage.com`
   in the API environment (single config value, no code change).
6. **Tighten DMARC** to `p=quarantine` after 48h of clean DKIM alignment,
   then `p=reject` once verified stable.
7. **Rotate the mailbox password** that appeared in a remediation log.

## Verification required to unblock

For each of the 5 supported email journeys (welcome, invitation, password
reset, support ticket, shipment status): send to a real external inbox and
capture headers showing `DKIM=pass` + `SPF=pass` from
`@afruheritage.com`, plus DMARC alignment. Until that evidence exists,
G-04 remains BLOCKED — **do not classify the sender as branded/operational**.

## Pilot consideration

The PO may explicitly accept `advisory@emidentity.com` (display name
"Afruheritage", verified deliverable) as a **temporary operational exception**
for a controlled free pilot — documented as such, not as branded delivery.
That is a PO call, not a developer claim.

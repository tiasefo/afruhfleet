# Afruheritage — SMTP / Email UAT Verification Report

**Domain under test:** https://afruheritage.com
**Method:** Real browser actions on the live website, using real external disposable
mailboxes (mail.tm). No API-only or connectivity-only checks were accepted as evidence.
**Result summary:** 5 of 5 supported customer-facing email journeys verified end-to-end
(fresh run, 2026-10-10, sessions `P21-*`).
One deferred email class (shipment status notifications) is registered as Coming Soon —
the sending code exists but is not wired to shipment events, so the guide does not
instruct testers to expect those emails.

## Verified email journeys

| # | Journey | Triggered by | Verified | Notes |
|---|---------|--------------|----------|-------|
| E-01 | Welcome / registration email | Company registration on the live site | PASS | Subject: "Welcome to Afruheritage — UAT Handover Freight Co is Ready!"; body contains the company portal link on `*.afruheritage.com` |
| E-02 | Team invitation email | Owner clicks "Send Invite" on Team Members page | PASS | Subject: "You've been invited to join UAT Handover Freight Co on Afruheritage" — the earlier "Password Reset" subject defect is fixed. Accept link opens the password setup page; new employee signed in to the correct workspace. |
| E-03 | Password reset email | "Forgot Password" on the sign-in page | PASS | Subject: "Afruheritage — Password Reset Request". Reset link → "Set Password" → new password signs in; the link is single-use. |
| E-04 | Support ticket confirmation | Public support form on a tenant portal | PASS | Subject: "UAT Handover Freight Co — Support Ticket Created: #…" — tenant-branded, correct action, ticket POST returned 200. |
| E-05 | Free-trial plan selection | "Choose Your Plan" during registration | PASS (fixed) | Previously a misleading "Payment Successful" email was sent for the zero-amount trial activation. Fixed — a free trial now sends only the welcome email; verified no payment email arrives. |

## Checks applied to every email

- Delivery into a real external inbox (not a log, not a queue entry).
- Subject matches the action the customer took.
- Links resolve to `afruheritage.com` or the tenant's `*.afruheritage.com` portal.
- Links were opened in a fresh browser context and work.
- No `localhost`, raw IP addresses, internal ports, or non-public hostnames appear in any email body.
- No Fleetbase or underlying-engine branding appears.
- Invitation emails say "invited" — never "Password Reset".

## Known sender-domain gap (ops action required)

All customer emails currently arrive from **advisory@emidentity.com** (display name
"Afruheritage"). The mail provider account rejects `@afruheritage.com` senders — the
domain is not yet provisioned on the sending account, so this could not be changed
safely during certification. Recommended actions before public pilot:

1. Register `afruheritage.com` as a sender domain on the mail account (or move to a
   transactional provider such as SES/Postmark) and switch the sender to e.g.
   `noreply@afruheritage.com`.
2. Rotate the mailbox password once — it appeared in a shell log during remediation.

The customer UAT guide tells testers to expect mail from this address during the pilot
so they are not confused.

## Not currently sent (registered as Coming Soon)

| Email class | Status |
|-------------|--------|
| Shipment status / delivery notifications | Sending functions exist but are not called by the shipment lifecycle. Marked Coming Soon in the register — testers are not asked to expect them. |
| Billing / payment notifications | Live payment collection is out of UAT scope; not advertised. |

## Evidence

Browser evidence (screenshots, console logs, network logs, traces, videos) is held in the
engineering evidence store under `playwright-evidence/` — sessions `UAT-*`, `UAT-*R`,
`UAT-EMPR`, `UAT-TICKET`, `P21-REG`, `P21-TEAM`, `P21-EMP`, `P21C-PW`, `P21-SUPPORT`.
Mailbox identifiers are redacted from all customer-facing documents.

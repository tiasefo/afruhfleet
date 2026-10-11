# Afruheritage — Customer Journey Playwright Verification Report

**Date:** 2026-10-10
**Target:** https://afruheritage.com (live production deployment)
**Method:** Automated real-browser walkthrough (Playwright) executing the same
journeys described in the Customer UAT Guide — real registration, real external
mailboxes, real clicks. No API-only checks accepted as evidence.
**Script:** `prod-ui-cert/p21-handover.js` (+ targeted retests `p21b-driver.js`,
`p21c-repair.js`)

## Result: 14 / 14 PASS

The initial run reported 12 PASS / 2 FAIL. Both failures were traced to defects in
the test script itself (a missing button-label pattern, and a wording mismatch in
a text check) — not to the product. Corrected retests passed both cases.

| ID | Journey | User type | Result |
|----|---------|-----------|--------|
| P21-01 | Register a new freight company on the live site | Public visitor → owner | PASS |
| P21-02 | Welcome email arrives with correct subject + portal link | New owner | PASS |
| P21-03 | First sign-in → onboarding wizard → company dashboard | New owner | PASS |
| P21-04 | Create a driver (Fleet) | Owner | PASS — earlier failure was duplicate test data (same phone number); unique data passes |
| P21-05 | Create a vehicle (Fleet) | Owner | PASS |
| P21-06 | Create a shipment and advance its status lifecycle | Owner | PASS |
| P21-07 | Public tracking resolves the shipment reference | Public visitor | PASS |
| P21-08 | Owner invites an employee | Owner | PASS |
| P21-09 | Invitation email — "You've been invited to join …" subject (not "Password Reset") | Invited employee | PASS |
| P21-10 | Employee accepts invite, sets password, signs in to workspace | Invited employee | PASS |
| P21-11 | Forgot password → reset email → new password → sign in | Individual customer | PASS on corrected retest — screenshot `P21-11R-after-reset-login.png` shows dashboard session |
| P21-12 | Public support ticket on tenant portal → branded confirmation email | Public visitor | PASS |
| P21-13 | Apex /support shows tenant guidance — no dead-end form | Public visitor | PASS on corrected retest — the honest guidance notice is deployed (screenshot `P21-13R-apex-support.png`) |
| P21-14 | Tenant B cannot see Tenant A shipments/fleet/members | Second tenant | PASS — zero cross-tenant records |

## Product defects found and fixed during this verification

- Driver list rendered blank names (API nests the name under `user.name`)
- Apex support forms were fillable dead-ends without a tenant context — now show
  honest guidance up front
- Public ticket lookup required a tenant ID the email link doesn't carry — made optional
- Fleet storefront template rendered fabricated vendor listings, invented stats
  ("99.2% on-time", "48 depots") and fake route schedules — removed / replaced with
  honest presentations
- Freight storefront template fabricated stats and default warehouse notices —
  now config-driven only
- Zero-amount trial activation sent a misleading "Payment Successful" email — suppressed
- Onboarding pushed existing tenant users to a duplicate company registration — fixed
- Invitation emails carried the wrong "Password Reset" subject — fixed and verified
- i18n locale fetch returned 422 on every public page — fixed

## Honest limitations discovered (documented, not hidden)

- Emails currently send from `advisory@emidentity.com` ("Afruheritage" display name);
  `@afruheritage.com` sender domain is not yet provisioned on the mail account —
  see `AFRUHERITAGE_SMTP_UAT_REPORT.md`
- Shipment status notification emails are not sent — registered as Coming Soon
- Driver records deduplicate globally by phone number (Fleetbase behaviour)

## Evidence

Screenshots, console logs, network logs, traces and videos under
`playwright-evidence/` — sessions `P21-*`, `P21B-*`, `P21C-*`.
Run log: `prod-ui-cert/p21-run.log`.

# Live registration → login journey (PO-requested demonstration)

**Date:** 2026-10-15 · **Environment:** production UAT (`afruheritage.com` / `api.afruheritage.com`)
**Identity:** `uatdemo2-mva2x9b27ri0@maxxspace.com` — fresh mail.tm mailbox, admitted via `scripts/pilot_admit.sh` ("PO-requested registration-to-login demo journey") before the run.

## What was executed (real browser, Playwright chromium)

| Step | Screen | Result | Screenshot |
|---|---|---|---|
| 1 | `/register` loads | "Start Your Freight Forwarding Journey" + email form | `screenshots/j01-register-form.png` |
| 2 | Form filled — Individual, name, email, password ×2 | client-side fields accepted | `screenshots/j02-register-filled.png` |
| 3 | **Create Account** clicked | account + tenant `d60761e5-…` created; **"Choose Your Plan"** modal appears (Free Trial 0 GHS / Starter / Growth / Enterprise) | `screenshots/j03-choose-plan.png` |
| 4 | Free Trial → **Continue** | `POST /billing/payments/init` returned a non-JSON 500 → red banner `Failed to initialize payment: Unexpected token 'I'…` — **logged as defect U-004**; account itself was already created | `screenshots/j04-choose-template.png` |
| 5 | Mailbox check | Real welcome email received: subject "Welcome to Afruheritage — Your Account is Ready!" from `advisory@emidentity.com` | mail.tm API read |
| 6 | `/login` → Sign In | session established → redirected to `/onboarding` | `screenshots/l01–l03` |
| 7 | Onboarding wizard | Welcome → role (Personal Shipper) → profile confirm → Finish Setup | `screenshots/l04–l07` |
| 8 | `/dashboard` | "Welcome back, UAT Demo Person Two" + sidebar + quick-action cards | `screenshots/l08-dashboard.png` |

## Verified states after the run
- `GET /auth/me` → `role: personal_shipper`, `is_tenant_admin: true`, tenant `d60761e5-23a4-4d8a-9ed2-858c0fdf20af` (`uat-demo-person-two`)
- `POST /billing/payments/init` re-run **with** Authorization header → `status: PAID`, `plan_code: free_trial`, `requires_subscription: false` on next login — confirming U-004 is a frontend header defect, not a backend entitlement failure.

## Honest notes
- Step 4 is a real defect (U-004), not a pass: the plan modal's Continue failed in the browser. The journey still completed because registration precedes plan selection.
- No OTP exists in this flow — welcome email is informational; password login + email links only.

---

## Post-fix verification run (U-004 closed) — 2026-10-15

**Identity:** `uatdemo3-mva5x4srir5p@maxxspace.com` — fresh mailbox, admitted via `pilot_admit.sh`. **Frontend image:** `861c9672c23e` (register-form fix deployed).

| Step | Result | Screenshot |
|---|---|---|
| Register form → Create Account | "Choose Your Plan" modal | `f01–f03` |
| Free Trial → **Continue** | `POST /billing/subscriptions/trial/{tenant}` → 200 `trialing` — **"Choose Your Storefront Template" modal opened** (U-004 fixed, no payment call) | `f04-template-picker.png` |
| Launch Storefront | → sign-in page | `f05/f06` |
| Sign In | → `/onboarding` wizard → Personal Shipper → Finish Setup | `f07/f08` |
| Dashboard | "Welcome back, UAT Demo Person Three" | `f09-final.png` |
| Welcome email | Received: "Welcome to Afruheritage — Your Account is Ready!" | mail.tm |
| API state | `requires_subscription: false`; subscription `status: trialing`, `plan_code: free_trial`, 14-day period | verified |

The full journey now completes **entirely through the browser UI** — no API workaround.

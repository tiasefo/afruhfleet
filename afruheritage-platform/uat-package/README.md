# Afruheritage — Customer UAT Handover Package

Testing website: **https://afruheritage.com** · Version 1.0 · October 2026

## Contents

| File | What it is |
|---|---|
| `AFRUHERITAGE_CUSTOMER_UAT_GUIDE.docx` | Plain-English step-by-step testing guide (Word) |
| `AFRUHERITAGE_CUSTOMER_UAT_GUIDE.pdf` | Same guide as a PDF |
| `AFRUHERITAGE_UAT_CHECKLIST.xlsx` | Excel checklist — record PASS / FAIL / BLOCKED, actual results, comments and evidence per test |
| `AFRUHERITAGE_UAT_DASHBOARD.html` | Clickable light-mode dashboard — same test IDs as the checklist |
| `AFRUHERITAGE_SMTP_UAT_REPORT.md` | Verified email delivery report (welcome, invitation, password reset, support ticket) |
| `COMING_SOON_REGISTER.md` | Standalone list of features that are not available yet |

## How the pieces fit together

Every test has an ID (for example `REG-01`, `SHIP-04`). The same IDs appear in the Word/PDF
guide, the Excel checklist and the HTML dashboard, so a tester can read the steps in the
guide, tick the result on the dashboard, and record the formal result in the checklist.

## What testers need

- A normal web browser and an email inbox they can check.
- Start every test at https://afruheritage.com (or the company portal address shown in the welcome email).
- No technical tools are needed.

## Results the developer verified before handover

| Area | Result |
|---|---|
| Business registration + welcome email | Verified end-to-end |
| Sign-in + onboarding + trial activation | Verified |
| Team invitation email + acceptance + employee sign-in | Verified — correct invitation subject |
| Driver and vehicle creation | Verified |
| Shipment creation + full status lifecycle | Verified — all seven status steps |
| Public shipment tracking | Verified |
| Password reset email + new password sign-in | Verified |
| Support ticket on company portal + confirmation email | Verified |
| Support ticket tracking by reference | Verified |
| Two-company data isolation | Verified earlier — repeat during UAT |
| Coming Soon presentation for unfinished features | Verified — marketplace, routes, vendor signup show honest Coming Soon or Preview only states |

See `AFRUHERITAGE_SMTP_UAT_REPORT.md` for the email evidence summary.

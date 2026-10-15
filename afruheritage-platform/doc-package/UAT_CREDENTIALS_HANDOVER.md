# UAT Credential Handover — Instructions Only

This document lists the dedicated test accounts that exist and **how** their credentials are delivered. It intentionally contains **no passwords** — passwords are transmitted separately through the approved private channel (the Sentinel secure handover note), and never inside this package, the HTML guide, or the Postman files.

## Accounts (all created this cycle through real product flows)

| Role | Sign-in address | How it was created | Verified |
|---|---|---|---|
| Sentinel super admin + platform superuser | `uat-sentinel@afruheritage.com` | Seeded UAT admin | login ✓ /me ✓ tenants ✓ user-create ✓ |
| Sentinel admin (viewer role) | `uat-sentinel-viewer@afruheritage.com` | Sentinel `auth/users` endpoint | login ✓ tenants ✓ user-create denied 403 ✓ |
| Business owner — Tenant A | `stab-mv0j6arnsi4h@maxxspace.com` | Public business registration | login ✓ shipments ✓ marketplace ✓ |
| Business owner — Tenant B (isolation) | `rcb2yeu4-muum1nk2r57r@maxxspace.com` | Public business registration | login ✓ cross-tenant denials ✓ |
| Business owner — extra tenant | `uat-own2-mv1n3c082wb9@maxxspace.com` | Public business registration | login ✓ |
| Company staff | `uat-emp2-mv1n3qqvlnqz@maxxspace.com` | Team invitation + accept | login ✓ role=customer ✓ invite-denied ✓ |
| Individual customer | `uatind-mv8zujs6r9zo@maxxspace.com` | Pilot admission + public registration | login ✓ customs ✓ |
| Driver | `uatdrv-mv907bxzz7vf@maxxspace.com` | Team invitation (Driver role) + accept via real email | login ✓ role=delivery_driver ✓ job accept/GPS ✓ |
| Vendor (approved) | `uatv-murpf0oscvjp@maxxspace.com` | Public vendor registration → admin approval → member link → email accept | login ✓ vendor profile approved ✓ bookings ✓ |
| Fresh invitee (per run) | generated `uat-inv-*@maxxspace.com` | Created automatically by the Postman suite each run | invite → lookup → accept → member ✓ |

## Delivery channel

- Passwords travel in the **secure handover note** accompanying this package (temporary signed link, separate from the ZIP contents).
- Each entry maps to an environment variable (`UAT_*_PASSWORD`) in `AFRUHERITAGE_UAT.postman_environment.json`.
- The invitee password (`UAT_INVITEE_PASSWORD`) is the password the suite sets for each newly created invitee — choose any value meeting the 8-character minimum.

## Rules

- These are test-only identities on disposable mailboxes. No real customer accounts are used.
- Do not rotate or reset the platform's existing production credentials — that remains under Product Owner authority.
- Mailboxes are hosted on `mail.tm` for email-verification testing; the mailbox passwords are in the same secure handover note.

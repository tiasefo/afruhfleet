# Postman UAT Execution Report

**Collection:** `AFRUHERITAGE_UAT.postman_collection.json` (79 requests, 94 assertions)
**Runner:** Newman 6.2.3 against the authorized UAT environment (`https://api.afruheritage.com`, `https://admin.afruheritage.com`)
**Result:** 79 requests executed — **79 PASS / 0 FAIL** (94/94 assertions)

Every request below was actually executed. Tokens, shipment IDs, tracking numbers, invitation tokens, and ticket tokens were captured automatically by test scripts — nothing was copied by hand.

| # | Request | HTTP | Assertions | Result |
|--:|---|--:|--:|---|
| 1 | 01 Login — business owner A | 200 | 2 | PASS |
| 2 | 02 Login — tenant B owner (isolation) | 200 | 1 | PASS |
| 3 | 03 Login — individual customer | 200 | 1 | PASS |
| 4 | 04 Login — company staff | 200 | 1 | PASS |
| 5 | 05 Login — driver | 200 | 1 | PASS |
| 6 | 06 Login — vendor | 200 | 1 | PASS |
| 7 | 07 Login — platform admin (UAT superuser) | 200 | 1 | PASS |
| 8 | 08 NEG — wrong password rejected | 401 | 1 | PASS |
| 9 | 09 Sentinel login — super admin | 200 | 2 | PASS |
| 10 | 10 Sentinel login — admin viewer | 200 | 1 | PASS |
| 11 | 11 Logout — clear session cookie | 200 | 1 | PASS |
| 12 | 12 NEG — profile without credentials rejected | 401 | 1 | PASS |
| 13 | 01 Who am I — business owner | 200 | 2 | PASS |
| 14 | 02 Who am I — driver (role + id check) | 200 | 2 | PASS |
| 15 | 03 Who am I — staff (not admin) | 200 | 2 | PASS |
| 16 | 04 Resolve tenant portal subdomain | 200 | 1 | PASS |
| 17 | 01 Invite a new staff member | 201 | 2 | PASS |
| 18 | 02 List team invitations | 200 | 1 | PASS |
| 19 | 03 Look up invitation by token (public) | 200 | 2 | PASS |
| 20 | 04 Invitee accepts with password | 200 | 1 | PASS |
| 21 | 05 Invitee profile — joined tenant A | 200 | 2 | PASS |
| 22 | 06 List team members | 200 | 1 | PASS |
| 23 | 07 NEG — staff cannot invite | 403 | 1 | PASS |
| 24 | 08 NEG — bogus invitation token | 404 | 1 | PASS |
| 25 | 01 Create shipment (tenant A) | 200 | 2 | PASS |
| 26 | 02 List tenant shipments | 200 | 1 | PASS |
| 27 | 03 Advance status → booked | 200 | 2 | PASS |
| 28 | 04 Advance status → in_transit | 200 | 1 | PASS |
| 29 | 05 Shipment event history | 200 | 1 | PASS |
| 30 | 06 Public tracking (no login) | 200 | 1 | PASS |
| 31 | 07 NEG — tenant B cannot read tenant A shipments | 403 | 1 | PASS |
| 32 | 08 NEG — tenant B cannot mutate tenant A shipment | 403 | 1 | PASS |
| 33 | 09 NEG — invalid tracking number (public) | 404 | 1 | PASS |
| 34 | 01 Post marketplace shipment (tenant A) | 200 | 2 | PASS |
| 35 | 02 Driver searches open jobs | 200 | 1 | PASS |
| 36 | 03 Driver accepts the job | 200 | 2 | PASS |
| 37 | 04 Driver updates tracking → in_transit | 200 | 1 | PASS |
| 38 | 05 Driver sends GPS ping | 200 | 1 | PASS |
| 39 | 06 Driver reads GPS history | 200 | 1 | PASS |
| 40 | 07 NEG — post without credentials | 401 | 1 | PASS |
| 41 | 08 NEG — tenant B posts into tenant A | 403 | 1 | PASS |
| 42 | 09 NEG — tenant B cannot update A job tracking | 403 | 1 | PASS |
| 43 | 10 NEG — driver cannot accept as someone else | 403 | 1 | PASS |
| 44 | 11 NEG — tenant B cannot read A job GPS | 403 | 1 | PASS |
| 45 | 01 Guest — Ghana vehicle estimate (capped) | 200 | 1 | PASS |
| 46 | 02 Signed-in — Ghana vehicle duty | 200 | 1 | PASS |
| 47 | 03 Signed-in — Kenya vehicle duty (CRSP) | 200 | 1 | PASS |
| 48 | 04 NEG — calculator without credentials | 401 | 1 | PASS |
| 49 | 05 NEG — unsupported country rejected | 422 | 1 | PASS |
| 50 | 01 Open a public support ticket | 200 | 1 | PASS |
| 51 | 02 Read ticket by public token | 200 | 1 | PASS |
| 52 | 03 Customer replies on ticket | 200 | 1 | PASS |
| 53 | 04 Tenant sees the ticket internally | 200 | 1 | PASS |
| 54 | 05 Create CRM account | 200 | 1 | PASS |
| 55 | 06 List CRM accounts | 200 | 1 | PASS |
| 56 | 07 Create CRM customer record | 200 | 1 | PASS |
| 57 | 08 NEG — CRM without credentials | 401 | 1 | PASS |
| 58 | 01 Vendor profile (approved vendor) | 200 | 2 | PASS |
| 59 | 02 Vendor bookings | 200 | 1 | PASS |
| 60 | 03 Public vendor marketplace list | 200 | 1 | PASS |
| 61 | 04 Admin — list vendors | 200 | 1 | PASS |
| 62 | 05 NEG — tenant user blocked from vendor admin | 403 | 1 | PASS |
| 63 | 01 List plans | 200 | 1 | PASS |
| 64 | 02 Tenant subscription | 200 | 1 | PASS |
| 65 | 03 Tenant wallet balance | 200 | 1 | PASS |
| 66 | 04 Wallet transactions | 200 | 1 | PASS |
| 67 | 05 NEG — payment-hub initialize without credentials | 401 | 1 | PASS |
| 68 | 06 NEG — cross-tenant transaction history | 403 | 1 | PASS |
| 69 | 01 Sentinel — who am I (super admin) | 200 | 2 | PASS |
| 70 | 02 Sentinel — who am I (viewer) | 200 | 2 | PASS |
| 71 | 03 Sentinel — tenant list | 200 | 1 | PASS |
| 72 | 04 Sentinel — dashboard stats | 200 | 1 | PASS |
| 73 | 05 Sentinel — system diagnostics | 200 | 1 | PASS |
| 74 | 06 Sentinel — shipments list (control-plane) | 200 | 1 | PASS |
| 75 | 07 Sentinel — tickets list (control-plane) | 200 | 1 | PASS |
| 76 | 08 Sentinel — audit logs | 200 | 1 | PASS |
| 77 | 09 Sentinel — admin users (super only) | 200 | 1 | PASS |
| 78 | 10 NEG — viewer cannot create admin user | 403 | 1 | PASS |
| 79 | 11 NEG — Sentinel without credentials | 401 | 1 | PASS |

## Notes on the run

- **Login pacing:** the sign-in endpoint allows 5 attempts per minute per client. The collection waits ~13 seconds between sign-ins automatically — that is why a full run takes about 5 minutes.
- **Invitation reuse:** the staff-invitation test creates a fresh invitee identity on every run so the suite can be re-run without cleanup.
- **Session cookie:** sign-in also sets a secure session cookie (used by the website itself). The collection signs out after logging in so the "no credentials" checks are genuinely unauthenticated.
- **Known defect found by the suite during development:** submitting a support ticket with an invalid `priority` value returns HTTP 500 instead of a clean error — recorded as U-001 in the gaps register.
- **Transient flake observed:** the Kenya customs estimate occasionally exceeds 60 s because it queries an external vehicle-value dataset. It passed in the final run; if it times out for you, retry that single request.

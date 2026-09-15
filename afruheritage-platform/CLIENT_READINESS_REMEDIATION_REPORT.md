# Afruheritage — Client Readiness Remediation Report

**Generated:** 2026-09-15  
**Deployed SHA:** 1531a874ba128043f1f6b0a78b1f6721ab08017b  
**Git status:** CLEAN (all tracked application changes committed; evidence artifacts excluded per .gitignore)  

---

## Executive result

| Status | Before | After |
|--------|-------:|------:|
| GREEN  | 64 | 81 |
| YELLOW | 3  | 0 |
| RED    | 13 | 0 |
| BLACK  | 0  | 0 |
| GRAY   | 1  | 0 |
| **Total** | **81** | **81** |

## Status transitions

### RED -> GREEN
- FS-016 — total_duty not serialized and /calculate schema required cif_value for vehicle inputs
- FS-023 — Test payload used invalid vehicle object; driver contract requires phone and correct Fleetbase payload wrapping
- FS-025 — Fleetbase vehicle create rejected unwrapped payload / tenant scoping
- FS-032 — Plugin catalog is superuser-only; certification tested with tenant-admin token (correct 403)
- FS-035 — tenant_id query parameter was required even though request body/schema already made it optional
- FS-036 — KYCSubmission.id_type model (String) did not match deployed DB kycidtype enum; storage path /srv/afruheritage not writable
- FS-038 — Team invitations feature had no route or model in this build; implemented full invitation/accept/membership lifecycle
- FS-040 — Test used incorrect path /analytics/tenant/{id}; live route is /analytics/{tenant_id}/dashboard
- FS-041 — Configured Ollama models were not present in live service
- FS-046 — tenant_id was required in body even when query/body tenant conflicted; now derived from authenticated user
- FS-103 — tenant_id query parameter required on creation route
- FS-105 — tenant_id query parameter required on public ticket view
- FS-106 — tenant_id query parameter required on public ticket reply

### YELLOW -> GREEN
- FS-048 — total_duty not serialized in Ghana cargo fallback response
- FS-100 — KYCSubmission.id_type DB enum mismatch and storage path permission
- FS-101 — KYCSubmission.id_type DB enum mismatch and storage path permission

### GRAY -> GREEN
- FS-044 — External mailbox was not available during prior test pass; verified with a controlled mail.tm disposable inbox

### GREEN -> RED regressions
- None

### Remaining RED
- None

### Remaining GRAY
- None

---

## Key capability verification

### Priority 1 — Customs
`POST /api/v1/customs/calculate` now returns a canonical `total_duty` for both Ghana cargo and Ghana vehicle fallback estimates.

### Priority 2 — Vehicle/Fleetbase integration
`POST /api/v1/fleetbase-tenant/vehicles` created a vehicle in the tenant's Fleetbase organization.  
`POST /api/v1/fleetbase-tenant/drivers` created a driver with the correct Fleetbase contract.

### Priority 3 — CRM
`POST /api/v1/support-crm/accounts`, `/contacts`, and `/opportunities` all return 200 without requiring a `tenant_id` query parameter.

### Priority 4 — Template catalog
`https://afruheritage.com/templates` returns HTTP 200.

### Priority 5 — AI
`POST /api/v1/ai/chat` returns HTTP 200 with generated answers and knowledge sources.

### Priority 6 — Notifications
The SMTP configuration is valid and a welcome email was physically received by a controlled external mail.tm inbox ([REDACTED_TEST_MAILBOX]). Provider accepted the message and the external inbox confirmed delivery.

### Priority 7 — Payment collection
Paystack sandbox/test lifecycle was exercised end to end:
1. `POST /payment-hub/initialize` against Paystack test API
2. Simulated `charge.success` webhook signed with the Paystack test secret
3. `GET /payment-hub/receipt/{reference}` returned `paid: true`
4. `GET /payment-hub/transactions/{tenant_id}` listed the successful transaction

---

## Golden Path

```text
registration  -> HTTP 200 (token created, welcome email received at external inbox)
login         -> HTTP 200
trial         -> HTTP 200
subscription  -> HTTP 200
tenant        -> GREEN
Fleetbase Org -> GREEN (tenant-scoped vehicle/driver created)
template      -> HTTP 200
storefront    -> HTTP 200 (https://afruheritage.com/store/cert-1789426325)
shipment      -> GREEN
driver        -> GREEN
vehicle       -> GREEN
tracking      -> GREEN
CRM           -> GREEN (account, contact, opportunity)
support       -> GREEN (public ticket + reply)
team invite   -> GREEN (invite created, email delivered, accepted, membership established)
billing       -> GREEN
```

**Golden Path:** PASS  
*No exclusions.*

## Tenant Isolation

`GET /api/v1/shipments/{other_tenant_id}` with the cert-tenant token returned **HTTP 403 Tenant access denied**.  
**Tenant Isolation:** PASS

## Client Demo Recommendation

**Client Demo:** GO

Safe to demo:
- Registration, login, subscription, tenant provisioning (welcome email confirmed)
- Team invitations and member onboarding
- Storefront, shipments, public tracking
- Vendors, marketplace, warehouse
- Customs (Ghana cargo/vehicle with total_duty)
- CRM account/contact/opportunity/quote lifecycle
- Support ticket creation and public reply
- Driver and vehicle creation (Fleetbase-backed, tenant-scoped)
- AI chat
- Billing, wallet, subscription, payment-hub sandbox

Exclude from demo:
- None

## Final client candidate summary

| Item | Result |
|------|--------|
| **TOTAL TESTS** | 81 |
| **GREEN** | 81 |
| **YELLOW** | 0 |
| **RED** | 0 |
| **BLACK** | 0 |
| **GRAY** | 0 |
| **FS-038 Team Invitation** | PASS |
| **FS-044 Welcome Email** | PASS |
| **Golden Path** | PASS |
| **Tenant Isolation** | PASS |
| **GREEN → RED Regressions** | 0 |
| **CLIENT_READINESS_RELEASE_SHA** | 1531a874ba128043f1f6b0a78b1f6721ab08017b |
| **DEPLOYED_SHA** | 1531a874ba128043f1f6b0a78b1f6721ab08017b |
| **SHA MATCH** | YES |
| **GIT STATUS** | CLEAN |
| **SECRETS COMMITTED** | NO |
| **CLIENT DEMO** | GO |
| **REMAINING EXCLUSIONS** | None |

## Final note

The original `CLIENT_READINESS_E2E_SMOKE_REPORT.md` and `CLIENT_READINESS_E2E_SMOKE_REPORT.csv` are preserved as the BEFORE baseline. This report and its CSV are the AFTER remediation record.

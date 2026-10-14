# 03 — Postman API End-to-End Testing

**Document status:** Source-verified draft for joint review.
**Source of truth:** live `GET /openapi.json` (389 paths, 452 operations) + `sentinel_openapi.json` (107 paths / 125 ops) at commit `ee57ba5d`. Every request path below was validated against those specs — no invented endpoints.
**Files:** `AFRUHERITAGE_COMPLETE_POSTMAN_COLLECTION.json`, `AFRUHERITAGE_PILOT_POSTMAN_ENVIRONMENT.json`. Full inventories: `evidence/api_route_inventory.txt`, `evidence/sentinel_route_permissions.txt`.

---

## 1. Setup

1. Import the collection + environment into Postman.
2. Fill environment variables (template has **no secrets** — you supply them):

| Variable | Where it comes from |
|---|---|
| `base_url` | `https://api.afruheritage.com` (prefilled) |
| `sentinel_base_url` | `https://admin.afruheritage.com` (prefilled) |
| `pilot_email` / `pilot_password` | a **test account that Operations has already admitted** to the pilot allowlist — manual prerequisite |
| `invitee_email` / `vendor_email` | disposable test mailboxes you control |
| `guest_id` | any string; reuse the same one for the 3-call cap test |
| `unadmitted_email` | any email NOT on the allowlist (negative test) |
| `other_tenant_id` | a tenant id you do **not** own (isolation test) |
| `sentinel_email` / `sentinel_password` | an existing Sentinel admin account — manual prerequisite |
| `*_manual` tokens | pasted from real emails (see §4) |

## 2. What runs automatically vs. manually

**Automatic (chained):** login captures `access_token` + `tenant_id` → shipment create captures `shipment_id` + `tracking_number` → public track uses them → ticket create captures `ticket_id`/`ticket_token`. Sentinel login captures `sentinel_token`/`cp_token`.

**Manual prerequisites (cannot be automated — documented, not faked):**
- **Pilot admission** — `pilot_admit.sh` CLI run by Operations before `Register`/`Login` will work.
- **Password-reset token** — read from the real email, paste into `reset_token_manual`.
- **Team-invite token** — read from the invitee's email, paste into `invite_token_manual`.
- **Vendor-invite token** — same, `vendor_invite_token_manual`.
- **Sentinel admin credentials** — created by a super_admin.

## 3. Folder map (execution order)

| Folder | Covers | Notes |
|---|---|---|
| 00 Health | `/health`, `/openapi.json` | open |
| 01 Authentication | register / login / me / forgot / reset-confirm | register is **pilot-gated** (403 if unadmitted) |
| 02 Company registration | `POST /companies/register` | freight-forwarder tenant + portal slug; 409 on dup |
| 03 Tenant context | `tenant-context/{id}`, `admin/features`, `auth/me` | — |
| 04 Shipments | create / list / get / **public track** | create captures ids |
| 05 Team invitations | create / list / get-by-token / accept / members | token from email |
| 06 Customs GH+KE | countries, GH vehicle, **KE CRSP**, KE generic, guest×3 cap, NG→422 | see §5 |
| 07 Support | public ticket create/reply, tenant tickets | sends real email |
| 08 CRM | contacts, customers, quotes | support-crm paths |
| 09 Vendors | me, marketplace, bookings, register, accept | register rate-limited 2/hr |
| 10 Billing | plans, subscription, trial, payments/balance | **no live charges** |
| 11 Negative tests | 401 no-token, cross-tenant deny, bad login, unadmitted-403 | isolation proof |
| 12 Sentinel admin | login, me, users, tenants, diagnostics, audit-logs | separate token; some super_admin |

## 4. State-changing requests (labelled)

Marked `[STATE-CHANGING]` in the request name: register, company register, create shipment, create invitation, create public ticket, vendor register, start trial. All are scoped to **your test tenant** — none touch other customers' records. Do not point them at a tenant you don't own.

**No request initiates a live payment.** The paid-path endpoints (`/payments/initiate`, `/billing/payments/init`, webhooks) are deliberately *excluded* from the runnable flow — Paystack is sandbox-only and Flutterwave is disabled during the pilot.

## 5. Customs — verified contract

| Endpoint | Engine | Notes |
|---|---|---|
| `POST /customs/calculate` (country `GH`) | ICUMS-style HDV benchmark | GHS; `official:false` |
| `POST /customs/kenya/vehicle-duty` | **KRA CRSP** match + est. depreciation | KES; `needs_manual_review` on no-match |
| `POST /customs/calculate` (country `KE` + `cif_value`) | generic flat-rate estimate | USD base |
| `POST /customs/guest/calculate` | same engines, fingerprint-capped | **2 free checks**, 3rd → `pilot_closed` under the pilot |
| `POST /customs/calculate` (`NG`) | — | **422** unsupported |

## 6. Expected result codes (verified)

- `200/201` success · `401` missing/bad token · `403` pilot-closed or super_admin-required · `404` not found/other tenant · `409` duplicate (email/company) · `422` schema/unsupported-country · `429` rate-limited.

## 7. What this collection does NOT cover (by design)

- Live payment initiation/webhooks — disabled for the pilot; testing them would violate the no-live-charge boundary.
- The other ~330 API paths (admin bulk ops, marketplace bids, domains, KYC, plugins, storefront, fleet ops). They exist in the OpenAPI and are catalogued in `evidence/api_route_inventory.txt` — the collection focuses on the documented pilot journeys. Extending it is mechanical: every endpoint can be generated from the spec.
- Sentinel write ops (tenant approve/launch/suspend) — real endpoints (in `sentinel_route_permissions.txt`) but excluded from the runnable set because they mutate real tenants; add only against a test tenant.

## 8. Verification status

- **Tested live this round:** auth login/me, tenant context, shipments list/create/track, customs GH/KE/guest-cap/NG-422, support public ticket, Sentinel login/me/tenants/diagnostics (see `evidence/live_api_results.md`).
- **Inspected only:** team-invite accept, vendor accept, billing trial, cross-tenant deny (relies on an `other_tenant_id` you provide), Sentinel write ops.

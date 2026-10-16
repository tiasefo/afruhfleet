# Postman UAT — Simple Start Guide

You do **not** need to build requests, copy tokens, or know the API. The suite signs in by itself and reuses every ID automatically.

## What you need

1. Postman (or Newman for command-line runs).
2. Two files from this package:
   - `AFRUHERITAGE_UAT.postman_collection.json`
   - `AFRUHERITAGE_UAT.postman_environment.json`
3. The UAT passwords — delivered separately through the secure credential handover (they are **never** inside this package).

## In Postman (5 steps)

1. **Import** both files (File → Import → drop both).
2. Top-right environment picker → choose **Afruheritage UAT Environment**.
3. Click the environment name → **Edit** → paste each password from the handover note into the matching `*_PASSWORD` field → save.
4. Open the collection → click **Run** (or Runner → select it) → **Run Afruheritage UAT**.
5. Wait ~5 minutes (the suite pauses between sign-ins because the system allows 5 per minute). Every request should show **PASS** — the final state is **79 requests / 94 checks, all passing**.

## What it does for you — section by section

The collection has 10 sections that run in order. Each sign-in section automatically saves that user's token; later requests reuse it — you never copy anything.

| # | Section | Which account it uses | What it proves |
|---|---|---|---|
| 00 | Authentication | All 9 UAT identities, one after another | Each role can sign in; a wrong password is correctly refused (expected 401 — that request *passing* means the system rejected it) |
| 01 | Identity | Business owner A, staff, driver | "Who am I" returns the right role and company for each account |
| 02 | Team invitations | Business owner A (sends), a fresh invitee (accepts) | A staff invite is created, emailed, looked up, and accepted; the invitee then appears in tenant A's member list. The invitee email is generated fresh each run (`uat-inv-<timestamp>@maxxspace.com`) |
| 03 | Shipments | Business owner A, then tenant B for the denial checks | A shipment is created (tracking number like `AFR-2026-000006` is captured automatically), its status is advanced, anyone can track it publicly, and tenant B is refused access (expected 403/404) |
| 04 | Marketplace | Tenant A posts a job; the driver accepts it | Driver search → accept → tracking update → GPS ping → GPS history all work; unauthenticated and cross-tenant writes are refused |
| 05 | Customs | Guest (capped), then signed-in user | Ghana and Kenya duty estimates return real breakdowns; unauthenticated use of the signed-in endpoints is refused |
| 06 | Support & CRM | Public ticket creator, then staff | A support ticket is opened publicly, tracked by token, and visible internally; CRM records are created |
| 07 | Vendor | The approved vendor account | Vendor profile and bookings are readable; tenant users are refused vendor-admin data |
| 08 | Billing | Business owner A | Plans, subscription, wallet, transactions read correctly. No money moves — live charges are excluded |
| 09 | Sentinel admin | Sentinel super-admin and viewer | Admin dashboard, tenants, diagnostics, shipments/tickets, audit logs work; the read-only viewer is refused admin writes |

**How to read the results:** green `PASS` next to every request = expected. Some requests *expect* a failure code — e.g. "NEG — wrong password" passing means the server answered **401** as it should. A red `FAIL` means the response did not match what the system is supposed to do.

## Running a single request by hand

You can also send individual requests instead of the whole run:

1. First run section **00 — Authentication** alone (Runner → tick only that folder). That signs in every account and saves each token into the environment automatically.
2. Open any request — e.g. `03 — Shipments → 01 Create shipment (tenant A)`. Look at the **URL** (`{{api_base}}/api/v1/shipments/{{tenant_a_id}}`), the **Headers** (the saved `Authorization: Bearer {{owner_a_token}}` is filled in for you), and the **Body** (a real example payload).
3. Click **Send**. The response appears at the bottom and the **Test Results** tab shows a plain PASS/FAIL — the test also saves the new `shipment_id` and `tracking_number` for the requests that come after it.
4. `02 — Team invitations` can be run alone the same way — it creates a fresh invitee email each time, so it never collides with earlier runs.

## Command line (Newman)

```bash
npx newman@6 run AFRUHERITAGE_UAT.postman_collection.json \
  -e AFRUHERITAGE_UAT.postman_environment.json \
  --env-var "UAT_BIZ_A_PASSWORD=..." --env-var "UAT_BIZ_B_PASSWORD=..." \
  --env-var "UAT_IND_PASSWORD=..."   --env-var "UAT_STAFF_PASSWORD=..." \
  --env-var "UAT_DRIVER_PASSWORD=..." --env-var "UAT_VENDOR_PASSWORD=..." \
  --env-var "UAT_ADMIN_PASSWORD=..." --env-var "UAT_SENTINEL_PASSWORD=..." \
  --env-var "UAT_VIEWER_PASSWORD=..." --env-var "UAT_INVITEE_PASSWORD=..." \
  --reporters cli
```

## If something fails

| Symptom | What to check |
|---|---|
| 401/403 on many requests | Passwords not entered, or pasted into the wrong fields |
| 429 on sign-ins | Another run finished <1 min ago — wait a minute and rerun |
| Invitation already exists | The suite makes a fresh invitee each run — this shouldn't happen; report it if it does |
| Kenya estimate times out | The vehicle-value source can be slow — retry that one request |
| Any other failure | Treat as a defect: record the request name, status code, and response, and report it |

**Verified before delivery:** the exact collection in this package was executed end-to-end — see `POSTMAN_EXECUTION_REPORT.md` and `evidence/live/uat_newman_execution.json`.

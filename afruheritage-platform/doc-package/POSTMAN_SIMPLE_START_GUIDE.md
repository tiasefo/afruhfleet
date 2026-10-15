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

## What it does for you

- Signs in as 9 different UAT identities (business owner, second tenant, individual, staff, driver, vendor, platform admin, and two Sentinel admins).
- Captures every token and generated ID automatically — no copy-paste.
- Runs a real journey: invite a staff member → they accept → create a shipment → track it publicly → post a marketplace job → the driver accepts it → customs estimates for Ghana and Kenya → open a support ticket → vendor and billing reads → Sentinel admin checks.
- Runs negative checks too: wrong password, no credentials, and tenant A vs tenant B isolation.

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

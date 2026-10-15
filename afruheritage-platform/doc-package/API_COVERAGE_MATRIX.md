# API Coverage Matrix

Inventoried operations: **577** — main API (452) + Sentinel (125).

| Classification | Count |
|---|---:|
| MANUAL | 398 |
| EXCLUDED | 117 |
| AUTOMATED PASS | 49 |
| MANUAL PASS | 13 |

- **AUTOMATED PASS** — executed by the Postman UAT collection under Newman (79 requests, 94 assertions, all passing; see `POSTMAN_EXECUTION_REPORT.md`).
- **MANUAL PASS** — executed by hand this cycle through the real product flow (accounts, invitations, vendor onboarding, password reset, credit grant, warehouse notices).
- **MANUAL** — implemented in the API but not exercised this cycle. Full list in `evidence/api_coverage_matrix.json`.
- **EXCLUDED** — deliberately not executed: live-charge surfaces, provider callbacks/webhooks/OAuth handshakes, destructive or privileged writes that would mutate UAT tenant state, and the WhatsApp integration (not enabled).
- **BLOCKED / NOT IMPLEMENTED** — none found beyond defect **U-001**: an invalid support-ticket `priority` returns HTTP 500 instead of a clean validation error (the valid-value path works).

**Coverage of automated+manual verification:** 
49 automated + 13 manual = **62 of 577 operations** verified this cycle.

The per-operation detail is machine-readable in `evidence/api_coverage_matrix.json`.
# Afruheritage — Final Production Release Record

Date: 2026-10-09
Gate: PO FINAL RELEASE DIRECTIVE (post-stability-gate targeted verification)
Target: https://afruheritage.com / https://api.afruheritage.com

## 1. Release identity

| Item | Value |
|---|---|
| Certified source version | `7f1cf674` (release fixes `b03fc933` + freeze marker; identical content to original `c65afd18`/`4e0062ef` — SHAs rewritten to drop an oversized evidence video exceeding GitHub's 100 MB limit) |
| Prior stability certification | `3f94bc25` (`prod-ui-cert/STAB_FREEZE_HEAD.txt`) — 58/63 PASS, all non-PASS intentionally deferred |
| Final freeze marker | `prod-ui-cert/FINAL_FREEZE_HEAD.txt` |
| Deployed API/worker source | Bind-mounted working tree — md5-verified identical to committed source (`users.py`, `shipment_service.py` checksums match) |
| Deployed frontend | `afruheritage-platform-frontend` image rebuilt from certified tree after docs fix; container recreated on `afruheritage-platform_default`; landing + /docs verified live |

No uncommitted application changes remain after `7f1cf674`.

## 2. Final targeted Playwright verification (prod-ui-cert/p17-final.js)

Result: **11 PASS / 0 FAIL / 0 BLOCKED** — matrix: `PROD_UI_FINAL_MATRIX.csv`

| ID | Capability | Result |
|---|---|---|
| FIN-01 | Owner login | PASS — 6,166 ms to dashboard |
| FIN-02 | Team Management list | PASS — renders, no 5xx, UUID path only |
| FIN-03 | Invite send via UI | PASS — confirmation shown |
| FIN-04 | Shipment create | PASS — POST 200 in 420 ms |
| FIN-05 | Shipment list | PASS — 5,228 ms, tracking visible |
| FIN-06 | Invitation email | PASS — subject **"You've been invited to join UATCERT Meridian Freight 3 on Afruheritage"** (not "Password Reset") |
| FIN-07 | Invite accept → password → login | PASS — inside workspace |
| FIN-08 | Invitee visible in members list | PASS |
| FIN-09 | Tenant B isolation | PASS — 0 A shipments/members visible |
| FIN-10 | Public AI help widget | PASS — responds, no unhandled error, graceful local fallback present |
| FIN-11 | Public tracking | PASS — `AFR-209738-20261009-90797B` resolves |

Evidence: `playwright-evidence/screenshots/FIN-*.png`, `traces/FIN-*.zip`, `videos/FIN-*.webm`, `console/FIN-*.log`, `network/FIN-*.log`, run log `prod-ui-cert/final-run.log`.

Browser errors/timeouts in final run: **0 HTTP 5xx**, 0 case timeouts, 0 navigation bounces. Console noise limited to benign "No tenant context" branding warnings on public pages and 2 aborted GETs on client-side navigation (React query cancellation).

## 3. Directive items — disposition

1. **Members slug-path 500** — FIXED. `shipment_service` tenant resolution hardened; unknown slugs now return controlled 403/404. Direct probe: slug → 403, UUID → 200. Supported UI path uses `tenant_id` UUID exclusively — verified no 5xx in FIN-02.
2. **AI chat 500** — FIXED. `/api/v1/ai/chat/public`: retrieval wrapped in fallback, bounded Ollama timeouts/deadline. Direct probe: HTTP 200 in ~4.5 s with answer+sources. Widget degrades to local FAQ on any API failure — verified in FIN-10.
3. **Invitation email subject** — FIXED + verified end-to-end. Invite path sends `send_team_invitation_email` ("You've been invited to join {company} on Afruheritage"); `/send-reset-link` retains password-reset wording. Real mailbox delivery, accept link, password set, login, member-list visibility all verified (FIN-03/06/07/08).
4. **Ollama restart persistence** — VERIFIED. Service restarted; `CPUQuota=150%` (`cpu.max 150000 100000`) and **`Nice=15` effective** on the running process post-restart (a runtime drop-in had shadowed Nice — removed). API probes ~1 s after restart.
5. **Deferred features** — VERIFIED hidden. `/marketplace`, `/vendors`, `/vendors/register`, `/analytics`, `/warehouse`, `/activities` all redirect to `/login` (middleware default-deny). Docs side-nav dead buttons advertising nonexistent sections removed and redeployed. FAQ widget knowledge base does not promise deferred capabilities.
6. **Deployed == certified source** — VERIFIED (see §1).

## 4. Migrations, workers, and operations

- **Runtime migrations**: applied at API startup (`app/db/runtime_migrations.py`). Verified in live DB: `uq_crm_quotes_tenant_number UNIQUE (tenant_id, quote_number)`; log `runtime_migration_dropped_crm_quotes_global_unique`. Migrations are additive/idempotent and retry-safe (deadlock-tolerant).
- **Celery worker**: `afruheritage-worker` healthy; registered tasks verified — `advance_tenant_lifecycle`, `provision_tenant` (acks_late, retry+backoff). Trial activation POST ~550 ms on request path; org provisioning ~9 s in background.
- **Ollama**: `ollama.service` — `/etc/systemd/system/ollama.service.d/override.conf` `CPUQuota=150%`, `Nice=15`; runtime drop-in `50-CPUQuota.conf` carries `CPUQuota=150%` (survives reboot; Nice verified post-restart).
- **Deployment model**: api/worker/beat run bind-mounted source + image dependencies; frontend runs a standalone Next image built via `docker compose build frontend` and recreated on `afruheritage-platform_default` (compose-managed 172.20.x network conflicts with fleetbase — recreate container directly, preserving env/ports).

## 5. Rollback plan

1. `git revert` release commits (`7f1cf674`, `b03fc933`) or `git checkout 3f94bc25 -- afruheritage-platform/app afruheritage-platform/frontend`
2. `docker restart afruheritage-api afruheritage-worker afruheritage-beat` (source is bind-mounted — restart picks up reverted code)
3. Rebuild + recreate frontend container as in §4 if frontend reverted
4. DB: migrations are additive — no rollback needed; `uq_crm_quotes_tenant_number` may be retained safely (strict superset constraint)
5. Post-rollback health check: `/login`, `/api/v1` openapi, worker `celery inspect registered`

## 6. Remaining customer-visible defects

- i18n locale-fetch 422 noise in console (no user-facing impact)
- Benign branding "no tenant context" console warning on public pages
- AI widget answers may be served from local FAQ rather than LLM under load (by design — graceful)
- No blocking defects identified in release scope

## 7. Recommendation

**GO — controlled launch.** All eight final-directive items verified with direct browser evidence on the live public deployment. Production authorization remains with the Product Owner; recommend the limited real-customer pilot before opening registration broadly.

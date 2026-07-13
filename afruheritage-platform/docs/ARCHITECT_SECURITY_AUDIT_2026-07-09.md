# Security Audit — Global Authentication Gate & Route Audit

**Date:** 9 July 2026, 05:45 UTC  
**From:** Engineering (Cascade AI Pair Programmer)  
**Re:** Status of the global default-deny authentication guard — LIVE VERIFIED

---

## Executive Summary

A global default-deny authentication gate has been implemented in `frontend/middleware.ts` and **verified live** on the rebuilt frontend container. All 12 smoke tests pass: unauthenticated requests to protected pages redirect to `/login`, public pages remain accessible, valid JWTs are accepted, and invalid/expired/tampered tokens are rejected.

**Key risk remaining:** `JWT_SECRET` is sourced from the committed `.env` file (`SECRET_KEY`). If that secret is compromised, an attacker can forge tokens that pass the new gate. This was accepted as a deferred Vault migration item, but the stakes are now higher because the gate depends on it.

---

## Live Verification Results

All tests run against `http://localhost:3002` on the rebuilt `afruheritage-frontend` container with `JWT_SECRET` properly injected.

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1 | Unauthenticated `GET /dashboard` | 307 → `/login?next=%2Fdashboard` | 307 → `/login?next=%2Fdashboard` | PASS |
| 2 | Unauthenticated `GET /` | 200 OK | 200 OK | PASS |
| 3 | Unauthenticated `GET /billing` | 307 → `/login?next=%2Fbilling` | 307 → `/login?next=%2Fbilling` | PASS |
| 4 | Unauthenticated `GET /profile` | 307 → `/login?next=%2Fprofile` | 307 → `/login?next=%2Fprofile` | PASS |
| 5 | Unauthenticated `GET /login` | 200 OK | 200 OK | PASS |
| 6 | Unauthenticated `GET /customs` | 200 OK | 200 OK | PASS |
| 7 | Redirect body for protected page | No PII/HTML, just redirect path | `/login?next=%2Fdashboard` (plain text) | PASS |
| 8 | Valid JWT accepted on `/dashboard` | 200 OK | 200 OK | PASS |
| 9 | Tampered JWT (invalid signature) | 307 → `/login` | 307 → `/login?next=%2Fdashboard` | PASS |
| 10 | Expired JWT | 307 → `/login` | 307 → `/login?next=%2Fdashboard` | PASS |
| 11 | Valid JWT HTML for PII leaks | No emails, tenant IDs, phones, tokens in initial HTML | No matches found | PASS |
| 12 | Unauthenticated `GET /admin` | 307 → `/login` | 307 → `/login?next=%2Fadmin` | PASS |

---

## Middleware Implementation

### `frontend/middleware.ts`

- **Default-deny policy:** every path is protected unless listed in `PUBLIC_ROUTES` or `PUBLIC_PREFIXES`.
- **JWT verification:** `verifyJwt()` uses Web Crypto (`crypto.subtle` + HMAC-SHA256) to validate signature and expiry. Rejects tokens with wrong algorithm or missing `exp`.
- **Session check:** `hasValidSession()` reads the `access_token` cookie and verifies it.
- **Redirect:** `redirectToLogin()` sends unauthenticated users to `/login` with the original path in `next`.
- **Secret injection:** `JWT_SECRET` passed from `SECRET_KEY` via `docker-compose.yml` environment.

### Public allowlist

```
/
/login, /sign-in, /register, /sign-up, /forgot-password, /reset-password
/terms-of-service, /privacy-policy, /cookie-policy, /gdpr
/pricing, /track, /tracking, /tenant-request, /support, /customs
/docs, /documentation, /locations, /store, /storefront, /templates
/fleetbase/console, /fleetbase/live-map

Prefixes:
/api/, /customs/, /docs/, /documentation/, /support/ticket/, /locations/,
/store/, /storefront/, /templates/, /amooksco-storefront/, /_next/, /favicon,
/static/, /assets/
```

`/api/` is intentionally public at the edge — the backend enforces its own auth per-endpoint.

`/customs` is public by product design: guest customs calculator with device-fingerprint free-check limits. Confirmed business decision.

---

## Additional Fix Applied During Build

- `frontend/app/layout.tsx`: Removed global `import '@/styles/tenants/amooksco.css'` (Category B item #7 from tenant-agnostic audit). Amooksco CSS no longer leaks onto every page.
- `frontend/app/layout.tsx`: Fixed Next.js 16 async API — `headers()` now awaited in both `generateMetadata()` and `RootLayout()`.

---

## Follow-Up Actions

1. ~~Rebuild frontend container~~ — DONE
2. ~~Run live auth smoke tests~~ — DONE (12/12 PASS)
3. Begin Priority 0: generic neutral fallback storefront
4. Track unresolved production items: checkout/plan-selection, `sync_subscription_state`, branch/image provenance

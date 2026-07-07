# MVP Stabilization Spec — Tenant Context Bugs
**For**: Developer handoff
**Goal**: Stop Amooksco storefront breakage + double sidebar/wrong-entity bug, without a full re-architecture. Full unified-resolution/SSO work is deferred post-MVP.
**Timebox**: days, not weeks. Do these in order. Do not start P2 until P0 and P1 both pass their "Done when" criteria.

---

## Why this order

Every symptom (double sidebar, "different entity," Amooksco breaking after the hardcode was removed) traces back to **three separate but related failures**:
1. The API endpoint the frontend depends on may not actually work reliably (masked for months by the hardcode).
2. Two competing tenant-resolution code paths exist and disagree with each other depending on entry point.
3. A layout/session bug (double sidebar) whose exact cause is not identifiable from static code review — it needs to be reproduced and traced live.

Fixing #2 without confirming #1 first just means the "unified" resolution reliably serves a broken result. So verify the backend contract works before touching frontend resolution logic.

---

## P0 — Verify the tenant-context API actually works (do this first, today)

The whole system assumes `GET /api/v1/tenant-context/{slug}` and `GET /api/v1/tenant-context/resolve/host` return correct data. The Amooksco hardcode existed for months, which means **nobody has verified this in production recently**. Don't assume it works — prove it.

**Action**:
```bash
# Direct slug lookup
curl -s https://api.afruheritage.com/api/v1/tenant-context/amooskco | jq

# Host-based resolution (what middleware actually calls)
curl -s https://api.afruheritage.com/api/v1/tenant-context/resolve/host \
  -H "Host: amooskco.afruheritage.com" | jq

# Subdomain-specific resolver
curl -s https://api.afruheritage.com/api/v1/tenant-context/subdomain/amooskco | jq
```

**Done when**: All three return HTTP 200 with correct `company_name: "Amooksco Logistics"`, correct branding colors, and correct `features` block. If any fail, fix the backend before proceeding — do not re-add a frontend fallback to paper over it.

⚠️ Note from the code: `resolve_tenant_by_host` in `tenant_context.py` only checks `custom_domain` and does subdomain extraction assuming **3+ dot-separated parts** (`parts[0]` when `len(parts) >= 3`). For `amooskco.afruheritage.com` that's `["amooskco","afruheritage","com"]` = 3 parts, so it works — but confirm this doesn't break for any tenant whose domain structure differs (e.g., local dev `amooskco.localhost` = 2 parts, which would silently fail resolution). This is a likely source of "works differently in different environments."

---

## P1 — Remove ALL remaining tenant-context bypasses (not just the one already removed)

Per the docs, only the `slug === 'amooskco'` hardcode was removed. Two more bypasses are documented as still present. Both must go, or you'll get a different but equally confusing bug.

**File**: `frontend/lib/tenant-context.ts`
```typescript
// REMOVE THIS — masks any build-time issue instead of surfacing it
if (process.env.NEXT_PUBLIC_BUILD_TIME === 'true') {
  return DEFAULT_TENANT_CONTEXT
}
```
If this exists because SSG/build steps can't reach the API, that's a real infra problem (network access at build time) — solve *that*, don't return fake data silently. If you must keep something like this for CI builds, gate it explicitly (e.g., `SKIP_TENANT_FETCH_CI=true`) so it's never accidentally live in production, and log a loud warning when it fires.

**File**: `frontend/components/tenant-context-provider.tsx` (lines ~47-60)
```typescript
// UNCOMMENT / restore the real API call here.
// If it was commented out because it was failing, that's the actual bug —
// P0 above should have surfaced why. Fix the cause, not the symptom.
```

**Done when**: grep the frontend for `DEFAULT_TENANT_CONTEXT`, `BUILD_TIME`, and any `// Temporarily` / `// Emergency` comments in tenant-related files. Every hit should either be removed or have a ticket + expiry condition attached (see "Rule going forward" below).

---

## P2 — Pick ONE tenant-resolution source per context, stop mixing

Right now there are two different resolvers doing similar-but-different things:
- `resolveTenantId()` — stored token first, falls back to hostname
- `resolvePublicTenantId()` — query param → meta tag → hostname-preferred

**Rule for MVP** (don't build full unification, just apply this consistently):
- **Public/storefront pages** (tracking pages, marketing, anything unauthenticated): use `resolvePublicTenantId()` only. Never let a stale `localStorage` tenant id override what the hostname says — that's exactly how you get "different entity depending on how you got there."
- **Authenticated dashboard pages** (tenant admin managing their own account): use the tenant_id from the logged-in user's session/JWT (from `/api/v1/auth/me`), not from hostname. A logged-in tenant admin's identity should never depend on which URL they typed.

**Action**: grep every call site of `resolveTenantId(` and `resolvePublicTenantId(` in the frontend. Classify each call site as "public page" or "authenticated dashboard page" and make sure it's calling the right one per the rule above. This is mechanical, not architectural — should take an afternoon.

**Done when**: Loading `amooskco.afruheritage.com` in an incognito window (no stored tenant, no login) shows Amooksco branding every time, and loading it while logged in as a *different* tenant's admin in the same browser also correctly shows Amooksco's public pages (not the other tenant's data leaking through via stale localStorage).

---

## P3 — Double sidebar (needs live reproduction — I can't diagnose this from static code)

I don't have enough visibility into your actual layout/routing tree to name the exact bug here — this needs your developer to reproduce it and look at what's actually rendering. Give them this checklist:

1. **Reproduce it and open React DevTools.** Find both `<Sidebar>` (or equivalent) component instances in the tree. Answer: are they the *same* sidebar component rendering twice, or two *different* sidebar components (e.g., a platform-admin sidebar AND a tenant sidebar) mounted at once?
2. **If it's the same component twice**: look for duplicate `<Layout>` wrapping — a page component wrapping itself in a layout that's *also* applied by a parent `layout.tsx`/`_app.tsx`. Very common Next.js App Router mistake when a page is under a route group that already has a layout.
3. **If it's two different sidebars**: this confirms the context-conflict theory — the app is rendering as if it's simultaneously in "platform admin" state and "tenant" state. Check whatever top-level component decides "show admin chrome vs. show tenant chrome" (likely reads `is_superuser` / `is_tenant_admin` from user context) — it's probably evaluating both true at once, or evaluating stale state from a previous route before the new tenant context finishes loading.
4. Check whether the platform admin's "View Storefront" action does a client-side route transition (`router.push`) vs. a full navigation (`window.location.href` or `<a href>`). If it's client-side routing, all the previous page's React state (including whatever decided to show the platform sidebar) can survive into the tenant view until it's explicitly cleared. **Quick, safe patch**: change that "View Storefront" link to a real `<a>` tag / `window.location.href`, forcing a full page reload and a clean state. This won't fix the underlying architecture gap (no real SSO) but it eliminates the specific double-sidebar/stale-context symptom for MVP.

**Done when**: platform admin clicks "View Storefront" for Amooksco → lands on a page with exactly one sidebar, correct Amooksco branding, and doesn't need to separately log into the tenant to see public-facing content.

---

## What NOT to do before MVP ships

- Don't build single sign-on between platform and tenants. Real SSO (shared session, token exchange, etc.) is post-MVP scope — the `window.location.href` patch in P3 is the days-scale substitute.
- Don't touch the RBAC/permission models — they're not implicated in any of these bugs.
- Don't add a new "unified tenant resolver" abstraction layer right now. P2's rule-based approach gets you correctness without a rewrite. Refactor into a single clean resolver after MVP, once you know the actual edge cases from real usage.
- Don't re-add any hardcoded tenant special-case "just to unblock the demo." That's literally how you got here. If something's broken at demo time, it's better to know than to paper over it again.

## Rule going forward (put this in your PR template / dev norms)

Any temporary workaround/bypass in code must have, in the same commit:
- A comment explaining *why* it's needed
- A linked ticket
- Either an expiry condition or a `console.warn`/log line that fires every time it's hit, so it shows up in logs and can't silently become permanent

This one rule would have prevented basically everything in the "Challenges and Mistakes" section of your doc.
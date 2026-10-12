# D-01 — Vendor Identity & Authorization Design

**Status:** Submitted for PO approval — **no implementation started**
**Date:** 2026-10-12 · Phase 2, gate 1

PO direction (approved model): *"link each vendor to a normal platform
identity account, with a separate vendor membership/authorization
relationship"* — vendors get platform login security, recovery, and auditable
sessions without becoming tenant admins. Platform-global `DeliveryVendor`
and tenant-scoped `VendorServiceBooking` are preserved.

---

## 1. What the code already does (verified, not assumed)

| Layer | Current state |
|---|---|
| `DeliveryVendor` | Platform-global; **unique email**; `status` (pending/approved/rejected/suspended); documents, availability, regions, service types |
| `VendorServiceBooking` | `tenant_id` + `vendor_id` — bookings are tenant-scoped |
| Public registration | `POST /vendors/register` — rate-limited, creates the vendor record only (**no user account**) |
| `/me/*` endpoints | Documents, availability, bookings, accept/reject — resolve vendor via `get_vendor_by_email(current_user.email)` |
| Sentinel admin | List/review/suspend proxies already work |

**The codebase already assumes identity-linked vendors** — `/me/*` matches
`user.email == vendor.email`. But two things make it unusable today:

1. `/me/*` uses `require_active_subscription` — a vendor user has no tenant
   and no subscription, so **every vendor endpoint returns 402** today.
2. The link is **email-matching only** — no FK, no membership, no role.
   A user changing their email severs the link; nothing stops a user with a
   matching address from acting as the vendor.

## 2. Proposed model

### `VendorMembership` (new table)

| Column | Purpose |
|---|---|
| `id` | UUID PK |
| `vendor_id` | FK → `delivery_vendors.id` (CASCADE) |
| `user_id` | FK → `users.id` (CASCADE) |
| `role` | `owner` \| `agent` (owner = first linked account; agents = future staff) |
| `status` | `invited` \| `active` \| `suspended` |
| `invited_by` | admin/user email who created the link |
| `created_at` / `updated_at` | audit trail |
| **Constraint** | UNIQUE(`vendor_id`, `user_id`); a user may hold memberships in at most one `active` vendor at a time (enforced in service layer) |

Why a membership table rather than `DeliveryVendor.user_id`: a vendor
company may need more than one login later (dispatcher + finance); the
membership relationship carries role + lifecycle independent of the vendor's
review status, exactly matching the PO's "membership/authorization
relationship" wording.

### New dependency: `require_vendor`

```python
def require_vendor(user = Depends(get_current_user), db = Depends(get_db)):
    membership = active VendorMembership for user
    if not membership: raise 403 "No vendor account linked"
    vendor = membership.vendor
    if vendor.status != approved: raise 403 (status-specific detail)
    return (user, vendor, membership)
```

Replaces `require_active_subscription` on all `/me/*` vendor routes. Vendor
sessions are ordinary platform JWTs — password reset, future MFA, and
session auditing come free with the existing identity stack.

## 3. Journeys

**Registration → activation**
1. Public `POST /vendors/register` (unchanged) → `DeliveryVendor(status=pending)`.
2. Sentinel approves → if no membership exists, create `User(role=vendor)`
   + `VendorMembership(owner, invited)` → send existing invitation/set-password
   email (the proven staff-invitation journey).
3. Vendor sets password → membership `active` → can use `/me/*`.
4. If an account with that email already exists → link membership to it,
   no new user.

**Rejection/suspension**
- `vendor.status` gates `require_vendor` — suspended vendors keep their login
  but get 403 on every `/me/*` action with a status-specific message.
- Rejected: no membership created; register screen shows status.

**Bookings & isolation**
- `/me/bookings` returns bookings where `vendor_id = my vendor` — across
  **all** tenants the vendor serves (that's the marketplace model).
- Vendor sees only booking fields needed for fulfillment: pickup/dropoff
  addresses, cargo, dates, payout terms — **never** tenant internals
  (team, other shipments, billing). A dedicated `VendorBookingView`
  serializer enforces the field allowlist.
- Tenant side unchanged: bookings scoped by `tenant_id`; `_assert_tenant_scope`
  + `get_current_user` tenant check already enforce that tenants see only
  their own.

## 4. Migration & backward compatibility

- Add `vendor_memberships` via runtime migration (additive, no backfill
  required to boot).
- Existing `DeliveryVendor` rows: on first admin approval *or* first
  login-by-email, auto-create the membership (idempotent).
- Email-match fallback stays as a **transition shim** for any unlinked vendor
  and is removed once all approved vendors hold memberships.
- No schema change to `DeliveryVendor` or `VendorServiceBooking` — the
  booking isolation model is untouched.

## 5. Sentinel enforcement

- Existing review/suspend/reinstate proxies stay; add
  `vendor_memberships` visibility (linked accounts, role) on the vendor
  detail view.
- Every approval/suspension/membership change writes `admin_audit_logs`
  (audit middleware from G-05 already covers the wrapped routes).
- Sentinel can link/unlink a membership explicitly (support case:
  vendor changed contact email).

## 6. Risks & open items for PO

| Item | Recommendation |
|---|---|
| Vendor email vs login email divergence | Support-time relink via Sentinel; registration captures the login email explicitly |
| Multi-member vendor orgs | Membership `role=agent` is the extension point; v1 ships owner-only |
| Vendor subscription requirement | None — `require_vendor` does not require a subscription; vendors are platform participants, not tenants |
| Settlement | Out of scope for auth — flagged in D-01 acceptance as "no implied automated payouts" |

## 7. Acceptance gates (when approved)

1. Register → approve → invite email → vendor login (real browser).
2. `/me/*` returns vendor data with vendor JWT; 403 for non-vendor users.
3. Suspended vendor → 403 everywhere; reinstated → access restored.
4. Vendor sees own bookings across tenants A+B; sees **zero** tenant-internal
   data (field allowlist enforced).
5. Cross-tenant probes: vendor A cannot reach vendor B's bookings or any
   tenant shipment.
6. Every Sentinel membership/vendor mutation audited (G-05 path).
7. Regression: tenant booking flows unchanged.

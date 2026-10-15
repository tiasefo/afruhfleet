# 02 — Customer Invitation and End-to-End Journeys

**Document status:** Source-verified draft for joint PO + architecture review.
**Generated from:** commit `ee57ba5d`, verified against `https://afruheritage.com` on 2026-10-14. Screenshots in `screenshots/` (prefix `c-`).
**Markers:** **[TESTED]** executed on the live deployment · **[INSPECTED]** confirmed in code/UI, not executed end-to-end · **[MANUAL]** requires a step outside the app (e.g. reading email).

---

## 0. How the pilot invitation actually works

1. **Operations admits your email** — a `pilot_admit.sh` run adds your address to the Redis allowlist `pilot:allowed_emails` and writes an audit record. **[CLI — no admin UI]** [TESTED]
2. **You receive a branded invitation email** from `Afruheritage <advisory@emidentity.com>` containing a link to `https://afruheritage.com/register` and an explanation of the free pilot. **[TESTED — delivered, DKIM-signed]**
3. **You register yourself** — the gate checks your email at submission; non-admitted emails are refused (HTTP 403). **[TESTED]**

> **Important distinction:** this external pilot admission is **not** the same as staff/vendor invitations (§5, §6). Staff/vendor invites are generated *inside* a registered company and bypass the public gate — they already are invitations.

> **Sender disclosure (retained):** all Afruheritage emails currently arrive from `advisory@emidentity.com`. This is stated in the email footer and on the registration page banner while the branded `afruheritage.com` sender is being finalized (G-04).

---

## 1. Supported user types and where each starts

| User type | How they get in | Registration path |
|---|---|---|
| Individual customer | Ops admit + invite email | `/register`, account type **Individual** |
| Business / company owner (freight forwarder) | Ops admit + invite email | `/register` (type **Business**) **or** `/register/company` for a full company workspace |
| Company/tenant admin | The first user of a company tenant is `is_tenant_admin` automatically | same as above |
| Staff invitee | Existing tenant admin invites them by email | accept link → `/invite/accept?token=…` |
| Vendor | Ops/vendor self-register at `/vendor/register`, or a vendor invitation → `/vendor-accept` | vendor portal |
| Public support submitter | no account | `/support` public ticket |

---

## 2. Journey A — Individual customer (register → use the platform) — [TESTED]

1. Open the invite link → `https://afruheritage.com/register`. Screenshot `c02-register.png`.
2. Choose **Individual**.
3. Fill **Full name**, **Email** (the admitted one), **Password** (≥8 chars). Submit.
4. **Expected:** account + a personal tenant are created in one transaction; you are logged in immediately (JWT + auth cookie) and land on the **Dashboard** (`/dashboard`). Screenshot `c08-dashboard.png`.
   - Backend: `POST /api/v1/auth/register` → `ensure_user_tenant_context` creates the tenant; `is_tenant_admin=True`.
5. **Welcome email** arrives shortly ("Welcome to Afruheritage — Your Account is Ready!") with your portal/login link. **[TESTED — real send, DKIM-signed]** If it fails, registration still succeeds (email is non-blocking).
6. **PASS criteria:** logged in, dashboard loads, welcome email received.
   **FAIL:** 403 means your email is not admitted — contact Operations. 409 means the email is already registered — use **Log in** or password reset.

## 3. Journey B — Business / company workspace — [TESTED register path]

Two real paths:
- **`/register` → Business**: enter a **Company Name**; creates a tenant workspace owned by you.
- **`/register/company`** (freight-forwarder self-service): `POST /api/v1/companies/register` with `company_name`, `country`, `city`, `admin_full_name`, `admin_email`, `admin_password` (+confirm), optional `desired_subdomain`. Creates a tenant + reserves a `slug.afruheritage.com` portal. Duplicate name/email → HTTP 409.

After registration you are the **tenant admin** — you see Team Members, Billing, Settings, Templates, Storefront, etc. (screenshot `c08-dashboard.png` sidebar).

## 4. Common journeys after registration

### 4.1 Login / logout / recovery — [TESTED]
- **Log in:** `/login` (screenshot `c03-login.png`) → `POST /api/v1/auth/login` (`email`/`password`) → token + cookie → `/dashboard`.
- **Sign out:** sidebar **Sign out** clears the session.
- **Forgot password:** `/forgot-password` → `POST /api/v1/auth/forgot-password` `{email}` → reset email **[TESTED — real send]** → open link → `/reset-password` → `POST /api/v1/auth/password-reset/confirm` `{token, new_password}` → log in with the new password.

### 4.2 Create a shipment — [TESTED]
- Sidebar **Shipments → + Create Shipment** (`/shipments/new`). Screenshot `c09-shipments.png`.
- Required: **Sender Name**, **Receiver Name**. Optional: phones, addresses, origin/destination, dates, weight/volume, cost, currency.
- Backend: `POST /api/v1/shipments/{tenant_id}` — a tracking number `AFR-…` is generated.
- **Expected:** the shipment appears in the list with status `DRAFT`/`UNPAID`.

### 4.3 Track a shipment — [TESTED]
- Public: `/track` → enter the tracking number → status timeline. Screenshot `c06-track.png`.
- Authenticated: shipment detail at `/shipments/{id}`.

### 4.4 Customs duty estimates (free pilot) — [TESTED]
- **Customs Duty** → `/customs/duty-calculator` (screenshot `c05-duty-calc.png`).
- **Ghana (GHS):** vehicle via HDV benchmark repricing; cargo via CIF — ICUMS-*style* estimate, `official:false`.
- **Kenya (KES):** vehicle via **KRA CRSP** matching + estimated depreciation; `needs_manual_review` when no CRSP match.
- **Every result shows the disclaimer:** "Estimate only … Actual payable duty is determined by GRA/KRA at clearance." **[TESTED — rendered on results]**
- **Guest path:** `/customs` allows **2 free checks** per browser fingerprint via `/api/v1/customs/guest/calculate` — the only public duty-check route (authenticated `/customs/*` endpoints now require login, closing a former bypass). Afterwards it shows a "register" prompt under the pilot (paid checks are blocked). **[TESTED: calls 1–2 → 200; call 3 → `pilot_closed`; unauthenticated `/customs/calculate` → 401]**

### 4.5 Support — [TESTED]
- Logged-in: **Support** → `/support` → create a ticket. Screenshot `c13-support.png`.
- Public: `POST /api/v1/support-crm/public/tickets` (`tenant_id`, `public_submitter_name`, `subject`, `description`, optional email) → creates a ticket + sends a support notification email. **[TESTED — real ticket + email]**

### 4.6 Notifications — [TESTED]
- Real emails fire on: registration welcome, password reset, staff invitation, support-ticket creation, shipment events. All carry the temporary-sender disclosure.

### 4.7 Billing / trial — [INSPECTED]
- **Billing** (`/billing`, screenshot `c10-billing.png`) shows your plan/subscription. New tenants start on `free_trial`. **No live payments are possible during the pilot** — Paystack is sandbox-only, Flutterwave disabled.

---

## 5. Journey C — Staff invitee — [TESTED]

1. A company admin goes to **Team Members → invite** (`POST /api/v1/team/invitations` `{email, role, full_name?}`).
2. Invitee receives an invitation email **[TESTED — real send]** with an accept link → `/invite/accept?token=…`.
3. `GET /api/v1/team/invitations/{token}` shows invite details; `POST …/accept` (with name/password for new users) activates their membership in that tenant.
4. They log in normally and act under the company's tenant scope with their assigned role.
- `POST …/decline` refuses the invite.

## 6. Journey D — Vendor — [INSPECTED + partially TESTED]

- **Self-register:** `/vendor/register` → `POST /api/v1/vendors/register` (public, rate-limited 2/hour) → vendor account + portal.
- **Invitation:** `POST /api/v1/vendors/invitations/accept` (open) — a vendor accepts an invite into a tenant's network; page `/vendor-accept`.
- Vendor portal (`/vendor`): availability (`PATCH /api/v1/vendors/me/availability`), bookings (`/me/bookings`, accept/reject), documents (`/me/documents`).
- Tenant side: create/list bookings, auto-dispatch, marketplace matching under `/api/v1/vendors/{tenant_id}/…`.
- **Note:** vendor marketplace/booking flows were exercised in earlier UAT; re-verified here only at API-surface level — flagged as *implemented but not re-verified this round*.

---

## 7. What is disabled / limited in the free pilot (plain English)

- **No real payments.** Checkout, subscriptions, paid customs checks are off (Paystack sandbox only; Flutterwave disabled).
- **Customs = estimates, not official** GRA/KRA assessments (disclaimer shown on every result).
- **Invitation-only registration** — you cannot sign up unless Operations admitted your email.
- **Emails come from `advisory@emidentity.com`** (temporary; disclosed).
- **Only Ghana & Kenya customs** are implemented — the Nigeria/Uganda/Rwanda/South-Africa/Tanzania pages are informational, not calculators.
- Not part of this pilot: driver portal, warehouse, live subscriptions.

## 8. If something goes wrong

- Use **Support** (in-app) or the public support form; describe the step that failed.
- Expected errors you might see: `403` (not admitted), `409` (email already registered), `422` (bad/missing field), `429` (rate-limited — wait and retry).
- Report anything that looks wrong; real defects are logged in the pilot defect log.

---

**Testing safety note for participants:** creating shipments, tickets, and customs estimates is safe and expected. Do **not** attempt any payment — none are enabled.

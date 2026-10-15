# Customer Guide — Accounts, Teams, Shipments, Customs & Support

Plain-English journeys for every customer type. Each was exercised end-to-end on the live pilot system using a real browser. The pilot is **invitation-only** — your email must be admitted by the Afruheritage team before you can register.

Emails during the pilot arrive from `advisory@emidentity.com` (shown in your mailbox as the sender). Afruheritage does **not** use one-time passcodes — you either sign in with a password or click a link in an email. If a guide tells you to expect an email and it does not arrive within a few minutes, check spam, then ask your Afruheritage contact.

---

## Journey 1 — Individual customer: register → sign in → dashboard

Every screenshot referenced below is in the `screenshots/` folder of this package.

### Step 1 — Open the registration page

1. In your browser, open `https://afruheritage.com`.
2. Click **Get Started** (or open `https://afruheritage.com/register` directly).
3. You see a page titled **Create your account** / **Start Your Freight Forwarding Journey**, with three social buttons at the top ("Continue with Google / Instagram / TikTok"), the divider **"OR REGISTER WITH EMAIL"**, and the email form below.
   *Screenshot: `screenshots/j01-register-form.png`*

### Step 2 — Choose your account type

Under **"I am signing up as"** there are two buttons:

- **Individual** — for personal shipping (chosen in this demo; it stays highlighted when selected).
- **Business** — for a company; selecting it reveals an extra required field, **Company Name**.

### Step 3 — Fill in the form

| Field | What to enter | Notes |
|---|---|---|
| **Full Name** | Your real name, e.g. `UAT Demo Person Two` | Required |
| **Email** | The email address that was admitted to the pilot | Must match the invited/admitted address |
| **Password** | At least 8 characters | The eye icon shows/hides what you typed |
| **Confirm Password** | Same password again | Must match exactly or you get "Passwords do not match" |
| **Company Name** | (Business only) Your company name | Only shown when **Business** is selected |

*Screenshot: `screenshots/j02-register-filled.png`*

### Step 4 — Click "Create Account"

- The button shows a spinner: **"Creating account…"** for a few seconds.
- **If your email is not admitted:** a red error banner appears — "registration is limited to invited participants" (or similar). Ask your Afruheritage contact to admit the email, then retry.
- **If the email is already registered:** the error says an account already exists — sign in or use **Forgot password**.
- **On success (tenant account):** a blocking dialog titled **"Choose Your Plan"** appears. This is normal — the account is already created at this point.

### Step 5 — "Choose Your Plan" dialog

Four plan cards are shown:

| Plan card | Price shown |
|---|---|
| **Free Trial (14 days)** | 0 GHS |
| **Starter** | 1,000 GHS/month |
| **Growth** | 2,500 GHS/month |
| **Enterprise** | 6,000 GHS/month |

1. Click a plan card — a filled radio dot marks your choice.
2. Click **Continue** (bottom right). **Cancel Registration** (bottom left) exits to the home page.
   *Screenshot: `screenshots/j03-choose-plan.png`*

> **⚠ Known pilot defect (U-004):** during the verified demo run, clicking **Continue** produced a red error banner reading `Failed to initialize payment: Unexpected token 'I', "Internal S"... is not valid JSON`. This means the plan step failed silently in the background. **What to do if this happens:** your account has still been created — close the dialog (Cancel), sign in normally, and continue. The free-trial subscription can be activated by the support team (or via the API) without payment. Paid plans are not part of the free pilot.
> *Screenshot of the failure state: `screenshots/j04-choose-template.png`*

### Step 6 — Check your email

A real welcome email arrives from `advisory@emidentity.com` with the subject **"Welcome to Afruheritage — Your Account is Ready!"**. It confirms your portal address (e.g. `your-name.afruheritage.com`) and your login email. No verification code is required — the email is informational.

### Step 7 — Sign in

1. Open `https://afruheritage.com/login`.
2. Enter **Email** and **Password**, then click **Sign In** (the button shows "Signing in…" while it works).
   *Screenshots: `screenshots/l01-login-page.png`, `screenshots/l02-login-filled.png`*
3. **Wrong password** → red banner "Incorrect email or password…". **Too many attempts** → "Too many login attempts…" — wait a minute and retry.

### Step 8 — Complete the onboarding wizard (first sign-in only)

New accounts land on **"Welcome to Afruheritage"** — a 4-step wizard shown at the top: `1 Welcome → 2 Your Role → 3 Profile → 4 Done`.

1. Read the three role cards → click **Get Started**.
   *Screenshot: `screenshots/l04-onb-welcome.png`*
2. **"What brings you to Afruheritage?"** — click the card that fits you:
   - **Personal Shipper** — badge: *Free*
   - **Delivery Driver** — badge: *KYC Required*
   - **Freight Company** — badge: *Subscription*
   Then click **Continue** (bottom right). **Back** returns to Welcome.
   *Screenshot: `screenshots/l05-onb-role.png` / `screenshots/l06-onb-role-selected.png`*
3. **"Complete your profile"** — your sign-in email is shown; confirm or correct **Full Name**, then click **Finish Setup**.
   *Screenshot: `screenshots/l07-onb-profile.png`*

### Step 9 — You are in

✅ **Success looks like:** the dashboard heading **"Welcome back, \<your name\>"** with quick-action cards — My Shipments, Create Shipment, Track Package, Support, Settings, Storefront Templates — and the left sidebar (Dashboard, Products, Shipments, Fleet, CRM, Customs Duty, Team Members, KYC, Support, Billing, Settings, Templates, Plugins, Gallery, Storefront, Profile).

*Screenshot: `screenshots/l08-dashboard.png`*

---

## Business owner

Registration is the same journey as above, except:

- At **Step 2**, choose **Business** and also fill **Company Name**.
- Your company workspace and portal address (e.g. `your-company.afruheritage.com`) are created automatically; the welcome email confirms it.

### Invite team members

1. Sign in → sidebar → **Team Members** → **Invite Member** (top right).
2. Enter their email, name, and role (e.g. Customer read-only, Driver).
3. They get an invitation email; they appear as pending in your list, then as a member after accepting. **Bulk Import CSV** exists for many invites at once.

## Company staff & drivers (accepting an invite)

1. Open the invitation email → click the accept link.
2. On the accept page, enter your **full name** and set a **password** → submit.
3. ✅ Done when the company dashboard opens. Staff cannot invite others. Invitation links are single-use and expire — ask for a fresh one if yours fails.

## Vendor

1. Open `/vendor/register`.
2. Complete the four sections: **Personal details** (name, email, phone, ID type/number), **Vehicle** (types, registration, model, year), **Business** (name, type, regions), **Agreement** (tick the three boxes).
3. Submit → confirmation shown; the team reviews (target 2–3 business days).
4. On approval, an email with a **vendor-accept** link arrives → click it → set your password → your vendor account activates.
5. ✅ Done when signing in shows your vendor profile with "approved" status and your bookings area.

## Shipments

- **Create:** sidebar → **Shipments** → **New Shipment**. Tracking Number can stay blank — one is generated (e.g. `AFR-2026-000006`). Fill cargo type, packages, weight, addresses → save.
- **Track (no login needed):** the tracking page → enter the tracking number → **Track**. Shows status, location history, ETA. A wrong number returns "not found".
- **Update status:** open a shipment and use the status controls (booked → picked up → in transit → customs → delivered).

## Customs duty calculators

1. **Customs Duty** in the sidebar (or the public calculator page).
2. Choose country (**Ghana** or **Kenya**) and import type (vehicle/goods).
3. Enter details → calculate → duty breakdown in GHS/KES.

Pilot rules: guests get **2 free estimates** per browser, then must sign in. These are estimates — not certified for paid reliance.

## Support & account recovery

- **Open a ticket:** **Support** page → "Create a Support Ticket" → name, email, subject, details → submit → keep the **tracking token** shown.
- **Check a ticket:** "Track Your Ticket" → paste the token → see replies and status.
- **Forgot password:** sign-in page → **Forgot password** → enter email → click the email link → set a new password → sign in.

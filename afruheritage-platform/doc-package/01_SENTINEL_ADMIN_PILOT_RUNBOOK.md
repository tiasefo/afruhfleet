# Sentinel Administrator Guide — Pilot Edition

Plain-English instructions for running the Afruheritage pilot from the Sentinel console. Every action listed here was exercised on the live system unless marked otherwise.

**Where:** `https://admin.afruheritage.com/sentinel/login`
**Who:** Afruheritage internal staff with an admin or super_admin account.

## Sign in

1. Open the login page, enter your **Email** and **Password**, click **Sign in**.
2. You land on the **Dashboard** — summary cards for tenants, vendors, shipments, and pending items.

## The left menu and what each page does

| Menu item | What it shows | Verified |
|---|---|---|
| Dashboard | Platform totals and pending-work summary | yes |
| Tenants | Every registered business: status, portal URL, approve/delete actions | yes |
| Shipments | All shipments across tenants with tracking history | yes |
| Tickets | Support tickets with reply and status controls | yes |
| Tracking | Public-tracking search | yes |
| Vendors | Delivery-vendor applications with review controls | yes |
| Users | Sentinel staff accounts (super_admin only can create) | yes |
| Billing | Plans, subscriptions, credit adjustments | yes |
| Payments | Payment records (test mode only) | yes |
| Control Center | Tenant feature assignments | yes |
| Feature Flags | Global and per-tenant switches | yes |
| Domains | Tenant domain records | yes |
| Diagnostics | System health and the audit log | yes |
| Analytics | Usage summaries | yes |

## Everyday tasks

### Admit a new pilot customer
There is **no Sentinel screen for this today**. The invitation-only list is managed by a developer command (`pilot_admit.sh`) which writes an entry in `logs/pilot_admissions.log`. Ask the platform team; give them the customer's email and a one-line reason. A Sentinel page for this is planned.

### Check whether a customer registered
1. Click **Tenants**, search the company name or email.
2. The row shows status and portal URL.
3. Missing = they have not finished registering, or used a different email.

### Approve an account
1. In **Tenants**, open the tenant's row.
2. Click **Approve**. Status changes; their portal is prepared.

### Manage Sentinel staff
1. Click **Users** (needs super_admin).
2. Create a user with name, email, password, role (`admin` or `super_admin`).
3. Deactivate to remove access. Admin-role users see the page but get **Forbidden** when creating users — expected.

### Review shipments
Click **Shipments** → open any row for history and notes.

### Handle support tickets
Click **Tickets** → open a ticket → read the thread, write a reply, change status.

### Review vendors
Click **Vendors** → open an application → approve or reject with a reason.

### Grant marketplace credits (no payment)
The billing area can adjust a tenant's marketplace credit balance — used for UAT and goodwill. This is audited and does not charge any card.

> Note: one billing read (`wallet detail`) currently returns a server error in Sentinel — the adjustment itself works and the balance can be confirmed from the customer API. Logged as a defect.

### Check problems
- **Diagnostics** — health checks plus the audit log (who did what, when).
- **Analytics** — usage summaries.

## Deployment note (for reviewers)

The Sentinel screens you see run from an older UI image (built 25 Aug) while the Sentinel backend runs current code — this is logged as release item R-004. Functionality verified in this guide is unaffected, but a fresh UI build is recommended before a wider rollout.

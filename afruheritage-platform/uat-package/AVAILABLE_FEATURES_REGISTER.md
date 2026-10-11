# Afruheritage — Available Features Register

**Date:** 2026-10-10
**Scope:** What customers can actually do on https://afruheritage.com today.
Every entry below was verified through the real website — not source code or API-only checks.

This register exists so that during UAT you always know whether something you see is
meant to work, meant to work with limits, coming later, or simply not part of your
user type. **Nothing on the live site should show invented records, vendors,
statistics, or schedules.** If you ever see fabricated-looking operational data,
please report it as a defect.

## Tier 1 — Fully operational (test these)

| Feature | Who can use it | What it does |
|---|---|---|
| Business registration | Public visitor | Create a freight company account — register, pick a plan/trial, pick a storefront template, get a `yourname.afruheritage.com` portal |
| Individual (personal shipper) registration | Public visitor | Create a personal account for shipping goods for yourself |
| Sign-in and onboarding wizard | New owner | Land on your company dashboard after first sign-in |
| Free trial activation | New owner | Trial activates when you pick the trial plan; billing page shows active trial |
| Team invitations | Business owner | Invite employees by email; they receive a real invitation email, set a password, and sign in to your workspace |
| Team roles | Business owner | Invited members get workspace access; read-only members cannot change settings |
| Driver records | Business owner | Add and manage drivers under Fleet |
| Vehicle records | Business owner | Add and manage vehicles under Fleet |
| Shipment creation | Business owner / individual customer | Create shipments with real reference numbers |
| Shipment lifecycle | Business owner | Move a shipment through its statuses; list updates in real time |
| Public shipment tracking | Anyone | Track a shipment by reference number — works on the main site and on company portals |
| Company portal (storefront) | Business owner | Your published `yourname.afruheritage.com` page with your branding |
| Support tickets on a company portal | Public visitor | Submit a ticket on a company's portal page; receive a confirmation email |
| Ticket tracking | Public visitor | Look up an existing ticket by its token/link |
| Password reset | Anyone | "Forgot password" → reset email → set new password → sign in |
| Welcome / invitation / reset / ticket emails | All | Real branded emails delivered to real inboxes (see SMTP report) |
| Help assistant (chat widget) | Public visitor | Answers questions; if the AI service is busy it falls back to built-in answers instead of failing |
| Customs duty calculator | Public visitor | Estimate duties on the public site |
| Tenant isolation | Automatic | One company can never see another company's shipments, fleet, or members |

## Tier 2 — Operational with restrictions

| Feature | Restriction |
|---|---|
| CRM | Basic contacts and quotes work. Advanced activity logging is deferred (Coming Soon). |
| Billing | Plan and trial selection work. Do **not** attempt real-money payments — live collection is not part of UAT. |
| Support on the main website | The support page on afruheritage.com explains that tickets are handled by the business you are working with and directs you to their portal — it does not accept tickets itself. |
| Storefront templates | Only the freight-forwarding templates are publishable. The mall/ecommerce/restaurant/booking/real-estate previews are display-only and cannot be published. |
| AI help assistant | Under load it may answer from built-in help content instead of the AI model — answers remain correct, just simpler. |

## Tier 3 — Coming Soon (visible but not usable — do not test)

See `COMING_SOON_REGISTER.md` for the full list. In short:

- Vendor marketplace & vendor registration
- Driver sign-in portal
- Shipment status email notifications
- Warehouse operations
- Dedicated analytics dashboards
- Advanced CRM activity workflows
- Additional storefront templates (preview only)
- Mobile apps (web works on mobile browsers today)

## Tier 4 — Not offered to that user type (by design)

| Capability | Not available to |
|---|---|
| Company workspace, team invites, fleet, shipments dashboard | Individual customers (they use the personal shipper flow) |
| Platform administration | All customers — this is internal (Sentinel console) |
| Changing company settings | Read-only invited employees |
| Creating shipments, seeing business data | Signed-out visitors |
| Vendor features | Everyone — vendors are Coming Soon |

*Source of truth: `AFRUHERITAGE_UAT_CHECKLIST.xlsx` sheets "UAT Checklist", "Coming Soon Register" and "User Types" — same test IDs throughout.*

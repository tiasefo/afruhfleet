# Spec — Sentinel: Plans/Pricing Drawer + Tenant Provisioning Drawer

**Both drawers live in Sentinel** (not admin-console), consistent with the earlier decision to consolidate admin functionality there. Both are `require_superuser` only — platform-wide configuration, not tenant-admin territory.

---

## Part 1 — Security fix A, final spec (for the record, so it's not lost in the thread)

`billing.py:init_payment`, `custom_domains.py:request_domain`, `custom_domains.py:get_domain_events`:
- Ignore any tenant_id supplied by the client (body or otherwise) for non-superusers. Always use `current_user.tenant_id`.
- If the supplied value (if any) differs from `current_user.tenant_id`, log a server-side audit/security event (`event_type="tenant_id_mismatch"`, include the endpoint, the authenticated user, and the spoofed value) — but do not surface anything different to the user. They just silently get their own tenant's result.
- `get_domain_events` additionally needs the ownership check added (verify the domain's `tenant_id` matches `current_user.tenant_id` before returning events) — this was missing entirely, not just misprioritized.

---

## Part 2 — Plans & Pricing Drawer

### What it replaces
Right now trial length is hardcoded in 5 different places with 2 different values (14 days in `entitlements.py`, 30 days in `billing_service.py`/`billing.py`/`payment_hub.py`). Tier limits (`max_group_members`, feature flags per tier) are a Python dict (`TIER_FEATURES` in `entitlements.py`). Both require a code change and redeploy to adjust. This replaces both with database-backed, admin-editable config.

### Data model
```python
class PlatformSettings(Base):
    """Single-row table (or key-value table if you prefer) for global,
    manually-adjusted platform settings."""
    __tablename__ = "platform_settings"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    default_trial_days: Mapped[int] = mapped_column(Integer, default=14)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)

class PlanTierConfig(Base):
    """One row per tier (starter/pro/enterprise/etc). Replaces the hardcoded
    TIER_FEATURES dict as the source of truth."""
    __tablename__ = "plan_tier_configs"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tier_code: Mapped[str] = mapped_column(String(50), unique=True)  # 'starter', 'pro', 'enterprise'
    display_name: Mapped[str] = mapped_column(String(100))
    price_monthly: Mapped[int] = mapped_column(Integer)  # store in minor units (cents/pesewas), same convention as elsewhere in billing
    max_group_members: Mapped[int] = mapped_column(Integer)
    features_json: Mapped[str] = mapped_column(Text)  # JSON list, e.g. ["ai_basic","custom_domain","shipping_estimator"]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Backend endpoints (all `require_superuser`)
- `GET /sentinel/settings/platform` — returns current `PlatformSettings` (trial days, etc.)
- `PATCH /sentinel/settings/platform` — update `default_trial_days` (and any future global settings added here)
- `GET /sentinel/settings/plan-tiers` — list all tier configs
- `PATCH /sentinel/settings/plan-tiers/{tier_code}` — update price, `max_group_members`, `features_json` for one tier

### Critical refactor this enables — fix the trial-length bug at its actual root
Every one of the 5 hardcoded trial-duration call sites (`entitlements.py`, both `billing_service.py` sites, `billing.py` model default, `payment_hub.py`) must be changed to read `PlatformSettings.default_trial_days` at the moment a subscription is created, instead of a hardcoded `timedelta(days=14)` or `timedelta(days=30)`. This is the same underlying fix as "unify the constant" from before — it's now just backed by a DB row instead of a Python constant, which is what makes it admin-editable without a deploy. **This does not replace the still-needed subscription-table-sync work (two tables can still diverge on plan_code/status) — it only fixes what value gets written for trial length.**

### Sentinel UI
A single "Plans & Pricing" page with:
- One field: "Default trial length (days)" — editable, save button. This is your promo lever — change it to run a promo, change it back manually when you're done. No scheduling, no automation, exactly as decided.
- A table of tiers (starter/pro/enterprise) with editable price, max group members, and a multi-select or checkbox list of features per tier (backed by `features_json`).

---

## Part 3 — Tenant Provisioning Drawer

### What it does
Gives you visibility into every tenant's provisioning state, surfaces Fleetbase provisioning failures with an email alert, and lets you manually trigger provisioning for any tenant — using the exact same underlying logic as the automatic path, not a separate manual implementation.

### Prerequisite: the orchestrator function (from the earlier root-cause discussion)
This drawer's "Provision Now" / "Retry" button must call `advance_tenant_lifecycle(db, tenant_id)` — the single idempotent function that checks a tenant's current state and does whatever's next (create Fleetbase org if missing, verify subdomain resolves, etc.). **Do not write a second, separate "manual provisioning" code path for this button** — that would recreate exactly the "three independent code paths that don't share logic" problem already found. The button is a UI trigger for the same function everything else calls.

### Data model
```python
class ProvisioningAlert(Base):
    __tablename__ = "provisioning_alerts"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    failure_reason: Mapped[str] = mapped_column(Text)  # exception message / Fleetbase API error
    stage: Mapped[str] = mapped_column(String(50))  # 'fleetbase_org', 'subdomain_dns', etc — whatever advance_tenant_lifecycle was attempting
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class PlatformAlertSettings(Base):
    __tablename__ = "platform_alert_settings"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    provisioning_failure_emails: Mapped[str] = mapped_column(Text)  # comma-separated, or normalize to a separate table if you want more than a couple addresses
```

### Flow
1. `advance_tenant_lifecycle` catches any exception during a provisioning step (Fleetbase API call fails, etc.), creates a `ProvisioningAlert` row instead of letting the exception silently vanish, and leaves the tenant's `launch_status` in a distinct, visible state (e.g. `provisioning_failed`, not `draft` — so it's clearly different from "hasn't tried yet").
2. On creating that alert row, send an email to every address in `PlatformAlertSettings.provisioning_failure_emails` (this is the "configure once, get every future alert" version you confirmed).
3. Sentinel's drawer lists all `ProvisioningAlert` rows where `resolved=False`, with tenant name, failure reason, stage, and a "Retry Provisioning" button.
4. "Retry Provisioning" calls `advance_tenant_lifecycle(db, tenant_id)` again. If it succeeds this time, mark the alert `resolved=True`.
5. A settings section on the same page (or a small sub-panel) lets you edit `provisioning_failure_emails` — simple text field, comma-separated, save button.

### Sentinel UI
"Tenant Provisioning" page:
- Table: all tenants with `launch_status`, `fleetbase_org_id` (or "not provisioned"), subdomain resolution status.
- A filtered/highlighted section at the top: open (unresolved) provisioning alerts, each with a "Retry Now" button.
- A small settings block: "Send provisioning failure alerts to:" — comma-separated email input, save button.

---

## What I need back from your developer before this gets built

1. Confirm `advance_tenant_lifecycle` (from the earlier root-cause spec) is being built first — this drawer depends on it existing, not the other way around. Don't build the drawer's retry button against a placeholder and then wire the real function in later; that's exactly the "API passes, nothing's really wired" pattern from earlier in this thread.
2. Confirm whether `PlatformSettings`/`PlanTierConfig` should be seeded with your current real values (14-day trial, whatever your actual current tier prices/limits are) as part of the migration, so the switchover doesn't silently reset anyone's trial length or pricing.
3. This doesn't touch or resolve the still-open two-subscription-table sync work — that's a separate, still-necessary fix, not superseded by this.


Locking in your decisions, then two things I need to nail down before this becomes a spec your developer can actually build against.
A — approved, with one addition that costs nothing on the user side. Silent override, proceed with the user's real tenant, no error shown. But add a server-side audit log entry every time this happens (security_event: tenant_id_mismatch, logged with the spoofed value, the user, the endpoint) — invisible to the user, but it means if someone's probing for this, you have a record instead of zero visibility. This is standard practice: "fail closed silently" for UX, "log everything" for you. Cheap to add, costs nothing to build differently.
B — noted, no action needed now. Consistent with the token decision earlier; secrets get treated as fully compromised and rotated fresh when you move to Vault, not before.
H — this is a real, good instinct, and it actually resolves the 14-vs-30-day bug at its root instead of just patching the two hardcoded values. You're right that "fix the constant" was the wrong-sized fix — what you actually need is a config table the admin can edit through Sentinel, not a value buried in code that requires a deploy to change. I'll spec this properly below.
Also confirmed good news on H: "no subscription auto-provisioned at signup, tenant must actively choose one, feature access is blocked with a prompt until they do" — this is already what the code does. The last report's Part 1 finding that "no subscription created at signup" wasn't actually a bug, it's your intended design, and requires_subscription + the 402-blocking gate already implement it. Nothing to fix there — I was wrong to treat it as a gap earlier. What is still a real bug, separate from this: existing tenants who already selected and paid for a subscription are still missing their tenant_subscriptions row (that's the original Part 0 crisis) — that one still needs fixing regardless of the no-auto-provision policy, since it affects tenants who did the right thing and still got broken feature gating.
I — good, concrete, and it directly answers a question I raised earlier (what should happen when Fleetbase provisioning genuinely fails) — a visible admin drawer with manual retry is exactly the right human-in-the-loop answer, better than silent auto-retry-forever or a dead-end draft state.
Before I write the full spec for H and I, two things are genuinely ambiguous in what you described and would send your developer down the wrong path if I guess wrong:what is ambigous in H and IIdentified specific ambiguities to clarify user's informed decision-makingIdentified specific ambiguities to clarify user's informed decision-makingFair question — let me spell out exactly what's underspecified in your own wording, not just wave at "it's ambiguous."
H — the promo mechanism. You said: "register for free 30 days if you [do it] in 24 hours then after we can revert it to 14 days." That sentence supports two genuinely different builds:

Reading 1: You, the admin, go into Sentinel today and flip "trial length" from 14 to 30 because you're running a promo right now. Tomorrow, or whenever you decide the promo's over, you go back in and flip it to 14 again. There's no automation — it's just an editable number, and you are the trigger for when it starts and stops.
Reading 2: You set it up once — "30-day trial for anyone who signs up between now and this exact time tomorrow" — and the system itself automatically reverts to 14 days after that deadline passes, with no further action from you.

These are very different amounts of engineering work (a single editable field vs. a scheduling system with campaign windows), and your sentence structure — "if you [x] in 24 hours then after we can revert it" — sounds like you doing the reverting, which points to Reading 1, but I didn't want to assume that and have your developer build a whole campaign-scheduling feature you didn't actually need, or build the simple version when you actually wanted real automation.
I — the alert email. You said: "admin can insert email so when the system triggers to admin console... can also trigger email." Two different things "insert" could mean:

Reading 1: A one-time setup — you go into Sentinel's settings once, type in you@company.com (or your ops team's address), save it, and from then on every future Fleetbase failure automatically emails that address with zero further action from you.
Reading 2: Every time a specific failure shows up in the drawer, there's a text box right next to that failure where you type an email address for that incident and click send — meaning you're manually deciding, case by case, who gets notified and when.

Reading 1 is "configure once, forget it" — a settings field. Reading 2 is "a manual notify-someone action per incident" — closer to a forwarding tool. Very different UI and very different backend (one is a settings table read by a background alert job; the other is an on-demand send-email endpoint triggered by a button click).
Given the pattern in this whole thread — building the wrong-shaped thing because a description was read one way when it meant the other — I'd rather get this in one shot than send your developer down a path you have to unwind.you are right and some of those things i wrote them asa conversation to you as examples to understand why i need to be able to manage everything in sentinel so for example editing pricining trial days etc should be manual reverting also manual as far as i have the drawer to do it no need for scheuled task too much engineering and also the email alert same setup the system to allow me to input amdin email so when that failure happens and it triggers i rteceibve the email alertArchitected manual admin controls for pricing, trials, and failure alertsArchitected manual admin controls for pricing, trials, and failure alertsGood, both are now unambiguous — simple manual toggle for both, no scheduling engine, no per-incident email typing. That's the smaller, faster build in both cases, which is the right call for where you are.
Here's the full spec, tying this into the orchestrator work already planned so your developer builds the manual "Provision Now" button as a UI wrapper around the same function the automatic path uses — not a second, parallel implementation of tenant provisioning that can drift from the real one.Created a file, read a fileCreated a file, read a fileOne sequencing point worth being explicit with your developer about, since it's easy to get backwards under time pressure: build the orchestrator function first, the drawer second. It's tempting to build the Sentinel UI first since it's the visible, demoable part — but if the "Retry Provisioning" button gets wired to a quick standalone script instead of the real advance_tenant_lifecycle function, you'll end up with a fourth parallel provisioning implementation, which is the exact failure pattern that got a whole root-cause document written about it earlier in this thread. The button should be the last five minutes of this work, not the first.Sentinel plans and provisioning drawer specDocument · MD we had an extensive report form the dveloipoer end to end A to H and I but you have now centered thje patching and fix on only H and I do you wnat me to bring back the report ahgain?Reconciled comprehensive coverage gaps across all nine itemsReconciled comprehensive coverage gaps across all nine itemsNo need to bring the report back — I have it in full context, I just prioritized H and I because those were the two items still waiting on a decision from you. C, D, E, F, and G were already fully resolved by your developer's investigation with clear evidence, and I should have explicitly closed those out instead of leaving them hanging while I focused on the new stuff. Let me do that now so nothing gets lost, and tie it all into one list.
C — Alembic wants to drop feature_usage, cargo_tracking_events, credit_transactions. Directive: don't drop any of them.

feature_usage: real model, actively read/written (credits.py, admin_credits.py). Alembic thinks it's missing because the table was never actually created in the DB — generate a migration that creates it, not one that drops the model reference.
cargo_tracking_events / cargo_records: no ORM model exists at all, but live route handlers hit them via raw SQL (cargo_lifecycle.py, customer_cargo_portal.py). Directive: write real SQLAlchemy models for these tables so they're under proper migration control going forward, instead of raw SQL against an ungoverned table.
credit_transactions: model exists in payment.py but was never imported in main.py, so it's invisible to the ORM/Alembic. Directive: add the import in main.py and let Alembic reconcile — don't drop a table with live data because of a missing import line.

D — redirect_status type mismatch. Directive: no action needed beyond a nullability fix. Both DB and model agree it's an integer HTTP status code; the only real drift is nullable-vs-not. Low-risk, no data corruption possible, just tidy it up in the same migration pass as C.
E — dead duplicate create_trial_subscription. Directive: delete it. Zero production callers — only a test file references it. Delete the function, update test_feature_gating.py to import from billing_service instead (where the real, used version lives). This alone removes one whole source of the two-subscription-table confusion. Leave ensure_demo_subscription alone — it's a legitimate, correctly-scoped admin-only tool, not part of the bug.
F — sync function scope, plus a new bug your developer found that I want to flag as equally important as the original crisis: credits_balance and wallet balance are two separate, never-synced numbers.
consume_credits() decrements TenantSubscription.credits_balance. The actual gating check (evaluate_subscription_state) reads billing_wallets.balance_credits instead. These can disagree — a tenant could show 1,000 credits in one place and 0 in the other, causing real feature access to be wrong in either direction. Directive: this is not a sync-function problem, it's a routing bug — consume_credits() should be rewritten to debit the wallet directly (via a new debit_wallet_credits() alongside the existing add_wallet_credits()), not write to tenant_subscriptions.credits_balance at all. Once fixed that way, there's nothing left to keep in sync on this specific field — there's only one balance. The sync function itself only needs to keep plan_code, status, and trial_ends_at aligned between the two subscription tables, confirmed as your developer proposed.
G — subdomain resolution bug. Directive: one-line fix, but check every consumer, not just the one that surfaced it. The API correctly returns id, not tenant_id — whatever tested/consumed this (frontend or test) was looking for the wrong field name. Before just adding an alias and calling it done: grep every frontend/test call site that consumes TenantContextResponse and confirm none of them are silently reading undefined/None from a tenant_id field that never existed. This bug pattern (frontend expecting a field name the backend never sent) is worth a quick sweep, not just a patch at the one place it happened to get caught.
H and I — fully specced in the last document (Sentinel Plans & Pricing drawer, Tenant Provisioning drawer), no changes needed there.
One thing worth naming across C through G together: four of five of these (C, E, F's routing bug, G) are the same shape — something exists in code with no real caller, or two things exist that look like duplicates of each other, and nobody had gone through and asked "which one is actually load-bearing." That's Root Cause 1 and 2 from the earlier refactor guide showing up again, which is a good sign in one sense — it means the four root causes I named are actually the real ones, not a guess.
Want me to consolidate all of this — A through I, plus the root-cause refactor guide — into one single master implementation checklist file your developer can work through top to bottom, so nothing gets lost across this many messages?how about A B ?Resolved previously confirmed items using consistent formattingResolved previously confirmed items using consistent formattingGood catch — I did fold those into the last document but buried them as "Part 1" instead of giving them the same clean closure as C–I. Here they are stated the same way:
A — security fix for the three tenant-ID-spoofing endpoints. Directive: confirmed, ready to implement.

billing.py:init_payment, custom_domains.py:request_domain, custom_domains.py:get_domain_events — for all non-superusers, ignore any client-supplied tenant_id (body, query, wherever) and always use current_user.tenant_id.
If a supplied value disagrees with the real one, don't error or change the response — just proceed silently using the real tenant, and write a server-side audit/security log entry (event_type="tenant_id_mismatch") capturing the endpoint, the user, and the spoofed value. Invisible to the user, visible to you if you ever need to check whether this was probed.
get_domain_events needs one more thing beyond the precedence fix: it currently has no ownership check at all — it'll return any domain's events to any authenticated user who guesses the domain_id. Add the check that the domain's tenant_id matches the requester's before returning anything.
This is fully specced and ready — no open questions left on this one.

B — secrets committed to .env in git history (Cloudflare, Paystack, Google OAuth, SMTP, social auth). Directive: no action now, by your explicit choice.

Confirmed decision: treat this the same way as the bulk-import password — real fix deferred until the Vault migration, at which point every secret gets rotated fresh rather than moved as-is. Since you're planning to destroy this server as part of that migration, carrying an exposed secret forward isn't a meaningful additional risk beyond what already exists today.
One thing worth keeping separate in your head from "deferred": the developer's .gitignore fix (adding .env so future commits stop including it) is cheap and doesn't require the Vault migration to happen first — worth doing now even though the rotation waits. It doesn't fix the history exposure, but it stops the wound from getting any bigger between now and migration day. Your call whether that's worth a two-line change today or genuinely fine to bundle into the same later pass.

Both are now fully closed out with no ambiguity left. That's A through I complete. Want the consolidated master checklist file next, pulling all nine items plus the four root causes into one document your developer can work top to bottom?

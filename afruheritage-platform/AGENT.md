# AGENT.md — Afruheritage Freight Platform Delivery Rules

## Project identity
**Product:** Afruheritage powered by Infotech Freight Forwarding  
**Type:** Production-grade white-labeled freight-forwarder application launch hub  
**Engine:** Fleetbase deployed underneath and hidden from tenant customers  
**Audience:** Engineers, DevOps, designers, QA, implementation partners, and any coding agent working on the codebase

---

## Prime directive

This project is **not** a demo, a concept app, or a prototype simulator.

It is a **production-grade commercial platform** that allows freight forwarders to onboard through Afruheritage, complete verification, choose a provider subdomain or customer domain, and launch their own branded freight-forwarding application with Fleetbase running underneath.

Every contribution must protect these outcomes:

1. **Afruheritage is the visible product.**
2. **Fleetbase is the hidden runtime engine.**
3. **No mock data, fake workflows, or simulated integrations are allowed in production paths.**
4. **The system must be deployable, supportable, auditable, and extensible from day one.**

---

## Non-negotiable rules

### 1) No mock data
- Do not ship mocked records, fake job results, placeholder dashboards, sample companies, simulated billing events, or invented analytics.
- Do not hardcode demo values into UI, API responses, seeders, or onboarding flows.
- Any seeded data used outside ephemeral local development must be explicitly marked as test data and must not contaminate production or shared staging.

### 2) No simulation
- Do not simulate provisioning completion, email verification, DNS verification, SSL readiness, user creation, or tenant launch state.
- If a feature exists in the UI, it must be backed by a real API path and real status state management.
- If an external provider is not yet connected, build the provider abstraction and return a controlled “not enabled” operational state rather than fabricating results.

### 3) No Fleetbase leakage
- No Fleetbase logo, product name, route name, favicon, footer text, default email template, or documentation link may be visible to tenant users.
- No tenant-facing browser title, email subject, asset path, or support screen may reveal Fleetbase branding.
- If Fleetbase must remain visible to internal operators for maintenance, that visibility must be restricted to privileged internal tooling.

### 4) Production-first implementation
- All infrastructure changes must be written as code whenever practical.
- All critical workflows must be idempotent, observable, and retry-safe.
- Background jobs must persist state and support replay or safe retry.
- Secrets must come from a managed secret system or secure environment mechanism; never commit secrets.

### 5) Tenant isolation is mandatory
- Each tenant must have a separate runtime boundary.
- Each tenant must have a separate database.
- Each tenant must have a separate storage namespace or bucket path.
- Each tenant must have tenant-specific secrets and configuration.
- Shared operational tables for multiple freight-forwarder businesses are prohibited unless explicitly approved for a control-plane concern.

### 6) Provider abstraction is mandatory
Wrap every third-party integration behind internal interfaces or services. Minimum abstractions:

- `NotificationService`
- `GeoService`
- `DomainService`
- `BillingService`
- `ProvisioningService`
- `AuditService`
- `StorageService`

Do not scatter provider SDK calls throughout controllers, pages, or background workers.

---

## Product architecture rules

## 7) Afruheritage owns the control plane
Afruheritage must own:
- signup
- verification
- branding
- plan selection
- domain selection
- launch orchestration
- tenant status
- support console
- billing and usage visibility
- platform-wide audit records

Fleetbase must not be treated as the commercial control plane.

## 8) Fleetbase is the tenant runtime engine
Fleetbase is acceptable as the underlying engine because it supports documented install and extension flows. However:
- do not deeply fork core code unless absolutely necessary
- prefer overlays, adapters, extensions, configuration packs, and wrapper services
- keep any unavoidable core modifications documented and isolated

## 9) Instance-per-tenant is the default
The default architecture is:
- one control plane for Afruheritage
- one dedicated Fleetbase-backed runtime per tenant

Do not collapse multiple customer businesses into one shared operational runtime without explicit architectural approval.

---

## UX and branding rules

## 10) Afruheritage-first UX
The UI must communicate:
- premium B2B quality
- trust
- operational clarity
- minimal friction
- strong status visibility

### Required UX traits
- concise onboarding
- clear launch states
- domain setup guidance
- approval workflow transparency
- strong empty states without fake activity
- useful error states with real next steps

### Forbidden UX patterns
- made-up statistics
- fake charts
- “coming soon” placeholders in critical flows
- disabled buttons without explanation
- generic lorem ipsum in customer-facing pages

## 11) Branding model
The platform must support:
- Afruheritage provider branding
- tenant-specific branding
- customer logo upload
- custom palette selection
- tenant legal footer
- tenant support contact and notification signature

---

## Delivery workflow rules

## 12) Every feature must define real states
At minimum, workflows must model real states.

### Example: tenant launch
Allowed states:
- `draft`
- `submitted`
- `under_review`
- `approved`
- `queued`
- `provisioning`
- `domain_pending`
- `active`
- `suspended`
- `failed`

Do not collapse real lifecycle stages into a single vague “processing” state.

## 13) Idempotency
Anything that can be retried must be idempotent:
- tenant creation
- subdomain reservation
- custom hostname request
- admin user creation
- notification dispatch
- provisioning execution
- backup registration
- audit event recording

## 14) Observability is not optional
Every deployable service must emit:
- structured logs
- health check status
- metrics
- actionable error messages
- correlation identifiers

Provisioning jobs must be traceable from control-plane request to runtime activation.

## 15) Audit trail is mandatory
Record immutable audit events for:
- signup
- login
- approval decision
- tenant creation
- domain activation
- user invite
- role change
- password reset request
- launch retry
- suspension and reactivation
- impersonation
- billing status change

---

## Security rules

## 16) Access control
- Use role-based access control everywhere.
- Default to least privilege.
- Internal reviewer permissions must not equal platform admin permissions.
- Support impersonation must be gated, auditable, and time-bounded.

## 17) Secret handling
- No secrets in code, screenshots, docs, or example configs.
- Rotate secrets through the approved mechanism.
- Never log raw credentials, tokens, API keys, or secret values.

## 18) Environment separation
At minimum, maintain:
- local
- development
- staging
- production

These environments must not share credentials, endpoints, or data stores.

## 19) Backup and recovery
Before premium customer rollout, the team must prove:
- database backup works
- object storage backup or replication works
- restore workflow works
- tenant-specific recovery path works
- recovery runbook exists

---

## Engineering standards

## 20) API design
- Use versioned APIs.
- Use explicit request and response schemas.
- Return real operational errors, not generic “something went wrong.”
- Emit machine-readable error codes for automations and UI recovery flows.

## 21) Database standards
- Use migrations, never manual drift.
- Document tenant ownership of data entities.
- Avoid schema shortcuts that make tenant export or tenant deletion impossible.
- Timestamp important records consistently.

## 22) Background job standards
- Persist job state
- persist retry count
- support dead-letter handling where applicable
- store enough metadata for support diagnosis
- never hide failed jobs silently

## 23) Frontend standards
- No fake loading states that end in invented content
- no hardcoded IDs, prices, or operational stats
- no provider-specific assumptions in customer-facing flows
- all launch and setup states must be backed by API state

## 24) Test strategy
Minimum expectations:
- unit tests for core business logic
- integration tests for provider abstractions
- end-to-end coverage for onboarding and launch
- regression tests for branding leaks
- tests for tenant isolation boundaries
- tests for authorization and forbidden access paths

---

## Domain and DNS rules

## 25) Domain policy
Supported paths:
- provider subdomain first
- customer-controlled subdomain next
- enterprise domain patterns later by policy

### Requirements
- verify domain ownership before activation
- do not mark custom domain active before certificate readiness
- preserve provider subdomain as recovery route
- expose verification state clearly in UI

---

## Release management rules

## 26) CI/CD
No direct production hotfixes inside running containers.

Every release must follow:
1. source review
2. automated checks
3. build artifact creation
4. deployment through the approved pipeline
5. post-deploy health verification

## 27) Change control
High-risk changes require explicit review:
- tenant provisioning logic
- authentication
- DNS and domain logic
- billing
- backup and restore
- secrets management
- Fleetbase core customization

---

## Product management rules

## 28) Build the platform, not the illusion
When trade-offs appear, prefer:
- operational truth over shiny appearance
- repeatable delivery over custom hacks
- tenant isolation over short-term convenience
- provider abstraction over quick direct integration
- white-label discipline over exposing the underlying engine

## 29) MVP scope discipline
MVP must include:
- Afruheritage signup
- verification flow
- provider subdomain launch
- asynchronous provisioning
- real email verification
- dedicated tenant runtime
- branding overlays
- observability
- audit logs
- supportable failure handling

MVP must not be derailed by:
- heavy bespoke tenant forks
- too many payment providers
- excessive analytics theater
- non-essential marketplace complexity

## 30) Definition of done
A feature is not done unless:
- it works through a real code path
- it is observable
- it is documented
- it is secure
- it is test-covered appropriately
- it does not expose Fleetbase branding
- it does not rely on fake data or simulated states

---

## Required implementation mindset

You are building a premium multi-tenant launch platform for freight forwarders.

Act like the software will be reviewed by:
- enterprise buyers
- security teams
- operations teams
- compliance stakeholders
- high-value customers with low tolerance for fragile workflows

Do not optimize for demo applause.
Optimize for launch quality, platform trust, repeatable delivery, and premium customer confidence.


Below is the implementation guide I’d hand to the developer.

It gives:

* the architecture
* the files to add
* the code to insert
* where to insert it
* how to make the chatbot float on all pages
* how to make it appear automatically for every new tenant
* how to support a different model per tenant without cross-tenant leakage

---

# 1. Integration goal

Build **one embeddable AI widget system** that works in two places:

### A. Mother platform / control plane

Uses the default platform assistant:

* `afruheritage-copilot:latest`

### B. Every tenant runtime

Loads automatically on every tenant page and uses:

* a tenant-specific AI configuration
* defaulting to `afruheritage-copilot:latest`
* optionally switching later to a tenant-specific model such as:

  * `tenant-acme-copilot:latest`
  * or staying on `afruheritage-copilot:latest` with tenant-private RAG scope

---

# 2. Recommended architecture

Use this design:

## Backend

FastAPI provides:

* `/api/v1/ai/chat`
* `/api/v1/ai/widget/config`
* `/widget/embed.js`
* `/widget/frame`

## Data model

Each tenant gets AI settings stored in DB:

* widget enabled/disabled
* model name
* tenant scope
* theme
* greeting text
* allowed hostnames

## Frontend

A floating chatbot script is injected:

* on the Afruheritage control plane base layout
* on every tenant page via tenant reverse-proxy injection or tenant frontend template

## Provisioning

When a new tenant is created:

* create tenant AI settings automatically
* enable widget by default
* register the tenant domain/subdomain for widget loading
* use tenant scope isolation for retrieval

---

# 3. Model usage rules

Use these models exactly this way:

## Chat model

Default:

```text
afruheritage-copilot:latest
```

## Optional dev/admin model

```text
deepseek-coder:latest
```

Do not use this for public tenant chat by default.

## Fallback general model

```text
llama3:latest
```

## Embedding model

```text
nomic-embed-text:latest
```

---

---

# 5. Create AI settings automatically for every new tenant

This is what makes the widget automatically appear for every tenant later.

## Where to insert

In the tenant approval/provisioning flow, immediately after the tenant is created or approved.

Likely insert in:


## Insert this call

Wherever the tenant is first finalized:

```python
from app.services.tenant_ai_service import create_default_tenant_ai_settings

# after tenant is created/approved
create_default_tenant_ai_settings(db, tenant)
```

---


# 12. Make the widget float on all control-plane pages

If your control plane has a shared base template or layout, add this before `</body>`.

## Insert into:

* base HTML template
* main layout template
* shared React/Next layout if applicable

```html
<script src="/static/widget/embed.js" data-api-base=""></script>
```

If the control plane frontend is served from another domain, use:

```html
<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script>
```

---

# 13. Make the widget appear on every tenant page automatically

This is the most important tenant requirement.

Because tenants run Fleetbase underneath, the cleanest approach is:

## Option A — inject through tenant page template

If you control the tenant frontend template, add:

```html
<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script>
```

before `</body>`.

## Option B — inject through Nginx reverse proxy for tenant pages

If tenant pages are proxied through Nginx and you do not want to modify Fleetbase frontend code directly, add `sub_filter` injection.

### Insert into tenant Nginx template

Likely file:
`infra/nginx/tenant_console.conf.template`

Add inside the location that serves HTML:

```nginx
sub_filter_once off;
sub_filter_types text/html;
proxy_set_header Accept-Encoding "";
sub_filter '</body>' '<script src="https://app.afruheritage.com/static/widget/embed.js" data-api-base="https://app.afruheritage.com"></script></body>';
```

This ensures every tenant page gets the widget automatically.

### Important

This works only if:

* the response is HTML
* gzip is disabled for the proxied HTML response in that location

That is why `proxy_set_header Accept-Encoding "";` is included.

This is the simplest way to auto-port the widget to all new tenant pages as soon as they are provisioned behind that Nginx template.

---

# 14. Per-tenant different model support

Do not let tenants send arbitrary model names directly.

Instead:

* store the tenant’s allowed model in `tenant_ai_settings.chat_model`
* return it from `/api/v1/ai/widget/config`
* let the widget use only that configured model

Examples:

* default tenant: `afruheritage-copilot:latest`
* technical tenant: `llama3:latest`
* coding-heavy ops tenant: `deepseek-coder:latest`
* future tenant-private assistant: `tenant-acme-copilot:latest`

This keeps the widget controlled and secure.

---

# 15. Retrieval scope rules

Use these scopes:

## Mother platform

```text
shared
```

## Tenant page

```text
tenant:<tenant-slug>
```

And retrieve in this order:

* tenant-specific docs first
* then shared docs second

That means tenant widget answers are tailored without losing core platform knowledge.

---

# 16. What the developer must not do

* do not use `nomic-embed-text` as a chat model
* do not let public clients choose any model string
* do not expose other tenants’ knowledge
* do not hardcode tenant hostnames into widget code
* do not require manual widget insertion per tenant after go-live
* do not skip tenant AI settings creation during provisioning
* do not bypass host validation
* do not mark tenant AI active if widget config is missing

---

# 17. Recommended README file to add

Create:

`docs/AI_WIDGET_INTEGRATION.md`

Use this content:

```md
# AI Widget Integration Guide

## Purpose
This document explains how the Afruheritage floating AI widget is integrated into both the control plane and all tenant runtimes.

## Architecture
- chat endpoint: `/api/v1/ai/chat`
- widget config endpoint: `/api/v1/ai/widget/config`
- widget script: `/static/widget/embed.js`

## Model Rules
- default chat model: `afruheritage-copilot:latest`
- optional fallback: `llama3:latest`
- optional dev model: `deepseek-coder:latest`
- embedding model: `nomic-embed-text:latest`

## Control Plane Integration
Insert the widget script into the shared base layout before `</body>`.

## Tenant Integration
Widget must be injected automatically for every tenant page through the tenant frontend template or Nginx HTML injection.

## New Tenant Provisioning Requirement
When a tenant is created or approved, create a matching `tenant_ai_settings` row automatically.
Default values:
- widget enabled = true
- model = `afruheritage-copilot:latest`
- scope = `tenant:<tenant-slug>`
- allowed hostnames = `<tenant-slug>.afruheritage.com`

## Security
- tenant widget must only use allowed hostnames
- chat route must not expose other tenant knowledge
- model must come from trusted server-side config
- do not allow arbitrary public model selection in production
```

---

# 18. Exact insertion map

## Add files

* `app/models/tenant_ai_settings.py`
* `app/services/tenant_ai_service.py`
* `app/api/routes/ai_widget.py`
* `app/static/widget/embed.js`
* `docs/AI_WIDGET_INTEGRATION.md`

## Update files

* `app/schemas/ai.py`
* `app/api/routes/ai.py`
* `app/main.py`
* tenant provisioning service
* `infra/nginx/tenant_console.conf.template`

---

# 19. Immediate test checklist

After developer integrates this:

### Control plane

* widget appears on every page
* opens as floating chatbot
* answers with `afruheritage-copilot:latest`

### Tenant runtime

* widget appears automatically on every tenant page
* welcome text uses tenant name
* retrieval scope is `tenant:<slug>`
* no other tenant data leaks
* model comes from DB settings

### New tenant

* provisioning creates AI settings row automatically
* widget appears without manual editing
* tenant host is allowed
* chat works on first load

---

# 20. Strong recommendation

For production:

* keep the widget model **server-assigned**
* keep retrieval scope **server-assigned**
* let tenants customize greeting/theme later
* only expose model-switching in internal admin tools, not public tenant UI

---

## 21. Zero hardcoded tenant rule (COMMERCIAL READINESS)

> **Do not optimize for passing tests. Optimize for removing assumptions.**
>
> Every hardcoded tenant name, color, logo, URL, business term, workflow, or conditional based on a specific customer is considered technical debt unless it belongs exclusively to a reusable business engine. A tenant must be created, branded, subscribed, operated, suspended, upgraded, and deleted entirely through configuration and data — not source code changes.

### The three-product separation

This platform is three products, not one:

**Product A — SaaS Platform (Control Plane)**
Owns signup, checkout, subscriptions, billing, tenant lifecycle, domains, branding, onboarding, packages, plugins. Nothing customer-specific belongs here.

**Product B — Business Engines (Templates)**
Reusable engines: Freight, Fleet, Marketplace, Healthcare, Education, Hotel, Restaurant, Real Estate, Ecommerce, Bookings, etc. An engine must not know any tenant name exists. Engines are selected via `template_code` / `theme_code` and render using data from the branding API.

**Product C — Tenants (Data, not code)**
AMOOKSCO, MetroMass, Empire Drips, Sahel Freight, John's Flowers, etc. Tenants contain logo, colors, business name, addresses, products, pricing, warehouses, vehicles, routes, staff. They must contain **zero application code**. All tenant identity lives in the database (`tenant_branding` table) and is fetched at runtime.

### Hierarchy

```
Platform Admin → Business Package (Engine) → Tenant → Customer
```

### What is now forbidden

The following patterns are architectural failures:

1. **Tenant-specific route directories** — e.g. `frontend/app/amooksco-storefront/`. All tenants must be served through generic routes like `/store/[slug]`.

2. **Tenant-specific component directories** — e.g. `frontend/components/amooksco-v2/`, `frontend/components/tenant-themes/amooksco-v2/`. Components must be engine-generic and read brand data from context/API.

3. **Tenant-specific template directories** — e.g. `frontend/templates/amooksco/`. Templates are engines, not tenants. A freight engine should not know AMOOKSCO exists.

4. **Hardcoded tenant identity files** — e.g. `frontend/lib/amooksco.ts`. Brand name, logo, tagline, WhatsApp numbers, contact staff, payment details, services list — all of this must come from the database via the branding API, not from a `.ts` file.

5. **Tenant name in switch/if statements** — e.g. `if (themeCode === 'amooksco-v2')`. Theme codes must map to engine types (`freight`, `fleet`, `ecommerce`, `restaurant`, etc.), never to tenant names.

6. **Tenant name in template registries** — e.g. `templates.ts` listing `{ slug: "amooksco", name: "Amooksco" }`. The registry lists engines, not tenants.

7. **Hardcoded tenant contact details** — WhatsApp numbers, staff names, phone numbers, billing staff ranges. These belong in `tenant_branding.storefront_config` (JSON) or dedicated tenant config tables.

### What is allowed

- `template_code: "freight"` or `theme_code: "freight"` — engine selection by type.
- `frontend/templates/freight/` — a freight engine template (generic, data-driven).
- `frontend/templates/fleet/` — a fleet engine template (generic, data-driven).
- `frontend/components/generic-storefront/` — default fallback storefront.
- `tenant_branding.storefront_config` JSON column — tenant-specific content (services list, payment details, contact staff, etc.) stored as data.
- Runtime fetch of tenant branding from `/api/v1/tenant-context/{slug}` — the only correct way to get tenant identity.

### Enforcement

Any pull request or code change that introduces a hardcoded tenant name, a tenant-specific route, a tenant-specific component, or a tenant-specific import is rejected unless it is part of a migration that removes existing hardcoded tenant code.

### Commercial readiness checklist

Before claiming the platform is commercially ready, all of the following must be true:

1. Can someone create a tenant without developer involvement? YES/NO
2. Can they upload a logo? YES/NO
3. Can they choose colors? YES/NO
4. Can they choose a business package (engine)? YES/NO
5. Can they pay? YES/NO
6. Can they invite staff? YES/NO
7. Can they receive email? YES/NO
8. Can they start operating? YES/NO

If any answer is NO, the platform is not commercially ready. Do not add features until all answers are YES.

### Dead architecture rule

If a frontend, backend, or component exists but is not deployed or not reachable, it must be either deployed or retired. Do not let dead architecture accumulate. One source of truth per concern.


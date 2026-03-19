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

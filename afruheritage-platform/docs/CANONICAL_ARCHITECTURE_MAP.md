# Afruheritage Canonical Architecture Map

## Purpose
This document identifies the operational architecture currently implemented in this repository, marks canonical source-of-truth paths, and lists transitional overlaps that should be consolidated.

## System Topology
- Control plane API: FastAPI app composition and router mounting in app/main.py.
- Background jobs: Celery worker entry in app/tasks/celery_app.py and provisioning task in app/tasks/provisioning.py.
- Data plane: PostgreSQL via SQLAlchemy in app/db/session.py.
- Queue and rate-limit backing services: Redis (docker-compose.yml).
- Frontend app: Next.js app under frontend/app.
- Separate admin service: admin-console service proxying control-plane APIs.

## Canonical Runtime Flow
1. API startup
- FastAPI instance creation in app/main.py.
- Router assembly in app/main.py.
- Health endpoint in app/main.py.
- Startup schema safety patch in app/db/runtime_migrations.py.

2. Authentication and tenant access control
- JWT decode and user resolution in app/api/deps.py.
- Tenant access guard by tenant_id path/query checks in app/api/deps.py.
- Signup tenant-context auto-assignment in app/services/signup_onboarding_service.py.

3. Tenant onboarding and launch orchestration
- Canonical tenant lifecycle endpoints in app/api/routes/tenants.py.
- Runner selection strategy in app/services/runner_selection.py.
- Provisioning task dispatch in app/api/routes/tenants.py.
- Async provisioning state machine in app/tasks/provisioning.py.
- Remote Fleetbase installation over SSH in app/services/fleetbase_provisioner.py.

4. Billing and subscription management
- Canonical subscription, wallet, and billing payment tables in app/models/billing.py.
- Billing API endpoints in app/api/routes/billing.py.
- Billing service business logic in app/services/billing_service.py.

5. Infrastructure and deployment
- Runtime services and ports in docker-compose.yml.
- Runner installation and launch process in docs/DEPLOYMENT.md.

## Source-of-Truth Matrix

### Tenant lifecycle and provisioning
- Canonical:
	- app/api/routes/tenants.py
	- app/tasks/provisioning.py
	- app/services/fleetbase_provisioner.py
	- app/services/runner_selection.py
- Transitional overlap to consolidate:
	- app/api/routes/tenant_creation.py
	- app/services/tenant_creation_service.py

Decision:
- Keep the async queued job flow in app/api/routes/tenants.py as canonical.
- Decommission or internally refactor tenant_creation flow to call the canonical launch path only.

### Billing and payments
- Canonical:
	- app/models/billing.py
	- app/api/routes/billing.py
	- app/services/billing_service.py
- Transitional overlap to consolidate:
	- app/models/payment.py
	- app/api/routes/payments.py
	- platform_payment_service-based flow for overlapping use cases

Decision:
- Keep billing.py model set and billing routes as canonical subscription/wallet/payment domain.
- Merge or isolate platform payments so a single payment ledger remains authoritative for finance and audit.

### Tenant identity and isolation
- Canonical:
	- app/api/deps.py
	- app/services/signup_onboarding_service.py
	- tests/test_tenant_isolation.py

Decision:
- Preserve current auth tenant guard and continue expanding isolation tests around every tenant-scoped route.

## Known Architecture Risks
1. Parallel provisioning paths
- Risk: lifecycle divergence, inconsistent status transitions, and support confusion.
- Impact: high.

2. Parallel payment ledgers
- Risk: payment truth split between billing_payments and payment_records.
- Impact: high.

3. Mixed migration strategy
- Risk: schema drift between Alembic and runtime SQL patching.
- Impact: medium to high.

4. Router sprawl in a single composition file
- Risk: reduced discoverability and coupling growth in app/main.py.
- Impact: medium.

## Consolidation Plan
1. Provisioning unification
- Mark app/api/routes/tenant_creation.py endpoints as internal or deprecated.
- Route all launch behavior through app/api/routes/tenants.py launch endpoint semantics.
- Keep one state machine: pending_verification -> approved -> queued -> provisioning -> active or failed.

2. Billing unification
- Choose one payment table family as finance source-of-truth.
- Migrate all verification and webhook writes to that model.
- Keep a single reference format and idempotent verification path.

3. Migration discipline
- Move runtime migration changes into explicit Alembic revisions.
- Keep startup runtime migration only for backward-compatible emergency guards.

4. Module boundaries
- Add route module index docs grouped by domain.
- Keep app/main.py focused on app assembly and move ad hoc imports to route package init where practical.

## Validation Signals
- Core tenant and auth tests:
	- tests/test_tenants.py
	- tests/test_auth.py
	- tests/test_tenant_isolation.py
	- tests/test_health.py
- Supplemental scenario tests:
	- test_tenant_lifecycle.py
	- test_complete_features.py
	- focused_smoke_test.py
	- smoke_test.py

## Recommended Immediate Next Steps
1. Freeze canonical ownership in docs and PR template checks.
2. Open a consolidation epic for tenant_creation path retirement.
3. Open a consolidation epic for payments ledger unification.
4. Add migration policy note requiring Alembic-first for non-emergency schema changes.


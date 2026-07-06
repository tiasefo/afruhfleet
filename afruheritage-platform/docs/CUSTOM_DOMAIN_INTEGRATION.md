# Custom Domain Integration Guide

**Last updated:** Jul 6, 2026 — hybrid Cloudflare + manual DNS mode implemented.

## Overview

Tenants can use their own custom domain (e.g., `portal.mycompany.com` or `mycompany.com`) instead of the platform-provided subdomain (`mycompany.afruheritage.com`). The system uses a **hybrid approach**:

- **When Cloudflare is configured** → Cloudflare for SaaS handles SSL, proxying, and verification automatically.
- **When Cloudflare is NOT configured** → Manual DNS mode: the platform generates DNS records, the tenant adds them at their registrar, and the platform verifies via direct DNS lookups (`dnspython`).

In **both cases**, the tenant sees the same UI: enter domain → get DNS records → add them → click Verify → domain goes active.

## How It Works

### Cloudflare for SaaS Mode

1. You have `afruheritage.com` on your Cloudflare account (one-time setup).
2. Tenant owns `acmeco.com` (registered anywhere — GoDaddy, Namecheap, etc.).
3. Tenant enters `acmeco.com` in their dashboard Settings → Custom Domain.
4. Platform calls Cloudflare API → creates a "custom hostname" for `acmeco.com`.
5. Cloudflare returns the DNS records the tenant needs to add at **their** registrar.
6. Tenant adds a CNAME: `acmeco.com → afruheritage.com`.
7. Cloudflare detects the CNAME, issues an SSL certificate automatically, and proxies traffic.
8. Celery task `poll_domain_verification` polls Cloudflare every 5 min until active — **zero manual admin work**.

### Manual DNS Mode (fallback, no Cloudflare needed)

1. Tenant enters `acmeco.com` in their dashboard.
2. Platform generates DNS records:
   - **TXT record** for ownership verification (`_afruheritage-verify.acmeco.com → "afruheritage-verify=abc123..."`)
   - **CNAME record** for routing (`acmeco.com → afruheritage.com`) or **A record** for apex domains
   - **MX records** for email (optional, if `enable_email=true`)
3. Tenant copies these records to their DNS provider.
4. Tenant clicks "Verify Now" → platform does DNS lookups via `dnspython` (queries Google DNS 8.8.8.8, Cloudflare DNS 1.1.1.1, OpenDNS 208.67.222.222).
5. Once TXT + CNAME verified → domain auto-activates.
6. **Note:** In manual mode, SSL and nginx reconfiguration must be handled separately (Let's Encrypt / Certbot).

## API Endpoints

### Tenant Self-Service (auto-resolves tenant from auth user)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/domains/request-simple` | Request a new custom domain. Body: `{ hostname, enable_email }`. Auto-resolves tenant from JWT. |
| `GET` | `/api/v1/domains/my-domains` | List all custom domains for the authenticated user's tenant. |
| `GET` | `/api/v1/domains/{domain_id}/dns-instructions` | Get the DNS records (TXT, CNAME/A, MX) the tenant needs to add. |
| `POST` | `/api/v1/domains/{domain_id}/verify` | Verify DNS records and auto-activate if all checks pass. |
| `GET` | `/api/v1/domains/{domain_id}/refresh-status` | Poll Cloudflare for latest SSL/verification status. |

### Legacy Endpoints (kept for backward compatibility)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/domains/request` | Request domain (requires `tenant_id` query param). |
| `GET` | `/api/v1/domains/tenant/{tenant_id}` | List domains for a specific tenant. |
| `POST` | `/api/v1/domains/activate` | Manually activate a domain (superuser only). |
| `POST` | `/api/v1/domains/{domain_id}/fail` | Mark a domain as failed (superuser only). |
| `GET` | `/api/v1/domains/{domain_id}/events` | Get domain event history. |
| `GET` | `/api/v1/domains/settings/{tenant_id}` | Get tenant domain settings. |

### Public Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/domains/resolve?hostname=` | Resolve any hostname to a `tenant_id`. Used by Next.js middleware. |

## Data Models

### `CustomDomain` (`custom_domains` table)

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | FK to `tenants.id` |
| `hostname` | str | The custom domain (e.g., `acmeco.com`) |
| `domain_type` | enum | `customer_domain`, `provider_subdomain`, `platform_subdomain`, `customer_subdomain`, `apex` |
| `status` | enum | `requested` → `pending_verification` → `pending_ssl` → `active` / `failed` / `disabled` / `removed` |
| `provider` | enum | `cloudflare` or `internal` |
| `verification_method` | enum | `txt`, `cname`, `http`, `none` |
| `verification_name` | str | DNS name for the TXT record |
| `verification_value` | str | DNS value for the TXT record (the verification token) |
| `ssl_status` | str | SSL certificate status (Cloudflare mode) |
| `cloudflare_hostname_id` | str | Cloudflare custom hostname ID |
| `fallback_hostname` | str | Platform subdomain (always active as fallback) |
| `last_error` | str | Error message if verification failed |

### `TenantDomainSettings` (`tenant_domain_settings` table)

| Field | Type | Description |
|-------|------|-------------|
| `tenant_id` | UUID | FK to `tenants.id` (unique) |
| `platform_subdomain` | str | e.g., `amooksco.afruheritage.com` |
| `active_primary_hostname` | str | Currently active hostname (custom domain or platform subdomain) |
| `fallback_hostname` | str | Always-active fallback |
| `fallback_always_active` | bool | Whether fallback stays active even when custom domain is primary |

### `Tenant` model additions

When a domain is activated, the `Tenant` model is updated:
- `tenant.custom_domain` = the hostname
- `tenant.custom_domain_verified` = `True`

## Files

### Backend

| File | Role |
|------|------|
| `app/services/dns_verification.py` | DNS record generation + `dnspython`-based verification (TXT, CNAME, MX lookups against public DNS resolvers) |
| `app/services/custom_domain_service.py` | Domain lifecycle: request, verify, activate, fail. `get_dns_instructions()`, `verify_and_activate_domain()` |
| `app/services/cloudflare_domains.py` | Cloudflare API client (create custom hostname, poll status, purge cache) |
| `app/api/routes/custom_domains.py` | 12 API endpoints (5 new self-service + 6 legacy + 1 public resolve) |
| `app/schemas/custom_domains.py` | Pydantic schemas: `DomainRequestSimple`, `DNSInstructionsResponse`, `DNSVerificationResult`, etc. |
| `app/models/custom_domains.py` | SQLAlchemy models: `CustomDomain`, `CustomDomainEvent`, `TenantDomainSettings` |
| `app/tasks/domain_verification.py` | Celery task: `poll_domain_verification` — auto-polls Cloudflare every 5 min |

### Frontend

| File | Role |
|------|------|
| `frontend/lib/api.ts` | `domainsAPI` object with `myDomains`, `requestSimple`, `dnsInstructions`, `verify`, `refreshStatus` |
| `frontend/app/settings/page.tsx` | Custom Domain settings UI in tenant dashboard — domain request, DNS instructions display, Verify Now button |

## Environment Variables

### Cloudflare (optional — enables automatic SSL + proxying)

```
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id
# OR (legacy auth):
CLOUDFLARE_API_KEY=your-api-key
CLOUDFLARE_API_EMAIL=your-email
```

When these are NOT set, the system falls back to manual DNS mode automatically.

### Python dependency

```
dnspython==2.7.0  # in requirements.txt
```

## Domain Status Lifecycle

```
requested → pending_verification → pending_ssl → active
                ↓                                  ↑
              failed ─────────────────────────────-─┘ (retry via verify)
```

- `requested`: Domain requested, Cloudflare hostname creation pending
- `pending_verification`: DNS records generated, waiting for tenant to add them
- `pending_ssl`: DNS verified, SSL certificate being provisioned (Cloudflare mode)
- `active`: Domain is live, traffic routed correctly, SSL active
- `failed`: Verification failed or timed out (Celery retries for ~10 hours)
- `disabled`: Temporarily disabled by admin
- `removed`: Domain removed by tenant/admin

## Frontend UX Flow

1. Tenant admin goes to **Settings → Custom Domain**
2. Sees their platform subdomain (e.g., `amooksco.afruheritage.com`) — always active
3. Enters custom domain (e.g., `portal.mycompany.com`)
4. Clicks **Request** → DNS records appear immediately with copy buttons
5. Tenant copies each record to their DNS provider
6. Clicks **Verify Now** → system checks DNS propagation
7. If verified → domain status changes to **Active**, `Tenant.custom_domain` updated
8. If not yet propagated → message: "DNS records not yet propagated. Please wait and try again."
9. Tenant can also click **Refresh** to poll Cloudflare status (Cloudflare mode)

## Notes

- All tenants keep their `*.afruheritage.com` fallback hostname — always active
- Custom domains are available for all plan tiers
- The Celery task `poll_domain_verification` handles automatic Cloudflare verification (retries every 5 min for ~10 hours)
- In manual mode, the tenant must click "Verify Now" to trigger DNS lookups (no background polling)
- MX records for email are optional (`enable_email` flag in the request)
- Apex domains get A record instructions instead of CNAME (with ALIAS/ANAME note)

## Smoke Test Results (Jul 6, 2026)

All 12 custom domain endpoints verified against live server (port 8001, Postgres :5433):

| # | Endpoint | Method | Status | Result |
|---|----------|--------|--------|--------|
| 1 | `/domains/resolve?hostname=test.com` | GET | 404 | Correct — unknown hostname |
| 2 | `/domains/resolve?hostname=smoketest.afruheritage.com` | GET | 200 | Resolved to tenant_id, source=custom_domain |
| 3 | `/domains/my-domains` (superuser, no tenant) | GET | 400 | Correct — "User is not associated with a tenant" |
| 4 | `/domains/tenant/{tenant_id}` | GET | 200 | Listed platform subdomain + custom domain |
| 5 | `/domains/settings/{tenant_id}` | GET | 200 | Returned TenantDomainSettings after domain request |
| 6 | `/domains/request?tenant_id={id}` | POST | 200 | Created domain, status=pending_verification, manual DNS mode |
| 7 | `/domains/{id}/dns-instructions` | GET | 200 | Returned TXT + CNAME records with instructions_text |
| 8 | `/domains/{id}/verify` | POST | 200 | Correct — DNS not propagated, returned verification details |
| 9 | `/domains/{id}/refresh-status` | GET | 200 | Returned current domain status |
| 10 | `/domains/{id}/events` | GET | 200 | Returned 2 events: domain_requested, manual_dns_pending |
| 11 | `/domains/activate` | POST | 200 | Manually activated domain (superuser), status→active |
| 12 | `/domains/{id}/fail` | POST | 200 | Marked domain as failed (superuser), status→failed |

### Bugs Fixed During Smoke Test

1. **Missing DB columns** — `redirect_to`, `redirect_status`, `auto_renew`, `expires_at`, `renewed_at` existed in the SQLAlchemy model but not in the database, causing 500 errors on every `CustomDomain` query. Fixed via `ALTER TABLE` and Alembic migration `20260706_01`.

2. **Legacy `POST /domains/request` ignored `tenant_id`** — The endpoint accepted `tenant_id` as a query parameter but used `current_user.tenant_id` instead (which is `None` for superusers). Fixed to use `current_user.tenant_id or tenant_id or request.tenant_id`.

3. **`GET /domains/{id}/events` queried wrong column** — Filtered by `CustomDomainEvent.id` (primary key) instead of `CustomDomainEvent.domain_id` (foreign key), so events for a domain would never be found unless the domain_id happened to match an event's primary key. Fixed.

4. **Unused required `tenant_id` query params** — `POST /domains/activate`, `POST /domains/{id}/fail`, and `GET /domains/{id}/events` all required a `tenant_id` query parameter that was never used. Removed the parameter so callers no longer need to pass it.

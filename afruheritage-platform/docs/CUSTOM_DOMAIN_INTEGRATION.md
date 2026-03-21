# Custom Domain Integration Guide

## Locked decisions
- apex domains supported from day one
- fallback Afruheritage domain remains active
- custom domains available for all tiers
- Cloudflare is the first implementation provider

## What this scaffold adds
- domain request model
- domain events
- tenant domain settings
- Cloudflare custom-hostname client
- request/activate/fail/list endpoints
- fallback hostname preservation

## Routes
- `POST /api/v1/domains/request`
- `GET /api/v1/domains/tenant/{tenant_id}`
- `POST /api/v1/domains/activate`
- `POST /api/v1/domains/{domain_id}/fail`
- `GET /api/v1/domains/{domain_id}/events`
- `GET /api/v1/domains/settings/{tenant_id}`

## Notes
- all tenants still keep their Afruheritage fallback hostname
- active primary hostname can switch to the customer domain
- Cloudflare custom hostname creation is attempted when configured
- manual activation endpoint exists for first-implementation operations

## Required env vars
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`

## Manual follow-up
- add Alembic migrations
- map tenant slug properly instead of using placeholder fallback in route
- integrate domain setup into tenant provisioning workflow
- add webhook/status poller for Cloudflare hostname validation/SSL
- update Nginx/edge routing to honor active_primary_hostname

# Support + GLPI + CRM Integration Guide

## Locked decisions
- one shared GLPI with tenant separation
- CRM includes quotes and opportunities from day one
- public ticket intake allowed without login
- GLPI remains the main staff console

## What this scaffold adds
- tenant-scoped CRM accounts
- tenant-scoped CRM contacts
- opportunities
- quotes
- public support tickets
- public ticket replies/messages
- GLPI sync client and sync log
- API routes for core support/CRM operations

## Routes
- `POST /api/v1/support-crm/accounts`
- `POST /api/v1/support-crm/contacts`
- `POST /api/v1/support-crm/opportunities`
- `POST /api/v1/support-crm/quotes`
- `POST /api/v1/support-crm/public/tickets`
- `GET /api/v1/support-crm/public/tickets/{public_token}`
- `GET /api/v1/support-crm/public/tickets/{public_token}/messages`
- `POST /api/v1/support-crm/public/tickets/{public_token}/reply`

## GLPI notes
- shared GLPI instance
- tenant separation should be implemented through entity mapping and sync rules
- staff continues to work in GLPI
- Afruheritage stores ticket metadata, public access token, sync logs, and customer-facing thread

## Required env vars
- `GLPI_BASE_URL`
- `GLPI_APP_TOKEN`
- `GLPI_USER_TOKEN`
- `GLPI_TENANT_SEPARATION_MODE=shared_entities`

## Manual follow-up
- add Alembic migrations
- map tenant_id -> GLPI entity id
- add internal sync jobs for GLPI comment/status backfill
- connect tickets to shipment/tracking entities when those modules are scaffolded
- add tenant/customer portal UI for CRM and public ticket pages

# Storefront Template System — TODO

## Status: Backend + Frontend complete

## Backend (DONE)
- [x] Model: `app/models/storefront_template.py` — StorefrontTemplate table
- [x] Branding link: `app/models/tenant_branding.py` — template_code + storefront_config fields
- [x] Routes: `app/api/routes/storefront_templates.py` — all 6 endpoints
- [x] Router mounted in `app/main.py:194`
- [x] 6 default templates: Azure Cloud, AWS Console, ServiceNow, Jira Work, Okta Identity, Google Cloud

## SaaS Frontend (port 3000) — DONE
- [x] `/templates` gallery page — fetches live data
- [x] `/templates/[slug]` — template detail page with live preview mockup + select button
- [x] `/admin` page template CRUD tab
- [x] Register form template picker

## Sentinel Admin Console (port 3001) — DONE
- [x] Templates page at `sentinel/frontend/app/dashboard/templates/page.tsx`
- [x] Backend route: `sentinel/sentinel_app/api/routes/templates.py`
- [x] Control plane client functions in `sentinel/sentinel_app/services/control_plane_client.py`
- [x] "Templates" nav link in sidebar
- [x] Template selector drawer in tenant detail page

## Admin Console (port 3001/4000) — DONE
- [x] Templates page at `admin-console/frontend/app/dashboard/templates/page.tsx`
- [x] Backend route: `admin-console/admin_app/api/routes/templates.py`
- [x] Control plane client functions in `admin-console/admin_app/services/control_plane_client.py`
- [x] "Templates" nav link in sidebar
- [x] Template selector drawer in tenant detail page

## Bulk Import Fix (DONE)
- [x] PostgreSQL `userrole` enum updated with all 10 roles
- [x] Null email guard — rows without email or numeric phone skipped with error
- [x] Import page updated — removed invite checkbox, added credentials info box
- [x] Verified: users created, duplicate detection works, login works

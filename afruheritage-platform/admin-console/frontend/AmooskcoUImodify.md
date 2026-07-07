# Amooksco UI Modification TODO

## Overview
This document lists all features that need to be implemented or modified for the Amooksco tenant storefront, organized by priority and API availability.

## Priority 1: Content Tenants Can MODIFY (Drawer in Tenant Admin Controls)
*Features where tenants can add/edit their own content*

### New Arrivals
- **Feature**: New Arrivals Management
- **Backend API**: `/api/v1/new-arrivals` (GET, POST, PATCH, DELETE)
- **Fleetbase API**: None
- **Status**: ⚠️ Static (hardcoded in Notices component)
- **Requirements**: 
  - Wire Notices component to `/api/v1/new-arrivals`
  - Create `/new-arrivals` page
  - Tenant can add/edit/delete their own new arrivals
  - Fields: name, description, image_url, price, stock_quantity, status, featured, display_order

### Gallery
- **Feature**: Image Gallery Management
- **Backend API**: `/api/v1/gallery` (GET, POST, PATCH, DELETE, /upload)
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create gallery UI
  - Tenant can upload/manage their own gallery images
  - Fields: media_url, media_type (image/video), caption, order, active

### Branding
- **Feature**: Branding Configuration
- **Backend API**: `/api/v1/branding/{tenant_id}` (GET, POST, PATCH, /logo)
- **Fleetbase API**: None
- **Status**: ✅ Available (API exists)
- **Requirements**: 
  - Create branding UI in Tenant Admin
  - Tenant can modify: company_name, tagline, logo, favicon, colors (primary, secondary, accent, background)
  - Contact info: support_email, support_phone, support_url
  - Legal: legal_company_name, legal_footer_text, terms_url, privacy_url
  - Settings: default_language, supported_languages, maps_enabled, public_tracking_enabled, csv_import_enabled, group_members_enabled, template_code, storefront_config, pseudo_email_domain

### About Page
- **Feature**: About Page Content
- **Backend API**: None (endpoint does not exist - needs to be created or integrated with branding)
- **Fleetbase API**: None
- **Status**: ❌ Missing (NO ENDPOINT EXISTS)
- **Requirements**: 
  - Create `/about` page
  - Add endpoint for about page content (or integrate with existing `/api/v1/branding/{tenant_id}`)
  - Tenant can edit their company description, history, team info
- **Verification**: ❌ No endpoint found - needs new API route

---

## Priority 2: Platform Features Tenants USE (Not Modify)
*Features tenants can access but cannot change the platform logic*

### Billing & Subscription Management
- **Feature**: View/Manage Subscription
- **Backend API**: `/api/v1/billing`, `/api/v1/billing/plans`, `/api/v1/billing/subscription`
- **Fleetbase API**: None
- **Status**: ❌ Missing UI
- **Requirements**: 
  - Create billing management UI in Tenant Admin
  - Tenant can: view current plan, upgrade/downgrade, cancel, view billing history, manage payment methods, view credit usage
  - Platform controls: plan definitions, pricing, features per plan

### Support System
- **Feature**: Support Tickets
- **Backend API**: `/api/v1/support-crm`
- **Fleetbase API**: None
- **Status**: ❌ Mock
- **Requirements**: 
  - Wire Support Form to `/api/v1/support-crm`
  - Tenant can: submit tickets, view their tickets
  - Platform controls: ticket routing, escalation, SLA

### Customer Portal
- **Feature**: Customer Dashboard
- **Backend API**: `/api/v1/customer-portal`, `/api/v1/customer-shipments`, `/api/v1/customer-cargo-portal`
- **Fleetbase API**: `/api/v1/fleetbase-tenant-proxy/*`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create customer portal UI
  - Tenant customers can: view their shipments, manage cargo
  - Platform controls: portal logic, data access rules

### Bulk Import Members
- **Feature**: Bulk Import Members
- **Backend API**: `/api/v1/users/bulk-import`, `/api/v1/users/bulk-import/preview`
- **Fleetbase API**: None
- **Status**: ⚠️ Separate (available at `/members/import`)
- **Requirements**: 
  - Add link to bulk import in Tenant Admin
  - Tenant can: upload CSV/XLSX, preview data, system auto-creates users
  - Platform controls: import logic, pseudo-email generation, default password

### Bulk Import Shipments
- **Feature**: Bulk Import Shipments
- **Backend API**: `/api/v1/shipments/{tenant_id}/import/csv`
- **Fleetbase API**: None
- **Status**: ⚠️ Separate (available at `/shipments/import`)
- **Requirements**: 
  - Add link to bulk import in Tenant Admin
  - Tenant can: upload CSV/XLSX, preview data, system auto-creates shipments
  - Platform controls: import logic, data validation, matching logic

### Customs Calculator
- **Feature**: Customs Duty Calculator
- **Backend API**: `/api/v1/customs`, `/api/v1/customs-guest`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create customs calculator UI
  - Tenant can: calculate duties, vehicle valuation
  - Platform controls: duty rates, calculation logic, external APIs

### Product Catalog
- **Feature**: Product Catalog
- **Backend API**: `/api/v1/products`, `/api/v1/products/categories`
- **Fleetbase API**: `/api/v1/fleetbase-proxy/products`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create product catalog UI
  - Tenant can: manage their products, categories
  - Platform controls: catalog logic, inventory management

### Marketplace
- **Feature**: Marketplace Access
- **Backend API**: `/api/v1/marketplace`
- **Fleetbase API**: `/api/v1/fleetbase-proxy/marketplace`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create marketplace UI
  - Tenant can: browse marketplace, integrate with 1688/Taobao/Alibaba
  - Platform controls: marketplace logic, integrations

### Storefront Configuration
- **Feature**: Storefront Orders/Customers
- **Backend API**: `/api/v1/storefront/{tenant_id}/orders`, `/api/v1/storefront/{tenant_id}/customers`
- **Fleetbase API**: None (proxies to Fleetbase)
- **Status**: ⚠️ Limited (only orders/customers proxy)
- **Requirements**: 
  - Extend storefront configuration UI
  - Tenant can: view orders, view customers
  - Platform controls: storefront logic, Fleetbase integration

### Vendors
- **Feature**: Vendor Management
- **Backend API**: `/api/v1/vendors`
- **Fleetbase API**: `/api/v1/fleetbase-proxy/vendors`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create vendor management UI
  - Tenant can: manage their vendors
  - Platform controls: vendor logic, relationships

### Geo/Location Services
- **Feature**: Location Services
- **Backend API**: `/api/v1/geo`
- **Fleetbase API**: `/api/v1/fleetbase-proxy/locations`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create location services UI
  - Tenant can: access location data
  - Platform controls: geocoding, maps integration

### KYC Verification
- **Feature**: KYC Verification
- **Backend API**: `/api/v1/kyc`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create KYC verification UI
  - Tenant can: submit KYC documents
  - Platform controls: verification logic, compliance

### Estimate Page
- **Feature**: Cost Estimation
- **Backend API**: `/api/v1/estimate`
- **Fleetbase API**: None
- **Status**: ❌ Missing (component exists but no dedicated page)
- **Requirements**: 
  - Create dedicated estimate page
  - Tenant can: get cost estimates
  - Platform controls: estimation logic, pricing

### Checkout Flow
- **Feature**: Checkout System
- **Backend API**: `/api/v1/checkout`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create checkout flow UI
  - Tenant can: process payments
  - Platform controls: checkout logic, payment processing

### Custom Domains
- **Feature**: Custom Domain Management
- **Backend API**: `/api/v1/custom-domains`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create domain management UI
  - Tenant can: configure their custom domain
  - Platform controls: DNS management, SSL, routing

### Feature Flags
- **Feature**: Feature Toggles
- **Backend API**: `/api/v1/feature-flags`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create feature flag UI (Platform Admin only)
  - Platform controls: enable/disable features per tenant
  - Tenant can: see which features are enabled for them

### Plugins
- **Feature**: Plugin Catalog
- **Backend API**: `/api/v1/plugins`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create plugin catalog UI
  - Tenant can: browse and install plugins (like template store)
  - Platform controls: plugin logic, installation, sandboxing

### Page Generator
- **Feature**: Dynamic Page Builder
- **Backend API**: `/api/v1/page-generator`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create page builder UI
  - Tenant can: generate dynamic pages
  - Platform controls: page generation logic, templates

### RBAC/Permissions
- **Feature**: Role-Based Access Control
- **Backend API**: `/api/v1/rbac`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create role management UI
  - Tenant can: manage roles within their tenant
  - Platform controls: permission system, role definitions

### WhatsApp Integration
- **Feature**: WhatsApp Configuration
- **Backend API**: `/api/v1/whatsapp`, `/api/v1/whatsapp-csv`, `/api/v1/whatsapp-bot`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create WhatsApp config UI
  - Tenant can: configure their WhatsApp numbers
  - Platform controls: WhatsApp API integration, bot logic

### CRM Dashboard
- **Feature**: Customer Relationship Management
- **Backend API**: `/api/v1/crm`, `/api/v1/support-crm`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create CRM dashboard UI
  - Tenant can: manage customers, view support tickets
  - Platform controls: CRM logic, data relationships

### Commercial Orchestration
- **Feature**: Commercial Flow
- **Backend API**: `/api/v1/commercial-orchestration`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create commercial flow UI
  - Tenant can: access commercial orchestration features
  - Platform controls: commercial logic, workflows

### Cargo Lifecycle
- **Feature**: Cargo Lifecycle Tracking
- **Backend API**: `/api/v1/cargo-lifecycle`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create cargo lifecycle UI
  - Tenant can: track cargo lifecycle
  - Platform controls: lifecycle logic, status transitions

### Warehouse Notices
- **Feature**: Warehouse Notice Management
- **Backend API**: `/api/v1/warehouse-notices`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: 
  - Create warehouse notice UI
  - Tenant can: publish warehouse notices
  - Platform controls: notice logic, publishing

---

## Priority 2: Fleetbase API Available
*Features available through Fleetbase proxy (catch-all proxy allows access to ANY Fleetbase endpoint)*

### Fleet Operations
- **Feature**: Fleet Management
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-proxy/fleets`, `/api/v1/fleetbase-tenant-proxy/fleets`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create fleet management UI
  - Fleet organization
  - Enable/disable via Tenant Admin controls

### Vehicle Management
- **Feature**: Vehicle Fleet
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-proxy/vehicles`, `/api/v1/fleetbase-tenant-proxy/vehicles`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create vehicle management UI
  - Vehicle tracking
  - Enable/disable via Tenant Admin controls

### Driver Management
- **Feature**: Driver Management
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-proxy/drivers`, `/api/v1/fleetbase-tenant-proxy/drivers`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create driver management UI
  - Driver assignment
  - Enable/disable via Tenant Admin controls

### Order Management
- **Feature**: Order/Dispatch Management
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-proxy/orders`, `/api/v1/fleetbase-tenant-proxy/orders`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create order management UI
  - Dispatch operations
  - Enable/disable via Tenant Admin controls

### Tracking
- **Feature**: Real-time Tracking
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-tenant-proxy/tracking`
- **Status**: ❌ Missing
- **Requirements**: 
  - Create tracking UI
  - Real-time location updates
  - Enable/disable via Tenant Admin controls

### Live Map
- **Feature**: Live Tracking Map
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-tenant-proxy/proxy/live-map` (via catch-all)
- **Status**: ❌ Missing
- **Requirements**: 
  - Create live map UI
  - Real-time fleet visualization
  - Enable/disable via Tenant Admin controls

### Route Planning
- **Feature**: Route Planning
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-tenant-proxy/proxy/routes` (via catch-all)
- **Status**: ❌ Missing
- **Requirements**: 
  - Create route planning UI
  - Route optimization
  - Enable/disable via Tenant Admin controls

### Analytics
- **Feature**: Fleet Analytics
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-tenant-proxy/proxy/analytics` (via catch-all)
- **Status**: ❌ Missing
- **Requirements**: 
  - Create analytics dashboard UI
  - Fleet performance metrics
  - Enable/disable via Tenant Admin controls

### Console Access
- **Feature**: Fleetbase Console
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-proxy/console-url`
- **Status**: ✅ Available (via API)
- **Requirements**: 
  - Link to Fleetbase console
  - Tenant-specific console URL
  - Enable/disable via Tenant Admin controls

### Additional Fleetbase Endpoints (via catch-all proxy)
- **Feature**: Any Fleetbase Endpoint
- **Backend API**: None
- **Fleetbase API**: `/api/v1/fleetbase-tenant-proxy/proxy/{path:path}` (catch-all)
- **Status**: ✅ Available (via proxy)
- **Notes**: The catch-all proxy allows access to ANY Fleetbase endpoint at `/int/v1/{path}`, including:
  - Service areas
  - Zones
  - Contacts
  - Places
  - And any other Fleetbase module

---

## Priority 3: Afru Platform API Available
*Features available through native Afruheritage platform APIs*

### Track Component
- **Feature**: Shipment Tracking
- **Backend API**: `/api/v1/shipments/public/track/{tenant_id}/{key}`, `/api/v1/shipments?shipping_mark={key}`
- **Fleetbase API**: None
- **Status**: ✅ Wired
- **Requirements**: None - fully functional

### Estimator Component
- **Feature**: Customs Rate Estimator
- **Backend API**: `/api/v1/customs/rates`
- **Fleetbase API**: None
- **Status**: ✅ Wired
- **Requirements**: None - fully functional

### Payments Component
- **Feature**: Payment Information
- **Backend API**: `/api/v1/billing/payment-info`, `/api/v1/billing/staff`
- **Fleetbase API**: None
- **Status**: ✅ Wired
- **Requirements**: None - fully functional

### Authentication
- **Feature**: User Authentication
- **Backend API**: `/api/v1/auth/*`
- **Fleetbase API**: None
- **Status**: ✅ Wired
- **Requirements**: None - fully functional

### Branding
- **Feature**: Branding Configuration
- **Backend API**: `/api/v1/branding`
- **Fleetbase API**: None
- **Status**: ✅ Wired
- **Requirements**: None - fully functional

### Tenant Context
- **Feature**: Tenant Context Resolution
- **Backend API**: `/api/v1/tenant-context`
- **Fleetbase API**: None
- **Status**: ✅ Wired
- **Requirements**: None - fully functional

### I18n/Localization
- **Feature**: Internationalization
- **Backend API**: `/api/v1/i18n`
- **Fleetbase API**: None
- **Status**: ✅ Available
- **Requirements**: Wire to frontend if needed

### AI Features
- **Feature**: AI Chat Widget
- **Backend API**: `/api/v1/ai`, `/api/v1/ai-widget`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create AI chat UI

### Commercial Orchestration
- **Feature**: Commercial Flow
- **Backend API**: `/api/v1/commercial-orchestration`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create commercial flow UI

### Marketplace
- **Feature**: Marketplace
- **Backend API**: `/api/v1/marketplace`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create marketplace UI

### Admin Marketplace
- **Feature**: Admin Marketplace Management
- **Backend API**: `/api/v1/admin-marketplace`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create admin marketplace UI

### Payment Hub
- **Feature**: Payment Processing Hub
- **Backend API**: `/api/v1/payment-hub`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create payment hub UI

### Admin Billing Config
- **Feature**: Admin Billing Configuration
- **Backend API**: `/api/v1/admin-billing-config`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create admin billing config UI

### Admin Credits
- **Feature**: Admin Credit Management
- **Backend API**: `/api/v1/admin-credits`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create admin credits UI

### Admin Subscriptions
- **Feature**: Admin Subscription Management
- **Backend API**: `/api/v1/admin-subscriptions`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create admin subscriptions UI

### Admin DNS
- **Feature**: Admin DNS Management
- **Backend API**: `/api/v1/admin-dns`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create admin DNS UI

### Admin Tenant Preview
- **Feature**: Admin Tenant Preview
- **Backend API**: `/api/v1/admin-tenant-preview`
- **Fleetbase API**: None
- **Status**: ❌ Missing
- **Requirements**: Create admin tenant preview UI

---

## Priority 4: None (Static/Informational)
*Features that don't require backend APIs*

### Hero Section
- **Feature**: Hero Marketing Section
- **Backend API**: None needed
- **Fleetbase API**: None
- **Status**: Static
- **Requirements**: Configurable via Tenant Admin Branding

### Workflow Section
- **Feature**: How It Works Section
- **Backend API**: None needed
- **Fleetbase API**: None
- **Status**: Static
- **Requirements**: Configurable via Tenant Admin Branding

### Services Section
- **Feature**: Services Display
- **Backend API**: None needed
- **Fleetbase API**: None
- **Status**: Static
- **Requirements**: Configurable via Tenant Admin Branding

### CTA Section
- **Feature**: Call to Action
- **Backend API**: None needed
- **Fleetbase API**: None
- **Status**: Partial (WhatsApp works, Support form mock)
- **Requirements**: Wire Support form to API

---

## Fleetbase Proxy Clarification

The Fleetbase proxy exposes features through:

1. **Explicitly defined endpoints** (5):
   - `/api/v1/fleetbase-proxy/drivers`
   - `/api/v1/fleetbase-proxy/vehicles`
   - `/api/v1/fleetbase-proxy/fleets`
   - `/api/v1/fleetbase-proxy/orders`
   - `/api/v1/fleetbase-proxy/console-url`

2. **Tenant-scoped endpoints** (6):
   - `/api/v1/fleetbase-tenant-proxy/drivers` (GET, POST)
   - `/api/v1/fleetbase-tenant-proxy/vehicles` (GET, POST)
   - `/api/v1/fleetbase-tenant-proxy/orders` (GET, POST)
   - `/api/v1/fleetbase-tenant-proxy/tracking` (GET)
   - `/api/v1/fleetbase-tenant-proxy/fleets` (GET)

3. **Catch-all proxy** (access to additional Fleetbase modules):
   - `/api/v1/fleetbase-tenant-proxy/proxy/{path:path}` (GET, POST, PUT, PATCH, DELETE)
   - This allows access to ANY Fleetbase endpoint at `/int/v1/{path}`
   - Known Fleetbase modules accessible via proxy:
     - live-map
     - routes
     - analytics
     - service-areas
     - zones
     - contacts
     - places
     - And any other Fleetbase module endpoints

**Total Fleetbase Features Available**: 11 explicitly defined + additional modules via catch-all proxy
**Explicitly Documented**: 11 endpoints
**Additional Modules via Proxy**: live-map, routes, analytics, service-areas, zones, contacts, places (7+ known)

---

## Summary

- **Total Features Listed**: 47
- **Fully Wired**: 5 (Track, Estimator, Payments, Auth, Branding)
- **Partially Wired**: 3 (Notices, CTA, Bulk Import)
- **Missing UI**: 39
- **Content Tenants Can MODIFY**: 4 (New Arrivals, Gallery, Branding, About Page)
- **Platform Features Tenants USE**: 24 (Billing, Support, Customer Portal, Bulk Import, Customs, Products, Marketplace, etc.)
- **Fleetbase Features**: 9 (Fleet, Vehicles, Drivers, Orders, Tracking, Live Map, Routes, Analytics, Console)
- **Platform Admin Features**: 10 (AI, Admin Marketplace, Payment Hub, Admin Billing, etc.)

---

## Real List of Features Requiring Tenant Admin Controls

### Priority 1 - Content Tenants Can MODIFY (4 total)
*Features where tenants can add/edit their own content*
1. New Arrivals - `/api/v1/new-arrivals` (GET, POST, PATCH, DELETE)
2. Gallery - `/api/v1/gallery` (GET, POST, PATCH, DELETE, /upload)
3. Branding - `/api/v1/branding/{tenant_id}` (GET, POST, PATCH, /logo)
4. About Page - Needs endpoint (or integrate with branding)

### Priority 2 - Platform Features Tenants USE (24 total)
*Features tenants can access but cannot change platform logic*
1. Billing & Subscription Management - `/api/v1/billing/*`
2. Support System - `/api/v1/support-crm`
3. Customer Portal - `/api/v1/customer-portal/*`
4. Bulk Import Members - `/api/v1/users/bulk-import`
5. Bulk Import Shipments - `/api/v1/shipments/{tenant_id}/import/csv`
6. Customs Calculator - `/api/v1/customs/*`
7. Product Catalog - `/api/v1/products/*`
8. Marketplace - `/api/v1/marketplace`
9. Storefront Configuration - `/api/v1/storefront/*`
10. Vendors - `/api/v1/vendors`
11. Geo/Location Services - `/api/v1/geo`
12. KYC Verification - `/api/v1/kyc`
13. Estimate Page - `/api/v1/estimate`
14. Checkout Flow - `/api/v1/checkout`
15. Custom Domains - `/api/v1/custom-domains`
16. Feature Flags - `/api/v1/feature-flags` (Platform Admin only)
17. Plugins - `/api/v1/plugins`
18. Page Generator - `/api/v1/page-generator`
19. RBAC/Permissions - `/api/v1/rbac`
20. WhatsApp Integration - `/api/v1/whatsapp/*`
21. CRM Dashboard - `/api/v1/crm`
22. Commercial Orchestration - `/api/v1/commercial-orchestration`
23. Cargo Lifecycle - `/api/v1/cargo-lifecycle`
24. Warehouse Notices - `/api/v1/warehouse-notices`

### Priority 3 - Fleetbase Features (9 total)
*Features available through Fleetbase proxy*
1. Fleet Operations - `/api/v1/fleetbase-proxy/fleets`
2. Vehicle Management - `/api/v1/fleetbase-proxy/vehicles`
3. Driver Management - `/api/v1/fleetbase-proxy/drivers`
4. Order Management - `/api/v1/fleetbase-proxy/orders`
5. Tracking - `/api/v1/fleetbase-tenant-proxy/tracking`
6. Live Map - `/api/v1/fleetbase-tenant-proxy/proxy/live-map`
7. Route Planning - `/api/v1/fleetbase-tenant-proxy/proxy/routes`
8. Analytics - `/api/v1/fleetbase-tenant-proxy/proxy/analytics`
9. Console Access - `/api/v1/fleetbase-proxy/console-url`

### Priority 4 - Platform Admin Features (10 total)
*Features only for platform superusers*
1. AI Features - `/api/v1/ai`, `/api/v1/ai-widget`
2. Admin Marketplace - `/api/v1/admin-marketplace`
3. Payment Hub - `/api/v1/payment-hub`
4. Admin Billing Config - `/api/v1/admin-billing-config`
5. Admin Credits - `/api/v1/admin-credits`
6. Admin Subscriptions - `/api/v1/admin-subscriptions`
7. Admin DNS - `/api/v1/admin-dns`
8. Admin Tenant Preview - `/api/v1/admin-tenant-preview`
9. Billing Admin - `/api/v1/billing-admin`
10. Tenant Assets - `/api/v1/tenant-assets` (favicon, robots.txt, sitemap.xml)

**Critical Path for Amooksco Storefront:**
1. Wire Support Form to API
2. Wire Notices to New Arrivals API
3. Create Customer Portal
4. Add Billing/Subscription Management to Tenant Admin
5. Create Customs Calculator
6. Add Product Catalog/Marketplace
7. Implement Fleet Operations UI (if needed)

---

## API Endpoint Verification (Deep Dive)

**Verification Method**: Read all 35 backend API route files in `/app/api/routes/` to verify exact endpoints exist

**Results**:
- **35/36 endpoints verified** by reading actual code files
- **1 endpoint missing**: About Page (no API endpoint exists)

**All Priority 1 (Tenant-Modifiable Content) Verified**:
- ✅ New Arrivals - `/api/v1/new-arrivals` (GET, POST, PATCH, DELETE) - Full CRUD with tenant scoping
- ✅ Gallery - `/api/v1/gallery` (GET, POST, PATCH, DELETE, /upload) - Full CRUD with tenant scoping
- ✅ Branding - `/api/v1/branding/{tenant_id}` (GET, POST, PATCH, /logo) - Full CRUD with tenant scoping
- ❌ About Page - NO ENDPOINT EXISTS (needs to be created or integrated with branding)

**All Priority 2 (Platform Features Tenants USE) Verified**:
- ✅ Billing, Support CRM, Customer Portal, Customer Cargo Portal, Customer Shipments, KYC, Estimate, Checkout, Custom Domains, Feature Flags, Plugins, Page Generator, WhatsApp, CRM, Commercial Orchestration, Cargo Lifecycle, Warehouse Notices, Vendors, Geo/Location, RBAC, Bulk Import Members, Bulk Import Shipments, Products, Marketplace

**All Priority 3 (Fleetbase Features) Verified**:
- ✅ Fleet Operations, Vehicle Management, Driver Management, Order Management, Tracking, Live Map, Route Planning, Analytics, Console Access

**Conclusion**: The TODO document is accurate. All backend APIs exist except for About Page content, which needs a new endpoint or integration with the existing Branding endpoint.

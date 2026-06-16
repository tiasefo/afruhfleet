# Fleetbase Feature Gap Analysis

## Fleetbase Packages Installed (per tenant runtime)

| Package | Version | Purpose |
|---------|---------|---------|
| `fleetbase/core-api` | ^1.6.49 | Users, orgs, roles, permissions, files, notifications, webhooks, settings |
| `fleetbase/fleetops-api` | ^0.6.50 | Drivers, vehicles, fleets, orders/shipments, tracking, dispatch, jobs, routes, waypoints, service rates, contacts, places |
| `fleetbase/storefront-api` | ^0.4.14 | Products, categories, carts, orders, customers, checkout, stores, gift cards |
| `fleetbase/ledger-api` | ^0.0.3 | Credits, transactions, invoices, payments, subscriptions |
| `fleetbase/registry-bridge` | ^0.1.9 | Extensions, plugin registry, marketplace |
| `fleetbase/valhalla-api` | ^0.0.4 | Route optimization |
| `fleetbase/vroom-api` | ^0.0.4 | Vehicle routing optimization (VRP) |

---

## What Afruheritage Currently Leverages

### Actively Used (Wired to UI/API)
| Feature | Fleetbase Source | Afruheritage Exposure | Notes |
|---------|-----------------|----------------------|-------|
| Auth / Users | core-api | Custom JWT + registration | Own auth system, not Fleetbase |
| Organizations | core-api | Tenant model | Mapped to Fleetbase org on provision |
| Drivers | fleetops-api | `/fleetbase/drivers` + create form | Live data via proxy |
| Vehicles | fleetops-api | `/fleetbase/vehicles` | Live data via proxy |
| Fleets | fleetops-api | `/fleetbase/fleets` | Live data via proxy |
| Orders/Shipments | fleetops-api | `/fleetbase/orders`, `/shipments` | Our own shipment model + Fleetbase proxy |
| GPS Tracking | fleetops-api | `/fleetbase/live-map`, `/track` | Real-time coordinates |
| Public Tracking | fleetops-api | `/track`, `/store/[slug]` tracking widget | Customer-facing |

### Own Implementations (Not Using Fleetbase)
| Feature | Afruheritage Implementation | Why Not Fleetbase |
|---------|---------------------------|-----------------|
| Billing | Paystack + wallet credits | Fleetbase Ledger uses Stripe-only |
| Storefront | Custom Next.js products page | Fleetbase Storefront is Ember-only |
| CRM / Support | Custom tickets + GLPI sync | Fleetbase has no native CRM |
| Vendor Marketplace | Custom vendor + booking system | Fleetbase marketplace is driver-only |
| KYC | Custom KYC upload + review | Fleetbase has no KYC |
| Custom Domains | Cloudflare integration | Fleetbase domains are basic |
| AI Chat | Ollama + RAG | Fleetbase has no AI |
| Route Visualization | Custom geo endpoints | Using Fleetbase data but own UI |

---

## Fleetbase Features NOT Currently Leveraged (GAPS)

### 1. FleetOps — Dispatch & Jobs
- **What**: Assign orders to drivers, track job status, auto-dispatch algorithms
- **Gap**: We have vendor marketplace but no true dispatch engine
- **Impact**: HIGH — core logistics workflow
- **Proposed Tier**: Professional + Business

### 2. FleetOps — Routes & Waypoints
- **What**: Planned routes with multiple stops, waypoint sequencing
- **Gap**: No route planning UI or API exposure
- **Impact**: HIGH — essential for multi-stop deliveries
- **Proposed Tier**: Business

### 3. FleetOps — Service Rates
- **What**: Configurable pricing per route, zone, vehicle type, weight
- **Gap**: Pricing is hardcoded/manual in our system
- **Impact**: MEDIUM — needed for automated quoting
- **Proposed Tier**: Professional + Business

### 4. FleetOps — Contacts & Places (Address Book)
- **What**: Saved addresses, sender/receiver contact management
- **Gap**: Addresses entered manually per shipment
- **Impact**: MEDIUM — UX improvement for repeat customers
- **Proposed Tier**: All tiers (basic limit on free)

### 5. FleetOps — Fuel & Expense Tracking
- **What**: Log fuel purchases, maintenance costs per vehicle
- **Gap**: No cost tracking per vehicle
- **Impact**: LOW — nice-to-have for fleet managers
- **Proposed Tier**: Business

### 6. FleetOps — Maintenance / Issues
- **What**: Vehicle issue reporting, maintenance schedules
- **Gap**: No maintenance tracking
- **Impact**: LOW — fleet management feature
- **Proposed Tier**: Business

### 7. FleetOps — Service Areas
- **What**: Geographic polygons defining where a tenant operates
- **Gap**: No geofencing or service area validation
- **Impact**: MEDIUM — prevents orders outside coverage
- **Proposed Tier**: Professional + Business

### 8. Storefront — Native E-commerce
- **What**: Full cart, checkout, payment, gift cards
- **Gap**: We built our own simpler product catalog
- **Impact**: MEDIUM — Fleetbase storefront is mature but Ember-based
- **Decision**: Keep our own for now (Next.js, customizable)

### 9. Ledger — Credit-Based Billing
- **What**: Internal credit system, invoicing, subscription management
- **Gap**: We use Paystack + wallet (external)
- **Impact**: LOW — our Paystack integration works for GHS
- **Decision**: Keep Paystack for now

### 10. Registry — Extensions / Plugins
- **What**: Install extensions (e.g., WhatsApp, SMS, analytics)
- **Gap**: No plugin marketplace for tenants
- **Impact**: MEDIUM — could enable rapid feature rollout
- **Proposed Tier**: Business (self-serve), Professional (curated)

### 11. Valhalla — Route Optimization
- **What**: AI-optimized routes for multiple deliveries
- **Gap**: No route optimization
- **Impact**: HIGH — saves fuel, time
- **Proposed Tier**: Business (add-on)

### 12. Vroom — Vehicle Routing Problem (VRP)
- **What**: Advanced VRP solver for fleet scheduling
- **Gap**: No automated fleet scheduling
- **Impact**: HIGH — enterprise logistics
- **Proposed Tier**: Business (add-on)

### 13. Core — Webhooks
- **What**: Event-driven webhooks for integrations
- **Gap**: No webhook system for tenant integrations
- **Impact**: MEDIUM — needed for ERP integrations
- **Proposed Tier**: Professional + Business

### 14. Core — Notifications (Push/SMS/In-app)
- **What**: Native notification system
- **Gap**: We only have email and WhatsApp
- **Impact**: MEDIUM — driver alerts, customer updates
- **Proposed Tier**: Professional + Business

### 15. FleetOps — POD (Proof of Delivery)
- **What**: Photo capture, signature capture, barcode scan on delivery
- **Gap**: No digital POD workflow
- **Impact**: HIGH — legally required for many deliveries
- **Proposed Tier**: Professional + Business

### 16. FleetOps — Driver Mobile App
- **What**: Fleetbase driver mobile app for iOS/Android
- **Gap**: No dedicated driver app
- **Impact**: HIGH — drivers need mobile interface
- **Proposed Tier**: All tiers (driver app is free, tenant pays for dispatch)

---

## Subscription Tier Feature Matrix

| Feature | Free Trial | Professional | Business | Delivery Services |
|---------|-----------|--------------|----------|-------------------|
| **Core** |
| Public Tracking | 50/month | Unlimited | Unlimited | Unlimited |
| Drivers | 3 | 20 | Unlimited | Unlimited |
| Vehicles | 3 | 20 | Unlimited | Unlimited |
| Shipments | 50/month | 500/month | Unlimited | Unlimited |
| Group Members | 100 | 1,000 | 5,000 | 5,000 |
| CSV Import | No | Yes | Yes | Yes |
| Custom Domain | No | Yes | Yes | Yes |
| Webhooks | No | Yes | Yes | Yes |
| **FleetOps** |
| Live GPS Map | Yes | Yes | Yes | Yes |
| Dispatch / Jobs | No | Yes | Yes | Yes |
| Route Planning | No | No | Yes | Yes |
| Service Rates | No | Yes | Yes | Yes |
| Contacts/Places | 50 | 500 | Unlimited | Unlimited |
| Service Areas | No | Yes | Yes | Yes |
| Fuel/Expense Tracking | No | No | Yes | Yes |
| Maintenance | No | No | Yes | Yes |
| POD (Photo/Signature) | No | Yes | Yes | Yes |
| **Optimization** |
| Route Optimization (Valhalla) | No | No | Add-on | Add-on |
| VRP Solver (Vroom) | No | No | Add-on | Add-on |
| **Platform** |
| AI Chat Widget | Yes | Yes | Yes | Yes |
| Priority Support | No | Yes | Yes | Yes |
| Vendor Marketplace | Yes | Yes | Yes | Yes |
| KYC Verification | Yes | Yes | Yes | Yes |
| Extensions/Plugins | No | Curated | Full | Full |
| **Storefront** |
| Products | 10 | 100 | Unlimited | Unlimited |
| Tracking Widget | Yes | Yes | Yes | Yes |
| AI Chat on Storefront | Yes | Yes | Yes | Yes |

---

## Recommended Implementation Priority

### Phase 1 (Immediate — High ROI)
1. **Fix auth cookie** — DONE
2. **Storefront tracking widget** — DONE
3. **POD workflow** — Photo/signature capture on delivery
4. **Contacts/Places** — Address book for repeat senders/receivers
5. **Service Rates** — Zone-based pricing automation

### Phase 2 (Short-term)
6. **Dispatch engine** — Assign shipments to drivers with status tracking
7. **Route planning** — Multi-stop route creation
8. **Webhooks** — Allow tenant integrations
9. **Notifications** — Push/SMS alerts

### Phase 3 (Medium-term)
10. **Route optimization** — Valhalla integration
11. **VRP solver** — Vroom integration for enterprise
12. **Driver mobile app** — Wrap Fleetbase driver app or build custom
13. **Maintenance tracking** — Vehicle service logs

---

## Smoke Test Results

| Test | Status |
|------|--------|
| Superuser login (`admin@afruheritage.com`) | Working |
| Tenant login (Empire Drips user) | Fixed — cookie mismatch resolved |
| Storefront `/store/empire-drips` | Working |
| Support ticket creation (public) | Working |
| Support ticket tenant dashboard | Ready for test |
| Live-map GPS tracking | Working |
| Driver creation via Fleetbase proxy | Working |

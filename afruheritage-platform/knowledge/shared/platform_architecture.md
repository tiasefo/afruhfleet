---
doc_id: shared-platform-architecture-001
scope: shared
product: afruheritage
title: Afruheritage Platform Architecture
---

# Afruheritage Platform — Full Architecture

## What is Afruheritage?

Afruheritage powered by Infotech is a **multi-tenant SaaS freight-forwarding platform** built for Africa. It works like WordPress — any freight company can sign up, get their own branded freight management system (called a "tenant"), and start managing shipments without seeing any Afruheritage or Fleetbase branding.

## Control Plane (Afruheritage Core)

The **Control Plane** is the heart of Afruheritage. It runs at `api.afruheritage.com` and manages everything above the tenant level:

- **User onboarding** — Signup, email verification, plan selection
- **Tenant provisioning** — Creates isolated Fleetbase instances per tenant via SSH
- **Billing** — Paystack payment gateway, subscription plans, credit wallets
- **Domain management** — Custom domains, Cloudflare integration, SSL
- **KYC & Compliance** — Identity verification for vendor drivers
- **AI Assistant** — Ollama-powered chatbot with RAG retrieval
- **Support/CRM** — GLPI ticketing, CRM accounts, opportunities, quotes
- **Vendor marketplace** — Delivery vendor registry, matching, bookings
- **WhatsApp integration** — Shipment updates via WhatsApp
- **Analytics** — Platform-wide and tenant-level analytics

## Tenant Runtime (Fleetbase)

Each tenant gets their own **Fleetbase** instance — an open-source fleet & logistics management engine. This gives every tenant:

- Full shipment lifecycle management (draft → confirmed → in_transit → delivered)
- GPS live tracking of drivers and vehicles
- Driver management and assignment
- Customer portal with public tracking links
- Order management / storefront (e-commerce orders)
- Pallet & warehouse (inventory management)
- Route optimization
- Real-time event tracking

## Key Components

### FastAPI Control Plane (Port 8100)
- 187 REST API endpoints
- JWT authentication
- PostgreSQL + SQLAlchemy ORM
- Celery + Redis for async tasks
- Modules: auth, tenants, billing, vendors, shipments, navigator, AI, KYC, CRM, domains, branding, geo, i18n, payment-hub, marketplace, whatsapp

### Admin Console Backend (Port 4000)
- Separate FastAPI app for internal Afruheritage staff
- Dual-token authentication: Admin JWT + Control Plane JWT
- Manages tenants, billing, KYC approvals, vendor reviews, analytics
- 41 admin endpoints

### Frontend Application (Port 3002)
- Next.js 14+ with TypeScript
- Tenant-aware routing
- Features: login, register, dashboard, shipments, billing, vendors, AI chat widget, public tracking

### Fleetbase (Port 8004)
- Laravel-based fleet management engine
- Per-tenant deployment via SSH + flb installer
- Console UI on Port 4203

### Databases
- PostgreSQL (port 5433): Afruheritage control plane + admin console
- MySQL (port 3309): Fleetbase runtime data
- Redis (port 6380): Afruheritage cache + Celery tasks
- Redis (port 6379): Fleetbase cache

### AI System
- Ollama local LLM inference (tinyllama, llama3, afruheritage-copilot models)
- nomic-embed-text for vector embeddings
- RAG retrieval from knowledge base + runtime code corpus
- Chat endpoint: POST /api/v1/ai/chat
- Widget config: GET /api/v1/ai/widget/config

## Subscription Plans

| Plan | Features |
|------|---------|
| **Starter** | Basic shipments, tracking, 5 users |
| **Professional** | All starter + AI assistant, vendor marketplace, WhatsApp |
| **Business** | All pro + custom domain, unlimited users, priority support |
| **Delivery Services** | Vendor/driver focused plan |

## Delivery Vendor System (Uber-like)

- Vendors register at POST /api/v1/vendors/register
- Admin reviews and approves vendors
- Tenants search approved vendors at GET /api/v1/vendors/marketplace
- Booking flow: request → accept → in_progress → completed
- Vehicle types: truck, car, motorbike, bicycle
- GPS tracking during delivery

## WordPress-like Tenant Provisioning

1. Tenant submits registration request
2. Admin approves in admin console
3. System provisions Fleetbase on a runner node via SSH
4. Tenant gets their own portal URL, subdomain, branding
5. Tenant can upgrade plans, add custom domain, invite users

## Currency & i18n
- Default currency: GHS (Ghanaian Cedi)
- Languages: English (en) and Chinese (zh) bilingual
- All text from i18n JSON files

## Infrastructure
- Cloudflare Tunnel: Routes internet traffic to local services
- Docker: All services containerized
- Celery workers: Async provisioning jobs
- Paramiko (SSH): Remote Fleetbase installer execution

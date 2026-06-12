---
doc_id: shared-faq-support-001
scope: shared
product: afruheritage
title: Afruheritage FAQ and Support Guide
---

# Afruheritage — Frequently Asked Questions

## General Questions

**Q: What is Afruheritage?**
A: Afruheritage is a multi-tenant freight-forwarding SaaS platform. Companies sign up, get their own branded freight management system, and manage shipments, drivers, vendors, and customers — all under their own brand.

**Q: How do I sign up?**
A: Go to afruheritage.com and click "Register". Fill in your company details, select a plan, and complete payment. Your platform will be provisioned automatically.

**Q: What is a "tenant"?**
A: A tenant is an individual freight company using the Afruheritage platform. Each tenant gets their own isolated environment with separate data, branding, subdomain, and users.

**Q: Can I use my own domain?**
A: Yes! On the Professional and Business plans, you can use a custom domain like `freight.yourcompany.com`. The platform handles SSL and DNS automatically via Cloudflare.

## Shipments

**Q: How do I create a shipment?**
A: Log into your tenant portal, go to Shipments, and click "New Shipment". Fill in origin, destination, cargo details, and assign a driver or vendor.

**Q: What shipment statuses are there?**
A: draft → confirmed → in_transit → customs_hold → out_for_delivery → delivered → cancelled

**Q: How does public tracking work?**
A: Every shipment gets a unique tracking number. Share the public tracking URL with customers — they can track in real-time without logging in, and it works in Chinese too.

**Q: Can I import shipments via CSV?**
A: Yes! Go to Shipments → Import, upload your CSV file. The system maps columns automatically and creates/updates shipments in bulk.

## Vendors & Drivers (Uber-like)

**Q: What is the vendor marketplace?**
A: The vendor marketplace lets you find and book approved delivery vendors in your area. Vendors register on the platform, get KYC-verified, and appear in search results.

**Q: How does a vendor register?**
A: Vendors go to afruheritage.com/vendors/register and complete a 4-step form: business info, vehicle info, documents upload, and agreements. After admin review, they become active.

**Q: How does live GPS tracking work?**
A: Drivers use the Navigator app (or API endpoint) to send their GPS location. Tenants and customers can see the driver's live position on the map during delivery.

**Q: What vehicle types are supported?**
A: Truck, car, motorbike, and bicycle.

## Billing & Payments

**Q: How does billing work?**
A: Afruheritage uses a credit wallet system powered by Paystack. You subscribe to a plan which loads credits into your wallet. Features like AI chat deduct credits per use.

**Q: What payment methods are accepted?**
A: Mobile money (MTN, Vodafone, AirtelTigo), bank card, and bank transfer via Paystack.

**Q: What if my credits run out?**
A: Your account enters "read-only" mode — you can view data but not create new shipments or use AI features until you top up.

**Q: How do I upgrade my plan?**
A: Go to Billing → Plans in your dashboard and click Upgrade. You'll be redirected to Paystack to complete payment.

## AI Assistant

**Q: What can the AI assistant do?**
A: The Afruheritage AI assistant can answer questions about the platform, help you understand features, explain billing, guide you through vendor registration, and answer freight-related questions.

**Q: What AI model is used?**
A: The platform uses a custom model called "afruheritage-copilot" running locally via Ollama. It's enhanced with retrieval from the Afruheritage knowledge base.

**Q: Is my data sent to external AI services?**
A: No. The AI runs entirely locally using Ollama. Your data never leaves the Afruheritage infrastructure.

## KYC & Compliance

**Q: What is KYC?**
A: Know Your Customer (KYC) is identity verification. Vendors and drivers must submit a government ID for verification before they can accept bookings.

**Q: How long does KYC take?**
A: Admin review typically takes 1-2 business days.

## Technical

**Q: What tech stack powers Afruheritage?**
A: FastAPI (Python), Next.js 14 (TypeScript), PostgreSQL, MySQL, Redis, Fleetbase (Laravel), Ollama (AI), Cloudflare, Docker, Paystack, Celery, Paramiko.

**Q: Is there an API?**
A: Yes! The full REST API is documented at api.afruheritage.com/docs. All features are accessible via API with JWT authentication.

**Q: How do I get support?**
A: Submit a support ticket at afruheritage.com/support or email support@afruheritage.com. Enterprise customers get WhatsApp support.

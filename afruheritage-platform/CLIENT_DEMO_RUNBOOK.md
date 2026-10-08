# AtlasBridge Logistics — Client Demonstration Runbook

**Version:** 1.0  
**Target duration:** 20-30 minutes  
**Certified application SHA:** `1531a874ba128043f1f6b0a78b1f6721ab08017b` (frozen)  
**Demo tenant:** AtlasBridge Logistics — `https://atlasbridge-logistics.afruheritage.com`  
**Product narrative:** Afruheritage enables a logistics entrepreneur or established logistics business to launch and operate its digital logistics business from one platform.

---

## Demo personas

1. **Ama Owusu — Business Owner / Tenant Admin**  
   Full tenant administration: subscription, branding, storefront, team, products, billing.

2. **Kofi Mensah — Operations User**  
   Runs shipments, drivers, vehicles, tracking, warehouse notices and marketplace.

3. **Akosua Boateng — Team Member (restricted)**  
   Demonstrates RBAC: can view shipments and support history, cannot modify billing or branding.

4. **Anonymous Customer (optional)**  
   External tracking and public support ticket experience.

All accounts, emails, phone numbers, tracking numbers and customer data in this tenant are fictional and clearly identifiable as demonstration data.

---

## Pre-demo smoke (read-only)

Before the client session, verify the following without making changes:

- `https://afruheritage.com` homepage loads.
- `https://atlasbridge-logistics.afruheritage.com/login` loads.
- Ama can log in and reach the tenant dashboard.
- AtlasBridge branding (colours, company name, tagline) is rendered.
- Public storefront displays freight products.
- Team, Shipments, Drivers, Vehicles, Tracking, CRM, Warehouse Notices, Customs, Support, Billing and AI pages load without errors.

Do not debug live in front of the client if a page fails. Record time, persona, page, action and visible error, then move to the next certified capability and report the failure to the Product Owner afterwards.

---

## Demo flow

### 1. Business creation (backstory)

- **Persona:** Ama Owusu  
- **Starting URL:** `https://afruheritage.com`  
- **Action:** Explain that AtlasBridge Logistics was registered as a freight-forwarding and last-mile business covering Ghana, Kenya and the United States. Open the public site and navigate to the login page of the demo tenant.  
- **Expected visible result:** Public Afruheritage landing page with a clear path to the AtlasBridge tenant.  
- **Demo data to select:** AtlasBridge Logistics.  
- **Approx. duration:** 1 minute  
- **Fallback:** If the public homepage is unavailable, open the tenant portal directly at `https://atlasbridge-logistics.afruheritage.com/login`.

### 2. Subscription

- **Persona:** Ama Owusu  
- **Starting URL:** Tenant dashboard  
- **Action:** Open **Billing / Subscription** and show the current `professional` trial and wallet balance of 2,500 credits.  
- **Expected visible result:** Trial active, plan code visible, currency GHS, wallet balance > 0.  
- **Demo data to select:** `free_trial` -> `professional` plan, 2,500 credits.  
- **Approx. duration:** 1 minute  
- **Fallback:** If the payment gateway is unavailable, show the pending `ABPAY-2026-001` payment record and the credited wallet as evidence of the billing lifecycle.

### 3. Brand and storefront

- **Persona:** Ama Owusu  
- **Starting URL:** Tenant settings / Branding  
- **Action:** Show the AtlasBridge brand: name, tagline, primary colour `#003366`, accent `#FF9900`, support email and phone. Open **Storefront Templates**, select the `freight` logistics template and preview the public storefront.  
- **Expected visible result:** Branding reflects AtlasBridge. Public storefront lists the six service products and a tracking call-to-action.  
- **Demo data to select:** Freight template; products Air Freight, Ocean Freight, Road Freight, Warehousing, Last-Mile Delivery, Customs Assistance.  
- **Approx. duration:** 2 minutes  
- **Fallback:** If template preview does not render, fall back to the public product list at `https://atlasbridge-logistics.afruheritage.com/store`.

### 4. Team onboarding

- **Persona:** Ama Owusu  
- **Starting URL:** Team / User Directory  
- **Action:** List the four team members created for the demo and show that each has a different role (operations, team_member, warehouse, customer). Switch to the **Team Member** persona (Akosua) and demonstrate that the billing and branding menus are not visible.  
- **Expected visible result:** 5 users including Ama; restricted view for non-admin.  
- **Demo data to select:** Kofi Mensah (operations), Akosua Boateng (team member), Yaa Asante (warehouse), Daniel Osei (customer).  
- **Approx. duration:** 2 minutes  
- **Fallback:** If RBAC navigation is slow, open a fresh browser tab in incognito and log in as Akosua to show the reduced menu.

### 5. Customer and CRM

- **Persona:** Ama Owusu  
- **Starting URL:** CRM / Accounts  
- **Action:** Open the three customer accounts (Sunrise Agro, Lakeview Pharma, Metro Retail USA), expand contacts and show two active opportunities and quotes (`ABQ-2026-001`, `ABQ-2026-002`).  
- **Expected visible result:** 3 accounts, 3 contacts, 2 opportunities, 2 quotes in GHS.  
- **Demo data to select:** Sunrise Agro Ltd (Ghana), Lakeview Pharma (Kenya), Metro Retail USA (USA).  
- **Approx. duration:** 2 minutes  
- **Fallback:** If the opportunity tab fails, open a single account and show the contact list.

### 6. Shipment creation

- **Persona:** Kofi Mensah  
- **Starting URL:** Shipments  
- **Action:** Create a new shipment from Accra to Kumasi. Enter a fictional sender/receiver, cargo type and weight. Save and note the generated tracking number.  
- **Expected visible result:** New shipment appears with tracking number and status `draft`.  
- **Demo data to select:** Sender: Tema Hub; receiver: Kumasi Trade Centre; cargo: Garments; weight 350 kg; currency GHS.  
- **Approx. duration:** 2 minutes  
- **Fallback:** If creation fails, open an existing demo shipment and step through its details.

### 7. Driver and vehicle

- **Persona:** Kofi Mensah  
- **Starting URL:** Fleet / Drivers or Vehicles  
- **Action:** List the AtlasBridge drivers and vehicles. Show how the operations user can view capacity and assign a vehicle during shipment creation.  
- **Expected visible result:** 5 demo drivers and 7 demo vehicles with registration numbers `AB-1001` ... `AB-1007`.  
- **Demo data to select:** Daniel Agyeman (driver), `AB-1001 Toyota Hilux` (vehicle).  
- **Approx. duration:** 2 minutes  
- **Fallback:** If the Fleetbase runtime is unreachable, show the static driver/vehicle list from the cached tenant data.

### 8. Tracking

- **Persona:** Kofi Mensah  
- **Starting URL:** Shipments / Tracking  
- **Action:** Open a demo shipment that has `booked`, `picked_up`, `in_transit`, `out_for_delivery` and `delivered` events. Copy the tracking number and open the public tracking page.  
- **Expected visible result:** Timeline of tracking events and a public tracking page that does not require login.  
- **Demo data to select:** Any existing AtlasBridge shipment with a tracking number starting `ATB-`.  
- **Approx. duration:** 2 minutes  
- **Fallback:** If public tracking is unavailable, show the authenticated shipment event timeline.

### 9. Warehouse

- **Persona:** Kofi Mensah  
- **Starting URL:** Warehouse Notices  
- **Action:** Show the three public warehouse notices (receiving window, capacity, safety drill) for the Tema and Accra hubs.  
- **Expected visible result:** 3 notices, clearly dated and tenant-scoped.  
- **Demo data to select:** Tema receiving window; Accra cold storage 85% utilised; safety drill.  
- **Approx. duration:** 1 minute  
- **Fallback:** If the warehouse page is slow, open a single notice and discuss capacity management.

### 10. Customs

- **Persona:** Ama or Kofi  
- **Starting URL:** Customs Calculator  
- **Action:** Run a cargo customs calculation for Ghana with `cif_value` GHS 18,000 and a vehicle duty estimate for a 2022 Toyota Hiace. Then run a Kenya cargo example.  
- **Expected visible result:** Breakdown of duty, VAT, levies and `total_duty`.  
- **Demo data to select:** Ghana cargo, Ghana vehicle, Kenya cargo.  
- **Approx. duration:** 2 minutes  
- **Fallback:** If an external customs data source is unavailable, show the locally-stored rate fallback results.

### 11. Support

- **Persona:** Akosua Boateng / Anonymous customer  
- **Starting URL:** Support Tickets  
- **Action:** As Akosua, view the two support tickets (invoice clarification, warehouse access). Optionally demonstrate the public ticket view using the public token without logging in.  
- **Expected visible result:** Ticket list with status, priority and category; public token resolves to the same record.  
- **Demo data to select:** Invoice clarification (billing), warehouse access (operations).  
- **Approx. duration:** 1 minute  
- **Fallback:** If public support token does not load, show the authenticated ticket detail.

### 12. Billing

- **Persona:** Ama Owusu  
- **Starting URL:** Billing  
- **Action:** Review the subscription status, wallet balance and the pending `ABPAY-2026-001` payment.  
- **Expected visible result:** Trial active, credits available, payment record visible.  
- **Demo data to select:** `professional` plan, `ABPAY-2026-001`, wallet 2,500 credits.  
- **Approx. duration:** 1 minute  
- **Fallback:** If the payment provider returns an error, show the locally-stored payment record and explain the sandbox verification flow.

### 13. Analytics / AI

- **Persona:** Ama Owusu  
- **Starting URL:** Dashboard / AI  
- **Action:** Open the analytics dashboard and, if configured, ask the AI assistant a simple logistics question such as "What is the status of shipments leaving Accra this week?"  
- **Expected visible result:** Dashboard loads with tenant activity summary; AI returns a helpful response if Ollama is configured.  
- **Demo data to select:** Accra outbound shipments.  
- **Approx. duration:** 2 minutes  
- **Fallback:** If AI is not configured, show the analytics dashboard and note that the AI plugin is enabled but a model-provider key can be configured for the client deployment.

---

## Post-Golden Path optional capabilities

If time and client interest remain, demonstrate:

- **Marketplace:** browse approved delivery vendors (Eric Ofori, Grace Mwangi, Samuel Addo).
- **Vendors:** marketplace booking flow.
- **KYC:** verification status.
- **Custom domains:** setup flow for a branded domain.

---

## Notes for the demonstrator

- Do not use the Platform Super Admin account unless explicitly demonstrating platform administration.
- Do not type or display passwords, bearer tokens, API keys or SMTP credentials.
- Keep Fleetbase terminology out of the customer conversation; Afruheritage is the product boundary.
- If a page or API returns an unexpected error, record the details and move on. Do not live-debug in front of the client.

# UAT Instructions — Afruheritage Platform

## For Business Testers

**Version:** 2.0  
**Date:** August 2026  
**Platform:** Afruheritage — Multi-tenant Freight Forwarding Launch Platform  

---

## How to Use This Document

This guide is written for **business testers** — not developers. Each section describes a real-world journey that a customer or admin would take through the platform. Follow each step in order and compare what you see with the **Expected Result**.

### Before You Start

- You need access to the Afruheritage platform (URLs will be provided by the test coordinator)
- You need a web browser (Chrome, Firefox, or Safari)
- You need an email account you can check (for registration and password reset tests)
- Have a notebook or spreadsheet ready to record Pass/Fail for each test

### How to Record Results

For each test case, record:
- **Test ID** (e.g., UAT-01)
- **Pass / Fail**
- **Notes** — what you saw, any errors, anything unexpected

---

## Test URLs

All URLs below have been verified (HTTP 200) on the production deployment.

| Page | URL |
|---|---|
| **Public Website** | https://afruheritage.com |
| **Create Account** | https://afruheritage.com/register |
| **Login** | https://afruheritage.com/login |
| **Forgot Password** | https://afruheritage.com/forgot-password |
| **Tenant Portal / Dashboard** | https://afruheritage.com/dashboard |
| **Template Store** | https://afruheritage.com/templates |
| **Plugin Store** | https://afruheritage.com/plugins |
| **Plans / Pricing** | https://afruheritage.com/pricing |
| **Support** | https://afruheritage.com/support |
| **Public Storefront (example)** | https://afruheritage.com/store/amooksco |
| **Admin Console** | https://admin.afruheritage.com |
| **API Health** | https://afruheritage.com/health |
| **Customs Duty Calculator** | https://afruheritage.com/customs |
| **Customs — Ghana** | https://afruheritage.com/customs/ghana |
| **Customs — Kenya** | https://afruheritage.com/customs/kenya |
| **Customs — Nigeria** | https://afruheritage.com/customs/nigeria |
| **Customs — Rwanda** | https://afruheritage.com/customs/rwanda |
| **Customs — South Africa** | https://afruheritage.com/customs/south-africa |
| **Customs — Tanzania** | https://afruheritage.com/customs/tanzania |
| **Customs — Uganda** | https://afruheritage.com/customs/uganda |
| **Customs Duty Calculator** | https://afruheritage.com/customs/duty-calculator |
| **KYC Verification** | https://afruheritage.com/kyc |
| **CRM** | https://afruheritage.com/crm |
| **CRM Contacts** | https://afruheritage.com/crm/contacts |
| **CRM Quotes** | https://afruheritage.com/crm/quotes |
| **Shipments** | https://afruheritage.com/shipments |
| **New Shipment** | https://afruheritage.com/shipments/new |
| **Import Shipments** | https://afruheritage.com/shipments/import |
| **Marketplace** | https://afruheritage.com/marketplace |
| **Vendors** | https://afruheritage.com/vendors |
| **Members** | https://afruheritage.com/members |
| **Onboarding** | https://afruheritage.com/onboarding |
| **Settings** | https://afruheritage.com/settings |
| **Profile** | https://afruheritage.com/profile |
| **Products** | https://afruheritage.com/products |
| **Track Shipment** | https://afruheritage.com/track |
| **Tenant Request** | https://afruheritage.com/tenant-request |
| **Locations** | https://afruheritage.com/locations |
| **GDPR** | https://afruheritage.com/gdpr |
| **Terms of Service** | https://afruheritage.com/terms-of-service |
| **Privacy Policy** | https://afruheritage.com/privacy-policy |
| **Cookie Policy** | https://afruheritage.com/cookie-policy |
| **Docs** | https://afruheritage.com/docs |
| **Fleet Console** | https://afruheritage.com/fleetbase/console |
| **Live Map** | https://afruheritage.com/fleetbase/live-map |
| **Admin — RBAC** | https://admin.afruheritage.com/rbac |
| **Admin — Plugins** | https://admin.afruheritage.com/plugins |
| **Admin — Templates** | https://admin.afruheritage.com/templates |
| **Admin — Runtime** | https://admin.afruheritage.com/runtime |
| **Admin — Customs Guest Usage** | https://admin.afruheritage.com/customs/guest-usage |
| **Support Dashboard** | https://afruheritage.com/support/dashboard |

> **Note for test coordinators:** All URLs above return HTTP 200. The API health endpoint is at `/health` (not `/api/v1/health`). Verify the endpoint returns `{"status":"ok"}` before starting UAT.

---

## Section 1: New Customer Registration

### UAT-01: Sign Up as a New Customer

**Goal:** A new freight forwarding company can register on the platform.

**Steps:**
1. Go to https://afruheritage.com/register
2. Fill in Company Name, Full Name, Email, Password (at least 8 characters), and Confirm Password
3. Click the "Create Account" button
4. A "Choose Your Plan" modal appears — select a plan (Free Trial recommended for testing)
5. Click "Continue"

**Expected Result:**
- Your account is created successfully
- A "Choose Your Plan" modal appears with plan options (Free Trial, Starter, Growth, Enterprise)
- After selecting a plan, you are directed to your dashboard or template selection

**Pass criteria:** Account created + plan selection modal appears

---

### UAT-02: Log In After Registration

**Goal:** A registered customer can log in to their account.

**Steps:**
1. Go to https://afruheritage.com/login
2. Enter the email and password you used during registration
3. Click the "Login" button

**Expected Result:**
- You are taken to your dashboard
- You see your company name displayed
- You see options for selecting a plan, setting up your storefront, etc.

**Pass criteria:** Successfully logged in + dashboard visible

---

### UAT-02b: Logout and Login Again

**Goal:** A customer can log out and log back in with the same credentials.

**Steps:**
1. While logged in to your dashboard, find the "Logout" or "Sign Out" button (usually in the top-right menu or sidebar)
2. Click it to log out
3. You should be returned to the login page or homepage
4. Go to https://afruheritage.com/login
5. Enter the same email and password as before
6. Click "Login"

**Expected Result:**
- After logout, you are no longer on the dashboard
- You can log back in with the same credentials
- You see the same dashboard and tenant context as before

**Pass criteria:** Logout works + login again works + same tenant context

---

### UAT-03: Password Reset

**Goal:** A customer who forgot their password can reset it via email.

**Steps:**
1. Go to https://afruheritage.com/forgot-password
2. Enter your registered email address
3. Click "Send Reset Link"
4. Check your email for a password reset link
5. Click the link in the email
6. Enter a new password (at least 8 characters)
7. Click "Reset Password"
8. Try logging in with the new password

**Expected Result:**
- You see a message: "If an account with this email exists, a reset link has been sent"
- You receive a password reset email within 1-2 minutes
- The reset link works when clicked
- After setting a new password, you can log in with it
- The old password no longer works

**Pass criteria:** Password reset email received + new password works + old password rejected

---

### UAT-04: Social Login (Google)

**Goal:** A customer can register or log in using their Google account.

**Steps:**
1. Go to https://afruheritage.com/login
2. Click the "Sign in with Google" button
3. Complete the Google OAuth flow
4. You should be redirected back to the platform

**Expected Result:**
- You are redirected to Google's consent screen
- After consent, you are returned to the Afruheritage dashboard
- Your account is created or linked to your Google email
- You can disconnect the Google account from Settings later

**Pass criteria:** Google login completes + dashboard accessible + disconnect works

---

### UAT-05: Onboarding Flow After Registration

**Goal:** A new customer is guided through an onboarding flow after registration.

**Steps:**
1. Register a new account (see UAT-01)
2. After selecting a plan, you should be guided through onboarding
3. Complete each onboarding step (company details, template selection, branding)

**Expected Result:**
- The onboarding page at /onboarding loads
- You see step-by-step guidance (company info, template, branding, publish)
- Each step can be completed or skipped
- After onboarding, you land on the dashboard

**Pass criteria:** Onboarding flow loads + steps are navigable + dashboard reached

---

## Section 2: Subscription and Payment

### UAT-06: View Available Plans

**Goal:** A customer can see the available subscription plans and their pricing.

**Steps:**
1. Log in to the customer app
2. Navigate to the billing or plans section
3. Review the available plans

**Expected Result:**
- You see at least 4 plans: Free Trial, Starter, Growth, Enterprise (or similar names)
- Each plan shows a price in GHS (Ghanaian Cedis)
- Each plan shows what features are included
- The Free Trial plan shows GHS 0

**Pass criteria:** All plans visible with correct pricing and features

---

### UAT-07: Start Free Trial

**Goal:** A customer can start a free trial without making a payment.

**Steps:**
1. Log in to the customer app
2. Go to the plans/billing section
3. Select the "Free Trial" plan
4. Confirm your selection

**Expected Result:**
- Your subscription status changes to "Trialing"
- You are not asked for payment details
- You see a trial expiration date (typically 14 days from today)
- You can access the dashboard features available on the trial plan

**Pass criteria:** Trial started without payment + trial end date shown

---

### UAT-08: Check Promotional Pricing

**Goal:** If a promotion is active, the customer sees the discounted price.

**Steps:**
1. Ask the test coordinator if any promotions are currently active
2. If yes, go to the pricing page or call the pricing API
3. Compare the displayed price with the original plan price

**Expected Result:**
- If a promotion is active, the price shown is lower than the original
- The discount amount is clearly shown
- The promotion name is displayed (e.g., "Launch Special — 20% off")
- If no promotion is active, the price matches the original plan price

**Pass criteria:** Promotional price correctly displayed when promotion is active

---

### UAT-09: Pay for a Subscription (Sandbox/Test)

**Goal:** A customer can complete a payment for a paid plan using the test payment gateway.

**Steps:**
1. Log in to the customer app
2. Go to the billing section
3. Select a paid plan (e.g., Starter)
4. Click "Pay Now" or "Subscribe"
5. You will be redirected to the Paystack payment page (test mode)
6. Use the test card number provided by the test coordinator
7. Complete the payment

**Expected Result:**
- You are redirected to Paystack's payment page
- After completing payment, you are redirected back to the Afruheritage dashboard
- Your subscription status changes to "Active"
- You receive a payment confirmation email
- Your wallet is credited with the plan's monthly credit allowance

**Pass criteria:** Payment completes + subscription active + confirmation email received

---

### UAT-10: Duplicate Payment Does Not Double-Charge

**Goal:** If the payment webhook fires twice (e.g., network retry), the customer is not double-charged.

**Steps:**
1. This is tested by the test coordinator — ask them to trigger a duplicate webhook
2. Check your wallet balance and subscription status after

**Expected Result:**
- Wallet is credited only once
- Subscription is activated only once
- No duplicate charges appear in the payment history

**Pass criteria:** No double-credit or double-charge on duplicate webhook

---

### UAT-11: Payment via Flutterwave

**Goal:** A customer can pay using Flutterwave as an alternative payment provider.

**Steps:**
1. Log in and go to billing
2. Select a paid plan
3. Choose Flutterwave as the payment method (if available)
4. Complete the Flutterwave test payment flow

**Expected Result:**
- You are redirected to Flutterwave's payment page
- After payment, you are returned to the dashboard
- Subscription is activated
- Transaction appears in payment history

**Pass criteria:** Flutterwave payment completes + subscription activated

---

### UAT-12: Payment via PayPal

**Goal:** A customer can pay using PayPal for international payments.

**Steps:**
1. Log in and go to billing
2. Select a paid plan
3. Choose PayPal as the payment method (if available)
4. Complete the PayPal sandbox payment flow

**Expected Result:**
- You are redirected to PayPal's sandbox
- After payment, you are returned to the dashboard
- Subscription is activated

**Pass criteria:** PayPal payment completes + subscription activated

---

### UAT-13: Download Payment Receipt

**Goal:** A customer can download a receipt for a completed payment.

**Steps:**
1. Complete a payment (see UAT-09)
2. Go to billing history or transactions
3. Find the transaction
4. Click "Download Receipt" or "View Receipt"

**Expected Result:**
- A receipt is generated (PDF or HTML)
- The receipt shows: transaction reference, amount, currency, date, plan name
- The receipt is downloadable or printable

**Pass criteria:** Receipt generated with correct payment details

---

### UAT-14: Billing Callback Page

**Goal:** After a payment redirect, the billing callback page handles the return correctly.

**Steps:**
1. Complete a payment that involves a redirect (Paystack, Flutterwave, PayPal)
2. Observe the callback page at /billing/callback

**Expected Result:**
- The callback page loads without errors
- It shows a success or failure message based on the payment result
- You are redirected to the dashboard or billing page after a few seconds

**Pass criteria:** Callback page handles redirect correctly

---

## Section 3: Storefront Setup

### UAT-15: Select a Storefront Template

**Goal:** A customer can choose a storefront template for their business.

**Steps:**
1. Log in to the customer app
2. Navigate to the storefront settings or template selection page
3. Browse the available templates (Freight, Fleet, E-commerce, Mall, Bookings, Real Estate, Restaurant)
4. Select a template that matches your business type
5. Save your selection

**Expected Result:**
- You see multiple template options with previews
- After selecting and saving, the template is applied to your storefront
- You see a confirmation message

**Pass criteria:** Template selected and saved successfully

---

### UAT-16: Customize Branding

**Goal:** A customer can customize their storefront appearance.

**Steps:**
1. Log in to the customer app
2. Go to the branding or appearance settings
3. Change the primary color to a color of your choice
4. Upload a logo (if you have one) or skip
5. Change the company tagline
6. Save changes

**Expected Result:**
- Color changes are saved
- Tagline is saved
- When you view your storefront, the new color and tagline appear

**Pass criteria:** Branding changes saved and visible on storefront

---

### UAT-17: Publish Storefront

**Goal:** A customer can publish their storefront so it is visible to the public.

**Steps:**
1. Log in to the customer app
2. Complete any required setup steps (template selection, branding)
3. Click "Publish" or "Launch Storefront"
4. Copy your storefront URL (e.g., yourcompany.afruheritage.com)
5. Open the URL in a new browser window (or incognito/private mode)

**Expected Result:**
- You see a "Storefront Published" or similar success message
- Your storefront URL is shown
- When you open the URL, you see your branded storefront with your company name, logo, and template
- The storefront is accessible without logging in

**Pass criteria:** Storefront published + publicly accessible + shows correct branding

---

## Section 4: Public Storefront

### UAT-18: Anonymous Customer Can View Storefront

**Goal:** A member of the public can view a tenant's storefront without logging in.

**Steps:**
1. Get a storefront URL from a published tenant (ask the test coordinator)
2. Open the URL in a browser where you are NOT logged in to Afruheritage
3. Browse the storefront

**Expected Result:**
- The storefront loads without requiring a login
- You see the tenant's company name, branding, and template
- You can navigate the storefront pages (tracking, contact, etc.)
- No Afruheritage admin interface is visible
- No "Fleetbase" branding is visible anywhere

**Pass criteria:** Storefront loads anonymously + correct branding + no platform branding leakage

---

### UAT-19: Suspended Tenant Storefront Is Blocked

**Goal:** If a tenant is suspended, their storefront shows a suspension message instead of the normal storefront.

**Steps:**
1. Ask the test coordinator to suspend a test tenant
2. Try to access that tenant's storefront URL

**Expected Result:**
- You see a message saying the account has been suspended
- You do NOT see the normal storefront content
- The message includes a suggestion to contact support

**Pass criteria:** Suspended tenant shows suspension message, not storefront content

---

### UAT-20: Storefront About Page

**Goal:** The storefront has an About page with company information.

**Steps:**
1. Go to a published storefront URL
2. Navigate to the About page (e.g., /store/companyname/about)

**Expected Result:**
- The About page loads with company information
- The page is branded with the tenant's colors and logo
- The content is relevant to the tenant's business

**Pass criteria:** About page loads with correct tenant branding

---

### UAT-21: Storefront New Arrivals Page

**Goal:** The storefront has a New Arrivals page showing recent products.

**Steps:**
1. Go to a published storefront URL
2. Navigate to New Arrivals (e.g., /store/companyname/new-arrivals)

**Expected Result:**
- The New Arrivals page loads
- Products are displayed with images, names, and prices
- The page is branded with the tenant's colors

**Pass criteria:** New Arrivals page loads with product listings

---

### UAT-22: Storefront Privacy and Cookie Pages

**Goal:** The storefront has privacy and cookie policy pages.

**Steps:**
1. Go to a published storefront URL
2. Navigate to the Privacy page (e.g., /store/companyname/privacy)
3. Navigate to the Cookies page (e.g., /store/companyname/cookies)

**Expected Result:**
- Both pages load with relevant legal content
- The pages are branded with the tenant's colors
- The content is readable and professional

**Pass criteria:** Privacy and Cookie pages load correctly

---

### UAT-23: Storefront Support Page

**Goal:** The storefront has a Support page where customers can submit tickets.

**Steps:**
1. Go to a published storefront URL
2. Navigate to the Support page (e.g., /store/companyname/support)

**Expected Result:**
- The Support page loads
- A support ticket form is visible (subject, description, category)
- The page is branded with the tenant's colors

**Pass criteria:** Support page loads with ticket form

---

## Section 5: Domain and Subdomain

### UAT-24: Subdomain Assignment Works

**Goal:** Each tenant gets a working subdomain (e.g., companyname.afruheritage.com).

**Steps:**
1. Log in to the customer app
2. Check your assigned subdomain in the settings or domain section
3. Try accessing your storefront via the subdomain URL

**Expected Result:**
- Your subdomain is shown in the settings
- The subdomain URL loads your storefront correctly
- The subdomain matches your company slug

**Pass criteria:** Subdomain assigned + URL works + correct tenant resolved

---

### UAT-25: Invalid Subdomain Shows 404

**Goal:** A non-existent subdomain returns a "not found" error, not another tenant's data.

**Steps:**
1. Try to access a subdomain that does not exist (e.g., nonexistentcompany.afruheritage.com)
2. Or call the API: GET /api/v1/tenant-context/subdomain/nonexistentcompany

**Expected Result:**
- You see a "404 — Tenant not found" error
- You do NOT see another tenant's data
- No internal error (500) is shown

**Pass criteria:** 404 for non-existent subdomain + no data leakage

---

### UAT-26: Custom Domain Request

**Goal:** A customer can request a custom domain (e.g., www.mycompany.com) for their storefront.

**Steps:**
1. Log in to the customer app
2. Go to Settings > Custom Domains
3. Enter your desired domain name
4. Submit the request

**Expected Result:**
- The domain request is submitted
- You receive DNS instructions (CNAME or A record to add)
- The domain status shows "Pending Verification"

**Pass criteria:** Domain request submitted + DNS instructions provided

---

### UAT-27: Custom Domain DNS Verification

**Goal:** After adding the DNS records, the customer can verify the domain.

**Steps:**
1. After requesting a custom domain (UAT-26)
2. Add the DNS records as instructed (or ask test coordinator to simulate)
3. Click "Verify Domain"

**Expected Result:**
- The verification checks the DNS records
- If DNS is correct, the domain status changes to "Verified" or "Active"
- If DNS is incorrect, an error message explains what's wrong

**Pass criteria:** Domain verification works with correct DNS

---

### UAT-28: Custom Domain Resolves to Tenant

**Goal:** A verified custom domain loads the correct tenant's storefront.

**Steps:**
1. After domain verification (UAT-27)
2. Open the custom domain in a browser

**Expected Result:**
- The custom domain loads the tenant's storefront
- The correct branding, template, and content are shown
- No other tenant's data is visible

**Pass criteria:** Custom domain resolves to correct tenant storefront

---

## Section 6: Support Tickets

### UAT-29: Customer Can Submit a Support Ticket

**Goal:** A customer (or anonymous visitor) can submit a support ticket from the storefront.

**Steps:**
1. Go to a published storefront URL
2. Find the "Support" or "Contact" section
3. Fill in the support ticket form (subject, description, category)
4. Submit the ticket

**Expected Result:**
- You see a confirmation that the ticket was created
- You receive a public ticket token/URL to track the ticket
- The ticket appears in the admin console's ticket list

**Pass criteria:** Ticket created + tracking token provided + visible in admin

---

### UAT-30: Customer Can View Ticket Status and Reply

**Goal:** A customer can check the status of their support ticket and reply to it.

**Steps:**
1. Use the public ticket URL/token from UAT-29
2. View the ticket status
3. Add a reply message
4. Submit the reply

**Expected Result:**
- You can see the ticket details (subject, description, status)
- You can see any messages from support staff
- Your reply is added to the conversation
- The reply is visible immediately

**Pass criteria:** Ticket status visible + reply added successfully

---

### UAT-31: Admin Can Manage Tickets

**Goal:** An admin can view and respond to support tickets in the admin console.

**Steps:**
1. Log in to the admin console
2. Navigate to the support/tickets section
3. Find the ticket submitted in UAT-29
4. View the ticket details
5. Reply to the ticket as an admin
6. Change the ticket status (e.g., to "In Progress" or "Resolved")

**Expected Result:**
- All tickets are listed with status, subject, and tenant info
- You can view full ticket details and conversation
- Your admin reply is saved and visible to the customer
- Status changes are saved

**Pass criteria:** Admin can view, reply, and update ticket status

---

### UAT-32: Support Dashboard

**Goal:** The support dashboard shows an overview of all support tickets.

**Steps:**
1. Go to https://afruheritage.com/support/dashboard
2. Review the dashboard

**Expected Result:**
- You see a list of tickets with status indicators
- You can filter tickets by status, tenant, or date
- Ticket counts are displayed (open, in progress, resolved)

**Pass criteria:** Support dashboard loads with ticket overview

---

## Section 7: Security and Tenant Isolation

### UAT-33: Customer Cannot Access Another Tenant's Data

**Goal:** A logged-in customer cannot access another tenant's data by changing IDs.

**Steps:**
1. Log in as Tenant A
2. Note your tenant ID from the URL or API
3. Try to access Tenant B's data by changing the tenant_id in the URL or API call
4. For example, try: GET /api/v1/billing/subscriptions?tenant_id={tenant_B_id}

**Expected Result:**
- You get a "403 — Tenant access denied" error
- You do NOT see Tenant B's data
- The system logs the access attempt (ask the test coordinator to verify)

**Pass criteria:** Cross-tenant access blocked with 403 error

---

### UAT-34: Non-Admin Cannot Access Admin Functions

**Goal:** A regular customer cannot access admin-only functions.

**Steps:**
1. Log in as a regular customer (not an admin)
2. Try to access https://admin.afruheritage.com
3. Try to call admin API endpoints (e.g., GET /api/v1/admin/billing/promotions)

**Expected Result:**
- You cannot access the admin console
- Admin API endpoints return "403 — Superuser access required"
- You are not shown any admin interface elements

**Pass criteria:** Admin functions blocked for non-admin users

---

## Section 8: System Health

### UAT-35: Health Check Returns OK

**Goal:** The platform's health check endpoint returns a healthy status.

**Steps:**
1. Open a browser and go to: https://afruheritage.com/health
2. Check the response

**Expected Result:**
- You see: {"status": "ok"}
- The page loads quickly (under 1 second)

**Pass criteria:** Health check returns ok status

---

### UAT-36: Detailed Health Check Shows All Components

**Goal:** The detailed health check shows the status of all critical services.

**Steps:**
1. Go to: https://afruheritage.com/health
2. Review the response

**Expected Result:**
- You see a JSON response with a "status" field ("ok" or "degraded")
- You see a "components" object with entries for: database, redis, fleetbase, paystack, smtp
- Each component has a "status" field ("ok", "error", or "not_configured")
- If any component shows "error", report it to the test coordinator

**Pass criteria:** All critical components show "ok" or "not_configured"

---

## Section 9: Backup and Recovery

### UAT-37: Backup Can Be Created

**Goal:** The test coordinator can create a database backup.

**Steps:**
1. This test is performed by the test coordinator
2. They run: ./scripts/backup_restore.sh backup
3. Verify the backup file is created

**Expected Result:**
- A backup file is created in the backup directory
- The file is non-empty (contains database data)
- The backup log records the operation

**Pass criteria:** Backup file created successfully

---

### UAT-38: Restore Works and Data Is Intact

**Goal:** The database can be restored from a backup and all data is intact.

**Steps:**
1. This test is performed by the test coordinator
2. They run: ./scripts/backup_restore.sh restore <backup_file>
3. After restore, verify critical data counts

**Expected Result:**
- The restore completes without errors
- Tenant count, user count, subscription count, and payment count match pre-backup values
- Active tenants and Fleetbase org mappings are preserved
- The Golden Test (UAT-17 and UAT-18) still passes after restore

**Pass criteria:** Data counts match + Golden Test passes after restore

---

## Section 10: Email Communications

### UAT-39: Registration Email Received

**Goal:** A new customer receives a welcome/verification email after registration.

**Steps:**
1. Register a new account (see UAT-01)
2. Check your email inbox

**Expected Result:**
- You receive an email from Afruheritage (from noreply@afruheritage.com or similar)
- The email is not in your spam folder (if it is, report it)
- The email contains your company name or email
- The email looks professional (not raw HTML or test content)

**Pass criteria:** Professional email received from Afruheritage sender

---

### UAT-40: Payment Confirmation Email Received

**Goal:** After a successful payment, the customer receives a payment confirmation email.

**Steps:**
1. Complete a payment (see UAT-09)
2. Check your email inbox

**Expected Result:**
- You receive a payment confirmation email
- The email shows the amount paid, currency (GHS), and plan name
- The email is sent to the tenant's contact email
- The email looks professional

**Pass criteria:** Payment confirmation email received with correct details

---

## Section 11: Customs and Duty Calculator

### UAT-41: Customs Duty Calculator Loads

**Goal:** The customs duty calculator page loads and shows country options.

**Steps:**
1. Go to https://afruheritage.com/customs
2. Review the page

**Expected Result:**
- The customs page loads
- You see links to country-specific calculators (Ghana, Kenya, Nigeria, Rwanda, South Africa, Tanzania, Uganda)
- A general duty calculator is available

**Pass criteria:** Customs page loads with country options

---

### UAT-42: Ghana Vehicle Duty Calculator

**Goal:** A user can calculate import duty for a vehicle in Ghana.

**Steps:**
1. Go to https://afruheritage.com/customs/ghana
2. Enter vehicle details (VIN, make, model, year, value)
3. Click "Calculate Duty"

**Expected Result:**
- The calculator returns an estimated duty amount
- The breakdown shows: import duty, VAT, NHIL, GETFL, and other applicable taxes
- The currency is GHS

**Pass criteria:** Duty calculation returns with correct breakdown

---

### UAT-43: VIN Decode

**Goal:** A user can decode a VIN (Vehicle Identification Number) to get vehicle details.

**Steps:**
1. Go to the customs duty calculator
2. Enter a valid VIN (test coordinator will provide one)
3. Click "Decode VIN"

**Expected Result:**
- The system returns vehicle details (make, model, year, engine type)
- The decoded information is used to pre-fill the duty calculator

**Pass criteria:** VIN decoded with correct vehicle details

---

### UAT-44: Customs Payment Callback

**Goal:** After a customs duty payment, the callback page handles the result.

**Steps:**
1. Complete a customs duty calculation
2. Proceed to payment (if available)
3. Observe the callback at /customs/payment-callback

**Expected Result:**
- The callback page loads without errors
- Payment status is shown (success or failure)
- The user is redirected to a confirmation page

**Pass criteria:** Customs payment callback works correctly

---

### UAT-45: Admin Customs Guest Usage

**Goal:** An admin can view customs guest usage statistics.

**Steps:**
1. Log in to the admin console
2. Navigate to /admin/customs/guest-usage
3. Review the guest usage data

**Expected Result:**
- The page shows how many guests have used the customs calculator
- Country breakdown is visible
- Usage trends are displayed

**Pass criteria:** Admin customs guest usage page loads with data

---

## Section 12: KYC Verification

### UAT-46: Customer Submits KYC Documents

**Goal:** A customer can submit KYC (Know Your Customer) verification documents.

**Steps:**
1. Log in to the customer app
2. Go to /kyc
3. Upload an ID document (passport, driver's license, or national ID)
4. Upload a proof of address (utility bill, bank statement)
5. Complete the liveness check (selfie/photo) if required
6. Submit the KYC application

**Expected Result:**
- Files are uploaded successfully
- The KYC status changes to "Pending Review"
- You see a confirmation message

**Pass criteria:** KYC documents uploaded + status shows pending

---

### UAT-47: Admin Reviews and Approves KYC

**Goal:** An admin can review and approve/reject KYC submissions.

**Steps:**
1. Log in to the admin console
2. Navigate to KYC pending reviews
3. Find the submission from UAT-46
4. Review the uploaded documents
5. Approve or reject the submission

**Expected Result:**
- Pending KYC submissions are listed
- Admin can view uploaded documents
- After approval, the customer's KYC status changes to "Verified"
- After rejection, the customer is notified with a reason

**Pass criteria:** Admin can review, approve, or reject KYC submissions

---

### UAT-48: Customer Can Check KYC Status

**Goal:** A customer can check their KYC verification status.

**Steps:**
1. Log in to the customer app
2. Go to /kyc
3. Check the status

**Expected Result:**
- The current KYC status is displayed (Pending, Verified, Rejected)
- If rejected, the reason is shown
- If verified, a verification badge or indicator is displayed

**Pass criteria:** KYC status visible to customer

---

## Section 13: CRM (Customer Relationship Management)

### UAT-49: Create CRM Customer

**Goal:** A tenant can create a new CRM customer/contact.

**Steps:**
1. Log in to the customer app
2. Go to /crm
3. Click "Add Customer" or "New Contact"
4. Fill in customer details (name, email, phone, company)
5. Save

**Expected Result:**
- The customer is created and appears in the CRM list
- The customer is assigned to the current tenant
- The customer stage is set to "Lead" or similar default

**Pass criteria:** CRM customer created and visible in list

---

### UAT-50: Add Customer Activity

**Goal:** A tenant can add an activity (call, email, meeting) to a CRM customer.

**Steps:**
1. Go to /crm
2. Select a customer
3. Click "Add Activity"
4. Choose activity type (call, email, meeting, note)
5. Enter a description
6. Save

**Expected Result:**
- The activity is added to the customer's timeline
- The activity is visible in the customer detail view
- The timestamp and user are recorded

**Pass criteria:** Activity added and visible in customer timeline

---

### UAT-51: Convert Customer to Tenant

**Goal:** A tenant can convert a CRM customer into a platform tenant.

**Steps:**
1. Go to /crm
2. Select a customer
3. Click "Convert to Tenant" or "Convert"
4. Confirm the conversion

**Expected Result:**
- The customer is converted to a tenant account
- The customer's stage changes to "Converted"
- The new tenant appears in the tenant list

**Pass criteria:** Customer converted to tenant successfully

---

### UAT-52: CRM Quotes

**Goal:** A tenant can create and manage quotes in the CRM.

**Steps:**
1. Go to /crm/quotes
2. Click "New Quote"
3. Select a customer
4. Add line items (service, quantity, price)
5. Save the quote

**Expected Result:**
- The quote is created with a unique quote number
- The quote shows the customer, line items, and total
- The quote can be edited or sent to the customer

**Pass criteria:** Quote created with correct details

---

## Section 14: Shipments and Tracking

### UAT-53: Create a Shipment

**Goal:** A tenant can create a new shipment record.

**Steps:**
1. Log in to the customer app
2. Go to /shipments
3. Click "New Shipment"
4. Fill in shipment details (origin, destination, weight, dimensions, contents)
5. Save

**Expected Result:**
- The shipment is created with a tracking number
- The shipment appears in the shipments list
- The initial status is "Created" or "Pending"

**Pass criteria:** Shipment created with tracking number

---

### UAT-54: Track a Shipment

**Goal:** A user can track a shipment by its tracking number.

**Steps:**
1. Go to /track
2. Enter a tracking number from UAT-53
3. Click "Track"

**Expected Result:**
- The tracking page shows the shipment status
- Origin, destination, and current location are displayed
- The status timeline is visible

**Pass criteria:** Shipment tracked with status and timeline

---

### UAT-55: Shipment Status Transitions

**Goal:** A shipment can transition through its lifecycle statuses.

**Steps:**
1. Create a shipment (UAT-53)
2. Ask the test coordinator to transition the shipment through statuses:
   Created → Picked Up → In Transit → Delivered
3. Check the shipment status after each transition

**Expected Result:**
- Each status transition is recorded
- The status history is visible
- Invalid transitions are rejected (e.g., Delivered → Created)

**Pass criteria:** Status transitions work correctly

---

### UAT-56: Import Shipments (CSV)

**Goal:** A tenant can import multiple shipments via CSV upload.

**Steps:**
1. Go to /shipments/import
2. Download the CSV template (if available)
3. Fill in shipment data
4. Upload the CSV file
5. Review the import results

**Expected Result:**
- The CSV is parsed and shipments are created
- A summary shows how many shipments were imported successfully
- Any errors are listed with row numbers

**Pass criteria:** CSV import creates shipments with error reporting

---

### UAT-57: Shipment Dashboard Summary

**Goal:** A tenant can see a summary of their shipments.

**Steps:**
1. Log in and go to /shipments
2. Review the dashboard summary

**Expected Result:**
- Total shipment count is displayed
- Shipments by status are shown (created, in transit, delivered)
- Recent shipments are listed

**Pass criteria:** Shipment summary loads with correct counts

---

## Section 15: Delivery Marketplace

### UAT-58: Post a Shipment to Marketplace

**Goal:** A tenant can post a shipment to the delivery marketplace for drivers to accept.

**Steps:**
1. Log in and go to /marketplace
2. Click "Post Shipment" or select a shipment to post
3. Set pickup and delivery details
4. Submit the post

**Expected Result:**
- The shipment is posted to the marketplace
- A suggested price is calculated based on distance and weight
- The post is visible to drivers

**Pass criteria:** Shipment posted to marketplace with suggested price

---

### UAT-59: Driver Searches and Accepts a Job

**Goal:** A driver can search for jobs and accept one.

**Steps:**
1. As a driver (ask test coordinator for driver credentials)
2. Go to /marketplace
3. Search for available jobs
4. Accept a job

**Expected Result:**
- Available jobs are listed with pickup/delivery details and price
- After accepting, the job is assigned to the driver
- The job status changes to "Accepted"

**Pass criteria:** Driver can search and accept marketplace jobs

---

### UAT-60: GPS Tracking Update

**Goal:** A driver can send GPS location updates for an active job.

**Steps:**
1. As a driver with an accepted job (UAT-59)
2. Send a GPS ping (location update)
3. Check the live map

**Expected Result:**
- The GPS location is recorded
- The location appears on the live map at /fleetbase/live-map
- The timestamp is recorded

**Pass criteria:** GPS ping recorded and visible on live map

---

## Section 16: Vendor Management

### UAT-61: Vendor Registration

**Goal:** A delivery vendor can register on the platform.

**Steps:**
1. Go to /vendors
2. Click "Register as Vendor"
3. Fill in vendor details (company name, contact, service areas, vehicle types)
4. Submit the registration

**Expected Result:**
- The vendor registration is submitted
- The status shows "Pending Review"
- A confirmation message is displayed

**Pass criteria:** Vendor registration submitted successfully

---

### UAT-62: Admin Reviews Vendor

**Goal:** An admin can review and approve/reject vendor registrations.

**Steps:**
1. Log in to the admin console
2. Navigate to vendor management
3. Find the vendor from UAT-61
4. Review the vendor details
5. Approve or reject

**Expected Result:**
- Pending vendors are listed
- Admin can view vendor details and documents
- After approval, the vendor status changes to "Active"
- After rejection, the vendor is notified

**Pass criteria:** Admin can review and approve/reject vendors

---

### UAT-63: Vendor Document Upload

**Goal:** A vendor can upload required documents (license, insurance, etc.).

**Steps:**
1. As a registered vendor, go to vendor settings
2. Upload required documents (business license, insurance certificate)
3. Save

**Expected Result:**
- Documents are uploaded successfully
- The documents appear in the vendor profile
- Admin can view the documents during review

**Pass criteria:** Vendor documents uploaded and visible to admin

---

## Section 17: Plugins

### UAT-64: Browse Plugin Catalog

**Goal:** A tenant can browse the available plugins.

**Steps:**
1. Log in to the customer app
2. Go to /plugins
3. Browse the plugin catalog

**Expected Result:**
- A list of available plugins is displayed
- Each plugin shows a name, description, and category
- Plugins can be filtered or searched

**Pass criteria:** Plugin catalog loads with available plugins

---

### UAT-65: Install a Plugin

**Goal:** A tenant can install a plugin from the catalog.

**Steps:**
1. Go to /plugins
2. Select a plugin
3. Click "Install"
4. Review the permissions/consent prompt
5. Confirm installation

**Expected Result:**
- The plugin is installed for the tenant
- The plugin appears in the "Installed Plugins" list
- The plugin can be enabled or disabled

**Pass criteria:** Plugin installed and appears in installed list

---

### UAT-66: Enable/Disable a Plugin

**Goal:** A tenant can enable or disable an installed plugin.

**Steps:**
1. Go to /plugins
2. Find an installed plugin
3. Click "Disable"
4. Verify the plugin is disabled
5. Click "Enable"
6. Verify the plugin is enabled

**Expected Result:**
- The plugin status changes between enabled and disabled
- When disabled, the plugin's features are not available
- When enabled, the plugin's features are available again

**Pass criteria:** Plugin can be enabled and disabled

---

### UAT-67: Uninstall a Plugin

**Goal:** A tenant can uninstall a plugin.

**Steps:**
1. Go to /plugins
2. Find an installed plugin
3. Click "Uninstall"
4. Confirm

**Expected Result:**
- The plugin is removed from the installed list
- The plugin's features are no longer available
- The plugin can be reinstalled from the catalog

**Pass criteria:** Plugin uninstalled successfully

---

### UAT-68: Admin Plugin Management

**Goal:** An admin can manage plugins from the admin console.

**Steps:**
1. Log in to the admin console
2. Go to /admin/plugins
3. Review the plugin list

**Expected Result:**
- All platform plugins are listed
- Admin can enable/disable plugins globally
- Admin can view plugin installation statistics

**Pass criteria:** Admin plugin management page loads

---

## Section 18: Team Members and RBAC

### UAT-69: Invite a Team Member

**Goal:** A tenant can invite a team member to their account.

**Steps:**
1. Log in to the customer app
2. Go to /members
3. Click "Invite Member" or "New Member"
4. Enter the member's name, email, and role
5. Send the invitation

**Expected Result:**
- The invitation is sent
- The member appears in the members list with "Pending" status
- The invited user receives an email invitation

**Pass criteria:** Team member invitation sent

---

### UAT-70: Edit a Team Member

**Goal:** A tenant can edit a team member's details and role.

**Steps:**
1. Go to /members
2. Select a member
3. Click "Edit"
4. Change the role or permissions
5. Save

**Expected Result:**
- The member's details are updated
- The role change takes effect
- The member's new permissions are applied

**Pass criteria:** Team member edited successfully

---

### UAT-71: Import Team Members (CSV)

**Goal:** A tenant can import multiple team members via CSV.

**Steps:**
1. Go to /members/import
2. Download the CSV template
3. Fill in member details (name, email, role)
4. Upload the CSV
5. Review import results

**Expected Result:**
- Members are imported from the CSV
- A summary shows successful imports and any errors
- Imported members appear in the members list

**Pass criteria:** CSV member import works with error reporting

---

### UAT-72: Admin RBAC Management

**Goal:** An admin can manage roles and permissions from the admin console.

**Steps:**
1. Log in to the admin console
2. Go to /admin/rbac
3. Review existing roles and permissions
4. Create a new role (e.g., "Regional Manager")
5. Assign permissions to the role

**Expected Result:**
- Existing roles and permissions are listed
- New roles can be created
- Permissions can be assigned to roles
- Roles can be assigned to users

**Pass criteria:** Admin can create roles and assign permissions

---

## Section 19: AI Features

### UAT-73: AI Chat Widget on Storefront

**Goal:** A customer or visitor can use the AI chat widget on a storefront.

**Steps:**
1. Go to a published storefront URL
2. Find the AI chat widget (usually bottom-right corner)
3. Type a question (e.g., "What services do you offer?")
4. Send the message

**Expected Result:**
- The AI chat widget is visible
- The AI responds with a relevant answer
- The response is contextual to the tenant's business

**Pass criteria:** AI chat widget works on storefront

---

### UAT-74: AI Chat in Tenant Dashboard

**Goal:** A logged-in tenant can use AI chat in their dashboard.

**Steps:**
1. Log in to the customer app
2. Access the AI chat feature
3. Ask a question about the platform or their data

**Expected Result:**
- The AI chat is accessible from the dashboard
- The AI responds with relevant information
- The response is contextual to the tenant's data

**Pass criteria:** AI chat works in tenant dashboard

---

## Section 20: Analytics

### UAT-75: Admin Analytics Dashboard

**Goal:** An admin can view platform-wide analytics.

**Steps:**
1. Log in to the admin console
2. Navigate to analytics
3. Review the dashboard

**Expected Result:**
- Total tenant count is displayed
- Active subscriptions are shown
- Revenue metrics are visible
- Growth trends are displayed

**Pass criteria:** Admin analytics dashboard loads with data

---

### UAT-76: Tenant Analytics Dashboard

**Goal:** A tenant can view their own analytics.

**Steps:**
1. Log in to the customer app
2. Navigate to analytics or dashboard
3. Review the analytics

**Expected Result:**
- Shipment count and status breakdown
- Revenue or transaction summary
- Storefront visit count (if available)
- Custom date range filtering

**Pass criteria:** Tenant analytics dashboard loads with data

---

## Section 21: Gallery

### UAT-77: Create a Gallery Post

**Goal:** A tenant can create a gallery post on their portal.

**Steps:**
1. Log in to the customer app
2. Go to /portal/gallery
3. Click "New Post" or "Create"
4. Enter a title and description
5. Save

**Expected Result:**
- The gallery post is created
- The post appears in the gallery list
- The post is associated with the current tenant

**Pass criteria:** Gallery post created successfully

---

### UAT-78: Upload Gallery Media

**Goal:** A tenant can upload images to a gallery post.

**Steps:**
1. Go to /portal/gallery
2. Select a post or create a new one
3. Click "Upload Media"
4. Select an image file
5. Upload

**Expected Result:**
- The image is uploaded
- The image appears in the gallery post
- The image is displayed correctly (not broken)

**Pass criteria:** Gallery media uploaded and displayed

---

## Section 22: WhatsApp Notifications

### UAT-79: Configure WhatsApp Groups

**Goal:** A tenant can configure WhatsApp notification groups.

**Steps:**
1. Log in to the customer app
2. Go to notification settings
3. Configure WhatsApp group(s)
4. Save

**Expected Result:**
- WhatsApp groups are saved
- A test connection can be performed
- The status shows "Connected" or "Configured"

**Pass criteria:** WhatsApp groups configured successfully

---

### UAT-80: Send Shipment Update via WhatsApp

**Goal:** A shipment status update triggers a WhatsApp notification.

**Steps:**
1. Configure WhatsApp (UAT-79)
2. Create or update a shipment (UAT-53, UAT-55)
3. Transition the shipment status
4. Check the WhatsApp group for a notification

**Expected Result:**
- A WhatsApp message is sent to the configured group
- The message contains shipment details (tracking number, status, location)
- The message is sent within a reasonable time (under 1 minute)

**Pass criteria:** WhatsApp notification sent on shipment status change

---

## Section 23: Fleet Operations

### UAT-81: Fleet Operations Dashboard

**Goal:** A tenant can view the fleet operations dashboard.

**Steps:**
1. Log in to the customer app
2. Go to /dashboard/fleetops
3. Review the dashboard

**Expected Result:**
- The fleet operations dashboard loads
- Vehicle count, driver count, and active orders are displayed
- Recent activity is visible

**Pass criteria:** Fleet operations dashboard loads

---

### UAT-82: Manage Drivers

**Goal:** A tenant can view and manage drivers.

**Steps:**
1. Go to /fleetbase/drivers
2. Review the driver list
3. Add a new driver (if available)
4. View driver details

**Expected Result:**
- The driver list loads
- Driver details include name, contact, assigned vehicle, status
- New drivers can be added

**Pass criteria:** Driver management page works

---

### UAT-83: Manage Vehicles

**Goal:** A tenant can view and manage vehicles.

**Steps:**
1. Go to /fleetbase/vehicles
2. Review the vehicle list
3. Add a new vehicle (if available)
4. View vehicle details

**Expected Result:**
- The vehicle list loads
- Vehicle details include plate number, model, capacity, status
- New vehicles can be added

**Pass criteria:** Vehicle management page works

---

### UAT-84: Live Map

**Goal:** A tenant can view the live map showing active vehicles and shipments.

**Steps:**
1. Go to /fleetbase/live-map
2. Review the map

**Expected Result:**
- The map loads without errors
- Active vehicles or shipments are shown as markers
- The map updates in real-time (or near real-time)

**Pass criteria:** Live map loads with active markers

---

## Section 24: Warehouse Notices

### UAT-85: Create a Warehouse Notice

**Goal:** A tenant can create a warehouse notice for incoming goods.

**Steps:**
1. Log in to the customer app
2. Navigate to warehouse notices (API: POST /api/v1/warehouse-notices)
3. Fill in notice details (arrival date, goods description, quantity)
4. Submit

**Expected Result:**
- The warehouse notice is created
- A confirmation is shown
- The notice appears in the notices list

**Pass criteria:** Warehouse notice created successfully

---

### UAT-86: View Warehouse Notices

**Goal:** A tenant can view their warehouse notices.

**Steps:**
1. Navigate to warehouse notices (API: GET /api/v1/warehouse-notices/{tenant_slug})
2. Review the list

**Expected Result:**
- All notices for the tenant are listed
- Each notice shows arrival date, goods, and status
- Only the current tenant's notices are visible

**Pass criteria:** Warehouse notices list loads with correct data

---

## Section 25: Tenant Registration Requests

### UAT-87: Submit a Tenant Registration Request

**Goal:** A prospective customer can submit a registration request for admin review.

**Steps:**
1. Go to /tenant-request
2. Fill in company details, contact info, and business type
3. Submit the request

**Expected Result:**
- The request is submitted
- A confirmation is shown with a request ID
- The status can be tracked

**Pass criteria:** Tenant registration request submitted

---

### UAT-88: Admin Reviews Tenant Request

**Goal:** An admin can review and approve/reject tenant registration requests.

**Steps:**
1. Log in to the admin console
2. Navigate to tenant requests
3. Find the request from UAT-87
4. Review the details
5. Approve or reject

**Expected Result:**
- Pending requests are listed
- Admin can view request details
- After approval, a tenant account is created
- After rejection, the requester is notified

**Pass criteria:** Admin can review and approve/reject tenant requests

---

## Section 26: Compliance and Legal Pages

### UAT-89: GDPR Page

**Goal:** The GDPR compliance page is accessible and informative.

**Steps:**
1. Go to /gdpr
2. Review the page

**Expected Result:**
- The page loads with GDPR compliance information
- Data subject rights are explained
- Contact information for data requests is provided

**Pass criteria:** GDPR page loads with compliance content

---

### UAT-90: Terms of Service Page

**Goal:** The Terms of Service page is accessible.

**Steps:**
1. Go to /terms-of-service
2. Review the page

**Expected Result:**
- The page loads with the platform's terms of service
- The content is readable and professional
- Last updated date is visible

**Pass criteria:** Terms of Service page loads

---

### UAT-91: Privacy Policy Page

**Goal:** The Privacy Policy page is accessible.

**Steps:**
1. Go to /privacy-policy
2. Review the page

**Expected Result:**
- The page loads with the platform's privacy policy
- Data collection and usage practices are explained
- The content is readable and professional

**Pass criteria:** Privacy Policy page loads

---

### UAT-92: Cookie Policy Page

**Goal:** The Cookie Policy page is accessible.

**Steps:**
1. Go to /cookie-policy
2. Review the page

**Expected Result:**
- The page loads with the cookie policy
- Cookie types and purposes are explained
- The content is readable

**Pass criteria:** Cookie Policy page loads

---

## Section 27: Location Pages

### UAT-93: Locations Landing Page

**Goal:** The locations landing page shows all available country pages.

**Steps:**
1. Go to /locations
2. Review the page

**Expected Result:**
- The page loads with a list of available locations
- Country links are visible (Ghana, Kenya, Nigeria, China, Djibouti, Somalia)
- Each link leads to a country-specific page

**Pass criteria:** Locations page loads with country links

---

### UAT-94: Country-Specific Location Page

**Goal:** A country-specific location page loads with relevant information.

**Steps:**
1. Go to /locations/ghana
2. Review the page

**Expected Result:**
- The page loads with Ghana-specific information
- Local services, contacts, or office details are shown
- The page is branded consistently with the platform

**Pass criteria:** Country location page loads with correct content

---

## Section 28: Products and Store

### UAT-95: View Products Page

**Goal:** A tenant can view and manage their products.

**Steps:**
1. Log in to the customer app
2. Go to /products
3. Review the product list

**Expected Result:**
- The products page loads
- Products are listed with name, price, and image
- Products can be added, edited, or deleted

**Pass criteria:** Products page loads with product list

---

### UAT-96: Store Page (Public)

**Goal:** The public store page shows a tenant's products.

**Steps:**
1. Go to /store (or a specific tenant store URL)
2. Review the page

**Expected Result:**
- The store page loads
- Products are displayed with images and prices
- The page is branded with the tenant's colors

**Pass criteria:** Public store page loads with products

---

## Section 29: Profile and Settings

### UAT-97: View and Edit Profile

**Goal:** A user can view and edit their profile.

**Steps:**
1. Log in to the customer app
2. Go to /profile
3. Update name, phone number, or avatar
4. Save

**Expected Result:**
- The profile page loads with current user details
- Changes are saved successfully
- The updated information is reflected immediately

**Pass criteria:** Profile viewed and edited successfully

---

### UAT-98: View and Edit Settings

**Goal:** A user can view and edit their account settings.

**Steps:**
1. Log in to the customer app
2. Go to /settings
3. Review notification preferences, language, and other settings
4. Make changes and save

**Expected Result:**
- The settings page loads
- Settings categories are visible (notifications, language, security)
- Changes are saved and applied

**Pass criteria:** Settings page loads and changes are saved

---

## Section 30: Documentation

### UAT-99: Docs Page

**Goal:** The documentation page is accessible.

**Steps:**
1. Go to /docs
2. Review the page

**Expected Result:**
- The docs page loads
- Documentation categories or articles are listed
- Content is readable and helpful

**Pass criteria:** Docs page loads with content

---

### UAT-100: Docs Features Page

**Goal:** The features documentation page lists platform features.

**Steps:**
1. Go to /docs/features
2. Review the page

**Expected Result:**
- The page loads with a list of platform features
- Each feature has a description
- The content is up to date

**Pass criteria:** Features docs page loads with feature list

---

## Summary Checklist

| Test ID | Description | Pass/Fail | Notes |
|---|---|---|---|
| UAT-01 | Sign Up as New Customer | | |
| UAT-02 | Log In After Registration | | |
| UAT-03 | Password Reset | | |
| UAT-04 | Social Login (Google) | | |
| UAT-05 | Onboarding Flow | | |
| UAT-06 | View Available Plans | | |
| UAT-07 | Start Free Trial | | |
| UAT-08 | Check Promotional Pricing | | |
| UAT-09 | Pay for Subscription (Sandbox) | | |
| UAT-10 | Duplicate Payment Does Not Double-Charge | | |
| UAT-11 | Payment via Flutterwave | | |
| UAT-12 | Payment via PayPal | | |
| UAT-13 | Download Payment Receipt | | |
| UAT-14 | Billing Callback Page | | |
| UAT-15 | Select Storefront Template | | |
| UAT-16 | Customize Branding | | |
| UAT-17 | Publish Storefront | | |
| UAT-18 | Anonymous Customer Views Storefront | | |
| UAT-19 | Suspended Tenant Storefront Blocked | | |
| UAT-20 | Storefront About Page | | |
| UAT-21 | Storefront New Arrivals Page | | |
| UAT-22 | Storefront Privacy and Cookie Pages | | |
| UAT-23 | Storefront Support Page | | |
| UAT-24 | Subdomain Assignment Works | | |
| UAT-25 | Invalid Subdomain Shows 404 | | |
| UAT-26 | Custom Domain Request | | |
| UAT-27 | Custom Domain DNS Verification | | |
| UAT-28 | Custom Domain Resolves to Tenant | | |
| UAT-29 | Customer Submits Support Ticket | | |
| UAT-30 | Customer Views Ticket Status | | |
| UAT-31 | Admin Manages Tickets | | |
| UAT-32 | Support Dashboard | | |
| UAT-33 | Cross-Tenant Access Blocked | | |
| UAT-34 | Non-Admin Cannot Access Admin Functions | | |
| UAT-35 | Health Check Returns OK | | |
| UAT-36 | Detailed Health Check Shows Components | | |
| UAT-37 | Backup Created | | |
| UAT-38 | Restore Works and Data Intact | | |
| UAT-39 | Registration Email Received | | |
| UAT-40 | Payment Confirmation Email Received | | |
| UAT-41 | Customs Duty Calculator Loads | | |
| UAT-42 | Ghana Vehicle Duty Calculator | | |
| UAT-43 | VIN Decode | | |
| UAT-44 | Customs Payment Callback | | |
| UAT-45 | Admin Customs Guest Usage | | |
| UAT-46 | Customer Submits KYC Documents | | |
| UAT-47 | Admin Reviews and Approves KYC | | |
| UAT-48 | Customer Can Check KYC Status | | |
| UAT-49 | Create CRM Customer | | |
| UAT-50 | Add Customer Activity | | |
| UAT-51 | Convert Customer to Tenant | | |
| UAT-52 | CRM Quotes | | |
| UAT-53 | Create a Shipment | | |
| UAT-54 | Track a Shipment | | |
| UAT-55 | Shipment Status Transitions | | |
| UAT-56 | Import Shipments (CSV) | | |
| UAT-57 | Shipment Dashboard Summary | | |
| UAT-58 | Post a Shipment to Marketplace | | |
| UAT-59 | Driver Searches and Accepts a Job | | |
| UAT-60 | GPS Tracking Update | | |
| UAT-61 | Vendor Registration | | |
| UAT-62 | Admin Reviews Vendor | | |
| UAT-63 | Vendor Document Upload | | |
| UAT-64 | Browse Plugin Catalog | | |
| UAT-65 | Install a Plugin | | |
| UAT-66 | Enable/Disable a Plugin | | |
| UAT-67 | Uninstall a Plugin | | |
| UAT-68 | Admin Plugin Management | | |
| UAT-69 | Invite a Team Member | | |
| UAT-70 | Edit a Team Member | | |
| UAT-71 | Import Team Members (CSV) | | |
| UAT-72 | Admin RBAC Management | | |
| UAT-73 | AI Chat Widget on Storefront | | |
| UAT-74 | AI Chat in Tenant Dashboard | | |
| UAT-75 | Admin Analytics Dashboard | | |
| UAT-76 | Tenant Analytics Dashboard | | |
| UAT-77 | Create a Gallery Post | | |
| UAT-78 | Upload Gallery Media | | |
| UAT-79 | Configure WhatsApp Groups | | |
| UAT-80 | Send Shipment Update via WhatsApp | | |
| UAT-81 | Fleet Operations Dashboard | | |
| UAT-82 | Manage Drivers | | |
| UAT-83 | Manage Vehicles | | |
| UAT-84 | Live Map | | |
| UAT-85 | Create a Warehouse Notice | | |
| UAT-86 | View Warehouse Notices | | |
| UAT-87 | Submit a Tenant Registration Request | | |
| UAT-88 | Admin Reviews Tenant Request | | |
| UAT-89 | GDPR Page | | |
| UAT-90 | Terms of Service Page | | |
| UAT-91 | Privacy Policy Page | | |
| UAT-92 | Cookie Policy Page | | |
| UAT-93 | Locations Landing Page | | |
| UAT-94 | Country-Specific Location Page | | |
| UAT-95 | View Products Page | | |
| UAT-96 | Store Page (Public) | | |
| UAT-97 | View and Edit Profile | | |
| UAT-98 | View and Edit Settings | | |
| UAT-99 | Docs Page | | |
| UAT-100 | Docs Features Page | | |

---

## Sign-Off

**Tester Name:** _______________________  
**Date:** _______________________  
**Overall Result:** Pass / Fail  
**Notes:** _______________________  

---

## Appendix: Codebase Coverage Map

This appendix maps each UAT test case to the backend route file and frontend page that implements it. This helps developers trace test failures to code.

| Test ID | Backend Route File | Frontend Page |
|---|---|---|
| UAT-01 | `auth.py`, `company_registration.py` | `/register` |
| UAT-02 | `auth.py`, `auth_pages.py` | `/login` |
| UAT-03 | `auth.py` | `/forgot-password`, `/reset-password` |
| UAT-04 | `social_auth.py` | `/login`, `/sign-in` |
| UAT-05 | `signup_onboarding_service.py` | `/onboarding` |
| UAT-06 | `billing.py` | `/pricing`, `/billing` |
| UAT-07 | `billing.py`, `saas_subscription.py` | `/billing` |
| UAT-08 | `billing.py`, `billing_admin.py` | `/pricing` |
| UAT-09 | `payment_hub.py`, `payments.py`, `paystack_client.py` | `/billing`, `/checkout` |
| UAT-10 | `payment_hub.py` (webhook idempotency) | N/A (webhook) |
| UAT-11 | `payment_hub.py`, `flutterwave_client.py` | `/billing` |
| UAT-12 | `payment_hub.py`, `paypal_client.py` | `/billing` |
| UAT-13 | `payment_hub.py` (`/receipt/{reference}`) | `/billing` |
| UAT-14 | `payment_hub.py` (callback) | `/billing/callback` |
| UAT-15 | `storefront_templates.py` | `/templates` |
| UAT-16 | `branding.py`, `tenant_branding_service.py` | `/settings`, `/storefront` |
| UAT-17 | `storefront.py` | `/storefront` |
| UAT-18 | `storefront.py`, `tenant_context.py` | `/store/[slug]` |
| UAT-19 | `storefront.py`, `tenant_lifecycle.py` | `/store/[slug]` |
| UAT-20 | `storefront.py` | `/store/[slug]/about` |
| UAT-21 | `new_arrivals.py` | `/store/[slug]/new-arrivals` |
| UAT-22 | `storefront.py` | `/store/[slug]/privacy`, `/store/[slug]/cookies` |
| UAT-23 | `support_crm.py` | `/store/[slug]/support` |
| UAT-24 | `tenant_context.py` | `/settings` |
| UAT-25 | `tenant_context.py` | N/A (API) |
| UAT-26 | `custom_domains.py`, `custom_domain_service.py` | `/settings` |
| UAT-27 | `custom_domains.py` (`/verify`) | `/settings` |
| UAT-28 | `custom_domains.py` (`/resolve`) | N/A (DNS) |
| UAT-29 | `support_crm.py` | `/store/[slug]/support`, `/support` |
| UAT-30 | `support_crm.py` | `/support/ticket/[token]` |
| UAT-31 | `support_crm.py`, `support_crm_service.py` | `/admin`, `/support/dashboard` |
| UAT-32 | `support_crm.py` | `/support/dashboard` |
| UAT-33 | `middleware/` (tenant isolation) | N/A (API) |
| UAT-34 | `rbac.py`, `middleware/` | `/admin` |
| UAT-35 | `health.py` | N/A (API) |
| UAT-36 | `health.py` | N/A (API) |
| UAT-37 | N/A | `scripts/backup_restore.sh` |
| UAT-38 | N/A | `scripts/backup_restore.sh` |
| UAT-39 | `email_client.py`, `notification_service.py` | N/A (email) |
| UAT-40 | `email_client.py`, `notification_service.py` | N/A (email) |
| UAT-41 | `customs.py` | `/customs` |
| UAT-42 | `customs.py` (`/ghana/vehicle-duty`) | `/customs/ghana` |
| UAT-43 | `customs.py` (`/vin-decode`), `vin_decoder.py` | `/customs/duty-calculator` |
| UAT-44 | `customs.py` | `/customs/payment-callback` |
| UAT-45 | `customs.py`, `customs_guest.py` | `/admin/customs/guest-usage` |
| UAT-46 | `kyc.py`, `kyc_service.py` | `/kyc` |
| UAT-47 | `kyc.py` (`/admin/pending`, `/admin/approve`) | `/admin` |
| UAT-48 | `kyc.py` (`/status`) | `/kyc` |
| UAT-49 | `crm.py` | `/crm` |
| UAT-50 | `crm.py` (`/customers/{id}/activities`) | `/crm` |
| UAT-51 | `crm.py` (`/customers/{id}/convert`) | `/crm` |
| UAT-52 | `crm.py` | `/crm/quotes` |
| UAT-53 | `shipments.py` | `/shipments/new` |
| UAT-54 | `shipments.py`, `shipment_tracking.py` | `/track` |
| UAT-55 | `shipments.py` (`/transition`) | `/shipments/[id]` |
| UAT-56 | `shipments.py` | `/shipments/import` |
| UAT-57 | `shipments.py` (`/summary`) | `/shipments` |
| UAT-58 | `marketplace.py` | `/marketplace` |
| UAT-59 | `marketplace.py` (`/drivers/search`, `/accept`) | `/marketplace` |
| UAT-60 | `marketplace.py` (`/gps`), `tracking_realtime.py` | `/fleetbase/live-map` |
| UAT-61 | `vendors.py` (`/register`) | `/vendors` |
| UAT-62 | `vendors.py` (`/admin`, `/admin/{id}/review`) | `/admin` |
| UAT-63 | `vendors.py` (`/me/documents`) | `/vendors` |
| UAT-64 | `plugins.py` (`/catalog`) | `/plugins` |
| UAT-65 | `plugins.py` (`/install`) | `/plugins` |
| UAT-66 | `plugins.py` (`/enable`, `/disable`) | `/plugins` |
| UAT-67 | `plugins.py` (`/uninstall`) | `/plugins` |
| UAT-68 | `plugins.py`, `plugin_service.py` | `/admin/plugins` |
| UAT-69 | `users.py` | `/members/new` |
| UAT-70 | `users.py` | `/members/[id]/edit` |
| UAT-71 | `users.py` | `/members/import` |
| UAT-72 | `rbac.py` (`/roles`, `/permissions`) | `/admin/rbac` |
| UAT-73 | `ai.py` (`/chat/public`) | Storefront widget |
| UAT-74 | `ai.py` (`/chat`) | Dashboard |
| UAT-75 | `analytics.py` (`/admin/summary`) | `/admin` |
| UAT-76 | `analytics.py` (`/{tenant_id}/dashboard`) | `/dashboard` |
| UAT-77 | `gallery.py` | `/portal/gallery` |
| UAT-78 | `gallery.py` (`/upload`) | `/portal/gallery` |
| UAT-79 | `whatsapp.py` (`/configure-groups`) | `/settings` |
| UAT-80 | `whatsapp.py` (`/send-shipment-update`) | N/A (trigger) |
| UAT-81 | `fleetbase_proxy.py` | `/dashboard/fleetops` |
| UAT-82 | `fleetbase_proxy.py` | `/fleetbase/drivers` |
| UAT-83 | `fleetbase_proxy.py` | `/fleetbase/vehicles` |
| UAT-84 | `fleetbase_proxy.py`, `tracking_realtime.py` | `/fleetbase/live-map` |
| UAT-85 | `warehouse_notices.py` | N/A (API) |
| UAT-86 | `warehouse_notices.py` | N/A (API) |
| UAT-87 | `tenant_requests.py` (`/register-request`) | `/tenant-request` |
| UAT-88 | `tenant_requests.py` (`/register-requests`) | `/admin` |
| UAT-89 | N/A (static page) | `/gdpr` |
| UAT-90 | N/A (static page) | `/terms-of-service` |
| UAT-91 | N/A (static page) | `/privacy-policy` |
| UAT-92 | N/A (static page) | `/cookie-policy` |
| UAT-93 | N/A (static page) | `/locations` |
| UAT-94 | N/A (static page) | `/locations/ghana` |
| UAT-95 | `products.py` | `/products` |
| UAT-96 | `products.py`, `storefront.py` | `/store`, `/store/[slug]` |
| UAT-97 | `users.py` | `/profile` |
| UAT-98 | `users.py`, `notification_preferences.py` | `/settings` |
| UAT-99 | N/A (static page) | `/docs` |
| UAT-100 | N/A (static page) | `/docs/features` |

---

*This document is for business testers. Technical evidence and developer documentation are maintained separately.*

*Version 2.0 — Updated Aug 24, 2026. Expanded from 26 to 100 test cases based on full codebase audit of backend routes (40+ route files) and frontend pages (60+ pages).*

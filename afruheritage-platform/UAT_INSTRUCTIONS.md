# UAT Instructions — Afruheritage Platform

## For Business Testers

**Version:** 1.0  
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

### UAT-03: Password Reset

**Goal:** A customer who forgot their password can reset it via email.

**Steps:**
1. Go to https://afruheritage.com/forgot-password
2. Enter your registered email address
3. Click "Send Reset Link"
4. Check your email for a password reset link
7. Click the link in the email
8. Enter a new password (at least 8 characters)
9. Click "Reset Password"
10. Try logging in with the new password

**Expected Result:**
- You see a message: "If an account with this email exists, a reset link has been sent"
- You receive a password reset email within 1-2 minutes
- The reset link works when clicked
- After setting a new password, you can log in with it
- The old password no longer works

**Pass criteria:** Password reset email received + new password works + old password rejected

---

## Section 2: Subscription and Payment

### UAT-04: View Available Plans

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

### UAT-05: Start Free Trial

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

### UAT-06: Check Promotional Pricing

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

### UAT-07: Pay for a Subscription (Sandbox/Test)

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

### UAT-08: Duplicate Payment Does Not Double-Charge

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

## Section 3: Storefront Setup

### UAT-09: Select a Storefront Template

**Goal:** A customer can choose a storefront template for their business.

**Steps:**
1. Log in to the customer app
2. Navigate to the storefront settings or template selection page
3. Browse the available templates (e.g., Freight, Fleet, E-commerce, Mall, Bookings, Real Estate, Restaurant)
4. Select a template that matches your business type
5. Save your selection

**Expected Result:**
- You see multiple template options with previews
- After selecting and saving, the template is applied to your storefront
- You see a confirmation message

**Pass criteria:** Template selected and saved successfully

---

### UAT-10: Customize Branding

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

### UAT-11: Publish Storefront

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

### UAT-12: Anonymous Customer Can View Storefront

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

### UAT-13: Suspended Tenant Storefront Is Blocked

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

## Section 5: Domain and Subdomain

### UAT-14: Subdomain Assignment Works

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

### UAT-15: Invalid Subdomain Shows 404

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

## Section 6: Support Tickets

### UAT-16: Customer Can Submit a Support Ticket

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

### UAT-17: Customer Can View Ticket Status and Reply

**Goal:** A customer can check the status of their support ticket and reply to it.

**Steps:**
1. Use the public ticket URL/token from UAT-16
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

### UAT-18: Admin Can Manage Tickets

**Goal:** An admin can view and respond to support tickets in the admin console.

**Steps:**
1. Log in to the admin console
2. Navigate to the support/tickets section
3. Find the ticket submitted in UAT-16
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

## Section 7: Security and Tenant Isolation

### UAT-19: Customer Cannot Access Another Tenant's Data

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

### UAT-20: Non-Admin Cannot Access Admin Functions

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

### UAT-21: Health Check Returns OK

**Goal:** The platform's health check endpoint returns a healthy status.

**Steps:**
1. Open a browser and go to: https://afruheritage.com/health
2. Check the response

**Expected Result:**
- You see: {"status": "ok"}
- The page loads quickly (under 1 second)

**Pass criteria:** Health check returns ok status

---

### UAT-22: Detailed Health Check Shows All Components

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

### UAT-23: Backup Can Be Created

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

### UAT-24: Restore Works and Data Is Intact

**Goal:** The database can be restored from a backup and all data is intact.

**Steps:**
1. This test is performed by the test coordinator
2. They run: ./scripts/backup_restore.sh restore <backup_file>
3. After restore, verify critical data counts

**Expected Result:**
- The restore completes without errors
- Tenant count, user count, subscription count, and payment count match pre-backup values
- Active tenants and Fleetbase org mappings are preserved
- The Golden Test (UAT-11 and UAT-12) still passes after restore

**Pass criteria:** Data counts match + Golden Test passes after restore

---

## Section 10: Email Communications

### UAT-25: Registration Email Received

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

### UAT-26: Payment Confirmation Email Received

**Goal:** After a successful payment, the customer receives a payment confirmation email.

**Steps:**
1. Complete a payment (see UAT-07)
2. Check your email inbox

**Expected Result:**
- You receive a payment confirmation email
- The email shows the amount paid, currency (GHS), and plan name
- The email is sent to the tenant's contact email
- The email looks professional

**Pass criteria:** Payment confirmation email received with correct details

---

## Summary Checklist

| Test ID | Description | Pass/Fail | Notes |
|---|---|---|---|
| UAT-01 | Sign Up as New Customer | | |
| UAT-02 | Log In After Registration | | |
| UAT-03 | Password Reset | | |
| UAT-04 | View Available Plans | | |
| UAT-05 | Start Free Trial | | |
| UAT-06 | Check Promotional Pricing | | |
| UAT-07 | Pay for Subscription (Sandbox) | | |
| UAT-08 | Duplicate Payment Does Not Double-Charge | | |
| UAT-09 | Select Storefront Template | | |
| UAT-10 | Customize Branding | | |
| UAT-11 | Publish Storefront | | |
| UAT-12 | Anonymous Customer Views Storefront | | |
| UAT-13 | Suspended Tenant Storefront Blocked | | |
| UAT-14 | Subdomain Assignment Works | | |
| UAT-15 | Invalid Subdomain Shows 404 | | |
| UAT-16 | Customer Submits Support Ticket | | |
| UAT-17 | Customer Views Ticket Status | | |
| UAT-18 | Admin Manages Tickets | | |
| UAT-19 | Cross-Tenant Access Blocked | | |
| UAT-20 | Non-Admin Cannot Access Admin Functions | | |
| UAT-21 | Health Check Returns OK | | |
| UAT-22 | Detailed Health Check Shows Components | | |
| UAT-23 | Backup Created | | |
| UAT-24 | Restore Works and Data Intact | | |
| UAT-25 | Registration Email Received | | |
| UAT-26 | Payment Confirmation Email Received | | |

---

## Sign-Off

**Tester Name:** _______________________  
**Date:** _______________________  
**Overall Result:** Pass / Fail  
**Notes:** _______________________  

---

*This document is for business testers. Technical evidence and developer documentation are maintained separately.*

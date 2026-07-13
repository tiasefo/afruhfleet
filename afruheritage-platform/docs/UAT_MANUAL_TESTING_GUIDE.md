# UAT Manual Testing Guide

## Overview

This guide is for human testers performing User Acceptance Testing (UAT) on the Afruheritage platform. The automated E2E script (`e2e_uat_test.sh`) covers technical baseline checks. This guide covers user experience, visual, and functional testing that requires human judgment.

---

## Prerequisites

- Platform running at `http://localhost:3002` (frontend) and `http://localhost:8100` (API)
- Browser: Chrome or Firefox with DevTools open
- Test tenants: AMOOKSCO Logistics, MetroMass Transit, Accra Florist Collective, Sahel Freight Express

### Test Credentials

| Role | Email | Password | Login URL |
|---|---|---|---|
| **Platform Admin** | `admin@afruheritage.com` | `Sumiasis243$` | `http://localhost:3001/sentinel/login/` |
| **AMOOKSCO Tenant User** | `test@amooksco-logistics.com` | `Amooksco@2026` | `http://localhost:3002/store/amooksco-logistics/sign-in` |
| **MetroMass Tenant User** | `test@metromass-transit.com` | `MetroMass@2026` | `http://localhost:3002/store/metromass-transit/sign-in` |

### Admin Console URLs

| Console | URL | Description |
|---|---|---|
| **Sentinel** (admin console) | `http://localhost:3001/sentinel/` | Full admin console — tenant management, billing, runners, runtimes, templates, domains, feature flags, analytics, tracking, tickets, vendors, KYC, payments, shipments, fleetbase ops, diagnostics |
| **Sentinel Login** | `http://localhost:3001/sentinel/login/` | Admin console login page (uses `email` field, not `username`) |
| **Sentinel Backend API** | `http://localhost:9200/sentinel/` | Backend API for admin console (not user-facing) |
| **Admin Console Backend** | `http://localhost:4000/admin/` | Legacy admin console backend (not user-facing) |
| **Basic Admin Page** | `http://localhost:3002/admin` | Lightweight admin page in main frontend (requires superuser, redirects to `/login` if not authenticated) |

> **Note:** There are two admin interfaces:
> 1. **Sentinel** (`http://localhost:3001/sentinel/`) — the full-featured admin console with dashboard, tenant management, billing, etc. This is the primary admin console for UAT.
> 2. **Basic Admin** (`http://localhost:3002/admin`) — a lightweight admin page in the main frontend. Requires superuser login via the main frontend auth.

---

## How to Run the Automated Baseline First

```bash
cd ~/fleetbase/afruhfleet/afruheritage-platform
chmod +x e2e_uat_test.sh
./e2e_uat_test.sh
```

All automated tests must pass before starting manual UAT. The script checks:
- Docker services health
- API health and docs
- Authentication (login, wrong password, no token)
- Rate limiting (5 login attempts/minute)
- Security headers (backend + frontend)
- Storefront rendering and branding
- Tenant isolation (no cross-tenant data leakage)
- No Fleetbase branding leakage
- Admin console pages accessible
- Fleetbase runtime API (runners + runtimes)
- Tenant management API
- Branding API (public)
- Public tracking endpoint
- WhatsApp webhook
- Gallery upload
- CORS configuration
- No TODO/mock remnants in production code
- Database connectivity

---

## Manual Test Cases

### 1. Admin Console Experience

**1.1 Admin Login**
1. Go to `http://localhost:3002/admin`
2. Log in with `admin@afruheritage.com` / `Sumiasis243$`
3. **Expected**: Dashboard loads with tenant list, stats, and admin controls
4. **Check**: No error messages, no blank pages, no loading spinners that never resolve

**1.2 Tenant List View**
1. Navigate to the tenants section in admin console
2. **Expected**: All 4 test tenants visible (AMOOKSCO, MetroMass, Accra Florist, Sahel Freight)
3. **Check**: Each tenant shows correct name, slug, status, template code
4. **Check**: No "Fleetbase" branding visible anywhere on the page

**1.3 Runtime Management**
1. Go to `/admin/runtime`
2. **Expected**: Runners table shows at least 1 runner (local-runner-01)
3. **Expected**: Runtimes table shows runtimes with statuses (queued, requested, failed, installing)
4. **Check**: Data is real (not "mock" or "placeholder" text)
5. **Check**: "Create Runner" form is functional — try filling it out (don't submit unless you want to create one)

**1.4 Extensions Page**
1. Go to `/fleetbase/extensions`
2. **Expected**: Runtimes list loads from API
3. **Expected**: Extensions section shows empty state (no extensions installed yet)
4. **Check**: No mock data displayed

**1.5 Admin Console Data Loading**
1. Navigate through all admin console tabs
2. **Expected**: Each tab loads real data or shows appropriate empty states
3. **Check**: No stale mock data, no "fallback to demo data" messages

---

### 2. Storefront Experience — AMOOKSCO Logistics

**2.1 Storefront Landing**
1. Go to `http://localhost:3002/store/amooksco-logistics`
2. **Expected**: Page shows "AMOOKSCO LOGISTICS" branding
3. **Check**: Company name, colors, and layout match freight template
4. **Check**: No "Afruheritage" or "Fleetbase" text visible to customer
5. **Check**: Page loads in under 3 seconds

**2.2 Sign In Page**
1. From the storefront, click "Sign In"
2. **Expected**: Login page shows AMOOKSCO branding (not generic)
3. **Check**: Page title in browser tab shows AMOOKSO name
4. **Check**: Tagline matches freight/logistics vertical

**2.3 Sign Up Page**
1. From the storefront, click "Register" or "Sign Up"
2. **Expected**: Registration page shows AMOOKSCO branding
3. **Check**: Form fields are appropriate for freight forwarder customers

**2.4 Tracking Search**
1. On the AMOOKSO storefront, find the tracking search bar
2. Enter a fake tracking number (e.g., "TEST123")
3. **Expected**: Shows "not found" or appropriate error message
4. **Check**: No 500 errors, no blank pages

**2.5 AI Chat Widget**
1. Look for the floating AI chat widget (bottom right corner)
2. Click to open it
3. Type a message (e.g., "Hello, I need help tracking my shipment")
4. **Expected**: Widget responds with a message
5. **Check**: No errors in browser console (F12 → Console)

**2.6 Support Ticket**
1. Find the support/contact section
2. Fill in a test support ticket
3. **Expected**: Form submits successfully or shows validation errors
4. **Check**: No 500 errors

**2.7 Vendor Registration**
1. Find the vendor/delivery partner registration link
2. Complete the 4-step vendor registration form
3. **Expected**: Form progresses through all 4 steps
4. **Expected**: Final submission shows success message
5. **Check**: No validation errors on valid input

---

### 3. Storefront Experience — MetroMass Transit

**3.1 Storefront Landing**
1. Go to `http://localhost:3002/store/metromass-transit`
2. **Expected**: Page shows "MetroMass Transit Ltd" branding
3. **Check**: Different branding from AMOOKSO (different colors, name, tagline)
4. **Check**: Template is fleet/transit-oriented

**3.2 Branding Consistency**
1. Click through sign-in, sign-up pages
2. **Expected**: All pages show MetroMass branding consistently
3. **Check**: No AMOOKSO branding leaks into MetroMass pages

---

### 4. Storefront Experience — Accra Florist Collective

**4.1 Cross-Vertical Test**
1. Go to `http://localhost:3002/store/accra-florist-collective`
2. **Expected**: Page shows "Accra Florist Collective" branding
3. **Check**: Template is ecommerce-oriented (different from freight)
4. **Check**: No freight-specific terminology on florist storefront

---

### 5. Tenant Isolation Verification

**5.1 No Cross-Tenant Data**
1. Open AMOOKSO storefront in one browser tab
2. Open MetroMass storefront in another tab
3. **Expected**: Each shows only its own branding and data
4. **Check**: No shared state between tabs

**5.2 No Branding Leakage**
1. View page source (Ctrl+U) on each storefront
2. Search for "Fleetbase" — **should not be found**
3. Search for "Afruheritage" — **should not be found** (except in boilerplate HTML/JSON)
4. Search for other tenant names — **should not be found**

---

### 6. Security Verification

**6.1 Security Headers**
1. Open DevTools (F12) → Network tab
2. Navigate to any storefront page
3. Click on the main document request
4. Check Response Headers for:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=()`

**6.2 Rate Limiting**
1. Go to the sign-in page
2. Attempt to log in with wrong password 6 times rapidly
3. **Expected**: 6th attempt shows "Rate limit exceeded" or similar error
4. **Check**: After 1 minute, you can try again

**6.3 Clickjacking Protection**
1. Create an HTML file with: `<iframe src="http://localhost:3002/store/amooksco-logistics"></iframe>`
2. Open it in a browser
3. **Expected**: Iframe is blank or shows error (X-Frame-Options: DENY prevents embedding)

---

### 7. New Tenant Signup Flow

**7.1 Registration**
1. Go to `http://localhost:3002` (main landing page)
2. Click "Get Started" or "Register"
3. Fill in new tenant details:
   - Company name: "Test Freight Co"
   - Email: a new email address
   - Password: a strong password
   - Template: freight
4. **Expected**: Registration completes successfully
5. **Expected**: New tenant appears in admin console tenant list

**7.2 New Tenant Storefront**
1. Go to `http://localhost:3002/store/test-freight-co` (or whatever slug was generated)
2. **Expected**: Storefront renders with the new tenant's branding
3. **Check**: Page is not blank, shows the company name

---

### 8. Mobile Responsiveness

**8.1 Storefront on Mobile**
1. Open Chrome DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select a mobile device (e.g., iPhone 12)
3. Navigate to each storefront
4. **Expected**: Layout adapts to mobile screen
5. **Check**: No horizontal scrolling, text is readable, buttons are tappable

**8.2 Admin Console on Mobile**
1. Test the admin console in mobile view
2. **Expected**: Admin console is usable on mobile (or shows appropriate message)

---

### 9. Browser Console Errors

**9.1 Check All Pages**
1. Open DevTools → Console (F12)
2. Navigate through every page listed in this guide
3. **Expected**: No red error messages
4. **Check**: Yellow warnings are acceptable, red errors are not
5. **Record**: Any console errors with the page URL and error message

---

## Issue Reporting Template

For each issue found, record:

```
### Issue #N
- **Page URL**: 
- **Tenant**: (AMOOKSO / MetroMass / Florist / Sahel / Admin)
- **Steps to reproduce**: 
  1. 
  2. 
  3. 
- **Expected behavior**: 
- **Actual behavior**: 
- **Screenshot**: (attach)
- **Console errors**: (if any)
- **Severity**: (Critical / Major / Minor)
```

---

## Sign-off Checklist

- [ ] All automated E2E tests pass
- [ ] Admin console — all pages load with real data
- [ ] AMOOKSO storefront — all features functional
- [ ] MetroMass storefront — all features functional
- [ ] Accra Florist storefront — renders correctly
- [ ] Sahel Freight storefront — renders correctly
- [ ] No Fleetbase branding leakage on any storefront
- [ ] No Afruheritage branding visible to tenant customers
- [ ] No cross-tenant data contamination
- [ ] Security headers present on all pages
- [ ] Rate limiting works on login
- [ ] New tenant signup flow works end-to-end
- [ ] Mobile responsiveness verified
- [ ] No browser console errors on any page
- [ ] AI chat widget functional
- [ ] Support ticket submission works
- [ ] Vendor registration form works
- [ ] Tracking search returns appropriate results/errors

---

## Tester Information

- **Tester name**: 
- **Date**: 
- **Environment**: localhost (Docker)
- **Browser**: 
- **Overall result**: PASS / FAIL
- **Notes**: 

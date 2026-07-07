# MYMESSUPCODING.MD - Issues & Endpoints Documentation

## DETAILED FEATURE TABLE WITH ROLE MAPPINGS

| Feature | Domain | Superuser | Tenant Admin | Staff | Customer | Vendor | Driver | Notes |
|---------|--------|-----------|--------------|-------|----------|--------|--------|-------|
| **Authentication & User Management** | Platform | ✅ Full | ✅ Manage tenant users | ✅ View own profile | ✅ View own profile | ✅ View own profile | ✅ View own profile | Customer can reset password |
| **Tenant Management** | Platform | ✅ Create/approve/delete | ✅ View/edit own settings | ❌ | ❌ | ❌ | ❌ | Customer never sees tenant management |
| **Tenant Branding** | Platform | ✅ All | ✅ Full branding control | ✅ View only | ❌ | ❌ | ❌ | Customer never sees branding |
| **Tenant Feature Flags** | Platform | ✅ Toggle all | ✅ Toggle tenant features | ❌ | ❌ | ❌ | ❌ | Customer never sees feature flags |
| **Custom Domains** | Platform | ✅ Manage all | ✅ Manage own domains | ❌ | ❌ | ❌ | ❌ | Customer never sees domains |
| **Billing & Subscriptions** | Platform | ✅ Full access | ✅ View/manage own billing | ❌ | ❌ | ❌ | ❌ | **Customer NEVER sees billing** |
| **Wallet Management** | Platform | ✅ All wallets | ✅ Own wallet | ❌ | ❌ | ❌ | ❌ | **Customer NEVER sees wallet** |
| **Marketplace - Post Shipments** | Platform | ✅ All | ✅ Full access | ✅ Post for tenant | ❌ | ✅ Post own | ❌ | Customer uses separate shipment route |
| **Marketplace - Vendor Bidding** | Platform | ✅ All | ✅ View/manage bids | ❌ | ❌ | ✅ Bid on jobs | ❌ | Customer never sees bidding |
| **Marketplace - GPS Tracking** | Platform | ✅ All | ✅ Full access | ✅ View tenant | ✅ View own | ❌ | ❌ | Customer can track own shipments |
| **Vendor Registration** | Platform | ✅ Approve/reject | ❌ | ❌ | ❌ | ✅ Self-register | ❌ | Customer never sees vendor registration |
| **Vendor Management** | Platform | ✅ All | ✅ View assigned | ❌ | ❌ | ❌ | ❌ | Customer never sees vendor management |
| **CRM - Customer Management** | Platform | ✅ All | ✅ Full access | ✅ View assigned | ❌ | ❌ | ❌ | Customer never sees CRM |
| **CRM - Activity Tracking** | Platform | ✅ All | ✅ Full access | ✅ Log own activities | ❌ | ❌ | ❌ | Customer never sees CRM |
| **CRM - Opportunity Pipeline** | Platform | ✅ All | ✅ Full access | ✅ View assigned | ❌ | ❌ | ❌ | Customer never sees CRM |
| **CRM - Quote Management** | Platform | ✅ All | ✅ Full access | ✅ Create own quotes | ❌ | ❌ | ❌ | Customer never sees CRM |
| **Support Tickets** | Platform | ✅ All | ✅ Tenant tickets | ✅ Assigned | ✅ Own tickets | ✅ Own tickets | ✅ Own tickets | Customer can send support requests |
| **KYC - Document Upload** | Platform | ✅ Review/approve | ❌ | ❌ | ✅ Upload own | ❌ | ❌ | Customer can upload own KYC |
| **KYC - Status Management** | Platform | ✅ Approve/reject | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees KYC management |
| **Customs Duty Calculator** | Platform | ✅ All | ✅ Full access | ✅ Calculate for tenant | ✅ Calculate for own | ❌ | ❌ | **Customer CAN use duty calculator** |
| **Products - Catalog** | Platform | ✅ All | ✅ Full access | ✅ View assigned | ✅ View only | ❌ | ❌ | Customer can view products (read-only) |
| **Products - Pricing** | Platform | ✅ All | ✅ Full control | ❌ | ❌ | ❌ | ❌ | Customer never sees pricing management |
| **Products - Inventory** | Platform | ✅ All | ✅ Full access | ✅ View inventory | ❌ | ❌ | ❌ | Customer never sees inventory |
| **Storefront Templates** | Platform | ✅ All | ✅ Select/change | ❌ | ❌ | ❌ | ❌ | Customer never sees template selection |
| **Template Preview** | Platform | ✅ All | ✅ View | ✅ View | ✅ View (read-only) | ❌ | ❌ | Customer can view templates (read-only) |
| **Gallery Management** | Platform | ✅ All | ✅ Full access | ✅ View only | ✅ View only | ❌ | ❌ | **Customer CAN view gallery** |
| **New Arrivals** | Platform | ✅ All | ✅ Full access | ✅ View only | ✅ View only | ❌ | ❌ | **Customer CAN view new arrivals** |
| **Shipments - Creation (Admin Route)** | Platform | ✅ All | ✅ Full access | ✅ Create for tenant | ❌ | ❌ | ❌ | Customer uses separate route |
| **Shipments - Creation (Customer Route)** | Platform | ❌ | ❌ | ❌ | ✅ Create own | ❌ | ❌ | **Separate customer route needed** |
| **Shipments - Management** | Platform | ✅ All | ✅ Full access | ✅ View assigned | ✅ View own | ❌ | ❌ | Customer can view own shipments |
| **Shipments - Status Updates** | Platform | ✅ All | ✅ Full access | ✅ Update assigned | ❌ | ❌ | ✅ Update assigned | Customer cannot update status |
| **Storage Fees** | Platform | ✅ All | ✅ View/manage | ❌ | ❌ | ❌ | ❌ | Customer never sees storage fees |
| **Shipment Tracking - GPS** | Platform | ✅ All | ✅ Full access | ✅ View tenant | ✅ View own | ❌ | ✅ Update assigned | **Customer CAN track own goods** |
| **AI Chat Widget** | Platform | ✅ All | ✅ Use | ✅ Use | ✅ Use | ✅ Use | ✅ Use | **Customer CAN use chat bot** |
| **AI Settings** | Platform | ✅ All | ✅ Configure | ❌ | ❌ | ❌ | ❌ | Customer never sees AI settings |
| **Geo/Maps Services** | Platform | ✅ All | ✅ View | ✅ View | ✅ View | ❌ | ✅ View | Customer can view maps |
| **Payments - Processing** | Platform | ✅ All | ✅ Own payments | ❌ | ❌ | ❌ | ❌ | **Customer NEVER sees payments** |
| **Feature Flags** | Platform | ✅ Toggle all | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees feature flags |
| **RBAC - Role Management** | Platform | ✅ System roles | ✅ Tenant roles | ❌ | ❌ | ❌ | ❌ | Customer never sees RBAC |
| **RBAC - Permission Management** | Platform | ✅ Full control | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees RBAC |
| **RBAC - User Role Assignment** | Platform | ✅ System users | ✅ Tenant users | ❌ | ❌ | ❌ | ❌ | Customer never sees RBAC |
| **Commercial Orchestration** | Platform | ✅ All workflows | ✅ Tenant workflows | ❌ | ❌ | ❌ | ❌ | Customer never sees orchestration |
| **Warehouse Notices** | Platform | ✅ All | ✅ Full access | ✅ View assigned | ❌ | ❌ | ❌ | Customer never sees warehouse |
| **WhatsApp Integration** | Platform | ✅ System config | ✅ Tenant config | ❌ | ❌ | ❌ | ❌ | Customer never sees WhatsApp config |
| **Analytics** | Platform | ✅ System analytics | ✅ Tenant analytics | ❌ | ❌ | ❌ | ❌ | Customer never sees analytics |
| **Bulk Import - Shipments** | Platform | ✅ All | ✅ Full access | ✅ Import for tenant | ❌ | ❌ | ❌ | **Customer NEVER sees bulk import** |
| **Bulk Import - Members** | Platform | ✅ All | ✅ Full access | ✅ Import for tenant | ❌ | ❌ | ❌ | **Customer NEVER sees bulk import** |
| **Member Registration** | Platform | ✅ All | ✅ Full access | ✅ Register members | ❌ | ❌ | ❌ | **Customer NEVER sees member registration** |
| **Admin Console - Billing** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Admin Console - Credits** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Admin Console - DNS** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Admin Console - Marketplace** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Admin Console - Subscriptions** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Admin Console - Tenant Preview** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Admin Console - Runtime** | Platform | ✅ Full access | ❌ | ❌ | ❌ | ❌ | ❌ | Customer never sees admin console |
| **Fleetbase Proxy** | Fleetbase | ✅ All tenants | ✅ Own Fleetbase | ❌ | ❌ | ❌ | ❌ | Customer never sees Fleetbase proxy |
| **Fleet Operations** | Fleetbase | ✅ All | ✅ Full access | ❌ | ❌ | ❌ | ✅ Assigned | Customer never sees fleet operations |
| **Driver Management** | Fleetbase | ✅ All | ✅ Full access | ❌ | ❌ | ❌ | ✅ View own | Customer never sees driver management |
| **Fleet Management** | Fleetbase | ✅ All | ✅ Full access | ❌ | ❌ | ❌ | ❌ | Customer never sees fleet management |
| **Vehicle Tracking** | Fleetbase | ✅ All | ✅ Full access | ❌ | ❌ | ❌ | ✅ Assigned | Customer never sees vehicle tracking |
| **Route Optimization** | Fleetbase | ✅ All | ✅ Full access | ❌ | ❌ | ❌ | ✅ View assigned | Customer never sees route optimization |
| **Order Management** | Fleetbase | ✅ All | ✅ Full access | ❌ | ❌ | ❌ | ✅ View assigned | Customer never sees order management |

## CUSTOMER ROLE RESTRICTIONS SUMMARY

**Customer CAN:**
- ✅ Use Customs Duty Calculator
- ✅ Track own shipments (GPS tracking)
- ✅ View own profile data
- ✅ Reset password
- ✅ View gallery (read-only)
- ✅ View new arrivals (read-only)
- ✅ Send support requests
- ✅ Use AI chat bot
- ✅ View products (read-only)
- ✅ Create own shipments (via separate customer route)
- ✅ Upload own KYC documents
- ✅ View maps

**Customer CANNOT:**
- ❌ See billing/subscription/wallet
- ❌ See bulk import (shipments or members)
- ❌ See member registration
- ❌ See tenant management/branding/feature flags
- ❌ See CRM
- ❌ See vendor management
- ❌ See admin console
- ❌ See Fleetbase operations
- ❌ Update shipment status
- ❌ See storage fees
- ❌ See analytics
- ❌ See RBAC management

## SEPARATE CUSTOMER SHIPMENT ROUTE DESIGN

**Current Admin Route:** `/api/v1/shipments` (POST - for tenant admins/staff)
**Proposed Customer Route:** `/api/v1/customer/shipments` (POST - for customers only)

**Customer Shipment Route Features:**
- Simplified form (fewer fields than admin route)
- Auto-assign to customer's tenant
- Auto-set customer as shipper
- No bulk import capability
- No storage fee configuration
- Read-only access to own shipments only
- Cannot update status (driver/admin only)
- Cannot delete shipments

**Implementation Plan:**
1. Create new API route: `POST /api/v1/customer/shipments`
2. Add customer-specific schema (simplified fields)
3. Add authentication check: must have Customer role
4. Auto-populate tenant_id from authenticated user
5. Auto-set customer as shipper/consignee
6. Return simplified response (no admin fields)

---

## TENANT SUBDOMAIN/REALM SEPARATION - TECHNICAL ANALYSIS

**Requirement:**
- afruheritage.com = main platform (for tenant admins, superusers)
- amooksco.afruheritage.com = tenant realm (for Amooksco customers/members)
- Login happens on tenant subdomain
- Members isolated to their tenant's realm
- Complete isolation between tenants

**Honest Technical Assessment:**

### ✅ NOT DIFFICULT - Standard Multi-Tenant Pattern

This is a **well-established SaaS pattern** that many platforms use (Shopify, Wix, etc.). The codebase already has most infrastructure in place.

### Technical Challenges (Ranked by Difficulty):

**1. DNS Configuration (Easy - Infrastructure)**
- Need wildcard DNS: `*.afruheritage.com` → server IP
- Already have custom domain support via Cloudflare
- **Effort:** 1-2 hours DNS setup

**2. SSL/TLS Certificates (Easy - Infrastructure)**
- Need wildcard SSL: `*.afruheritage.com`
- Can use Let's Encrypt with automated renewal
- Cloudflare can handle SSL termination
- **Effort:** 2-4 hours setup

**3. Nginx Routing (Easy - Configuration)**
- Configure Nginx to route all subdomains to same backend
- Pass Host header to backend for tenant resolution
- Already have Nginx templates in `infra/nginx/`
- **Effort:** 1-2 hours

**4. Tenant Resolution Middleware (Easy - Code)**
- Add middleware to extract tenant from subdomain (Host header)
- Store tenant context in request state
- Already have `tenant_context.py` - extend it
- **Effort:** 2-3 hours

**5. Authentication Flow Changes (Moderate - Code)**
- Move login from afruheritage.com to tenant subdomain
- Update JWT token to include tenant subdomain
- Update password reset links to use tenant subdomain
- Update email templates with correct subdomain
- **Effort:** 4-6 hours

**6. Frontend Subdomain Handling (Moderate - Code)**
- Next.js needs to handle subdomain routing
- Update API client to use correct subdomain
- Update navigation links to use tenant subdomain
- Already have tenant-aware routing in app-shell.tsx
- **Effort:** 4-6 hours

**7. Session/Cookie Isolation (Easy - Code)**
- Scope cookies to subdomain (`.afruheritage.com` vs specific subdomain)
- Already using JWT tokens (stateless), so less impact
- **Effort:** 1-2 hours

**8. Database Query Isolation (Already Done)**
- Already have `tenant_id` on all models
- Already have `_assert_tenant_access` middleware
- **Effort:** 0 hours (already implemented)

**9. Asset/CDN Isolation (Easy - Code)**
- Static assets already served from `/public/`
- Tenant branding already implemented (logo, colors)
- **Effort:** 1-2 hours

**10. Email Template Updates (Easy - Code)**
- Update email templates to use tenant subdomain
- Already have tenant branding in emails
- **Effort:** 2-3 hours

### Total Estimated Effort: 18-31 hours (2-4 days)

### Existing Infrastructure That Helps:
- ✅ Custom domain support already implemented
- ✅ Tenant branding already implemented
- ✅ Tenant isolation in database already implemented
- ✅ JWT authentication already implemented
- ✅ Cloudflare integration already implemented
- ✅ Nginx templates already exist

### What Needs to Be Built:
- ❌ Subdomain resolution middleware
- ❌ Subdomain-based authentication flow
- ❌ Frontend subdomain routing
- ❌ Email template subdomain links
- ❌ DNS/SSL wildcard setup

### Potential Risks:
1. **Migration Complexity**: Existing users on afruheritage.com need to be migrated to subdomains
2. **SEO Impact**: afruheritage.com vs subdomain SEO considerations
3. **Cookie Sharing**: Need to ensure cookies work across subdomains if needed
4. **Testing**: Need to test subdomain isolation thoroughly

### Recommendation:
**This is technically feasible and not difficult.** The codebase already has 80% of the infrastructure needed. The main work is:
1. DNS/SSL setup (infrastructure)
2. Subdomain resolution middleware (backend)
3. Frontend subdomain routing (frontend)
4. Authentication flow updates (both)

**Timeline:** 2-4 days to implement fully with testing.

---

## CRITICAL: Business Liability Issue - Auto-Fix Plugins

**Problem**: Auto-fix plugins run automatically without admin approval or business liability safeguards. This violates the contract agreed on Jul 2, 2026.

**Contract Requirements (CONTRACT_TEMPLATE_OPERATIONS.md)**:
1. Auto-fix runs automatically first (no admin approval)
2. **IF auto-fix fails for some endpoints:**
   - Template is still applied (graceful degradation)
   - **Admin console notification** is created: "Tenant X switched to template Y — endpoints Z could not be auto-fixed"
   - **Tenant account is tagged** with `pending_endpoints` flag visible in admin console
   - **Tenant receives notification:** "Some features may not work for 72 hours after template change. Our team has been notified."
   - **Storefront renders with fallbacks** for missing features
3. Admin fixes missing endpoints → system re-checks → clears the tag → tenant notification updated

**Current Implementation**: Auto-fix runs completely automatically with no notifications, no flags, no fallbacks.

**Missing Safeguards**:
- ❌ No admin notification when auto-fix fails
- ❌ No tenant notification for failed auto-fix
- ❌ No `pending_endpoints` flag on tenant model
- ❌ No graceful degradation with fallbacks
- ❌ No 72-hour warning system

**Business Liability Risk**: If auto-fix fails silently, tenants may have broken features without knowing, leading to SLA violations and legal liability.

**Features Being Implemented (Business Liability Safeguards):**
1. ✅ `pending_endpoints` column on Tenant model - tracks failed endpoints as JSON
2. ✅ `pending_endpoints_notified_at` column - tracks when tenant was notified
3. ✅ Admin notification when auto-fix fails - AuditEvent created with "template_auto_fix_failed" event type
4. ✅ Tenant notification for failed auto-fix - Email sent with 72-hour warning message
5. ✅ Graceful degradation - template still applied even if endpoints fail, returns `graceful_degradation` flag
6. ⏳ Admin console visibility - `pending_endpoints` flag visible in admin console tenant detail (UI needed)
7. ⏳ Endpoint re-check - admin can force re-check endpoints after fixing (endpoint needed)

---

## Issues Reported

### 1. Gallery 404 Error
**Problem**: Gallery page returns "This page could not be found" - no frontend UI exists
**Backend Status**: API exists and is mounted
**Frontend Status**: No gallery page in frontend

**Backend Endpoints**:
- `GET /api/v1/gallery` - List gallery posts (tenant-scoped)
- `POST /api/v1/gallery` - Create gallery post (requires tenant admin)
- `GET /api/v1/gallery/{post_id}` - Get specific gallery post
- `PATCH /api/v1/gallery/{post_id}` - Update gallery post (requires tenant admin)
- `DELETE /api/v1/gallery/{post_id}` - Delete gallery post (requires tenant admin)
- `POST /api/v1/gallery/upload` - Upload media for gallery (requires tenant admin)

**Frontend Missing**:
- No gallery page at `/gallery` or `/dashboard/gallery`
- No gallery management UI in tenant dashboard

---

### 2. User Management & RBAC for Tenant Admin
**Problem**: No UI for tenant admin to manage users, RBAC not properly enforced - users under tenants get same access level as tenant admin
**Backend Status**: User directory API exists with RBAC checks
**Frontend Status**: No user management UI in tenant dashboard

**Backend Endpoints**:
- `GET /api/v1/users` - List users (requires tenant admin or superuser)
- `POST /api/v1/users` - Create user (requires tenant admin or superuser)
- `GET /api/v1/users/{user_id}` - Get user details
- `PATCH /api/v1/users/{user_id}/role` - Update user role (requires tenant admin or superuser)
- `PATCH /api/v1/users/{user_id}/status` - Update user status (requires tenant admin or superuser)
- `POST /api/v1/users/{user_id}/reset` - Reset user password (requires tenant admin or superuser)
- `GET /api/v1/users/{user_id}/audit` - Get user audit log (requires tenant admin or superuser)

**RBAC Implementation**:
- `is_tenant_admin` flag on User model
- `require_tenant_admin` dependency in API routes
- `_resolve_tenant_scope` function enforces tenant admin access
- GroupMember role mapping to is_tenant_admin

**Frontend Missing**:
- No user management page at `/dashboard/users` or `/settings/users`
- No UI for tenant admin to create/edit/delete users
- No UI for managing user roles and permissions
- No UI for viewing user audit logs

---

### 3. Billing Subscription Issues
**Problem**: Billing subscription not done well - unclear what specific issues
**Backend Status**: Billing API exists with full subscription management
**Frontend Status**: Billing page exists but may have issues

**Backend Endpoints**:
- `GET /api/v1/billing/plans` - List available plans
- `POST /api/v1/billing/subscriptions/trial/{tenant_id}` - Start trial subscription
- `GET /api/v1/billing/subscriptions/{tenant_id}` - Get subscription status
- `POST /api/v1/billing/subscriptions/{tenant_id}/cancel` - Cancel subscription
- `POST /api/v1/billing/subscriptions/{tenant_id}/pause` - Pause subscription
- `POST /api/v1/billing/subscriptions/{tenant_id}/resume` - Resume subscription
- `GET /api/v1/billing/wallets/{tenant_id}` - Get wallet balance
- `POST /api/v1/billing/payments/init` - Initialize payment (Paystack)
- `POST /api/v1/billing/payments/verify` - Verify payment
- `POST /api/v1/billing/credits/consume` - Consume wallet credits

**Admin Billing Endpoints**:
- `POST /api/v1/billing/admin/assign-plan` - Admin assign plan to tenant
- `POST /api/v1/billing/admin/adjust-credits` - Admin adjust wallet credits
- `POST /api/v1/billing/admin/set-read-only` - Admin set subscription read-only

**Frontend Status**:
- Billing page exists at `/billing`
- May have issues with subscription display or payment flow

---

### 4. Missing SOP (Standard Operating Procedures)
**Problem**: No documented SOPs for tenant operations
**Status**: No SOP documentation exists

**Missing SOPs**:
- Tenant onboarding SOP
- User management SOP
- Subscription management SOP
- Template selection SOP
- Billing operations SOP
- Gallery management SOP

---

### 5. RBAC Enforcement Issues
**Problem**: Users under tenants get same access level as tenant admin
**Backend Status**: RBAC checks exist but may not be properly enforced in all endpoints
**Frontend Status**: No role-based UI restrictions

**RBAC Implementation**:
- User model has `is_tenant_admin` and `is_superuser` flags
- GroupMember model has `role` field (admin/customer)
- Runtime migration syncs GroupMember.role to User.is_tenant_admin
- `require_tenant_admin` dependency for admin-only endpoints
- `_resolve_tenant_scope` function for tenant access control

**Potential Issues**:
- Some endpoints may not use `require_tenant_admin` dependency
- Frontend may not hide admin-only features from non-admin users
- GroupMember role sync may not be working correctly

---

### 6. Password Reset Not Working
**Problem**: Password reset from main platform does not work
**Backend Status**: Password reset API now implemented (`POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/password-reset/confirm`)
**Frontend Status**: Password reset page exists but may need to be updated to use new endpoints

**Backend Endpoints**:
- ✅ `POST /api/v1/auth/forgot-password` - Request password reset (sends email with reset token) - NEWLY IMPLEMENTED
- ✅ `POST /api/v1/auth/password-reset/confirm` - Reset password with token - EXISTING
- `POST /api/v1/users/{user_id}/reset` - Admin force reset user password

**Backend Implementation**:
- ✅ `auth.py` now has `forgot_password()` endpoint that generates token and sends email
- ✅ Uses `notification_service.send_email()` to send reset link
- ✅ Sets `password_reset_token` and `password_reset_expires_at` on User model
- ✅ Sets `must_reset_password` flag
- ✅ Token expires in 1 hour
- ✅ Security: doesn't reveal if email exists

**Potential Issues**:
- Email may not be sending (notification_service configuration)
- Frontend reset flow may not be calling the correct endpoints
- Frontend may need to handle reset_token query parameter

---

## Summary of Missing Frontend Pages

1. **Gallery Management** - `/dashboard/gallery` or `/settings/gallery`
2. **User Management** - `/dashboard/users` or `/settings/users`
3. **Role Management** - `/dashboard/roles` or `/settings/roles`
4. **SOP Documentation** - `/docs/sops` or internal documentation

## Summary of Backend API Status

- ✅ Gallery API exists and is mounted
- ✅ User Management API exists with RBAC
- ✅ Billing API exists with full subscription management
- ❌ No SOP documentation
- ⚠️ RBAC enforcement may have gaps

## Next Steps

1. Create frontend pages for Gallery management
2. Create frontend pages for User management with RBAC UI
3. Create frontend pages for Role management
4. Document SOPs for all tenant operations
5. Audit all API endpoints for proper RBAC enforcement
6. Test RBAC enforcement with different user roles

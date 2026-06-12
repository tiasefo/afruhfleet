# AfruHeritage Platform API Consumption Guide

Generated: 2026-06-01T05:02:49.938758 UTC

API Base URL: `https://api.afruheritage.com/api/v1`

This guide lists the APIs external apps can consume for onboarding, subscriptions, vendor registration, marketplace, payment, KYC, GPS, and runtime provisioning.


## Client Onboarding / Commercial

### POST `/api/v1/payments/credits/purchase`

Purpose: Purchase Credits

Authentication Required: `Yes`

Request Schema: `CreditPurchaseRequest`

Response Schema: `CreditPurchaseResponse`

### GET `/api/v1/billing/plans`

Purpose: List Plans

Authentication Required: `No / Public`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/PlanResponse"
  },
  "title": "Response List Plans Api V1 Billing Plans Get"
}`

### POST `/api/v1/billing/subscriptions/trial/{tenant_id}`

Purpose: Start Trial

Authentication Required: `Yes`

Response Schema: `SubscriptionResponse`

### GET `/api/v1/billing/subscriptions/{tenant_id}`

Purpose: Get Subscription

Authentication Required: `Yes`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/SubscriptionResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Get Subscription Api V1 Billing Subscriptions  Tenant Id  Get"
}`

### GET `/api/v1/billing/wallets/{tenant_id}`

Purpose: Get Wallet

Authentication Required: `Yes`

Response Schema: `WalletResponse`

### GET `/api/v1/billing/wallets/{tenant_id}/transactions`

Purpose: List Wallet Transactions

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/WalletTransactionResponse"
  },
  "title": "Response List Wallet Transactions Api V1 Billing Wallets  Tenant Id  Transactions Get"
}`

### GET `/api/v1/billing/usage-costs`

Purpose: Get Usage Costs

Authentication Required: `Yes`

Response Schema: `{
  "items": {
    "$ref": "#/components/schemas/UsageCreditCostResponse"
  },
  "type": "array",
  "title": "Response Get Usage Costs Api V1 Billing Usage Costs Get"
}`

### POST `/api/v1/billing/payments/init`

Purpose: Init Payment

Authentication Required: `Yes`

Request Schema: `PaymentInitRequest`

Response Schema: `PaymentInitResponse`

### POST `/api/v1/billing/payments/verify/{reference}`

Purpose: Verify Payment

Authentication Required: `Yes`

Response Schema: `PaymentVerifyResponse`

### POST `/api/v1/billing/payments/reinit/{reference}`

Purpose: Reinit Payment

Authentication Required: `Yes`

Request Schema: `PaymentReinitRequest`

Response Schema: `PaymentInitResponse`

### POST `/api/v1/billing/credits/consume`

Purpose: Consume Credits

Authentication Required: `Yes`

Request Schema: `CreditConsumeRequest`

Response Schema: `WalletResponse`

### POST `/api/v1/billing/admin/read-only`

Purpose: Admin Set Read Only

Authentication Required: `Yes`

Request Schema: `BillingAdminSetReadOnlyRequest`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/SubscriptionResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Admin Set Read Only Api V1 Billing Admin Read Only Post"
}`

### POST `/api/v1/billing/admin/credits/adjust`

Purpose: Admin Credits Adjust

Authentication Required: `Yes`

Request Schema: `BillingAdminAdjustCreditsRequest`

Response Schema: `WalletResponse`

### POST `/api/v1/billing/admin/subscriptions/assign`

Purpose: Admin Assign Plan

Authentication Required: `Yes`

Request Schema: `BillingAdminAssignPlanRequest`

Response Schema: `SubscriptionResponse`

### GET `/api/v1/commercial/catalog`

Purpose: Catalog

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/commercial/signup/start`

Purpose: Signup Start

Authentication Required: `No / Public`

Request Schema: `SignupStart`

Response Schema: `{}`

### POST `/api/v1/commercial/signup/select-plan`

Purpose: Select Plan

Authentication Required: `No / Public`

Request Schema: `PlanSelect`

Response Schema: `{}`

### GET `/api/v1/commercial/signup/{signup_id}`

Purpose: Signup Status

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/commercial/signup/{signup_id}/provision-runtime`

Purpose: Provision Signup Runtime

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/commercial/signup/{signup_id}/reconcile-runtime`

Purpose: Reconcile Signup Runtime

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/commercial/signup/{signup_id}/provision-runtime-async`

Purpose: Provision Signup Runtime Async

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/admin/subscriptions/demo/activate/{tenant_id}/{plan_code}`

Purpose: Activate Demo Subscription

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/admin/subscriptions/{tenant_id}/features/{feature_code}`

Purpose: Check Feature

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/admin/credits/{tenant_id}`

Purpose: Tenant Credits

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/admin/credits/{tenant_id}/topup/{credits}`

Purpose: Topup Credits

Authentication Required: `No / Public`

Response Schema: `{}`


## Payment Hub / Paystack

### POST `/api/v1/payments/webhook/paystack`

Purpose: Paystack Webhook

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/payments/webhook/paypal`

Purpose: Paypal Webhook

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/payment-hub/initialize`

Purpose: Initialize Payment

Authentication Required: `No / Public`

Request Schema: `InitializePaymentRequest`

Response Schema: `{}`

### GET `/api/v1/payment-hub/verify/{reference}`

Purpose: Verify Payment

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/payment-hub/transactions/{tenant_id}`

Purpose: List Transactions

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/payment-hub/webhook/paystack`

Purpose: Paystack Webhook

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/payment-hub/receipt/{reference}`

Purpose: Payment Receipt

Authentication Required: `No / Public`

Response Schema: `{}`


## Marketplace

### POST `/api/v1/whatsapp/send-shipment-update`

Purpose: Send Shipment Update

Authentication Required: `Yes`

Request Schema: `{
  "type": "object",
  "title": "Shipment Data"
}`

Response Schema: `{}`

### POST `/api/v1/shipments/{tenant_id}/{shipment_id}/transition`

Purpose: Transition Shipment Status Route

Authentication Required: `Yes`

Response Schema: `ShipmentResponse`

### POST `/api/v1/shipments/{tenant_id}`

Purpose: Create Shipment Route

Authentication Required: `Yes`

Request Schema: `ShipmentCreate`

Response Schema: `ShipmentResponse`

### GET `/api/v1/shipments/{tenant_id}`

Purpose: Search Shipments Route

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response Search Shipments Route Api V1 Shipments  Tenant Id  Get"
}`

### GET `/api/v1/shipments/{tenant_id}/summary`

Purpose: Shipment Dashboard Summary Route

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response Shipment Dashboard Summary Route Api V1 Shipments  Tenant Id  Summary Get"
}`

### POST `/api/v1/shipments/{tenant_id}/members`

Purpose: Create Member Route

Authentication Required: `Yes`

Request Schema: `GroupMemberCreate`

Response Schema: `GroupMemberResponse`

### GET `/api/v1/shipments/{tenant_id}/members`

Purpose: List Members Route

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response List Members Route Api V1 Shipments  Tenant Id  Members Get"
}`

### GET `/api/v1/shipments/{tenant_id}/members/{member_id}`

Purpose: Get Member Route

Authentication Required: `Yes`

Response Schema: `GroupMemberResponse`

### PATCH `/api/v1/shipments/{tenant_id}/members/{member_id}`

Purpose: Update Member Route

Authentication Required: `Yes`

Request Schema: `GroupMemberUpdate`

Response Schema: `GroupMemberResponse`

### GET `/api/v1/shipments/{tenant_id}/{shipment_id}`

Purpose: Get Shipment Route

Authentication Required: `Yes`

Response Schema: `ShipmentResponse`

### PATCH `/api/v1/shipments/{tenant_id}/{shipment_id}`

Purpose: Update Shipment Route

Authentication Required: `Yes`

Request Schema: `ShipmentUpdate`

Response Schema: `ShipmentResponse`

### POST `/api/v1/shipments/{tenant_id}/{shipment_id}/events`

Purpose: Add Event Route

Authentication Required: `Yes`

Request Schema: `ShipmentEventCreate`

Response Schema: `ShipmentEventResponse`

### GET `/api/v1/shipments/{tenant_id}/{shipment_id}/events`

Purpose: Get Events Route

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/ShipmentEventResponse"
  },
  "title": "Response Get Events Route Api V1 Shipments  Tenant Id   Shipment Id  Events Get"
}`

### POST `/api/v1/shipments/{tenant_id}/{shipment_id}/location`

Purpose: Update Location Route

Authentication Required: `Yes`

Request Schema: `ShipmentLocationUpdate`

Response Schema: `ShipmentResponse`

### POST `/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/point`

Purpose: Ingest Tracking Point Route

Authentication Required: `Yes`

Request Schema: `TrackingPointIngestRequest`

Response Schema: `TrackingPointIngestResponse`

### GET `/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/latest`

Purpose: Latest Tracking Point Route

Authentication Required: `Yes`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/TrackingPointResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Latest Tracking Point Route Api V1 Shipments  Tenant Id   Shipment Id  Tracking Latest Get"
}`

### GET `/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/history`

Purpose: Tracking History Route

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/TrackingPointResponse"
  },
  "title": "Response Tracking History Route Api V1 Shipments  Tenant Id   Shipment Id  Tracking History Get"
}`

### GET `/api/v1/shipments/public/track/{tenant_id}/{tracking_number}`

Purpose: Public Track Route

Authentication Required: `No / Public`

Response Schema: `ShipmentPublicTrackResponse`

### POST `/api/v1/shipments/{tenant_id}/{shipment_id}/upload-image`

Purpose: Upload Shipment Image

Authentication Required: `Yes`

Response Schema: `ShipmentResponse`

### POST `/api/v1/shipments/{tenant_id}/import/csv`

Purpose: Import Csv Route

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/customer-portal/{tenant_id}/shipments`

Purpose: Get Customer Portal Shipments

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/{tenant_id}/shipment-routes`

Purpose: Get Active Shipment Routes

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/vendors/register`

Purpose: Register Vendor Route

Authentication Required: `No / Public`

Response Schema: `VendorRegisterResponse`

### GET `/api/v1/vendors/admin`

Purpose: List Vendors Admin

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response List Vendors Admin Api V1 Vendors Admin Get"
}`

### GET `/api/v1/vendors/admin/{vendor_id}`

Purpose: Get Vendor Admin

Authentication Required: `Yes`

Response Schema: `VendorResponse`

### POST `/api/v1/vendors/admin/{vendor_id}/review`

Purpose: Review Vendor Route

Authentication Required: `Yes`

Request Schema: `VendorReviewRequest`

Response Schema: `VendorResponse`

### POST `/api/v1/vendors/admin/{vendor_id}/suspend`

Purpose: Suspend Vendor Route

Authentication Required: `Yes`

Response Schema: `VendorResponse`

### POST `/api/v1/vendors/admin/{vendor_id}/documents`

Purpose: Upload Vendor Documents Route

Authentication Required: `Yes`

Response Schema: `VendorResponse`

### POST `/api/v1/vendors/me/documents`

Purpose: Submit My Vendor Documents Route

Authentication Required: `Yes`

Response Schema: `VendorDocumentSubmitResponse`

### PATCH `/api/v1/vendors/me/availability`

Purpose: Update My Availability Route

Authentication Required: `Yes`

Request Schema: `VendorAvailabilityUpdateRequest`

Response Schema: `VendorAvailabilityResponse`

### GET `/api/v1/vendors/marketplace`

Purpose: Search Vendor Marketplace

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response Search Vendor Marketplace Api V1 Vendors Marketplace Get"
}`

### GET `/api/v1/vendors/marketplace/{vendor_id}`

Purpose: Get Marketplace Vendor

Authentication Required: `Yes`

Response Schema: `VendorResponse`

### POST `/api/v1/vendors/{tenant_id}/marketplace/match`

Purpose: Suggest Marketplace Matches

Authentication Required: `Yes`

Request Schema: `VendorMatchRequest`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/VendorMatchResult"
  },
  "title": "Response Suggest Marketplace Matches Api V1 Vendors  Tenant Id  Marketplace Match Post"
}`

### POST `/api/v1/vendors/{tenant_id}/dispatch/auto`

Purpose: Auto Dispatch Route

Authentication Required: `Yes`

Request Schema: `AutoDispatchRequest`

Response Schema: `AutoDispatchResponse`

### POST `/api/v1/vendors/{tenant_id}/bookings`

Purpose: Create Booking Route

Authentication Required: `Yes`

Request Schema: `BookingCreateRequest`

Response Schema: `BookingResponse`

### GET `/api/v1/vendors/{tenant_id}/bookings`

Purpose: List Tenant Bookings

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response List Tenant Bookings Api V1 Vendors  Tenant Id  Bookings Get"
}`

### GET `/api/v1/vendors/me/bookings`

Purpose: List My Bookings

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response List My Bookings Api V1 Vendors Me Bookings Get"
}`

### GET `/api/v1/vendors/{tenant_id}/bookings/{booking_id}`

Purpose: Get Booking Route

Authentication Required: `Yes`

Response Schema: `BookingResponse`

### PATCH `/api/v1/vendors/{tenant_id}/bookings/{booking_id}`

Purpose: Update Booking Route

Authentication Required: `Yes`

Request Schema: `BookingUpdateRequest`

Response Schema: `BookingResponse`

### POST `/api/v1/vendors/me/bookings/{booking_id}/accept`

Purpose: Accept My Booking Route

Authentication Required: `Yes`

Request Schema: `BookingDecisionRequest`

Response Schema: `BookingResponse`

### POST `/api/v1/vendors/me/bookings/{booking_id}/reject`

Purpose: Reject My Booking Route

Authentication Required: `Yes`

Request Schema: `BookingDecisionRequest`

Response Schema: `BookingResponse`

### GET `/api/v1/marketplace/shipments`

Purpose: List My Shipments

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments`

Purpose: Post Shipment

Authentication Required: `No / Public`

Request Schema: `ShipmentPost`

Response Schema: `{}`

### GET `/api/v1/marketplace/shipments/{shipment_id}`

Purpose: Get Shipment

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/marketplace/drivers/search`

Purpose: Search Jobs

Authentication Required: `No / Public`

Request Schema: `DriverSearch`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{job_id}/accept`

Purpose: Accept Job

Authentication Required: `No / Public`

Request Schema: `AcceptJob`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{job_id}/tracking/{status}`

Purpose: Update Tracking

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{job_id}/gps`

Purpose: Add Gps Ping

Authentication Required: `No / Public`

Request Schema: `GpsPingRequest`

Response Schema: `{}`

### GET `/api/v1/marketplace/shipments/{job_id}/gps`

Purpose: Get Gps History

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{shipment_id}/bids`

Purpose: Submit Bid

Authentication Required: `Yes`

Request Schema: `BidCreate`

Response Schema: `{}`

### GET `/api/v1/marketplace/shipments/{shipment_id}/bids`

Purpose: List Bids

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/accept`

Purpose: Accept Bid

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/reject`

Purpose: Reject Bid

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/counter`

Purpose: Counter Bid

Authentication Required: `Yes`

Request Schema: `BidCounter`

Response Schema: `{}`

### POST `/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/respond-counter`

Purpose: Respond To Counter

Authentication Required: `Yes`

Request Schema: `BidResponse`

Response Schema: `{}`

### GET `/api/v1/marketplace/dashboard/driver`

Purpose: Driver Dashboard

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/admin/marketplace/jobs`

Purpose: List Jobs

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/admin/marketplace/jobs/{job_id}/cancel`

Purpose: Cancel Job

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/admin/marketplace/jobs/{job_id}/reassign/{driver_id}`

Purpose: Reassign Job

Authentication Required: `No / Public`

Response Schema: `{}`


## Driver / Fleet / GPS

### POST `/api/v1/tenants/{tenant_id}/runtime-auth`

Purpose: Update Tenant Runtime Auth

Authentication Required: `Yes`

Request Schema: `TenantRuntimeAuthUpdate`

Response Schema: `TenantResponse`

### POST `/api/v1/fleetbase-runtime/runners`

Purpose: Create Runner

Authentication Required: `Yes`

Request Schema: `RunnerCreateRequest`

Response Schema: `app__schemas__fleetbase_runtime__RunnerResponse`

### GET `/api/v1/fleetbase-runtime/runners`

Purpose: List Runners

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/app__schemas__fleetbase_runtime__RunnerResponse"
  },
  "title": "Response List Runners Api V1 Fleetbase Runtime Runners Get"
}`

### POST `/api/v1/fleetbase-runtime/deploy`

Purpose: Deploy Runtime

Authentication Required: `Yes`

Request Schema: `RuntimeDeployRequest`

Response Schema: `RuntimeResponse`

### GET `/api/v1/fleetbase-runtime/tenant/{tenant_id}`

Purpose: Get Runtime By Tenant

Authentication Required: `Yes`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/RuntimeResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Get Runtime By Tenant Api V1 Fleetbase Runtime Tenant  Tenant Id  Get"
}`

### POST `/api/v1/fleetbase-runtime/retry`

Purpose: Retry Runtime Route

Authentication Required: `Yes`

Request Schema: `RuntimeRetryRequest`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/RuntimeResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Retry Runtime Route Api V1 Fleetbase Runtime Retry Post"
}`

### POST `/api/v1/fleetbase-runtime/suspend`

Purpose: Suspend Runtime Route

Authentication Required: `Yes`

Request Schema: `RuntimeSuspendRequest`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/RuntimeResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Suspend Runtime Route Api V1 Fleetbase Runtime Suspend Post"
}`

### GET `/api/v1/fleetbase-runtime/{runtime_id}/events`

Purpose: Get Runtime Events

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/RuntimeEventResponse"
  },
  "title": "Response Get Runtime Events Api V1 Fleetbase Runtime  Runtime Id  Events Get"
}`

### GET `/api/v1/navigator/{tenant_id}/drivers`

Purpose: Get Navigator Drivers

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/navigator/{tenant_id}/tracking`

Purpose: Get Navigator Tracking

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/customer-portal/{tenant_id}/tracking`

Purpose: Get Customer Portal Tracking

Authentication Required: `Yes`

Response Schema: `{}`


## KYC / Identity

### POST `/api/v1/kyc/submit-manual`

Purpose: Submit Manual Kyc

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/kyc/upload-id`

Purpose: Upload Id Document

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/kyc/liveness`

Purpose: Upload Liveness Capture

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/kyc/status`

Purpose: Get Kyc Status

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/kyc/admin/pending`

Purpose: List Pending Kyc

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/kyc/admin/list`

Purpose: List Kyc Submissions

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/kyc/{submission_id}/review`

Purpose: Review Kyc Submission

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/kyc/admin/approve/{kyc_id}`

Purpose: Approve Kyc Submission

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/kyc/admin/revoke/{kyc_id}`

Purpose: Revoke Kyc Submission

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/kyc/ocr-parse`

Purpose: Ocr Parse Id

Authentication Required: `Yes`

Response Schema: `{}`


## Admin / Operations

### POST `/api/v1/tenants/register-request`

Purpose: Create Tenant Registration Request

Authentication Required: `No / Public`

Request Schema: `TenantRegistrationRequest`

Response Schema: `{}`

### GET `/api/v1/tenants/registration-status/{request_id}`

Purpose: Get Registration Status

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/tenants/register-requests`

Purpose: List Registration Requests

Authentication Required: `Yes`

Response Schema: `{}`

### PATCH `/api/v1/tenants/register-requests/{request_id}`

Purpose: Review Registration Request

Authentication Required: `Yes`

Request Schema: `TenantRequestReviewPayload`

Response Schema: `{}`

### POST `/api/v1/tenants/create`

Purpose: Create Tenant

Authentication Required: `Yes`

Request Schema: `TenantCreationRequest`

Response Schema: `TenantCreationResponse`

### POST `/api/v1/tenants/{tenant_id}/setup-infrastructure`

Purpose: Setup Tenant Infrastructure

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/tenants/{tenant_id}/status`

Purpose: Get Tenant Status

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/tenants/{tenant_id}/portal-url`

Purpose: Get Tenant Portal Url

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/tenants/auto-provision`

Purpose: Auto Provision Tenant

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/tenants`

Purpose: List Tenants

Authentication Required: `Yes`

Response Schema: `{
  "items": {
    "$ref": "#/components/schemas/TenantResponse"
  },
  "type": "array",
  "title": "Response List Tenants Api V1 Tenants Get"
}`

### POST `/api/v1/tenants`

Purpose: Create Tenant

Authentication Required: `Yes`

Request Schema: `TenantCreate`

Response Schema: `TenantResponse`

### POST `/api/v1/tenants/{tenant_id}/approve`

Purpose: Approve Tenant

Authentication Required: `Yes`

Request Schema: `ApprovalRequest`

Response Schema: `TenantResponse`

### POST `/api/v1/tenants/{tenant_id}/launch`

Purpose: Launch Tenant

Authentication Required: `Yes`

Request Schema: `LaunchRequest`

Response Schema: `JobResponse`

### GET `/api/v1/tenants/jobs/{job_id}`

Purpose: Get Job

Authentication Required: `Yes`

Response Schema: `JobResponse`

### POST `/api/v1/tenants/jobs/{job_id}/retry`

Purpose: Retry Job

Authentication Required: `Yes`

Response Schema: `JobResponse`

### GET `/api/v1/tenants/lookup`

Purpose: Lookup Tenant

Authentication Required: `Yes`

Response Schema: `TenantResponse`

### POST `/api/v1/tenants/{tenant_id}/resend-portal-url`

Purpose: Resend Portal Url

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response Resend Portal Url Api V1 Tenants  Tenant Id  Resend Portal Url Post"
}`

### GET `/api/v1/support-crm/admin/tickets`

Purpose: List Admin Tickets

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response List Admin Tickets Api V1 Support Crm Admin Tickets Get"
}`

### PATCH `/api/v1/support-crm/admin/tickets/{ticket_id}/status`

Purpose: Update Admin Ticket Status

Authentication Required: `Yes`

Response Schema: `{
  "type": "object",
  "title": "Response Update Admin Ticket Status Api V1 Support Crm Admin Tickets  Ticket Id  Status Patch"
}`

### GET `/api/v1/domains/tenant/{tenant_id}`

Purpose: Get Tenant Domains

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/DomainResponse"
  },
  "title": "Response Get Tenant Domains Api V1 Domains Tenant  Tenant Id  Get"
}`

### GET `/api/v1/domains/settings/{tenant_id}`

Purpose: Get Tenant Domain Settings

Authentication Required: `Yes`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/TenantDomainSettingsResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Get Tenant Domain Settings Api V1 Domains Settings  Tenant Id  Get"
}`

### GET `/api/v1/storefront/{tenant_id}/orders`

Purpose: Get Storefront Orders

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/storefront/{tenant_id}/customers`

Purpose: Get Storefront Customers

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/pallet/{tenant_id}/inventory`

Purpose: Get Pallet Inventory

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/pallet/{tenant_id}/warehouses`

Purpose: Get Pallet Warehouses

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/branding/{tenant_id}`

Purpose: Get Branding Route

Authentication Required: `Yes`

Response Schema: `BrandingResponse`

### PATCH `/api/v1/branding/{tenant_id}`

Purpose: Update Branding Route

Authentication Required: `Yes`

Request Schema: `BrandingUpdate`

Response Schema: `BrandingResponse`

### GET `/api/v1/branding/public/{tenant_id}`

Purpose: Get Public Branding Route

Authentication Required: `No / Public`

Response Schema: `BrandingResponse`

### POST `/api/v1/companies/retry-provisioning/{tenant_id}`

Purpose: Retry Fleetbase Provisioning

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/analytics/admin/summary`

Purpose: Admin Analytics Summary

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/admin/dns/records`

Purpose: Get Dns Records

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/admin/dns/provision/{slug}`

Purpose: Provision Dns

Authentication Required: `Yes`

Response Schema: `{}`

### DELETE `/api/v1/admin/dns/provision/{slug}`

Purpose: Remove Dns

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/admin/dns/ensure-wildcard`

Purpose: Ensure Wildcard

Authentication Required: `Yes`

Response Schema: `{}`


## Support

### POST `/api/v1/support-crm/accounts`

Purpose: Create Account

Authentication Required: `Yes`

Request Schema: `CRMAccountCreateRequest`

Response Schema: `CRMAccountResponse`

### GET `/api/v1/support-crm/accounts`

Purpose: List Accounts

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/CRMAccountResponse"
  },
  "title": "Response List Accounts Api V1 Support Crm Accounts Get"
}`

### GET `/api/v1/support-crm/contacts`

Purpose: List Contacts

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/CRMContactResponse"
  },
  "title": "Response List Contacts Api V1 Support Crm Contacts Get"
}`

### POST `/api/v1/support-crm/contacts`

Purpose: Create Contact

Authentication Required: `Yes`

Request Schema: `CRMContactCreateRequest`

Response Schema: `CRMContactResponse`

### GET `/api/v1/support-crm/opportunities`

Purpose: List Opportunities

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/OpportunityResponse"
  },
  "title": "Response List Opportunities Api V1 Support Crm Opportunities Get"
}`

### POST `/api/v1/support-crm/opportunities`

Purpose: Create Opportunity Route

Authentication Required: `Yes`

Request Schema: `OpportunityCreateRequest`

Response Schema: `OpportunityResponse`

### GET `/api/v1/support-crm/quotes`

Purpose: List Quotes

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/QuoteResponse"
  },
  "title": "Response List Quotes Api V1 Support Crm Quotes Get"
}`

### POST `/api/v1/support-crm/quotes`

Purpose: Create Quote Route

Authentication Required: `Yes`

Request Schema: `QuoteCreateRequest`

Response Schema: `QuoteResponse`

### POST `/api/v1/support-crm/public/tickets`

Purpose: Create Public Ticket Route

Authentication Required: `No / Public`

Request Schema: `PublicTicketCreateRequest`

Response Schema: `SupportTicketResponse`

### GET `/api/v1/support-crm/public/tickets/{public_token}`

Purpose: Get Public Ticket

Authentication Required: `No / Public`

Response Schema: `SupportTicketResponse`

### GET `/api/v1/support-crm/public/tickets/{public_token}/messages`

Purpose: Get Public Ticket Messages

Authentication Required: `No / Public`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/SupportTicketMessageResponse"
  },
  "title": "Response Get Public Ticket Messages Api V1 Support Crm Public Tickets  Public Token  Messages Get"
}`

### POST `/api/v1/support-crm/public/tickets/{public_token}/reply`

Purpose: Reply Public Ticket

Authentication Required: `No / Public`

Request Schema: `TicketReplyRequest`

Response Schema: `SupportTicketMessageResponse`


## Other APIs

### POST `/api/v1/auth/bootstrap`

Purpose: Bootstrap Admin

Authentication Required: `No / Public`

Request Schema: `BootstrapAdminRequest`

Response Schema: `TokenResponse`

### POST `/api/v1/auth/register`

Purpose: Register

Authentication Required: `No / Public`

Request Schema: `RegisterRequest`

Response Schema: `TokenResponse`

### POST `/api/v1/auth/login`

Purpose: Login

Authentication Required: `No / Public`

Request Schema: `LoginRequest`

Response Schema: `TokenResponse`

### GET `/api/v1/auth/me`

Purpose: Me

Authentication Required: `Yes`

Response Schema: `{
  "additionalProperties": {
    "anyOf": [
      {
        "type": "string"
      },
      {
        "type": "boolean"
      },
      {
        "type": "null"
      }
    ]
  },
  "type": "object",
  "title": "Response Me Api V1 Auth Me Get"
}`

### POST `/api/v1/auth/complete-onboarding`

Purpose: Complete Onboarding

Authentication Required: `Yes`

Request Schema: `CompleteOnboardingRequest`

Response Schema: `{
  "additionalProperties": {
    "anyOf": [
      {
        "type": "string"
      },
      {
        "type": "boolean"
      },
      {
        "type": "null"
      }
    ]
  },
  "type": "object",
  "title": "Response Complete Onboarding Api V1 Auth Complete Onboarding Post"
}`

### POST `/api/v1/auth/password-reset/confirm`

Purpose: Confirm Password Reset

Authentication Required: `No / Public`

Request Schema: `PasswordResetConfirmRequest`

Response Schema: `{
  "additionalProperties": {
    "type": "string"
  },
  "type": "object",
  "title": "Response Confirm Password Reset Api V1 Auth Password Reset Confirm Post"
}`

### GET `/api/v1/auth/social/providers`

Purpose: Get Supported Providers

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/auth/social/{provider}/login`

Purpose: Social Login

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/auth/social/{provider}`

Purpose: Social Login Url

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/auth/social/{provider}/callback`

Purpose: Social Callback

Authentication Required: `No / Public`

Response Schema: `{}`

### POST `/api/v1/auth/social/{provider}/token`

Purpose: Exchange Code For Token

Authentication Required: `No / Public`

Request Schema: `TokenExchangeRequest`

Response Schema: `{}`

### GET `/api/v1/auth/social/disconnect/{provider}`

Purpose: Disconnect Social Account

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/auth/social/connected`

Purpose: Get Connected Social Accounts

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/login`

Purpose: Login Page

Authentication Required: `No / Public`

### GET `/register`

Purpose: Register Page

Authentication Required: `No / Public`

### GET `/dashboard`

Purpose: Dashboard Page

Authentication Required: `Yes`

### GET `/`

Purpose: Home Page

Authentication Required: `No / Public`

### GET `/forgot-password`

Purpose: Forgot Password Page

Authentication Required: `No / Public`

### GET `/reset-password`

Purpose: Reset Password Page

Authentication Required: `No / Public`

### POST `/api/v1/payments/initiate`

Purpose: Initiate Payment

Authentication Required: `Yes`

Request Schema: `PaymentInitiateRequest`

Response Schema: `PaymentInitiateResponse`

### GET `/api/v1/payments/status/{payment_reference}`

Purpose: Get Payment Status

Authentication Required: `Yes`

Response Schema: `PaymentStatusResponse`

### GET `/api/v1/payments/statistics`

Purpose: Get Payment Statistics

Authentication Required: `Yes`

Response Schema: `PaymentStatistics`

### GET `/api/v1/payments/methods`

Purpose: Get Payment Methods

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/payments/balance`

Purpose: Get Account Balance

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/whatsapp/configure-groups`

Purpose: Configure Whatsapp Groups

Authentication Required: `Yes`

Request Schema: `{
  "items": {
    "type": "object"
  },
  "type": "array",
  "title": "Groups"
}`

Response Schema: `{}`

### POST `/api/v1/whatsapp/test-connection`

Purpose: Test Whatsapp Connection

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/whatsapp/send-customer-notification`

Purpose: Send Customer Notification

Authentication Required: `Yes`

Request Schema: `{
  "type": "object",
  "title": "Shipment Data"
}`

Response Schema: `{}`

### GET `/api/v1/whatsapp/status`

Purpose: Get Whatsapp Status

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/whatsapp-csv/upload`

Purpose: Upload Csv And Notify

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/runners`

Purpose: List Runners

Authentication Required: `Yes`

Response Schema: `{
  "items": {
    "$ref": "#/components/schemas/app__schemas__runner__RunnerResponse"
  },
  "type": "array",
  "title": "Response List Runners Api V1 Runners Get"
}`

### POST `/api/v1/runners`

Purpose: Create Runner

Authentication Required: `Yes`

Request Schema: `RunnerCreate`

Response Schema: `app__schemas__runner__RunnerResponse`

### POST `/api/v1/ai/chat`

Purpose: Ai Chat

Authentication Required: `Yes`

Request Schema: `AIChatRequest`

Response Schema: `AIChatResponse`

### GET `/api/v1/ai/widget/config`

Purpose: Get Widget Config

Authentication Required: `No / Public`

Response Schema: `AIWidgetConfigResponse`

### GET `/api/v1/domains/resolve`

Purpose: Resolve Hostname

Authentication Required: `No / Public`

Response Schema: `{
  "type": "object",
  "title": "Response Resolve Hostname Api V1 Domains Resolve Get"
}`

### GET `/api/v1/domains/{domain_id}/refresh-status`

Purpose: Refresh Domain Status

Authentication Required: `Yes`

Response Schema: `DomainResponse`

### POST `/api/v1/domains/request`

Purpose: Request Domain

Authentication Required: `Yes`

Request Schema: `DomainRequestCreate`

Response Schema: `DomainResponse`

### POST `/api/v1/domains/activate`

Purpose: Activate Domain Route

Authentication Required: `Yes`

Request Schema: `DomainActivateRequest`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/DomainResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Activate Domain Route Api V1 Domains Activate Post"
}`

### POST `/api/v1/domains/{domain_id}/fail`

Purpose: Fail Domain

Authentication Required: `Yes`

Request Schema: `DomainFailRequest`

Response Schema: `{
  "anyOf": [
    {
      "$ref": "#/components/schemas/DomainResponse"
    },
    {
      "type": "null"
    }
  ],
  "title": "Response Fail Domain Api V1 Domains  Domain Id  Fail Post"
}`

### GET `/api/v1/domains/{domain_id}/events`

Purpose: Get Domain Events

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/DomainEventResponse"
  },
  "title": "Response Get Domain Events Api V1 Domains  Domain Id  Events Get"
}`

### GET `/api/v1/i18n/translations/{lang}`

Purpose: Get Translations

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/i18n/languages`

Purpose: Get Supported Languages

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/i18n/detect`

Purpose: Detect User Language

Authentication Required: `No / Public`

Response Schema: `{}`

### GET `/api/v1/geo/geocode`

Purpose: Geocode Address

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/geocode/priority`

Purpose: Geocode Priority Address

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/geocode/city`

Purpose: Geocode City Region

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/route`

Purpose: Calculate Route

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/route/priority`

Purpose: Calculate Priority Route

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/nearby-cities`

Purpose: Get Nearby Priority Cities

Authentication Required: `Yes`

Response Schema: `{}`

### POST `/api/v1/geo/validate/address`

Purpose: Validate Priority Address

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/geo/country/{country}`

Purpose: Get Country Info

Authentication Required: `Yes`

Response Schema: `{}`

### GET `/api/v1/users`

Purpose: List Users

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/TenantUserResponse"
  },
  "title": "Response List Users Api V1 Users Get"
}`

### POST `/api/v1/users`

Purpose: Create User

Authentication Required: `Yes`

Request Schema: `TenantUserCreateRequest`

Response Schema: `TenantUserResponse`

### PATCH `/api/v1/users/{user_id}/status`

Purpose: Update User Status

Authentication Required: `Yes`

Request Schema: `TenantUserStatusUpdateRequest`

Response Schema: `TenantUserResponse`

### PATCH `/api/v1/users/{user_id}/role`

Purpose: Update User Role

Authentication Required: `Yes`

Request Schema: `TenantUserRoleUpdateRequest`

Response Schema: `TenantUserResponse`

### DELETE `/api/v1/users/{user_id}`

Purpose: Delete User

Authentication Required: `Yes`

### GET `/api/v1/users/audit`

Purpose: List User Audit Events

Authentication Required: `Yes`

Response Schema: `{
  "type": "array",
  "items": {
    "$ref": "#/components/schemas/TenantUserAuditResponse"
  },
  "title": "Response List User Audit Events Api V1 Users Audit Get"
}`

### POST `/api/v1/users/{user_id}/send-reset-link`

Purpose: Send User Reset Link

Authentication Required: `Yes`

Response Schema: `TenantUserResetResponse`

### POST `/api/v1/users/bulk-import`

Purpose: Bulk Import Users

Authentication Required: `Yes`

Response Schema: `BulkImportResult`

### POST `/api/v1/companies/register`

Purpose: Register Company

Authentication Required: `No / Public`

Response Schema: `CompanyRegisterResponse`

### GET `/health`

Purpose: Health

Authentication Required: `No / Public`

Response Schema: `{}`


# Schema Reference


## AIChatRequest

```json

{
  "properties": {
    "message": {
      "type": "string",
      "minLength": 1,
      "title": "Message"
    },
    "tenant_scope": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Scope"
    },
    "tenant_slug": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Slug"
    },
    "model": {
      "type": "string",
      "title": "Model",
      "default": "afruheritage-copilot:latest"
    },
    "page_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Page Url"
    },
    "context": {
      "type": "object",
      "title": "Context"
    }
  },
  "type": "object",
  "required": [
    "message"
  ],
  "title": "AIChatRequest"
}

```


## AIChatResponse

```json

{
  "properties": {
    "answer": {
      "type": "string",
      "title": "Answer"
    },
    "sources": {
      "items": {
        "type": "object"
      },
      "type": "array",
      "title": "Sources"
    }
  },
  "type": "object",
  "required": [
    "answer",
    "sources"
  ],
  "title": "AIChatResponse"
}

```


## AIWidgetConfigResponse

```json

{
  "properties": {
    "enabled": {
      "type": "boolean",
      "title": "Enabled"
    },
    "tenant_slug": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Slug"
    },
    "model": {
      "type": "string",
      "title": "Model",
      "default": "afruheritage-copilot:latest"
    },
    "scope": {
      "type": "string",
      "title": "Scope",
      "default": "shared"
    },
    "welcome_message": {
      "type": "string",
      "title": "Welcome Message",
      "default": "Welcome to Afruheritage Assistant. How can I help you today?"
    },
    "theme": {
      "type": "string",
      "title": "Theme",
      "default": "light"
    },
    "primary_color": {
      "type": "string",
      "title": "Primary Color",
      "default": "#0ea5e9"
    },
    "api_endpoint": {
      "type": "string",
      "title": "Api Endpoint",
      "default": "/api/v1/ai/chat"
    }
  },
  "type": "object",
  "required": [
    "enabled"
  ],
  "title": "AIWidgetConfigResponse"
}

```


## AcceptJob

```json

{
  "properties": {
    "driver_id": {
      "type": "string",
      "title": "Driver Id"
    }
  },
  "type": "object",
  "required": [
    "driver_id"
  ],
  "title": "AcceptJob"
}

```


## ApprovalRequest

```json

{
  "properties": {
    "verification_notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Verification Notes"
    }
  },
  "type": "object",
  "title": "ApprovalRequest"
}

```


## AutoDispatchRequest

```json

{
  "properties": {
    "shipment_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipment Id"
    },
    "pickup_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Address"
    },
    "delivery_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Delivery Address"
    },
    "pickup_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Latitude"
    },
    "pickup_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Longitude"
    },
    "vehicle_type_requested": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Vehicle Type Requested"
    },
    "region": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Region"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "candidate_limit": {
      "type": "integer",
      "maximum": 20.0,
      "minimum": 1.0,
      "title": "Candidate Limit",
      "default": 5
    }
  },
  "type": "object",
  "title": "AutoDispatchRequest"
}

```


## AutoDispatchResponse

```json

{
  "properties": {
    "booking": {
      "$ref": "#/components/schemas/BookingResponse"
    },
    "selected_vendor": {
      "$ref": "#/components/schemas/VendorMatchResult"
    },
    "fallback_candidates": {
      "items": {
        "$ref": "#/components/schemas/VendorMatchResult"
      },
      "type": "array",
      "title": "Fallback Candidates"
    }
  },
  "type": "object",
  "required": [
    "booking",
    "selected_vendor",
    "fallback_candidates"
  ],
  "title": "AutoDispatchResponse"
}

```


## BidCounter

```json

{
  "properties": {
    "counter_price": {
      "type": "number",
      "title": "Counter Price"
    },
    "counter_message": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Counter Message"
    }
  },
  "type": "object",
  "required": [
    "counter_price"
  ],
  "title": "BidCounter"
}

```


## BidCreate

```json

{
  "properties": {
    "proposed_price": {
      "type": "number",
      "title": "Proposed Price"
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "default": "GHS"
    },
    "message": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "proposed_price"
  ],
  "title": "BidCreate"
}

```


## BidResponse

```json

{
  "properties": {
    "response": {
      "type": "string",
      "title": "Response"
    }
  },
  "type": "object",
  "required": [
    "response"
  ],
  "title": "BidResponse"
}

```


## BillingAdminAdjustCreditsRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "credits_delta": {
      "type": "integer",
      "title": "Credits Delta"
    },
    "memo": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Memo"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "credits_delta"
  ],
  "title": "BillingAdminAdjustCreditsRequest"
}

```


## BillingAdminAssignPlanRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "plan_code": {
      "type": "string",
      "title": "Plan Code"
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "default": "GHS"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "plan_code"
  ],
  "title": "BillingAdminAssignPlanRequest"
}

```


## BillingAdminSetReadOnlyRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "reason": {
      "type": "string",
      "title": "Reason"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "reason"
  ],
  "title": "BillingAdminSetReadOnlyRequest"
}

```


## Body_bulk_import_users_api_v1_users_bulk_import_post

```json

{
  "properties": {
    "file": {
      "type": "string",
      "format": "binary",
      "title": "File"
    }
  },
  "type": "object",
  "required": [
    "file"
  ],
  "title": "Body_bulk_import_users_api_v1_users_bulk_import_post"
}

```


## Body_import_csv_route_api_v1_shipments__tenant_id__import_csv_post

```json

{
  "properties": {
    "file": {
      "type": "string",
      "format": "binary",
      "title": "File"
    }
  },
  "type": "object",
  "required": [
    "file"
  ],
  "title": "Body_import_csv_route_api_v1_shipments__tenant_id__import_csv_post"
}

```


## Body_ocr_parse_id_api_v1_kyc_ocr_parse_post

```json

{
  "properties": {
    "id_image": {
      "type": "string",
      "format": "binary",
      "title": "Id Image"
    }
  },
  "type": "object",
  "required": [
    "id_image"
  ],
  "title": "Body_ocr_parse_id_api_v1_kyc_ocr_parse_post"
}

```


## Body_submit_manual_kyc_api_v1_kyc_submit_manual_post

```json

{
  "properties": {
    "id_type": {
      "type": "string",
      "title": "Id Type"
    },
    "id_number": {
      "type": "string",
      "title": "Id Number"
    },
    "full_name": {
      "type": "string",
      "title": "Full Name"
    },
    "id_front": {
      "type": "string",
      "format": "binary",
      "title": "Id Front"
    },
    "id_back": {
      "type": "string",
      "format": "binary",
      "title": "Id Back"
    },
    "liveness_photo": {
      "type": "string",
      "format": "binary",
      "title": "Liveness Photo"
    },
    "liveness_video": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Liveness Video"
    }
  },
  "type": "object",
  "required": [
    "id_type",
    "id_number",
    "full_name",
    "id_front",
    "id_back",
    "liveness_photo"
  ],
  "title": "Body_submit_manual_kyc_api_v1_kyc_submit_manual_post"
}

```


## Body_submit_my_vendor_documents_route_api_v1_vendors_me_documents_post

```json

{
  "properties": {
    "id_front": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Front"
    },
    "id_back": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Back"
    },
    "selfie_photo": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Selfie Photo"
    },
    "insurance_doc": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Insurance Doc"
    },
    "roadworthy_doc": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Roadworthy Doc"
    }
  },
  "type": "object",
  "title": "Body_submit_my_vendor_documents_route_api_v1_vendors_me_documents_post"
}

```


## Body_upload_csv_and_notify_api_v1_whatsapp_csv_upload_post

```json

{
  "properties": {
    "file": {
      "type": "string",
      "format": "binary",
      "title": "File"
    }
  },
  "type": "object",
  "required": [
    "file"
  ],
  "title": "Body_upload_csv_and_notify_api_v1_whatsapp_csv_upload_post"
}

```


## Body_upload_id_document_api_v1_kyc_upload_id_post

```json

{
  "properties": {
    "file": {
      "type": "string",
      "format": "binary",
      "title": "File"
    },
    "side": {
      "type": "string",
      "title": "Side",
      "default": "front"
    }
  },
  "type": "object",
  "required": [
    "file"
  ],
  "title": "Body_upload_id_document_api_v1_kyc_upload_id_post"
}

```


## Body_upload_liveness_capture_api_v1_kyc_liveness_post

```json

{
  "properties": {
    "photo": {
      "type": "string",
      "format": "binary",
      "title": "Photo"
    },
    "video": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Video"
    }
  },
  "type": "object",
  "required": [
    "photo"
  ],
  "title": "Body_upload_liveness_capture_api_v1_kyc_liveness_post"
}

```


## Body_upload_shipment_image_api_v1_shipments__tenant_id___shipment_id__upload_image_post

```json

{
  "properties": {
    "file": {
      "type": "string",
      "format": "binary",
      "title": "File"
    }
  },
  "type": "object",
  "required": [
    "file"
  ],
  "title": "Body_upload_shipment_image_api_v1_shipments__tenant_id___shipment_id__upload_image_post"
}

```


## Body_upload_vendor_documents_route_api_v1_vendors_admin__vendor_id__documents_post

```json

{
  "properties": {
    "id_front": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Front"
    },
    "id_back": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Back"
    },
    "selfie_photo": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Selfie Photo"
    },
    "insurance_doc": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Insurance Doc"
    },
    "roadworthy_doc": {
      "anyOf": [
        {
          "type": "string",
          "format": "binary"
        },
        {
          "type": "null"
        }
      ],
      "title": "Roadworthy Doc"
    }
  },
  "type": "object",
  "title": "Body_upload_vendor_documents_route_api_v1_vendors_admin__vendor_id__documents_post"
}

```


## BookingCreateRequest

```json

{
  "properties": {
    "vendor_id": {
      "type": "string",
      "title": "Vendor Id"
    },
    "shipment_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipment Id"
    },
    "pickup_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Address"
    },
    "delivery_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Delivery Address"
    },
    "vehicle_type_requested": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Vehicle Type Requested"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    }
  },
  "type": "object",
  "required": [
    "vendor_id"
  ],
  "title": "BookingCreateRequest"
}

```


## BookingDecisionRequest

```json

{
  "properties": {
    "note": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Note"
    }
  },
  "type": "object",
  "title": "BookingDecisionRequest"
}

```


## BookingResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "vendor_id": {
      "type": "string",
      "title": "Vendor Id"
    },
    "vendor_name": {
      "type": "string",
      "title": "Vendor Name"
    },
    "shipment_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipment Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "pickup_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Address"
    },
    "delivery_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Delivery Address"
    },
    "vehicle_type_requested": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Vehicle Type Requested"
    },
    "driver_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Driver Name"
    },
    "driver_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Driver Phone"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    },
    "last_location_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Location At"
    },
    "live_tracking_provider": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Tracking Provider"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "credit_cost": {
      "type": "integer",
      "title": "Credit Cost"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "tenant_rating": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Rating"
    },
    "tenant_review": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Review"
    },
    "booked_by": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Booked By"
    },
    "offered_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Offered At"
    },
    "offer_expires_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Offer Expires At"
    },
    "responded_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Responded At"
    },
    "accepted_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Accepted At"
    },
    "started_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Started At"
    },
    "completed_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Completed At"
    },
    "canceled_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Canceled At"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "title": "Updated At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "vendor_id",
    "vendor_name",
    "status",
    "credit_cost",
    "currency",
    "created_at",
    "updated_at"
  ],
  "title": "BookingResponse"
}

```


## BookingUpdateRequest

```json

{
  "properties": {
    "status": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Status"
    },
    "tenant_rating": {
      "anyOf": [
        {
          "type": "integer",
          "maximum": 5.0,
          "minimum": 1.0
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Rating"
    },
    "tenant_review": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Review"
    },
    "driver_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Driver Name"
    },
    "driver_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Driver Phone"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    },
    "last_location_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Location At"
    },
    "live_tracking_provider": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Tracking Provider"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    }
  },
  "type": "object",
  "title": "BookingUpdateRequest"
}

```


## BootstrapAdminRequest

```json

{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "password": {
      "type": "string",
      "minLength": 12,
      "title": "Password"
    },
    "full_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Full Name"
    }
  },
  "type": "object",
  "required": [
    "email",
    "password",
    "full_name"
  ],
  "title": "BootstrapAdminRequest"
}

```


## BrandingResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "tagline": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tagline"
    },
    "logo_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Logo Url"
    },
    "favicon_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Favicon Url"
    },
    "primary_color": {
      "type": "string",
      "title": "Primary Color"
    },
    "secondary_color": {
      "type": "string",
      "title": "Secondary Color"
    },
    "accent_color": {
      "type": "string",
      "title": "Accent Color"
    },
    "background_color": {
      "type": "string",
      "title": "Background Color"
    },
    "legal_company_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Legal Company Name"
    },
    "legal_footer_text": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Legal Footer Text"
    },
    "terms_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Terms Url"
    },
    "privacy_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Privacy Url"
    },
    "support_email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Support Email"
    },
    "support_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Support Phone"
    },
    "support_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Support Url"
    },
    "notification_from_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notification From Name"
    },
    "notification_from_email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notification From Email"
    },
    "default_language": {
      "type": "string",
      "title": "Default Language"
    },
    "supported_languages": {
      "type": "string",
      "title": "Supported Languages"
    },
    "maps_enabled": {
      "type": "boolean",
      "title": "Maps Enabled"
    },
    "public_tracking_enabled": {
      "type": "boolean",
      "title": "Public Tracking Enabled"
    },
    "csv_import_enabled": {
      "type": "boolean",
      "title": "Csv Import Enabled"
    },
    "group_members_enabled": {
      "type": "boolean",
      "title": "Group Members Enabled"
    },
    "max_group_members": {
      "type": "integer",
      "title": "Max Group Members"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "title": "Updated At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "company_name",
    "primary_color",
    "secondary_color",
    "accent_color",
    "background_color",
    "default_language",
    "supported_languages",
    "maps_enabled",
    "public_tracking_enabled",
    "csv_import_enabled",
    "group_members_enabled",
    "max_group_members",
    "created_at",
    "updated_at"
  ],
  "title": "BrandingResponse"
}

```


## BrandingUpdate

```json

{
  "properties": {
    "company_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Company Name"
    },
    "tagline": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tagline"
    },
    "logo_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Logo Url"
    },
    "favicon_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Favicon Url"
    },
    "primary_color": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Primary Color"
    },
    "secondary_color": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Secondary Color"
    },
    "accent_color": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Accent Color"
    },
    "background_color": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Background Color"
    },
    "legal_company_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Legal Company Name"
    },
    "legal_footer_text": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Legal Footer Text"
    },
    "terms_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Terms Url"
    },
    "privacy_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Privacy Url"
    },
    "support_email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Support Email"
    },
    "support_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Support Phone"
    },
    "support_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Support Url"
    },
    "notification_from_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notification From Name"
    },
    "notification_from_email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notification From Email"
    },
    "email_signature_html": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email Signature Html"
    },
    "default_language": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Default Language"
    },
    "supported_languages": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Supported Languages"
    }
  },
  "type": "object",
  "title": "BrandingUpdate"
}

```


## BulkImportResult

```json

{
  "properties": {
    "total": {
      "type": "integer",
      "title": "Total"
    },
    "created": {
      "type": "integer",
      "title": "Created"
    },
    "skipped": {
      "type": "integer",
      "title": "Skipped"
    },
    "errors": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Errors"
    }
  },
  "type": "object",
  "required": [
    "total",
    "created",
    "skipped",
    "errors"
  ],
  "title": "BulkImportResult"
}

```


## CRMAccountCreateRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "account_type": {
      "type": "string",
      "title": "Account Type",
      "default": "customer"
    },
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    },
    "country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Country"
    },
    "city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "City"
    },
    "billing_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Billing Address"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "company_name"
  ],
  "title": "CRMAccountCreateRequest"
}

```


## CRMAccountResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "account_type": {
      "type": "string",
      "title": "Account Type"
    },
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "account_type",
    "company_name"
  ],
  "title": "CRMAccountResponse"
}

```


## CRMContactCreateRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "account_id": {
      "type": "string",
      "title": "Account Id"
    },
    "first_name": {
      "type": "string",
      "title": "First Name"
    },
    "last_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Name"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    },
    "role_title": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Role Title"
    },
    "is_primary": {
      "type": "boolean",
      "title": "Is Primary",
      "default": false
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "account_id",
    "first_name"
  ],
  "title": "CRMContactCreateRequest"
}

```


## CRMContactResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "account_id": {
      "type": "string",
      "title": "Account Id"
    },
    "first_name": {
      "type": "string",
      "title": "First Name"
    },
    "last_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Name"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "account_id",
    "first_name"
  ],
  "title": "CRMContactResponse"
}

```


## CompanyRegisterResponse

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "subdomain": {
      "type": "string",
      "title": "Subdomain"
    },
    "portal_url": {
      "type": "string",
      "title": "Portal Url"
    },
    "fleetbase_console_url": {
      "type": "string",
      "title": "Fleetbase Console Url"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "company_name",
    "subdomain",
    "portal_url",
    "fleetbase_console_url",
    "message"
  ],
  "title": "CompanyRegisterResponse"
}

```


## CompleteOnboardingRequest

```json

{
  "properties": {
    "role": {
      "type": "string",
      "title": "Role"
    },
    "full_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Full Name"
    }
  },
  "type": "object",
  "required": [
    "role"
  ],
  "title": "CompleteOnboardingRequest"
}

```


## CreditConsumeRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "usage_type": {
      "type": "string",
      "pattern": "^(ai_usage|document_processing)$",
      "title": "Usage Type"
    },
    "credits": {
      "type": "integer",
      "exclusiveMinimum": 0.0,
      "title": "Credits"
    },
    "memo": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Memo"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "usage_type",
    "credits"
  ],
  "title": "CreditConsumeRequest"
}

```


## CreditPurchaseRequest

```json

{
  "properties": {
    "amount": {
      "type": "number",
      "exclusiveMinimum": 0.0,
      "title": "Amount",
      "description": "Amount to pay in GHS"
    },
    "payment_method": {
      "type": "string",
      "title": "Payment Method",
      "description": "Payment method"
    },
    "customer_email": {
      "type": "string",
      "title": "Customer Email",
      "description": "Customer email"
    },
    "customer_phone": {
      "type": "string",
      "title": "Customer Phone",
      "description": "Customer phone"
    },
    "mobile_provider": {
      "type": "string",
      "title": "Mobile Provider",
      "description": "Mobile money provider",
      "default": "mtn"
    }
  },
  "type": "object",
  "required": [
    "amount",
    "payment_method",
    "customer_email",
    "customer_phone"
  ],
  "title": "CreditPurchaseRequest",
  "description": "Request model for purchasing virtual credits"
}

```


## CreditPurchaseResponse

```json

{
  "properties": {
    "purchase_id": {
      "type": "string",
      "title": "Purchase Id"
    },
    "amount_paid": {
      "type": "number",
      "title": "Amount Paid"
    },
    "credits_to_receive": {
      "type": "number",
      "title": "Credits To Receive"
    },
    "payment_url": {
      "type": "string",
      "title": "Payment Url"
    },
    "status": {
      "type": "string",
      "title": "Status"
    }
  },
  "type": "object",
  "required": [
    "purchase_id",
    "amount_paid",
    "credits_to_receive",
    "payment_url",
    "status"
  ],
  "title": "CreditPurchaseResponse",
  "description": "Response model for credit purchase"
}

```


## DomainActivateRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "hostname": {
      "type": "string",
      "title": "Hostname"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "hostname"
  ],
  "title": "DomainActivateRequest"
}

```


## DomainEventResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "domain_id": {
      "type": "string",
      "title": "Domain Id"
    },
    "event_type": {
      "type": "string",
      "title": "Event Type"
    },
    "message": {
      "type": "string",
      "title": "Message"
    },
    "payload_json": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Payload Json"
    }
  },
  "type": "object",
  "required": [
    "id",
    "domain_id",
    "event_type",
    "message"
  ],
  "title": "DomainEventResponse"
}

```


## DomainFailRequest

```json

{
  "properties": {
    "reason": {
      "type": "string",
      "title": "Reason"
    }
  },
  "type": "object",
  "required": [
    "reason"
  ],
  "title": "DomainFailRequest"
}

```


## DomainRequestCreate

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "hostname": {
      "type": "string",
      "maxLength": 255,
      "minLength": 3,
      "title": "Hostname"
    },
    "domain_type": {
      "type": "string",
      "pattern": "^(customer_subdomain|apex|platform_subdomain)$",
      "title": "Domain Type"
    },
    "created_by": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Created By"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "hostname",
    "domain_type"
  ],
  "title": "DomainRequestCreate"
}

```


## DomainResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "hostname": {
      "type": "string",
      "title": "Hostname"
    },
    "domain_type": {
      "type": "string",
      "title": "Domain Type"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "provider": {
      "type": "string",
      "title": "Provider"
    },
    "verification_method": {
      "type": "string",
      "title": "Verification Method"
    },
    "verification_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Verification Name"
    },
    "verification_value": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Verification Value"
    },
    "ssl_status": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Ssl Status"
    },
    "fallback_hostname": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Fallback Hostname"
    },
    "fallback_active": {
      "type": "boolean",
      "title": "Fallback Active"
    },
    "last_error": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Error"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "hostname",
    "domain_type",
    "status",
    "provider",
    "verification_method",
    "fallback_active"
  ],
  "title": "DomainResponse"
}

```


## DriverSearch

```json

{
  "properties": {
    "driver_id": {
      "type": "string",
      "title": "Driver Id"
    },
    "current_latitude": {
      "type": "number",
      "title": "Current Latitude"
    },
    "current_longitude": {
      "type": "number",
      "title": "Current Longitude"
    },
    "max_distance_km": {
      "type": "number",
      "title": "Max Distance Km",
      "default": 100
    }
  },
  "type": "object",
  "required": [
    "driver_id",
    "current_latitude",
    "current_longitude"
  ],
  "title": "DriverSearch"
}

```


## GpsPingRequest

```json

{
  "properties": {
    "driver_id": {
      "type": "string",
      "title": "Driver Id"
    },
    "latitude": {
      "type": "number",
      "title": "Latitude"
    },
    "longitude": {
      "type": "number",
      "title": "Longitude"
    },
    "speed_kmh": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Speed Kmh"
    },
    "heading_degrees": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Heading Degrees"
    }
  },
  "type": "object",
  "required": [
    "driver_id",
    "latitude",
    "longitude"
  ],
  "title": "GpsPingRequest"
}

```


## GroupMemberCreate

```json

{
  "properties": {
    "full_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 1,
      "title": "Full Name"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "id_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Number"
    },
    "company": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Company"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "preferred_language": {
      "type": "string",
      "title": "Preferred Language",
      "default": "en"
    }
  },
  "type": "object",
  "required": [
    "full_name"
  ],
  "title": "GroupMemberCreate"
}

```


## GroupMemberResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "full_name": {
      "type": "string",
      "title": "Full Name"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "id_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Number"
    },
    "company": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Company"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "preferred_language": {
      "type": "string",
      "title": "Preferred Language"
    },
    "is_active": {
      "type": "boolean",
      "title": "Is Active"
    },
    "shipment_count": {
      "type": "integer",
      "title": "Shipment Count",
      "default": 0
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "full_name",
    "preferred_language",
    "is_active",
    "created_at"
  ],
  "title": "GroupMemberResponse"
}

```


## GroupMemberUpdate

```json

{
  "properties": {
    "full_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Full Name"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    },
    "email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "id_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Id Number"
    },
    "company": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Company"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "preferred_language": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Preferred Language"
    },
    "is_active": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "title": "Is Active"
    }
  },
  "type": "object",
  "title": "GroupMemberUpdate"
}

```


## HTTPValidationError

```json

{
  "properties": {
    "detail": {
      "items": {
        "$ref": "#/components/schemas/ValidationError"
      },
      "type": "array",
      "title": "Detail"
    }
  },
  "type": "object",
  "title": "HTTPValidationError"
}

```


## InitializePaymentRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "amount": {
      "type": "number",
      "title": "Amount"
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "default": "GHS"
    },
    "purpose": {
      "type": "string",
      "title": "Purpose",
      "default": "credit_topup"
    },
    "provider": {
      "type": "string",
      "title": "Provider",
      "default": "paystack"
    },
    "callback_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Callback Url"
    },
    "plan_code": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Plan Code"
    },
    "addons": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Addons",
      "default": []
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "email",
    "amount"
  ],
  "title": "InitializePaymentRequest"
}

```


## JobResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "format": "uuid",
      "title": "Tenant Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "details": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Details"
    },
    "task_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Task Id"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "title": "Updated At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "status",
    "details",
    "task_id",
    "created_at",
    "updated_at"
  ],
  "title": "JobResponse"
}

```


## LaunchRequest

```json

{
  "properties": {
    "runner_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Runner Id"
    }
  },
  "type": "object",
  "title": "LaunchRequest"
}

```


## Location

```json

{
  "properties": {
    "label": {
      "type": "string",
      "title": "Label"
    },
    "latitude": {
      "type": "number",
      "title": "Latitude"
    },
    "longitude": {
      "type": "number",
      "title": "Longitude"
    }
  },
  "type": "object",
  "required": [
    "label",
    "latitude",
    "longitude"
  ],
  "title": "Location"
}

```


## LoginRequest

```json

{
  "properties": {
    "email": {
      "anyOf": [
        {
          "type": "string",
          "format": "email"
        },
        {
          "type": "null"
        }
      ],
      "title": "Email"
    },
    "username": {
      "anyOf": [
        {
          "type": "string",
          "format": "email"
        },
        {
          "type": "null"
        }
      ],
      "title": "Username"
    },
    "password": {
      "type": "string",
      "title": "Password"
    }
  },
  "type": "object",
  "required": [
    "password"
  ],
  "title": "LoginRequest"
}

```


## OpportunityCreateRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "account_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Account Id"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "stage": {
      "type": "string",
      "title": "Stage",
      "default": "new"
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "default": "GHS"
    },
    "estimated_value": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Estimated Value"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "title"
  ],
  "title": "OpportunityCreateRequest"
}

```


## OpportunityResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "stage": {
      "type": "string",
      "title": "Stage"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "estimated_value": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Estimated Value"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "title",
    "stage",
    "currency"
  ],
  "title": "OpportunityResponse"
}

```


## PasswordResetConfirmRequest

```json

{
  "properties": {
    "token": {
      "type": "string",
      "maxLength": 255,
      "minLength": 16,
      "title": "Token"
    },
    "new_password": {
      "type": "string",
      "minLength": 8,
      "title": "New Password"
    }
  },
  "type": "object",
  "required": [
    "token",
    "new_password"
  ],
  "title": "PasswordResetConfirmRequest"
}

```


## PaymentInitRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "email": {
      "type": "string",
      "title": "Email"
    },
    "currency": {
      "type": "string",
      "maxLength": 10,
      "minLength": 3,
      "title": "Currency"
    },
    "amount_major": {
      "type": "number",
      "exclusiveMinimum": 0.0,
      "title": "Amount Major"
    },
    "purpose": {
      "type": "string",
      "pattern": "^(subscription|credit_topup)$",
      "title": "Purpose"
    },
    "plan_code": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Plan Code"
    },
    "credits_to_buy": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Credits To Buy"
    },
    "callback_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Callback Url"
    },
    "payment_provider": {
      "type": "string",
      "title": "Payment Provider",
      "default": "paystack"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "email",
    "currency",
    "amount_major",
    "purpose"
  ],
  "title": "PaymentInitRequest"
}

```


## PaymentInitResponse

```json

{
  "properties": {
    "reference": {
      "type": "string",
      "title": "Reference"
    },
    "authorization_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Authorization Url"
    },
    "access_code": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Access Code"
    },
    "status": {
      "type": "string",
      "title": "Status"
    }
  },
  "type": "object",
  "required": [
    "reference",
    "status"
  ],
  "title": "PaymentInitResponse"
}

```


## PaymentInitiateRequest

```json

{
  "properties": {
    "amount": {
      "type": "number",
      "exclusiveMinimum": 0.0,
      "title": "Amount",
      "description": "Payment amount in GHS"
    },
    "payment_method": {
      "type": "string",
      "title": "Payment Method",
      "description": "Payment method (mobile_money, etc.)"
    },
    "customer_email": {
      "type": "string",
      "title": "Customer Email",
      "description": "Customer email address"
    },
    "customer_phone": {
      "type": "string",
      "title": "Customer Phone",
      "description": "Customer phone number"
    },
    "customer_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Customer Name",
      "description": "Customer name"
    },
    "mobile_provider": {
      "type": "string",
      "title": "Mobile Provider",
      "description": "Mobile money provider (mtn, airteltigo, vodafone)",
      "default": "mtn"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description",
      "description": "Payment description"
    },
    "metadata": {
      "anyOf": [
        {
          "type": "object"
        },
        {
          "type": "null"
        }
      ],
      "title": "Metadata",
      "description": "Additional metadata"
    }
  },
  "type": "object",
  "required": [
    "amount",
    "payment_method",
    "customer_email",
    "customer_phone"
  ],
  "title": "PaymentInitiateRequest",
  "description": "Request model for initiating payment"
}

```


## PaymentInitiateResponse

```json

{
  "properties": {
    "payment_id": {
      "type": "string",
      "title": "Payment Id"
    },
    "payment_reference": {
      "type": "string",
      "title": "Payment Reference"
    },
    "authorization_url": {
      "type": "string",
      "title": "Authorization Url"
    },
    "amount": {
      "type": "number",
      "title": "Amount"
    },
    "platform_fee": {
      "type": "number",
      "title": "Platform Fee"
    },
    "tenant_amount": {
      "type": "number",
      "title": "Tenant Amount"
    },
    "payment_method": {
      "type": "string",
      "title": "Payment Method"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "expires_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Expires At"
    },
    "mock": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ],
      "title": "Mock"
    }
  },
  "type": "object",
  "required": [
    "payment_id",
    "payment_reference",
    "authorization_url",
    "amount",
    "platform_fee",
    "tenant_amount",
    "payment_method",
    "status"
  ],
  "title": "PaymentInitiateResponse",
  "description": "Response model for payment initiation"
}

```


## PaymentReinitRequest

```json

{
  "properties": {
    "email": {
      "type": "string",
      "title": "Email"
    },
    "callback_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Callback Url"
    }
  },
  "type": "object",
  "required": [
    "email"
  ],
  "title": "PaymentReinitRequest"
}

```


## PaymentStatistics

```json

{
  "properties": {
    "total_payments": {
      "type": "integer",
      "title": "Total Payments"
    },
    "completed_payments": {
      "type": "integer",
      "title": "Completed Payments"
    },
    "total_revenue": {
      "type": "number",
      "title": "Total Revenue"
    },
    "total_platform_fees": {
      "type": "number",
      "title": "Total Platform Fees"
    },
    "total_tenant_earnings": {
      "type": "number",
      "title": "Total Tenant Earnings"
    },
    "success_rate": {
      "type": "number",
      "title": "Success Rate"
    }
  },
  "type": "object",
  "required": [
    "total_payments",
    "completed_payments",
    "total_revenue",
    "total_platform_fees",
    "total_tenant_earnings",
    "success_rate"
  ],
  "title": "PaymentStatistics",
  "description": "Payment statistics response"
}

```


## PaymentStatusResponse

```json

{
  "properties": {
    "payment_id": {
      "type": "string",
      "title": "Payment Id"
    },
    "payment_reference": {
      "type": "string",
      "title": "Payment Reference"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "amount": {
      "type": "number",
      "title": "Amount"
    },
    "platform_fee": {
      "type": "number",
      "title": "Platform Fee"
    },
    "tenant_amount": {
      "type": "number",
      "title": "Tenant Amount"
    },
    "paid_amount": {
      "type": "number",
      "title": "Paid Amount"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "completed_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Completed At"
    },
    "failed_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Failed At"
    },
    "failure_reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Failure Reason"
    }
  },
  "type": "object",
  "required": [
    "payment_id",
    "payment_reference",
    "status",
    "amount",
    "platform_fee",
    "tenant_amount",
    "paid_amount",
    "created_at"
  ],
  "title": "PaymentStatusResponse",
  "description": "Response model for payment status"
}

```


## PaymentVerifyResponse

```json

{
  "properties": {
    "reference": {
      "type": "string",
      "title": "Reference"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "provider_status": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Provider Status"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "reference",
    "status",
    "message"
  ],
  "title": "PaymentVerifyResponse"
}

```


## PlanResponse

```json

{
  "properties": {
    "code": {
      "type": "string",
      "title": "Code"
    },
    "name": {
      "type": "string",
      "title": "Name"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "price_amount": {
      "type": "number",
      "title": "Price Amount"
    },
    "monthly_credit_allowance": {
      "type": "integer",
      "title": "Monthly Credit Allowance"
    },
    "includes_custom_domain": {
      "type": "boolean",
      "title": "Includes Custom Domain"
    },
    "includes_priority_support": {
      "type": "boolean",
      "title": "Includes Priority Support"
    },
    "included_features": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Included Features",
      "default": []
    }
  },
  "type": "object",
  "required": [
    "code",
    "name",
    "currency",
    "price_amount",
    "monthly_credit_allowance",
    "includes_custom_domain",
    "includes_priority_support"
  ],
  "title": "PlanResponse"
}

```


## PlanSelect

```json

{
  "properties": {
    "signup_id": {
      "type": "string",
      "title": "Signup Id"
    },
    "plan_code": {
      "type": "string",
      "title": "Plan Code"
    },
    "addons": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Addons",
      "default": []
    },
    "payment_method": {
      "type": "string",
      "title": "Payment Method",
      "default": "paystack"
    },
    "callback_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Callback Url"
    }
  },
  "type": "object",
  "required": [
    "signup_id",
    "plan_code"
  ],
  "title": "PlanSelect"
}

```


## PublicTicketCreateRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "public_submitter_name": {
      "type": "string",
      "title": "Public Submitter Name"
    },
    "public_submitter_email": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Public Submitter Email"
    },
    "subject": {
      "type": "string",
      "title": "Subject"
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "category": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Category"
    },
    "priority": {
      "type": "string",
      "title": "Priority",
      "default": "medium"
    },
    "shipment_reference": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipment Reference"
    },
    "tracking_reference": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tracking Reference"
    },
    "account_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Account Id"
    },
    "contact_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Contact Id"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "public_submitter_name",
    "subject",
    "description"
  ],
  "title": "PublicTicketCreateRequest"
}

```


## QuoteCreateRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "account_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Account Id"
    },
    "opportunity_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Opportunity Id"
    },
    "quote_number": {
      "type": "string",
      "title": "Quote Number"
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "default": "GHS"
    },
    "total_amount": {
      "type": "number",
      "title": "Total Amount",
      "default": 0
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "quote_number"
  ],
  "title": "QuoteCreateRequest"
}

```


## QuoteResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "quote_number": {
      "type": "string",
      "title": "Quote Number"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "total_amount": {
      "type": "number",
      "title": "Total Amount"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "quote_number",
    "status",
    "currency",
    "total_amount"
  ],
  "title": "QuoteResponse"
}

```


## RegisterRequest

```json

{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "password": {
      "type": "string",
      "minLength": 8,
      "title": "Password"
    },
    "full_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Full Name"
    },
    "company_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Company Name"
    },
    "plan_code": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 64,
          "minLength": 3
        },
        {
          "type": "null"
        }
      ],
      "title": "Plan Code"
    }
  },
  "type": "object",
  "required": [
    "email",
    "password",
    "full_name",
    "company_name"
  ],
  "title": "RegisterRequest"
}

```


## RunnerCreate

```json

{
  "properties": {
    "name": {
      "type": "string",
      "maxLength": 150,
      "minLength": 3,
      "title": "Name"
    },
    "host": {
      "type": "string",
      "maxLength": 255,
      "minLength": 3,
      "title": "Host"
    },
    "ssh_port": {
      "type": "integer",
      "title": "Ssh Port",
      "default": 22
    },
    "ssh_user": {
      "type": "string",
      "maxLength": 120,
      "minLength": 1,
      "title": "Ssh User"
    },
    "fleetbase_root": {
      "type": "string",
      "maxLength": 255,
      "minLength": 3,
      "title": "Fleetbase Root"
    },
    "reserved_for_single_tenant": {
      "type": "boolean",
      "title": "Reserved For Single Tenant",
      "default": true
    }
  },
  "type": "object",
  "required": [
    "name",
    "host",
    "ssh_user",
    "fleetbase_root"
  ],
  "title": "RunnerCreate"
}

```


## RunnerCreateRequest

```json

{
  "properties": {
    "name": {
      "type": "string",
      "title": "Name"
    },
    "hostname": {
      "type": "string",
      "title": "Hostname"
    },
    "ssh_port": {
      "type": "integer",
      "title": "Ssh Port",
      "default": 22
    },
    "ssh_user": {
      "type": "string",
      "title": "Ssh User",
      "default": "afruheritage"
    },
    "root_runtime_path": {
      "type": "string",
      "title": "Root Runtime Path",
      "default": "/srv/afruheritage/tenants"
    },
    "max_tenants": {
      "type": "integer",
      "title": "Max Tenants",
      "default": 50
    },
    "supports_reference_install": {
      "type": "boolean",
      "title": "Supports Reference Install",
      "default": true
    }
  },
  "type": "object",
  "required": [
    "name",
    "hostname"
  ],
  "title": "RunnerCreateRequest"
}

```


## RuntimeDeployRequest

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "tenant_slug": {
      "type": "string",
      "maxLength": 120,
      "minLength": 2,
      "title": "Tenant Slug"
    },
    "runner_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Runner Id"
    },
    "is_reference_install": {
      "type": "boolean",
      "title": "Is Reference Install",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "tenant_slug"
  ],
  "title": "RuntimeDeployRequest"
}

```


## RuntimeEventResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "runtime_id": {
      "type": "string",
      "title": "Runtime Id"
    },
    "event_type": {
      "type": "string",
      "title": "Event Type"
    },
    "message": {
      "type": "string",
      "title": "Message"
    },
    "payload_json": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Payload Json"
    }
  },
  "type": "object",
  "required": [
    "id",
    "runtime_id",
    "event_type",
    "message"
  ],
  "title": "RuntimeEventResponse"
}

```


## RuntimeResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "tenant_slug": {
      "type": "string",
      "title": "Tenant Slug"
    },
    "runner_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Runner Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "install_directory": {
      "type": "string",
      "title": "Install Directory"
    },
    "runtime_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Runtime Url"
    },
    "console_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Console Url"
    },
    "api_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Api Url"
    },
    "fleetbase_version": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Fleetbase Version"
    },
    "last_error": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Error"
    },
    "is_reference_install": {
      "type": "boolean",
      "title": "Is Reference Install"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "tenant_slug",
    "status",
    "install_directory",
    "is_reference_install"
  ],
  "title": "RuntimeResponse"
}

```


## RuntimeRetryRequest

```json

{
  "properties": {
    "runtime_id": {
      "type": "string",
      "title": "Runtime Id"
    }
  },
  "type": "object",
  "required": [
    "runtime_id"
  ],
  "title": "RuntimeRetryRequest"
}

```


## RuntimeSuspendRequest

```json

{
  "properties": {
    "runtime_id": {
      "type": "string",
      "title": "Runtime Id"
    },
    "reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reason"
    }
  },
  "type": "object",
  "required": [
    "runtime_id"
  ],
  "title": "RuntimeSuspendRequest"
}

```


## ShipmentCreate

```json

{
  "properties": {
    "tracking_number": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 100
        },
        {
          "type": "null"
        }
      ],
      "title": "Tracking Number"
    },
    "reference_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reference Number"
    },
    "sender_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 1,
      "title": "Sender Name"
    },
    "sender_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Sender Phone"
    },
    "sender_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Sender Address"
    },
    "receiver_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 1,
      "title": "Receiver Name"
    },
    "receiver_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Receiver Phone"
    },
    "receiver_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Receiver Address"
    },
    "origin_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin Country"
    },
    "origin_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin City"
    },
    "destination_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination Country"
    },
    "destination_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination City"
    },
    "shipped_date": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipped Date"
    },
    "estimated_arrival": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Estimated Arrival"
    },
    "weight_kg": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Weight Kg"
    },
    "volume_cbm": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Volume Cbm"
    },
    "package_count": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Package Count"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description"
    },
    "cargo_type": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Cargo Type"
    },
    "total_cost": {
      "type": "number",
      "title": "Total Cost",
      "default": 0
    },
    "amount_paid": {
      "type": "number",
      "title": "Amount Paid",
      "default": 0
    },
    "currency": {
      "type": "string",
      "title": "Currency",
      "default": "GHS"
    },
    "group_member_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Group Member Id"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "cargo_image_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Cargo Image Url"
    }
  },
  "type": "object",
  "required": [
    "sender_name",
    "receiver_name"
  ],
  "title": "ShipmentCreate"
}

```


## ShipmentEventCreate

```json

{
  "properties": {
    "event_type": {
      "type": "string",
      "title": "Event Type"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Latitude"
    },
    "longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Longitude"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description"
    },
    "occurred_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Occurred At"
    }
  },
  "type": "object",
  "required": [
    "event_type"
  ],
  "title": "ShipmentEventCreate"
}

```


## ShipmentEventResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "event_type": {
      "type": "string",
      "title": "Event Type"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Latitude"
    },
    "longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Longitude"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description"
    },
    "occurred_at": {
      "type": "string",
      "format": "date-time",
      "title": "Occurred At"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "event_type",
    "occurred_at",
    "created_at"
  ],
  "title": "ShipmentEventResponse"
}

```


## ShipmentLocationUpdate

```json

{
  "properties": {
    "latitude": {
      "type": "number",
      "title": "Latitude"
    },
    "longitude": {
      "type": "number",
      "title": "Longitude"
    },
    "location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Location"
    },
    "occurred_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Occurred At"
    },
    "provider": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Provider"
    },
    "event_type": {
      "type": "string",
      "title": "Event Type",
      "default": "location_update"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description"
    },
    "status": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Status"
    }
  },
  "type": "object",
  "required": [
    "latitude",
    "longitude"
  ],
  "title": "ShipmentLocationUpdate"
}

```


## ShipmentPost

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "customer_name": {
      "type": "string",
      "title": "Customer Name"
    },
    "title": {
      "type": "string",
      "title": "Title"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description"
    },
    "pickup": {
      "$ref": "#/components/schemas/Location"
    },
    "dropoff": {
      "$ref": "#/components/schemas/Location"
    },
    "weight_kg": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Weight Kg"
    },
    "length_cm": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Length Cm"
    },
    "width_cm": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Width Cm"
    },
    "height_cm": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Height Cm"
    },
    "package_count": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Package Count"
    },
    "package_value": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Package Value"
    },
    "image_urls": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Image Urls",
      "default": []
    },
    "fragile": {
      "type": "boolean",
      "title": "Fragile",
      "default": false
    },
    "refrigerated": {
      "type": "boolean",
      "title": "Refrigerated",
      "default": false
    },
    "special_handling_notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Special Handling Notes"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "customer_name",
    "title",
    "pickup",
    "dropoff"
  ],
  "title": "ShipmentPost"
}

```


## ShipmentPublicTrackResponse

```json

{
  "properties": {
    "tracking_number": {
      "type": "string",
      "title": "Tracking Number"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "sender_name": {
      "type": "string",
      "title": "Sender Name"
    },
    "receiver_name": {
      "type": "string",
      "title": "Receiver Name"
    },
    "origin_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin Country"
    },
    "origin_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin City"
    },
    "destination_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination Country"
    },
    "destination_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination City"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    },
    "last_location_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Location At"
    },
    "live_tracking_provider": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Tracking Provider"
    },
    "shipped_date": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipped Date"
    },
    "estimated_arrival": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Estimated Arrival"
    },
    "payment_status": {
      "type": "string",
      "title": "Payment Status"
    },
    "total_cost": {
      "type": "number",
      "title": "Total Cost"
    },
    "amount_paid": {
      "type": "number",
      "title": "Amount Paid"
    },
    "balance_due": {
      "type": "number",
      "title": "Balance Due"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "events": {
      "items": {
        "$ref": "#/components/schemas/ShipmentEventResponse"
      },
      "type": "array",
      "title": "Events",
      "default": []
    }
  },
  "type": "object",
  "required": [
    "tracking_number",
    "status",
    "sender_name",
    "receiver_name",
    "payment_status",
    "total_cost",
    "amount_paid",
    "balance_due",
    "currency"
  ],
  "title": "ShipmentPublicTrackResponse"
}

```


## ShipmentResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "tracking_number": {
      "type": "string",
      "title": "Tracking Number"
    },
    "reference_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reference Number"
    },
    "sender_name": {
      "type": "string",
      "title": "Sender Name"
    },
    "sender_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Sender Phone"
    },
    "receiver_name": {
      "type": "string",
      "title": "Receiver Name"
    },
    "receiver_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Receiver Phone"
    },
    "origin_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin Country"
    },
    "origin_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin City"
    },
    "destination_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination Country"
    },
    "destination_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination City"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    },
    "last_location_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Location At"
    },
    "live_tracking_provider": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Tracking Provider"
    },
    "shipped_date": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipped Date"
    },
    "estimated_arrival": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Estimated Arrival"
    },
    "actual_arrival": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Actual Arrival"
    },
    "weight_kg": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Weight Kg"
    },
    "package_count": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Package Count"
    },
    "cargo_type": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Cargo Type"
    },
    "total_cost": {
      "type": "number",
      "title": "Total Cost"
    },
    "amount_paid": {
      "type": "number",
      "title": "Amount Paid"
    },
    "balance_due": {
      "type": "number",
      "title": "Balance Due"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "payment_status": {
      "type": "string",
      "title": "Payment Status"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "group_member_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Group Member Id"
    },
    "group_member_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Group Member Name"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "cargo_image_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Cargo Image Url"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "title": "Updated At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "tracking_number",
    "sender_name",
    "receiver_name",
    "total_cost",
    "amount_paid",
    "balance_due",
    "currency",
    "payment_status",
    "status",
    "created_at",
    "updated_at"
  ],
  "title": "ShipmentResponse"
}

```


## ShipmentUpdate

```json

{
  "properties": {
    "tracking_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tracking Number"
    },
    "reference_number": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reference Number"
    },
    "sender_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Sender Name"
    },
    "sender_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Sender Phone"
    },
    "sender_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Sender Address"
    },
    "receiver_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Receiver Name"
    },
    "receiver_phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Receiver Phone"
    },
    "receiver_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Receiver Address"
    },
    "origin_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin Country"
    },
    "origin_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Origin City"
    },
    "destination_country": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination Country"
    },
    "destination_city": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Destination City"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    },
    "last_location_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Location At"
    },
    "live_tracking_provider": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Tracking Provider"
    },
    "shipped_date": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipped Date"
    },
    "estimated_arrival": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Estimated Arrival"
    },
    "actual_arrival": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Actual Arrival"
    },
    "weight_kg": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Weight Kg"
    },
    "volume_cbm": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Volume Cbm"
    },
    "package_count": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Package Count"
    },
    "description": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Description"
    },
    "cargo_type": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Cargo Type"
    },
    "total_cost": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Total Cost"
    },
    "amount_paid": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Amount Paid"
    },
    "currency": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Currency"
    },
    "payment_status": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Payment Status"
    },
    "status": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Status"
    },
    "group_member_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Group Member Id"
    },
    "notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Notes"
    },
    "cargo_image_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Cargo Image Url"
    }
  },
  "type": "object",
  "title": "ShipmentUpdate"
}

```


## SignupStart

```json

{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "phone": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Phone"
    },
    "account_type": {
      "type": "string",
      "title": "Account Type",
      "default": "tenant_org"
    }
  },
  "type": "object",
  "required": [
    "email"
  ],
  "title": "SignupStart"
}

```


## SubscriptionResponse

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "plan_code": {
      "type": "string",
      "title": "Plan Code"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "started_at": {
      "type": "string",
      "title": "Started At"
    },
    "current_period_end": {
      "type": "string",
      "title": "Current Period End"
    },
    "trial_ends_at": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Trial Ends At"
    },
    "read_only_reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Read Only Reason"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "plan_code",
    "status",
    "currency",
    "started_at",
    "current_period_end"
  ],
  "title": "SubscriptionResponse"
}

```


## SupportTicketMessageResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "ticket_id": {
      "type": "string",
      "title": "Ticket Id"
    },
    "author_type": {
      "type": "string",
      "title": "Author Type"
    },
    "author_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Author Name"
    },
    "body": {
      "type": "string",
      "title": "Body"
    },
    "visible_to_public": {
      "type": "boolean",
      "title": "Visible To Public"
    }
  },
  "type": "object",
  "required": [
    "id",
    "ticket_id",
    "author_type",
    "body",
    "visible_to_public"
  ],
  "title": "SupportTicketMessageResponse"
}

```


## SupportTicketResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "public_token": {
      "type": "string",
      "title": "Public Token"
    },
    "subject": {
      "type": "string",
      "title": "Subject"
    },
    "description": {
      "type": "string",
      "title": "Description"
    },
    "category": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Category"
    },
    "priority": {
      "type": "string",
      "title": "Priority"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "shipment_reference": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Shipment Reference"
    },
    "tracking_reference": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tracking Reference"
    },
    "glpi_ticket_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Glpi Ticket Id"
    }
  },
  "type": "object",
  "required": [
    "id",
    "tenant_id",
    "public_token",
    "subject",
    "description",
    "priority",
    "status"
  ],
  "title": "SupportTicketResponse"
}

```


## TenantCreate

```json

{
  "properties": {
    "company_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Company Name"
    },
    "contact_email": {
      "type": "string",
      "format": "email",
      "title": "Contact Email"
    },
    "plan_code": {
      "type": "string",
      "maxLength": 80,
      "minLength": 2,
      "title": "Plan Code"
    },
    "requested_domain": {
      "type": "string",
      "maxLength": 255,
      "minLength": 3,
      "title": "Requested Domain"
    },
    "domain_type": {
      "type": "string",
      "title": "Domain Type"
    },
    "verification_notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Verification Notes"
    }
  },
  "type": "object",
  "required": [
    "company_name",
    "contact_email",
    "plan_code",
    "requested_domain",
    "domain_type"
  ],
  "title": "TenantCreate"
}

```


## TenantCreationRequest

```json

{
  "properties": {
    "company_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Company Name",
      "description": "Company name"
    },
    "contact_email": {
      "type": "string",
      "format": "email",
      "title": "Contact Email",
      "description": "Contact email address"
    },
    "contact_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Contact Name",
      "description": "Contact person name"
    },
    "business_type": {
      "type": "string",
      "title": "Business Type",
      "description": "Type of business (freight_forwarder, logistics_provider, etc.)"
    },
    "country": {
      "type": "string",
      "maxLength": 100,
      "minLength": 2,
      "title": "Country",
      "description": "Country of operation"
    },
    "city": {
      "type": "string",
      "maxLength": 100,
      "minLength": 2,
      "title": "City",
      "description": "City of operation"
    },
    "address": {
      "type": "string",
      "maxLength": 500,
      "minLength": 10,
      "title": "Address",
      "description": "Business address"
    },
    "phone": {
      "type": "string",
      "maxLength": 20,
      "minLength": 10,
      "title": "Phone",
      "description": "Phone number"
    },
    "website": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Website",
      "description": "Company website"
    },
    "plan": {
      "type": "string",
      "title": "Plan",
      "description": "Subscription plan",
      "default": "free_trial"
    }
  },
  "type": "object",
  "required": [
    "company_name",
    "contact_email",
    "contact_name",
    "business_type",
    "country",
    "city",
    "address",
    "phone"
  ],
  "title": "TenantCreationRequest",
  "description": "Request model for creating a new tenant"
}

```


## TenantCreationResponse

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "subdomain": {
      "type": "string",
      "title": "Subdomain"
    },
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "portal_url": {
      "type": "string",
      "title": "Portal Url"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "subdomain",
    "company_name",
    "portal_url",
    "status",
    "message"
  ],
  "title": "TenantCreationResponse",
  "description": "Response model for tenant creation"
}

```


## TenantDomainSettingsResponse

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "platform_subdomain": {
      "type": "string",
      "title": "Platform Subdomain"
    },
    "active_primary_hostname": {
      "type": "string",
      "title": "Active Primary Hostname"
    },
    "fallback_hostname": {
      "type": "string",
      "title": "Fallback Hostname"
    },
    "fallback_always_active": {
      "type": "boolean",
      "title": "Fallback Always Active"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "platform_subdomain",
    "active_primary_hostname",
    "fallback_hostname",
    "fallback_always_active"
  ],
  "title": "TenantDomainSettingsResponse"
}

```


## TenantRegistrationRequest

```json

{
  "properties": {
    "companyName": {
      "type": "string",
      "title": "Companyname"
    },
    "businessType": {
      "type": "string",
      "title": "Businesstype"
    },
    "country": {
      "type": "string",
      "title": "Country"
    },
    "city": {
      "type": "string",
      "title": "City"
    },
    "address": {
      "type": "string",
      "title": "Address"
    },
    "contactName": {
      "type": "string",
      "title": "Contactname"
    },
    "contactEmail": {
      "type": "string",
      "format": "email",
      "title": "Contactemail"
    },
    "phone": {
      "type": "string",
      "title": "Phone"
    },
    "website": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Website"
    },
    "message": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Message"
    },
    "volume": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Volume"
    },
    "services": {
      "anyOf": [
        {
          "items": {
            "type": "string"
          },
          "type": "array"
        },
        {
          "type": "null"
        }
      ],
      "title": "Services"
    },
    "timeline": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Timeline"
    },
    "terms": {
      "type": "boolean",
      "title": "Terms",
      "default": false
    }
  },
  "type": "object",
  "required": [
    "companyName",
    "businessType",
    "country",
    "city",
    "address",
    "contactName",
    "contactEmail",
    "phone"
  ],
  "title": "TenantRegistrationRequest",
  "description": "Tenant registration request model"
}

```


## TenantRequestReviewPayload

```json

{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "review_notes": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Review Notes"
    }
  },
  "type": "object",
  "required": [
    "status"
  ],
  "title": "TenantRequestReviewPayload"
}

```


## TenantResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "company_name": {
      "type": "string",
      "title": "Company Name"
    },
    "slug": {
      "type": "string",
      "title": "Slug"
    },
    "contact_email": {
      "type": "string",
      "format": "email",
      "title": "Contact Email"
    },
    "plan_code": {
      "type": "string",
      "title": "Plan Code"
    },
    "requested_domain": {
      "type": "string",
      "title": "Requested Domain"
    },
    "domain_type": {
      "type": "string",
      "title": "Domain Type"
    },
    "launch_status": {
      "type": "string",
      "title": "Launch Status"
    },
    "live_console_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Console Url"
    },
    "live_api_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Api Url"
    },
    "fleetbase_install_path": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Fleetbase Install Path"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "company_name",
    "slug",
    "contact_email",
    "plan_code",
    "requested_domain",
    "domain_type",
    "launch_status",
    "live_console_url",
    "live_api_url",
    "fleetbase_install_path",
    "created_at"
  ],
  "title": "TenantResponse"
}

```


## TenantRuntimeAuthUpdate

```json

{
  "properties": {
    "live_api_token": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Api Token"
    },
    "live_api_auth_scheme": {
      "anyOf": [
        {
          "type": "string",
          "maxLength": 32,
          "minLength": 3
        },
        {
          "type": "null"
        }
      ],
      "title": "Live Api Auth Scheme",
      "default": "bearer"
    },
    "clear_live_api_token": {
      "type": "boolean",
      "title": "Clear Live Api Token",
      "default": false
    }
  },
  "type": "object",
  "title": "TenantRuntimeAuthUpdate"
}

```


## TenantUserAuditResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "actor_email": {
      "type": "string",
      "title": "Actor Email"
    },
    "event_type": {
      "type": "string",
      "title": "Event Type"
    },
    "entity_type": {
      "type": "string",
      "title": "Entity Type"
    },
    "entity_id": {
      "type": "string",
      "title": "Entity Id"
    },
    "details_json": {
      "type": "string",
      "title": "Details Json"
    },
    "created_at": {
      "type": "string",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "actor_email",
    "event_type",
    "entity_type",
    "entity_id",
    "details_json",
    "created_at"
  ],
  "title": "TenantUserAuditResponse"
}

```


## TenantUserCreateRequest

```json

{
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "title": "Email"
    },
    "full_name": {
      "type": "string",
      "maxLength": 255,
      "minLength": 2,
      "title": "Full Name"
    },
    "password": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 8
        },
        {
          "type": "null"
        }
      ],
      "title": "Password"
    },
    "send_invite_email": {
      "type": "boolean",
      "title": "Send Invite Email",
      "default": false
    },
    "is_tenant_admin": {
      "type": "boolean",
      "title": "Is Tenant Admin",
      "default": false
    },
    "tenant_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Id"
    }
  },
  "type": "object",
  "required": [
    "email",
    "full_name"
  ],
  "title": "TenantUserCreateRequest"
}

```


## TenantUserResetResponse

```json

{
  "properties": {
    "status": {
      "type": "string",
      "title": "Status"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "status",
    "message"
  ],
  "title": "TenantUserResetResponse"
}

```


## TenantUserResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "email": {
      "type": "string",
      "title": "Email"
    },
    "full_name": {
      "type": "string",
      "title": "Full Name"
    },
    "tenant_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Id"
    },
    "is_tenant_admin": {
      "type": "boolean",
      "title": "Is Tenant Admin"
    },
    "is_superuser": {
      "type": "boolean",
      "title": "Is Superuser"
    },
    "is_active": {
      "type": "boolean",
      "title": "Is Active"
    },
    "created_at": {
      "type": "string",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "email",
    "full_name",
    "is_tenant_admin",
    "is_superuser",
    "is_active",
    "created_at"
  ],
  "title": "TenantUserResponse"
}

```


## TenantUserRoleUpdateRequest

```json

{
  "properties": {
    "is_tenant_admin": {
      "type": "boolean",
      "title": "Is Tenant Admin"
    }
  },
  "type": "object",
  "required": [
    "is_tenant_admin"
  ],
  "title": "TenantUserRoleUpdateRequest"
}

```


## TenantUserStatusUpdateRequest

```json

{
  "properties": {
    "is_active": {
      "type": "boolean",
      "title": "Is Active"
    }
  },
  "type": "object",
  "required": [
    "is_active"
  ],
  "title": "TenantUserStatusUpdateRequest"
}

```


## TicketReplyRequest

```json

{
  "properties": {
    "body": {
      "type": "string",
      "minLength": 1,
      "title": "Body"
    },
    "author_type": {
      "type": "string",
      "title": "Author Type",
      "default": "public"
    },
    "author_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Author Name"
    },
    "visible_to_public": {
      "type": "boolean",
      "title": "Visible To Public",
      "default": true
    }
  },
  "type": "object",
  "required": [
    "body"
  ],
  "title": "TicketReplyRequest"
}

```


## TokenExchangeRequest

```json

{
  "properties": {
    "code": {
      "type": "string",
      "title": "Code"
    },
    "redirect_uri": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Redirect Uri"
    }
  },
  "type": "object",
  "required": [
    "code"
  ],
  "title": "TokenExchangeRequest"
}

```


## TokenResponse

```json

{
  "properties": {
    "access_token": {
      "type": "string",
      "title": "Access Token"
    },
    "token_type": {
      "type": "string",
      "title": "Token Type",
      "default": "bearer"
    },
    "tenant_id": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Tenant Id"
    },
    "subdomain": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Subdomain"
    },
    "portal_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Portal Url"
    }
  },
  "type": "object",
  "required": [
    "access_token"
  ],
  "title": "TokenResponse"
}

```


## TrackingPointIngestRequest

```json

{
  "properties": {
    "latitude": {
      "type": "number",
      "title": "Latitude"
    },
    "longitude": {
      "type": "number",
      "title": "Longitude"
    },
    "captured_at": {
      "type": "string",
      "format": "date-time",
      "title": "Captured At"
    },
    "speed_kph": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Speed Kph"
    },
    "heading": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Heading"
    },
    "accuracy_m": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Accuracy M"
    },
    "source": {
      "type": "string",
      "title": "Source",
      "default": "driver_app"
    }
  },
  "type": "object",
  "required": [
    "latitude",
    "longitude",
    "captured_at"
  ],
  "title": "TrackingPointIngestRequest"
}

```


## TrackingPointIngestResponse

```json

{
  "properties": {
    "accepted": {
      "type": "boolean",
      "title": "Accepted"
    },
    "reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reason"
    },
    "point": {
      "anyOf": [
        {
          "$ref": "#/components/schemas/TrackingPointResponse"
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "type": "object",
  "required": [
    "accepted"
  ],
  "title": "TrackingPointIngestResponse"
}

```


## TrackingPointResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "shipment_id": {
      "type": "string",
      "title": "Shipment Id"
    },
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "latitude": {
      "type": "number",
      "title": "Latitude"
    },
    "longitude": {
      "type": "number",
      "title": "Longitude"
    },
    "speed_kph": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Speed Kph"
    },
    "heading": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Heading"
    },
    "accuracy_m": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Accuracy M"
    },
    "source": {
      "type": "string",
      "title": "Source"
    },
    "captured_at": {
      "type": "string",
      "format": "date-time",
      "title": "Captured At"
    },
    "received_at": {
      "type": "string",
      "format": "date-time",
      "title": "Received At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "shipment_id",
    "tenant_id",
    "latitude",
    "longitude",
    "source",
    "captured_at",
    "received_at"
  ],
  "title": "TrackingPointResponse"
}

```


## UsageCreditCostResponse

```json

{
  "properties": {
    "feature_key": {
      "type": "string",
      "title": "Feature Key"
    },
    "credits": {
      "type": "integer",
      "title": "Credits"
    }
  },
  "type": "object",
  "required": [
    "feature_key",
    "credits"
  ],
  "title": "UsageCreditCostResponse"
}

```


## ValidationError

```json

{
  "properties": {
    "loc": {
      "items": {
        "anyOf": [
          {
            "type": "string"
          },
          {
            "type": "integer"
          }
        ]
      },
      "type": "array",
      "title": "Location"
    },
    "msg": {
      "type": "string",
      "title": "Message"
    },
    "type": {
      "type": "string",
      "title": "Error Type"
    }
  },
  "type": "object",
  "required": [
    "loc",
    "msg",
    "type"
  ],
  "title": "ValidationError"
}

```


## VendorAvailabilityResponse

```json

{
  "properties": {
    "vendor_id": {
      "type": "string",
      "title": "Vendor Id"
    },
    "availability_status": {
      "type": "string",
      "title": "Availability Status"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    },
    "availability_updated_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Availability Updated At"
    }
  },
  "type": "object",
  "required": [
    "vendor_id",
    "availability_status"
  ],
  "title": "VendorAvailabilityResponse"
}

```


## VendorAvailabilityUpdateRequest

```json

{
  "properties": {
    "availability_status": {
      "type": "string",
      "title": "Availability Status"
    },
    "current_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Location"
    },
    "current_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Latitude"
    },
    "current_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Current Longitude"
    }
  },
  "type": "object",
  "required": [
    "availability_status"
  ],
  "title": "VendorAvailabilityUpdateRequest"
}

```


## VendorDocumentResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "document_type": {
      "type": "string",
      "title": "Document Type"
    },
    "file_url": {
      "type": "string",
      "title": "File Url"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "document_type",
    "file_url",
    "created_at"
  ],
  "title": "VendorDocumentResponse"
}

```


## VendorDocumentSubmitResponse

```json

{
  "properties": {
    "vendor_id": {
      "type": "string",
      "title": "Vendor Id"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "uploaded_documents": {
      "items": {
        "$ref": "#/components/schemas/VendorDocumentResponse"
      },
      "type": "array",
      "title": "Uploaded Documents"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "vendor_id",
    "status",
    "uploaded_documents",
    "message"
  ],
  "title": "VendorDocumentSubmitResponse"
}

```


## VendorMatchRequest

```json

{
  "properties": {
    "pickup_address": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Address"
    },
    "pickup_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Latitude"
    },
    "pickup_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Pickup Longitude"
    },
    "vehicle_type": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Vehicle Type"
    },
    "region": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Region"
    },
    "limit": {
      "type": "integer",
      "maximum": 50.0,
      "minimum": 1.0,
      "title": "Limit",
      "default": 10
    }
  },
  "type": "object",
  "title": "VendorMatchRequest"
}

```


## VendorMatchResult

```json

{
  "properties": {
    "vendor_id": {
      "type": "string",
      "title": "Vendor Id"
    },
    "vendor_name": {
      "type": "string",
      "title": "Vendor Name"
    },
    "business_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Business Name"
    },
    "vehicle_types": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Vehicle Types"
    },
    "average_rating": {
      "type": "number",
      "title": "Average Rating"
    },
    "total_deliveries": {
      "type": "integer",
      "title": "Total Deliveries"
    },
    "distance_km": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Distance Km"
    },
    "eta_hours": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Eta Hours"
    },
    "match_score": {
      "type": "number",
      "title": "Match Score"
    }
  },
  "type": "object",
  "required": [
    "vendor_id",
    "vendor_name",
    "vehicle_types",
    "average_rating",
    "total_deliveries",
    "match_score"
  ],
  "title": "VendorMatchResult"
}

```


## VendorRegisterResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "full_name": {
      "type": "string",
      "title": "Full Name"
    },
    "email": {
      "type": "string",
      "title": "Email"
    },
    "phone": {
      "type": "string",
      "title": "Phone"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "message": {
      "type": "string",
      "title": "Message"
    }
  },
  "type": "object",
  "required": [
    "id",
    "full_name",
    "email",
    "phone",
    "status",
    "message"
  ],
  "title": "VendorRegisterResponse"
}

```


## VendorResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "full_name": {
      "type": "string",
      "title": "Full Name"
    },
    "email": {
      "type": "string",
      "title": "Email"
    },
    "phone": {
      "type": "string",
      "title": "Phone"
    },
    "id_type": {
      "type": "string",
      "title": "Id Type"
    },
    "id_number": {
      "type": "string",
      "title": "Id Number"
    },
    "business_name": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Business Name"
    },
    "business_type": {
      "type": "string",
      "title": "Business Type"
    },
    "operating_regions": {
      "items": {
        "type": "string"
      },
      "type": "array",
      "title": "Operating Regions"
    },
    "years_experience": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Years Experience"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "availability_status": {
      "type": "string",
      "title": "Availability Status",
      "default": "offline"
    },
    "availability_updated_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Availability Updated At"
    },
    "last_known_location": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Known Location"
    },
    "last_known_latitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Known Latitude"
    },
    "last_known_longitude": {
      "anyOf": [
        {
          "type": "number"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Known Longitude"
    },
    "last_seen_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Last Seen At"
    },
    "average_rating": {
      "type": "number",
      "title": "Average Rating"
    },
    "total_deliveries": {
      "type": "integer",
      "title": "Total Deliveries"
    },
    "vehicles": {
      "items": {
        "$ref": "#/components/schemas/VendorVehicleResponse"
      },
      "type": "array",
      "title": "Vehicles"
    },
    "documents": {
      "items": {
        "$ref": "#/components/schemas/VendorDocumentResponse"
      },
      "type": "array",
      "title": "Documents",
      "default": []
    },
    "terms_accepted": {
      "type": "boolean",
      "title": "Terms Accepted"
    },
    "insurance_accepted": {
      "type": "boolean",
      "title": "Insurance Accepted"
    },
    "background_check_accepted": {
      "type": "boolean",
      "title": "Background Check Accepted"
    },
    "reviewed_by": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reviewed By"
    },
    "reviewed_at": {
      "anyOf": [
        {
          "type": "string",
          "format": "date-time"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reviewed At"
    },
    "rejection_reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Rejection Reason"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "title": "Created At"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "title": "Updated At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "full_name",
    "email",
    "phone",
    "id_type",
    "id_number",
    "business_type",
    "operating_regions",
    "status",
    "average_rating",
    "total_deliveries",
    "vehicles",
    "terms_accepted",
    "insurance_accepted",
    "background_check_accepted",
    "created_at",
    "updated_at"
  ],
  "title": "VendorResponse"
}

```


## VendorReviewRequest

```json

{
  "properties": {
    "action": {
      "type": "string",
      "title": "Action"
    },
    "rejection_reason": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Rejection Reason"
    }
  },
  "type": "object",
  "required": [
    "action"
  ],
  "title": "VendorReviewRequest"
}

```


## VendorVehicleResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "vehicle_type": {
      "type": "string",
      "title": "Vehicle Type"
    },
    "registration_number": {
      "type": "string",
      "title": "Registration Number"
    },
    "make_model": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Make Model"
    },
    "year": {
      "anyOf": [
        {
          "type": "integer"
        },
        {
          "type": "null"
        }
      ],
      "title": "Year"
    },
    "insurance_doc_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Insurance Doc Url"
    },
    "roadworthy_doc_url": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Roadworthy Doc Url"
    },
    "is_active": {
      "type": "boolean",
      "title": "Is Active"
    }
  },
  "type": "object",
  "required": [
    "id",
    "vehicle_type",
    "registration_number",
    "is_active"
  ],
  "title": "VendorVehicleResponse"
}

```


## WalletResponse

```json

{
  "properties": {
    "tenant_id": {
      "type": "string",
      "title": "Tenant Id"
    },
    "currency": {
      "type": "string",
      "title": "Currency"
    },
    "balance_credits": {
      "type": "integer",
      "title": "Balance Credits"
    }
  },
  "type": "object",
  "required": [
    "tenant_id",
    "currency",
    "balance_credits"
  ],
  "title": "WalletResponse"
}

```


## WalletTransactionResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "transaction_type": {
      "type": "string",
      "title": "Transaction Type"
    },
    "credits_delta": {
      "type": "integer",
      "title": "Credits Delta"
    },
    "balance_after": {
      "type": "integer",
      "title": "Balance After"
    },
    "reference": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Reference"
    },
    "memo": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ],
      "title": "Memo"
    },
    "created_at": {
      "type": "string",
      "title": "Created At"
    }
  },
  "type": "object",
  "required": [
    "id",
    "transaction_type",
    "credits_delta",
    "balance_after",
    "created_at"
  ],
  "title": "WalletTransactionResponse"
}

```


## app__schemas__fleetbase_runtime__RunnerResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "title": "Id"
    },
    "name": {
      "type": "string",
      "title": "Name"
    },
    "hostname": {
      "type": "string",
      "title": "Hostname"
    },
    "ssh_port": {
      "type": "integer",
      "title": "Ssh Port"
    },
    "ssh_user": {
      "type": "string",
      "title": "Ssh User"
    },
    "root_runtime_path": {
      "type": "string",
      "title": "Root Runtime Path"
    },
    "status": {
      "type": "string",
      "title": "Status"
    },
    "max_tenants": {
      "type": "integer",
      "title": "Max Tenants"
    },
    "current_tenants": {
      "type": "integer",
      "title": "Current Tenants"
    },
    "supports_reference_install": {
      "type": "boolean",
      "title": "Supports Reference Install"
    }
  },
  "type": "object",
  "required": [
    "id",
    "name",
    "hostname",
    "ssh_port",
    "ssh_user",
    "root_runtime_path",
    "status",
    "max_tenants",
    "current_tenants",
    "supports_reference_install"
  ],
  "title": "RunnerResponse"
}

```


## app__schemas__runner__RunnerResponse

```json

{
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid",
      "title": "Id"
    },
    "name": {
      "type": "string",
      "title": "Name"
    },
    "host": {
      "type": "string",
      "title": "Host"
    },
    "ssh_port": {
      "type": "integer",
      "title": "Ssh Port"
    },
    "ssh_user": {
      "type": "string",
      "title": "Ssh User"
    },
    "fleetbase_root": {
      "type": "string",
      "title": "Fleetbase Root"
    },
    "is_active": {
      "type": "boolean",
      "title": "Is Active"
    },
    "reserved_for_single_tenant": {
      "type": "boolean",
      "title": "Reserved For Single Tenant"
    }
  },
  "type": "object",
  "required": [
    "id",
    "name",
    "host",
    "ssh_port",
    "ssh_user",
    "fleetbase_root",
    "is_active",
    "reserved_for_single_tenant"
  ],
  "title": "RunnerResponse"
}

```

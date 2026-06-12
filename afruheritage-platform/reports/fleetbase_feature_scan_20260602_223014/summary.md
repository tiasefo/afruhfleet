# Fleetbase Feature Status Scan

Generated: Tue Jun  2 10:30:14 PM UTC 2026

## Runtime Health
| Component | Status | Evidence |
|---|---|---|
| Fleetbase API / HTTPD | ✅ Working | http://10.0.0.115:8004 reachable |
| Fleetbase Console | ✅ Working | http://10.0.0.115:4203 reachable |
| Fleetbase Socket | ✅ Working | http://10.0.0.115:38003 reachable |

## Container Status
| Container Group | Status | Evidence |
|---|---|---|
| fleetbase-application | ✅ Running | container is up |
| fleetbase-httpd | ✅ Running | container is up |
| fleetbase-console | ✅ Running | container is up |
| fleetbase-database | ✅ Running | container is up |
| fleetbase-cache | ✅ Running | container is up |
| fleetbase-queue | ✅ Running | container is up |
| fleetbase-scheduler | ✅ Running | container is up |
| fleetbase-socket | ✅ Running | container is up |

## AfruHeritage Wrapper Coverage for Fleetbase Features
| Fleetbase Feature Area | Status | Evidence |
|---|---|---|
| Billing / Credits | ❌ Not exposed / not detected | no OpenAPI route match |
| Fleet / Vehicles | ❌ Not exposed / not detected | no OpenAPI route match |
| Customer Portal / Members | ❌ Not exposed / not detected | no OpenAPI route match |
| KYC / Vendor Verification | ❌ Not exposed / not detected | no OpenAPI route match |
| Dispatch / Jobs | ❌ Not exposed / not detected | no OpenAPI route match |
| AI Assistant | ❌ Not exposed / not detected | no OpenAPI route match |
| Shipments / Orders | ❌ Not exposed / not detected | no OpenAPI route match |
| Domains / Tenant Portal | ❌ Not exposed / not detected | no OpenAPI route match |
| Support / Tickets | ❌ Not exposed / not detected | no OpenAPI route match |
| Runtime Provisioning | ❌ Not exposed / not detected | no OpenAPI route match |
| GPS / Live Tracking | ❌ Not exposed / not detected | no OpenAPI route match |
| Marketplace / Vendors | ❌ Not exposed / not detected | no OpenAPI route match |
| CRM | ❌ Not exposed / not detected | no OpenAPI route match |
| Drivers | ❌ Not exposed / not detected | no OpenAPI route match |

## Fleetbase Source/Runtime Files
| Check | Status | Evidence |
|---|---|---|
| Runtime compose found | ✅ Yes | /mnt/storage/afruheritage-runtimes/74e530f9-2f62-4804-a619-0f7a583a0cae/fleetbase/docker-compose.yml |
| Fleetbase API source | ✅ Present | /mnt/storage/afruheritage-runtimes/74e530f9-2f62-4804-a619-0f7a583a0cae/fleetbase/api |
| Fleetbase Console source | ✅ Present | /mnt/storage/afruheritage-runtimes/74e530f9-2f62-4804-a619-0f7a583a0cae/fleetbase/console |
| Runtime compose found | ✅ Yes | /mnt/storage/afruheritage-runtimes/c34425fb-8b25-4910-b1dc-d5fb630e3fa0/fleetbase/docker-compose.yml |
| Fleetbase API source | ✅ Present | /mnt/storage/afruheritage-runtimes/c34425fb-8b25-4910-b1dc-d5fb630e3fa0/fleetbase/api |
| Fleetbase Console source | ✅ Present | /mnt/storage/afruheritage-runtimes/c34425fb-8b25-4910-b1dc-d5fb630e3fa0/fleetbase/console |

## Raw Route Evidence
```
/api/v1/admin/marketplace/jobs
/api/v1/admin/marketplace/jobs/{job_id}/cancel
/api/v1/admin/marketplace/jobs/{job_id}/reassign/{driver_id}
/api/v1/ai/chat
/api/v1/ai/chat/public
/api/v1/ai/widget/config
/api/v1/billing/admin/credits/adjust
/api/v1/billing/admin/read-only
/api/v1/billing/admin/subscriptions/assign
/api/v1/billing/credits/consume
/api/v1/billing/payments/init
/api/v1/billing/payments/reinit/{reference}
/api/v1/billing/payments/verify/{reference}
/api/v1/billing/plans
/api/v1/billing/subscriptions/{tenant_id}
/api/v1/billing/subscriptions/trial/{tenant_id}
/api/v1/billing/usage-costs
/api/v1/billing/wallets/{tenant_id}
/api/v1/billing/wallets/{tenant_id}/transactions
/api/v1/commercial/signup/{signup_id}/provision-runtime
/api/v1/commercial/signup/{signup_id}/provision-runtime-async
/api/v1/commercial/signup/{signup_id}/reconcile-runtime
/api/v1/customer-portal/{tenant_id}/shipments
/api/v1/customer-portal/{tenant_id}/tracking
/api/v1/domains/activate
/api/v1/domains/{domain_id}/events
/api/v1/domains/{domain_id}/fail
/api/v1/domains/{domain_id}/refresh-status
/api/v1/domains/request
/api/v1/domains/resolve
/api/v1/domains/settings/{tenant_id}
/api/v1/domains/tenant/{tenant_id}
/api/v1/fleetbase-runtime/deploy
/api/v1/fleetbase-runtime/retry
/api/v1/fleetbase-runtime/runners
/api/v1/fleetbase-runtime/{runtime_id}/events
/api/v1/fleetbase-runtime/suspend
/api/v1/fleetbase-runtime/tenant/{tenant_id}
/api/v1/geo/{tenant_id}/shipment-routes
/api/v1/kyc/admin/approve/{kyc_id}
/api/v1/kyc/admin/list
/api/v1/kyc/admin/pending
/api/v1/kyc/admin/revoke/{kyc_id}
/api/v1/kyc/liveness
/api/v1/kyc/ocr-parse
/api/v1/kyc/status
/api/v1/kyc/{submission_id}/review
/api/v1/kyc/submit-manual
/api/v1/kyc/upload-id
/api/v1/marketplace/dashboard/driver
/api/v1/marketplace/drivers/search
/api/v1/marketplace/shipments
/api/v1/marketplace/shipments/{job_id}/accept
/api/v1/marketplace/shipments/{job_id}/gps
/api/v1/marketplace/shipments/{job_id}/tracking/{status}
/api/v1/marketplace/shipments/{shipment_id}
/api/v1/marketplace/shipments/{shipment_id}/bids
/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/accept
/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/counter
/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/reject
/api/v1/marketplace/shipments/{shipment_id}/bids/{bid_id}/respond-counter
/api/v1/navigator/{tenant_id}/drivers
/api/v1/navigator/{tenant_id}/tracking
/api/v1/shipments/public/track/{tenant_id}/{tracking_number}
/api/v1/shipments/{tenant_id}
/api/v1/shipments/{tenant_id}/import/csv
/api/v1/shipments/{tenant_id}/members
/api/v1/shipments/{tenant_id}/members/{member_id}
/api/v1/shipments/{tenant_id}/{shipment_id}
/api/v1/shipments/{tenant_id}/{shipment_id}/events
/api/v1/shipments/{tenant_id}/{shipment_id}/location
/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/history
/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/latest
/api/v1/shipments/{tenant_id}/{shipment_id}/tracking/point
/api/v1/shipments/{tenant_id}/{shipment_id}/transition
/api/v1/shipments/{tenant_id}/{shipment_id}/upload-image
/api/v1/shipments/{tenant_id}/summary
/api/v1/support-crm/accounts
/api/v1/support-crm/admin/tickets
/api/v1/support-crm/admin/tickets/{ticket_id}/status
/api/v1/support-crm/contacts
/api/v1/support-crm/opportunities
/api/v1/support-crm/public/tickets
/api/v1/support-crm/public/tickets/{public_token}
/api/v1/support-crm/public/tickets/{public_token}/messages
/api/v1/support-crm/public/tickets/{public_token}/reply
/api/v1/support-crm/quotes
/api/v1/tenants/{tenant_id}/runtime-auth
/api/v1/users
/api/v1/users/audit
/api/v1/users/bulk-import
/api/v1/users/{user_id}
/api/v1/users/{user_id}/role
/api/v1/users/{user_id}/send-reset-link
/api/v1/users/{user_id}/status
/api/v1/vendors/admin
/api/v1/vendors/admin/{vendor_id}
/api/v1/vendors/admin/{vendor_id}/documents
/api/v1/vendors/admin/{vendor_id}/review
/api/v1/vendors/admin/{vendor_id}/suspend
/api/v1/vendors/marketplace
/api/v1/vendors/marketplace/{vendor_id}
/api/v1/vendors/me/availability
/api/v1/vendors/me/bookings
/api/v1/vendors/me/bookings/{booking_id}/accept
/api/v1/vendors/me/bookings/{booking_id}/reject
/api/v1/vendors/me/documents
/api/v1/vendors/register
/api/v1/vendors/{tenant_id}/bookings
/api/v1/vendors/{tenant_id}/bookings/{booking_id}
/api/v1/vendors/{tenant_id}/dispatch/auto
/api/v1/vendors/{tenant_id}/marketplace/match
/api/v1/whatsapp/send-shipment-update
```

# GPS Workback (Phase 1)

## Current State

### What exists now
1. Provider abstraction for geocoding and route lookup in `app/services/geo_service.py`.
2. Providers implemented:
   - Google Maps (geocode, reverse geocode, directions)
   - Mapbox (geocode, reverse geocode, directions)
   - Nominatim (geocode, reverse geocode, straight-line route estimate)
3. Priority-country wrappers for Ghana/China in `app/services/ghana_geo_service.py`.
4. Shipment location/event update API in `app/api/routes/shipments.py`.
5. Vendor booking location fields and shipment sync in `app/services/vendor_service.py`.

### What is missing for true live GPS
1. No authenticated driver/device location stream endpoint.
2. No per-device identity, session, or key rotation model.
3. No ingestion rate controls for continuous GPS (debounce/sampling/queue).
4. No GPS telemetry history table dedicated for high-frequency points.
5. No map-matching, drift filtering, or geofence event engine.
6. No websocket/SSE feed for real-time tracking fanout.
7. No SLA monitor for stale tracking updates.

## Phase 1 Implementation Plan

### Step 1: Data model for telemetry
Create `shipment_tracking_points` table:
- id
- shipment_id
- tenant_id
- latitude
- longitude
- speed_kph
- heading
- accuracy_m
- source (driver_app, vendor_marketplace, runtime_sync)
- captured_at
- received_at

Add indexes:
- `(tenant_id, shipment_id, captured_at desc)`
- `(shipment_id, captured_at desc)`

### Step 2: Driver ingestion endpoint
Add endpoint:
- `POST /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/point`

Payload:
- latitude
- longitude
- captured_at
- speed_kph (optional)
- heading (optional)
- accuracy_m (optional)

Rules:
- reject coordinates outside valid ranges
- reject stale timestamps beyond configured window
- enforce tenant authorization

### Step 3: Sampling and anti-noise logic
In service layer:
- Drop point if distance < 15m and time delta < 20s
- Drop point if speed jump exceeds realistic threshold
- Keep latest valid point as shipment current position
- Persist all accepted points to tracking table

### Step 4: Real-time fanout
Add websocket topic per shipment:
- `tracking:{tenant_id}:{shipment_id}`

Publish accepted point and derived ETA updates.

### Step 5: Read APIs for map playback
Add endpoints:
- `GET /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/latest`
- `GET /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/history?from=&to=&limit=`

### Step 6: Ops and reliability
Add metrics:
- points_ingested_total
- points_rejected_total
- stale_shipments_total
- avg_ingest_latency_ms

Add stale monitor job:
- mark shipments as `tracking_stale` after configurable timeout.

## Immediate Task List

1. Create telemetry model + migration.
2. Implement tracking ingestion endpoint and service validation.
3. Wire ingestion to shipment current position update.
4. Add tracking history read endpoints.
5. Add websocket push for latest location.
6. Add stale tracking scheduled monitor.

## Acceptance Criteria

1. Driver app can send location every 10-30s without DB overload.
2. Public tracking shows location updates within 2s of ingest.
3. History endpoint returns ordered trajectory points.
4. Stale shipments are flagged automatically.
5. All GPS writes are tenant-isolated and auditable.

## Important Reality Rollout (Implementation Plan)

### Objective
Ship a production-ready driver operations loop where:
1. Drivers self-onboard as vendors and upload real documents.
2. Admin reviews and approves in console.
3. Dispatch finds and books nearest suitable driver.
4. Driver app streams live GPS every 10-30 seconds.
5. Operations and customers see reliable live tracking and stale alerts.

### What is already done in backend
1. Tracking ingest, history, websocket fanout, stale monitor, and telemetry persistence are implemented.
2. Websocket tracking stream is token-protected and tenant-checked.
3. Vendor self-document upload is implemented and admin upload path is disabled.
4. Vendor matching endpoint exists for nearest/suitable candidates.

### Workstream A: Driver App (critical missing piece)
1. Build driver mobile app (Flutter or React Native) with secure login.
2. Add vendor onboarding screens:
   - profile and vehicle details
   - document capture/upload (id_front, id_back, selfie_photo, insurance_doc, roadworthy_doc)
3. Add driver duty states:
   - offline
   - available
   - en_route_pickup
   - delivering
4. Add booking inbox screen:
   - list open offers
   - accept/reject booking
5. Add GPS sender service:
   - foreground updates every 10-30s
   - background mode where allowed by OS policy
   - offline queue and retry with exponential backoff
6. Add battery/network guardrails:
   - adaptive interval (10s moving, 30s idle)
   - pause if no active booking and not available

### Workstream B: Dispatch and booking flow hardening
1. Add one-call dispatch endpoint:
   - match top vendors and auto-create booking with fallback list.
2. Add booking offer TTL and reassignment:
   - if not accepted in N minutes, auto-offer next candidate.
3. Add driver availability controls:
   - only available drivers are matchable.
4. Add assignment reason trace:
   - score breakdown persisted for audit.

### Workstream C: GPS reliability and quality
1. Add per-driver ingest limits (rate limit + burst limits).
2. Add idempotency key support to prevent duplicate points.
3. Add map-matching option (Phase 2):
   - snap noisy points to road where provider allows.
4. Add GPS health dashboard:
   - last seen, drift rate, reject reasons.
5. Add alert channels:
   - stale tracking alert to ops and tenant.

### Workstream D: Admin console and operations
1. Vendor review queue:
   - pending and under_review tabs
   - document preview and decision history
2. Dispatch board:
   - active bookings, live map, stale badges
3. SLA panel:
   - average ingest latency
   - stale shipment count
   - acceptance time and reassignment rate

### API and integration checklist
1. Driver app must call:
   - POST /api/v1/vendors/me/documents
   - POST /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/point
   - WebSocket /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/ws?token=<jwt>
2. Dispatch UI must call:
   - POST /api/v1/vendors/{tenant_id}/marketplace/match
   - POST /api/v1/vendors/{tenant_id}/bookings
3. Tracking UI must call:
   - GET /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/latest
   - GET /api/v1/shipments/{tenant_id}/{shipment_id}/tracking/history

### Security and compliance checklist
1. Enforce short-lived access tokens and refresh flow for driver app.
2. Encrypt sensitive document storage at rest.
3. Record audit events for:
   - document submit
   - admin approve/reject
   - booking assign/reassign
4. Restrict public URLs for identity documents when possible.

### Suggested delivery sequence (6 sprints)
1. Sprint 1:
   - driver auth and onboarding UI
   - self-document upload wired to backend
2. Sprint 2:
   - availability states and booking inbox
   - accept/reject flow
3. Sprint 3:
   - background GPS sender and offline retry queue
   - real device soak test
4. Sprint 4:
   - one-call dispatch and reassignment TTL
   - score trace persistence
5. Sprint 5:
   - ops dashboard and stale alerts
   - SLA metrics visibility
6. Sprint 6:
   - UAT with pilot drivers and tenants
   - hardening and launch checklist

### Definition of done for production launch
1. 95% of active-delivery points arrive within 20 seconds.
2. 99% of shipments show at least one update every 2 minutes while in transit.
3. Reassignment succeeds within 5 minutes when first driver does not accept.
4. Admin review decision time is below agreed SLA.
5. Pilot tenant signs off with successful end-to-end deliveries.

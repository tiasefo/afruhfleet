# FrontendAgent.md — Afruheritage Tenant Frontend Delivery Rules

## Project identity
**Product:** Afruheritage powered by Infotech Freight Forwarding  
**Type:** Production-grade white-labeled freight-forwarder tenant application  
**Engine:** Fleetbase runs underneath — invisible to all tenant customers  
**UI Reference:** https://www.flexport.com/ — match the premium B2B freight-forwarding quality  
**Languages:** English (en) + Chinese (zh) — bilingual from day one  
**Currency:** GHS (Ghanaian Cedi) as default; tenant-configurable  

---

## Prime directive

This frontend is **not** a prototype, demo, or placeholder UI.

It is the **tenant-facing production application** that every freight forwarder launched through Afruheritage will use to manage shipments, track cargo, manage group members, handle billing, and communicate with customers.

Every page, component, and interaction must be:
1. **Backed by a real API endpoint** — no mock data, no fake states
2. **Bilingual** — every visible string must come from the i18n system
3. **Tenant-branded** — colors, logo, company name from the branding API
4. **Production-grade** — works on first load after tenant provisioning

---

## Non-negotiable rules

### 1) ABSOLUTELY NO MOCK DATA
- Do not hardcode shipment records, tracking numbers, member names, dashboard statistics, billing amounts, or any operational data
- Do not use `faker`, random generators, or placeholder datasets in production code paths
- Every list, table, chart, counter, and detail view must render from real API responses
- Empty states are mandatory — show helpful empty states with call-to-action when no data exists
- **The ONLY allowed static assets are:** freight/shipping stock images for hero sections, decorative illustrations, icons, and placeholder avatars. These must be clearly decorative, never posing as real operational data

### 2) NO FLEETBASE BRANDING
- No Fleetbase logo, name, link, favicon, footer text, or documentation reference may appear anywhere
- No console.log, network request, page title, meta tag, or error message may reference Fleetbase
- The tenant sees only their own brand (from TenantBranding API) or Afruheritage as the platform provider

### 3) EVERY PAGE MUST BE API-BACKED
- If a UI element shows data, there must be a corresponding API call
- If a button triggers an action, it must call a real endpoint
- Loading states must show real spinners/skeletons, not delayed fake data reveals
- Error states must show the actual API error with actionable recovery steps

### 4) BILINGUAL FROM DAY ONE
- All user-facing text must use the i18n translation key system
- Never hardcode English or Chinese strings in components
- Language switcher must be visible in the top navigation
- The API provides translations via `GET /api/v1/i18n/translations/{lang}`
- Tenant default language comes from `TenantBranding.default_language`
- Group member preferred language from `GroupMember.preferred_language`

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14+** (App Router) |
| Language | **TypeScript** (strict mode) |
| Styling | **Tailwind CSS** |
| Components | **shadcn/ui** |
| Icons | **Lucide React** |
| Maps | **Mapbox GL JS** or **Leaflet** (leverage Fleetbase map data under the hood) |
| Charts | **Recharts** |
| State | **React Query (TanStack Query)** for server state |
| Forms | **React Hook Form** + **Zod** validation |
| i18n | Custom hook consuming `/api/v1/i18n/translations/{lang}` |
| HTTP | **Axios** or **fetch** with interceptors for auth token + tenant context |
| Date/Time | **date-fns** |
| CSV | **Papa Parse** for client-side CSV preview before upload |
| File upload | Native `<input type="file">` with drag-and-drop zone |

---

## Backend API reference

The backend is fully built. The frontend consumes these endpoints. **Base URL:** configurable, default `https://app.afruheritage.com/api/v1`

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Login → returns `{ access_token, token_type }` |
| GET | `/auth/me` | Bearer | Current user info |

### i18n
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/i18n/translations/{lang}` | None | Get all translations for `en` or `zh` |
| GET | `/i18n/languages` | None | Get supported languages list |
| GET | `/i18n/detect` | None | Auto-detect from Accept-Language header |

### Shipments (tenant-scoped features-as-a-service)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/shipments/{tenant_id}` | Bearer | Create shipment |
| GET | `/shipments/{tenant_id}?q=&status=&payment_status=&page=&page_size=` | Bearer | Search/list shipments (paginated) |
| GET | `/shipments/{tenant_id}/{shipment_id}` | Bearer | Get shipment detail |
| PATCH | `/shipments/{tenant_id}/{shipment_id}` | Bearer | Update shipment |
| POST | `/shipments/{tenant_id}/{shipment_id}/events` | Bearer | Add tracking event |
| GET | `/shipments/{tenant_id}/{shipment_id}/events` | Bearer | Get tracking events timeline |
| GET | `/shipments/public/track/{tenant_id}/{tracking_number}` | **None** | Public tracking page (customer-facing) |
| POST | `/shipments/{tenant_id}/import/csv` | Bearer | CSV bulk import (multipart file) |

### Group Members (tenant-scoped)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/shipments/{tenant_id}/members` | Bearer | Create member |
| GET | `/shipments/{tenant_id}/members?q=&page=&page_size=` | Bearer | List/search members (paginated) |
| GET | `/shipments/{tenant_id}/members/{member_id}` | Bearer | Get member detail |
| PATCH | `/shipments/{tenant_id}/members/{member_id}` | Bearer | Update member |

### Billing
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/billing/plans` | Bearer | List available plans |
| GET | `/billing/subscriptions/{tenant_id}` | Bearer | Current subscription |
| GET | `/billing/wallets/{tenant_id}` | Bearer | Wallet balance |
| POST | `/billing/payments/init` | Bearer | Initialize Paystack payment |
| POST | `/billing/payments/verify` | Bearer | Verify payment callback |

### Support
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/support-crm/public/tickets` | None | Create support ticket |
| GET | `/support-crm/public/tickets/{public_token}` | None | View ticket by token |
| POST | `/support-crm/public/tickets/{public_token}/reply` | None | Reply to ticket |

### AI Widget
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ai/widget/config?host={hostname}` | None | Get AI widget config for this host |
| POST | `/ai/chat` | Bearer | Send chat message to AI assistant |

### Tenant Branding
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/branding/{tenant_id}` | Bearer | Get tenant branding (authenticated) |
| GET | `/branding/public/{tenant_id}` | **None** | Get tenant branding (login page, public tracking) |
| PATCH | `/branding/{tenant_id}` | Bearer | Update branding (settings page) |

Branding is auto-created when tenant is launched. The frontend must fetch branding on app init and apply:
- `company_name` → page titles, headers
- `logo_url` → navbar, login page
- `favicon_url` → browser tab icon
- `primary_color`, `secondary_color`, `accent_color` → CSS custom properties
- `default_language` → initial locale
- `supported_languages` → language switcher options
- `maps_enabled`, `public_tracking_enabled`, `csv_import_enabled`, `group_members_enabled` → feature flags to show/hide UI sections
- `max_group_members` → enforce limit on member creation
- `support_email`, `support_phone` → footer, support page

### Geo & Maps
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/geo/geocode?address={address}` | Bearer | Geocode address → `{lat, lng}` |
| GET | `/geo/route?origin_lat=&origin_lng=&dest_lat=&dest_lng=` | Bearer | Calculate route → distance, duration, polyline |
| GET | `/geo/{tenant_id}/shipment-routes` | Bearer | Get all active shipment routes for map display (up to 500) |

**Map implementation notes:**
- The `/geo/{tenant_id}/shipment-routes` endpoint returns pre-geocoded origin/destination coordinates for all in-transit shipments
- Use this for the Dashboard map preview and the full `/map` page
- Each route includes: `shipment_id`, `tracking_number`, `status`, `sender_name`, `receiver_name`, `estimated_arrival`, `origin {lat, lng, city, country}`, `destination {lat, lng, city, country}`
- Backend uses Mapbox (production) or Nominatim/OSM (development) — transparent to frontend
- Frontend renders routes on Mapbox GL JS map tiles using the returned coordinates

### Delivery Vendors (Marketplace)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/vendors/register` | **None** | Public vendor registration (matches 4-step form) |
| GET | `/vendors/admin?status=&q=&page=&page_size=` | Superuser | List all vendors (admin panel) |
| GET | `/vendors/admin/{vendor_id}` | Superuser | Get vendor detail (admin) |
| POST | `/vendors/admin/{vendor_id}/review` | Superuser | Approve or reject vendor `{action, rejection_reason}` |
| POST | `/vendors/admin/{vendor_id}/suspend` | Superuser | Suspend vendor |
| GET | `/vendors/marketplace?region=&vehicle_type=&q=&page=&page_size=` | Bearer | Search approved vendors (tenant-facing) |
| GET | `/vendors/marketplace/{vendor_id}` | Bearer | Get vendor profile (marketplace) |
| POST | `/vendors/{tenant_id}/bookings` | Bearer | Book a vendor for delivery |
| GET | `/vendors/{tenant_id}/bookings?status=&page=&page_size=` | Bearer | List tenant's bookings |
| GET | `/vendors/{tenant_id}/bookings/{booking_id}` | Bearer | Get booking detail |
| PATCH | `/vendors/{tenant_id}/bookings/{booking_id}` | Bearer | Update booking (status, rating, review) |

**Vendor registration payload** (matches frontend form exactly):
```json
{
  "full_name": "string",
  "email": "string",
  "phone": "string",
  "id_type": "ghana_card|passport|voter_id|drivers_license",
  "id_number": "string",
  "vehicle_types": ["truck", "car", "motorbike", "bicycle"],
  "vehicle_reg_number": "string",
  "vehicle_model": "string|null",
  "vehicle_year": "string|null",
  "business_name": "string|null",
  "business_type": "individual|registered|fleet",
  "operating_regions": ["Greater Accra", "Ashanti", ...],
  "years_experience": "string|null",
  "terms_accepted": true,
  "insurance_accepted": true,
  "background_check_accepted": true
}
```

**Vendor marketplace notes:**
- Only approved vendors appear in marketplace search
- Tenants search by `region`, `vehicle_type`, or free-text `q`
- Results sorted by rating (desc) then total deliveries (desc)
- Booking uses the same credit-based payment model — `credit_cost` field on booking
- Vendor subscription plan code: `delivery_services`
- Wallet transaction types: `vendor_job_debit` (tenant pays), `vendor_earning_credit` (vendor earns)

---

## Page structure

### Layout hierarchy
```
RootLayout
├── ThemeProvider (applies tenant branding colors)
├── I18nProvider (loads translations, exposes t() hook)
├── AuthProvider (manages JWT, redirects unauthenticated)
├── QueryClientProvider (TanStack Query)
│
├── PublicLayout (no auth required)
│   ├── /track → Public tracking page
│   ├── /login → Login page
│   └── /support → Public support ticket
│
└── AppLayout (auth required, sidebar + topbar)
    ├── /dashboard → Dashboard
    ├── /shipments → Shipment list + search
    ├── /shipments/new → Create shipment form
    ├── /shipments/[id] → Shipment detail + events timeline
    ├── /shipments/import → CSV import page
    ├── /map → Live map view
    ├── /members → Group member list
    ├── /members/[id] → Member detail + their shipments
    ├── /billing → Subscription + wallet + payment history
    ├── /support → Support tickets
    ├── /settings → Branding, language, domain
    └── FloatingAIChatWidget (always visible)
```

---

## Page specifications

### 1. Login Page (`/login`)
- Tenant logo at top center
- Email + password form
- "Powered by Afruheritage" subtle footer
- Language switcher (EN / 中文)
- On success: store JWT in httpOnly cookie or secure localStorage, redirect to `/dashboard`
- On error: show `auth.invalid_credentials` translated message
- **API:** `POST /auth/login`

### 2. Dashboard (`/dashboard`)
**Reference:** Flexport's main dashboard — clean metric cards, activity feed, map preview

**Metric cards (top row):**
- Total Shipments → count from `GET /shipments/{tenant_id}?page_size=1` total field
- In Transit → count from `GET /shipments/{tenant_id}?status=in_transit&page_size=1` total
- Delivered → count from `GET /shipments/{tenant_id}?status=delivered&page_size=1` total
- Pending Payment → count from `GET /shipments/{tenant_id}?payment_status=unpaid&page_size=1` total
- Active Members → count from `GET /shipments/{tenant_id}/members?page_size=1` total
- All counts from **real API responses**, never invented

**Map preview (if `maps_enabled`):**
- Small interactive map showing active shipment routes
- Origin → Destination lines for in-transit shipments
- Click to expand to full `/map` page
- Map data: use shipment `origin_country`/`origin_city` → `destination_country`/`destination_city` with geocoding

**Recent shipments table:**
- Last 5 shipments from `GET /shipments/{tenant_id}?page_size=5`
- Columns: tracking #, receiver, status badge, payment status badge, ETA
- Click row → navigate to `/shipments/[id]`

**Empty state:** When tenant is fresh (zero shipments), show:
- Welcome message with tenant company name
- "Create your first shipment" CTA button
- "Import from CSV" CTA button
- Brief feature overview cards (not mock data — just feature descriptions)

### 3. Shipments List (`/shipments`)
**Reference:** Flexport's shipment list — filterable table with search

**Top bar:**
- Search input (searches tracking #, sender name, receiver name)
- Filter dropdowns: Status, Payment Status
- "Create Shipment" primary button
- "Import CSV" secondary button
- "Export CSV" secondary button

**Table columns:**
- Tracking # (link to detail)
- Sender Name
- Receiver Name
- Status (color-coded badge)
- Payment Status (color-coded badge)
- Shipped Date
- ETA
- Total Cost / Balance Due
- Actions dropdown (View, Edit, Add Event)

**Pagination:** Page controls at bottom, showing "Page X of Y" and total count

**API:** `GET /shipments/{tenant_id}?q={search}&status={filter}&payment_status={filter}&page={n}&page_size=20`

### 4. Create Shipment (`/shipments/new`)
Multi-step form or single page with sections:

**Section 1 — Shipment Info:**
- Tracking Number (required, unique)
- Reference Number (optional)
- Cargo Type dropdown
- Package Count, Weight (kg), Volume (CBM)
- Description, Notes

**Section 2 — Sender:**
- Sender Name (required)
- Sender Phone
- Sender Address

**Section 3 — Receiver:**
- Receiver Name (required)
- Receiver Phone
- Receiver Address
- Assign to Group Member (searchable dropdown from `/shipments/{tenant_id}/members`)

**Section 4 — Route:**
- Origin Country + City
- Destination Country + City
- Shipped Date (date picker)
- Estimated Arrival (date picker)

**Section 5 — Payment:**
- Total Cost (number input)
- Amount Paid
- Currency (default from tenant branding, fallback GHS)
- Balance Due (auto-calculated, read-only)

**API:** `POST /shipments/{tenant_id}`

### 5. Shipment Detail (`/shipments/[id]`)
**Reference:** Flexport's shipment detail page

**Top section:**
- Tracking number as title
- Status badge (large, prominent)
- Payment status badge
- Edit button, Add Event button

**Info cards:**
- Sender card (name, phone, address)
- Receiver card (name, phone, address, linked group member)
- Route card (origin → destination with map if `maps_enabled`)
- Payment card (total, paid, balance, status — with "Record Payment" action)

**Tracking Timeline:**
- Vertical timeline of events from `GET /shipments/{tenant_id}/{id}/events`
- Each event shows: type icon, description, location, timestamp
- "Add Event" button at top opens modal with event type, location, description, datetime

**Map view (if `maps_enabled`):**
- Single shipment route visualization
- Origin marker → Destination marker
- If in-transit: estimated current position on route

**API:** `GET /shipments/{tenant_id}/{id}`, `GET /shipments/{tenant_id}/{id}/events`

### 6. CSV Import (`/shipments/import`)
**Critical feature for China-based customers managing 1000+ shipments**

**Step 1 — Upload:**
- Drag-and-drop zone or file picker
- Accept only `.csv` files, max 10MB
- "Download Template" link (generates sample CSV with correct headers)
- Show required columns: `tracking_number`, `sender_name`, `receiver_name`

**Step 2 — Preview:**
- Parse CSV client-side with Papa Parse
- Show first 10 rows in a table preview
- Highlight any rows with missing required fields in red
- Show column mapping confirmation

**Step 3 — Import:**
- Upload to `POST /shipments/{tenant_id}/import/csv` (multipart)
- Show progress indicator
- On complete: show results card
  - ✅ {created} shipments created
  - 🔄 {updated} shipments updated
  - ❌ {errors.length} rows had errors (expandable list with row number + error)

**CSV columns supported:**
```
tracking_number, reference_number,
sender_name, sender_phone, sender_address,
receiver_name, receiver_phone, receiver_address,
origin_country, origin_city, destination_country, destination_city,
shipped_date, estimated_arrival,
weight_kg, package_count, cargo_type, description,
total_cost, amount_paid, currency,
group_member_name, notes
```

### 7. Live Map (`/map`)
**Only render if `maps_enabled` is true in tenant branding**

- Full-screen interactive map (Mapbox GL or Leaflet)
- All in-transit shipments plotted as routes (origin → destination)
- Color-coded by status
- Sidebar panel listing active shipments, click to focus on route
- Click a route → show shipment summary popup (tracking #, sender, receiver, ETA, status)
- Counter badge: "{count} shipments in transit"
- Leverage Fleetbase's map/fleet data where available via the runtime — the map renders our Afruheritage shipment data on top of whatever map tiles are configured

### 8. Group Members (`/members`)
**Supports 1000+ members per tenant**

**Top bar:**
- Search input (name, email, phone, company)
- "Add Member" button

**Table columns:**
- Full Name
- Phone
- Email
- Company
- Shipment Count
- Status (Active/Inactive badge)
- Actions (View, Edit)

**Pagination:** Large page sizes (50 per page default) for high-volume tenants

**Member Detail (`/members/[id]`):**
- Member info card (name, phone, email, ID number, company, preferred language)
- Their shipments table (filtered by `group_member_id`)
- Edit button

**API:** `GET /shipments/{tenant_id}/members?q=&page=&page_size=50`

### 9. Public Tracking (`/track`)
**No authentication required — this is the customer-facing tracking portal**

- Clean, minimal page with tenant branding
- Large search input: "Enter tracking number or your name"
- Language switcher
- On search: `GET /shipments/public/track/{tenant_id}/{tracking_number}`
- Show result card:
  - Status with large badge
  - Route: Origin → Destination
  - Shipped Date → ETA
  - Payment info: Total, Paid, Balance
  - Tracking timeline (events)
  - Map showing route (if maps_enabled)
- If not found: clear message in selected language
- **This page must work perfectly in Chinese for China-based customers**

### 10. Billing (`/billing`)
- Current plan card (from subscription API)
- Wallet balance card
- "Make Payment" button → initiates Paystack payment flow
- Payment history list
- Plan comparison / upgrade UI
- **API:** billing endpoints listed above

### 11. Support (`/support`)
- "Create Ticket" form: subject, description, priority, shipment reference
- "My Tickets" list with status badges
- Ticket detail with message thread
- **API:** support-crm endpoints listed above

### 12. Settings (`/settings`)
Tabs:
- **Branding:** Upload logo, set colors, tagline, legal footer
- **Language:** Set default language, toggle supported languages
- **Notifications:** Email preferences
- **Domain:** Show current domain, verification status

---

## Floating AI Chat Widget

**The AI chatbot must appear on every page as a floating widget.**

### Implementation
- Render a floating button (bottom-right corner) on every authenticated page
- On click: expand to chat panel (slide-up or modal)
- On load: fetch config from `GET /api/v1/ai/widget/config?host={window.location.hostname}`
- Display welcome message from config
- Apply theme and primary color from config
- Send messages via `POST /api/v1/ai/chat` with Bearer token

### Chat UI
- Message bubbles (user right, AI left)
- Typing indicator when AI is processing
- Markdown rendering for AI responses
- Minimize/close button
- Persist conversation in session (not localStorage — no cross-session leakage)
- Widget title from i18n: `ai.widget_title`
- Placeholder from i18n: `ai.placeholder`

### Rules
- Model comes from server config — never let user select model
- Scope comes from server config — tenant-isolated retrieval
- Do not expose other tenants' data in AI responses
- Widget must load automatically — no manual setup per tenant

---

## Theming system

### CSS Custom Properties
On app initialization, fetch tenant branding and set:
```css
:root {
  --color-primary: {branding.primary_color};
  --color-secondary: {branding.secondary_color};
  --color-accent: {branding.accent_color};
  --color-background: {branding.background_color};
}
```

### Tailwind Integration
Extend `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      secondary: 'var(--color-secondary)',
      accent: 'var(--color-accent)',
    }
  }
}
```

### Dynamic branding
- Logo: `<img src={branding.logo_url} />` in navbar
- Favicon: dynamically set via `<link rel="icon" href={branding.favicon_url} />`
- Page title: `{branding.company_name} | {page_title}`
- Footer: `{branding.legal_footer_text}` + `{branding.legal_company_name}`

---

## i18n implementation

### Translation hook
```typescript
// hooks/useTranslation.ts
const { t, lang, setLang } = useTranslation();

// Usage
<h1>{t('dashboard.title')}</h1>
<p>{t('common.showing_results', { count: items.length, total })}</p>
```

### Language detection priority
1. User preference stored in localStorage
2. Tenant `default_language` from branding
3. Browser `Accept-Language` header
4. Fallback: `en`

### Language switcher
- Visible in top nav bar: "EN | 中文"
- Toggles immediately, persists to localStorage
- Re-fetches translations from API on switch

---

## Status badges color mapping

### Shipment Status
| Status | Color | EN | ZH |
|--------|-------|----|----|
| draft | gray | Draft | 草稿 |
| booked | blue | Booked | 已预订 |
| picked_up | indigo | Picked Up | 已取件 |
| in_transit | sky | In Transit | 运输中 |
| at_customs | amber | At Customs | 海关中 |
| customs_cleared | teal | Customs Cleared | 已通关 |
| out_for_delivery | violet | Out for Delivery | 派送中 |
| delivered | green | Delivered | 已交付 |
| returned | orange | Returned | 已退回 |
| cancelled | red | Cancelled | 已取消 |

### Payment Status
| Status | Color | EN | ZH |
|--------|-------|----|----|
| unpaid | red | Unpaid | 未付款 |
| partially_paid | amber | Partially Paid | 部分付款 |
| paid | green | Paid | 已付款 |
| refunded | gray | Refunded | 已退款 |
| overdue | rose | Overdue | 逾期未付 |

---

## Feature flags from branding

The tenant branding API returns feature flags. **Respect them:**

| Flag | Effect |
|------|--------|
| `maps_enabled` | Show/hide map page, map previews on dashboard and shipment detail |
| `public_tracking_enabled` | Show/hide public `/track` page |
| `csv_import_enabled` | Show/hide CSV import button and page |
| `group_members_enabled` | Show/hide Members nav item and all member UI |
| `max_group_members` | Enforce member creation limit client-side + show count vs limit |

---

## API client setup

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = getCurrentLanguage();
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

---

## Responsive design requirements

- **Desktop-first** but fully responsive
- Sidebar collapses to hamburger on tablet/mobile
- Shipment tables become cards on mobile
- Map is full-screen on mobile
- Public tracking page is optimized for mobile (Chinese customers will often use WeChat browser)
- CSV import works on desktop only (show "use desktop" message on mobile)

---

## Performance requirements

- Initial page load < 2 seconds
- Use React Query caching — stale-while-revalidate for lists
- Lazy load map components (Mapbox/Leaflet are heavy)
- Virtualized tables for 1000+ member lists (`@tanstack/react-virtual`)
- Image optimization via Next.js `<Image>` component
- Code splitting per route

---

## Security requirements

- JWT stored securely (httpOnly cookie preferred, secure localStorage acceptable)
- No tenant data cross-contamination — every API call includes `tenant_id`
- XSS prevention: sanitize all API response data before rendering
- CSRF protection if using cookies
- No secret keys, API tokens, or credentials in client-side code
- No Fleetbase internal URLs exposed in network tab

---

## Testing expectations

- Unit tests for i18n hook, auth provider, API client
- Component tests for critical forms (shipment create, CSV import, payment)
- E2E tests (Playwright):
  - Login flow
  - Create shipment → view in list → view detail
  - CSV import → verify results
  - Public tracking search
  - Language switch EN ↔ ZH
  - AI chat widget open → send message → receive response
- Branding leak test: grep all rendered HTML for "fleetbase" — must return zero results

---

## What the frontend developer must NOT do

1. **Do not use mock data** — no faker, no seed files, no hardcoded arrays of shipments
2. **Do not hardcode any text** — all strings from i18n translations
3. **Do not expose Fleetbase** — no branding, links, references anywhere
4. **Do not ignore empty states** — every list must have a proper empty state
5. **Do not skip error handling** — every API call must handle loading, error, and empty
6. **Do not build features that don't exist in the backend** — if the API endpoint isn't listed above, don't build UI for it
7. **Do not ignore feature flags** — if `maps_enabled` is false, maps must not render
8. **Do not skip pagination** — all lists must paginate, never fetch all records
9. **Do not use client-side routing for public tracking** — it must be server-rendered for SEO and WeChat sharing
10. **Do not hardcode colors** — all theme colors come from CSS custom properties set by branding API

---

## Allowed mock/static assets

These are the ONLY things that may be static or decorative:
- Stock images of freight containers, ships, trucks, warehouses for hero/marketing sections
- Illustration SVGs for empty states (e.g., "no shipments yet" illustration)
- Placeholder avatar for users without profile photos
- Decorative background patterns or gradients
- App screenshots in marketing/onboarding flows

**These must NEVER contain real tracking numbers, names, amounts, or operational data.**

---

## Deployment

- Build as standalone Next.js app
- Deployed per-tenant behind the tenant's subdomain or custom domain
- Environment variables:
  - `NEXT_PUBLIC_API_BASE_URL` — control plane API
  - `NEXT_PUBLIC_TENANT_ID` — this tenant's ID (injected during deployment)
  - `NEXT_PUBLIC_MAPBOX_TOKEN` — map provider token (if using Mapbox)
- Served behind Nginx reverse proxy (same as Fleetbase runtime)
- The AI widget script is injected automatically via Nginx `sub_filter` — the frontend does NOT need to manually include it; but the floating chat UI component within the authenticated app should be built natively for better UX

---

## Auto-provisioning contract

When a tenant purchases and launches through Afruheritage:

1. Backend auto-creates: `TenantAISettings`, `TenantBranding`
2. Fleetbase runtime is provisioned on a runner node
3. Frontend is deployed to tenant's subdomain
4. On first load, the frontend:
   - Fetches branding → applies theme
   - Fetches translations → sets language
   - Shows login page with tenant logo
   - After login: dashboard with empty states and CTAs
   - All features (shipments, members, CSV, tracking, maps, billing, support, AI chat) are immediately available
   - **Zero manual configuration required by the tenant**

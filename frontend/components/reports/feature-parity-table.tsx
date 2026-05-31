type Status = "live" | "partial" | "missing"

type ParityRow = {
  feature: string
  web: Status
  mobile: Status
  parity: Status
  notes: string
  evidence: string[]
}

const rows: ParityRow[] = [
  {
    feature: "Email/password authentication",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Both clients call real auth endpoints and persist a token.",
    evidence: [
      "frontend/components/auth/login-form.tsx -> fetch(${apiBaseUrl}/auth/login)",
      "afruheritage-platform/mobile-driver-app/App.tsx -> POST /api/v1/auth/login",
    ],
  },
  {
    feature: "Social OAuth login",
    web: "live",
    mobile: "partial",
    parity: "partial",
    notes: "Web has direct provider login; mobile native has no provider buttons, but can use Web mode.",
    evidence: [
      "frontend/components/auth/login-form.tsx -> /auth/social/{provider}/login",
      "afruheritage-platform/mobile-driver-app/App.tsx -> appMode 'web' opens full web app",
    ],
  },
  {
    feature: "Customer dashboard shipments",
    web: "live",
    mobile: "partial",
    parity: "partial",
    notes: "Web renders tenant shipments; mobile native has no customer dashboard screen, only full web fallback.",
    evidence: [
      "frontend/components/customer/customer-dashboard.tsx -> GET /api/v1/customer-portal/{tenantId}/shipments",
      "afruheritage-platform/mobile-driver-app/App.tsx -> Full App WebView button",
    ],
  },
  {
    feature: "Public shipment tracking",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Web and mobile both use real tracking endpoints.",
    evidence: [
      "frontend/components/tracking/tracking-search.tsx -> /shipments/public/track/{tenant}/{tracking}",
      "afruheritage-platform/mobile-driver-app/App.tsx -> /shipments/{tenant}/{shipment}/tracking/latest|history",
    ],
  },
  {
    feature: "Support ticket create/track/reply",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Web and mobile support flows both call support CRM public ticket APIs.",
    evidence: [
      "frontend/components/support/create-ticket-form.tsx -> /support-crm/public/tickets",
      "frontend/components/support/ticket-detail.tsx -> ticket lookup + messages + reply endpoints",
      "afruheritage-platform/mobile-driver-app/App.tsx -> /api/v1/support-crm/public/tickets endpoints",
    ],
  },
  {
    feature: "KYC submission",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Both clients submit multipart KYC payloads to backend endpoints.",
    evidence: [
      "frontend/app/kyc/page.tsx -> POST /kyc/submit-manual via configured API base",
      "afruheritage-platform/mobile-driver-app/App.tsx -> POST /api/v1/kyc/submit-manual",
      "afruheritage-platform/app/api/routes/kyc.py -> /submit-manual route exists",
    ],
  },
  {
    feature: "Vendor registration",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Web and mobile vendor registration both post real payloads to backend.",
    evidence: [
      "frontend/components/vendors/vendor-registration.tsx -> POST /vendors/register via configured API base",
      "afruheritage-platform/mobile-driver-app/App.tsx -> POST /api/v1/vendors/register",
      "afruheritage-platform/app/api/routes/vendors.py -> /vendors/register route exists",
    ],
  },
  {
    feature: "Vendor document upload",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Web and mobile both submit real vendor documents for admin review.",
    evidence: [
      "frontend/components/vendors/vendor-operations.tsx -> POST /vendors/me/documents via configured API base",
      "afruheritage-platform/mobile-driver-app/App.tsx -> POST /api/v1/vendors/me/documents",
      "afruheritage-platform/app/api/routes/vendors.py -> /vendors/me/documents route exists",
    ],
  },
  {
    feature: "Driver operations (bookings, accept/reject)",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Web and mobile both support booking retrieval and accept/reject decisions.",
    evidence: [
      "frontend/components/vendors/vendor-operations.tsx -> /vendors/me/bookings + accept/reject",
      "afruheritage-platform/mobile-driver-app/App.tsx -> /vendors/me/bookings + accept/reject",
      "afruheritage-platform/app/api/routes/vendors.py -> /me/bookings and decision routes",
    ],
  },
  {
    feature: "Live GPS tracking point ingestion",
    web: "live",
    mobile: "live",
    parity: "live",
    notes: "Web and mobile both stream GPS points to tracking point ingestion endpoint.",
    evidence: [
      "frontend/components/vendors/vendor-operations.tsx -> navigator.geolocation.watchPosition + POST /shipments/{tenant}/{shipment}/tracking/point",
      "afruheritage-platform/mobile-driver-app/App.tsx -> Location.watchPositionAsync + POST tracking/point",
      "afruheritage-platform/app/api/routes/shipments.py -> /tracking/point route exists",
    ],
  },
  {
    feature: "Admin analytics dashboard",
    web: "live",
    mobile: "missing",
    parity: "partial",
    notes: "Admin dashboard exists in web with backend analytics call; no native mobile admin analytics tab.",
    evidence: [
      "frontend/components/admin/analytics-dashboard.tsx -> GET /api/v1/analytics/admin/summary",
      "afruheritage-platform/app/api/routes/analytics.py -> /analytics/admin/summary",
    ],
  },
  {
    feature: "WhatsApp CSV upload",
    web: "live",
    mobile: "missing",
    parity: "partial",
    notes: "Web admin has CSV upload to API; native mobile has no CSV upload flow.",
    evidence: [
      "frontend/components/admin/whatsapp-csv-upload.tsx -> POST /api/v1/whatsapp-csv/upload",
      "afruheritage-platform/app/api/routes/whatsapp_csv.py -> /whatsapp-csv/upload",
    ],
  },
  {
    feature: "AI chat widget",
    web: "live",
    mobile: "partial",
    parity: "partial",
    notes: "Web ships API-backed AI widget; native mobile has no in-app AI tab but can access via Web mode.",
    evidence: [
      "frontend/components/ai-chat-widget.tsx -> /api/v1/ai/chat",
      "afruheritage-platform/mobile-driver-app/App.tsx -> web mode fallback",
    ],
  },
]

function Badge({ status }: { status: Status }) {
  const config = {
    live: {
      label: "LIVE",
      className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    },
    partial: {
      label: "PARTIAL",
      className: "bg-amber-100 text-amber-800 border-amber-300",
    },
    missing: {
      label: "MISSING",
      className: "bg-rose-100 text-rose-800 border-rose-300",
    },
  } as const

  const item = config[status]

  return (
    <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${item.className}`}>
      {item.label}
    </span>
  )
}

export function FeatureParityTable() {
  const totals = rows.reduce(
    (acc, row) => {
      acc.web[row.web] += 1
      acc.mobile[row.mobile] += 1
      acc.parity[row.parity] += 1
      return acc
    },
    {
      web: { live: 0, partial: 0, missing: 0 },
      mobile: { live: 0, partial: 0, missing: 0 },
      parity: { live: 0, partial: 0, missing: 0 },
    }
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Web App Coverage" live={totals.web.live} partial={totals.web.partial} missing={totals.web.missing} />
        <SummaryCard title="Mobile App Coverage" live={totals.mobile.live} partial={totals.mobile.partial} missing={totals.mobile.missing} />
        <SummaryCard title="Cross-Platform Parity" live={totals.parity.live} partial={totals.parity.partial} missing={totals.parity.missing} />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Feature</th>
              <th className="px-4 py-3 text-left font-semibold">Web</th>
              <th className="px-4 py-3 text-left font-semibold">Mobile</th>
              <th className="px-4 py-3 text-left font-semibold">Parity</th>
              <th className="px-4 py-3 text-left font-semibold">Deep-Dive Notes</th>
              <th className="px-4 py-3 text-left font-semibold">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t align-top">
                <td className="px-4 py-3 font-medium text-slate-900">{row.feature}</td>
                <td className="px-4 py-3"><Badge status={row.web} /></td>
                <td className="px-4 py-3"><Badge status={row.mobile} /></td>
                <td className="px-4 py-3"><Badge status={row.parity} /></td>
                <td className="px-4 py-3 text-slate-700">{row.notes}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <ul className="space-y-1">
                    {row.evidence.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold">Status legend</p>
        <p>Green = implemented with real API/backend integration.</p>
        <p>Amber = partial, demo-only, or only available via Web mode bridge.</p>
        <p>Red = missing in that client implementation.</p>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  live,
  partial,
  missing,
}: {
  title: string
  live: number
  partial: number
  missing: number
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">
          LIVE: {live}
        </span>
        <span className="rounded border border-amber-300 bg-amber-100 px-2 py-1 font-semibold text-amber-800">
          PARTIAL: {partial}
        </span>
        <span className="rounded border border-rose-300 bg-rose-100 px-2 py-1 font-semibold text-rose-800">
          MISSING: {missing}
        </span>
      </div>
    </div>
  )
}

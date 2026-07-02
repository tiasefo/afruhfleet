from pathlib import Path

PAGES = {
    "drivers": {
        "title": "Fleetbase Drivers",
        "subtitle": "Live driver records from Fleetbase FleetOps.",
        "endpoint": "/api/v1/fleetbase-proxy/drivers",
        "key": "drivers",
        "columns": [
            ("Name", "name"),
            ("Email", "email"),
            ("Phone", "phone"),
            ("City", "city"),
            ("Country", "country"),
            ("Online", "online"),
        ],
    },
    "vehicles": {
        "title": "Fleetbase Vehicles",
        "subtitle": "Live vehicle records from Fleetbase FleetOps.",
        "endpoint": "/api/v1/fleetbase-proxy/vehicles",
        "key": "vehicles",
        "columns": [
            ("Public ID", "public_id"),
            ("Make", "make"),
            ("Model", "model"),
            ("Plate", "plate_number"),
            ("Status", "status"),
            ("Online", "online"),
        ],
    },
    "fleets": {
        "title": "Fleetbase Fleets",
        "subtitle": "Live fleet records from Fleetbase FleetOps.",
        "endpoint": "/api/v1/fleetbase-proxy/fleets",
        "key": "fleets",
        "columns": [
            ("Name", "name"),
            ("Status", "status"),
            ("Drivers", "drivers_count"),
            ("Vehicles", "vehicles_count"),
            ("Drivers Online", "drivers_online_count"),
            ("Vehicles Online", "vehicles_online_count"),
        ],
    },
    "orders": {
        "title": "Fleetbase Orders",
        "subtitle": "Live order and dispatch records from Fleetbase FleetOps.",
        "endpoint": "/api/v1/fleetbase-proxy/orders",
        "key": "orders",
        "columns": [
            ("Tracking", "tracking"),
            ("Public ID", "public_id"),
            ("Internal ID", "internal_id"),
            ("Status", "status"),
            ("Latest Status", "latest_status"),
            ("Dispatched", "dispatched"),
        ],
    },
}

def cell_expr(field: str) -> str:
    return f"formatValue(row?.{field})"

template = """'use client'

import {{ useEffect, useState }} from 'react'
import Link from 'next/link'
import {{ Navigation }} from '@/components/landing/navigation'
import {{ Footer }} from '@/components/landing/footer'

function formatValue(value: any) {{
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}}

export default function FleetbaseSummaryPage() {{
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {{
    async function load() {{
      try {{
        const res = await fetch('{endpoint}', {{ cache: 'no-store' }})
        const data = await res.json()

        if (!res.ok) {{
          throw new Error(data?.detail || data?.message || 'Fleetbase request failed')
        }}

        setRows(Array.isArray(data?.{key}) ? data.{key} : [])
        setMeta(data?.meta || null)
      }} catch (err: any) {{
        setError(err?.message || 'Failed to load Fleetbase data')
      }} finally {{
        setLoading(false)
      }}
    }}

    load()
  }}, [])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-[#063f4f] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Fleetbase Live Data
          </p>
          <h1 className="mt-3 text-4xl font-bold">{title}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{subtitle}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="https://fleet.afruheritage.com" target="_blank" className="rounded-lg bg-white px-5 py-3 font-semibold text-[#063f4f]">
              Open Fleetbase Console
            </Link>
            <Link href="/fleetbase/console" className="rounded-lg border border-white/30 px-5 py-3 font-semibold text-white">
              Learn About FleetOps
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {{loading && <p className="text-muted-foreground">Loading live Fleetbase data...</p>}}

        {{error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Unable to load Fleetbase data</p>
            <p className="mt-1 text-sm">{{error}}</p>
          </div>
        )}}

        {{!loading && !error && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <h2 className="text-xl font-bold">Live Records</h2>
              <p className="text-sm text-muted-foreground">
                Total: {{meta?.total ?? rows.length}}
              </p>
            </div>

            {{rows.length === 0 ? (
              <div className="p-8 text-muted-foreground">
                No records returned from Fleetbase.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
{headers}
                    </tr>
                  </thead>
                  <tbody>
                    {{rows.map((row, idx) => (
                      <tr key={{row?.uuid || row?.id || idx}} className="border-t">
{cells}
                      </tr>
                    ))}}
                  </tbody>
                </table>
              </div>
            )}}
          </div>
        )}}
      </section>

      <Footer />
    </main>
  )
}}
"""

for slug, cfg in PAGES.items():
    headers = "\n".join(
        [f'                      <th className="px-4 py-3 font-semibold">{label}</th>' for label, _ in cfg["columns"]]
    )
    cells = "\n".join(
        [f'                        <td className="px-4 py-3">{{{cell_expr(field)}}}</td>' for _, field in cfg["columns"]]
    )

    content = template.format(
        endpoint=cfg["endpoint"],
        key=cfg["key"],
        title=cfg["title"],
        subtitle=cfg["subtitle"],
        headers=headers,
        cells=cells,
    )

    d = Path(f"frontend/app/fleetbase/{slug}")
    d.mkdir(parents=True, exist_ok=True)
    (d / "page.tsx").write_text(content)
    print("wired", d / "page.tsx")

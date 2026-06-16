from pathlib import Path

pages = {
"drivers": {
"title": "Fleetbase Drivers",
"endpoint": "/api/v1/fleetbase-proxy/drivers",
"key": "drivers",
"cols": ["name", "email", "phone", "city", "country", "online"],
},
"vehicles": {
"title": "Fleetbase Vehicles",
"endpoint": "/api/v1/fleetbase-proxy/vehicles",
"key": "vehicles",
"cols": ["public_id", "make", "model", "plate_number", "status", "online"],
},
"fleets": {
"title": "Fleetbase Fleets",
"endpoint": "/api/v1/fleetbase-proxy/fleets",
"key": "fleets",
"cols": ["name", "status", "drivers_count", "vehicles_count", "drivers_online_count", "vehicles_online_count"],
},
}

template = """'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function Page() {{
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {{
    async function load() {{
      try {{
        const res = await fetch('{endpoint}', {{ cache: 'no-store' }})
        const data = await res.json()
        if (!res.ok) throw new Error(data?.detail || 'Request failed')
        setRows(data?.{key} || [])
        setMeta(data?.meta || null)
      }} catch (e: any) {{
        setError(e.message || 'Failed to load Fleetbase data')
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
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">Fleetbase Live Data</p>
          <h1 className="mt-3 text-4xl font-bold">{title}</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            This page is now wired to the real Fleetbase proxy API. Use it as a read-only AfruHeritage summary, while full operations remain inside Fleetbase Console.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/fleetbase/console" className="rounded-lg bg-white px-5 py-3 font-semibold text-[#063f4f]">
              Open Fleetbase Console
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-white/30 px-5 py-3 font-semibold text-white">
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {{loading && <p>Loading live Fleetbase data...</p>}}
        {{error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{{error}}</div>}}

        {{!loading && !error && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold">Live Records</h2>
              <p className="text-sm text-muted-foreground">
                Total: {{meta?.total ?? rows.length}}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {headers}
                  </tr>
                </thead>
                <tbody>
                  {{rows.map((row, idx) => (
                    <tr key={{row.uuid || row.id || idx}} className="border-t">
                      {cells}
                    </tr>
                  ))}}
                </tbody>
              </table>
            </div>
          </div>
        )}}
      </section>

      <Footer />
    </main>
  )
}}
"""

for name, cfg in pages.items():
    headers = "\n".join([f'<th className="px-4 py-3">{c}</th>' for c in cfg["cols"]])
    cells = "\n".join([f'<td className="px-4 py-3">{{String(row.{c} ?? "")}}</td>' for c in cfg["cols"]])
    out = template.format(
        title=cfg["title"],
        endpoint=cfg["endpoint"],
        key=cfg["key"],
        headers=headers,
        cells=cells,
    )
    p = Path(f"frontend/app/fleetbase/{name}/page.tsx")
    p.write_text(out)
    print("wired", p)

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

function formatValue(value: any) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export default function FleetbaseSummaryPage() {
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/fleetbase-proxy/orders', { cache: 'no-store' })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.detail || data?.message || 'Fleetbase request failed')
        }

        setRows(Array.isArray(data?.orders) ? data.orders : [])
        setMeta(data?.meta || null)
      } catch (err: any) {
        setError(err?.message || 'Failed to load Fleetbase data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-[#063f4f] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Authenticated FleetOps Data
          </p>
          <h1 className="mt-3 text-4xl font-bold">Fleetbase Orders</h1>
          <p className="mt-4 max-w-2xl text-white/80">Live order and dispatch records from Fleetbase FleetOps.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/api/v1/fleetbase/sso-launch"  className="rounded-lg bg-white px-5 py-3 font-semibold text-[#063f4f]">
              Open Fleetbase Console via SSO
            </Link>
            <Link href="/fleetbase/console" className="rounded-lg border border-white/30 px-5 py-3 font-semibold text-white">
              Learn About FleetOps
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading && <p className="text-muted-foreground">Loading live Fleetbase data...</p>}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Unable to load Fleetbase data</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <h2 className="text-xl font-bold">Live Records</h2>
              <p className="text-sm text-muted-foreground">
                Total: {meta?.total ?? rows.length}
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-muted-foreground">
                No records returned from Fleetbase.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Tracking</th>
                      <th className="px-4 py-3 font-semibold">Public ID</th>
                      <th className="px-4 py-3 font-semibold">Internal ID</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Latest Status</th>
                      <th className="px-4 py-3 font-semibold">Dispatched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row?.uuid || row?.id || idx} className="border-t">
                        <td className="px-4 py-3">{formatValue(row?.tracking)}</td>
                        <td className="px-4 py-3">{formatValue(row?.public_id)}</td>
                        <td className="px-4 py-3">{formatValue(row?.internal_id)}</td>
                        <td className="px-4 py-3">{formatValue(row?.status)}</td>
                        <td className="px-4 py-3">{formatValue(row?.latest_status)}</td>
                        <td className="px-4 py-3">{formatValue(row?.dispatched)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}

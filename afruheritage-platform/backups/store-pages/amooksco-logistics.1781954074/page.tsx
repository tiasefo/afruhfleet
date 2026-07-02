'use client'

import { useState } from 'react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

type Cargo = {
  afru_tracking_number: string
  external_tracking_number?: string
  customer_name?: string
  description?: string
  cbm?: number
  receipt_date?: string
  loading_date?: string
  status?: string
  match_confidence?: string
}

export default function AmookscoStorePage() {
  const [mode, setMode] = useState<'track' | 'mark'>('track')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Cargo[]>([])
  const [error, setError] = useState('')

  async function search() {
    setLoading(true)
    setError('')
    setResults([])

    try {
      const q = encodeURIComponent(query.trim())
      const url =
        mode === 'track'
          ? `/api/v1/customer-cargo/amooksco-logistics/track/${q}`
          : `/api/v1/customer-cargo/amooksco-logistics/my-goods?mark=${q}`

      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) throw new Error(data?.detail || 'Search failed')

      setResults(mode === 'track' ? data.results || [] : data.goods || [])
    } catch (e: any) {
      setError(e.message || 'Unable to search goods')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <Navigation />

      <section className="relative overflow-hidden bg-[#082f63] px-6 py-20 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#082f63] via-[#0f4c9a] to-[#b91c1c] opacity-95" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-yellow-300">
            Amooksco Logistics Customer Portal
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Track your China to Ghana goods
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">
            Search with your AfruHeritage tracking number, supplier tracking number,
            or your Amooksco shipping mark.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setMode('track')}
              className={`rounded-lg px-4 py-2 font-semibold ${mode === 'track' ? 'bg-[#082f63] text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Track Number
            </button>
            <button
              onClick={() => setMode('mark')}
              className={`rounded-lg px-4 py-2 font-semibold ${mode === 'mark' ? 'bg-[#082f63] text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              Shipping Mark / Name
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder={mode === 'track' ? 'Example: AFR-AMO-04A3302D82 or supplier tracking' : 'Example: AGYIRIGO'}
              className="flex-1 rounded-lg border px-4 py-3"
            />
            <button
              onClick={search}
              disabled={loading || !query.trim()}
              className="rounded-lg bg-[#b91c1c] px-6 py-3 font-semibold text-white disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Goods'}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          {results.map((item) => (
            <div key={item.afru_tracking_number} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 md:flex-row">
                <div>
                  <p className="text-sm text-slate-500">Afru Tracking</p>
                  <h2 className="text-xl font-bold text-[#082f63]">{item.afru_tracking_number}</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  {item.status?.replaceAll('_', ' ') || 'Processing'}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-slate-400">Customer / Mark</p>
                  <p className="font-semibold">{item.customer_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Supplier Tracking</p>
                  <p className="font-semibold">{item.external_tracking_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">CBM</p>
                  <p className="font-semibold">{item.cbm ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Description</p>
                  <p className="font-semibold">{item.description || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Receipt Date</p>
                  <p className="font-semibold">{item.receipt_date || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-400">Loading Date</p>
                  <p className="font-semibold">{item.loading_date || '—'}</p>
                </div>
              </div>
            </div>
          ))}

          {!loading && query && results.length === 0 && !error && (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-600">
              No goods found for this search.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Notice = {
  id: string
  notice_type: string
  title: string
  message?: string
  media_url?: string
  media_type?: string
}

type Cargo = {
  afru_tracking_number: string
  external_tracking_number?: string
  customer_name?: string
  description?: string
  cbm?: number
  receipt_date?: string
  loading_date?: string
  status?: string
}

export default function TenantStorePage() {
  const params = useParams()
  const slug = String(params?.slug || '')
  const isAmooksco = slug === 'amooksco-logistics'
  const tenantName = isAmooksco ? 'AMOOKSCO LOGISTICS' : slug.replaceAll('-', ' ').toUpperCase()

  const [mode, setMode] = useState<'track' | 'mark'>('track')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Cargo[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotices()
  }, [slug])

  async function loadNotices() {
    try {
      const res = await fetch(`/api/v1/warehouse-notices/${slug}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setNotices(data.notices || [])
    } catch {}
  }

  async function search() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const q = encodeURIComponent(query.trim())
      const url =
        mode === 'track'
          ? `/api/v1/customer-cargo/${slug}/track/${q}`
          : `/api/v1/customer-cargo/${slug}/my-goods?mark=${q}`

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
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold text-[#082f63]">{tenantName}</h1>
            <p className="text-sm font-semibold text-red-700">China Sea Cargo • Air Cargo • Ghana Delivery</p>
          </div>
          <a href="https://wa.me/233506608337" target="_blank" className="rounded-lg bg-green-600 px-5 py-3 font-bold text-white">
            WhatsApp Support
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#082f63] via-[#0f4c9a] to-[#b91c1c] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-wide text-yellow-300">{tenantName} Customer Portal</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-extrabold md:text-6xl">
            Buy from China. Ship to Ghana. Track everything.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Share your Alibaba, 1688, Taobao, Temu, or Amazon product link. We buy, ship, clear, and help you track your goods online.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          {['Share Product Link', 'We Buy', 'We Ship', 'You Track'].map((x, i) => (
            <div key={x} className="rounded-2xl border bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#082f63] font-bold text-white">{i + 1}</div>
              <p className="font-extrabold text-[#082f63]">{x}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-extrabold text-[#082f63]">Track Your Goods</h3>
          <p className="mt-1 text-slate-600">Search by AfruHeritage tracking number, supplier tracking number, or customer shipping mark.</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => setMode('track')} className={`rounded-lg px-4 py-2 font-bold ${mode === 'track' ? 'bg-[#082f63] text-white' : 'bg-slate-100'}`}>
              Track By Number
            </button>
            <button onClick={() => setMode('mark')} className={`rounded-lg px-4 py-2 font-bold ${mode === 'mark' ? 'bg-[#082f63] text-white' : 'bg-slate-100'}`}>
              Track By Shipping Mark
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder={mode === 'track' ? 'Example: AFR-AMO-04A3302D82 or 8786407' : 'Example: AGYIRIGO, JES, NATTY'}
              className="flex-1 rounded-lg border px-4 py-3"
            />
            <button onClick={search} disabled={loading || !query.trim()} className="rounded-lg bg-red-700 px-6 py-3 font-bold text-white disabled:opacity-50">
              {loading ? 'Searching...' : 'Search Goods'}
            </button>
          </div>

          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>

        <div className="mt-8 space-y-4">
          {results.map((item) => (
            <div key={item.afru_tracking_number} className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Afru Tracking</p>
                  <h3 className="text-2xl font-extrabold text-[#082f63]">{item.afru_tracking_number}</h3>
                </div>
                <span className="h-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                  {item.status?.replaceAll('_', ' ') || 'Processing'}
                </span>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Info label="Customer / Mark" value={item.customer_name} />
                <Info label="Supplier Tracking" value={item.external_tracking_number} />
                <Info label="CBM" value={item.cbm?.toString()} />
                <Info label="Description" value={item.description} />
                <Info label="Receipt Date" value={item.receipt_date} />
                <Info label="Loading Date" value={item.loading_date} />
              </div>
            </div>
          ))}
        </div>

        {notices.length > 0 && (
          <section className="mt-12">
            <h3 className="text-2xl font-extrabold text-[#082f63]">Warehouse Notices & Arrival Updates</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {notices.map((n) => (
                <div key={n.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase text-red-700">{n.notice_type.replaceAll('_', ' ')}</p>
                  <h4 className="mt-2 text-xl font-extrabold text-[#082f63]">{n.title}</h4>
                  <p className="mt-2 text-sm text-slate-600">{n.message}</p>
                  {n.media_url && <img src={n.media_url} alt={n.title} className="mt-4 max-h-80 w-full rounded-xl object-cover" />}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-2xl bg-green-600 p-8 text-white">
          <h3 className="text-3xl font-extrabold">Need help with your goods?</h3>
          <p className="mt-2">Chat with Amooksco Logistics directly on WhatsApp for pickup, tracking, and warehouse support.</p>
          <a href="https://wa.me/233506608337" target="_blank" className="mt-5 inline-block rounded-lg bg-white px-6 py-3 font-bold text-green-700">
            Start WhatsApp Chat
          </a>
        </section>
      </section>

      <footer className="border-t bg-[#082f63] px-6 py-8 text-white">
        <div className="mx-auto max-w-7xl text-sm">
          © 2026 {tenantName}. Powered by AfruHeritage — Pan-African Cross-Border Commerce Platform.
        </div>
      </footer>
    </main>
  )
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="font-semibold">{value || '—'}</p>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { BackButton } from '@/components/back-button'
import { Footer } from '@/components/landing/footer'
import { useAuth } from '@/hooks/useAuth'
import { fleetAPI } from '@/lib/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function formatValue(value: any) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export default function FleetbaseSummaryPage() {
  const { user } = useAuth()
  const canManage = !!(user?.is_tenant_admin || user?.is_superuser)
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', city: '', country: '' })

  async function load() {
    try {
      const data = await fleetAPI.listDrivers()
      setRows(Array.isArray(data?.drivers) ? data.drivers : [])
      setMeta(data?.meta || null)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Failed to load driver data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    setCreateError('')
    try {
      await fleetAPI.createDriver({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        ...(form.city.trim() ? { city: form.city.trim() } : {}),
        ...(form.country.trim() ? { country: form.country.trim().toUpperCase() } : {}),
      })
      setShowCreate(false)
      setForm({ name: '', phone: '', email: '', city: '', country: '' })
      await load()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create driver')
    } finally {
      setCreating(false)
    }
  }

  return (
  <>
    <BackButton fallback="/dashboard/fleetops" />
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-[#063f4f] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Authenticated FleetOps Data
          </p>
          <h1 className="mt-3 text-4xl font-bold">Drivers</h1>
          <p className="mt-4 max-w-2xl text-white/80">Live driver records for your operation.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading && <p className="text-muted-foreground">Loading live driver data...</p>}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Unable to load driver data</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">Live Records</h2>
                <p className="text-sm text-muted-foreground">
                  Total: {meta?.total ?? rows.length}
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="rounded-lg bg-[#063f4f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  + Add Driver
                </button>
              )}
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-muted-foreground">
                No driver records yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">City</th>
                      <th className="px-4 py-3 font-semibold">Country</th>
                      <th className="px-4 py-3 font-semibold">Online</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row?.uuid || row?.id || idx} className="border-t">
                        <td className="px-4 py-3">{formatValue(row?.name)}</td>
                        <td className="px-4 py-3">{formatValue(row?.email)}</td>
                        <td className="px-4 py-3">{formatValue(row?.phone)}</td>
                        <td className="px-4 py-3">{formatValue(row?.city)}</td>
                        <td className="px-4 py-3">{formatValue(row?.country)}</td>
                        <td className="px-4 py-3">{formatValue(row?.online)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Driver full name"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input
                name="phone"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+233..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="driver@company.com"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Accra"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Country Code</label>
                <input
                  name="country"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="GH"
                  maxLength={2}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            {createError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{createError}</p>
            )}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-[#063f4f] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Driver'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </main>
    </>
  )
}

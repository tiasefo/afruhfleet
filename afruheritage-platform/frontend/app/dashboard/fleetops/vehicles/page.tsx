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
  const [form, setForm] = useState({ name: '', plate_number: '', make: '', model: '', year: '' })

  async function load() {
    try {
      const data = await fleetAPI.listVehicles()
      setRows(Array.isArray(data?.vehicles) ? data.vehicles : [])
      setMeta(data?.meta || null)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Failed to load vehicles data')
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
      await fleetAPI.createVehicle({
        name: form.name.trim(),
        plate_number: form.plate_number.trim(),
        ...(form.make.trim() ? { make: form.make.trim() } : {}),
        ...(form.model.trim() ? { model: form.model.trim() } : {}),
        ...(form.year.trim() ? { year: form.year.trim() } : {}),
      })
      setShowCreate(false)
      setForm({ name: '', plate_number: '', make: '', model: '', year: '' })
      await load()
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create vehicle')
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
          <h1 className="mt-3 text-4xl font-bold">Vehicles</h1>
          <p className="mt-4 max-w-2xl text-white/80">Live vehicle records for your operation.</p></div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading && <p className="text-muted-foreground">Loading live vehicles data...</p>}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Unable to load vehicles data</p>
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
                  + Add Vehicle
                </button>
              )}
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-muted-foreground">
                No vehicles records yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Public ID</th>
                      <th className="px-4 py-3 font-semibold">Make</th>
                      <th className="px-4 py-3 font-semibold">Model</th>
                      <th className="px-4 py-3 font-semibold">Plate</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Online</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={row?.uuid || row?.id || idx} className="border-t">
                        <td className="px-4 py-3">{formatValue(row?.name || row?.display_name)}</td>
                        <td className="px-4 py-3">{formatValue(row?.public_id)}</td>
                        <td className="px-4 py-3">{formatValue(row?.make)}</td>
                        <td className="px-4 py-3">{formatValue(row?.model)}</td>
                        <td className="px-4 py-3">{formatValue(row?.plate_number)}</td>
                        <td className="px-4 py-3">{formatValue(row?.status)}</td>
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
            <DialogTitle>Add Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Vehicle Name</label>
              <input
                name="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Accra Delivery Truck 1"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Plate Number</label>
              <input
                name="plate_number"
                required
                value={form.plate_number}
                onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                placeholder="GR-1234-24"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Make</label>
                <input
                  name="make"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  placeholder="MAN"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Model</label>
                <input
                  name="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="TGM"
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Year</label>
                <input
                  name="year"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="2022"
                  maxLength={4}
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
                {creating ? 'Creating...' : 'Create Vehicle'}
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

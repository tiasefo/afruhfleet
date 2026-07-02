'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, Globe2, Ship, Truck } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { BackButton } from '@/components/back-button'
import { BUSINESS_TYPES, DEFAULT_BUSINESS_TYPE } from '@/lib/business-types'

export default function TenantRequestPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    company_name: '',
    business_type: DEFAULT_BUSINESS_TYPE,
    country: 'GH',
    city: '',
    phone: '',
    address: '',
    contact_name: '',
    contact_email: '',
    website: '',
    fleet_size: '',
    vehicle_types: '',
    service_regions: '',
    message: '',
  })

  const selectedType = BUSINESS_TYPES.find((type) => type.value === form.business_type)

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/v1/tenant-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Tenant request failed')
      }

      setMessage('Tenant request submitted. Afruheritage will review and contact you.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit tenant request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <BackButton />
      <Navigation />

      <main className="min-h-screen bg-background">
        <section className="relative overflow-hidden bg-[#063f4f] text-white">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b] to-[#021f2a]" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-8">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
                Tenant Onboarding
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Launch your freight workspace with Afruheritage.
              </h1>

              <p className="mt-5 max-w-2xl text-lg text-white/85">
                Afruheritage supports freight forwarders, freight owners, shippers, customs brokers,
                warehouse operators, and delivery partners from one African freight platform.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <Building2 className="h-6 w-6" />
                  <p className="mt-3 font-semibold">Company Setup</p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <Truck className="h-6 w-6" />
                  <p className="mt-3 font-semibold">Fleet Owner Portal</p>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <Globe2 className="h-6 w-6" />
                  <p className="mt-3 font-semibold">Custom Domain</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <div className="rounded-xl bg-white p-6 text-slate-900">
                <h2 className="text-xl font-bold">Supported account types</h2>

                <div className="mt-5 space-y-4">
                  {BUSINESS_TYPES.slice(0, 4).map((item) => (
                    <div key={item.value} className="flex gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#063f4f]" />
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/customs"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-black/80"
                >
                  Explore Customs Clearance
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">New Tenant Request</h2>
            <p className="mt-2 text-muted-foreground">
              Our team reviews requests and provisions approved tenants.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <label className="font-medium">Company Name</label>
                <input className="mt-2 w-full rounded-lg border p-3" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
              </div>

              <div>
                <label className="font-medium">Business Type</label>
                <select className="mt-2 w-full rounded-lg border p-3" value={form.business_type} onChange={(e) => update('business_type', e.target.value)}>
                  {BUSINESS_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {selectedType && (
                  <p className="mt-2 text-sm text-muted-foreground">{selectedType.description}</p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="font-medium">Country</label>
                  <input className="mt-2 w-full rounded-lg border p-3" value={form.country} onChange={(e) => update('country', e.target.value)} />
                </div>
                <div>
                  <label className="font-medium">City</label>
                  <input className="mt-2 w-full rounded-lg border p-3" value={form.city} onChange={(e) => update('city', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="font-medium">Contact Name</label>
                  <input className="mt-2 w-full rounded-lg border p-3" value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} />
                </div>
                <div>
                  <label className="font-medium">Contact Email</label>
                  <input className="mt-2 w-full rounded-lg border p-3" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="font-medium">Phone</label>
                  <input className="mt-2 w-full rounded-lg border p-3" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </div>
                <div>
                  <label className="font-medium">Website optional</label>
                  <input className="mt-2 w-full rounded-lg border p-3" value={form.website} onChange={(e) => update('website', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="font-medium">Address</label>
                <input className="mt-2 w-full rounded-lg border p-3" value={form.address} onChange={(e) => update('address', e.target.value)} />
              </div>

              {form.business_type === 'freight_owner' && (
                <div className="rounded-xl border bg-slate-50 p-5">
                  <h3 className="font-semibold">Freight Owner / Fleet Owner Details</h3>

                  <div className="mt-4 grid gap-5 md:grid-cols-3">
                    <div>
                      <label className="font-medium">Fleet Size</label>
                      <input className="mt-2 w-full rounded-lg border p-3" value={form.fleet_size} onChange={(e) => update('fleet_size', e.target.value)} placeholder="e.g. 12" />
                    </div>
                    <div>
                      <label className="font-medium">Vehicle Types</label>
                      <input className="mt-2 w-full rounded-lg border p-3" value={form.vehicle_types} onChange={(e) => update('vehicle_types', e.target.value)} placeholder="Trucks, vans, bikes" />
                    </div>
                    <div>
                      <label className="font-medium">Service Regions</label>
                      <input className="mt-2 w-full rounded-lg border p-3" value={form.service_regions} onChange={(e) => update('service_regions', e.target.value)} placeholder="Accra, Tema, Kumasi" />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="font-medium">Message optional</label>
                <textarea className="mt-2 min-h-32 w-full rounded-lg border p-3" value={form.message} onChange={(e) => update('message', e.target.value)} />
              </div>

              {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              {message && <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</p>}

              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-black/80 disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit Tenant Request'}
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

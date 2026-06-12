'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, CheckCircle2, Globe2, Ship, ArrowLeft } from 'lucide-react'

export default function TenantRequestPage() {
  const [form, setForm] = useState({
    company_name: '',
    business_type: 'freight_forwarder',
    country: 'GH',
    city: '',
    phone: '',
    address: '',
    contact_name: '',
    contact_email: '',
    website: '',
    message: '',
  })

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-[#063f4f] hover:text-[#052f3b] transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b] to-[#021f2a]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">
              Tenant Onboarding
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Launch your freight forwarding workspace.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/85">
              Submit your company details and Afruheritage will review, approve, and provision your freight forwarding portal.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <Building2 className="h-6 w-6" />
                <p className="mt-3 font-semibold">Company Setup</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <Ship className="h-6 w-6" />
                <p className="mt-3 font-semibold">Fleetbase Runtime</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <Globe2 className="h-6 w-6" />
                <p className="mt-3 font-semibold">Custom Domain</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="rounded-xl bg-white p-6 text-slate-900">
              <h2 className="text-xl font-bold">What happens after approval?</h2>
              <div className="mt-5 space-y-4">
                {[
                  'Tenant workspace is created',
                  'Freight forwarding portal is provisioned',
                  'Fleetbase operations can be connected',
                  'Billing, KYC, marketplace, and customs modules remain under Afruheritage',
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#063f4f]" />
                    <p className="text-sm text-slate-700">{item}</p>
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

          <form className="mt-8 space-y-5">
            <div>
              <label className="font-medium">Company Name</label>
              <input className="mt-2 w-full rounded-lg border p-3" value={form.company_name} onChange={(e) => update('company_name', e.target.value)} />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="font-medium">Business Type</label>
                <input className="mt-2 w-full rounded-lg border p-3" value={form.business_type} onChange={(e) => update('business_type', e.target.value)} />
              </div>
              <div>
                <label className="font-medium">Country</label>
                <input className="mt-2 w-full rounded-lg border p-3" value={form.country} onChange={(e) => update('country', e.target.value)} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="font-medium">City</label>
                <input className="mt-2 w-full rounded-lg border p-3" value={form.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div>
                <label className="font-medium">Phone</label>
                <input className="mt-2 w-full rounded-lg border p-3" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="font-medium">Address</label>
              <input className="mt-2 w-full rounded-lg border p-3" value={form.address} onChange={(e) => update('address', e.target.value)} />
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

            <div>
              <label className="font-medium">Website optional</label>
              <input className="mt-2 w-full rounded-lg border p-3" value={form.website} onChange={(e) => update('website', e.target.value)} />
            </div>

            <div>
              <label className="font-medium">Message optional</label>
              <textarea className="mt-2 min-h-32 w-full rounded-lg border p-3" value={form.message} onChange={(e) => update('message', e.target.value)} />
            </div>

            <button type="button" className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-black/80">
              Submit Tenant Request
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

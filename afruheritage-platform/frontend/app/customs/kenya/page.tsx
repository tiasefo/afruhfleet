import Link from 'next/link'
import { ArrowRight, Calculator, FileSpreadsheet, ShieldCheck, Truck } from 'lucide-react'

export default function KenyaCustomsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b] to-[#021f2a]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              Kenya Customs Clearance
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Kenya KRA CRSP vehicle duty estimates.
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-white/85">
              Estimate Kenya import duty using KRA CRSP-style valuation, vehicle details, depreciation,
              import duty, VAT, IDF, and Railway Development Levy.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/customs/duty-calculator?country=KE"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f] hover:bg-white/90"
              >
                Open Kenya Duty Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/tenant-request"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Request Clearance Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <FileSpreadsheet className="h-8 w-8 text-[#063f4f]" />
            <h2 className="mt-5 text-xl font-bold">CRSP Valuation</h2>
            <p className="mt-3 text-muted-foreground">
              Uses the imported KRA CRSP reference data to estimate the vehicle customs value.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <Truck className="h-8 w-8 text-[#063f4f]" />
            <h2 className="mt-5 text-xl font-bold">Vehicle Matching</h2>
            <p className="mt-3 text-muted-foreground">
              Matches by make, model, year, engine capacity, and available VIN decode information.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-[#063f4f]" />
            <h2 className="mt-5 text-xl font-bold">Duty Breakdown</h2>
            <p className="mt-3 text-muted-foreground">
              Shows estimated import duty, VAT, IDF, RDL, and total estimated landed cost.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl bg-[#063f4f] p-8 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ready to check Kenya duty?</h2>
              <p className="mt-2 text-white/80">
                Start with VIN or vehicle details, then calculate the Kenya duty estimate.
              </p>
            </div>

            <Link
              href="/customs/duty-calculator?country=KE"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f]"
            >
              <Calculator className="mr-2 h-5 w-5" />
              Calculate Kenya Duty
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

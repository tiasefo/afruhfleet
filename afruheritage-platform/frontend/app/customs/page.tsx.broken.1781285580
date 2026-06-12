import Link from 'next/link'
import { ArrowRight, Calculator, FileCheck2, Ship, ShieldCheck, Truck, Globe2, Play, ArrowLeft } from 'lucide-react'

const features = [
  {
    title: 'Ghana Customs Duty',
    description: 'Estimate vehicle and cargo duties using ICUMS-style valuation logic, VIN decoding, tax base, levies, and BOE-calibrated fallback rules.',
    icon: ShieldCheck,
  },
  {
    title: 'Kenya KRA CRSP',
    description: 'Estimate Kenyan vehicle duties using KRA CRSP-style valuation and country-specific import charges.',
    icon: Globe2,
  },
  {
    title: 'Vehicle VIN Lookup',
    description: 'Start with a VIN, decode vehicle details, then continue into the customs duty workflow.',
    icon: Truck,
  },
  {
    title: 'Cargo & HS Code Duties',
    description: 'Estimate cargo duties with CIF, HS code, quantity, weight, and customs charge breakdown.',
    icon: FileCheck2,
  },
]

const steps = [
  'Enter VIN or cargo details',
  'Generate customs value / tax base',
  'Review duty, levies, and fees',
  'Create shipment or clearance request',
]

export default function CustomsPage() {
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
        {/* Customs clearance background video */}
        <div className="absolute inset-0 opacity-30">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />
            <source src="/assets/videos/behistockphoto-531834958-640_adpp_is.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b] to-[#021f2a]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Customs Clearance
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Customs duty estimates for vehicles and cargo.
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/85">
              Afruheritage helps freight forwarders and importers estimate duty for Ghana and Kenya,
              using VIN lookup, customs value generation, tax breakdowns, and country-specific clearance logic.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/customs/duty-calculator"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f] hover:bg-white/90"
              >
                Calculate Duty
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/tenant-request"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Request Customs Support
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-xl bg-white p-6 text-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#063f4f] text-white">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Live Customs Tool</p>
                  <h2 className="text-xl font-bold">Duty Calculator</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500">Vehicle Workflow</p>
                  <p className="font-semibold">VIN → Value → Duty Payable</p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500">Cargo Workflow</p>
                  <p className="font-semibold">HS Code → CIF → Tax Breakdown</p>
                </div>

                <Link
                  href="/customs/duty-calculator"
                  className="flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-black/80"
                >
                  Open Calculator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">Built for customs clearance operations</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with duty estimation, then connect the result to shipment creation, documentation,
            broker workflow, and customer clearance support.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Seaport/Cargo Operations Video Section */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="absolute inset-0 opacity-40">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/assets/videos/istockphoto-945121252-640_adpp_is.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Ship className="h-4 w-4" />
              Seaport & Vessel Operations
            </div>

            <h2 className="mt-6 text-4xl font-bold">See customs clearance in action at major ports.</h2>

            <p className="mt-4 text-lg text-white/80">
              Watch how our platform streamlines cargo inspection, documentation verification,
              and duty payment processing at seaports and border crossings.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/customs/duty-calculator"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-white/90"
              >
                Try Customs Estimation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="inline-flex rounded-full bg-[#063f4f]/10 px-4 py-2 text-sm font-semibold text-[#063f4f]">
              Clearance Flow
            </div>
            <h2 className="mt-5 text-3xl font-bold">From estimate to shipment workflow.</h2>
            <p className="mt-4 text-muted-foreground">
              The customs module is designed to become part of the larger Afruheritage freight platform:
              quote, document, clear, ship, and track from one place.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href="/customs/duty-calculator"
                className="inline-flex items-center rounded-lg bg-[#063f4f] px-5 py-3 font-semibold text-white hover:bg-[#052f3b]"
              >
                Try Duty Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/support"
                className="inline-flex items-center rounded-lg border px-5 py-3 font-semibold hover:bg-white"
              >
                Talk to Support
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="space-y-5">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#063f4f] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{step}</p>
                    <p className="text-sm text-muted-foreground">
                      {index === 0 && 'Use VIN for vehicles or CIF/HS code for cargo.'}
                      {index === 1 && 'Apply Ghana or Kenya valuation logic before tax calculation.'}
                      {index === 2 && 'Show duty payable, levies, and supporting charge breakdown.'}
                      {index === 3 && 'Continue into Afruheritage freight forwarding workflows.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-2xl bg-[#063f4f] p-8 text-white lg:flex lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Ship className="h-7 w-7" />
              <h2 className="text-2xl font-bold">Ready to estimate customs duty?</h2>
            </div>
            <p className="mt-3 max-w-2xl text-white/80">
              Open the calculator and run a Ghana or Kenya vehicle/cargo duty estimate.
            </p>
          </div>

          <Link
            href="/customs/duty-calculator"
            className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f] hover:bg-white/90 lg:mt-0"
          >
            Calculate Duty
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white">
              Customs Clearance
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Customs duty estimates for vehicles and cargo.
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-white/85">
              Afruheritage helps freight forwarders and importers estimate duty for Ghana and Kenya,
              using VIN lookup, customs value generation, tax breakdowns, and country-specific clearance logic.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/customs/duty-calculator"
                className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f] hover:bg-white/90"
              >
                Calculate Duty
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/tenant-request"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10"
              >
                Request Customs Support
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-xl bg-white p-6 text-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#063f4f] text-white">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Live Customs Tool</p>
                  <h2 className="text-xl font-bold">Duty Calculator</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500">Vehicle Workflow</p>
                  <p className="font-semibold">VIN → Value → Duty Payable</p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-slate-500">Cargo Workflow</p>
                  <p className="font-semibold">HS Code → CIF → Tax Breakdown</p>
                </div>

                <Link
                  href="/customs/duty-calculator"
                  className="flex w-full items-center justify-center rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-black/80"
                >
                  Open Calculator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight">Built for customs clearance operations</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start with duty estimation, then connect the result to shipment creation, documentation,
            broker workflow, and customer clearance support.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="inline-flex rounded-full bg-[#063f4f]/10 px-4 py-2 text-sm font-semibold text-[#063f4f]">
              Clearance Flow
            </div>
            <h2 className="mt-5 text-3xl font-bold">From estimate to shipment workflow.</h2>
            <p className="mt-4 text-muted-foreground">
              The customs module is designed to become part of the larger Afruheritage freight platform:
              quote, document, clear, ship, and track from one place.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href="/customs/duty-calculator"
                className="inline-flex items-center rounded-lg bg-[#063f4f] px-5 py-3 font-semibold text-white hover:bg-[#052f3b]"
              >
                Try Duty Calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/support"
                className="inline-flex items-center rounded-lg border px-5 py-3 font-semibold hover:bg-white"
              >
                Talk to Support
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="space-y-5">
              {steps.map((step, index) => (
                <div key={step} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#063f4f] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{step}</p>
                    <p className="text-sm text-muted-foreground">
                      {index === 0 && 'Use VIN for vehicles or CIF/HS code for cargo.'}
                      {index === 1 && 'Apply Ghana or Kenya valuation logic before tax calculation.'}
                      {index === 2 && 'Show duty payable, levies, and supporting charge breakdown.'}
                      {index === 3 && 'Continue into Afruheritage freight forwarding workflows.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-2xl bg-[#063f4f] p-8 text-white lg:flex lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Ship className="h-7 w-7" />
              <h2 className="text-2xl font-bold">Ready to estimate customs duty?</h2>
            </div>
            <p className="mt-3 max-w-2xl text-white/80">
              Open the calculator and run a Ghana or Kenya vehicle/cargo duty estimate.
            </p>
          </div>

          <Link
            href="/customs/duty-calculator"
            className="mt-6 inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f] hover:bg-white/90 lg:mt-0"
          >
            Calculate Duty
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  )
}

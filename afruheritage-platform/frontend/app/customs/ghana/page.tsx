import Link from 'next/link'
import { BackButton } from '@/components/back-button'
import { ArrowRight, Globe2, Ship, Truck, ShieldCheck } from 'lucide-react'

export default function GhanaCustomsPage() {
  return (
  <>
    <BackButton />
    <main className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 opacity-25">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover">
            <source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />
            <source src="/assets/videos/behistockphoto-531834958-640_adpp_is.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b]/95 to-[#021f2a]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4" />
              ICUMS-style duty intelligence
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              AfruHeritage Ghana Customs & Freight Services
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-white/85">
              Estimate Ghana vehicle and cargo duty, then connect the result to customs clearance and freight forwarding support.
            </p>

            <p className="mt-4 max-w-3xl text-white/75">
              AfruHeritage means African Union Heritage — connecting African freight, ports,
              customs clearance, and trade corridors through one trusted logistics platform.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/customs/duty-calculator?country=GH" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f] hover:bg-white/90">
                Calculate Duty
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/tenant-request" className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">
                Request Freight Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <Ship className="h-8 w-8 text-[#063f4f]" />
            <h2 className="mt-5 text-xl font-bold">Ocean & Air Freight</h2>
            <p className="mt-3 text-muted-foreground">Coordinate import/export movement through approved freight and logistics workflows.</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-[#063f4f]" />
            <h2 className="mt-5 text-xl font-bold">Customs Clearance</h2>
            <p className="mt-3 text-muted-foreground">Prepare documentation, duty estimates, broker workflows, and clearance support.</p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <Truck className="h-8 w-8 text-[#063f4f]" />
            <h2 className="mt-5 text-xl font-bold">Fleet & Delivery</h2>
            <p className="mt-3 text-muted-foreground">Connect clearance outcomes to fleet movement, warehousing, dispatch, and final delivery.</p>
          </div>
        </div>
      </section>
    </main>
    </>
  )
}

import Link from 'next/link'
import { ArrowRight, Globe2, Plane, Ship, Truck } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function LocationPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 z-0 bg-slate-900">
          <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover opacity-75">
            <source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-[#021f2a]/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#021f2a] via-[#063f4f]/35 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-28 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4" />
              Fleet and inland distribution
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              AfruHeritage Kenya
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-white/85">
              Kenya logistics corridor for East Africa freight, customs, and fleet distribution.
            </p>

            <p className="mt-4 max-w-3xl text-white/75">
              AfruHeritage means African Union Heritage — a connected logistics network for customs,
              freight, port movement, warehousing, and cross-border trade.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/customs" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f]">
                Customs & Duty Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link href="https://wa.me/233506608337" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">
                WhatsApp Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Card icon="ship" title="Ocean Freight" text="Port-to-port and port-to-door freight support." />
          <Card icon="plane" title="Air Cargo" text="Fast cargo movement and import/export coordination." />
          <Card icon="truck" title="Fleet Delivery" text="Last-mile delivery, trucking, and distribution support." />
        </div>
      </section>

      <Footer />
    </main>
  )
}

function Card({ icon, title, text }: { icon: 'ship' | 'plane' | 'truck'; title: string; text: string }) {
  const Icon = icon === 'ship' ? Ship : icon === 'plane' ? Plane : Truck
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <Icon className="h-8 w-8 text-[#063f4f]" />
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{text}</p>
    </div>
  )
}

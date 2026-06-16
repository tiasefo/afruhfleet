import Link from 'next/link'
import { ArrowRight, MapPinned, RadioTower, Route, Truck } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function LiveMapPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 opacity-25">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover">
            <source src="/assets/videos/Vans-2220419522-640_adpp_is.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b]/95 to-[#021f2a]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              Live Fleet Map
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              See how live tracking works before launching your tenant workspace.
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-white/85">
              The AfruHeritage Live Map helps freight owners and logistics companies visualize
              vehicles, trips, delivery movement, dispatch status, and exceptions.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register?next=/fleetbase/live-map" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f]">
                Use Live Tracking
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link href="/tenant-request" className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">
                Request Tenant Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-4">
          <Feature icon={<MapPinned />} title="Map View" text="Visualize vehicles and active trips." />
          <Feature icon={<Truck />} title="Fleet Status" text="Monitor trucks, vans, and delivery assets." />
          <Feature icon={<Route />} title="Route Movement" text="Understand trip progress and delivery movement." />
          <Feature icon={<RadioTower />} title="Live Signals" text="Prepare for GPS and dispatch intelligence." />
        </div>

        <div className="mt-12 rounded-2xl bg-[#063f4f] p-8 text-white">
          <h2 className="text-2xl font-bold">This is a public product information page.</h2>
          <p className="mt-3 text-white/80">
            The real live map is available after registration, tenant approval, and subscription activation.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-[#063f4f]">{icon}</div>
      <h2 className="mt-5 text-lg font-bold">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

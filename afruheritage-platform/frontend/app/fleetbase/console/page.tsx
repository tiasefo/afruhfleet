import Link from 'next/link'
import { ArrowRight, BarChart3, Building2, ExternalLink, Lock, Route, Truck } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function FleetbaseConsolePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 opacity-25">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover">
            <source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b]/95 to-[#021f2a]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              FleetOps Console
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Learn how AfruHeritage FleetOps helps logistics companies manage operations.
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-white/85">
              FleetOps is the AfruHeritage operations workspace for freight owners, forwarders,
              vendors, shippers, and fleet-based logistics companies. Explore the feature publicly,
              then register when you are ready to launch your own workspace.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/register?next=/fleetbase/console" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f]">
                Launch My FleetOps Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link href="/tenant-request" className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10">
                Request Tenant Setup
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <Feature icon={<Truck />} title="Fleet Management" text="Manage trucks, delivery vans, drivers, trips, dispatch records, and active movement." />
          <Feature icon={<Route />} title="Trip Operations" text="Plan routes, track shipments, assign vehicles, and connect freight movement to customer service." />
          <Feature icon={<BarChart3 />} title="Operations Intelligence" text="View utilization, delivery status, exceptions, delays, and customer-facing logistics metrics." />
        </div>

        <div className="mt-12 rounded-2xl border bg-white p-8 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold">How access works</h2>
              <p className="mt-4 text-muted-foreground">
                Anyone can learn about FleetOps. To use the real console, a company must register,
                request a tenant, activate a plan, and receive an approved workspace.
              </p>
            </div>

            <div className="space-y-3">
              <Step icon={<Lock />} text="Register or login" />
              <Step icon={<Building2 />} text="Request tenant workspace" />
              <Step icon={<ExternalLink />} text="Launch FleetOps after approval" />
            </div>
          </div>
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
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-3 text-muted-foreground">{text}</p>
    </div>
  )
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-4">
      <div className="text-[#063f4f]">{icon}</div>
      <p className="font-semibold">{text}</p>
    </div>
  )
}

import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { BackButton } from '@/components/back-button'
import { Car, ClipboardList, Route, Truck } from 'lucide-react'

const items = [
  { title: 'Drivers', href: '/dashboard/fleetops/drivers', icon: Truck },
  { title: 'Vehicles', href: '/dashboard/fleetops/vehicles', icon: Car },
  { title: 'Fleets', href: '/dashboard/fleetops/fleets', icon: Route },
  { title: 'Orders', href: '/dashboard/fleetops/orders', icon: ClipboardList },
]

export default function FleetOpsDashboardPage() {
  return (
  <>
    <BackButton />
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-[#063f4f] px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Authenticated FleetOps
          </p>
          <h1 className="mt-3 text-4xl font-bold">Fleet Operations</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Live view of your drivers, vehicles, fleets, and orders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <Icon className="h-8 w-8 text-[#063f4f]" />
                <h2 className="mt-5 text-xl font-bold">{item.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  View live {item.title.toLowerCase()}.
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      <Footer />
    </main>
    </>
  )
}

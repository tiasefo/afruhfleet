import Link from 'next/link'
import { ArrowRight, Globe2, Plane, Ship, Truck } from 'lucide-react'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

const locations = [
  { code: 'GH', name: 'Ghana', href: '/customs/ghana', status: 'Customs calculator enabled' },
  { code: 'KE', name: 'Kenya', href: '/customs/kenya', status: 'Customs calculator enabled' },
  { code: 'NG', name: 'Nigeria', href: '/customs/nigeria', status: 'Freight support available' },
  { code: 'ZA', name: 'South Africa', href: '/customs/south-africa', status: 'Freight support available' },
  { code: 'UG', name: 'Uganda', href: '/customs/uganda', status: 'Freight support available' },
  { code: 'TZ', name: 'Tanzania', href: '/customs/tanzania', status: 'Freight support available' },
  { code: 'RW', name: 'Rwanda', href: '/customs/rwanda', status: 'Freight support available' },
]

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="relative overflow-hidden bg-[#063f4f] text-white">
        <div className="absolute inset-0 opacity-25">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover">
            <source src="/assets/videos/airport-footage-panama-city-panama-ground-crew-unloading-cargo-shipment-from-airplane-on.webm" type="video/webm" />
            <source src="/assets/videos/Truck20004964.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#063f4f] via-[#07586b]/95 to-[#021f2a]" />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <Globe2 className="h-4 w-4" />
              Locations
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              AfruHeritage trade corridors across Africa.
            </h1>

            <p className="mt-6 max-w-3xl text-lg text-white/85">
              Explore country pages for customs clearance, freight support, cargo movement,
              fleet operations, and cross-border logistics services.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/customs" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f]">
                Explore Customs Services
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
          <Service icon={<Ship />} title="Ocean Freight" />
          <Service icon={<Plane />} title="Air Cargo" />
          <Service icon={<Truck />} title="Fleet & Last-Mile" />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Link
              key={location.code}
              href={location.href}
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-sm font-bold text-[#063f4f]">{location.code}</div>
              <h2 className="mt-2 text-2xl font-bold">{location.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{location.status}</p>
              <div className="mt-5 inline-flex items-center font-semibold text-[#063f4f]">
                View Location
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}

function Service({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="text-[#063f4f]">{icon}</div>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-3 text-muted-foreground">
        Country-specific support for freight, customs, documentation, and delivery operations.
      </p>
    </div>
  )
}

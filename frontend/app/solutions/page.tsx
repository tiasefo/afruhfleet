import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

const links = [
  { title: 'Shipment Tracking', href: '/track', description: 'Live visibility for every leg of the journey.' },
  { title: 'Freight Management', href: '/solutions/freight-management', description: 'Manage bookings, milestones, and partner updates.' },
  { title: 'Customs Clearance', href: '/solutions/customs-clearance', description: 'Digitize customs workflows and compliance records.' },
  { title: 'Warehouse Services', href: '/solutions/warehouse-services', description: 'Coordinate inventory, receiving, and dispatch.' },
]

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Solutions</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Afruheritage modules built for real freight operations, from booking to final-mile tracking.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {links.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow">
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

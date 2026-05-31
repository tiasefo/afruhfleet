import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

const links = [
  { title: 'AI Assistant', href: '/platform/ai-assistant', description: 'Automate repetitive support and logistics workflows.' },
  { title: 'Document Management', href: '/platform/document-management', description: 'Centralized waybill, invoice, and customs document handling.' },
  { title: 'API Integration', href: '/platform/api-integration', description: 'Connect tenant operations to external systems and data feeds.' },
  { title: 'Real-time Tracking', href: '/track', description: 'Shipment and movement updates for customers and teams.' },
]

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Platform</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Core SaaS capabilities that power operations, customer experiences, and partner collaboration.
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

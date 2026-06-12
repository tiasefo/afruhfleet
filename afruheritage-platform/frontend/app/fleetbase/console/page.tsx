import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function FleetbaseConsolePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-50">
        <section className="bg-[#063f4f] px-6 py-24 text-white">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-4xl font-bold">FleetOps Console</h1>
            <p className="mt-4 max-w-2xl text-white/80">
              FleetOps Console is available to approved tenants, freight owners, vendors, and logistics companies.
            </p>
            <div className="mt-8 flex gap-4">
              <Link href="/register?next=/fleetbase/console" className="rounded-lg bg-white px-6 py-3 font-semibold text-[#063f4f]">
                Register to Access
              </Link>
              <Link href="/login?next=/fleetbase/console" className="rounded-lg border border-white/30 px-6 py-3 font-semibold">
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

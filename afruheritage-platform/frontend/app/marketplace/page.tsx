import Link from "next/link"
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  Package,
  Clock,
  CheckCircle2,
  Circle,
  Layers,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { MarketplaceSection } from "@/components/marketplace-section"
import { VendorMarketplace } from "@/components/vendor-marketplace"

const navLinks = [
  { label: "Solutions", href: "/#templates" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Platform", href: "/#how" },
  { label: "For Vendors", href: "/#how" },
  { label: "Support", href: "/#cta" },
  { label: "Pricing", href: "/#cta" },
]

const stats = [
  { label: "Active vendors", value: "3,420" },
  { label: "Open loads", value: "1,186" },
  { label: "Avg. bid time", value: "4m" },
  { label: "On-time rate", value: "98.5%" },
]

const bookings = [
  {
    id: "AFR-2026-004182",
    route: "Accra → Kumasi",
    vendor: "Kwame Logistics",
    price: "GHS 150",
    status: "In transit",
    state: "active" as const,
  },
  {
    id: "AFR-2026-004176",
    route: "Tema → Takoradi",
    vendor: "Volta Freight Co.",
    price: "GHS 420",
    status: "Awaiting pickup",
    state: "pending" as const,
  },
  {
    id: "AFR-2026-004151",
    route: "Accra → Ho",
    vendor: "Esi Express",
    price: "GHS 90",
    status: "Delivered",
    state: "done" as const,
  },
]

const statusStyles = {
  active: "bg-primary/10 text-primary",
  pending: "bg-accent/15 text-accent-foreground",
  done: "bg-secondary text-muted-foreground",
}

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-heading text-lg font-bold">A</span>
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">Afruheritage</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`transition-colors hover:text-foreground ${
                  l.href === "/marketplace" ? "text-foreground" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button className="hidden rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground sm:block">
              Sign In
            </button>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Page hero */}
      <section className="border-b border-border bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to platform
          </Link>
          <h1 className="mt-4 max-w-3xl text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            The Afruheritage <span className="text-primary">logistics marketplace</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            One load board connecting shippers with every kind of verified carrier — trucks, buses,
            ride-hail cars, and motorbikes — through live bidding, counter-offers, and real-time GPS.
          </p>

          {/* Search bar */}
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg bg-background px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vendors, routes, or vehicle types"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              <SlidersHorizontal className="size-4" />
              Filters
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Search
            </button>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <p className="font-heading text-2xl font-bold tracking-tight">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vendor marketplace (interactive — opens booking form) */}
      <VendorMarketplace />

      {/* How bidding works + live shipment (shared section) */}
      <MarketplaceSection />

      {/* Booking management */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Booking management
          </span>
          <h2 className="max-w-xl text-balance font-heading text-3xl font-bold tracking-tight">
            Track every request from dispatch to delivery
          </h2>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[1.4fr_1.4fr_1.4fr_0.8fr_1fr] gap-4 border-b border-border bg-secondary/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
            <span>Tracking #</span>
            <span>Route</span>
            <span>Vendor</span>
            <span>Price</span>
            <span>Status</span>
          </div>
          {bookings.map((b) => (
            <div
              key={b.id}
              className="grid grid-cols-1 gap-2 border-b border-border px-5 py-4 text-sm last:border-0 sm:grid-cols-[1.4fr_1.4fr_1.4fr_0.8fr_1fr] sm:items-center sm:gap-4"
            >
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                <Package className="size-3.5" />
                {b.id}
              </span>
              <span className="font-medium">{b.route}</span>
              <span className="text-muted-foreground">{b.vendor}</span>
              <span className="font-heading font-bold">{b.price}</span>
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[b.state]}`}
              >
                {b.state === "active" && <Clock className="size-3.5" />}
                {b.state === "pending" && <Circle className="size-3.5" />}
                {b.state === "done" && <CheckCircle2 className="size-3.5" />}
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to move freight on the marketplace?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Post a load, compare bids from verified carriers, and track delivery in real time.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
              Post a shipment
            </button>
            <button className="rounded-md border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10">
              Become a vendor
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Layers className="size-3.5" />
            </span>
            <span>Afruheritage</span>
          </Link>
          <p>Marketplace preview. Demo content.</p>
        </div>
      </footer>
    </main>
  )
}

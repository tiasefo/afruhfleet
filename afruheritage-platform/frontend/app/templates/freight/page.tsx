import Image from "next/image"
import {
  Ship,
  Plane,
  Truck,
  Search,
  Globe2,
  FileCheck2,
  PackageCheck,
  ArrowRight,
  Anchor,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const modes = [
  { icon: Ship, title: "Ocean Freight", body: "FCL & LCL across 600+ ports with competitive sailing schedules." },
  { icon: Plane, title: "Air Freight", body: "Express and economy air cargo with door-to-door visibility." },
  { icon: Truck, title: "Road & Rail", body: "Cross-border trucking and intermodal rail for inland legs." },
  { icon: FileCheck2, title: "Customs Brokerage", body: "Compliant clearance and documentation in every jurisdiction." },
]

const steps = [
  { n: "01", title: "Get a quote", body: "Compare rates across carriers in seconds." },
  { n: "02", title: "Book & document", body: "Digital bill of lading and customs paperwork." },
  { n: "03", title: "Track live", body: "Milestone updates from origin to destination." },
]

export default function FreightTemplate() {
  return (
    <div className="theme-freight">
      <TemplatePreviewBar name="Meridian Freight" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Anchor className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Meridian Freight</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
              <a href="#services" className="hover:text-foreground">Services</a>
              <a href="#track" className="hover:text-foreground">Track</a>
              <a href="#how" className="hover:text-foreground">How it works</a>
              <a href="#network" className="hover:text-foreground">Network</a>
            </nav>
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
              Get a quote
            </button>
          </div>
        </header>

        {/* Hero with quote panel */}
        <section className="relative">
          <div className="relative min-h-[560px] w-full overflow-hidden">
            <Image src="/images/freight-hero.png" alt="Container ship at port" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/65 to-primary/85" />
            <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-center px-4 py-16 sm:px-6">
              <div className="grid w-full items-center gap-10 lg:grid-cols-2">
                <div className="text-primary-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold text-accent-foreground">
                    Global freight forwarding
                  </span>
                  <h1 className="mt-5 text-balance text-4xl font-bold leading-tight sm:text-5xl">
                    Move cargo across the world, without the friction.
                  </h1>
                  <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-primary-foreground/80">
                    Instant rates, digital documentation, and end-to-end tracking for every shipment.
                  </p>
                </div>

                {/* Quote card */}
                <div className="rounded-2xl border border-white/15 bg-card p-6 text-card-foreground shadow-2xl">
                  <h2 className="text-lg font-semibold">Instant freight quote</h2>
                  <div className="mt-4 grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Origin
                        <input defaultValue="Shanghai, CN" className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Destination
                        <input defaultValue="Rotterdam, NL" className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring" />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Mode
                        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring">
                          <option>Ocean FCL</option>
                          <option>Ocean LCL</option>
                          <option>Air</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                        Container
                        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring">
                          <option>40&apos; HC</option>
                          <option>20&apos; Standard</option>
                          <option>Reefer</option>
                        </select>
                      </label>
                    </div>
                    <button className="mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                      <Search className="size-4" /> Search rates
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Track bar */}
        <section id="track" className="border-b border-border bg-secondary/50">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-2 font-semibold">
              <PackageCheck className="size-5 text-accent-foreground" /> Track a shipment
            </div>
            <div className="flex flex-1 gap-2">
              <input placeholder="Enter B/L or container number (e.g. MRSU1234567)" className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-ring" />
              <button className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Track
              </button>
            </div>
          </div>
        </section>

        {/* Modes */}
        <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent-foreground">Services</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Freight for every lane</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {modes.map((m) => (
              <div key={m.title} className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <m.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                <a href="#" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ArrowRight className="size-4" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="bg-primary">
          <div className="mx-auto max-w-7xl px-4 py-20 text-primary-foreground sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ship in three simple steps</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="border-t-2 border-accent pt-5">
                  <span className="text-sm font-bold text-accent">{s.n}</span>
                  <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-primary-foreground/75">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Network */}
        <section id="network" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Globe2 className="size-10 text-primary" />
              <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                A network that reaches everywhere you trade.
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                With agents in 120 countries and direct carrier contracts, Meridian keeps your supply chain resilient.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                ["600+", "Ports served"],
                ["120", "Countries"],
                ["35k", "Shipments / yr"],
                ["98%", "On-schedule"],
                ["24/7", "Visibility"],
                ["15", "Carrier partners"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-border bg-card p-5 text-center">
                  <p className="text-2xl font-bold text-primary">{v}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Anchor className="size-5 text-primary" /> Meridian Freight
            </div>
            <p>&copy; {new Date().getFullYear()} Meridian Freight. Demo storefront.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

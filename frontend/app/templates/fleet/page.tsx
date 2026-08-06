import Image from "next/image"
import {
  Truck,
  Route,
  ShieldCheck,
  Gauge,
  MapPin,
  Phone,
  ArrowRight,
  Clock,
  Wrench,
  Bus,
  CarTaxiFront,
  Bike,
  Caravan,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const services = [
  { icon: Truck, title: "Vehicle Leasing", body: "Flexible short and long-term leases across vans, trucks, and trailers." },
  { icon: Route, title: "Route Optimization", body: "AI-assisted dispatch that cuts fuel costs and delivery times." },
  { icon: Wrench, title: "Maintenance Plans", body: "24/7 service network keeping every vehicle road-ready." },
  { icon: ShieldCheck, title: "Fleet Insurance", body: "Comprehensive coverage tailored to your fleet size and routes." },
]

const categories = [
  { icon: CarTaxiFront, label: "Ride-hail cars" },
  { icon: Bus, label: "Buses & coaches" },
  { icon: Bike, label: "Motorcycles" },
  { icon: Bike, label: "Bicycles" },
  { icon: Truck, label: "Vans & trucks" },
  { icon: Caravan, label: "Trailers" },
]

const vehicles = [
  { name: "Ride-Hail Sedan", img: "/vehicles/ridehail-car.png", spec: "4 seats · Hybrid · App dispatch", rate: "$0.45/km" },
  { name: "City Coach B40", img: "/vehicles/coach-bus.png", spec: "40 seats · AC · Live tracking", rate: "$240/day" },
  { name: "Delivery Motorcycle", img: "/vehicles/delivery-motorcycle.png", spec: "150cc · Top box · GPS", rate: "$32/day" },
  { name: "Cargo eBike", img: "/vehicles/cargo-ebike.png", spec: "Electric · 80kg load · Eco", rate: "$18/day" },
  { name: "Cargo Van X1", img: "/vehicles/cargo-van.png", spec: "3.5t · Diesel · GPS", rate: "$89/day" },
  { name: "Semi-Trailer H4", img: "/vehicles/semi-trailer.png", spec: "40t · Long Haul · ADR", rate: "$320/day" },
]

const stats = [
  { value: "12,400+", label: "Vehicles managed" },
  { value: "99.2%", label: "On-time dispatch" },
  { value: "48", label: "Service depots" },
  { value: "24/7", label: "Support" },
]

export default function FleetTemplate() {
  return (
    <div className="theme-fleet">
      <TemplatePreviewBar name="Vanta Fleet" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Truck className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Vanta Fleet</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
              <a href="#fleet" className="hover:text-foreground">Fleet</a>
              <a href="#services" className="hover:text-foreground">Services</a>
              <a href="#coverage" className="hover:text-foreground">Coverage</a>
              <a href="#contact" className="hover:text-foreground">Contact</a>
            </nav>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-sm font-medium text-foreground sm:flex">
                <Phone className="size-4 text-accent" />
                1-800-VANTA
              </span>
              <button className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Get a quote
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="relative h-[520px] w-full overflow-hidden">
            <Image src="/images/fleet-hero.png" alt="Fleet of trucks on a highway" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="max-w-xl text-primary-foreground">
                  <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    Enterprise fleet solutions
                  </span>
                  <h1 className="mt-5 text-balance text-4xl font-bold leading-tight sm:text-5xl">
                    Keep your entire fleet moving, profitably.
                  </h1>
                  <p className="mt-5 text-pretty text-lg leading-relaxed text-primary-foreground/80">
                    Lease, dispatch, track, and maintain commercial vehicles from one platform built for logistics teams.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                      Browse vehicles <ArrowRight className="size-4" />
                    </button>
                    <button className="rounded-md border border-primary-foreground/30 bg-primary-foreground/10 px-5 py-3 text-sm font-semibold text-primary-foreground backdrop-blur transition-colors hover:bg-primary-foreground/20">
                      Talk to dispatch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-primary sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">What we do</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything your fleet needs</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => (
              <div key={s.title} className="rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-lg">
                <span className="flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vehicles */}
        <section id="fleet" className="bg-secondary/50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Every type of vehicle, one platform</h2>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  From ride-hail cars and buses to motorcycles, bicycles, vans, and trailers — no operator is left out.
                </p>
              </div>
              <a href="#" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                View full catalog <ArrowRight className="size-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {categories.map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  <c.icon className="size-4 text-accent" />
                  {c.label}
                </span>
              ))}
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {vehicles.map((v) => (
                <div key={v.name} className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                  <div className="relative h-44 w-full overflow-hidden bg-primary/5">
                    <Image
                      src={v.img || "/placeholder.svg"}
                      alt={v.name}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{v.name}</h3>
                      <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        Available
                      </span>
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Gauge className="size-4" /> {v.spec}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <span className="text-xl font-bold text-primary">{v.rate}</span>
                      <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                        Reserve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coverage CTA */}
        <section id="coverage" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-10 rounded-2xl bg-primary p-8 text-primary-foreground sm:p-12 lg:grid-cols-2">
            <div>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                Nationwide coverage, local depots.
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-primary-foreground/80">
                With 48 service depots and round-the-clock roadside support, your vehicles are never far from help.
              </p>
              <div className="mt-6 flex flex-wrap gap-6">
                <span className="inline-flex items-center gap-2 text-sm"><MapPin className="size-4 text-accent" /> 48 depots</span>
                <span className="inline-flex items-center gap-2 text-sm"><Clock className="size-4 text-accent" /> 24/7 roadside</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-primary-foreground/10 p-6 backdrop-blur">
              <h3 className="font-semibold">Request a fleet assessment</h3>
              <input placeholder="Company name" className="rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none focus:border-accent" />
              <input placeholder="Fleet size" className="rounded-md border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 outline-none focus:border-accent" />
              <button className="mt-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Request assessment
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Truck className="size-5 text-primary" /> Vanta Fleet
            </div>
            <p>&copy; {new Date().getFullYear()} Vanta Fleet. Demo storefront.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

import { Bus, CarTaxiFront, Bike, Truck, Caravan, Wrench, ShieldCheck, Route, Gauge } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const services = [
  { icon: Route, title: "Route Optimization", desc: "AI-assisted dispatch that cuts fuel costs and improves on-time performance." },
  { icon: Wrench, title: "Maintenance Plans", desc: "24/7 service network keeping every vehicle road-ready and compliant." },
  { icon: ShieldCheck, title: "Fleet Insurance", desc: "Comprehensive coverage tailored to your fleet size and route profiles." },
  { icon: Gauge, title: "Performance Analytics", desc: "Real-time dashboards for fuel efficiency, utilization, and driver behavior." },
]

const vehicleCategories = [
  { icon: Bus, label: "Buses & Coaches", desc: "40-60 seats, AC, live tracking" },
  { icon: CarTaxiFront, label: "Ride-hail Cars", desc: "4 seats, app dispatch" },
  { icon: Truck, label: "Vans & Trucks", desc: "Cargo, 3.5t to 40t" },
  { icon: Bike, label: "Motorcycles", desc: "Delivery, GPS tracked" },
  { icon: Caravan, label: "Trailers", desc: "Long haul, ADR certified" },
  { icon: Wrench, label: "Service Vehicles", desc: "Maintenance & support" },
]

export function Fleet({ theme }: { theme: TenantPublicTheme }) {
  return (
    <>
      <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
            Services
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Everything your fleet needs</h2>
          <p className="mt-3 text-muted-foreground">
            From dispatch and routing to maintenance and insurance — manage every aspect of your fleet operations.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span
                className="flex size-12 items-center justify-center rounded-lg text-white"
                style={{ background: theme.primaryColor }}
              >
                <s.icon className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="fleet" className="border-t border-border" style={{ background: `${theme.primaryColor}05` }}>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
              Fleet
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Every type of vehicle, one platform</h2>
            <p className="mt-3 text-muted-foreground">
              From buses and coaches to ride-hail cars, motorcycles, and trailers — no operator is left out.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicleCategories.map((cat) => (
              <div
                key={cat.label}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${theme.primaryColor}15`, color: theme.primaryColor }}
                >
                  <cat.icon className="size-6" />
                </span>
                <div>
                  <h3 className="text-base font-semibold">{cat.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

import { Ship, Plane, Truck, FileCheck2, Warehouse, Package } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const defaultServices = [
  { icon: Ship, title: "Ocean Freight", desc: "FCL & LCL container shipping across major global ports with competitive rates." },
  { icon: Plane, title: "Air Freight", desc: "Express and economy air cargo for urgent, high-value, or perishable shipments." },
  { icon: Truck, title: "Road & Rail", desc: "Cross-border trucking and intermodal rail for inland and regional delivery." },
  { icon: FileCheck2, title: "Customs Brokerage", desc: "Compliant customs clearance, duty calculation, and documentation management." },
  { icon: Warehouse, title: "Warehousing", desc: "Storage, consolidation, and distribution at strategic warehouse locations." },
  { icon: Package, title: "Last-Mile Delivery", desc: "Door-to-door delivery with proof of delivery and real-time status updates." },
]

const iconMap: Record<string, any> = { Ship, Plane, Truck, FileCheck2, Warehouse, Package }

export function Services({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const services = cfg?.services?.length
    ? cfg.services.map((s) => ({
        icon: iconMap["Ship"] || Ship,
        title: s.title || "",
        desc: s.desc || "",
      }))
    : defaultServices
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>Services</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Freight solutions for every lane</h2>
        <p className="mt-3 text-muted-foreground">
          Comprehensive logistics services covering every mode of transport, from origin to destination.
        </p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
  )
}

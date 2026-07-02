import {
  Anchor,
  Plane,
  Warehouse,
  ShoppingCart,
  FileCheck2,
  Truck,
} from "lucide-react"
import { services } from "@/lib/amooksco"

const icons = [Anchor, Plane, Warehouse, ShoppingCart, FileCheck2, Truck]

export function Services() {
  return (
    <section id="services" className="scroll-mt-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            What We Do
          </span>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground">
            Full-Service Freight Forwarding
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to import from China — handled by one trusted team.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => {
            const Icon = icons[i % icons.length]
            return (
              <div
                key={service.title}
                className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {service.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

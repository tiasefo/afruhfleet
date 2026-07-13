import Link from "next/link"
import { Store, ArrowRight, Wrench, Bus, Disc, Fuel, Cog } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const listings = [
  { icon: Bus, title: "City Coach B40", vendor: "Accra Fleet Supplies", desc: "40 seats, AC, live tracking. Available for lease.", tag: "Vehicle" },
  { icon: Wrench, title: "Fleet Maintenance Kit", vendor: "AutoParts GH", desc: "Complete service kit for bus fleets. Bulk pricing available.", tag: "Parts" },
  { icon: Disc, title: "Heavy-Duty Tires (Set of 6)", vendor: "TireWorld", desc: "Premium tires for long-haul coaches. 50,000km warranty.", tag: "Parts" },
  { icon: Fuel, title: "Fuel Card Program", vendor: "GoFuel Ltd", desc: "Discounted fuel rates for fleet operators. Nationwide network.", tag: "Service" },
  { icon: Cog, title: "GPS Tracking Devices", vendor: "TrackTech", desc: "Real-time GPS with route history and driver behavior analytics.", tag: "Equipment" },
  { icon: Bus, title: "Mini Bus 25-Seater", vendor: "Metro Vehicles", desc: "25 seats, ideal for regional routes. Available immediately.", tag: "Vehicle" },
]

export function Marketplace({ theme }: { theme: TenantPublicTheme }) {
  return (
    <section id="marketplace" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
            Marketplace
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Fleet Vendor Marketplace</h2>
          <p className="mt-3 text-muted-foreground">
            Source vehicles, spare parts, fuel programs, and equipment from verified vendors.
          </p>
        </div>
        <Link
          href="#marketplace"
          className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
          style={{ color: theme.primaryColor }}
        >
          View all listings <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <div
            key={listing.title}
            className="flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
          >
            <div className="flex items-start justify-between">
              <span
                className="flex size-12 items-center justify-center rounded-lg text-white"
                style={{ background: theme.primaryColor }}
              >
                <listing.icon className="size-6" />
              </span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: `${theme.accentColor}20`, color: theme.primaryColor }}
              >
                {listing.tag}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold">{listing.title}</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              <Store className="mr-1 inline size-3" />
              {listing.vendor}
            </p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{listing.desc}</p>
            <button
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: theme.primaryColor }}
            >
              Contact Vendor
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

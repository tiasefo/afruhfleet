import {
  PackagePlus,
  Gavel,
  Navigation,
  Radio,
  Star,
  Check,
  ArrowRight,
  ArrowLeftRight,
  Coins,
  MapPin,
  Truck,
  Bus,
  Bike,
  CarTaxiFront,
  BadgeCheck,
} from "lucide-react"

const flow = [
  {
    icon: PackagePlus,
    title: "Shippers post a load",
    body: "Multi-step form captures pickup, dropoff, dimensions, fragile/refrigerated flags, and photos. Credits are deducted on submit.",
    endpoint: "POST /marketplace/shipments",
  },
  {
    icon: Gavel,
    title: "Drivers bid nearby",
    body: "Drivers see jobs on a radius map, then bid a price with a message. Suggested pricing is auto-calculated from distance.",
    endpoint: "POST /shipments/{id}/bids",
  },
  {
    icon: ArrowLeftRight,
    title: "Negotiate & accept",
    body: "Shippers compare bids by price and rating, send counter-offers, and accept the winner — all other bids auto-reject.",
    endpoint: "POST /bids/{id}/accept",
  },
  {
    icon: Radio,
    title: "Track in real time",
    body: "Live GPS pings stream speed, heading, and distance-to-dropoff through every status from pickup to delivery.",
    endpoint: "POST /shipments/{id}/gps",
  },
]

const bids = [
  {
    name: "Kwame A.",
    vehicle: "Box Truck",
    Icon: Truck,
    rating: 4.9,
    trips: 312,
    price: "GHS 150",
    status: "pending" as const,
  },
  {
    name: "Ama T.",
    vehicle: "City Coach",
    Icon: Bus,
    rating: 4.8,
    trips: 187,
    price: "GHS 132",
    status: "countered" as const,
  },
  {
    name: "Yaw B.",
    vehicle: "Ride-hail Car",
    Icon: CarTaxiFront,
    rating: 4.7,
    trips: 540,
    price: "GHS 168",
    status: "pending" as const,
  },
  {
    name: "Esi M.",
    vehicle: "Delivery Bike",
    Icon: Bike,
    rating: 5.0,
    trips: 96,
    price: "GHS 120",
    status: "pending" as const,
  },
]

const trackingSteps = [
  { label: "Assigned", done: true },
  { label: "Pickup", done: true },
  { label: "Picked up", done: true },
  { label: "In transit", done: false, active: true },
  { label: "Delivered", done: false },
]

export function MarketplaceSection() {
  return (
    <section id="marketplace" className="border-b border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Logistics marketplace
          </span>
          <h2 className="max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Post a shipment. Get bids. Track every kilometer.
          </h2>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Your built-in load board connects shippers with every kind of carrier — trucks, buses,
            ride-hail cars, and motorbikes — through live bidding, counter-offers, and real-time GPS.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Flow steps */}
          <ol className="flex flex-col gap-4">
            {flow.map((s, i) => (
              <li
                key={s.title}
                className="flex gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xs font-bold text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-base font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  <code className="mt-2 inline-block rounded bg-secondary px-2 py-0.5 font-mono text-xs text-foreground/70">
                    {s.endpoint}
                  </code>
                </div>
              </li>
            ))}
          </ol>

          {/* Live shipment + bids mock */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            {/* Shipment header */}
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
                    AFR-2026-004182
                  </span>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    Open
                  </span>
                </div>
                <h3 className="mt-2 truncate font-heading text-base font-semibold">
                  Deliver furniture to Accra
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  Accra
                  <ArrowRight className="size-3 shrink-0" />
                  Kumasi · 248 km
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Suggested</p>
                <p className="font-heading text-lg font-bold text-primary">GHS 145</p>
              </div>
            </div>

            {/* Package tags */}
            <div className="flex flex-wrap gap-2">
              {["50 kg", "3 packages", "Fragile", "Handle with care"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Bids */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-semibold">{bids.length} bids</p>
              <span className="text-xs text-muted-foreground">Sorted by price</span>
            </div>
            <ul className="flex flex-col gap-2">
              {bids.map((b) => (
                <li
                  key={b.name}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <b.Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{b.name}</span>
                      <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="size-3 fill-accent text-accent" />
                        {b.rating}
                      </span>
                      <span>·</span>
                      <span>{b.vehicle}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.status === "countered" && (
                      <span className="hidden rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground sm:inline">
                        Countered
                      </span>
                    )}
                    <span className="font-heading text-sm font-bold">{b.price}</span>
                    <button
                      className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                      aria-label={`Accept bid from ${b.name}`}
                    >
                      <Check className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Tracking stepper */}
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <Navigation className="size-3.5 text-primary" />
                  Live tracking
                </span>
                <span className="text-xs text-muted-foreground">45 km/h · 102 km left</span>
              </div>
              <div className="flex items-center">
                {trackingSteps.map((step, i) => (
                  <div key={step.label} className="flex flex-1 flex-col items-center last:flex-none">
                    <div className="flex w-full items-center">
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                          step.done
                            ? "bg-primary text-primary-foreground"
                            : step.active
                              ? "border-2 border-primary bg-card text-primary"
                              : "border border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {step.done ? <Check className="size-3" /> : i + 1}
                      </span>
                      {i < trackingSteps.length - 1 && (
                        <span
                          className={`h-0.5 flex-1 ${step.done ? "bg-primary" : "bg-border"}`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-1.5 text-[10px] ${
                        step.active ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit footer */}
            <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Coins className="size-3.5 text-accent" />
                Credits power posting & GPS pings
              </span>
              <span className="font-medium text-foreground">Plan: Growth</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import { Star, MapPin, BadgeCheck, Truck, Bus, Bike, CarTaxiFront } from "lucide-react"
import { BookingForm, type Vendor } from "@/components/booking-form"

const vehicleFilters = [
  { icon: Truck, label: "Trucks" },
  { icon: Bus, label: "Buses" },
  { icon: CarTaxiFront, label: "Ride-hail" },
  { icon: Bike, label: "Motorbikes" },
]

type VendorCard = Vendor & {
  Icon: typeof Truck
  status: string
  verified: boolean
}

const vendors: VendorCard[] = [
  { name: "Kwame Logistics", type: "Box Truck · 7.5t", Icon: Truck, rating: 4.9, trips: 312, region: "Greater Accra", status: "Available", verified: true, baseRate: 2.4 },
  { name: "Northern Coaches", type: "City Coach · 40 seats", Icon: Bus, rating: 4.8, trips: 187, region: "Kumasi", status: "Available", verified: true, baseRate: 1.8 },
  { name: "Esi Express", type: "Delivery Bike · 80kg", Icon: Bike, rating: 5.0, trips: 96, region: "Tema", status: "On a job", verified: true, baseRate: 0.9 },
  { name: "Yaw Rides", type: "Ride-hail Sedan · 4 seats", Icon: CarTaxiFront, rating: 4.7, trips: 540, region: "Greater Accra", status: "Available", verified: false, baseRate: 1.3 },
  { name: "Volta Freight Co.", type: "Semi-Trailer · 40t", Icon: Truck, rating: 4.6, trips: 218, region: "Ho", status: "Available", verified: true, baseRate: 3.6 },
  { name: "Cape Coast Movers", type: "Cargo Van · 3.5t", Icon: Truck, rating: 4.8, trips: 274, region: "Cape Coast", status: "Available", verified: true, baseRate: 1.6 },
]

export function VendorMarketplace() {
  const [activeVendor, setActiveVendor] = useState<Vendor | null>(null)

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">Vendor marketplace</span>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="max-w-xl text-balance font-heading text-3xl font-bold tracking-tight">
            Browse verified carriers near your route
          </h2>
          <div className="flex flex-wrap gap-2">
            {vehicleFilters.map((f) => (
              <button
                key={f.label}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
              >
                <f.icon className="size-4 text-primary" />
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <div
            key={v.name}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <v.Icon className="size-6" />
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  v.status === "Available" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent-foreground"
                }`}
              >
                {v.status}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading text-base font-semibold">{v.name}</h3>
                {v.verified && <BadgeCheck className="size-4 shrink-0 text-primary" />}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{v.type}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="size-3.5 fill-accent text-accent" />
                {v.rating}
              </span>
              <span>·</span>
              <span>{v.trips} trips</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {v.region}
              </span>
              <button
                onClick={() => setActiveVendor(v)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Request booking
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeVendor && <BookingForm vendor={activeVendor} onClose={() => setActiveVendor(null)} />}
    </section>
  )
}

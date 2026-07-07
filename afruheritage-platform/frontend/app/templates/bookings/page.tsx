"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Plane,
  Bus,
  Ticket,
  Search,
  MapPin,
  CalendarDays,
  Users,
  Star,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  Headphones,
  Wallet,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const tabs = [
  { id: "flights", label: "Flights", icon: Plane },
  { id: "buses", label: "Buses", icon: Bus },
  { id: "events", label: "Events", icon: Ticket },
] as const

const deals = [
  { route: "New York → London", type: "Flight", price: "$389", note: "Round trip · Mar" },
  { route: "Boston → Washington", type: "Bus", price: "$29", note: "Express · Daily" },
  { route: "Coldplay World Tour", type: "Event", price: "$95", note: "Fri · Arena" },
  { route: "Tokyo → Singapore", type: "Flight", price: "$412", note: "Round trip · Apr" },
]

const perks = [
  { icon: Wallet, title: "Best price guarantee", body: "Find it cheaper and we refund the difference." },
  { icon: ShieldCheck, title: "Secure & flexible", body: "Free cancellation on most bookings." },
  { icon: Headphones, title: "24/7 support", body: "Real humans, any time zone." },
]

export default function BookingsTemplate() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("flights")

  return (
    <div className="theme-bookings">
      <TemplatePreviewBar name="Skyline Travel" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Plane className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Skyline</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
              <a href="#search" className="hover:text-foreground">Book</a>
              <a href="#deals" className="hover:text-foreground">Deals</a>
              <a href="#why" className="hover:text-foreground">Why Skyline</a>
              <a href="#help" className="hover:text-foreground">Help</a>
            </nav>
            <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
              My trips
            </button>
          </div>
        </header>

        {/* Hero + search */}
        <section id="search" className="relative">
          <div className="relative w-full overflow-hidden">
            <Image src="/images/bookings-hero.png" alt="Airplane above the clouds at sunset" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/70 to-primary/40" />
            <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6">
              <div className="max-w-2xl text-primary-foreground">
                <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
                  One search. Flights, buses, and tickets.
                </h1>
                <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-primary-foreground/85">
                  Compare thousands of options and book your whole trip in a single place.
                </p>
              </div>

              {/* Search widget */}
              <div className="mt-8 rounded-2xl bg-card p-2 text-card-foreground shadow-2xl">
                <div className="flex gap-1 p-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActive(t.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                        active === t.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <t.icon className="size-4" />
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 p-3 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end">
                  <Field icon={MapPin} label={active === "events" ? "City" : "From"} value={active === "events" ? "Los Angeles" : "New York (JFK)"} />
                  {active !== "events" ? (
                    <button className="hidden size-10 items-center justify-center self-end rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted md:flex">
                      <ArrowLeftRight className="size-4" />
                    </button>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                  <Field
                    icon={active === "events" ? Ticket : MapPin}
                    label={active === "events" ? "Category" : "To"}
                    value={active === "events" ? "Concerts" : "London (LHR)"}
                  />
                  <Field icon={CalendarDays} label="Date" value="Mar 24, 2026" />
                  <button className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                    <Search className="size-4" /> Search
                  </button>
                </div>
                {active !== "events" && (
                  <div className="flex items-center gap-2 px-4 pb-3 text-sm text-muted-foreground">
                    <Users className="size-4" /> 1 passenger · Economy
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Deals */}
        <section id="deals" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Today&apos;s top deals</h2>
              <p className="mt-1 text-muted-foreground">Hand-picked fares and tickets, updated hourly.</p>
            </div>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((d) => (
              <div key={d.route} className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {d.type === "Flight" && <Plane className="size-3" />}
                  {d.type === "Bus" && <Bus className="size-3" />}
                  {d.type === "Event" && <Ticket className="size-3" />}
                  {d.type}
                </span>
                <h3 className="mt-4 text-base font-semibold leading-snug">{d.route}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d.note}</p>
                <div className="mt-auto flex items-end justify-between pt-5">
                  <div>
                    <p className="text-xs text-muted-foreground">from</p>
                    <p className="text-2xl font-bold text-primary">{d.price}</p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:translate-x-1">
                    <ArrowRight className="size-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section id="why" className="bg-secondary/50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why travelers choose Skyline</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {perks.map((p) => (
                <div key={p.title} className="rounded-2xl border border-border bg-card p-7">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <p.icon className="size-6" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <Star className="size-4 fill-accent text-accent" /> 4.8/5
              </span>
              from 2.1M+ travelers · trusted by 800+ partners
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="help" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-primary p-8 text-center text-primary-foreground sm:p-14">
            <h2 className="text-balance text-3xl font-bold sm:text-4xl">Get fare alerts before prices rise</h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/80">
              Drop your email and we&apos;ll watch your favorite routes for you.
            </p>
            <div className="mx-auto mt-7 flex max-w-md gap-2">
              <input placeholder="you@email.com" className="flex-1 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-accent" />
              <button className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Notify me
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Plane className="size-5 text-primary" /> Skyline Travel
            </div>
            <p>&copy; {new Date().getFullYear()} Skyline Travel. Demo storefront.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin
  label: string
  value: string
}) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-border bg-background px-4 py-2.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" />
        {value}
      </span>
    </label>
  )
}

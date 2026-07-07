import Image from "next/image"
import {
  Gem,
  MapPin,
  Clock,
  Calendar,
  Utensils,
  ShoppingBag,
  Ticket,
  ArrowRight,
  Star,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const directory = [
  { name: "Atelier 9", cat: "Fashion", floor: "L1 · Unit 12" },
  { name: "Maison Or", cat: "Jewelry", floor: "L1 · Unit 04" },
  { name: "Nordic Home", cat: "Homeware", floor: "L2 · Unit 21" },
  { name: "Pulse Tech", cat: "Electronics", floor: "L2 · Unit 33" },
  { name: "Bloom & Co", cat: "Beauty", floor: "L1 · Unit 18" },
  { name: "The Bookery", cat: "Books", floor: "L3 · Unit 07" },
]

const dining = [
  { name: "Lumen Rooftop", cat: "Fine Dining" },
  { name: "Saffron Grill", cat: "Mediterranean" },
  { name: "Bean & Bar", cat: "Café" },
]

const events = [
  { date: "JUN 14", title: "Summer Style Showcase", time: "2:00 PM · Atrium" },
  { date: "JUN 21", title: "Live Jazz Evening", time: "7:00 PM · Rooftop" },
  { date: "JUN 28", title: "Kids Discovery Day", time: "11:00 AM · L3" },
]

export default function MallTemplate() {
  return (
    <div className="theme-mall">
      <TemplatePreviewBar name="Lumière Mall" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Gem className="size-6 text-accent" />
              <span className="text-lg font-bold tracking-[0.15em] uppercase">Lumière</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
              <a href="#stores" className="hover:text-foreground">Stores</a>
              <a href="#dining" className="hover:text-foreground">Dining</a>
              <a href="#events" className="hover:text-foreground">Events</a>
              <a href="#visit" className="hover:text-foreground">Visit</a>
            </nav>
            <button className="rounded-none border border-accent bg-accent px-5 py-2 text-sm font-semibold uppercase tracking-wide text-accent-foreground transition-colors hover:bg-transparent hover:text-foreground">
              Floor Guide
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="relative h-[560px] w-full overflow-hidden">
            <Image src="/images/mall-hero.png" alt="Luxury shopping mall atrium" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-primary/30" />
            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
                <div className="max-w-2xl text-primary-foreground">
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">Est. 2009</p>
                  <h1 className="mt-4 text-balance text-5xl font-bold leading-tight sm:text-6xl">
                    Where every brand finds its stage.
                  </h1>
                  <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-primary-foreground/80">
                    180 boutiques, 24 restaurants, and a calendar full of experiences — all under one luminous roof.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href="#stores" className="inline-flex items-center gap-2 bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-wide text-accent-foreground transition-opacity hover:opacity-90">
                      Explore stores <ArrowRight className="size-4" />
                    </a>
                    <a href="#events" className="border border-primary-foreground/40 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary-foreground/10">
                      What&apos;s on
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border px-4 sm:px-6 lg:grid-cols-4">
            {[
              [ShoppingBag, "180+", "Boutiques"],
              [Utensils, "24", "Restaurants"],
              [Ticket, "40+", "Events / mo"],
              [Star, "4.8", "Visitor rating"],
            ].map(([Icon, v, l], i) => {
              const I = Icon as typeof ShoppingBag
              return (
                <div key={i} className="flex flex-col items-center gap-1 py-8">
                  <I className="size-5 text-accent" />
                  <p className="text-2xl font-bold">{v as string}</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{l as string}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Directory */}
        <section id="stores" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Directory</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Featured boutiques</h2>
            </div>
            <a href="#" className="hidden items-center gap-1 text-sm font-semibold text-foreground hover:text-accent sm:inline-flex">
              Full directory <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {directory.map((s) => (
              <div key={s.name} className="group flex items-center justify-between gap-4 bg-card p-6 transition-colors hover:bg-secondary">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ShoppingBag className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.cat} · {s.floor}</p>
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </div>
            ))}
          </div>
        </section>

        {/* Dining */}
        <section id="dining" className="bg-secondary/50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Dining</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Taste the collection</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {dining.map((d) => (
                <div key={d.name} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div className="flex h-44 items-center justify-center bg-primary/5">
                    <Utensils className="size-14 text-primary/30" />
                  </div>
                  <div className="p-6">
                    <p className="text-xs uppercase tracking-wide text-accent">{d.cat}</p>
                    <h3 className="mt-1 text-lg font-semibold">{d.name}</h3>
                    <button className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-accent">
                      Reserve a table <ArrowRight className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Events */}
        <section id="events" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">What&apos;s on</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Upcoming events</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {events.map((e) => (
              <div key={e.title} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex size-16 shrink-0 flex-col items-center justify-center bg-primary text-primary-foreground">
                    <span className="text-xs font-medium">{e.date.split(" ")[0]}</span>
                    <span className="text-xl font-bold leading-none">{e.date.split(" ")[1]}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{e.title}</h3>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-4" /> {e.time}
                    </p>
                  </div>
                </div>
                <button className="w-fit border border-accent px-5 py-2 text-sm font-semibold uppercase tracking-wide text-accent-foreground transition-colors hover:bg-accent">
                  Add to plans
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <MapPin className="size-6 text-accent" />
              <div>
                <h3 className="font-semibold">Location</h3>
                <p className="mt-1 text-sm text-primary-foreground/75">120 Grand Boulevard, City Center</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="size-6 text-accent" />
              <div>
                <h3 className="font-semibold">Opening hours</h3>
                <p className="mt-1 text-sm text-primary-foreground/75">Mon–Sun · 10:00 AM – 10:00 PM</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="size-6 text-accent" />
              <div>
                <h3 className="font-semibold">Plan a visit</h3>
                <p className="mt-1 text-sm text-primary-foreground/75">Free parking for the first 3 hours</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 font-bold uppercase tracking-[0.15em] text-foreground">
              <Gem className="size-5 text-accent" /> Lumière
            </div>
            <p>&copy; {new Date().getFullYear()} Lumière Mall. Demo storefront.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

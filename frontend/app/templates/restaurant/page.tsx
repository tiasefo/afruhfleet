import Image from "next/image"
import {
  Flame,
  Clock,
  MapPin,
  Phone,
  Star,
  ArrowRight,
  UtensilsCrossed,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const menu = [
  { name: "Charred Octopus", desc: "Smoked paprika, salsa verde, fingerling potato", price: "$24" },
  { name: "Dry-Aged Ribeye", desc: "48-day aged, bone marrow butter, watercress", price: "$58" },
  { name: "Wild Mushroom Risotto", desc: "Aged parmesan, truffle oil, thyme", price: "$28" },
  { name: "Ember Roasted Carrots", desc: "Whipped feta, dukkah, honey", price: "$16" },
  { name: "Seared Scallops", desc: "Cauliflower purée, brown butter, capers", price: "$32" },
  { name: "Dark Chocolate Tart", desc: "Sea salt, crème fraîche, cocoa nib", price: "$14" },
]

const hours = [
  ["Mon – Thu", "5:00 PM – 11:00 PM"],
  ["Fri – Sat", "5:00 PM – 1:00 AM"],
  ["Sunday", "4:00 PM – 10:00 PM"],
]

export default function RestaurantTemplate() {
  return (
    <div className="theme-restaurant">
      <TemplatePreviewBar name="Ember & Oak" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <Flame className="size-6 text-primary" />
              <span className="text-lg font-bold tracking-[0.2em] uppercase">Ember &amp; Oak</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
              <a href="#menu" className="hover:text-foreground">Menu</a>
              <a href="#about" className="hover:text-foreground">Story</a>
              <a href="#visit" className="hover:text-foreground">Visit</a>
            </nav>
            <button className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Reserve
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="relative h-[600px] w-full overflow-hidden">
            <Image src="/images/restaurant-hero.png" alt="Gourmet plated dish" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="max-w-xl">
                  <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent">Fire-kissed dining</p>
                  <h1 className="mt-4 text-balance text-5xl font-bold leading-tight sm:text-6xl">
                    Cooked over flame. Served with soul.
                  </h1>
                  <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
                    A wood-fired kitchen celebrating seasonal produce and slow craft in the heart of the city.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                      Book a table <ArrowRight className="size-4" />
                    </button>
                    <a href="#menu" className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
                      View menu
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu */}
        <section id="menu" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">The Menu</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Seasonal favorites</h2>
          </div>
          <div className="mt-12 grid gap-x-12 gap-y-7 md:grid-cols-2">
            {menu.map((m) => (
              <div key={m.name} className="flex items-baseline gap-4 border-b border-dashed border-border pb-5">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{m.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                </div>
                <span className="text-lg font-bold text-accent">{m.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <button className="inline-flex items-center gap-2 rounded-md border border-accent px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-accent-foreground">
              <UtensilsCrossed className="size-4" /> See full menu &amp; order online
            </button>
          </div>
        </section>

        {/* Story */}
        <section id="about" className="bg-card">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div className="relative h-80 overflow-hidden rounded-lg">
              <Image src="/images/restaurant-hero.png" alt="Plated dish" fill className="object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Our story</p>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                A kitchen built around the fire.
              </h2>
              <p className="mt-5 leading-relaxed text-muted-foreground">
                Every plate at Ember &amp; Oak begins at the hearth. We work with local farmers and fishers to bring the
                best of each season to a menu shaped by smoke, char, and patience.
              </p>
              <div className="mt-7 flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-5 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">Rated 4.9 by 1,200+ guests</span>
              </div>
            </div>
          </div>
        </section>

        {/* Visit */}
        <section id="visit" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-7">
              <Clock className="size-6 text-accent" />
              <h3 className="mt-4 font-semibold">Hours</h3>
              <dl className="mt-4 space-y-2 text-sm">
                {hours.map(([d, t]) => (
                  <div key={d} className="flex justify-between gap-4 text-muted-foreground">
                    <dt>{d}</dt>
                    <dd className="font-medium text-foreground">{t}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-lg border border-border bg-card p-7">
              <MapPin className="size-6 text-accent" />
              <h3 className="mt-4 font-semibold">Find us</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                48 Kindling Lane<br />Old Town District<br />City Center
              </p>
            </div>
            <div className="flex flex-col rounded-lg bg-primary p-7 text-primary-foreground">
              <Phone className="size-6 text-accent" />
              <h3 className="mt-4 font-semibold">Reservations</h3>
              <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
                Tables fill quickly on weekends. Reserve ahead to secure your spot by the fire.
              </p>
              <button className="mt-auto rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Book now
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 font-bold uppercase tracking-[0.2em] text-foreground">
              <Flame className="size-5 text-primary" /> Ember &amp; Oak
            </div>
            <p>&copy; {new Date().getFullYear()} Ember &amp; Oak. Demo storefront.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

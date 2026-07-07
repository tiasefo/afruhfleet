import Image from "next/image"
import {
  Home,
  Search,
  MapPin,
  BedDouble,
  Bath,
  Maximize,
  Phone,
  ArrowRight,
  Award,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const listings = [
  { name: "The Glasshouse", loc: "Hillcrest Heights", price: "$2.4M", beds: 4, baths: 3, area: "3,200 sqft", tag: "New" },
  { name: "Cedar Court", loc: "Lakeside District", price: "$1.7M", beds: 3, baths: 2, area: "2,400 sqft", tag: null },
  { name: "Marina Penthouse", loc: "Harbour View", price: "$3.9M", beds: 5, baths: 4, area: "4,100 sqft", tag: "Featured" },
]

const agents = [
  { name: "Sofia Marin", title: "Senior Advisor", sales: "$180M sold" },
  { name: "James Okafor", title: "Luxury Specialist", sales: "$240M sold" },
  { name: "Elena Vance", title: "Investment Advisor", sales: "$150M sold" },
]

export default function RealEstateTemplate() {
  return (
    <div className="theme-realestate">
      <TemplatePreviewBar name="Haven Estates" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                <Home className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Haven Estates</span>
            </div>
            <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
              <a href="#listings" className="hover:text-foreground">Buy</a>
              <a href="#listings" className="hover:text-foreground">Rent</a>
              <a href="#agents" className="hover:text-foreground">Agents</a>
              <a href="#contact" className="hover:text-foreground">Contact</a>
            </nav>
            <button className="rounded-sm bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              List property
            </button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative">
          <div className="relative h-[600px] w-full overflow-hidden">
            <Image src="/images/realestate-hero.png" alt="Luxury home at dusk" fill priority className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/40 to-primary/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
                <div className="max-w-xl text-primary-foreground">
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-accent">Find your haven</p>
                  <h1 className="mt-4 text-balance text-5xl font-bold leading-tight sm:text-6xl">
                    Homes as remarkable as the lives within them.
                  </h1>
                  <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-primary-foreground/85">
                    Curated luxury properties and trusted advisors to guide every move.
                  </p>
                </div>

                {/* Search bar */}
                <div className="mt-8 flex max-w-3xl flex-col gap-2 rounded-md bg-card p-2 text-card-foreground shadow-2xl sm:flex-row">
                  <label className="flex flex-1 items-center gap-2 rounded-sm px-4 py-3">
                    <MapPin className="size-5 text-primary" />
                    <input placeholder="City, neighborhood, or ZIP" className="w-full bg-transparent text-sm outline-none" />
                  </label>
                  <select className="rounded-sm border-l border-border bg-transparent px-4 py-3 text-sm outline-none">
                    <option>Any price</option>
                    <option>$1M – $2M</option>
                    <option>$2M – $4M</option>
                    <option>$4M+</option>
                  </select>
                  <button className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                    <Search className="size-4" /> Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Listings */}
        <section id="listings" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Featured</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Signature listings</h2>
            </div>
            <a href="#" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              All properties <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {listings.map((l) => (
              <div key={l.name} className="group overflow-hidden rounded-md border border-border bg-card transition-shadow hover:shadow-xl">
                <div className="relative h-56 overflow-hidden">
                  <Image src="/images/realestate-hero.png" alt={l.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  {l.tag && (
                    <span className="absolute left-3 top-3 rounded-sm bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                      {l.tag}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-sm bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                    {l.price}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold">{l.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4" /> {l.loc}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><BedDouble className="size-4" /> {l.beds}</span>
                    <span className="flex items-center gap-1.5"><Bath className="size-4" /> {l.baths}</span>
                    <span className="flex items-center gap-1.5"><Maximize className="size-4" /> {l.area}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats band */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-4">
            {[
              ["$4.2B", "In sales"],
              ["1,800+", "Homes sold"],
              ["20 yrs", "Experience"],
              ["98%", "Client satisfaction"],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <p className="text-3xl font-bold sm:text-4xl">{v}</p>
                <p className="mt-1 text-sm text-primary-foreground/75">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Agents */}
        <section id="agents" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Our team</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Meet your advisors</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {agents.map((a) => (
              <div key={a.name} className="rounded-md border border-border bg-card p-7 text-center">
                <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {a.name.split(" ").map((n) => n[0]).join("")}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{a.name}</h3>
                <p className="text-sm text-muted-foreground">{a.title}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  <Award className="size-4" /> {a.sales}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section id="contact" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <div className="flex flex-col items-center gap-6 rounded-lg border border-border bg-secondary p-10 text-center">
            <Phone className="size-8 text-primary" />
            <h2 className="text-balance text-2xl font-bold sm:text-3xl">Ready to find your next home?</h2>
            <p className="max-w-md text-muted-foreground">
              Book a private consultation with one of our advisors and start your search today.
            </p>
            <button className="rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Schedule a consultation
            </button>
          </div>
        </section>

        <footer className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Home className="size-5 text-primary" /> Haven Estates
            </div>
            <p>&copy; {new Date().getFullYear()} Haven Estates. Demo storefront.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

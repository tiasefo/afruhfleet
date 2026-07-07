import Image from "next/image"
import {
  ShoppingBag,
  Search,
  Heart,
  Star,
  Truck,
  RefreshCw,
  ShieldCheck,
  Leaf,
  ArrowRight,
} from "lucide-react"
import { TemplatePreviewBar } from "@/components/template-preview-bar"

const categories = ["New In", "Apparel", "Home", "Accessories", "Wellness", "Sale"]

const products = [
  { name: "Organic Cotton Tee", price: "$38", tag: "Bestseller", rating: 4.8 },
  { name: "Linen Overshirt", price: "$92", tag: "New", rating: 4.9 },
  { name: "Recycled Tote", price: "$45", tag: null, rating: 4.7 },
  { name: "Wool Beanie", price: "$28", tag: "Sale", rating: 4.6 },
]

const perks = [
  { icon: Truck, title: "Free shipping", body: "On orders over $75" },
  { icon: RefreshCw, title: "30-day returns", body: "No questions asked" },
  { icon: ShieldCheck, title: "Secure checkout", body: "Encrypted payments" },
  { icon: Leaf, title: "Sustainable", body: "Ethically sourced" },
]

export default function EcommerceTemplate() {
  return (
    <div className="theme-ecommerce">
      <TemplatePreviewBar name="Verde Goods" />
      <main className="min-h-screen bg-background font-sans text-foreground">
        {/* Announcement */}
        <div className="bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
          Free carbon-neutral shipping on orders over $75
        </div>

        <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">Verde Goods</span>
            </div>
            <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground lg:flex">
              {categories.map((c) => (
                <a key={c} href="#shop" className="hover:text-foreground">{c}</a>
              ))}
            </nav>
            <div className="flex items-center gap-4 text-foreground">
              <Search className="size-5 cursor-pointer" />
              <Heart className="size-5 cursor-pointer" />
              <span className="relative cursor-pointer">
                <ShoppingBag className="size-5" />
                <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">3</span>
              </span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid items-stretch gap-6 lg:grid-cols-2">
            <div className="flex flex-col justify-center rounded-3xl bg-secondary p-8 sm:p-12">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                Spring collection
              </span>
              <h1 className="mt-5 text-balance text-4xl font-bold leading-tight sm:text-5xl">
                Everyday essentials, thoughtfully made.
              </h1>
              <p className="mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
                Timeless pieces crafted from organic and recycled materials. Designed to last, made to feel good.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  Shop the collection <ArrowRight className="size-4" />
                </button>
                <button className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                  Our story
                </button>
              </div>
            </div>
            <div className="relative min-h-[360px] overflow-hidden rounded-3xl">
              <Image src="/images/ecommerce-hero.png" alt="Model wearing the collection" fill className="object-cover" />
            </div>
          </div>
        </section>

        {/* Perks */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section id="shop" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Trending now</h2>
              <p className="mt-1 text-muted-foreground">Loved by our community this week</p>
            </div>
            <a href="#" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex">
              View all <ArrowRight className="size-4" />
            </a>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <div key={p.name} className="group flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="size-12 text-primary/25" />
                  </div>
                  {p.tag && (
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                      {p.tag}
                    </span>
                  )}
                  <button className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background">
                    <Heart className="size-4" />
                  </button>
                  <button className="absolute inset-x-3 bottom-3 translate-y-12 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                    Add to cart
                  </button>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="size-3 fill-accent text-accent" /> {p.rating}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Editorial banner */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid items-center gap-8 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-14 lg:grid-cols-2">
            <div>
              <h2 className="text-balance text-3xl font-bold sm:text-4xl">Join the Verde Club</h2>
              <p className="mt-3 max-w-md leading-relaxed text-primary-foreground/80">
                Early access to drops, members-only pricing, and a tree planted with every order.
              </p>
            </div>
            <div className="flex gap-2">
              <input placeholder="Enter your email" className="flex-1 rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-5 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-accent" />
              <button className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
                Join
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold">
                <Leaf className="size-5 text-primary" /> Verde Goods
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Thoughtfully made essentials for everyday life.</p>
            </div>
            {[
              ["Shop", ["New In", "Apparel", "Home", "Sale"]],
              ["Company", ["About", "Sustainability", "Careers", "Press"]],
              ["Support", ["Shipping", "Returns", "Contact", "FAQ"]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <h4 className="text-sm font-semibold">{title as string}</h4>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(links as string[]).map((l) => (
                    <li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border py-5 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Verde Goods. Demo storefront.
          </div>
        </footer>
      </main>
    </div>
  )
}

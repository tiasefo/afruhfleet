"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowUpRight,
  Globe,
  Layers,
  Palette,
  Plane,
  Rocket,
  ShieldCheck,
  Store,
  Truck,
  Network,
  ShieldHalf,
} from "lucide-react"
import { templatesApi } from "@/lib/api"
import { BackButton } from '@/components/back-button'
import { MarketplaceSection } from "@/components/marketplace-section"

const navLinks = [
  { label: "Solutions", href: "#templates" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Admin", href: "/admin" },
  { label: "Platform", href: "#how" },
  { label: "For Vendors", href: "#how" },
  { label: "Support", href: "#cta" },
  { label: "Pricing", href: "#cta" },
]

const metrics = [
  { label: "Active Shipments", value: "12,847", icon: Truck },
  { label: "Countries", value: "45+", icon: Globe },
  { label: "On-time Rate", value: "98.5%", icon: ShieldCheck },
]

const platformPages = [
  {
    title: "Logistics Marketplace",
    href: "/marketplace",
    icon: Network,
    body: "Browse verified vendors, post shipments, collect bids, and track deliveries live by GPS.",
    tags: ["Vendors", "Bidding", "Booking form", "Tracking"],
  },
  {
    title: "Admin Console",
    href: "/admin",
    icon: ShieldHalf,
    body: "Approve, suspend, or delete vendors, moderate reviews, and audit delivery GPS logs.",
    tags: ["Vendors", "Moderation", "GPS logs", "Settings"],
  },
  {
    title: "Storefront Templates",
    href: "#templates",
    icon: Store,
    body: "Industry-specific, themeable storefronts tenants pick the moment they sign up.",
    tags: ["Fleet", "Freight", "Ecommerce", "Bookings"],
  },
]

export default function PlatformPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTemplates() {
      try {
        const data = await templatesApi.list()
        if (data) {
          setTemplates(data.map((t: any) => ({
            slug: t.template_code,
            name: t.name,
            description: t.description || "",
            category: "Storefront",
            image: "/placeholder.svg",
            swatches: [
              t.preset?.primary_color || "#0078D4",
              t.preset?.secondary_color || "#323130",
              t.preset?.accent_color || "#00BCF2",
            ],
            tags: ["Theme", "Branding"],
          })))
        }
      } catch (err) {
        console.error("Failed to load templates:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadTemplates()
  }, [])

  return (
  <>
    <BackButton />
    <main className="min-h-screen bg-background font-sans text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-heading text-lg font-bold">A</span>
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">Afruheritage</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-foreground/70 lg:flex">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-md px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground sm:block">
              Sign In
            </button>
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <Image
            src="/images/freight-hero.png"
            alt=""
            fill
            priority
            className="object-cover opacity-[0.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
              <span className="size-1.5 rounded-full bg-accent" />
              Now serving Ghana, Kenya, and China trade routes
            </span>
            <h1 className="mt-6 text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Every tenant gets a <span className="text-primary">branded storefront</span>, instantly.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
              Afruheritage gives each tenant their own website the moment they sign up. Pick a
              template, tune the color theme, and go live — from freight and fleet to ecommerce,
              malls, and bookings.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#templates"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Browse Templates
                <Store className="size-4" />
              </a>
              <button className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                <Plane className="size-4" />
                Watch Demo
              </button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-heading text-lg font-bold text-foreground">500+</span>
              tenants trust us
              <span className="ml-2 font-heading text-lg font-bold text-accent">4.9/5</span>
              customer rating
            </div>
          </div>

          {/* Floating metric cards */}
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4">
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className={`rounded-xl border border-border bg-card p-5 shadow-sm ${
                  i === 2 ? "col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <m.icon className="size-4 text-primary" />
                  <span className="text-xs font-medium">{m.label}</span>
                </div>
                <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section id="how" className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-px sm:grid-cols-3">
          {[
            { icon: Store, title: "Pick a concept", body: "Industry-specific storefronts tailored to each tenant's business." },
            { icon: Palette, title: "Brand the theme", body: "Distinct color systems per template, with light and dark modes." },
            { icon: Rocket, title: "Launch in minutes", body: "Each tenant goes live on their own subdomain automatically." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-3 bg-background p-8">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="font-heading text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform tools — new pages */}
      <section id="platform-tools" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">Platform tools</span>
          <h2 className="font-heading text-3xl font-bold tracking-tight">Your control center</h2>
          <p className="max-w-xl text-muted-foreground">
            Operational pages that power Afruheritage — open any to explore the live experience.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platformPages.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-6" />
                </span>
                <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                {p.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Logistics marketplace */}
      <MarketplaceSection />

      {/* Templates grid */}
      <section id="templates" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">Template gallery</span>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">Storefront templates</h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {templates.length} production-ready concepts, each with its own theme. Click any card to open the live storefront.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 py-20 text-center text-sm text-muted-foreground">Loading templates...</div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t: any) => (
              <Link
                key={t.slug}
                href={`/templates/${t.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={t.image || "/placeholder.svg"}
                    alt={`${t.name} storefront preview`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {t.swatches.map((c: string) => (
                      <span key={c} className="size-4 rounded-full border border-white/50" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-accent">{t.category}</p>
                      <h3 className="mt-1 font-heading text-lg font-semibold">{t.name}</h3>
                    </div>
                    <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t.description}</p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {t.tags.map((tag: string) => (
                      <span key={tag} className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section id="cta" className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
          <h2 className="mx-auto max-w-2xl text-balance font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to give your tenants a storefront they love?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Spin up unlimited branded stores from a single platform. No design work required.
          </p>
          <button className="mt-8 rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90">
            Get started free
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Layers className="size-3.5" />
            </span>
            <span>Afruheritage</span>
          </div>
          <p>Storefront template previews. Demo content.</p>
        </div>
      </footer>
    </main>
    </>
  )
}

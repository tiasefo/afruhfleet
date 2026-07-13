"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, Anchor, Phone, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"

const defaultNavLinks = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Track", href: "#track" },
  { label: "How it Works", href: "#how" },
  { label: "Warehouse", href: "#warehouse" },
  { label: "Customs", href: "#customs" },
  { label: "About", href: "/about" },
  { label: "Support", href: "/support" },
]

export function SiteHeader({ theme }: { theme: TenantPublicTheme }) {
  const [open, setOpen] = useState(false)
  const cfg = theme.storefrontConfig
  const navLinks = cfg?.nav_links?.length ? cfg.nav_links : defaultNavLinks
  const waTracking = cfg?.whatsapp?.tracking || cfg?.contacts?.tracking?.whatsapp || ""
  const trackingPhone = cfg?.contacts?.tracking?.phone || theme.supportPhone || ""

  return (
    <header className="sticky top-0 z-50 border-b border-white/10" style={{ background: theme.primaryColor, color: "#fff" }}>
      <div className="hidden border-b border-white/10 md:block" style={{ background: theme.primaryDarkColor }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1 text-[11px]">
          <p className="font-medium" style={{ color: theme.accentColor }}>
            {theme.storefrontConfig?.motto || "Professional Freight & Logistics Services"}
          </p>
          <div className="flex items-center gap-4">
            {trackingPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" /> {trackingPhone}
              </span>
            )}
            {waTracking && (
              <a
                href={waLink(waTracking)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80"
              >
                <MessageCircle className="size-3.5" /> WhatsApp
              </a>
            )}
            <Link href="/sign-in" className="flex items-center gap-1.5 hover:opacity-80">
              <Mail className="size-3.5" /> Staff Login
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href={"/store/" + theme.slug} className="flex items-center gap-2.5">
          <span
            className="flex size-9 items-center justify-center rounded-md"
            style={{ background: theme.accentColor, color: theme.primaryColor }}
          >
            <Anchor className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">{theme.name}</span>
            <span className="text-[10px]" style={{ color: theme.accentColor }}>Freight &amp; Logistics</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.filter(l => l.href).map((link, i) => (
            <Link
              key={link.href || i}
              href={link.href!}
              className="rounded-md px-3 py-2 text-sm font-medium opacity-90 transition-opacity hover:opacity-100"
              style={{ color: "#fff" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="hidden sm:inline-flex"
            style={{ background: theme.accentColor, color: theme.primaryColor }}
          >
            <Link href="/sign-up">Get Started</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                style={{ color: "#fff" }}
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72" style={{ background: theme.primaryColor, color: "#fff" }}>
              <SheetHeader>
                <SheetTitle style={{ color: "#fff" }}>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {navLinks.filter(l => l.href).map((link, i) => (
                  <Link
                    key={link.href || i}
                    href={link.href!}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium hover:opacity-80"
                    style={{ color: "#fff" }}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md px-3 py-2.5 text-sm font-semibold"
                  style={{ background: theme.accentColor, color: theme.primaryColor }}
                >
                  Sign in / Staff Login
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

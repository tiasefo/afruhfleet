"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Menu, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet"
import { brand, waLink, whatsapp } from "@/lib/amooksco"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function SiteHeader({ theme }: { theme: TenantPublicTheme }) {
  const [open, setOpen] = useState(false)
  const base = theme.basePath

  const navLinks = [
    { label: "Home", href: base },
    { label: "New Arrivals", href: `${base}/new-arrivals` },
    { label: "Services", href: `${base}#services` },
    { label: "Track", href: `${base}#track` },
    { label: "Estimate", href: `${base}#estimate` },
    { label: "Payments", href: `${base}#payments` },
    { label: "About", href: `${base}/about` },
    { label: "Support", href: `${base}/support` },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#073763] text-white shadow-md">
      {/* top utility bar */}
      <div className="hidden border-b border-white/10 bg-[#0a4a7d] md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1 text-[11px] text-white/80">
          <p className="font-medium text-white">{brand.tagline}</p>
          <div className="flex items-center gap-4">
            <a
              href={`tel:+${whatsapp.tracking}`}
              className="flex items-center gap-1.5 text-white/80 hover:text-white"
            >
              <Phone className="size-3.5" />
              +233 55 624 9064
            </a>
            <a
              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need help with my shipment.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/80 hover:text-white"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp Tracking
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <Link href={base} className="flex items-center gap-2.5">
          <Image
            src={brand.logo || "/placeholder.svg"}
            alt={`${brand.name} logo`}
            width={36}
            height={36}
            className="rounded-md bg-white p-0.5"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-white">{brand.name}</span>
            <span className="text-[10px] text-white/70">China → Ghana Freight</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="hidden bg-white text-[#073763] hover:bg-white/90 sm:inline-flex"
          >
            <a
              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-4" />
              Need Help?
            </a>
          </Button>

          <Link
            href={`/login?tenant=${theme.slug}`}
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Login
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 lg:hidden"
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-[#073763] text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={`/login?tenant=${theme.slug}`}
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md bg-white px-3 py-2.5 text-sm font-semibold text-[#073763] hover:bg-white/90"
                >
                  Login
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

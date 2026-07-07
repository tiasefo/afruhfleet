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
import { brand, navLinks, waLink, whatsapp } from "@/lib/amooksco"

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-primary text-primary-foreground">
      {/* top utility bar */}
      <div className="hidden border-b border-white/10 bg-primary/95 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1 text-[11px]">
          <p className="font-medium text-accent">{brand.tagline}</p>
          <div className="flex items-center gap-4">
            <a
              href={`tel:+${whatsapp.tracking}`}
              className="flex items-center gap-1.5 hover:text-accent"
            >
              <Phone className="size-3.5" />
              +233 55 624 9064
            </a>
            <a
              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I need help with my shipment.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-accent"
            >
              <MessageCircle className="size-3.5" />
              WhatsApp Tracking
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src={brand.logo || "/placeholder.svg"}
            alt={`${brand.name} logo`}
            width={36}
            height={36}
            className="rounded-md bg-white p-0.5"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight">{brand.name}</span>
            <span className="text-[10px] text-accent">China → Ghana Freight</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/90 transition-colors hover:bg-white/10 hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="hidden bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex"
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

          <Link href="/amooksco-storefront/login" className="rounded-full border px-4 py-2 text-sm font-semibold">Login</Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-white/10 hover:text-accent lg:hidden"
              >
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-primary text-primary-foreground">
              <SheetHeader>
                <SheetTitle className="text-primary-foreground">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-white/10 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/amooksco-storefront/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
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

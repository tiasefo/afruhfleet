import Link from "next/link"
import { Bus, Phone, Mail, MapPin } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function SiteFooter({ theme }: { theme: TenantPublicTheme }) {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span
                className="flex size-8 items-center justify-center rounded-md"
                style={{ background: theme.primaryColor, color: "#fff" }}
              >
                <Bus className="size-4" />
              </span>
              {theme.name}
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Professional transport and fleet operations. Route management, vehicle
              tracking, dispatch, and maintenance — all from one platform.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="#routes" className="hover:text-foreground">Routes &amp; Schedules</Link></li>
              <li><Link href="#track" className="hover:text-foreground">Track Vehicle</Link></li>
              <li><Link href="#fleet" className="hover:text-foreground">Our Fleet</Link></li>
              <li><Link href="#services" className="hover:text-foreground">Services</Link></li>
              <li><Link href="#marketplace" className="hover:text-foreground">Marketplace</Link></li>
              <li><Link href="/sign-in" className="hover:text-foreground">Staff Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" /> Available on request
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" /> Contact support
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0" /> Serving regional routes
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {theme.name}. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

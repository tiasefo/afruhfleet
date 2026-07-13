import Link from "next/link"
import { Anchor, Phone, Mail, MapPin } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"

export function SiteFooter({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const trackingPhone = cfg?.contacts?.tracking?.phone || theme.supportPhone || ""
  const trackingWa = cfg?.contacts?.tracking?.whatsapp || cfg?.whatsapp?.tracking || ""
  const generalPhone = cfg?.contacts?.general?.phone || ""
  const generalWa = cfg?.contacts?.general?.whatsapp || cfg?.whatsapp?.general || ""
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
                <Anchor className="size-4" />
              </span>
              {theme.name}
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Professional freight forwarding and logistics services. Ocean, air, and
              road cargo management with real-time tracking and customs clearance.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link href="#services" className="hover:text-foreground">Services</Link></li>
              <li><Link href="#track" className="hover:text-foreground">Track Shipment</Link></li>
              <li><Link href="#how" className="hover:text-foreground">How It Works</Link></li>
              <li><Link href="#warehouse" className="hover:text-foreground">Warehouse</Link></li>
              <li><Link href="#customs" className="hover:text-foreground">Customs Calculator</Link></li>
              <li><Link href="/sign-in" className="hover:text-foreground">Staff Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {trackingPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" /> {trackingPhone}
                </li>
              )}
              {theme.supportEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" /> {theme.supportEmail}
                </li>
              )}
              {trackingWa && (
                <li className="flex items-center gap-2">
                  <a href={waLink(trackingWa)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    WhatsApp Tracking
                  </a>
                </li>
              )}
              {generalWa && (
                <li className="flex items-center gap-2">
                  <a href={waLink(generalWa)} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    WhatsApp General
                  </a>
                </li>
              )}
              {!trackingPhone && !theme.supportEmail && (
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 shrink-0" /> Serving global trade corridors
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          {theme.legalFooterText || `© ${new Date().getFullYear()} ${theme.name}. All rights reserved.`}
        </div>
      </div>
    </footer>
  )
}

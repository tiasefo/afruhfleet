import Image from "next/image"
import Link from "next/link"
import { MapPin, MessageCircle, Phone, Ship } from "lucide-react"
import { brand, contacts, services, waLink, whatsapp } from "@/lib/amooksco"

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src={brand.logo || "/placeholder.svg"}
                alt={`${brand.name} logo`}
                width={48}
                height={48}
                className="rounded-full bg-white/95 p-0.5"
              />
              <div className="leading-tight">
                <p className="text-base font-bold">{brand.name}</p>
                <p className="text-xs text-accent">{brand.tagline}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              {brand.headline}. Reliable, efficient and professional China to Ghana
              freight forwarding.
            </p>
            <p className="text-sm font-medium text-accent">{brand.motto}</p>
          </div>

          {/* services */}
          <div>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent">
              <Ship className="size-4" /> Services
            </h3>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              {services.map((s) => (
                <li key={s.title}>
                  <Link href="/#services" className="hover:text-accent">
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* company */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-accent">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-primary-foreground/80">
              <li><Link href="/about" className="hover:text-accent">About Us</Link></li>
              <li><Link href="/#track" className="hover:text-accent">Track a Package</Link></li>
              <li><Link href="/#notices" className="hover:text-accent">Warehouse Notices</Link></li>
              <li><Link href="/#payments" className="hover:text-accent">Bank Payments</Link></li>
              <li><Link href="/support" className="hover:text-accent">Support Ticket</Link></li>
              <li><Link href="/privacy" className="hover:text-accent">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="hover:text-accent">Cookies Policy</Link></li>
              <li><Link href="/login" className="hover:text-accent">Staff Login</Link></li>
            </ul>
          </div>

          {/* contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-accent">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  Tracking ({contacts.tracking.staff})
                  <br />
                  <a href={`tel:+${whatsapp.tracking}`} className="hover:text-accent">
                    {contacts.tracking.phone}
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-accent" />
                <a
                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent"
                >
                  WhatsApp: +233 55 624 9064
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                <a href={`tel:+${whatsapp.general}`} className="hover:text-accent">
                  {contacts.general.phone} (China)
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>Accra, Ghana &amp; Guangdong, China</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-primary-foreground/70 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {brand.group}. All rights reserved.
          </p>
          <p>
            Powered by{" "}
            <span className="font-semibold text-accent">{brand.platform}</span> —{" "}
            {brand.platformBy}
          </p>
        </div>
      </div>
    </footer>
  )
}

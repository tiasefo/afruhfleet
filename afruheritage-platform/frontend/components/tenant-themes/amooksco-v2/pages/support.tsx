import { Clock, MessageCircle, Phone } from "lucide-react"
import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
import { SupportForm } from "@/components/tenant-themes/amooksco-v2/support-form"
import { Button } from "@/components/ui/button"
import { billingStaff, contacts, waLink, whatsapp } from "@/lib/amooksco"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function AmooskcoSupport({ theme }: { theme: TenantPublicTheme }) {
  return (
    <>
      <SiteHeader theme={theme} />
      <PageHeader
        eyebrow="Help Center"
        title="We're Here To Serve You Better"
        description="Open a support ticket and our team will get back to you, or reach the right department directly below."
      />
      <section className="bg-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SupportForm />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <MessageCircle className="size-5 text-accent" /> Quick Contact
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Need help fast? Chat with our tracking department on WhatsApp.
              </p>
              <Button
                asChild
                className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <a
                  href={waLink(whatsapp.tracking, "Hello AMOOKSCO support team,")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="size-4" />
                  WhatsApp Tracking ({contacts.tracking.staff})
                </a>
              </Button>
              <a
                href={`tel:+${whatsapp.tracking}`}
                className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-accent"
              >
                <Phone className="size-4" />
                {contacts.tracking.phone}
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Billing Department</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Contact by your shipping mark / name.
              </p>
              <ul className="mt-4 space-y-3">
                {billingStaff.map((s) => (
                  <li
                    key={s.range}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{s.range}</span>{" "}
                      · {s.name}
                    </span>
                    <a
                      href={`tel:${s.phone.replace(/\s/g, "")}`}
                      className="font-medium text-primary hover:text-accent"
                    >
                      {s.phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-6">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <Clock className="size-5 text-accent" /> Before You Contact Us
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Please allow 4–5 days after delivery before requesting special checks,
                and confirm your address/shipping mark to avoid double names.
              </p>
            </div>
          </aside>
        </div>
      </section>
      <SiteFooter theme={theme} />
    </>
  )
}

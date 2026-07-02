import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
import { brand, contacts } from "@/lib/amooksco"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "When you use AMOOKSCO Logistics, we may collect information you provide directly, such as your full name, phone number, email address, shipping mark/name, delivery address and details about the goods you are importing.",
      "We also collect shipment data such as tracking numbers, cargo descriptions, weights, CBM and payment confirmations needed to deliver your goods.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "We use your information to receive, consolidate, ship, clear and deliver your packages, to confirm payments, to send you arrival and tracking updates, and to provide customer support.",
      "We may contact you via WhatsApp, phone, SMS or email regarding your shipments and account.",
    ],
  },
  {
    title: "3. Sharing Your Information",
    body: [
      "We share information only as needed to deliver our services — for example with shipping lines, airlines, customs authorities, and last-mile delivery partners.",
      "We do not sell your personal data. We may disclose information where required by law or to protect against fraud.",
    ],
  },
  {
    title: "4. Payments",
    body: [
      "Bank transfers are made directly to the accounts published on our platform. We ask that you send a screenshot or receipt to confirm payment. We never ask you to pay an unlisted personal account.",
    ],
  },
  {
    title: "5. Data Security",
    body: [
      "We apply reasonable technical and organisational measures to protect your data. Tracking and customer records are held under secure tenant isolation and accessible only to authorised AMOOKSCO staff.",
    ],
  },
  {
    title: "6. Your Rights",
    body: [
      "You may request access to, correction of, or deletion of your personal data. Contact our team and we will respond as required by applicable Ghanaian data protection law.",
    ],
  },
  {
    title: "7. Retention",
    body: [
      "We keep shipment and billing records for as long as necessary to provide our services and meet legal, tax and customs obligations.",
    ],
  },
]

export function AmooskcoPrivacy({ theme }: { theme: TenantPublicTheme }) {
  return (
    <>
      <SiteHeader theme={theme} />
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="Last updated: this policy explains how we handle your information when you use AMOOKSCO Logistics."
      />
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <div className="space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-xl font-bold text-foreground">{s.title}</h2>
                <div className="mt-3 space-y-3">
                  {s.body.map((p, i) => (
                    <p key={i} className="leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-bold text-foreground">Contact Us</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                Questions about this policy? Reach our team at{" "}
                <span className="font-medium text-foreground">{contacts.tracking.phone}</span>{" "}
                (WhatsApp) or open a support ticket. {brand.group} is responsible for
                your data on the {brand.platform} platform.
              </p>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter theme={theme} />
    </>
  )
}

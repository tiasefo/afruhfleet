import type { Metadata } from "next"
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Cookies Policy | AMOOKSCO Logistics",
  description: "How AMOOKSCO Logistics uses cookies and similar technologies.",
}

const cookieTypes = [
  {
    name: "Essential Cookies",
    purpose:
      "Required for the website to function — such as keeping you signed in to the staff console and remembering your session.",
    canDisable: "No",
  },
  {
    name: "Preference Cookies",
    purpose:
      "Remember choices like your language and saved tracking searches to improve your experience.",
    canDisable: "Yes",
  },
  {
    name: "Analytics Cookies",
    purpose:
      "Help us understand how visitors use the site so we can improve our services. These are aggregated and anonymous.",
    canDisable: "Yes",
  },
]

export default function CookiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Cookies Policy"
        description="This policy explains what cookies are, how we use them, and how you can control them."
      />
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-14">
          <div className="space-y-8 leading-relaxed text-muted-foreground">
            <div>
              <h2 className="text-xl font-bold text-foreground">What Are Cookies?</h2>
              <p className="mt-3">
                Cookies are small text files stored on your device when you visit a
                website. They help the site remember your actions and preferences over
                time, and allow certain features to work properly.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">How We Use Cookies</h2>
              <p className="mt-3">
                AMOOKSCO Logistics uses cookies to keep the storefront and staff
                console secure, to remember your preferences, and to measure and
                improve performance.
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Purpose</th>
                    <th className="px-4 py-3 font-semibold">Optional?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {cookieTypes.map((c) => (
                    <tr key={c.name}>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.purpose}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.canDisable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">
                Managing Your Cookies
              </h2>
              <p className="mt-3">
                Most browsers let you control cookies through their settings. You can
                block or delete cookies, but please note that disabling essential
                cookies may affect how the site works.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">Updates</h2>
              <p className="mt-3">
                We may update this Cookies Policy from time to time. Any changes will be
                posted on this page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

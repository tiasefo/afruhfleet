import { Globe2 } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

const defaultSteps = [
  { n: "01", title: "Get a Quote", desc: "Compare rates across carriers and modes. Get instant pricing for your shipment." },
  { n: "02", title: "Book & Document", desc: "Digital booking with automated bill of lading, customs paperwork, and insurance." },
  { n: "03", title: "Ship & Track", desc: "Real-time milestone tracking from origin to destination with proactive notifications." },
  { n: "04", title: "Receive & Confirm", desc: "Last-mile delivery with proof of delivery and digital confirmation." },
]

const stats = [
  ["600+", "Ports served"],
  ["120", "Countries"],
  ["35k", "Shipments / yr"],
  ["98%", "On-schedule"],
  ["24/7", "Visibility"],
  ["15+", "Carrier partners"],
]

export function HowItWorks({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const steps = cfg?.workflow?.length
    ? cfg.workflow.map((w, i) => ({
        n: w.step || String(i + 1).padStart(2, "0"),
        title: w.title || "",
        desc: w.desc || "",
      }))
    : defaultSteps

  return (
    <>
      <section id="how" style={{ background: theme.primaryColor }}>
        <div className="mx-auto max-w-7xl px-4 py-20 text-white sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ship in four simple steps</h2>
          <p className="mt-3 max-w-xl opacity-80">
            From quote to delivery, we handle every step of your freight journey with transparency and care.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="border-t-2 pt-5" style={{ borderColor: theme.accentColor }}>
                <span className="text-sm font-bold" style={{ color: theme.accentColor }}>{s.n}</span>
                <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 leading-relaxed opacity-75">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="network" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Globe2 className="size-10" style={{ color: theme.primaryColor }} />
            <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              A network that reaches everywhere you trade.
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              With agents across the globe and direct carrier contracts, we keep your supply chain
              resilient and your cargo moving — no matter the lane.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {stats.map(([v, l]) => (
              <div key={l} className="rounded-xl border border-border bg-card p-5 text-center">
                <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>{v}</p>
                <p className="mt-1 text-xs text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

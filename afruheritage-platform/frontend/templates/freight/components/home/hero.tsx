import { Ship, Plane, Truck, Search, ArrowRight, MessageCircle, ShieldCheck } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"
import { VideoBackdrop } from "../video-backdrop"

const iconMap: Record<string, any> = { Ship, Plane, Truck, Search, ArrowRight, MessageCircle, ShieldCheck }

const defaultStats = [
  { value: "2,900+", label: "Cargo records tracked" },
  { value: "1,000+", label: "Trusted customers" },
  { value: "Sea & Air", label: "Freight options" },
  { value: "China \u2192 GH", label: "Dedicated corridor" },
]

const defaultButtons = [
  { label: "Track Shipment", href: "#track", icon: "Search", variant: "primary" as const },
  { label: "Our Services", href: "#services", icon: "ArrowRight", variant: "outline" as const },
]

export function Hero({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const heroCfg = cfg?.hero
  const headline = cfg?.headline || 'Move cargo across the world, without the friction.'
  const motto = cfg?.motto || 'Instant rates, digital documentation, and end-to-end tracking for every shipment. Ocean, air, and road \u2014 all in one platform.'
  const tagline = heroCfg?.tagline || cfg?.motto || 'Global freight forwarding'
  const subheadline = heroCfg?.subheadline || motto
  const stats = heroCfg?.stats?.length ? heroCfg.stats : defaultStats
  const buttons = heroCfg?.buttons?.length ? heroCfg.buttons : defaultButtons
  const waTracking = cfg?.whatsapp?.tracking || cfg?.contacts?.tracking?.whatsapp || ""

  const hasVideo = heroCfg?.type === 'video' && heroCfg.video
  const hasImage = heroCfg?.type === 'image' && heroCfg.poster

  return (
    <section id="home" className="relative overflow-hidden">
      <div
        className="relative min-h-[520px] w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.primaryDarkColor})` }}
      >
        {hasVideo && (
          <VideoBackdrop
            src={heroCfg!.video}
            poster={heroCfg!.poster}
            videoClassName="opacity-30"
            overlayClassName="bg-gradient-to-r from-primary via-primary/85 to-primary/55"
          />
        )}

        {!hasVideo && !hasImage && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
        )}

        {hasImage && !hasVideo && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${heroCfg!.poster})` }}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary to-transparent" />

        <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-center px-4 py-16 md:py-28 sm:px-6">
          <div className="max-w-2xl text-white">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold"
              style={{ color: theme.accentColor }}
            >
              <ShieldCheck className="size-3.5" />
              {tagline}
            </span>
            <h1 className="mt-5 text-pretty text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              {headline}
            </h1>
            <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed opacity-85">
              {subheadline}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {buttons.map((btn, i) => {
                const Icon = iconMap[btn.icon || ""] || ArrowRight
                const isWhatsApp = btn.href?.startsWith("https://wa.me/") || btn.icon === "MessageCircle"
                const isPrimary = btn.variant === 'primary'

                if (isWhatsApp && waTracking) {
                  return (
                    <a
                      key={i}
                      href={waLink(waTracking, `Hello ${theme.name}, I'd like to start a shipment.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ background: theme.accentColor, color: theme.primaryColor }}
                    >
                      <Icon className="size-4" /> {btn.label}
                    </a>
                  )
                }

                return (
                  <a
                    key={i}
                    href={btn.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                      isPrimary ? '' : 'border border-white/30 text-white hover:bg-white/10'
                    }`}
                    style={isPrimary ? { background: theme.accentColor, color: theme.primaryColor } : undefined}
                  >
                    <Icon className="size-4" /> {btn.label}
                  </a>
                )
              })}

              {waTracking && !buttons.some(b => b.icon === "MessageCircle") && (
                <a
                  href={waLink(waTracking, `Hello ${theme.name}, I'd like to start a shipment.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  <MessageCircle className="size-4" /> Chat on WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {stats.length > 0 && (
          <div className="relative border-t border-white/10 bg-primary/60 backdrop-blur">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="text-center md:text-left">
                  <p className="flex items-center justify-center gap-2 text-2xl font-bold md:justify-start" style={{ color: theme.accentColor }}>
                    <ArrowRight className="hidden size-4 md:block" />
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

import Link from "next/link"
import { ArrowRight, LifeBuoy, MessageCircle } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { waLink } from "@/lib/utils"
import { VideoBackdrop } from "../video-backdrop"

const iconMap: Record<string, any> = { ArrowRight, LifeBuoy, MessageCircle }

export function CTA({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const ctaCfg = cfg?.cta
  const waTracking = cfg?.whatsapp?.tracking || cfg?.contacts?.tracking?.whatsapp || ""

  const title = ctaCfg?.title || "Ready to ship with a team you can trust?"
  const subtitle = ctaCfg?.subtitle || cfg?.motto || "Create an account to book shipments, import cargo in bulk, and access your full logistics dashboard."
  const hasVideo = ctaCfg?.type === 'video' && ctaCfg.video

  const buttons = ctaCfg?.buttons?.length ? ctaCfg.buttons : [
    { label: "Chat on WhatsApp", href: waTracking ? waLink(waTracking, `Hello ${theme.name}, I'd like to get started.`) : "", icon: "MessageCircle", variant: "primary" as const },
    { label: "Open a Support Ticket", href: "/support", icon: "LifeBuoy", variant: "outline" as const },
  ]

  return (
    <section className="relative overflow-hidden" style={{ background: theme.primaryColor }}>
      {hasVideo && (
        <VideoBackdrop
          src={ctaCfg!.video}
          poster={ctaCfg!.poster}
          videoClassName="opacity-20"
          overlayClassName="bg-primary/55"
        />
      )}

      <div className="relative mx-auto max-w-5xl px-4 py-16 text-center text-white sm:px-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty opacity-80">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {buttons.map((btn, i) => {
            const Icon = iconMap[btn.icon || ""] || ArrowRight
            const isPrimary = btn.variant === 'primary'
            const isWhatsApp = btn.icon === "MessageCircle" || btn.href?.startsWith("https://wa.me/")

            if (isWhatsApp && !btn.href) return null

            return (
              <a
                key={i}
                href={btn.href}
                target={isWhatsApp ? "_blank" : undefined}
                rel={isWhatsApp ? "noopener noreferrer" : undefined}
                className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  isPrimary ? '' : 'border border-white/30 text-white hover:bg-white/15'
                }`}
                style={isPrimary ? { background: theme.accentColor, color: theme.primaryColor } : undefined}
              >
                <Icon className="size-5" /> {btn.label}
              </a>
            )
          })}

          {!buttons.length && (
            <>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: theme.accentColor, color: theme.primaryColor }}
              >
                Create Free Account <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Staff Login
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

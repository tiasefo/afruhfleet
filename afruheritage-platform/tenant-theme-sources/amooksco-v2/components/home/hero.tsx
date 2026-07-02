import Link from "next/link"
import { ArrowRight, MessageCircle, PackageSearch, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoBackdrop } from "@/components/video-backdrop"
import { brand, waLink, whatsapp } from "@/lib/amooksco"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Ambient shipping footage — visibly playing, but dimmed for legibility */}
      <VideoBackdrop
        src="/tenant-assets/amooksco/hero-shipping.mp4"
        poster="/tenant-assets/amooksco/container-delivery.jpeg"
        videoClassName="opacity-30"
        overlayClassName="bg-gradient-to-r from-primary via-primary/85 to-primary/55"
      />
      {/* Subtle bottom fade so the stats bar reads cleanly */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <ShieldCheck className="size-3.5" />
            {brand.tagline}
          </span>
          <h1 className="mt-5 text-pretty text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            {brand.headline}
          </h1>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-primary-foreground/85">
            AMOOKSCO Logistics handles your China to Ghana freight end to end — sea
            cargo, air cargo, China warehouse receiving, procurement, customs support
            and door delivery.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <a
                href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to start a shipment from China.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" />
                Start a Shipment
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-accent"
            >
              <Link href="#track">
                <PackageSearch className="size-5" />
                Track My Goods
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* stats bar */}
      <div className="relative border-t border-white/10 bg-primary/60 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4">
          {[
            { value: "2,900+", label: "Cargo records tracked" },
            { value: "1,000+", label: "Trusted customers" },
            { value: "Sea & Air", label: "Freight options" },
            { value: "China → GH", label: "Dedicated corridor" },
          ].map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <p className="flex items-center justify-center gap-2 text-2xl font-bold text-accent md:justify-start">
                <ArrowRight className="hidden size-4 md:block" />
                {s.value}
              </p>
              <p className="mt-1 text-xs text-primary-foreground/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

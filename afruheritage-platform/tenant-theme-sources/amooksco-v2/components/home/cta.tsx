import Link from "next/link"
import { LifeBuoy, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoBackdrop } from "@/components/video-backdrop"
import { brand, waLink, whatsapp } from "@/lib/amooksco"

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Delivery vans drifting behind the closing call-to-action */}
      <VideoBackdrop
        src="/tenant-assets/amooksco/vans.mp4"
        videoClassName="opacity-20"
        overlayClassName="bg-primary/55"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-16 text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
          Ready to ship with a team you can trust?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-primary-foreground/80">
          {brand.motto} Reach out on WhatsApp to get your shipping mark and start
          importing from China today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <a
              href={waLink(whatsapp.tracking, "Hello AMOOKSCO, I'd like to get started.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-5" />
              Chat on WhatsApp
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/5 text-primary-foreground hover:bg-white/15 hover:text-accent"
          >
            <Link href="/support">
              <LifeBuoy className="size-5" />
              Open a Support Ticket
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

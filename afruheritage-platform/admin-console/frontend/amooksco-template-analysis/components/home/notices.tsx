import Image from "next/image"
import { Bell, Clock, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { VideoBackdrop } from "@/components/video-backdrop"

const notices = [
  {
    title: "New Container Arrival",
    tag: "Arrival Update",
    image: "/tenant-assets/amooksco/new-arrivals.jpeg",
    desc: "A fresh sea container has landed and is being offloaded. Check your shipping mark on the updated sheet.",
  },
  {
    title: "Container On The Move",
    tag: "In Transit",
    image: "/tenant-assets/amooksco/container-delivery.jpeg",
    desc: "Goods cleared and dispatched from the port for warehouse sorting and final delivery.",
  },
  {
    title: "China Warehouse Receiving",
    tag: "Warehouse",
    image: "/tenant-assets/amooksco/china-warehouse.jpeg",
    desc: "Our Guangdong warehouse is open and receiving your goods for consolidation before shipping.",
  },
]

export function Notices() {
  return (
    <section id="notices" className="relative scroll-mt-20 overflow-hidden bg-background">
      {/* Cinematic port footage drifting behind the section */}
      <VideoBackdrop
        src="/tenant-assets/amooksco/port.mp4"
        videoClassName="opacity-[0.06]"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-accent-foreground">
              <Bell className="size-4 text-accent" /> Warehouse Notices
            </span>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground">
              Arrivals &amp; Updates
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Please be patient and allow 4–5 days for special checks after delivery
            before contacting the tracking department.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {notices.map((n) => (
            <article
              key={n.title}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={n.image || "/placeholder.svg"}
                  alt={n.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground">
                  {n.tag}
                </Badge>
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-foreground">{n.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {n.desc}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Helpful reminders — replaces the old duplicated gallery */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Clock className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Allow 4–5 Days After Delivery</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                If you cannot find your tracking number on the updated sheet, wait a few
                days for special checks before contacting the tracking department.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <Package className="size-5" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">Confirm Your Shipping Mark</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Before drafting an address, reach out to the tracking department to confirm
                no one else uses that name — this avoids double names on the loaded sheet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

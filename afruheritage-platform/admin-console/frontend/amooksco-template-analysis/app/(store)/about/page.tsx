import type { Metadata } from "next"
import Image from "next/image"
import { Award, Globe2, HeartHandshake, Target } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { brand } from "@/lib/amooksco"

export const metadata: Metadata = {
  title: "About Us | AMOOKSCO Logistics",
  description:
    "Learn about AMOOKSCO Logistics — your trusted China to Ghana freight forwarding partner for sea cargo, air cargo, procurement and delivery.",
}

const values = [
  {
    icon: HeartHandshake,
    title: "Trust",
    desc: "Your goods are in trusted hands. We treat every shipment as our own.",
  },
  {
    icon: Award,
    title: "Reliability",
    desc: "Reliable, efficient and professional service on every order.",
  },
  {
    icon: Globe2,
    title: "Connection",
    desc: "Bridging China and Ghana so you can buy globally and receive locally.",
  },
  {
    icon: Target,
    title: "Transparency",
    desc: "Clear tracking, honest pricing and dependable communication.",
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Your Trusted China to Ghana Freight Partner"
        description={`${brand.group} — making cross-border trade simple, secure and stress-free.`}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-4 text-muted-foreground">
              <h2 className="text-2xl font-bold text-foreground">Who We Are</h2>
              <p className="leading-relaxed">
                AMOOKSCO Logistics is a Ghanaian-owned freight forwarding company
                specialising in importing goods from China. From our warehouse in
                Guangdong to our delivery network across Ghana, we make it possible to{" "}
                <span className="font-semibold text-foreground">
                  buy from China without leaving Ghana.
                </span>
              </p>
              <p className="leading-relaxed">
                Whether you are a market trader, a growing business or an individual
                shopper, we handle the hard parts — procurement, consolidation,
                shipping, customs and last-mile delivery — so you can focus on your
                business.
              </p>
              <p className="leading-relaxed">
                With thousands of cargo records handled and a growing community of
                trusted customers, we have built our reputation on dependable service
                and clear communication.
              </p>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border">
              <Image
                src="/tenant-assets/amooksco/china-warehouse.jpeg"
                alt="AMOOKSCO China warehouse facility"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <v.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-8">
              <h3 className="text-xl font-bold text-foreground">Our Mission</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                To give every Ghanaian access to global products through fast, safe and
                affordable freight forwarding — backed by a team that genuinely cares.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <h3 className="text-xl font-bold text-foreground">Our Vision</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                To be the most trusted name in cross-border logistics between Asia and
                West Africa, powered by the {brand.platform} commerce platform.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

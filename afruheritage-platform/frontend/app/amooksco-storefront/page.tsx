import { Workflow } from "@/components/amooksco-v2/home/workflow"
import { Services } from "@/components/amooksco-v2/home/services"
import { Track } from "@/components/amooksco-v2/home/track"
import { Estimator } from "@/components/amooksco-v2/home/estimator"
import { Payments } from "@/components/amooksco-v2/home/payments"
import { CTA } from "@/components/amooksco-v2/home/cta"
import { SiteHeader } from "@/components/amooksco-v2/site-header"
import { SiteFooter } from "@/components/amooksco-v2/site-footer"

export default function AmookscoStorefront() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Workflow />
        <Services />
        <Track />
        <Estimator />
        <Payments />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  )
}

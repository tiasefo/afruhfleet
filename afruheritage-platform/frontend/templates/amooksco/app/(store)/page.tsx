import { Workflow } from "@/templates/amooksco/components/home/workflow"
import { Services } from "@/templates/amooksco/components/home/services"
import { Track } from "@/templates/amooksco/components/home/track"
import { Estimator } from "@/templates/amooksco/components/home/estimator"
import { Payments } from "@/templates/amooksco/components/home/payments"
import { CTA } from "@/templates/amooksco/components/home/cta"

export default function AmookscoStorefrontPage() {
  return (
    <>
      <Workflow />
      <Services />
      <Track />
      <Estimator />
      <Payments />
      <CTA />
    </>
  )
}

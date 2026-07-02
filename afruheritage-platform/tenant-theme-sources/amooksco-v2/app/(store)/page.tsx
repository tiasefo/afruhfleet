import { Hero } from "@/components/home/hero"
import { Workflow } from "@/components/home/workflow"
import { Services } from "@/components/home/services"
import { Track } from "@/components/home/track"
import { Estimator } from "@/components/home/estimator"
import { Payments } from "@/components/home/payments"
import { CTA } from "@/components/home/cta"

export default function HomePage() {
  return (
    <>
      <Hero />
      <Workflow />
      <Services />
      <Track />
      <Estimator />
      <Payments />
      <CTA />
    </>
  )
}

import { Hero } from "@/components/amooksco-v2/home/hero"
import { Workflow } from "@/components/amooksco-v2/home/workflow"
import { Services } from "@/components/amooksco-v2/home/services"
import { Track } from "@/components/amooksco-v2/home/track"
import { Estimator } from "@/components/amooksco-v2/home/estimator"
import { Payments } from "@/components/amooksco-v2/home/payments"
import { CTA } from "@/components/tenant-themes/amooksco-v2/home/cta"
import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function AmooskcoHome({ theme }: { theme: TenantPublicTheme }) {
  return (
    <>
      <SiteHeader theme={theme} />
      <main>
        <Hero />
        <Workflow />
        <Services />
        <Track />
        <Estimator />
        <Payments />
        <CTA theme={theme} />
      </main>
      <SiteFooter theme={theme} />
    </>
  )
}

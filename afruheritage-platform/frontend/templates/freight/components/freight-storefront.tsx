import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { Hero } from "./home/hero"
import { Services } from "./home/services"
import { TrackShipment } from "./home/track"
import { HowItWorks } from "./home/how-it-works"
import { WarehouseNotices } from "./home/warehouse-notices"
import { CustomsCalculator } from "./home/customs-calculator"
import { Estimator } from "./home/estimator"
import { Payments } from "./home/payments"
import { SupportForm } from "./home/support-form"
import { CTA } from "./home/cta"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"

export function FreightStorefront({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const hasPayments = (cfg?.payment || (cfg?.billing_staff && cfg.billing_staff.length > 0))
  const hasEstimator = cfg?.estimator || true

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader theme={theme} />
      <main className="flex-1">
        <Hero theme={theme} />
        <TrackShipment theme={theme} />
        <Services theme={theme} />
        <HowItWorks theme={theme} />
        <WarehouseNotices theme={theme} />
        {hasEstimator && <Estimator theme={theme} />}
        <CustomsCalculator theme={theme} />
        {hasPayments && <Payments theme={theme} />}
        <SupportForm theme={theme} />
        <CTA theme={theme} />
      </main>
      <SiteFooter theme={theme} />
    </div>
  )
}

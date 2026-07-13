import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import { SiteHeader } from "./site-header"
import { SiteFooter } from "./site-footer"
import { Hero } from "./home/hero"
import { Stats } from "./home/stats"
import { TrackVehicle } from "./home/track-vehicle"
import { Routes } from "./home/routes"
import { Fleet } from "./home/fleet"
import { Marketplace } from "./home/marketplace"
import { CTA } from "./home/cta"

export function FleetStorefront({ theme }: { theme: TenantPublicTheme }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader theme={theme} />
      <main className="flex-1">
        <Hero theme={theme} />
        <Stats theme={theme} />
        <TrackVehicle theme={theme} />
        <Routes theme={theme} />
        <Fleet theme={theme} />
        <Marketplace theme={theme} />
        <CTA theme={theme} />
      </main>
      <SiteFooter theme={theme} />
    </div>
  )
}

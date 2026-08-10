import { resolveTenantTheme } from "@/lib/tenant-theme-registry"
import { TenantPublicShell } from "@/components/tenant-public/tenant-public-shell"
import { GenericStorefront } from "@/components/generic-storefront"
import { BookingsStorefront } from "@/templates/bookings/components/bookings-storefront"
import { EcommerceStorefront } from "@/templates/ecommerce/components/ecommerce-storefront"
import { FreightStorefront } from "@/templates/freight/components/freight-storefront"
import { FleetStorefront } from "@/templates/fleet/components/fleet-storefront"
import { MallStorefront } from "@/templates/mall/components/mall-storefront"
import { RealEstateStorefront } from "@/templates/realestate/components/realestate-storefront"
import { RestaurantStorefront } from "@/templates/restaurant/components/restaurant-storefront"
import { notFound } from "next/navigation"

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = await resolveTenantTheme(slug)

  if (!theme) {
    notFound()
  }

  if (theme.themeCode === "freight") {
    return <FreightStorefront theme={theme} />
  }

  if (theme.themeCode === "fleet") {
    return <FleetStorefront theme={theme} />
  }

  if (theme.themeCode === "bookings") {
    return <BookingsStorefront theme={theme} />
  }

  if (theme.themeCode === "ecommerce") {
    return <EcommerceStorefront theme={theme} />
  }

  if (theme.themeCode === "mall") {
    return <MallStorefront theme={theme} />
  }

  if (theme.themeCode === "realestate") {
    return <RealEstateStorefront theme={theme} />
  }

  if (theme.themeCode === "restaurant") {
    return <RestaurantStorefront theme={theme} />
  }

  return (
    <TenantPublicShell theme={theme}>
      <GenericStorefront />
    </TenantPublicShell>
  )
}

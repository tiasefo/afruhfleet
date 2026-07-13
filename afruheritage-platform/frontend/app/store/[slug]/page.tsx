import { resolveTenantTheme } from "@/lib/tenant-theme-registry"
import { TenantPublicShell } from "@/components/tenant-public/tenant-public-shell"
import { GenericStorefront } from "@/components/generic-storefront"
import { FreightStorefront } from "@/templates/freight/components/freight-storefront"
import { FleetStorefront } from "@/templates/fleet/components/fleet-storefront"
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

  return (
    <TenantPublicShell theme={theme}>
      <GenericStorefront />
    </TenantPublicShell>
  )
}

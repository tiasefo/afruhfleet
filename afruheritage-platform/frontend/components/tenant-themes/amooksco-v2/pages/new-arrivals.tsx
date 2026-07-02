import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
import { Notices } from "@/components/amooksco-v2/home/notices"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

export function AmooskcoNewArrivals({ theme }: { theme: TenantPublicTheme }) {
  return (
    <>
      <SiteHeader theme={theme} />
      <PageHeader
        eyebrow="Warehouse"
        title="New Arrivals"
        description="The latest container arrivals, in-transit shipments and warehouse receiving updates. Check your shipping mark on the updated sheet."
      />
      <Notices />
      <SiteFooter theme={theme} />
    </>
  )
}

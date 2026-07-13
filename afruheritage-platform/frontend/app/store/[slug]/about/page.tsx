import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { GenericPage } from '@/components/generic-storefront/generic-page'

export default async function TenantAboutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = await resolveTenantTheme(slug)

  if (!theme) notFound()

  return (
    <TenantPublicShell theme={theme}>
      <GenericPage title={`About ${theme.name}`} primaryColor={theme.primaryColor} companyName={theme.name}>
        {theme.storefrontConfig?.about_content ? (
          <div dangerouslySetInnerHTML={{ __html: theme.storefrontConfig.about_content }} />
        ) : (
          <p>
            {theme.name} is a professional logistics and freight forwarding company
            serving clients with reliable cargo management, shipment tracking, and
            customs clearance services.
          </p>
        )}
      </GenericPage>
    </TenantPublicShell>
  )
}

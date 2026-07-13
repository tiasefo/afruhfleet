import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { GenericPage } from '@/components/generic-storefront/generic-page'

export default async function TenantCookiesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = await resolveTenantTheme(slug)

  if (!theme) notFound()

  return (
    <TenantPublicShell theme={theme}>
      <GenericPage title="Cookie Policy" primaryColor={theme.primaryColor} companyName={theme.name}>
        {theme.storefrontConfig?.cookies_content ? (
          <div dangerouslySetInnerHTML={{ __html: theme.storefrontConfig.cookies_content }} />
        ) : (
          <>
            <p>This site uses cookies to improve your browsing experience and provide essential functionality.</p>
            <p>By continuing to use this site, you consent to the use of cookies as described in this policy.</p>
          </>
        )}
      </GenericPage>
    </TenantPublicShell>
  )
}

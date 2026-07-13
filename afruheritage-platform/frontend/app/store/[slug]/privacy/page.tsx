import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { GenericPage } from '@/components/generic-storefront/generic-page'

export default async function TenantPrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = await resolveTenantTheme(slug)

  if (!theme) notFound()

  return (
    <TenantPublicShell theme={theme}>
      <GenericPage title="Privacy Policy" primaryColor={theme.primaryColor} companyName={theme.name}>
        {theme.storefrontConfig?.privacy_content ? (
          <div dangerouslySetInnerHTML={{ __html: theme.storefrontConfig.privacy_content }} />
        ) : (
          <p>Your privacy is important to us. This policy describes how {theme.name} collects, uses, and protects your personal information.</p>
        )}
      </GenericPage>
    </TenantPublicShell>
  )
}

import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { AmooskcoAbout } from '@/components/tenant-themes/amooksco-v2/pages/about'

export default async function TenantAboutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = resolveTenantTheme(slug)

  if (!theme) notFound()

  if (theme.themeCode === 'amooksco-v2') {
    return (
      <TenantPublicShell theme={theme}>
        <AmooskcoAbout theme={theme} />
      </TenantPublicShell>
    )
  }

  notFound()
}

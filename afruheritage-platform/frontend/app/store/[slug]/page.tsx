import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { AmooskcoHome } from '@/components/tenant-themes/amooksco-v2/amooksco-home'

export default async function TenantStorePage({
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
        <AmooskcoHome theme={theme} />
      </TenantPublicShell>
    )
  }

  notFound()
}

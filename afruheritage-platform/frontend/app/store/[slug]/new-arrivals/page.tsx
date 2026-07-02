import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { AmooskcoNewArrivals } from '@/components/tenant-themes/amooksco-v2/pages/new-arrivals'

export default async function TenantNewArrivalsPage({
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
        <AmooskcoNewArrivals theme={theme} />
      </TenantPublicShell>
    )
  }

  notFound()
}

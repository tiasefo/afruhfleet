import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { Gallery } from '@/templates/freight/components/home/gallery'

export default async function TenantNewArrivalsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = await resolveTenantTheme(slug)

  if (!theme) notFound()

  return (
    <TenantPublicShell theme={theme}>
      <Gallery theme={theme} />
    </TenantPublicShell>
  )
}

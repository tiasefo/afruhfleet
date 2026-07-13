import { notFound } from 'next/navigation'
import { resolveTenantTheme } from '@/lib/tenant-theme-registry'
import { TenantPublicShell } from '@/components/tenant-public/tenant-public-shell'
import { SupportForm } from '@/templates/freight/components/home/support-form'

export default async function TenantSupportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const theme = await resolveTenantTheme(slug)

  if (!theme) notFound()

  return (
    <TenantPublicShell theme={theme}>
      <SupportForm theme={theme} />
    </TenantPublicShell>
  )
}

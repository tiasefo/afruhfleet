import TenantDetailClient from './tenant-detail-client'

export async function generateStaticParams() {
  return [{ id: 'placeholder' }]
}

export default function TenantDetailPage() {
  return <TenantDetailClient />
}

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function StoreIndexPage() {
  // If a tenant slug was resolved (via subdomain or cookie), redirect to that
  // tenant's storefront. Otherwise, redirect to the platform homepage since
  // /store without a slug has no default tenant to show.
  const hdrs = await headers()
  const tenantSlug = hdrs.get('x-tenant-slug')
  if (tenantSlug) {
    redirect(`/store/${tenantSlug}`)
  }
  redirect('/')
}

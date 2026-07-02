import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUserServer } from '@/lib/auth-server'
import { resolveTenantContext, generateTenantMetadata } from '@/lib/tenant-metadata'
import { PortalSidebar } from '@/components/portal/portal-sidebar'
import { PortalHeader } from '@/components/portal/portal-header'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  const base = generateTenantMetadata(tenant, '/portal')
  if (tenant) {
    base.title = `Portal | ${tenant.company_name}`
  } else {
    base.title = 'Portal | Afruheritage'
  }
  return base
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUserServer()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PortalSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

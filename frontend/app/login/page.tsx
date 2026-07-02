import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import { resolveTenantContext, generateTenantMetadata } from '@/lib/tenant-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  const base = generateTenantMetadata(tenant, '/login')
  if (tenant) {
    base.title = `Sign In | ${tenant.company_name}`
    base.description = `Sign in to your ${tenant.company_name} account to manage shipments, track cargo, and access your dashboard.`
  } else {
    base.title = 'Sign In | Afruheritage'
    base.description = 'Sign in to your Afruheritage account to manage shipments, track cargo, and access your freight forwarding dashboard.'
  }
  return base
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

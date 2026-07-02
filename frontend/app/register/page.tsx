import { Suspense } from 'react'
import type { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'
import { resolveTenantContext, generateTenantMetadata } from '@/lib/tenant-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  const base = generateTenantMetadata(tenant, '/register')
  if (tenant) {
    base.title = `Create Account | ${tenant.company_name}`
    base.description = `Create your ${tenant.company_name} account to start managing freight forwarding operations, track shipments, and access your logistics dashboard.`
  } else {
    base.title = 'Create Account | Afruheritage'
    base.description = 'Create your Afruheritage account to start managing freight forwarding operations, track shipments, and access your logistics dashboard.'
  }
  return base
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

import { Suspense } from 'react'
import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In | Afruheritage',
  description:
    'Sign in to your Afruheritage account to manage shipments, track cargo, and access your freight forwarding dashboard.',
}

// Force runtime rendering (avoids prerender issues with useSearchParams)
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}

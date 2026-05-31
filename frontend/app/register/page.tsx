import { Suspense } from 'react'
import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Create Account | Afruheritage',
  description: 'Create your Afruheritage account to start managing freight forwarding operations, track shipments, and access your logistics dashboard.',
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

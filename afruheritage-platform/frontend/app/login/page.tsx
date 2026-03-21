import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign In | Afruheritage',
  description: 'Sign in to your Afruheritage account to manage shipments, track cargo, and access your freight forwarding dashboard.',
}

export default function LoginPage() {
  return <LoginForm />
}

import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Get Started | Afruheritage',
  description: 'Create your Afruheritage account to start managing freight forwarding operations.',
}

export default function RegisterPage() {
  return <RegisterForm />
}

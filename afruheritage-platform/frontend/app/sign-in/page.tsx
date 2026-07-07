import { Metadata } from 'next'
import { AuthForm } from '@/templates/amooksco/components/auth-form'

export const metadata: Metadata = {
  title: 'Sign In | AMOOKSCO',
  description: 'Sign in to your AMOOKSCO account to track shipments and manage your freight.',
}

export const dynamic = 'force-dynamic'

export default function SignInPage() {
  return <AuthForm mode="sign-in" googleEnabled={false} />
}

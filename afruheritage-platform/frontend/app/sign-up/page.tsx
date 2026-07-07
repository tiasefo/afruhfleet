import { Metadata } from 'next'
import { AuthForm } from '@/templates/amooksco/components/auth-form'

export const metadata: Metadata = {
  title: 'Sign Up | AMOOKSCO',
  description: 'Create your AMOOKSCO account to track shipments and manage your freight.',
}

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  return <AuthForm mode="sign-up" googleEnabled={false} />
}

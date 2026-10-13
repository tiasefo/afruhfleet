'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { vendorPortalApi, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

function VendorAcceptForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setIsSubmitting(true)
    try {
      await vendorPortalApi.acceptInvitation({ token, new_password: password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not activate this invitation. It may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <p className="text-sm text-muted-foreground">
              This invitation link is missing its token. Please use the full link from your invitation email.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h1 className="mb-2 text-xl font-bold">Account activated</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Your vendor account is ready. Sign in to access your vendor portal.
            </p>
            <Button onClick={() => router.push('/login')}>Sign in</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activate your vendor account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set a password to activate your vendor portal access.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating…</> : 'Activate account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VendorAcceptPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <VendorAcceptForm />
    </Suspense>
  )
}

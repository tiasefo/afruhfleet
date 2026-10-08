'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Invitation {
  email: string
  full_name?: string
  role: string
  status: string
}

export default function AcceptInvitationPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || ''
    setToken(t)
    if (!t) {
      setError('Missing invitation token.')
      setLoading(false)
      return
    }
    setIsLoggedIn(!!localStorage.getItem('auth_token'))
    fetch(`/api/v1/team/invitations/${encodeURIComponent(t)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.detail || 'This invitation is no longer valid.')
        setInvitation(data)
        setFullName(data.full_name || '')
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function accept(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const body: Record<string, string> = {}
    if (!isLoggedIn) {
      if (!fullName.trim()) return setError('Please enter your full name.')
      if (password.length < 8) return setError('Password must be at least 8 characters.')
      if (password !== confirm) return setError('Passwords do not match.')
      body.full_name = fullName.trim()
      body.password = password
    }

    setSubmitting(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const existing = localStorage.getItem('auth_token')
      if (existing) headers['Authorization'] = `Bearer ${existing}`

      const res = await fetch(`/api/v1/team/invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Could not accept this invitation.')

      localStorage.setItem('auth_token', data.access_token)
      if (data.tenant_id) localStorage.setItem('tenant_id', data.tenant_id)
      router.push(data.portal_url ? `${data.portal_url}/dashboard` : '/dashboard')
      if (data.portal_url) window.location.href = `${data.portal_url}/dashboard`
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <p className="text-slate-600">Loading invitation...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Accept invitation</h1>
        {invitation && (
          <p className="mt-1 mb-6 text-sm text-slate-600">
            You have been invited to join a workspace as <strong>{invitation.role}</strong> ({invitation.email}).
          </p>
        )}

        {error ? (
          <div className="mt-4">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 w-full rounded-lg border px-4 py-2 font-semibold text-slate-700"
            >
              Go to login
            </button>
          </div>
        ) : (
          <form onSubmit={accept} className="space-y-4">
            {!isLoggedIn && (
              <>
                <input
                  type="text"
                  className="w-full rounded-lg border px-3 py-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                />
                <input
                  type="password"
                  className="w-full rounded-lg border px-3 py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                />
                <input
                  type="password"
                  className="w-full rounded-lg border px-3 py-2"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                />
              </>
            )}
            <button
              disabled={submitting}
              className="w-full rounded-lg bg-[#075163] px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Joining...' : 'Accept invitation'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || ''
    setToken(t)
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!token) return setError('Missing reset token.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Password reset failed.')

      setMessage('Password set successfully. Redirecting to login...')
      setTimeout(() => router.push('/login'), 1200)
    } catch (err: any) {
      setError(err.message || 'Password reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Set your password</h1>
        <p className="mt-1 mb-6 text-sm text-slate-600">
          Create a secure password to activate your AfruHeritage tenant account.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
          />

          <input
            type="password"
            className="w-full rounded-lg border px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
          />

          <button
            disabled={loading}
            className="w-full rounded-lg bg-[#075163] px-4 py-2 font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Setting password...' : 'Set Password'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
      </div>
    </main>
  )
}

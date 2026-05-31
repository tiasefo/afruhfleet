'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api_updated'

interface FormData {
  company_name: string
  country: string
  city: string
  address: string
  phone: string
  admin_full_name: string
  admin_email: string
  admin_password: string
  admin_password_confirm: string
  desired_subdomain: string
}

const INITIAL_FORM: FormData = {
  company_name: '',
  country: 'GH',
  city: '',
  address: '',
  phone: '',
  admin_full_name: '',
  admin_email: '',
  admin_password: '',
  admin_password_confirm: '',
  desired_subdomain: '',
}

const COUNTRIES = [
  { code: 'GH', name: 'Ghana' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'OTHER', name: 'Other' },
]

export default function RegisterCompanyPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ subdomain: string; portal_url: string } | null>(null)

  function handleChange(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.admin_password !== form.admin_password_confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.admin_password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const payload: Record<string, string | undefined> = {
        company_name: form.company_name,
        country: form.country,
        city: form.city || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        admin_full_name: form.admin_full_name,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
        admin_password_confirm: form.admin_password_confirm,
        desired_subdomain: form.desired_subdomain || undefined,
      }
      // Remove undefined values
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

      const res = await api.post('/companies/register', payload)
      const data = res.data ?? res
      setSuccess({ subdomain: data.subdomain, portal_url: data.portal_url })
    } catch (err: any) {
      const detail = err?.data?.detail ?? err?.message ?? 'Registration failed. Please try again.'
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Registered!</h2>
          <p className="text-gray-600 mb-4">
            Your company portal has been set up. Log in with your admin credentials to get started.
          </p>
          <div className="bg-orange-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-700 mb-1">Your portal subdomain:</p>
            <p className="text-orange-600 font-bold">{success.subdomain}</p>
            {success.portal_url && (
              <>
                <p className="text-sm font-medium text-gray-700 mt-3 mb-1">Portal URL:</p>
                <a href={success.portal_url} target="_blank" rel="noopener noreferrer"
                  className="text-orange-500 hover:underline text-sm break-all">
                  {success.portal_url}
                </a>
              </>
            )}
          </div>
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          >
            Log In to Your Portal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Register Your Company</h1>
            <p className="text-sm text-gray-500">Set up your freight forwarding portal</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress indicator */}
        <div className="bg-orange-50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-2xl">🏢</span>
          <div>
            <p className="font-semibold text-gray-800">What happens next?</p>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Your company portal is provisioned instantly</li>
              <li>• A dedicated Fleetbase organisation is created for your fleet</li>
              <li>• A 14-day free trial starts automatically</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">Company Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={form.company_name}
                onChange={handleChange('company_name')}
                placeholder="Acme Freight Ltd"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <select
                  value={form.country}
                  onChange={handleChange('country')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  required
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Accra"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={handleChange('address')}
                placeholder="123 Harbour Road"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="+233 20 000 0000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desired Subdomain (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.desired_subdomain}
                  onChange={handleChange('desired_subdomain')}
                  placeholder="acme-freight"
                  pattern="[a-z0-9\-]+"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <span className="text-sm text-gray-400 whitespace-nowrap">.afruheritage.com</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, hyphens only. Auto-generated if blank.</p>
            </div>
          </div>

          {/* Admin Account */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">Admin Account</h2>
            <p className="text-sm text-gray-500">This will be the primary administrator for your company portal.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.admin_full_name}
                onChange={handleChange('admin_full_name')}
                placeholder="Jane Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.admin_email}
                onChange={handleChange('admin_email')}
                placeholder="admin@yourcompany.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={form.admin_password}
                onChange={handleChange('admin_password')}
                placeholder="Min. 8 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                value={form.admin_password_confirm}
                onChange={handleChange('admin_password_confirm')}
                placeholder="Repeat password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold text-base hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {loading ? 'Creating Your Portal…' : 'Register Company'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-medium">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

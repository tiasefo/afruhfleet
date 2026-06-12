'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api_updated'

interface KYCStatus {
  status: string
  submission_id?: string
  submitted_at?: string
  reviewed_at?: string
  rejection_reason?: string
  full_name?: string
  nationality?: string
}

export default function KYCPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [fullName, setFullName] = useState('')
  const [nationality, setNationality] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [idType, setIdType] = useState('national_id')
  const [idFile, setIdFile] = useState<File | null>(null)

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrMessage, setOcrMessage] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!user) return
    fetchKYCStatus()
  }, [user])

  async function fetchKYCStatus() {
    setLoadingStatus(true)
    try {
      const res = await api.get('/kyc/status')
      setKycStatus(res.data ?? res)
    } catch {
      setKycStatus({ status: 'not_submitted' })
    } finally {
      setLoadingStatus(false)
    }
  }

  async function handleIdFileChange(file: File | null) {
    setIdFile(file)
    if (!file || file.type === 'application/pdf') return
    setOcrLoading(true)
    setOcrMessage('Scanning ID document…')
    try {
      const fd = new FormData()
      fd.append('id_image', file)
      const res = await api.post('/kyc/ocr-parse', fd)
      const data = res.data ?? res
      let filled = 0
      if (data.full_name && !fullName) { setFullName(data.full_name); filled++ }
      if (data.nationality && !nationality) { setNationality(data.nationality); filled++ }
      if (data.id_number && !idNumber) { setIdNumber(data.id_number); filled++ }
      if (data.ocr_available && filled > 0) {
        setOcrMessage(`✅ Auto-filled ${filled} field${filled > 1 ? 's' : ''} from your ID. Please review and correct if needed.`)
      } else if (data.ocr_available) {
        setOcrMessage('ID scanned but fields could not be extracted. Please fill manually.')
      } else {
        setOcrMessage('Auto-scan not available. Please fill the fields below manually.')
      }
    } catch {
      setOcrMessage('Could not scan ID — please fill the fields below manually.')
    } finally {
      setOcrLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!fullName.trim() || !nationality.trim() || !idNumber.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (!idFile) {
      setError('Please upload a photo or scan of your ID document.')
      return
    }

    setSubmitting(true)
    try {
      // Upload ID document if provided
      if (idFile) {
        const formData = new FormData()
        formData.append('file', idFile)
        formData.append('doc_type', idType)
        await api.post('/kyc/upload-id', formData)
      }

      // Submit manual KYC
      await api.post('/kyc/submit-manual', {
        full_name: fullName,
        nationality,
        id_number: idNumber,
        id_type: idType,
      })

      setSuccess('KYC submitted successfully! We will review your documents within 1–2 business days.')
      fetchKYCStatus()
    } catch (err: any) {
      setError(err?.message ?? 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading || loadingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading KYC status…</p>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    not_submitted: { label: 'Not Submitted', color: 'text-gray-600', bg: 'bg-gray-100' },
    not_started: { label: 'Not Submitted', color: 'text-gray-600', bg: 'bg-gray-100' },
    pending: { label: 'Under Review', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100' },
  }

  const currentStatus = kycStatus?.status ?? 'not_submitted'
  const statusInfo = statusConfig[currentStatus] ?? statusConfig['not_submitted']

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
            <h1 className="text-lg font-bold text-gray-900">Identity Verification (KYC)</h1>
            <p className="text-sm text-gray-500">Required to accept delivery jobs</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Current Status Banner */}
        <div className={`rounded-xl p-4 flex items-center gap-3 ${statusInfo.bg}`}>
          <span className="text-2xl">
            {currentStatus === 'approved' ? '✅' : currentStatus === 'rejected' ? '❌' : currentStatus === 'pending' ? '🕐' : '📋'}
          </span>
          <div>
            <p className={`font-semibold ${statusInfo.color}`}>KYC Status: {statusInfo.label}</p>
            {kycStatus?.submitted_at && (
              <p className="text-sm text-gray-500">Submitted: {new Date(kycStatus.submitted_at).toLocaleDateString()}</p>
            )}
            {kycStatus?.rejection_reason && (
              <p className="text-sm text-red-600 mt-1">Reason: {kycStatus.rejection_reason}</p>
            )}
          </div>
        </div>

        {/* Approved — show continue to dashboard */}
        {currentStatus === 'approved' && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <p className="text-gray-700 mb-4">Your identity has been verified. You can now accept delivery jobs.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Pending — waiting for review */}
        {currentStatus === 'pending' && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <p className="text-gray-700 mb-2">Your documents are being reviewed.</p>
            <p className="text-sm text-gray-500">We will notify you within 1–2 business days. You will receive an email once the review is complete.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 text-orange-500 hover:underline text-sm font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Not submitted or rejected — show form */}
        {(currentStatus === 'not_submitted' || currentStatus === 'not_started' || currentStatus === 'rejected') && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">Submit Your Documents</h2>
            <p className="text-sm text-gray-500 mb-5">
              Please provide your identity details. All information is encrypted and stored securely.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm border border-green-200">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="As it appears on your ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="e.g. Ghanaian"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Type *</label>
                <select
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="voters_card">Voter's Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number *</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  placeholder="ID document number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload ID Document *
                  <span className="ml-2 text-xs font-normal text-orange-600">(We'll auto-fill your details)</span>
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => handleIdFileChange(e.target.files?.[0] ?? null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-orange-50 file:text-orange-600 file:text-sm"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Accepted: JPG, PNG, PDF. Max 10MB.</p>
                {ocrLoading && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                    {ocrMessage}
                  </p>
                )}
                {!ocrLoading && ocrMessage && (
                  <p className={`text-xs mt-1 ${ocrMessage.startsWith('✅') ? 'text-green-600' : 'text-gray-500'}`}>{ocrMessage}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              >
                {submitting ? 'Submitting…' : 'Submit for Verification'}
              </button>
            </form>
          </div>
        )}

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: 'Secure', desc: 'End-to-end encrypted storage' },
            { icon: '⏱️', title: 'Fast Review', desc: '1–2 business days' },
            { icon: '✅', title: 'One-Time', desc: 'Verify once, work forever' },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className="text-2xl mb-2">{card.icon}</div>
              <p className="font-medium text-sm text-gray-800">{card.title}</p>
              <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

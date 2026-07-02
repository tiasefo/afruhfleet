'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { resolveTenantId } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Download, Loader2, Eye, FileSpreadsheet, Globe, RefreshCw } from 'lucide-react'

interface ImportResult {
  total: number
  created: number
  skipped: number
  errors: string[]
}

interface PreviewRow {
  row_number: number
  full_name: string
  email: string | null
  phone: string | null
  role: string
  goods_description: string | null
  login_email: string
  is_duplicate: boolean
  status: string
  error: string | null
}

interface PreviewResult {
  total: number
  new: number
  duplicates: number
  errors: number
  domain_used: string
  rows: PreviewRow[]
}

type Step = 'upload' | 'preview' | 'done'

export default function BulkImportPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [domain, setDomain] = useState('')
  const [defaultDomain, setDefaultDomain] = useState('phone.afruheritage.com')

  useEffect(() => {
    const fetchBranding = async () => {
      const tenantId = resolveTenantId()
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      try {
        const resp = await fetch(`/api/v1/branding/${tenantId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (resp.ok) {
          const data = await resp.json()
          if (data.pseudo_email_domain) {
            setDefaultDomain(data.pseudo_email_domain)
            setDomain(data.pseudo_email_domain)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchBranding()
  }, [])

  const handlePreview = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    setPreview(null)

    const tenantId = resolveTenantId()
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams()
    if (tenantId) params.append('tenant_id', tenantId)
    if (domain && domain !== defaultDomain) params.append('domain', domain)

    const url = `/api/v1/users/bulk-import/preview?${params.toString()}`

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(err.detail || 'Preview failed')
      }
      const data: PreviewResult = await resp.json()
      setPreview(data)
      setStep('preview')
    } catch (err: any) {
      setError(err.message || 'Preview failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRePreview = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)

    const tenantId = resolveTenantId()
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams()
    if (tenantId) params.append('tenant_id', tenantId)
    if (domain) params.append('domain', domain)

    const url = `/api/v1/users/bulk-import/preview?${params.toString()}`

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(err.detail || 'Preview failed')
      }
      const data: PreviewResult = await resp.json()
      setPreview(data)
    } catch (err: any) {
      setError(err.message || 'Preview failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)

    const tenantId = resolveTenantId()
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    const formData = new FormData()
    formData.append('file', file)

    const params = new URLSearchParams()
    params.append('send_invite_email', 'false')
    if (tenantId) params.append('tenant_id', tenantId)
    if (domain && domain !== defaultDomain) params.append('domain', domain)

    const url = `/api/v1/users/bulk-import?${params.toString()}`

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(err.detail || 'Import failed')
      }
      const data: ImportResult = await resp.json()
      setResult(data)
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const csv = 'full_name,email,phone,role,goods_description\nJohn Doe,john@example.com,+233201234567,member,Electronics shipment from China\nJane Smith,,+254712345678,member,\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'members_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/members">
            <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-gray-900 mr-3 cursor-pointer" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Import Members</h1>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file to add multiple members at once</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['Upload', 'Preview', 'Done'].map((label, i) => {
            const stepNum = i + 1
            const isActive = (step === 'upload' && stepNum === 1) || (step === 'preview' && stepNum === 2) || (step === 'done' && stepNum === 3)
            const isComplete = (step === 'preview' && stepNum === 1) || (step === 'done' && stepNum <= 2)
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  isActive ? 'bg-blue-600 text-white' : isComplete ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isComplete ? <CheckCircle className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-sm ${isActive ? 'font-medium text-gray-900' : 'text-gray-400'}`}>{label}</span>
                {i < 2 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            )
          })}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">CSV Format</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Your CSV file must include a header row. Required columns: <strong>full_name</strong> and at least one of <strong>email</strong> or <strong>phone</strong>.
                </p>
                <div className="bg-gray-100 rounded p-3 text-xs font-mono mb-3">
                  full_name,email,phone,role,goods_description<br />
                  John Doe,john@example.com,+233201234567,member,Electronics<br />
                  Jane Smith,,+254712345678,member,
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-3">
                  <p className="font-medium">Auto-created login accounts</p>
                  <p className="mt-1">Each imported member gets a login account with:</p>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li><strong>Email:</strong> their CSV email, or <code>{'{phone}'}@{domain || defaultDomain}</code> if no email</li>
                    <li><strong>Password:</strong> <code>afruheritage@1</code> (same for all)</li>
                    <li><strong>Status:</strong> Active immediately</li>
                    <li><strong>Portal:</strong> They can log in at <Link href="/portal" className="underline">/portal</Link> to view their shipments</li>
                  </ul>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload File & Select Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">CSV File</label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 file:text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Pseudo-Email Domain
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Used to generate login emails for members without an email address (format: <code>phone@domain</code>).
                    Default from tenant settings: <strong>{defaultDomain}</strong>
                  </p>
                  <Input
                    placeholder={defaultDomain}
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handlePreview} disabled={!file || isProcessing}>
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4 mr-2" />
                    )}
                    {isProcessing ? 'Analyzing...' : 'Preview Import'}
                  </Button>
                  <Link href="/members">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && preview && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Import Intelligence — {preview.total} rows
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRePreview} disabled={isProcessing}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Re-analyze
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                    <div className="text-2xl font-bold text-green-700">{preview.new}</div>
                    <div className="text-xs text-green-600">New Members</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                    <div className="text-2xl font-bold text-yellow-700">{preview.duplicates}</div>
                    <div className="text-xs text-yellow-600">Duplicates</div>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <div className="text-2xl font-bold text-red-700">{preview.errors}</div>
                    <div className="text-xs text-red-600">Errors</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <div className="text-2xl font-bold text-blue-700">{preview.total}</div>
                    <div className="text-xs text-blue-600">Total Rows</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
                  <span className="font-medium">Domain in use:</span> <code>{preview.domain_used}</code>
                  <span className="ml-2 text-xs">Members without email will get <code>phone@{preview.domain_used}</code></span>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    Change Domain (re-analyze to apply)
                  </label>
                  <Input
                    placeholder={preview.domain_used}
                    value={domain}
                    onChange={e => setDomain(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="overflow-x-auto rounded-lg border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Login Email</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.rows.map((row) => (
                        <tr key={row.row_number} className={
                          row.status === 'error' ? 'bg-red-50' :
                          row.status === 'duplicate' ? 'bg-yellow-50' : ''
                        }>
                          <td className="px-3 py-2 text-xs text-gray-500">{row.row_number}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{row.full_name || '—'}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{row.email || '—'}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{row.phone || '—'}</td>
                          <td className="px-3 py-2 text-sm text-gray-900 font-mono text-xs">{row.login_email || '—'}</td>
                          <td className="px-3 py-2">
                            {row.status === 'new' && (
                              <Badge className="bg-green-100 text-green-700 text-xs">New</Badge>
                            )}
                            {row.status === 'duplicate' && (
                              <Badge className="bg-yellow-100 text-yellow-700 text-xs">Duplicate</Badge>
                            )}
                            {row.status === 'error' && (
                              <Badge className="bg-red-100 text-red-700 text-xs" title={row.error || ''}>Error</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={handleConfirmImport} disabled={isProcessing || preview.new === 0}>
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {isProcessing ? 'Importing...' : `Confirm & Import ${preview.new} Member${preview.new !== 1 ? 's' : ''}`}
              </Button>
              <Button variant="outline" onClick={reset}>Start Over</Button>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === 'done' && result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Rows processed: <strong>{result.total}</strong></p>
                  <p>Members created: <strong className="text-green-700">{result.created}</strong></p>
                  <p>Skipped (duplicates/invalid): <strong>{result.skipped}</strong></p>
                </div>
                {result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-700 mb-1">Warnings:</p>
                    <ul className="text-xs text-red-600 list-disc pl-4 space-y-0.5">
                      {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {result.created > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-900 mb-1">Login Credentials for New Members</p>
                  <p className="text-xs text-amber-800">
                    All imported members have been created with a default password: <code className="font-mono font-bold">afruheritage@1</code>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    They can log in using their generated email (e.g. <code className="font-mono">phone@{domain || defaultDomain}</code>) and this password.
                    Share these credentials with your members so they can access the platform.
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Link href="/members">
                  <Button>View Members</Button>
                </Link>
                <Button variant="outline" onClick={reset}>Import Another File</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

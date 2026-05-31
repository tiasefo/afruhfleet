'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/hooks/useTranslation'
import { resolveTenantId } from '@/lib/tenant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react'

interface ImportResult {
  total: number
  created: number
  skipped: number
  errors: string[]
}

export default function BulkImportPage() {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [sendInvite, setSendInvite] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)
    setResult(null)

    const tenantId = resolveTenantId()
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const formData = new FormData()
    formData.append('file', file)

    const url = `/api/v1/users/bulk-import?send_invite_email=${sendInvite}${tenantId ? `&tenant_id=${tenantId}` : ''}`

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }))
        throw new Error(err.detail || 'Upload failed')
      }
      const data: ImportResult = await resp.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      setIsUploading(false)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Link href="/members">
            <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-gray-900 mr-3 cursor-pointer" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Import Members</h1>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file to add multiple members at once</p>
          </div>
        </div>

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
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-600 file:text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={e => setSendInvite(e.target.checked)}
                className="rounded"
              />
              Send invite email to each imported member (requires email column)
            </label>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Import Complete</span>
                </div>
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
            )}

            <div className="flex gap-3">
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Importing...' : 'Import Members'}
              </Button>
              <Link href="/members">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

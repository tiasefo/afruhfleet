'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { resolveTenantId } from '@/lib/tenant'
import { brandingAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Download, Loader2, FileSpreadsheet, Package, Mail } from 'lucide-react'

interface ImportResult {
  total_rows: number
  created: number
  updated: number
  errors: Array<{ row: number; error: string }>
}

type Step = 'upload' | 'done'

export default function ShipmentImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pseudoEmailDomain, setPseudoEmailDomain] = useState('phone.afruheritage.com')

  // Load branding to get pseudo_email_domain
  useEffect(() => {
    const loadBranding = async () => {
      try {
        const branding = await brandingAPI.get()
        if (branding.pseudo_email_domain) {
          setPseudoEmailDomain(branding.pseudo_email_domain)
        }
      } catch {
        // Use default
      }
    }
    loadBranding()
  }, [])

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return
    if (!selected.name.endsWith('.csv') && !selected.name.endsWith('.xlsx')) {
      setError('Only .csv and .xlsx files are accepted')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit')
      return
    }
    setError(null)
    setFile(selected)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    handleFileSelect(dropped)
  }

  const handleImport = async () => {
    if (!file) return
    setIsProcessing(true)
    setError(null)

    const tenantId = resolveTenantId()
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    if (!tenantId) {
      setError('No tenant context. Please log in as a tenant user.')
      setIsProcessing(false)
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      const resp = await fetch(`/api/v1/shipments/${tenantId}/import/csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const data = await resp.json()

      if (!resp.ok) {
        setError(data.detail || `Import failed (HTTP ${resp.status})`)
        setIsProcessing(false)
        return
      }

      setResult(data)
      setStep('done')

      // Save to import logs for Operations Center
      try {
        const logs = JSON.parse(localStorage.getItem('import_logs') || '[]')
        logs.unshift({ ...data, timestamp: new Date().toISOString(), filename: file.name })
        localStorage.setItem('import_logs', JSON.stringify(logs.slice(0, 20)))
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to import file.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setResult(null)
    setError(null)
  }

  const downloadTemplate = () => {
    const headers = [
      'tracking_number', 'group_member_name', 'sender_name', 'receiver_name',
      'shipped_date', 'estimated_arrival', 'loading_date',
      'description', 'cargo_type', 'package_count', 'volume_cbm', 'weight_kg',
      'origin_city', 'destination_city',
      'total_cost', 'amount_paid', 'currency',
      'storage_days', 'storage_rate', 'storage_fee',
      'notes',
    ]
    const csv = headers.join(',') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'shipment_import_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (step === 'done' && result) {
    const hasErrors = result.errors.length > 0
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="mx-auto flex max-w-4xl items-center px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/shipments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shipments
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasErrors ? (
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                )}
                Import Complete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">{result.total_rows}</div>
                  <div className="text-sm text-gray-500">Total Rows</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{result.created}</div>
                  <div className="text-sm text-gray-500">Created</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                  <div className="text-sm text-gray-500">Updated</div>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                  <div className="text-sm text-gray-500">Errors</div>
                </div>
              </div>

              {hasErrors && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Error Details</h3>
                  <div className="max-h-64 overflow-y-auto rounded-lg border bg-gray-50 p-4">
                    <ul className="space-y-1">
                      {result.errors.map((err, idx) => (
                        <li key={idx} className="text-sm text-red-600">
                          <span className="font-medium">Row {err.row}:</span> {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleReset}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Another File
                </Button>
                <Link href="/shipments">
                  <Button variant="outline">
                    <Package className="mr-2 h-4 w-4" />
                    View Shipments
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/shipments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shipments
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Shipments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a CSV or XLSX file to bulk import shipment/goods data. Shipments are automatically matched to existing members by name.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Import Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pseudo-Email Domain</label>
              <p className="text-xs text-gray-500 mb-2">
                Domain suffix used when generating login emails for CSV-imported members without an email address.
                Format: <code className="bg-gray-100 px-1 rounded">phone@domain</code>
              </p>
              <Input
                value={pseudoEmailDomain}
                onChange={(e) => setPseudoEmailDomain(e.target.value)}
                placeholder="phone.afruheritage.com"
                className="max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Supported File Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <FileSpreadsheet className="mt-0.5 h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">XLSX (Excel)</div>
                  <div className="text-sm text-gray-500">
                    Bilingual columns supported (EN/ZH). CBM formulas auto-evaluated.
                    Shipping marks with tenant prefix are auto-parsed.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-4">
                <FileSpreadsheet className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">CSV</div>
                  <div className="text-sm text-gray-500">
                    Standard CSV with headers. Use the template below for correct column names.
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-400" />
              <div className="mt-3 text-sm text-gray-600">
                Drag and drop your file here, or
              </div>
              <label className="mt-2 inline-block">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
                <span className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                  browse to select a file
                </span>
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase text-gray-500">Column Mapping (XLSX)</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-3">
                <div><span className="font-medium">SHIPPIN MARK/CLIENT</span> (唛头/客户名) → member name</div>
                <div><span className="font-medium">DATE OF RECEIPT</span> (送货日期) → shipped date</div>
                <div><span className="font-medium">DATE OF LOADING</span> (装柜日期) → loading date</div>
                <div><span className="font-medium">DESCRIPTION</span> (商品名) → description</div>
                <div><span className="font-medium">CTNS</span> (件数) → package count</div>
                <div><span className="font-medium">CBM</span> (体积) → volume (formulas evaluated)</div>
                <div><span className="font-medium">SUPPLIER&TRACKING NO</span> (供应商/快递单号) → tracking number</div>
                <div><span className="font-medium">DAYS</span> (天数) → storage days</div>
                <div><span className="font-medium">STORAGE FEE</span> (舱租) → storage fee</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/shipments">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleImport} disabled={!file || isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Shipments
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

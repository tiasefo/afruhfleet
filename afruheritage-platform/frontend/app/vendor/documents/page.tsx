'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { vendorPortalApi, ApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BackButton } from '@/components/back-button'
import { Loader2, AlertCircle, FileText, Upload, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const DOC_TYPES = [
  { key: 'id_front', label: 'ID — front' },
  { key: 'id_back', label: 'ID — back' },
  { key: 'selfie_photo', label: 'Selfie photo' },
  { key: 'insurance_doc', label: 'Insurance document' },
  { key: 'roadworthy_doc', label: 'Roadworthy certificate' },
]

export default function VendorDocumentsPage() {
  const { token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [vendor, setVendor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (authLoading) return
    if (!token) { router.push('/login'); return }
    load()
  }, [authLoading, token])

  async function load() {
    setIsLoading(true)
    try {
      const res = await vendorPortalApi.me()
      setVendor(res.vendor)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load vendor profile')
    } finally {
      setIsLoading(false)
    }
  }

  async function submit() {
    const chosen = Object.fromEntries(Object.entries(files).filter(([, f]) => f)) as Record<string, File>
    if (Object.keys(chosen).length === 0) {
      setMessage({ type: 'err', text: 'Select at least one document to upload.' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await vendorPortalApi.submitDocuments(chosen)
      setMessage({ type: 'ok', text: res.message || 'Documents submitted for review.' })
      setFiles({})
      Object.values(inputRefs.current).forEach((el) => { if (el) el.value = '' })
      await load()
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof ApiError ? err.message : 'Upload failed' })
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card><CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={load}>Retry</Button>
        </CardContent></Card>
      </div>
    )
  }

  const uploaded = vendor?.documents || []
  const uploadedTypes = new Set(uploaded.map((d: any) => d.document_type))

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold">Verification documents</h1>
          <p className="text-sm text-muted-foreground">
            Upload identity and vehicle documents for review by the Afruheritage team.
          </p>
        </div>
      </div>

      {uploaded.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Submitted documents</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {uploaded.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{d.document_type.replace(/_/g, ' ')}</span>
                  </span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <CheckCircle className="mr-1 h-3 w-3" /> Submitted
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Upload documents</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {DOC_TYPES.map((dt) => (
            <div key={dt.key} className="flex items-center justify-between gap-4">
              <div className="text-sm">
                <span className="font-medium">{dt.label}</span>
                {uploadedTypes.has(dt.key) && (
                  <Badge variant="outline" className="ml-2 text-green-700 border-green-300 text-xs">on file</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={(el) => { inputRefs.current[dt.key] = el }}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  id={`file-${dt.key}`}
                  onChange={(e) => setFiles((f) => ({ ...f, [dt.key]: e.target.files?.[0] || null }))}
                />
                <label
                  htmlFor={`file-${dt.key}`}
                  className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                >
                  {files[dt.key] ? files[dt.key]!.name : 'Choose file'}
                </label>
              </div>
            </div>
          ))}

          {message && (
            <div className={`rounded-lg border p-3 text-sm ${
              message.type === 'ok' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</> : <><Upload className="mr-2 h-4 w-4" /> Submit documents</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

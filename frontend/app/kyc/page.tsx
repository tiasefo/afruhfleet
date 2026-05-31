"use client"

import { useState } from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { getApiBaseUrl, getCookie, joinApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { PageActionsBar } from '@/components/shared/page-actions-bar'

export default function KycPage() {
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null)
  const [idBackFile, setIdBackFile] = useState<File | null>(null)
  const [livenessPhotoFile, setLivenessPhotoFile] = useState<File | null>(null)
  const [livenessVideoFile, setLivenessVideoFile] = useState<File | null>(null)
  const [idType, setIdType] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)

    const apiBaseUrl = getApiBaseUrl()
    if (!apiBaseUrl) {
      setError("API base URL missing. Set NEXT_PUBLIC_API_BASE_URL.")
      setLoading(false)
      return
    }

    const accessToken = getCookie("afruheritage_access_token")
    if (!accessToken) {
      setError("Login required. Please sign in before submitting KYC.")
      setLoading(false)
      return
    }

    const formData = new FormData()
    if (!idFrontFile || !idBackFile || !livenessPhotoFile) {
      setError("Please upload ID front, ID back, and a liveness photo.")
      setLoading(false)
      return
    }

    formData.append("id_front", idFrontFile)
    formData.append("id_back", idBackFile)
    formData.append("liveness_photo", livenessPhotoFile)
    if (livenessVideoFile) {
      formData.append("liveness_video", livenessVideoFile)
    }
    formData.append("id_type", idType)
    formData.append("id_number", idNumber)
    formData.append("full_name", fullName)

    try {
      const res = await fetch(joinApiUrl(apiBaseUrl, "/kyc/submit-manual"), {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!res.ok) throw new Error(await res.text())
      const data: Record<string, unknown> = await res.json()
      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "KYC failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageActionsBar backHref="/customer" backLabel="Back to Dashboard" />

      <div className="mt-3 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
            <p className="mt-1 text-sm text-slate-600">
              Submit your identity details for manual verification. Required fields are marked and validated before upload.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-offset-1 focus:border-slate-600"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ID Type</label>
              <input
                type="text"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-offset-1 focus:border-slate-600"
                placeholder="Passport / National ID"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">ID Number</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-offset-1 focus:border-slate-600"
                placeholder="Enter ID number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Upload ID Front</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                required
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Upload ID Back</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                required
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Liveness Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLivenessPhotoFile(e.target.files?.[0] || null)}
                required
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Liveness Video (Optional)</label>
              <input
                type="file"
                accept="video/mp4"
                onChange={(e) => setLivenessVideoFile(e.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Submit KYC"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/customer">Cancel</Link>
            </Button>
          </div>
        </form>

        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        {result && (
          <div className="mt-6 rounded-lg border bg-slate-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Verification Result</h2>
            <pre className="text-xs whitespace-pre-wrap text-slate-700">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}

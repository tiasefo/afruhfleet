"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function KycPage() {
  const [idFile, setIdFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [idType, setIdType] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)
    const formData = new FormData()
    if (!idFile || !videoFile) {
      setError("Please upload both ID and selfie video.")
      setLoading(false)
      return
    }
    formData.append("id_document", idFile)
    formData.append("selfie_video", videoFile)
    formData.append("id_type", idType)
    formData.append("id_number", idNumber)
    formData.append("full_name", fullName)
    try {
      const res = await fetch("/api/v1/kyc/test/full-pipeline", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || "KYC failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">KYC Verification</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Full Name</label>
          <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium">ID Type</label>
          <input type="text" className="input" value={idType} onChange={e => setIdType(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium">ID Number</label>
          <input type="text" className="input" value={idNumber} onChange={e => setIdNumber(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium">Upload ID Document (image)</label>
          <input type="file" accept="image/*" onChange={e => setIdFile(e.target.files?.[0] || null)} required />
        </div>
        <div>
          <label className="block font-medium">Upload Selfie Video (mp4)</label>
          <input type="file" accept="video/mp4" onChange={e => setVideoFile(e.target.files?.[0] || null)} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Verifying..." : "Submit KYC"}
        </button>
      </form>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-bold mb-2">KYC Result</h2>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

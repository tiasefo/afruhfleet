"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function KycTestFullPipelinePage() {
  const [idFile, setIdFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [idType, setIdType] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [fullName, setFullName] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!idFile || !videoFile || !idType || !idNumber || !fullName) {
      setError("All fields are required.")
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("id_document", idFile)
      formData.append("selfie_video", videoFile)
      formData.append("id_type", idType)
      formData.append("id_number", idNumber)
      formData.append("full_name", fullName)
      const res = await fetch("/api/v1/kyc/test/full-pipeline", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      setResult(await res.json())
    } catch (err: any) {
      setError(err.message || "Failed to run test.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Test Full KYC Pipeline</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">ID Document Image</label>
          <input type="file" accept="image/*" onChange={e => setIdFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block font-medium mb-1">Liveness/Selfie Video</label>
          <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block font-medium mb-1">ID Type</label>
          <input type="text" className="border rounded px-2 py-1 w-full" value={idType} onChange={e => setIdType(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1">ID Number</label>
          <input type="text" className="border rounded px-2 py-1 w-full" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
        </div>
        <div>
          <label className="block font-medium mb-1">Full Name</label>
          <input type="text" className="border rounded px-2 py-1 w-full" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>
        <Button type="submit" disabled={loading}>{loading ? "Testing..." : "Run Test"}</Button>
      </form>
      {error && <div className="text-red-600 mt-4">{error}</div>}
      {result && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

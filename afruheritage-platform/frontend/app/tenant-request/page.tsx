'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TenantRequestPage() {
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const [checking, setChecking] = useState(false)
  const [statusRequestId, setStatusRequestId] = useState('')
  const [statusResult, setStatusResult] = useState<any>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setResult(null)

    const form = new FormData(e.currentTarget)
    const payload = {
      companyName: String(form.get('companyName') || ''),
      businessType: String(form.get('businessType') || ''),
      country: String(form.get('country') || ''),
      city: String(form.get('city') || ''),
      address: String(form.get('address') || ''),
      contactName: String(form.get('contactName') || ''),
      contactEmail: String(form.get('contactEmail') || ''),
      phone: String(form.get('phone') || ''),
      website: String(form.get('website') || '') || null,
      message: String(form.get('message') || '') || null,
      terms: true,
    }

    try {
      const res = await fetch('/api/v1/tenants/register-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to submit tenant request')
      }
      setResult(data)
      ;(e.currentTarget as HTMLFormElement).reset()
    } catch (err: any) {
      setError(err.message || 'Failed to submit tenant request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!statusRequestId.trim()) return
    setChecking(true)
    setStatusResult(null)
    setError('')

    try {
      const res = await fetch(`/api/v1/tenants/registration-status/${encodeURIComponent(statusRequestId.trim())}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to fetch request status')
      }
      setStatusResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch request status')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 sm:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Request Tenant Onboarding</h1>
        <p className="text-muted-foreground">Submit your company details to request a new tenant workspace.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Tenant Request</CardTitle>
          <CardDescription>Our team reviews requests and provisions approved tenants.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input id="businessType" name="businessType" required placeholder="freight_forwarder" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" required placeholder="GH" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" name="contactName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input id="website" name="website" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea id="message" name="message" rows={4} />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/register">Create user account</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check Request Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={statusRequestId}
              onChange={(e) => setStatusRequestId(e.target.value)}
              placeholder="Paste your request ID"
            />
            <Button onClick={handleCheckStatus} disabled={checking || !statusRequestId.trim()}>
              {checking ? 'Checking...' : 'Check'}
            </Button>
          </div>
          {statusResult && (
            <div className="rounded-md border p-3 text-sm">
              <div><strong>Status:</strong> {statusResult.status}</div>
              {statusResult.message && <div><strong>Message:</strong> {statusResult.message}</div>}
              {statusResult.tenant_id && <div><strong>Tenant ID:</strong> {statusResult.tenant_id}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Submitted successfully. Request ID: <strong>{result.request_id}</strong>
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}
    </div>
  )
}

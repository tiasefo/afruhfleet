'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { membersAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react'

export default function EditMemberPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_number: '',
    company: '',
    notes: '',
    preferred_language: 'en',
    is_active: 'true',
  })

  useEffect(() => {
    const loadMember = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await membersAPI.get(params.id)
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          email: data.email || '',
          id_number: data.id_number || '',
          company: data.company || '',
          notes: data.notes || '',
          preferred_language: data.preferred_language || 'en',
          is_active: data.is_active ? 'true' : 'false',
        })
      } catch (err: any) {
        setError(err?.message || 'Failed to load member.')
      } finally {
        setIsLoading(false)
      }
    }

    loadMember()
  }, [params.id])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!formData.full_name.trim()) {
      setError('Full name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await membersAPI.update(params.id, {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        id_number: formData.id_number.trim() || undefined,
        company: formData.company.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        preferred_language: formData.preferred_language,
        is_active: formData.is_active === 'true',
      })
      router.push(`/members/${params.id}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to update member.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="mx-auto flex max-w-4xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <Link href={`/members/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="full_name">Full Name</label>
                  <Input id="full_name" value={formData.full_name} onChange={(event) => handleInputChange('full_name', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
                  <Input id="email" type="email" value={formData.email} onChange={(event) => handleInputChange('email', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="phone">Phone Number</label>
                  <Input id="phone" value={formData.phone} onChange={(event) => handleInputChange('phone', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="company">Company</label>
                  <Input id="company" value={formData.company} onChange={(event) => handleInputChange('company', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="id_number">ID Number</label>
                  <Input id="id_number" value={formData.id_number} onChange={(event) => handleInputChange('id_number', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Preferred Language</label>
                  <Select value={formData.preferred_language} onValueChange={(value) => handleInputChange('preferred_language', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={formData.is_active} onValueChange={(value) => handleInputChange('is_active', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="notes">Notes</label>
                <Textarea id="notes" rows={5} value={formData.notes} onChange={(event) => handleInputChange('notes', event.target.value)} />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Link href={`/members/${params.id}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
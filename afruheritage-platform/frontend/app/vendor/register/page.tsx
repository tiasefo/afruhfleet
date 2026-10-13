'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { vendorPortalApi, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Truck, CheckCircle } from 'lucide-react'

const ID_TYPES = [
  { value: 'ghana_card', label: 'Ghana Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: "Voter's ID" },
  { value: 'drivers_license', label: "Driver's License" },
]

const VEHICLE_TYPES = [
  { value: 'truck', label: 'Truck' },
  { value: 'car', label: 'Car' },
  { value: 'motorbike', label: 'Motorbike' },
  { value: 'bicycle', label: 'Bicycle' },
]

const BUSINESS_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'registered', label: 'Registered business' },
  { value: 'fleet', label: 'Fleet operator' },
]

const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Volta',
  'Northern', 'Upper East', 'Upper West', 'Bono', 'Bono East', 'Ahafo',
  'Savannah', 'North East', 'Oti', 'Western North',
]

export const dynamic = 'force-dynamic'

export default function VendorRegisterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    id_type: 'ghana_card',
    id_number: '',
    vehicle_types: [] as string[],
    vehicle_reg_number: '',
    vehicle_model: '',
    vehicle_year: '',
    business_name: '',
    business_type: 'individual',
    operating_regions: [] as string[],
    years_experience: '',
    terms_accepted: false,
    insurance_accepted: false,
    background_check_accepted: false,
  })

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))
  const toggleList = (key: 'vehicle_types' | 'operating_regions', value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.vehicle_types.length === 0) return setError('Select at least one vehicle type')
    if (form.operating_regions.length === 0) return setError('Select at least one operating region')
    if (!form.terms_accepted || !form.insurance_accepted || !form.background_check_accepted) {
      return setError('All declarations must be accepted to submit')
    }
    setIsSubmitting(true)
    try {
      await vendorPortalApi.register({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        id_type: form.id_type,
        id_number: form.id_number,
        vehicle_types: form.vehicle_types,
        vehicle_reg_number: form.vehicle_reg_number,
        vehicle_model: form.vehicle_model || undefined,
        vehicle_year: form.vehicle_year || undefined,
        business_name: form.business_name || undefined,
        business_type: form.business_type,
        operating_regions: form.operating_regions,
        years_experience: form.years_experience || undefined,
        terms_accepted: form.terms_accepted,
        insurance_accepted: form.insurance_accepted,
        background_check_accepted: form.background_check_accepted,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
            <h1 className="mb-2 text-xl font-bold">Application submitted</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Your vendor application is under review. Our team will contact you within
              2-3 business days. If approved, you will receive an account invitation
              by email to access the vendor portal.
            </p>
            <Button onClick={() => router.push('/')}>Return home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Become a delivery vendor</h1>
            <p className="text-sm text-muted-foreground">
              Register to provide delivery services on the Afruheritage network.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Personal details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Full name *</Label>
                <Input id="full_name" required minLength={2} value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ID type *</Label>
                <Select value={form.id_type} onValueChange={(v) => set('id_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ID_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="id_number">ID number *</Label>
                <Input id="id_number" required value={form.id_number} onChange={(e) => set('id_number', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Vehicle</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Vehicle types *</Label>
                <div className="flex flex-wrap gap-3">
                  {VEHICLE_TYPES.map((t) => (
                    <label key={t.value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.vehicle_types.includes(t.value)}
                        onCheckedChange={() => toggleList('vehicle_types', t.value)}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_reg_number">Registration number *</Label>
                <Input id="vehicle_reg_number" required value={form.vehicle_reg_number} onChange={(e) => set('vehicle_reg_number', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_model">Make / model</Label>
                <Input id="vehicle_model" value={form.vehicle_model} onChange={(e) => set('vehicle_model', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_year">Year</Label>
                <Input id="vehicle_year" value={form.vehicle_year} onChange={(e) => set('vehicle_year', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Business</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business name</Label>
                <Input id="business_name" value={form.business_name} onChange={(e) => set('business_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Business type</Label>
                <Select value={form.business_type} onValueChange={(v) => set('business_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Operating regions *</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {GHANA_REGIONS.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.operating_regions.includes(r)}
                        onCheckedChange={() => toggleList('operating_regions', r)}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of experience</Label>
                <Input id="years_experience" value={form.years_experience} onChange={(e) => set('years_experience', e.target.value)} placeholder="e.g. 3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Declarations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={form.terms_accepted} onCheckedChange={(v) => set('terms_accepted', !!v)} />
                <span>I accept the vendor terms of service *</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={form.insurance_accepted} onCheckedChange={(v) => set('insurance_accepted', !!v)} />
                <span>I confirm I hold valid insurance for the vehicles listed *</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox checked={form.background_check_accepted} onCheckedChange={(v) => set('background_check_accepted', !!v)} />
                <span>I consent to a background verification check *</span>
              </label>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : 'Submit application'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have a vendor account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

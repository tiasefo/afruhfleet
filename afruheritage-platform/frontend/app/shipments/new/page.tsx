'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { shipmentsAPI, membersAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Package, User, MapPin, DollarSign, AlertCircle } from 'lucide-react'

export default function CreateShipmentPage() {
  const unassignedMemberValue = '__unassigned__'
  const { user, isLoading: authLoading } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  const router = useRouter()

  // Gate: must be authenticated and onboarded
  useEffect(() => {
    if (authLoading) return
    if (!user) { router.replace('/login'); return }
    if (!user.onboarding_complete) { router.replace('/onboarding'); return }
    // Delivery drivers cannot create shipments — they bid on them
    if (user.role === 'delivery_driver') { router.replace('/dashboard'); return }
  }, [authLoading, user, router])

  const [formData, setFormData] = useState({
    // Shipment Info
    tracking_number: '',
    reference_number: '',
    cargo_type: '',
    package_count: 1,
    weight_kg: '',
    volume_cbm: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    description: '',
    notes: '',

    // Sender Info
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    sender_city: '',
    sender_country: '',

    // Receiver Info
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    receiver_city: '',
    receiver_country: '',

    // Route
    origin_country: '',
    origin_city: '',
    destination_country: '',
    destination_city: '',
    shipped_date: '',
    estimated_arrival: '',

    // Financial
    total_cost: '',
    amount_paid: '',
    currency: branding?.default_currency || 'GHS',

    // Assignment
    group_member_id: '',
  })

  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load members for assignment
  useEffect(() => {
    const loadMembers = async () => {
      setIsLoading(true)
      try {
        const data = await membersAPI.list()
        setMembers(data.items || [])
      } catch (err) {
        console.error('Failed to load members:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadMembers()
  }, [])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!formData.sender_name || !formData.receiver_name ||
      !formData.sender_address || !formData.receiver_address ||
        !formData.origin_country || !formData.origin_city ||
        !formData.destination_country || !formData.destination_city ||
        !formData.total_cost) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const shipmentData = {
        ...formData,
        weight_kg: parseFloat(formData.weight_kg),
        total_cost: parseFloat(formData.total_cost),
        amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
        package_count: parseInt(formData.package_count.toString()),
        length_cm: formData.length_cm ? parseFloat(formData.length_cm) : undefined,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : undefined,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
        volume_cbm: formData.volume_cbm ? parseFloat(formData.volume_cbm) : undefined,
        shipped_date: formData.shipped_date || undefined,
        estimated_arrival: formData.estimated_arrival || undefined,
        group_member_id: formData.group_member_id || undefined,
      }

      await shipmentsAPI.create(shipmentData)
      router.push('/shipments')
    } catch (err: any) {
      setError(err?.message || 'Failed to create shipment. Please try again.')
      console.error('Failed to create shipment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link href="/shipments" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-gray-900" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('shipments.create')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Create a new shipment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Shipment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Shipment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Number
                  </label>
                  <Input
                    value={formData.tracking_number}
                    onChange={(e) => handleInputChange('tracking_number', e.target.value)}
                    placeholder="Leave blank to auto-generate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <Input
                    value={formData.reference_number}
                    onChange={(e) => handleInputChange('reference_number', e.target.value)}
                    placeholder="Optional reference number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo Type
                  </label>
                  <Input
                    value={formData.cargo_type}
                    onChange={(e) => handleInputChange('cargo_type', e.target.value)}
                    placeholder="e.g., Electronics, Clothing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Count *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.package_count}
                    onChange={(e) => handleInputChange('package_count', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight_kg}
                    onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                    placeholder="0.0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume (CBM)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.volume_cbm}
                    onChange={(e) => handleInputChange('volume_cbm', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length (cm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.length_cm}
                    onChange={(e) => handleInputChange('length_cm', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (cm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.width_cm}
                    onChange={(e) => handleInputChange('width_cm', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height_cm}
                    onChange={(e) => handleInputChange('height_cm', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the shipment contents"
                  rows={3}
                />
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or special instructions"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sender Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Sender Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Name *
                  </label>
                  <Input
                    value={formData.sender_name}
                    onChange={(e) => handleInputChange('sender_name', e.target.value)}
                    placeholder="Enter sender name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Phone
                  </label>
                  <Input
                    value={formData.sender_phone}
                    onChange={(e) => handleInputChange('sender_phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Address *
                  </label>
                  <Input
                    value={formData.sender_address}
                    onChange={(e) => handleInputChange('sender_address', e.target.value)}
                    placeholder="Enter complete address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender City *
                  </label>
                  <Input
                    value={formData.sender_city}
                    onChange={(e) => handleInputChange('sender_city', e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sender Country *
                  </label>
                  <Input
                    value={formData.sender_country}
                    onChange={(e) => handleInputChange('sender_country', e.target.value)}
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Receiver Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Receiver Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiver Name *
                  </label>
                  <Input
                    value={formData.receiver_name}
                    onChange={(e) => handleInputChange('receiver_name', e.target.value)}
                    placeholder="Enter receiver name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiver Phone
                  </label>
                  <Input
                    value={formData.receiver_phone}
                    onChange={(e) => handleInputChange('receiver_phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiver Address *
                  </label>
                  <Input
                    value={formData.receiver_address}
                    onChange={(e) => handleInputChange('receiver_address', e.target.value)}
                    placeholder="Enter complete address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiver City *
                  </label>
                  <Input
                    value={formData.receiver_city}
                    onChange={(e) => handleInputChange('receiver_city', e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiver Country *
                  </label>
                  <Input
                    value={formData.receiver_country}
                    onChange={(e) => handleInputChange('receiver_country', e.target.value)}
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin Country *
                  </label>
                  <Input
                    value={formData.origin_country}
                    onChange={(e) => handleInputChange('origin_country', e.target.value)}
                    placeholder="Enter origin country"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origin City *
                  </label>
                  <Input
                    value={formData.origin_city}
                    onChange={(e) => handleInputChange('origin_city', e.target.value)}
                    placeholder="Enter origin city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination Country *
                  </label>
                  <Input
                    value={formData.destination_country}
                    onChange={(e) => handleInputChange('destination_country', e.target.value)}
                    placeholder="Enter destination country"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination City *
                  </label>
                  <Input
                    value={formData.destination_city}
                    onChange={(e) => handleInputChange('destination_city', e.target.value)}
                    placeholder="Enter destination city"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipped Date
                  </label>
                  <Input
                    type="date"
                    value={formData.shipped_date}
                    onChange={(e) => handleInputChange('shipped_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Arrival
                  </label>
                  <Input
                    type="date"
                    value={formData.estimated_arrival}
                    onChange={(e) => handleInputChange('estimated_arrival', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Cost ({formData.currency}) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_cost}
                    onChange={(e) => handleInputChange('total_cost', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid ({formData.currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount_paid}
                    onChange={(e) => handleInputChange('amount_paid', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance Due ({formData.currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_cost && formData.amount_paid ? 
                      (parseFloat(formData.total_cost) - parseFloat(formData.amount_paid || '0')).toFixed(2) : 
                      '0.00'
                    }
                    disabled
                    className="bg-gray-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          {members.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assign to Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.group_member_id || unassignedMemberValue}
                  onValueChange={(value) => handleInputChange('group_member_id', value === unassignedMemberValue ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={unassignedMemberValue}>Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} - {member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="py-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 md:flex-none"
            >
              {isSubmitting ? 'Creating...' : 'Create Shipment'}
            </Button>
            <Link href="/shipments">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

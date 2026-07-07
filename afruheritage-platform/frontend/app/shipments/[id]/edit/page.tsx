'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { membersAPI, shipmentsAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react'

export default function EditShipmentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const shipmentId = params.id
  const unassignedMemberValue = '__unassigned__'
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    tracking_number: '',
    reference_number: '',
    cargo_type: '',
    package_count: '1',
    weight_kg: '',
    description: '',
    notes: '',
    sender_name: '',
    sender_phone: '',
    sender_address: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
    origin_country: '',
    origin_city: '',
    destination_country: '',
    destination_city: '',
    shipped_date: '',
    estimated_arrival: '',
    total_cost: '',
    amount_paid: '',
    currency: 'GHS',
    group_member_id: unassignedMemberValue,
    status: 'draft',
  })

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [shipment, memberList] = await Promise.all([
          shipmentsAPI.get(shipmentId),
          membersAPI.list(),
        ])

        setMembers(memberList.items || [])
        setFormData({
          tracking_number: shipment.tracking_number || '',
          reference_number: shipment.reference_number || '',
          cargo_type: shipment.cargo_type || '',
          package_count: String(shipment.package_count || 1),
          weight_kg: shipment.weight_kg != null ? String(shipment.weight_kg) : '',
          description: shipment.description || '',
          notes: shipment.notes || '',
          sender_name: shipment.sender_name || '',
          sender_phone: shipment.sender_phone || '',
          sender_address: shipment.sender_address || '',
          receiver_name: shipment.receiver_name || '',
          receiver_phone: shipment.receiver_phone || '',
          receiver_address: shipment.receiver_address || '',
          origin_country: shipment.origin_country || '',
          origin_city: shipment.origin_city || '',
          destination_country: shipment.destination_country || '',
          destination_city: shipment.destination_city || '',
          shipped_date: shipment.shipped_date ? shipment.shipped_date.slice(0, 10) : '',
          estimated_arrival: shipment.estimated_arrival ? shipment.estimated_arrival.slice(0, 10) : '',
          total_cost: shipment.total_cost != null ? String(shipment.total_cost) : '',
          amount_paid: shipment.amount_paid != null ? String(shipment.amount_paid) : '',
          currency: shipment.currency || 'GHS',
          group_member_id: shipment.group_member_id || unassignedMemberValue,
          status: shipment.status || 'draft',
        })
      } catch (err: any) {
        setError(err?.message || 'Failed to load shipment.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [shipmentId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!formData.tracking_number.trim() || !formData.sender_name.trim() || !formData.receiver_name.trim()) {
      setError('Tracking number, sender name, and receiver name are required.')
      return
    }

    setIsSubmitting(true)
    try {
      await shipmentsAPI.update(shipmentId, {
        tracking_number: formData.tracking_number.trim(),
        reference_number: formData.reference_number.trim() || undefined,
        cargo_type: formData.cargo_type.trim() || undefined,
        package_count: Number.parseInt(formData.package_count, 10) || 1,
        weight_kg: formData.weight_kg ? Number.parseFloat(formData.weight_kg) : undefined,
        description: formData.description.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        sender_name: formData.sender_name.trim(),
        sender_phone: formData.sender_phone.trim() || undefined,
        sender_address: formData.sender_address.trim() || undefined,
        receiver_name: formData.receiver_name.trim(),
        receiver_phone: formData.receiver_phone.trim() || undefined,
        receiver_address: formData.receiver_address.trim() || undefined,
        origin_country: formData.origin_country.trim() || undefined,
        origin_city: formData.origin_city.trim() || undefined,
        destination_country: formData.destination_country.trim() || undefined,
        destination_city: formData.destination_city.trim() || undefined,
        shipped_date: formData.shipped_date || undefined,
        estimated_arrival: formData.estimated_arrival || undefined,
        total_cost: formData.total_cost ? Number.parseFloat(formData.total_cost) : undefined,
        amount_paid: formData.amount_paid ? Number.parseFloat(formData.amount_paid) : undefined,
        currency: formData.currency.trim() || undefined,
        group_member_id: formData.group_member_id === unassignedMemberValue ? null : formData.group_member_id,
        status: formData.status,
      })
      router.push(`/shipments/${shipmentId}`)
    } catch (err: any) {
      setError(err?.message || 'Failed to update shipment.')
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
        <div className="mx-auto flex max-w-5xl items-center px-4 py-6 sm:px-6 lg:px-8">
          <Link href={`/shipments/${shipmentId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shipment
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Shipment</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tracking Number</label>
                  <Input value={formData.tracking_number} onChange={(event) => handleInputChange('tracking_number', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Reference Number</label>
                  <Input value={formData.reference_number} onChange={(event) => handleInputChange('reference_number', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Cargo Type</label>
                  <Input value={formData.cargo_type} onChange={(event) => handleInputChange('cargo_type', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="picked_up">Picked Up</SelectItem>
                      <SelectItem value="in_transit">In Transit</SelectItem>
                      <SelectItem value="at_customs">At Customs</SelectItem>
                      <SelectItem value="customs_cleared">Customs Cleared</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sender Name</label>
                  <Input value={formData.sender_name} onChange={(event) => handleInputChange('sender_name', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Receiver Name</label>
                  <Input value={formData.receiver_name} onChange={(event) => handleInputChange('receiver_name', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sender Phone</label>
                  <Input value={formData.sender_phone} onChange={(event) => handleInputChange('sender_phone', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Receiver Phone</label>
                  <Input value={formData.receiver_phone} onChange={(event) => handleInputChange('receiver_phone', event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Sender Address</label>
                  <Input value={formData.sender_address} onChange={(event) => handleInputChange('sender_address', event.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Receiver Address</label>
                  <Input value={formData.receiver_address} onChange={(event) => handleInputChange('receiver_address', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Origin City</label>
                  <Input value={formData.origin_city} onChange={(event) => handleInputChange('origin_city', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Origin Country</label>
                  <Input value={formData.origin_country} onChange={(event) => handleInputChange('origin_country', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination City</label>
                  <Input value={formData.destination_city} onChange={(event) => handleInputChange('destination_city', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Destination Country</label>
                  <Input value={formData.destination_country} onChange={(event) => handleInputChange('destination_country', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Shipped Date</label>
                  <Input type="date" value={formData.shipped_date} onChange={(event) => handleInputChange('shipped_date', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Estimated Arrival</label>
                  <Input type="date" value={formData.estimated_arrival} onChange={(event) => handleInputChange('estimated_arrival', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Package Count</label>
                  <Input type="number" min="1" value={formData.package_count} onChange={(event) => handleInputChange('package_count', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                  <Input type="number" min="0" step="0.1" value={formData.weight_kg} onChange={(event) => handleInputChange('weight_kg', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Total Cost</label>
                  <Input type="number" min="0" step="0.01" value={formData.total_cost} onChange={(event) => handleInputChange('total_cost', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Amount Paid</label>
                  <Input type="number" min="0" step="0.01" value={formData.amount_paid} onChange={(event) => handleInputChange('amount_paid', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Currency</label>
                  <Input value={formData.currency} onChange={(event) => handleInputChange('currency', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Assigned Member</label>
                  <Select value={formData.group_member_id} onValueChange={(value) => handleInputChange('group_member_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={unassignedMemberValue}>Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>{member.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea rows={4} value={formData.description} onChange={(event) => handleInputChange('description', event.target.value)} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <Textarea rows={4} value={formData.notes} onChange={(event) => handleInputChange('notes', event.target.value)} />
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
                  {isSubmitting ? 'Saving...' : 'Save Shipment'}
                </Button>
                <Link href={`/shipments/${shipmentId}`}>
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
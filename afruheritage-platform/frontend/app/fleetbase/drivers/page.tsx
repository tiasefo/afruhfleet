'use client'

import { useEffect, useState } from 'react'
import { fleetbaseTenantApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Truck, User, Phone, MapPin, Car, AlertCircle } from 'lucide-react'

interface Driver {
  uuid?: string
  id?: string
  public_id?: string
  name?: string
  phone?: string
  email?: string
  city?: string
  country?: string
  online?: boolean
  status?: string
  vehicle_uuid?: string
  vehicle_name?: string
  vehicle?: { name?: string; plate_number?: string }
  user?: { name?: string; phone?: string; email?: string }
  created_at?: string
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    country: 'GH',
    status: 'active',
  })

  const loadDrivers = async () => {
    setLoading(true)
    setError('')
    try {
      const res: any = await fleetbaseTenantApi.listDrivers()
      // Fleetbase returns drivers in various formats
      const data = Array.isArray(res) ? res : res.drivers || res.data || []
      setDrivers(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load drivers. Ensure your Fleetbase runtime is provisioned.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrivers()
  }, [])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await fleetbaseTenantApi.createDriver({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        status: form.status,
      })
      setShowCreate(false)
      setForm({ name: '', phone: '', email: '', city: '', country: 'GH', status: 'active' })
      await loadDrivers()
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to create driver')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleetbase Drivers</h1>
          <p className="text-gray-600">Manage drivers in your Fleetbase FleetOps</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Driver</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kwame Mensah" />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 20 123 4567" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="driver@company.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Accra" />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="GH" />
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={saving || !form.name || !form.phone} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Driver
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Fleetbase not fully provisioned</p>
            <p className="text-sm text-yellow-700">{error}</p>
            <p className="text-sm text-yellow-700 mt-1">Your Fleetbase runtime may still be initializing. Contact support if this persists.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-xs text-gray-600">Total Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drivers.filter((d) => d.online).length}</p>
                <p className="text-xs text-gray-600">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Car className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drivers.filter((d) => d.vehicle_uuid || d.vehicle).length}</p>
                <p className="text-xs text-gray-600">With Vehicle</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(drivers.map((d) => d.city).filter(Boolean)).size}</p>
                <p className="text-xs text-gray-600">Cities</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="mx-auto h-10 w-10 mb-3" />
              <p className="font-medium">No drivers yet</p>
              <p className="text-sm mt-1">Add your first driver to start managing your fleet.</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Driver
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="p-3 font-medium">Driver</th>
                    <th className="p-3 font-medium">Contact</th>
                    <th className="p-3 font-medium">Location</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Vehicle</th>
                    <th className="p-3 font-medium">Public ID</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.uuid || driver.public_id || driver.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                            {(driver.name || driver.user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{driver.name || driver.user?.name || 'Unnamed'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3 w-3" />
                          {driver.phone || driver.user?.phone || '—'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {[driver.city, driver.country].filter(Boolean).join(', ') || '—'}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={driver.online ? 'default' : 'secondary'}>
                          {driver.online ? 'Online' : driver.status || 'Offline'}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-600">
                        {driver.vehicle_name || driver.vehicle?.name || 'Not assigned'}
                      </td>
                      <td className="p-3 text-gray-500 font-mono text-xs">
                        {driver.public_id || driver.uuid?.slice(0, 8) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

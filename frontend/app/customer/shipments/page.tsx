'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, Search } from 'lucide-react'

interface Shipment {
  id: string
  tracking_number: string
  status: string
  origin: string
  destination: string
  weight?: number
  description?: string
  created_at: string
}

export default function CustomerShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [newShipment, setNewShipment] = useState({
    tracking_number: '',
    origin: '',
    destination: '',
    weight: '',
    description: '',
  })

  useEffect(() => {
    loadShipments()
  }, [])

  const loadShipments = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/v1/customer/shipments', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setShipments(Array.isArray(data) ? data : data.shipments || [])
      }
    } catch (error) {
      console.error('Failed to load shipments:', error)
    } finally {
      setLoading(false)
    }
  }

  const createShipment = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/v1/customer/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tracking_number: newShipment.tracking_number,
          origin: newShipment.origin,
          destination: newShipment.destination,
          weight: newShipment.weight ? parseFloat(newShipment.weight) : undefined,
          description: newShipment.description,
        }),
      })
      if (res.ok) {
        setShowCreateDialog(false)
        setNewShipment({ tracking_number: '', origin: '', destination: '', weight: '', description: '' })
        loadShipments()
      }
    } catch (error) {
      console.error('Failed to create shipment:', error)
    }
  }

  const filteredShipments = shipments.filter(
    (s) =>
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Shipments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track your shipments.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Shipment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Shipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={newShipment.tracking_number}
                  onChange={(e) => setNewShipment({ ...newShipment, tracking_number: e.target.value })}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={newShipment.origin}
                    onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={newShipment.destination}
                    onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={newShipment.weight}
                  onChange={(e) => setNewShipment({ ...newShipment, weight: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newShipment.description}
                  onChange={(e) => setNewShipment({ ...newShipment, description: e.target.value })}
                  placeholder="Goods description"
                />
              </div>
              <Button onClick={createShipment} className="w-full">
                Create Shipment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>Shipments</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking #</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    {searchQuery ? 'No shipments found' : 'No shipments yet. Create your first shipment.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono text-sm">{shipment.tracking_number}</TableCell>
                    <TableCell>{shipment.origin}</TableCell>
                    <TableCell>{shipment.destination}</TableCell>
                    <TableCell>{shipment.weight ? `${shipment.weight} kg` : '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{shipment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(shipment.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, X } from "lucide-react"

interface NewArrival {
  id: string
  tenant_id: string
  name: string
  description: string | null
  image_url: string | null
  price: number | null
  currency: string
  stock_quantity: number
  status: string
  featured: boolean
  display_order: number
  available_from: string | null
  available_until: string | null
  created_at: string
  updated_at: string
}

interface NewArrivalsDrawerProps {
  tenantId: string
  trigger?: React.ReactNode
}

export function NewArrivalsDrawer({ tenantId, trigger }: NewArrivalsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [arrivals, setArrivals] = useState<NewArrival[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingArrival, setEditingArrival] = useState<NewArrival | null>(null)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    currency: "GHS",
    stock_quantity: "0",
    status: "active",
    featured: false,
    display_order: "0",
    available_from: "",
    available_until: "",
  })

  const loadArrivals = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/new-arrivals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setArrivals(data)
      }
    } catch (err) {
      console.error("Failed to load arrivals:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadArrivals()
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const payload = {
        ...formData,
        price: formData.price ? parseInt(formData.price) : null,
        stock_quantity: parseInt(formData.stock_quantity),
        display_order: parseInt(formData.display_order),
        available_from: formData.available_from || null,
        available_until: formData.available_until || null,
        tenant_id: editingArrival ? undefined : tenantId,
      }

      const url = editingArrival 
        ? `/api/v1/new-arrivals/${editingArrival.id}`
        : '/api/v1/new-arrivals'
      
      const method = editingArrival ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await loadArrivals()
        setShowForm(false)
        setEditingArrival(null)
        resetForm()
      }
    } catch (err) {
      console.error("Failed to save arrival:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this arrival?")) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/new-arrivals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await loadArrivals()
      }
    } catch (err) {
      console.error("Failed to delete arrival:", err)
    }
  }

  const handleEdit = (arrival: NewArrival) => {
    setEditingArrival(arrival)
    setFormData({
      name: arrival.name,
      description: arrival.description || "",
      image_url: arrival.image_url || "",
      price: arrival.price?.toString() || "",
      currency: arrival.currency,
      stock_quantity: arrival.stock_quantity.toString(),
      status: arrival.status,
      featured: arrival.featured,
      display_order: arrival.display_order.toString(),
      available_from: arrival.available_from?.split('T')[0] || "",
      available_until: arrival.available_until?.split('T')[0] || "",
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      price: "",
      currency: "GHS",
      stock_quantity: "0",
      status: "active",
      featured: false,
      display_order: "0",
      available_from: "",
      available_until: "",
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingArrival(null)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Manage New Arrivals
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage New Arrivals</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GHS">GHS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                />
                <Label htmlFor="featured">Featured</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="available_from">Available From</Label>
                  <Input
                    id="available_from"
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="available_until">Available Until</Label>
                  <Input
                    id="available_until"
                    type="date"
                    value={formData.available_until}
                    onChange={(e) => setFormData({ ...formData, available_until: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingArrival ? 'Update' : 'Create'} Arrival
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="mb-4">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Arrival
                </Button>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : arrivals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No new arrivals yet. Click "Add New Arrival" to create your first arrival.
                </div>
              ) : (
                <div className="space-y-4">
                  {arrivals.map((arrival) => (
                    <div key={arrival.id} className="border rounded-lg p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{arrival.name}</h3>
                          {arrival.featured && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              Featured
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            arrival.status === 'active' ? 'bg-green-100 text-green-800' :
                            arrival.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {arrival.status}
                          </span>
                        </div>
                        {arrival.description && (
                          <p className="text-sm text-muted-foreground mb-2">{arrival.description}</p>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {arrival.price && (
                            <span>Price: {arrival.currency} {arrival.price / 100} | </span>
                          )}
                          <span>Stock: {arrival.stock_quantity} | </span>
                          <span>Order: {arrival.display_order}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(arrival)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(arrival.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

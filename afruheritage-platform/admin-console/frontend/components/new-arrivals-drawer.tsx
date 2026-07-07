"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Save, Plus, Trash2, Edit, Loader2, Upload, X } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface NewArrival {
  id: string
  name: string
  description: string
  image_url: string
  price: number
  stock_quantity: number
  status: string
  featured: boolean
  display_order: number
  created_at: string
}

interface NewArrivalsDrawerProps {
  tenantId: string
  trigger?: React.ReactNode
}

export function NewArrivalsDrawer({ tenantId, trigger }: NewArrivalsDrawerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [arrivals, setArrivals] = useState<NewArrival[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: 0,
    stock_quantity: 0,
    status: "available",
    featured: false,
    display_order: 0,
  })

  const loadArrivals = async () => {
    setLoading(true)
    try {
      const data = await api.get("/new-arrivals")
      setArrivals(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error("Failed to load new arrivals: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadArrivals()
    }
  }, [open])

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      image_url: "",
      price: 0,
      stock_quantity: 0,
      status: "available",
      featured: false,
      display_order: 0,
    })
    setEditingId(null)
    setImageFile(null)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await api.post("/new-arrivals", form)
      toast.success("New arrival created successfully")
      resetForm()
      loadArrivals()
    } catch (e: any) {
      toast.error("Failed to create new arrival: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return

    setSaving(true)
    try {
      await api.patch(`/new-arrivals/${editingId}`, form)
      toast.success("New arrival updated successfully")
      resetForm()
      loadArrivals()
    } catch (e: any) {
      toast.error("Failed to update new arrival: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/new-arrivals/${id}`)
      toast.success("New arrival deleted successfully")
      loadArrivals()
    } catch (e: any) {
      toast.error("Failed to delete new arrival: " + e.message)
    }
  }

  const handleEdit = (arrival: NewArrival) => {
    setForm({
      name: arrival.name,
      description: arrival.description,
      image_url: arrival.image_url,
      price: arrival.price,
      stock_quantity: arrival.stock_quantity,
      status: arrival.status,
      featured: arrival.featured,
      display_order: arrival.display_order,
    })
    setEditingId(arrival.id)
  }

  const handleImageUpload = async () => {
    if (!imageFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", imageFile)

      const data = await api.post("/new-arrivals/upload", formData)

      setForm({ ...form, image_url: data.url })
      toast.success("Image uploaded successfully")
      setImageFile(null)
    } catch (e: any) {
      toast.error("Failed to upload image: " + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Package className="h-4 w-4 mr-1" />
            New Arrivals
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Arrivals Management</SheetTitle>
          <SheetDescription>
            Add, edit, or remove new arrivals from your storefront
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{editingId ? "Edit New Arrival" : "Add New Arrival"}</span>
                {editingId && (
                  <Button size="sm" variant="ghost" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label>Price (GHS) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Product description"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Stock Quantity</Label>
                  <Input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="available">Available</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="pre_order">Pre-Order</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={form.featured}
                    onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
              </div>

              <div>
                <Label>Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="h-10 w-10 rounded border object-cover"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Upload Image</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    size="sm"
                    onClick={handleImageUpload}
                    disabled={!imageFile || uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={saving || !form.name}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : editingId ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingId ? "Update" : "Add"} New Arrival
              </Button>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current New Arrivals ({arrivals.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : arrivals.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No new arrivals yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {arrivals.map((arrival) => (
                    <div
                      key={arrival.id}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className="h-16 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                        {arrival.image_url ? (
                          <img
                            src={arrival.image_url}
                            alt={arrival.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{arrival.name}</p>
                          {arrival.featured && (
                            <Badge variant="secondary" className="shrink-0">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          GHS {arrival.price.toFixed(2)} · {arrival.stock_quantity} in stock
                        </p>
                        <Badge
                          variant={
                            arrival.status === "available" ? "default" : "secondary"
                          }
                          className="mt-1"
                        >
                          {arrival.status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(arrival)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(arrival.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

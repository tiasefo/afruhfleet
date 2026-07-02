'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { productsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { BackButton } from '@/components/back-button'
import { Loader2, Package, Plus, Trash2, Pencil, ImagePlus } from 'lucide-react'

export default function ProductsPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    short_description: '',
    price: '',
    sku: '',
    stock_quantity: 0,
    images: [] as string[],
    videos: [] as string[],
    is_available: true,
    is_featured: false,
    category_id: '',
    tags: '',
  })

  const load = async () => {
    setIsLoading(true)
    try {
      const [prodData, catData] = await Promise.all([
        productsApi.list(),
        productsApi.listCategories(),
      ])
      setProducts(Array.isArray(prodData) ? prodData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      short_description: '',
      price: '',
      sku: '',
      stock_quantity: 0,
      images: [],
      videos: [],
      is_available: true,
      is_featured: false,
      category_id: '',
      tags: '',
    })
    setEditingProduct(null)
  }

  const handleSubmit = async () => {
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      images: form.images.filter(Boolean),
      videos: form.videos.filter(Boolean),
    }
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload)
      } else {
        await productsApi.create(payload)
      }
      setDialogOpen(false)
      resetForm()
      load()
    } catch (e: any) {
      alert(e.message || 'Failed to save product')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsApi.delete(id)
      load()
    } catch (e: any) {
      alert(e.message || 'Failed to delete')
    }
  }

  const startEdit = (p: any) => {
    setEditingProduct(p)
    setForm({
      name: p.name || '',
      description: p.description || '',
      short_description: p.short_description || '',
      price: String(p.price || ''),
      sku: p.sku || '',
      stock_quantity: p.stock_quantity || 0,
      images: p.images || [],
      videos: p.videos || [],
      is_available: p.is_available ?? true,
      is_featured: p.is_featured ?? false,
      category_id: p.category_id || '',
      tags: p.tags || '',
    })
    setDialogOpen(true)
  }

  return (
  <>
    <BackButton fallback="/" />
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6" style={{ color: branding?.primary_color || '#0ea5e9' }} />
              Products
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your storefront catalog</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Short description (max 500 chars)" value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} />
                <textarea
                  placeholder="Full description"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm min-h-[80px]"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Price (GHS)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                  <Input placeholder="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Stock quantity" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} />
                  <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
                </div>
                <Input
                  placeholder="Image URLs (comma separated)"
                  value={form.images.join(', ')}
                  onChange={e => setForm({ ...form, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_available} onChange={e => setForm({ ...form, is_available: e.target.checked })} />
                    Available
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
                    Featured
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSubmit}>{editingProduct ? 'Update' : 'Create'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No products yet</h3>
              <p className="text-sm text-gray-500 mb-6">Add your first product to start selling.</p>
              <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-2 flex items-center justify-center">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    <div className="flex gap-1">
                      {p.is_featured && <Badge className="bg-orange-100 text-orange-700">Featured</Badge>}
                      {!p.is_available && <Badge variant="secondary">Unavailable</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">{p.short_description || p.description || 'No description'}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">GHS {p.price}</span>
                    <span className="text-xs text-gray-500">Stock: {p.stock_quantity}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(p)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}

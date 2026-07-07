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
import { Image as ImageIcon, Save, Plus, Trash2, Edit, Loader2, Upload, X, Play } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface GalleryItem {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  order: number
  active: boolean
  created_at: string
}

interface GalleryDrawerProps {
  tenantId: string
  trigger?: React.ReactNode
}

export function GalleryDrawer({ tenantId, trigger }: GalleryDrawerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [items, setItems] = useState<GalleryItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  
  const [form, setForm] = useState({
    media_url: "",
    media_type: "image",
    caption: "",
    order: 0,
    active: true,
  })

  const loadGallery = async () => {
    setLoading(true)
    try {
      const data = await api.get("/gallery")
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error("Failed to load gallery: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadGallery()
    }
  }, [open])

  const resetForm = () => {
    setForm({
      media_url: "",
      media_type: "image",
      caption: "",
      order: 0,
      active: true,
    })
    setEditingId(null)
    setMediaFile(null)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await api.post("/gallery", form)
      toast.success("Gallery item added successfully")
      resetForm()
      loadGallery()
    } catch (e: any) {
      toast.error("Failed to add gallery item: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId) return

    setSaving(true)
    try {
      await api.patch(`/gallery/${editingId}`, form)
      toast.success("Gallery item updated successfully")
      resetForm()
      loadGallery()
    } catch (e: any) {
      toast.error("Failed to update gallery item: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/gallery/${id}`)
      toast.success("Gallery item deleted successfully")
      loadGallery()
    } catch (e: any) {
      toast.error("Failed to delete gallery item: " + e.message)
    }
  }

  const handleEdit = (item: GalleryItem) => {
    setForm({
      media_url: item.media_url,
      media_type: item.media_type,
      caption: item.caption || "",
      order: item.order,
      active: item.active,
    })
    setEditingId(item.id)
  }

  const handleMediaUpload = async () => {
    if (!mediaFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", mediaFile)
      formData.append("media_type", form.media_type)

      const data = await api.post("/gallery/upload", formData)

      setForm({ ...form, media_url: data.url })
      toast.success("Media uploaded successfully")
      setMediaFile(null)
    } catch (e: any) {
      toast.error("Failed to upload media: " + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm">
            <ImageIcon className="h-4 w-4 mr-1" />
            Gallery
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gallery Management</SheetTitle>
          <SheetDescription>
            Add, edit, or remove photos and videos from your storefront gallery
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{editingId ? "Edit Gallery Item" : "Add Gallery Item"}</span>
                {editingId && (
                  <Button size="sm" variant="ghost" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Media Type</Label>
                <select
                  value={form.media_type}
                  onChange={(e) => setForm({ ...form, media_type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <Label>Media URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.media_url}
                    onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                    placeholder="https://example.com/media.jpg"
                  />
                  {form.media_url && form.media_type === "image" && (
                    <img
                      src={form.media_url}
                      alt="Preview"
                      className="h-10 w-10 rounded border object-cover"
                    />
                  )}
                  {form.media_url && form.media_type === "video" && (
                    <div className="h-10 w-10 rounded border flex items-center justify-center bg-muted">
                      <Play className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Upload Media</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept={form.media_type === "video" ? "video/*" : "image/*"}
                    onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  />
                  <Button
                    size="sm"
                    onClick={handleMediaUpload}
                    disabled={!mediaFile || uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Caption</Label>
                <Textarea
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="Image or video caption"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={saving || !form.media_url}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : editingId ? (
                  <Save className="h-4 w-4 mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingId ? "Update" : "Add"} Gallery Item
              </Button>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gallery Items ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No gallery items yet</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="relative rounded-lg border overflow-hidden group"
                    >
                      <div className="aspect-square bg-muted">
                        {item.media_type === "video" ? (
                          <div className="flex h-full w-full items-center justify-center bg-black/50">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        ) : item.media_url ? (
                          <img
                            src={item.media_url}
                            alt={item.caption || "Gallery item"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {item.media_type === "video" && (
                        <Badge className="absolute top-2 right-2" variant="secondary">
                          Video
                        </Badge>
                      )}
                      {!item.active && (
                        <Badge className="absolute top-2 left-2" variant="destructive">
                          Inactive
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <p className="text-xs text-white line-clamp-1">{item.caption}</p>
                        </div>
                      )}
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

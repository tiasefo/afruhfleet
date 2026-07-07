'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  Edit,
  MoveUp,
  MoveDown,
  Upload,
  MessageCircle,
  Save,
} from 'lucide-react'

interface GalleryPost {
  id: string
  tenant_id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  order: number
  active: boolean
  created_at: string
  updated_at: string
}

export default function GalleryPage() {
  const tenant = useTenant()
  const [posts, setPosts] = useState<GalleryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<GalleryPost | null>(null)
  const [uploading, setUploading] = useState(false)
  const [whatsappUrl, setWhatsappUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [form, setForm] = useState({
    media_url: '',
    media_type: 'image' as 'image' | 'video',
    caption: '',
    order: 0,
  })

  useEffect(() => {
    loadPosts()
    loadWhatsappSettings()
  }, [])

  const loadWhatsappSettings = async () => {
    try {
      const data = await api.get('/api/v1/tenants/me')
      setWhatsappUrl(data.whatsapp_channel_url || '')
    } catch (error) {
      console.error('Failed to load WhatsApp settings')
    }
  }

  const handleSaveWhatsappSettings = async () => {
    setSavingSettings(true)
    try {
      const data = await api.get('/api/v1/tenants/me')
      await api.patch(`/api/v1/tenants/${data.id}`, {
        whatsapp_channel_url: whatsappUrl,
      })
      toast.success('WhatsApp channel saved successfully')
    } catch (error) {
      toast.error('Failed to save WhatsApp channel')
    } finally {
      setSavingSettings(false)
    }
  }

  const loadPosts = async () => {
    try {
      const data = await api.get('/api/v1/gallery')
      setPosts(data)
    } catch (error) {
      toast.error('Failed to load gallery posts')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await api.post('/api/v1/gallery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      setForm({
        ...form,
        media_url: response.media_url,
        media_type: response.media_type,
      })
      toast.success('File uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingPost) {
        await api.patch(`/api/v1/gallery/${editingPost.id}`, {
          caption: form.caption,
          order: form.order,
          active: true,
        })
        toast.success('Post updated successfully')
      } else {
        await api.post('/api/v1/gallery', {
          media_url: form.media_url,
          media_type: form.media_type,
          caption: form.caption,
          order: form.order,
        })
        toast.success('Post created successfully')
      }
      setDialogOpen(false)
      setEditingPost(null)
      setForm({ media_url: '', media_type: 'image', caption: '', order: 0 })
      loadPosts()
    } catch (error) {
      toast.error('Failed to save post')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    try {
      await api.delete(`/api/v1/gallery/${id}`)
      toast.success('Post deleted successfully')
      loadPosts()
    } catch (error) {
      toast.error('Failed to delete post')
    }
  }

  const handleMoveUp = async (post: GalleryPost) => {
    const newOrder = post.order - 1
    if (newOrder < 0) return
    try {
      await api.patch(`/api/v1/gallery/${post.id}`, { order: newOrder })
      loadPosts()
    } catch (error) {
      toast.error('Failed to reorder post')
    }
  }

  const handleMoveDown = async (post: GalleryPost) => {
    const newOrder = post.order + 1
    try {
      await api.patch(`/api/v1/gallery/${post.id}`, { order: newOrder })
      loadPosts()
    } catch (error) {
      toast.error('Failed to reorder post')
    }
  }

  const openEditDialog = (post: GalleryPost) => {
    setEditingPost(post)
    setForm({
      media_url: post.media_url,
      media_type: post.media_type,
      caption: post.caption || '',
      order: post.order,
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingPost(null)
    setForm({ media_url: '', media_type: 'image', caption: '', order: posts.length })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gallery Manager</h1>
          <p className="text-muted-foreground">Manage your community gallery posts</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Post
        </Button>
      </div>

      {/* WhatsApp Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Channel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>WhatsApp Channel URL</Label>
              <Input
                placeholder="https://whatsapp.com/channel/..."
                value={whatsappUrl}
                onChange={(e) => setWhatsappUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Add your WhatsApp channel link to display it on the public gallery page
              </p>
            </div>
            <Button onClick={handleSaveWhatsappSettings} disabled={savingSettings}>
              <Save className="mr-2 h-4 w-4" />
              {savingSettings ? 'Saving...' : 'Save WhatsApp Channel'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No gallery posts yet</p>
            <Button onClick={openCreateDialog} className="mt-4">
              Create your first post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {post.media_type === 'video' ? (
                  <Video className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground" />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.caption || 'Gallery post'}
                    className="w-full h-full object-cover"
                  />
                )}
                <Badge className="absolute top-2 right-2">
                  {post.media_type === 'video' ? 'Video' : 'Image'}
                </Badge>
              </div>
              <CardContent className="p-4">
                {post.caption && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.caption}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveUp(post)}
                      disabled={post.order === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveDown(post)}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Media File</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                )}
              </div>
              {form.media_url && (
                <p className="text-xs text-muted-foreground">
                  Uploaded: {form.media_url}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Textarea
                value={form.caption}
                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                placeholder="Add a caption for this post..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSave}
              disabled={!form.media_url || uploading}
            >
              {editingPost ? 'Update Post' : 'Create Post'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

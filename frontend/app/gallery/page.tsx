'use client'

import { useEffect, useState } from 'react'
import { useTenant } from '@/components/tenant-context-provider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Video, Calendar, MessageCircle, ExternalLink } from 'lucide-react'

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

export default function PublicGalleryPage() {
  const tenant = useTenant()
  const [posts, setPosts] = useState<GalleryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [whatsappUrl, setWhatsappUrl] = useState('')

  useEffect(() => {
    loadPosts()
    loadTenantSettings()
  }, [])

  const loadTenantSettings = async () => {
    try {
      const response = await fetch('/api/v1/tenant')
      if (response.ok) {
        const data = await response.json()
        setWhatsappUrl(data.whatsapp_channel_url || '')
      }
    } catch (error) {
      console.error('Failed to load tenant settings:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch(`/api/v1/gallery?active_only=true`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Failed to load gallery posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">
            {tenant?.company_name || 'Gallery'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Updates, news, and moments from our community
          </p>
          {whatsappUrl && (
            <div className="mt-4">
              <Button asChild variant="outline" className="gap-2">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Join our WhatsApp Channel
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {post.media_type === 'video' ? (
                    <div className="flex items-center justify-center h-full">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
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
                    <p className="text-sm mb-3">{post.caption}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Plus, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GalleryPost {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  order: number
  active: boolean
  created_at: string
}

export default function GalleryPage() {
  const [posts, setPosts] = useState<GalleryPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadGallery() {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/v1/gallery', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          setPosts(data)
        }
      } catch (err) {
        console.error("Failed to load gallery:", err)
      } finally {
        setIsLoading(false)
      }
    }
    loadGallery()
  }, [])

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gallery</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your gallery posts and media content.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Post
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Loading gallery...</div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No gallery posts yet. Click "Add Post" to create your first post.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative aspect-square">
                {post.media_type === 'video' ? (
                  <video
                    src={post.media_url}
                    controls
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={post.media_url}
                    alt={post.caption || 'Gallery post'}
                    fill
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100" />
                <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {post.caption && (
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">{post.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

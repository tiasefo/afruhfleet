'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from "@/components/tenant-themes/amooksco-v2/page-header"
import { SiteHeader } from "@/components/tenant-themes/amooksco-v2/site-header"
import { SiteFooter } from "@/components/tenant-themes/amooksco-v2/site-footer"
import { Notices } from "@/components/amooksco-v2/home/notices"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

interface GalleryPost {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  order: number
  active: boolean
}

export function AmooskcoNewArrivals({ theme }: { theme: TenantPublicTheme }) {
  const [galleryPosts, setGalleryPosts] = useState<GalleryPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadGalleryPosts() {
      try {
        const res = await fetch('/api/v1/gallery')
        if (res.ok) {
          const data = await res.json()
          setGalleryPosts(data.filter((post: GalleryPost) => post.active).sort((a: GalleryPost, b: GalleryPost) => a.order - b.order))
        }
      } catch (err) {
        console.error('Failed to load gallery posts:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadGalleryPosts()
  }, [])

  return (
    <>
      <SiteHeader theme={theme} />
      <PageHeader
        eyebrow="Warehouse"
        title="New Arrivals"
        description="The latest container arrivals, in-transit shipments and warehouse receiving updates. Check your shipping mark on the updated sheet."
      />
      
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : galleryPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryPosts.map((post) => (
              <div key={post.id} className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="relative aspect-video">
                  <Image
                    src={post.media_url}
                    alt={post.caption || 'Gallery image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                {post.caption && (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">{post.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No new arrivals to display at this time.
          </div>
        )}
      </div>

      <Notices />
      <SiteFooter theme={theme} />
    </>
  )
}

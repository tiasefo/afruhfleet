"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/amooksco-v2/site-header"
import { SiteFooter } from "@/components/amooksco-v2/site-footer"
import { PageHeader } from "@/components/amooksco-v2/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Image as ImageIcon, Play } from "lucide-react"

interface GalleryItem {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  order: number
  active: boolean
  created_at: string
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGallery() {
      try {
        setLoading(true)
        const response = await fetch("/api/v1/gallery")
        if (!response.ok) {
          throw new Error("Failed to fetch gallery")
        }
        const data = await response.json()
        setItems(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Our Gallery"
          title="Photo & Video Gallery"
          description="Browse through our collection of shipments, operations, and success stories"
        />
        
        <div className="mx-auto max-w-7xl px-4 py-12">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
              <p className="text-destructive">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="size-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No gallery items yet</h3>
              <p className="mt-2 text-muted-foreground">
                Check back soon for photos and videos of our operations
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="relative aspect-square bg-muted">
                    {item.media_type === "video" ? (
                      <div className="flex h-full w-full items-center justify-center bg-black/50">
                        <Play className="size-12 text-white" />
                      </div>
                    ) : item.media_url ? (
                      <img
                        src={item.media_url}
                        alt={item.caption || "Gallery item"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="size-12 text-muted-foreground" />
                      </div>
                    )}
                    {item.media_type === "video" && (
                      <Badge className="absolute top-2 right-2" variant="secondary">
                        Video
                      </Badge>
                    )}
                  </div>
                  {item.caption && (
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.caption}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

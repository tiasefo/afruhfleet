"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Package, Loader2, Bell } from "lucide-react"
import type { TenantPublicTheme } from "@/lib/tenant-theme-registry"

interface GalleryPost {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  order: number
  active: boolean
}

export function Gallery({ theme }: { theme: TenantPublicTheme }) {
  const cfg = theme.storefrontConfig
  const galleryCfg = cfg?.gallery
  const apiEndpoint = galleryCfg?.api_endpoint || "/api/v1/gallery"
  const title = galleryCfg?.title || "New Arrivals"
  const description = galleryCfg?.description || "Check out our latest shipments and products fresh from China"

  const [posts, setPosts] = useState<GalleryPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch(apiEndpoint)
        if (res.ok) {
          const data = await res.json()
          const filtered = (data as GalleryPost[])
            .filter((p) => p.active)
            .sort((a, b) => a.order - b.order)
          setPosts(filtered)
        }
      } catch (err) {
        console.error("Failed to load gallery posts:", err)
        setError("Unable to load gallery at this time.")
      } finally {
        setLoading(false)
      }
    }
    loadGallery()
  }, [apiEndpoint])

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: theme.primaryColor }}>
            <Bell className="size-4" /> Latest Arrivals
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin" style={{ color: theme.primaryColor }} />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="size-16 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No new arrivals yet</h3>
            <p className="mt-2 text-muted-foreground">Check back soon for the latest shipments from China</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square bg-muted">
                  {post.media_url ? (
                    <Image
                      src={post.media_url}
                      alt={post.caption || ""}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="size-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {post.caption && (
                  <div className="p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{post.caption}</p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/amooksco-v2/site-header"
import { SiteFooter } from "@/components/amooksco-v2/site-footer"
import { PageHeader } from "@/components/amooksco-v2/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Package } from "lucide-react"

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

export default function NewArrivalsPage() {
  const [arrivals, setArrivals] = useState<NewArrival[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNewArrivals() {
      try {
        setLoading(true)
        const response = await fetch("/api/v1/new-arrivals")
        if (!response.ok) {
          throw new Error("Failed to fetch new arrivals")
        }
        const data = await response.json()
        setArrivals(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchNewArrivals()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageHeader
          eyebrow="Latest Arrivals"
          title="New Arrivals"
          description="Check out our latest shipments and products fresh from China"
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
          ) : arrivals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="size-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No new arrivals yet</h3>
              <p className="mt-2 text-muted-foreground">
                Check back soon for the latest shipments from China
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {arrivals.map((arrival) => (
                <Card key={arrival.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted">
                    {arrival.image_url ? (
                      <img
                        src={arrival.image_url}
                        alt={arrival.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="size-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1">{arrival.name}</CardTitle>
                      {arrival.featured && (
                        <Badge variant="secondary" className="shrink-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {arrival.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          GHS {arrival.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {arrival.stock_quantity} in stock
                        </p>
                      </div>
                      <Badge
                        variant={arrival.status === "available" ? "default" : "secondary"}
                      >
                        {arrival.status}
                      </Badge>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">View Details</Button>
                  </CardFooter>
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

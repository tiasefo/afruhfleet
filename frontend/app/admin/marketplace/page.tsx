'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage marketplace listings, add-ons, and integrations available to tenants.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Marketplace Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No marketplace items to display. Add integrations, add-ons, and services here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

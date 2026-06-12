'use client'

import { ExternalLink, MapPinned, Truck, RadioTower } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getFleetbaseConsoleUrl } from '@/lib/fleetbase-links'

export function AdvancedFleetOpsCard() {
  const openFleetbase = () => {
    window.open(getFleetbaseConsoleUrl(), '_blank', 'noopener,noreferrer')
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <MapPinned className="h-5 w-5" />
          Advanced FleetOps Console
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-blue-800">
          Open the native logistics workspace for Live GPS, dispatch, drivers,
          vehicles, fleets, tracking, routes, and order operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <RadioTower className="h-4 w-4" />
            Live GPS
          </div>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Dispatch
          </div>
          <div className="flex items-center gap-2">
            <MapPinned className="h-4 w-4" />
            Tracking Map
          </div>
        </div>

        <Button onClick={openFleetbase}>
          Open FleetOps Console
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

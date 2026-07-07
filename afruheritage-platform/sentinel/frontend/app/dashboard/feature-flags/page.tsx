'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  SlidersHorizontal,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<any>({})
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/sentinel/feature-flags/global')
      setFlags(data || {})
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (key: string, value: boolean) => {
    try {
      await api.patch('/sentinel/feature-flags/global', { flags: { ...flags, [key]: !value } })
      toast.success('Feature flag updated')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags</h1>
          <p className="mt-1 text-muted-foreground">Manage global feature flags</p>
        </div>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : Object.keys(flags).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No feature flags configured</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(flags).map(([key, value]: [string, any]) => (
            <Card key={key}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {value ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-semibold">{key}</div>
                    <div className="text-sm text-muted-foreground">{typeof value === 'boolean' ? (value ? 'Enabled' : 'Disabled') : String(value)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={value ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'}>
                    {value ? 'Active' : 'Inactive'}
                  </Badge>
                  {typeof value === 'boolean' && (
                    <Button size="sm" variant="outline" onClick={() => handleToggle(key, value)}>
                      {value ? 'Disable' : 'Enable'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

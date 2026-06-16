'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Globe, Search, RefreshCw, CheckCircle2, Shield, AlertTriangle } from 'lucide-react'

export default function DomainsPage() {
  const [tenantId, setTenantId] = useState('')
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [activateOpen, setActivateOpen] = useState(false)
  const [activateDomain, setActivateDomain] = useState('')
  const [activateTenantId, setActivateTenantId] = useState('')
  const [activating, setActivating] = useState(false)

  const lookup = async () => {
    if (!tenantId) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await api.get(`/sentinel/domains/tenant/${tenantId}`)
      setDomains(Array.isArray(data) ? data : (data.items || data.domains || []))
    } catch (e: any) {
      toast.error(e.message)
      setDomains([])
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    try {
      await api.post('/sentinel/domains/activate', {
        tenant_id: activateTenantId,
        domain: activateDomain,
      })
      toast.success('Domain activation initiated')
      setActivateOpen(false)
      setActivateDomain('')
      setActivateTenantId('')
      if (tenantId) lookup()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActivating(false)
    }
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case 'active': case 'verified': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'pending': case 'pending_verification': return <RefreshCw className="h-4 w-4 text-amber-600" />
      case 'ssl_pending': return <Shield className="h-4 w-4 text-blue-600" />
      default: return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending': case 'pending_verification': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'ssl_pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Domains</h1>
          <p className="mt-1 text-muted-foreground">Manage tenant custom domains and SSL</p>
        </div>
        <Button onClick={() => setActivateOpen(true)}>
          <Globe className="mr-2 h-4 w-4" /> Activate Domain
        </Button>
      </div>

      <div className="flex gap-2 max-w-lg">
        <Input
          placeholder="Enter Tenant ID to view domains..."
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
        />
        <Button onClick={lookup} disabled={loading || !tenantId}>
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {searched && !loading && domains.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No domains found for this tenant</CardContent></Card>
      )}

      {domains.length > 0 && (
        <div className="space-y-3">
          {domains.map((d: any, i: number) => (
            <Card key={d.id || i}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(d.status)}
                  <div>
                    <div className="font-semibold">{d.domain || d.hostname}</div>
                    <div className="text-sm text-muted-foreground">
                      {d.verification_method && <span>Verification: {d.verification_method} &middot; </span>}
                      {d.ssl_status && <span>SSL: {d.ssl_status}</span>}
                    </div>
                  </div>
                </div>
                <Badge className={statusColor(d.status)}>{d.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Domain</DialogTitle>
            <DialogDescription>Set up a custom domain for a tenant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Tenant ID</Label>
              <Input value={activateTenantId} onChange={e => setActivateTenantId(e.target.value)} placeholder="Tenant UUID" />
            </div>
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input value={activateDomain} onChange={e => setActivateDomain(e.target.value)} placeholder="freight.example.com" />
            </div>
            <Button className="w-full" onClick={handleActivate} disabled={activating || !activateTenantId || !activateDomain}>
              {activating ? 'Activating...' : 'Activate Domain'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

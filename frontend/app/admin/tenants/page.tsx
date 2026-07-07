'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Plus, Search, Globe, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Tenant {
  id: string
  slug: string
  company_name: string
  subdomain: string
  domain: string
  custom_domain: string | null
  status: string
  created_at: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [editForm, setEditForm] = useState({
    subdomain: '',
    custom_domain: '',
  })

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch('/api/v1/tenants', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTenants(Array.isArray(data) ? data : data.items || [])
      }
    } catch (error) {
      console.error('Failed to load tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditForm({
      subdomain: tenant.subdomain,
      custom_domain: tenant.custom_domain || '',
    })
    setShowEditDialog(true)
  }

  const saveTenant = async () => {
    if (!selectedTenant) return
    try {
      const token = localStorage.getItem('access_token')
      const res = await fetch(`/api/v1/tenants/${selectedTenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        setShowEditDialog(false)
        loadTenants()
      }
    } catch (error) {
      console.error('Failed to update tenant:', error)
    }
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all tenants on the platform. Configure subdomains and custom domains.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Tenant
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Tenant Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Custom Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {searchQuery ? 'No tenants found' : 'No tenants to display.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.company_name}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{tenant.subdomain}.afruheritage.com</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tenant.custom_domain ? (
                        <Badge variant="secondary">{tenant.custom_domain}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tenant.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tenant)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Domain Settings</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div>
                <Label>Company</Label>
                <p className="text-sm font-medium">{selectedTenant.company_name}</p>
              </div>
              <div>
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input
                  id="subdomain"
                  value={editForm.subdomain}
                  onChange={(e) => setEditForm({ ...editForm, subdomain: e.target.value })}
                  placeholder="e.g., amooksco"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Full URL: {editForm.subdomain}.afruheritage.com
                </p>
              </div>
              <div>
                <Label htmlFor="custom-domain">Custom Domain (Optional)</Label>
                <Input
                  id="custom-domain"
                  value={editForm.custom_domain}
                  onChange={(e) => setEditForm({ ...editForm, custom_domain: e.target.value })}
                  placeholder="e.g., logistics.example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Requires DNS configuration (CNAME to afruheritage.com)
                </p>
              </div>
              <Button onClick={saveTenant} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { tenantApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Shield,
  Users,
  Building2,
  CreditCard,
  Server,
  Search,
  Loader2,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const { user, token, isLoading } = useAuth()
  const [tenants, setTenants] = useState<any[]>([])
  const [tenantsLoading, setTenantsLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!isLoading) {
      if (!token) { router.push('/login'); return }
      if (!user?.is_superuser) { router.push('/dashboard'); return }
    }
  }, [isLoading, token, user, router])

  useEffect(() => {
    if (user?.is_superuser && token) {
      loadTenants()
    }
  }, [user, token])

  const loadTenants = async () => {
    setTenantsLoading(true)
    try {
      const data = await tenantApi.getAll({ page: 1, page_size: 50 })
      setTenants(data.items || [])
    } catch (err) {
      console.error('Failed to load tenants', err)
    } finally {
      setTenantsLoading(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user.is_superuser) return null

  const filteredTenants = tenants.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.company_name?.toLowerCase().includes(q) ||
      t.subdomain?.toLowerCase().includes(q) ||
      t.contact_email?.toLowerCase().includes(q)
    )
  })

  const activeTenants = tenants.filter((t) => t.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Admin Console
              </h1>
              <p className="mt-1 text-sm text-gray-500">Superadmin management panel</p>
            </div>
            <Badge className="bg-red-100 text-red-700 border-red-200">Superadmin</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tenants.length}</p>
                  <p className="text-xs text-gray-500">Total Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeTenants}</p>
                  <p className="text-xs text-gray-500">Active Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Billing</p>
                  <p className="text-xs text-gray-500">Credits & Plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Tenants list */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Tenants
              </CardTitle>
              <Button variant="outline" size="sm" onClick={loadTenants} disabled={tenantsLoading}>
                {tenantsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tenants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {tenantsLoading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="py-10 text-center text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>{search ? 'No tenants match your search' : 'No tenants found'}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{tenant.company_name || tenant.subdomain}</p>
                      <p className="text-sm text-gray-500 truncate">{tenant.contact_email || tenant.email}</p>
                      <p className="text-xs text-gray-400 font-mono">{tenant.subdomain}.afruheritage.com</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={tenant.status === 'active' ? 'default' : 'outline'} className="capitalize">
                        {tenant.status || 'unknown'}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/credits?tenant_id=${tenant.id}`}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Credits
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

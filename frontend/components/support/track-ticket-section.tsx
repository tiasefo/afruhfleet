'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Search, Loader2, MessageSquare } from 'lucide-react'
import { useTenant } from '@/components/tenant-context-provider'

export function TrackTicketSection() {
  const tenant = useTenant()
  const supportEmail = tenant?.contact?.support_email || 'support@afruheritage.com'
  const supportPhone = tenant?.contact?.support_phone || '+233 (0) 00 000 0000'
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [tenantId, setTenantId] = useState(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || '')
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim() || !tenantId.trim()) return

    setIsSearching(true)
    router.push(`/support/ticket/${encodeURIComponent(searchValue.trim())}?tenant=${encodeURIComponent(tenantId.trim())}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Track Your Ticket</CardTitle>
          <CardDescription>
            Enter tenant ID and your public ticket token.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="tenant-search">Tenant ID or slug</FieldLabel>
              <Input
                id="tenant-search"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Tenant ID or slug"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ticket-search">Public Ticket Token</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="ticket-search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Public ticket token"
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching || !searchValue.trim() || !tenantId.trim()}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground">Need urgent help?</h3>
          <p className="mt-1 text-sm text-muted-foreground">For critical issues, contact us directly:</p>
          <div className="mt-4 space-y-2">
            <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
              <MessageSquare className="h-4 w-4" />
              {supportEmail}
            </a>
            <a href={`tel:${supportPhone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
              {supportPhone}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

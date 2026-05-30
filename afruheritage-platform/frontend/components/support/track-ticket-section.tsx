'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Search, Loader2, AlertCircle, MessageSquare } from 'lucide-react'
import { resolvePublicTenantId } from '@/lib/tenant'

export function TrackTicketSection() {
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return

    setIsSearching(true)
    setError('')
    const tenantId = resolvePublicTenantId()

    if (!tenantId) {
      setError('Tenant context is missing. Please open support from your tenant domain or add tenant_id in the URL.')
      setIsSearching(false)
      return
    }

    try {
      const res = await fetch(`/api/v1/support-crm/public/tickets/${searchValue.trim()}?tenant_id=${encodeURIComponent(tenantId)}`)
      if (res.status === 404) {
        setError('Ticket not found. Please check your tracking token.')
        return
      }
      if (!res.ok) {
        setError('Failed to look up ticket. Please try again.')
        return
      }
      router.push(`/support/ticket/${searchValue.trim()}`)
    } catch {
      setError('Unable to reach the server. Please check your connection.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Track Your Ticket</CardTitle>
          <CardDescription>
            Enter your tracking token to view ticket status and conversation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="ticket-search">Tracking Token</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="ticket-search"
                  value={searchValue}
                  onChange={(e) => { setSearchValue(e.target.value); setError('') }}
                  placeholder="Paste your tracking token here"
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching || !searchValue.trim()}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Field>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground">Need urgent help?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            For critical issues, contact us directly:
          </p>
          <div className="mt-4 space-y-2">
            <a href="mailto:support@afruheritage.com" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <MessageSquare className="h-4 w-4" />
              support@afruheritage.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

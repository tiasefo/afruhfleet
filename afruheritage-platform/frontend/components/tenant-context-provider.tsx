'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { TenantContext } from '@/lib/tenant-context'
import { getDefaultTenantContext, applyTenantTheme, fetchTenantContextClient } from '@/lib/tenant-context'
import { resolvePublicTenantId, persistTenantId, resolveTenantId, getTenantFromPath } from '@/lib/tenant'

interface TenantContextType {
  tenant: TenantContext
  isLoading: boolean
  error: string | null
}

const TenantContextReact = createContext<TenantContextType | undefined>(undefined)

export function TenantContextProvider({ children, initialTenant }: { children: React.ReactNode; initialTenant?: TenantContext }) {
  const [tenant, setTenant] = useState<TenantContext>(initialTenant || getDefaultTenantContext())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTenantContext()
  }, [])

  const loadTenantContext = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Authenticated sessions must never let a URL ?tenant_id= switch the
      // displayed/stored tenant context — the session tenant is authoritative.
      // Unauthenticated public pages keep the full public resolution order.
      const isAuthed = typeof window !== 'undefined' && !!window.localStorage.getItem('auth_token')
      const tenantId = isAuthed
        ? (getTenantFromPath() || resolveTenantId())
        : resolvePublicTenantId()

      // Fetch the real tenant context from the control plane. No hardcodes.
      if (tenantId) {
        const fetched = await fetchTenantContextClient(tenantId)
        if (fetched) {
          setTenant(fetched)
          applyTenantTheme(fetched)
          // Persist the canonical tenant UUID for API scoping (NOT the slug —
          // backend tenant_id path params authorize against the user's UUID;
          // a slug here caused 403s/500s across members, shipments, billing).
          if (fetched.id && fetched.id !== 'platform' && !isAuthed) {
            persistTenantId(fetched.id)
          }
          return
        }
        setError(`Tenant context not found for "${tenantId}"`)
      }
      
      // Fallback: platform context (no tenant on host, or tenant not found).
      const defaultContext = getDefaultTenantContext()
      setTenant(defaultContext)
      applyTenantTheme(defaultContext)
    } catch (err) {
      console.error('Failed to load tenant context:', err)
      setError('Failed to load tenant context')
      
      // Fallback to default
      const defaultContext = getDefaultTenantContext()
      setTenant(defaultContext)
      applyTenantTheme(defaultContext)
    } finally {
      setIsLoading(false)
    }
  }

  const value: TenantContextType = {
    tenant,
    isLoading,
    error,
  }

  return React.createElement(
    TenantContextReact.Provider,
    { value },
    children
  )
}

export function useTenant(): TenantContextType {
  const context = useContext(TenantContextReact)
  if (context === undefined) {
    throw new Error('useTenant must be used within TenantContextProvider')
  }
  return context
}

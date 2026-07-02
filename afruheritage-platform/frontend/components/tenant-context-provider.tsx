'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { TenantContext } from '@/lib/tenant-context'
import { getDefaultTenantContext, applyTenantTheme } from '@/lib/tenant-context'
import { resolvePublicTenantId } from '@/lib/tenant'

interface TenantContextType {
  tenant: TenantContext
  isLoading: boolean
  error: string | null
}

const TenantContextReact = createContext<TenantContextType | undefined>(undefined)

export function TenantContextProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantContext>(getDefaultTenantContext())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTenantContext()
  }, [])

  const loadTenantContext = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const tenantId = resolvePublicTenantId()
      
      if (tenantId) {
        // Try to fetch tenant context from API
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100'
        const response = await fetch(`${baseUrl}/api/v1/tenant-context/${tenantId}`, {
          cache: 'no-store',
        })
        
        if (response.ok) {
          const tenantData = await response.json()
          setTenant(tenantData)
          applyTenantTheme(tenantData)
          return
        }
      }
      
      // Use default platform context
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

import React from 'react'
import { useTenant } from '@/components/tenant-context-provider'

interface TenantBrandProps {
  className?: string
  showTagline?: boolean
}

export function TenantBrandName({ className = '', showTagline = false }: TenantBrandProps) {
  const tenant = useTenant()
  const name = tenant?.company_name || 'Afruheritage'
  const tagline = tenant?.tagline

  return (
    <div className={className}>
      <span className="font-semibold text-foreground">{name}</span>
      {showTagline && tagline && (
        <span className="block text-sm text-muted-foreground">{tagline}</span>
      )}
    </div>
  )
}

export function TenantTagline({ className = '' }: TenantBrandProps) {
  const tenant = useTenant()
  const tagline = tenant?.tagline || 'AI-powered freight forwarding platform'
  return <span className={className}>{tagline}</span>
}

export function TenantFooterText({ className = '' }: { className?: string }) {
  const tenant = useTenant()
  const year = new Date().getFullYear()
  const companyName = tenant?.company_name || 'Afruheritage'
  const legalName = tenant?.legal?.legal_company_name || companyName
  const footerText = tenant?.legal?.legal_footer_text

  if (footerText) {
    return <span className={className}>{footerText}</span>
  }

  return (
    <span className={className}>
      &copy; {year} {legalName}. All rights reserved.
    </span>
  )
}

import React from 'react'
import { TenantContext } from '@/lib/tenant-context'
import { generateTenantJsonLd } from '@/lib/tenant-metadata'

interface TenantStructuredDataProps {
  tenant: TenantContext | null
  pagePath?: string
}

export function TenantStructuredData({ tenant, pagePath }: TenantStructuredDataProps) {
  const jsonLd = generateTenantJsonLd(tenant, pagePath)
  if (!jsonLd) return null

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

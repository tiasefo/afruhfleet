import React from 'react'
import { TenantContext } from '@/lib/tenant-context'
import { generateThemeStyleTag } from '@/lib/tenant-context-server'

interface TenantThemeInjectorProps {
  tenant: TenantContext | null
}

export function TenantThemeInjector({ tenant }: TenantThemeInjectorProps) {
  if (!tenant) return null

  const styleTag = generateThemeStyleTag(tenant.theme)
  const faviconUrl = tenant.theme.favicon_url

  return (
    <>
      {styleTag && (
        <style dangerouslySetInnerHTML={{ __html: styleTag }} />
      )}
      {faviconUrl && (
        <link rel="icon" href={faviconUrl} />
      )}
    </>
  )
}

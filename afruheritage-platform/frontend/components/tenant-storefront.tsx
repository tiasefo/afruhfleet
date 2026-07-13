"use client"

import { GenericStorefront } from "@/components/generic-storefront"

interface TenantStorefrontProps {
  tenantId: string
}

export default function TenantStorefront({ tenantId: _tenantId }: TenantStorefrontProps) {
  return <GenericStorefront />
}

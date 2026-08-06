import { Loader2 } from 'lucide-react'
import type { ComponentType } from 'react'

// Static map of renderer_key -> real template component loader.
// Imports are resolved at build time; the storefront server component
// picks the right one based on the tenant's selected template_code.
import FreightTemplate from '@/app/templates/freight/page'
import FleetTemplate from '@/app/templates/fleet/page'
import RestaurantTemplate from '@/app/templates/restaurant/page'
import EcommerceTemplate from '@/app/templates/ecommerce/page'
import BookingsTemplate from '@/app/templates/bookings/page'
import MallTemplate from '@/app/templates/mall/page'
import RealEstateTemplate from '@/app/templates/realestate/page'

const templateComponents: Record<string, ComponentType> = {
  freight: FreightTemplate,
  fleet: FleetTemplate,
  restaurant: RestaurantTemplate,
  ecommerce: EcommerceTemplate,
  bookings: BookingsTemplate,
  mall: MallTemplate,
  realestate: RealEstateTemplate,
}

export const SUPPORTED_RENDERER_KEYS = Object.keys(templateComponents)

export function isSupportedRenderer(key: string | null | undefined): boolean {
  return !!key && key in templateComponents
}

interface TemplateRendererProps {
  rendererKey: string
}

/**
 * Renders the real storefront template for a tenant based on the
 * renderer_key stored on the tenant's selected StorefrontTemplate.
 *
 * Returns null when the renderer key is unknown so the caller can
 * fall back to the legacy generic storefront for tenants without a
 * selected template.
 */
export function TemplateRenderer({ rendererKey }: TemplateRendererProps) {
  const Component = templateComponents[rendererKey]
  if (!Component) {
    return null
  }
  return <Component />
}

/**
 * Template Loader
 * Dynamically loads the appropriate storefront template based on tenant's selected template
 */

import { useAuth } from "@/hooks/useAuth"
import { useBranding } from "@/hooks/useBranding"

// Template imports
import AmookscoStorefront from "@/templates/amooksco/app/(store)/page"
import DefaultStorefront from "@/app/storefront/page"

export function useTemplateLoader() {
  const { user } = useAuth()
  const { branding } = useBranding()

  const templateCode = branding?.template_code || "default"

  const getTemplateComponent = () => {
    switch (templateCode) {
      case "amooksco":
        return AmookscoStorefront
      case "freight":
        // Add other templates as they are integrated
        return DefaultStorefront
      default:
        return DefaultStorefront
    }
  }

  return {
    templateCode,
    TemplateComponent: getTemplateComponent(),
  }
}

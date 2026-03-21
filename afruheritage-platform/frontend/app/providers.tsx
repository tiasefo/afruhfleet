'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { TranslationProvider } from '@/hooks/useTranslation'
import { BrandingProvider } from '@/hooks/useBranding'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TranslationProvider>
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </TranslationProvider>
    </AuthProvider>
  )
}

import type { TenantPublicTheme } from '@/lib/tenant-theme-registry'

export function TenantPublicShell({
  children,
  theme,
}: {
  children: React.ReactNode
  theme: TenantPublicTheme
}) {
  return (
    <div
      data-tenant={theme.slug}
      data-theme={theme.themeCode}
      className={`tenant-public tenant-${theme.themeCode}`}
      style={
        {
          '--tenant-primary': theme.primaryColor,
          '--tenant-primary-dark': theme.primaryDarkColor,
          '--tenant-accent': theme.accentColor,
          '--tenant-bg': theme.bgColor,
          '--tenant-text': theme.textColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}

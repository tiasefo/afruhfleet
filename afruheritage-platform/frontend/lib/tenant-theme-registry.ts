export type TenantThemeCode = 'amooksco-v2' | 'default'

export type TenantPublicTheme = {
  slug: string
  themeCode: TenantThemeCode
  basePath: string
  name: string
  logo: string
  primaryColor: string
  accentColor: string
  primaryDarkColor: string
  bgColor: string
  textColor: string
}

export function resolveTenantTheme(slug: string): TenantPublicTheme | null {
  if (slug === 'amooksco-logistics') {
    return {
      slug,
      themeCode: 'amooksco-v2',
      basePath: `/store/${slug}`,
      name: 'AMOOKSCO Logistics',
      logo: '/tenant-assets/amooksco/logo.png',
      primaryColor: '#0f4c81',
      accentColor: '#1e90ff',
      primaryDarkColor: '#073763',
      bgColor: '#f7fbff',
      textColor: '#0f172a',
    }
  }

  return null
}

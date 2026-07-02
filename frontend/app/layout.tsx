import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TenantContextProvider } from '@/components/tenant-context-provider'
import { TenantStructuredData } from '@/components/tenant-structured-data'
import { TenantThemeInjector } from '@/components/tenant-theme-injector'
import { resolveTenantContext, generateTenantMetadata, generateTenantViewport, generateTenantIcons } from '@/lib/tenant-metadata'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenantContext()
  const metadata = generateTenantMetadata(tenant)
  const icons = generateTenantIcons(tenant)
  if (icons) {
    metadata.icons = icons
  }
  return metadata
}

export async function generateViewport(): Promise<Viewport> {
  const tenant = await resolveTenantContext()
  return generateTenantViewport(tenant)
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const tenant = await resolveTenantContext()

  return (
    <html lang={tenant?.default_language || 'en'} className={`${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <TenantThemeInjector tenant={tenant} />
        <TenantStructuredData tenant={tenant} />
        <TenantContextProvider slug={tenant?.slug}>
          <div className="tenant-themed">
            {children}
          </div>
        </TenantContextProvider>
        <Analytics />
      </body>
    </html>
  )
}

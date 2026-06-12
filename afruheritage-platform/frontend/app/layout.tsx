import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from './providers'
import { AppShell } from '@/components/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Afruheritage | AI-Powered Freight Forwarding Platform',
  description: 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain with AI-powered intelligence. Serving Ghana, China, and global trade corridors.',
  keywords: ['freight forwarding', 'logistics', 'shipping', 'cargo', 'Africa', 'Ghana', 'China trade', 'supply chain', 'AI logistics'],
  authors: [{ name: 'Afruheritage' }],
  openGraph: {
    title: 'Afruheritage | AI-Powered Freight Forwarding Platform',
    description: 'The complete logistics platform for Africa. Track shipments, manage cargo, and streamline your supply chain.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1a3a4a' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1f28' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const showAnalytics = process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'

  return (
    <html lang="en" className="font-sans">
      <body className="font-sans antialiased">
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
        {showAnalytics ? <Analytics /> : null}
      </body>
    </html>
  )
}

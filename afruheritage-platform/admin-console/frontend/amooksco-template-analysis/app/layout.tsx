import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AMOOKSCO Logistics — Reliable Freight Forwarding From China To Ghana',
  description:
    'AMOOKSCO Logistics handles China to Ghana freight forwarding: sea cargo, air cargo, China warehouse receiving, procurement, customs support and Ghana delivery. Your goods are in trusted hands.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#0a1f44',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}

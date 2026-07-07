/** @type {import('next').NextConfig} */
const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api:8000'
// For local development, use localhost:8100; for Docker, use api:8000
const rewriteApiOrigin = process.env.NODE_ENV === 'production' 
  ? 'http://api:8000' 
  : 'http://localhost:8100'

const nextConfig = {
  allowedDevOrigins: ['10.0.0.115', 'localhost', '127.0.0.1'],
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Completely disable caching to prevent Cloudflare from caching old content
  generateEtags: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-store, no-cache, must-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'Surrogate-Control',
            value: 'no-store',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  },
  async rewrites() {
    // Always use rewrites for API calls to go through Next.js proxy
    // This ensures consistent behavior across environments
    return [
      {
        source: '/api/v1/:path*',
        destination: `${rewriteApiOrigin}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig

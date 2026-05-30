/** @type {import('next').NextConfig} */
const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api:8000'
const rewriteApiOrigin = configuredApiBase.startsWith('/')
  ? 'http://api:8000'
  : configuredApiBase.replace(/\/api\/v1\/?$/, '')

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
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${rewriteApiOrigin}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig

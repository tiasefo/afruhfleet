/** @type {import('next').NextConfig} */
const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8100'
const rewriteApiOrigin = configuredApiBase.startsWith('/')
  ? 'http://localhost:8100'
  : configuredApiBase.replace(/\/api\/v1\/?$/, '')

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
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

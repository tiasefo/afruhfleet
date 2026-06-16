/** @type {import('next').NextConfig} */
const sentinelApiBase = (process.env.NEXT_PUBLIC_SENTINEL_API_URL || 'http://localhost:9200')
  .replace(/\/sentinel\/?$/, '')
  .replace(/\/$/, '')

const nextConfig = {
  allowedDevOrigins: ['10.0.0.115', 'localhost', '127.0.0.1'],
  typescript: { ignoreBuildErrors: true, tsconfigPath: './tsconfig.json' },
  outputFileTracingRoot: process.cwd(),
  images: { unoptimized: true },
  output: 'export',
  trailingSlash: true,
  basePath: '/sentinel',
  assetPrefix: '/sentinel',
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `${sentinelApiBase}/sentinel/:path*`,
      },
      {
        source: '/api/sentinel/:path*',
        destination: `${sentinelApiBase}/sentinel/:path*`,
      },
      {
        source: '/api/v1/billing/:path*',
        destination: 'http://localhost:8100/api/v1/billing/:path*',
      },
      {
        source: '/api/v1/vendors/:path*',
        destination: 'http://localhost:8100/api/v1/vendors/:path*',
      },
    ]
  },
}
export default nextConfig

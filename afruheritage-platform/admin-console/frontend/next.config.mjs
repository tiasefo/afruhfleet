/** @type {import('next').NextConfig} */
const adminApiBase = (process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:4000')
  .replace(/\/admin\/?$/, '')
  .replace(/\/$/, '')

const nextConfig = {
  allowedDevOrigins: ['10.0.0.115', 'localhost', '127.0.0.1'],
  typescript: { ignoreBuildErrors: true, tsconfigPath: './tsconfig.json' },
  outputFileTracingRoot: process.cwd(),
  images: { unoptimized: true },
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: `${adminApiBase}/admin/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${adminApiBase}/admin/:path*`,
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

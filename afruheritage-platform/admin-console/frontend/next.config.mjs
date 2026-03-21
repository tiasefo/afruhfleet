/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:4000/admin/:path*',
      },
    ]
  },
}
export default nextConfig

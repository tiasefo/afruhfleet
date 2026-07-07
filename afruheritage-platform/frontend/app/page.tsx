import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Ship, ArrowRight, CheckCircle, BarChart3, Users, Shield } from 'lucide-react'

export default function Platform() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600">
            <Ship className="h-10 w-10 text-white" />
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Afruheritage Platform
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Multi-tenant freight forwarding platform for modern logistics businesses
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/login">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Platform Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Ship className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Shipment Tracking</h3>
              <p className="text-gray-600">
                Real-time tracking for all your shipments with detailed status updates
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Comprehensive analytics to monitor your logistics operations
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Team Management</h3>
              <p className="text-gray-600">
                Manage your team members and their access permissions
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <CheckCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Custom Storefronts</h3>
              <p className="text-gray-600">
                Branded storefronts for each tenant with custom domains
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Secure & Compliant</h3>
              <p className="text-gray-600">
                Enterprise-grade security with full compliance and audit trails
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <Ship className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Multi-Tenant</h3>
              <p className="text-gray-600">
                Isolated environments for each tenant with dedicated resources
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mb-8 text-blue-100">
            Join hundreds of businesses already using Afruheritage Platform
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/login">
              Sign In Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2024 Afruheritage Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

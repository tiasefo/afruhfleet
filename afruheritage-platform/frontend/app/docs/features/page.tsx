'use client'

import Link from 'next/link'
import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PackageCheck,
  Contact,
  DollarSign,
  Truck,
  Route,
  Webhook,
  Bell,
  MapPin,
  Zap,
  Smartphone,
  Store,
  CheckCircle2,
  ArrowLeft,
  Shield,
  Users,
  CreditCard,
  Globe,
} from 'lucide-react'

const TIERS = [
  {
    name: 'Trial',
    code: 'trial',
    price: 'Free',
    description: 'Explore the platform with limited usage. Perfect for evaluating Afruheritage before committing.',
    features: [
      'Up to 3 drivers',
      'Up to 3 vehicles',
      'Up to 50 shipments/month',
      'Basic tracking',
      'Email support',
      'Community access',
    ],
    limits: { drivers: 3, vehicles: 3, shipments: 50 },
    color: 'bg-slate-100 border-slate-200',
    badge: 'bg-slate-200 text-slate-700',
  },
  {
    name: 'Pro',
    code: 'pro',
    price: 'GHS 299/month',
    description: 'For growing logistics operations. Unlock dispatch, route planning, and notifications.',
    features: [
      'Up to 20 drivers',
      'Up to 20 vehicles',
      'Unlimited shipments',
      'Proof of Delivery (POD)',
      'Contacts & Places address book',
      'Service Rates auto-pricing',
      'Dispatch Engine',
      'Route Planning',
      'Push / SMS / In-app Notifications',
      'Priority email support',
      'Custom domain (1)',
    ],
    limits: { drivers: 20, vehicles: 20, shipments: 'Unlimited' },
    color: 'bg-sky-50 border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
  },
  {
    name: 'Business',
    code: 'business',
    price: 'GHS 799/month',
    description: 'Enterprise-grade fleet management with full automation and integrations.',
    features: [
      'Unlimited drivers',
      'Unlimited vehicles',
      'Unlimited shipments',
      'Everything in Pro',
      'Webhooks (ERP / Shopify integration)',
      'Route Optimization (AI-powered)',
      'VRP Solver (multi-driver optimization)',
      'Driver Mobile App',
      'Dedicated account manager',
      'Custom domains (unlimited)',
      'SLA guarantee',
    ],
    limits: { drivers: 'Unlimited', vehicles: 'Unlimited', shipments: 'Unlimited' },
    color: 'bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
]

const PHASES = [
  {
    phase: 'Phase 1 — Immediate',
    color: 'bg-green-100 text-green-700',
    features: [
      {
        icon: PackageCheck,
        title: 'Proof of Delivery (POD)',
        what: 'When a driver delivers a shipment, they capture a photo of the package at the destination, collect a digital signature from the recipient, and optionally scan a barcode. This creates legally verifiable proof that delivery occurred.',
        appearance: 'A "Mark as Delivered" button in the shipment detail page opens a camera capture UI (mobile) or file upload (desktop). The signature is drawn with a mouse/touch canvas. POD data (photo URL, signature PNG, timestamp, GPS coords) is stored on the shipment record.',
        utilization: 'Tenants can pull up any shipment and see the delivery photo + signature. Customers get an automated email with the POD. Disputes about "I never got my package" are resolved instantly with photo evidence.',
      },
      {
        icon: Contact,
        title: 'Contacts & Places (Address Book)',
        what: 'A tenant-managed directory of frequently used senders and receivers. Instead of typing "John Doe, 123 Main St, Accra" every time, they pick "John Doe" from a dropdown and the address auto-fills.',
        appearance: 'In the "Create Shipment" form, sender and receiver fields become searchable dropdowns. There is a "Contacts" page in the sidebar to manage the address book.',
        utilization: 'Reduces shipment creation time from 3 minutes to 30 seconds. Prevents address typos. Enables analytics like "How many shipments to John Doe this month?"',
      },
      {
        icon: DollarSign,
        title: 'Service Rates',
        what: 'Zone-based or distance-based pricing rules. Example: "Accra to Kumasi = GHS 25 for packages under 5kg, GHS 40 for 5-10kg." Or "Within Accra = GHS 15 flat rate."',
        appearance: 'In tenant settings, a "Pricing Rules" page where they draw zones on a map or enter city pairs with prices. When creating a shipment, the system auto-calculates the price based on origin/destination and weight.',
        utilization: 'Tenants no longer manually quote customers. The storefront shows "Estimated delivery: GHS 25" automatically. Billing integration charges customers based on these rates.',
      },
    ],
  },
  {
    phase: 'Phase 2 — Short-term',
    color: 'bg-blue-100 text-blue-700',
    features: [
      {
        icon: Truck,
        title: 'Dispatch Engine',
        what: 'Assigning pending shipments to available drivers automatically or manually. A dispatch board showing all unassigned shipments and all available drivers on a map.',
        appearance: 'A "Dispatch" page with a split view: left side = list of unassigned shipments, right side = map of drivers. Drag a shipment onto a driver to assign. Or click "Auto-Dispatch" to let the algorithm assign based on proximity and capacity.',
        utilization: 'A warehouse manager opens the dispatch board every morning, sees 50 pending orders, clicks auto-dispatch, and the system assigns them to 8 drivers optimally. Drivers get push notifications on their phones.',
      },
      {
        icon: Route,
        title: 'Route Planning',
        what: 'Creating a planned route with multiple stops for a single driver. Example: Driver leaves warehouse, stops at 5 pickup locations, then 5 delivery locations, then returns.',
        appearance: 'A map interface where you click to add waypoints. The route is drawn as a connected line. Estimated total time and distance shown. Save the route and assign it to a driver.',
        utilization: 'Used by operations teams for daily delivery runs. Instead of drivers figuring out their own route, the system provides turn-by-turn sequencing.',
      },
      {
        icon: Webhook,
        title: 'Webhooks',
        what: 'When something happens in Afruheritage (shipment created, delivered, status changed), your system sends an HTTP POST to a URL the tenant configured. They use this to integrate with their own ERP, Shopify store, etc.',
        appearance: 'In tenant settings, an "Integrations" page with a Webhook URL field and event type checkboxes.',
        utilization: 'A tenant\'s Shopify store automatically marks an order as "Shipped" when Afruheritage marks the shipment as "Out for Delivery."',
      },
      {
        icon: Bell,
        title: 'Notifications (Push / SMS / In-app)',
        what: 'Sending alerts to drivers and customers when status changes. "Your shipment AFR-12847 is out for delivery." "Driver Kwame has arrived."',
        appearance: 'Notification bell in the app header. SMS sent to customer phone. Push notification on driver mobile app.',
        utilization: 'Reduces "where is my package?" support tickets by 80%. Drivers get instant alerts about new assignments.',
      },
    ],
  },
  {
    phase: 'Phase 3 — Medium-term',
    color: 'bg-purple-100 text-purple-700',
    features: [
      {
        icon: MapPin,
        title: 'Route Optimization (Valhalla)',
        what: 'AI-powered reordering of stops to minimize total driving time/fuel cost. Takes a route with 20 stops and reorders them so the driver drives the shortest possible distance.',
        appearance: 'Same route planning UI, but with an "Optimize" button. Click it, the stops reorder, and a comparison shows "Before: 45km, After: 32km. Save 28% fuel."',
        utilization: 'Large tenants with hundreds of daily stops. Can save 20-30% on fuel costs.',
      },
      {
        icon: Zap,
        title: 'VRP Solver (Vroom)',
        what: 'Vehicle Routing Problem — given 500 deliveries, 10 drivers, vehicle capacity limits, and time windows ("deliver between 9am-12pm"), calculate the optimal assignment of deliveries to drivers and the optimal route for each driver.',
        appearance: 'An "Optimize Fleet" button on the dispatch board. Results in a complete daily plan for all drivers.',
        utilization: 'Enterprise tenants with fleets. Solves in minutes what would take a human dispatcher hours.',
      },
      {
        icon: Smartphone,
        title: 'Driver Mobile App',
        what: 'A dedicated iOS/Android app for drivers to see assigned jobs, mark pickups/deliveries, capture POD, navigate to next stop, and chat with dispatch.',
        appearance: 'App Store / Play Store download. Login with driver credentials. Simple card-based UI showing "Current Job" with map navigation.',
        utilization: 'Every driver uses it. No more phone calls from dispatch. GPS tracking comes from the driver\'s phone.',
      },
    ],
  },
]

const STOREFRONT_PROVISIONING = [
  {
    step: 1,
    title: 'Tenant Registers & Onboards',
    detail: 'A company signs up via the tenant request form. Afruheritage admin reviews and approves the application through Sentinel.',
  },
  {
    step: 2,
    title: 'Fleetbase Runtime Provisioned',
    detail: 'Admin clicks "Launch" in Sentinel. A Celery task queues the provisioning job. The system SSHs into an available runner node and runs flb install-fleetbase to create an isolated Fleetbase instance.',
  },
  {
    step: 3,
    title: 'Tenant Configures Branding',
    detail: 'The tenant logs into their dashboard and sets company name, logo, primary color, accent color, support phone, and support email. These settings are stored in the TenantBranding model.',
  },
  {
    step: 4,
    title: 'Storefront Products Added',
    detail: 'The tenant adds products to their storefront catalog with images, prices, descriptions, and stock quantities. Products are stored per-tenant in the tenant database.',
  },
  {
    step: 5,
    title: 'Public Storefront Live',
    detail: 'The tenant storefront is accessible at /store/{slug} on the main domain or {slug}.afruheritage.com if a custom subdomain is configured. Customers can browse products, track shipments, and submit support tickets.',
  },
]

export default function FeaturesDocumentationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/docs" className="flex items-center gap-1 text-slate-600">
              <ArrowLeft className="h-4 w-4" /> Back to Documentation
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Platform Features & Subscription Tiers</h1>
          <p className="text-slate-600 max-w-3xl">
            A complete guide to Afruheritage capabilities, what each subscription tier includes, and how features are rolled out in phases.
          </p>
        </div>

        {/* Subscription Tiers */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <CreditCard className="h-5 w-5 text-sky-600" />
            Subscription Tiers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <Card key={tier.code} className={`${tier.color} border`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={`${tier.badge} text-[10px]`}>{tier.name}</Badge>
                    <span className="text-sm font-bold">{tier.price}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-3 border-t border-slate-200/60">
                    <p className="text-xs text-slate-500 font-medium">Limits</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-600">
                      <span>Drivers: {tier.limits.drivers}</span>
                      <span>Vehicles: {tier.limits.vehicles}</span>
                      <span>Shipments: {tier.limits.shipments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Phase Features */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Shield className="h-5 w-5 text-sky-600" />
            Feature Phases — What They Mean & How They Appear
          </h2>
          <p className="text-sm text-slate-600">
            Afruheritage rolls out capabilities in three phases. Each feature is globally controlled from Sentinel Control Center and can be enabled per-tenant.
          </p>

          {PHASES.map((phase) => (
            <div key={phase.phase} className="space-y-3">
              <Badge className={`${phase.color} text-xs`}>{phase.phase}</Badge>
              <div className="grid grid-cols-1 gap-3">
                {phase.features.map((feature) => (
                  <Card key={feature.title} className="border-slate-200 bg-white">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <feature.icon className="h-5 w-5 text-sky-600" />
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-slate-600">
                      <p><strong className="text-slate-800">What it is:</strong> {feature.what}</p>
                      <p><strong className="text-slate-800">How it appears:</strong> {feature.appearance}</p>
                      <p><strong className="text-slate-800">How it is utilized:</strong> {feature.utilization}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Storefront Provisioning */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Store className="h-5 w-5 text-sky-600" />
            How the Storefront is Provisioned
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {STOREFRONT_PROVISIONING.map((s) => (
              <Card key={s.step} className="border-slate-200 bg-white">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{s.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{s.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Regular Users */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <Users className="h-5 w-5 text-sky-600" />
            How Regular Users Use the Platform
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-600" />
                  As a Customer (Shipper)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <p>1. Visit the tenant storefront at <code className="bg-muted px-1 rounded">/store/{'{slug}'}</code> or the tenant subdomain.</p>
                <p>2. Browse products, add to cart, and checkout. Or go directly to the tracking widget.</p>
                <p>3. Enter a tracking number to see real-time shipment status, origin/destination, and live GPS coordinates.</p>
                <p>4. Submit a support ticket from the storefront if help is needed. Reference the ticket via public token.</p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sky-600" />
                  As a Tenant Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                <p>1. Log into the tenant dashboard with approved credentials.</p>
                <p>2. Manage shipments: create, assign drivers, track live GPS, and mark deliveries with POD.</p>
                <p>3. Configure branding, team members, pricing rules, and notification preferences in Settings.</p>
                <p>4. Monitor vendor performance, billing wallet, and support tickets from a unified dashboard.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Check,
  Copy,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck,
  LocateFixed,
  PackageSearch,
  Search,
  ShieldCheck,
  Truck,
  UserCircle2,
  Users,
} from 'lucide-react'

import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type FlowStep = {
  title: string
  detail: string
  howTo: string[]
  href: string
  actionLabel: string
  icon: React.ComponentType<{ className?: string }>
}

type FlowCategory = {
  id: string
  label: string
  subtitle: string
  audience: string
  icon: React.ComponentType<{ className?: string }>
  steps: FlowStep[]
}

const categories: FlowCategory[] = [
  {
    id: 'company-tenant',
    label: 'Company Tenant',
    subtitle: 'Create and activate a freight company workspace',
    audience: 'Company founders and operations leads',
    icon: Building2,
    steps: [
      {
        title: 'Submit Tenant Request',
        detail: 'Use the Request Tenant form with your company profile and contact details.',
        howTo: [
          'Open the tenant request page and complete company details.',
          'Add decision-maker contact with a reachable email and phone.',
          'Submit and keep the request reference for status tracking.',
        ],
        href: '/tenant-request',
        actionLabel: 'Open Tenant Request',
        icon: FileCheck,
      },
      {
        title: 'Admin Review',
        detail: 'Platform team validates your request and prepares your tenant environment.',
        howTo: [
          'Support validates your submitted legal and operational information.',
          'Provisioning allocates a tenant workspace and baseline modules.',
          'You receive confirmation with next actions to activate.',
        ],
        href: '/support',
        actionLabel: 'Track Review With Support',
        icon: ShieldCheck,
      },
      {
        title: 'Activate Account',
        detail: 'Sign in, complete onboarding role, and confirm company admin identity.',
        howTo: [
          'Login with your approved email credentials.',
          'Select company admin role in onboarding flow.',
          'Confirm profile details before continuing to workspace setup.',
        ],
        href: '/onboarding',
        actionLabel: 'Complete Onboarding',
        icon: UserCircle2,
      },
      {
        title: 'Pick Plan & Add-ons',
        detail: 'Choose subscription and enable modules like marketplace and GPS tracking.',
        howTo: [
          'Open billing and compare available plans.',
          'Enable add-ons such as marketplace and gps_tracking.',
          'Confirm checkout and verify active subscription status.',
        ],
        href: '/billing',
        actionLabel: 'Configure Billing',
        icon: CreditCard,
      },
      {
        title: 'Configure Workspace',
        detail: 'Set branding, team members, notifications, and support channels.',
        howTo: [
          'Update company profile and branding assets in settings.',
          'Invite dispatch and operations team members.',
          'Set notification preferences for shipment and support events.',
        ],
        href: '/settings',
        actionLabel: 'Open Workspace Settings',
        icon: Users,
      },
      {
        title: 'Go Live',
        detail: 'Start managing shipments and vendor operations from the dashboard.',
        howTo: [
          'Create first shipment workflow and assign team owners.',
          'Enable vendor onboarding and marketplace controls.',
          'Monitor live KPIs from dashboard and iterate SOPs.',
        ],
        href: '/dashboard',
        actionLabel: 'Go To Dashboard',
        icon: CheckCircle2,
      },
    ],
  },
  {
    id: 'vendor-driver',
    label: 'Vendor / Driver',
    subtitle: 'Join marketplace and receive dispatch jobs',
    audience: 'Riders, truck drivers, and delivery partners',
    icon: Truck,
    steps: [
      {
        title: 'Register as Vendor',
        detail: 'Complete vendor profile, vehicle details, and operating region preferences.',
        howTo: [
          'Open vendor page and start registration form.',
          'Provide identity, vehicle, and region coverage details.',
          'Submit registration for review and onboarding queue.',
        ],
        href: '/vendors#vendor-registration',
        actionLabel: 'Start Vendor Registration',
        icon: UserCircle2,
      },
      {
        title: 'Upload KYC Documents',
        detail: 'Submit ID, insurance, and roadworthy files for verification.',
        howTo: [
          'Open KYC area and upload required files clearly.',
          'Ensure document names and ID numbers are consistent.',
          'Submit and wait for validation status update.',
        ],
        href: '/kyc',
        actionLabel: 'Open KYC Center',
        icon: FileCheck,
      },
      {
        title: 'Approval & Availability',
        detail: 'After review, set availability status and current service location.',
        howTo: [
          'Once approved, log into your workspace dashboard.',
          'Set driver availability and preferred service zones.',
          'Confirm location update before accepting work.',
        ],
        href: '/dashboard',
        actionLabel: 'Set Availability',
        icon: CheckCircle2,
      },
      {
        title: 'Find Jobs',
        detail: 'Search nearby open jobs or use driver dashboard to review opportunities.',
        howTo: [
          'Open marketplace and filter by distance and route.',
          'Check pickup and dropoff details before bidding.',
          'Select opportunities with realistic SLA windows.',
        ],
        href: '/marketplace',
        actionLabel: 'Browse Marketplace Jobs',
        icon: PackageSearch,
      },
      {
        title: 'Accept Assignment',
        detail: 'Accept shipment and confirm pickup to begin active tracking.',
        howTo: [
          'Accept the selected shipment from marketplace flow.',
          'Confirm assignment and pickup readiness status.',
          'Update tracking stage from assigned to in-transit.',
        ],
        href: '/marketplace',
        actionLabel: 'Accept A Job',
        icon: ShieldCheck,
      },
      {
        title: 'Send Live GPS Pings',
        detail: 'Update coordinates in transit so shippers see real-time movement history.',
        howTo: [
          'Open shipment tracking panel during active delivery.',
          'Capture location updates at meaningful transit points.',
          'Confirm latest GPS appears in shipment history.',
        ],
        href: '/track',
        actionLabel: 'Open Live Tracking',
        icon: LocateFixed,
      },
    ],
  },
  {
    id: 'shipper-gps',
    label: 'Shipper + GPS Tracking',
    subtitle: 'Book shipment and monitor live delivery status',
    audience: 'Personal shippers and logistics teams',
    icon: PackageSearch,
    steps: [
      {
        title: 'Create Shipment',
        detail: 'Provide pickup/dropoff details, package dimensions, and service notes.',
        howTo: [
          'Open new shipment form and fill route details.',
          'Add package dimensions, fragile flags, and notes.',
          'Submit to publish shipment into operations flow.',
        ],
        href: '/shipments/new',
        actionLabel: 'Create Shipment',
        icon: FileCheck,
      },
      {
        title: 'Driver Discovery',
        detail: 'Marketplace matches available drivers around pickup area.',
        howTo: [
          'Review available drivers returned by marketplace.',
          'Compare distance, fit, and expected response time.',
          'Shortlist preferred vendor for assignment.',
        ],
        href: '/marketplace',
        actionLabel: 'View Driver Match',
        icon: Search,
      },
      {
        title: 'Assignment Confirmed',
        detail: 'Selected driver accepts and shipment status changes to assigned.',
        howTo: [
          'Confirm accepted assignment on shipment detail page.',
          'Notify receiver and internal ops team about ETA.',
          'Track transition from assigned to in-transit.',
        ],
        href: '/shipments',
        actionLabel: 'Open Shipment Board',
        icon: CheckCircle2,
      },
      {
        title: 'Track Live GPS',
        detail: 'View latest coordinates, in-transit status, and distance-to-dropoff updates.',
        howTo: [
          'Open tracking timeline for the active shipment.',
          'Monitor latest latitude and longitude updates.',
          'Use history feed to investigate route deviations.',
        ],
        href: '/track',
        actionLabel: 'Open Tracking Timeline',
        icon: LocateFixed,
      },
      {
        title: 'Review Milestones',
        detail: 'Follow pickup, in-transit, and delivery events from tracking history.',
        howTo: [
          'Check milestone events from shipment activity card.',
          'Validate timestamps for pickup and transit states.',
          'Resolve exceptions before final completion.',
        ],
        href: '/shipments',
        actionLabel: 'Review Milestones',
        icon: BookOpen,
      },
      {
        title: 'Close Delivery',
        detail: 'Mark final completion, reconcile billing, and archive record.',
        howTo: [
          'Mark delivered once receiver confirmation is complete.',
          'Reconcile charges and credits in billing records.',
          'Archive shipment as completed operation.',
        ],
        href: '/billing',
        actionLabel: 'Reconcile Billing',
        icon: CreditCard,
      },
    ],
  },
  {
    id: 'ops-admin',
    label: 'Company Operations Admin',
    subtitle: 'Run fleet operations with team, billing, and support controls',
    audience: 'Company admins and operations coordinators',
    icon: ShieldCheck,
    steps: [
      {
        title: 'Invite Team Members',
        detail: 'Add dispatchers and coordinators with role-aware access.',
        howTo: [
          'Open members page and invite users by email.',
          'Assign role scopes based on operation responsibility.',
          'Confirm activation and first-login completion.',
        ],
        href: '/members',
        actionLabel: 'Invite Team',
        icon: Users,
      },
      {
        title: 'Monitor Shipment Boards',
        detail: 'Track open, assigned, and completed workloads across lanes.',
        howTo: [
          'Use shipment board filters by status and route.',
          'Identify delayed or blocked jobs early.',
          'Reassign work based on team capacity.',
        ],
        href: '/shipments',
        actionLabel: 'Open Shipment Board',
        icon: PackageSearch,
      },
      {
        title: 'Vendor Performance',
        detail: 'Review availability, response time, and delivery outcomes.',
        howTo: [
          'Open vendors page and inspect active profiles.',
          'Review response behavior and completion quality.',
          'Flag underperforming lanes for support follow-up.',
        ],
        href: '/vendors',
        actionLabel: 'Review Vendors',
        icon: Truck,
      },
      {
        title: 'Manage Credits & Plan',
        detail: 'Top up wallet, audit usage, and adjust subscription add-ons.',
        howTo: [
          'Open billing page to view wallet and plan.',
          'Top up credits and monitor usage trends.',
          'Enable or remove add-ons based on demand.',
        ],
        href: '/billing',
        actionLabel: 'Open Billing Controls',
        icon: CreditCard,
      },
      {
        title: 'Resolve Issues',
        detail: 'Use support workflows for exceptions, disputes, or late delivery.',
        howTo: [
          'Create support ticket with shipment and event context.',
          'Track resolution timeline and ownership handoff.',
          'Publish corrected SOP for recurring issues.',
        ],
        href: '/support',
        actionLabel: 'Open Support Workflows',
        icon: BookOpen,
      },
      {
        title: 'Scale Operations',
        detail: 'Expand routes, enable more modules, and standardize SOPs.',
        howTo: [
          'Review dashboard KPIs and identify bottlenecks.',
          'Add routes, vendors, and team members incrementally.',
          'Template repeatable flows to scale safely.',
        ],
        href: '/dashboard',
        actionLabel: 'Scale From Dashboard',
        icon: CheckCircle2,
      },
    ],
  },
]

const sideNav = [
  'Overview',
  'Getting Started',
  'Process Flows',
  'GPS Tracking',
  'Tenant Onboarding',
  'Vendor Operations',
  'Billing & Credits',
  'FAQ',
]

function DocumentationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [copiedStepKey, setCopiedStepKey] = useState<string | null>(null)

  const current = useMemo(
    () => categories.find((c) => c.id === activeCategory) ?? categories[0],
    [activeCategory]
  )

  const simulationSteps = useMemo(() => {
    const start = Math.max(0, Math.min(activeStep, Math.max(0, current.steps.length - 3)))
    return current.steps.slice(start, start + 3)
  }, [activeStep, current.steps])

  useEffect(() => {
    const flow = searchParams.get('flow')
    const step = searchParams.get('step')
    const category = categories.find((c) => c.id === flow)

    if (category && category.id !== activeCategory) {
      setActiveCategory(category.id)
    }

    if (step) {
      const parsed = Number.parseInt(step, 10)
      if (!Number.isNaN(parsed) && parsed >= 1) {
        const stepIndex = Math.min(parsed - 1, (category ?? current).steps.length - 1)
        if (stepIndex !== activeStep) {
          setActiveStep(stepIndex)
        }
      }
    }
  }, [searchParams, activeCategory, current])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('flow', activeCategory)
    params.set('step', String(activeStep + 1))
    router.replace(`/docs?${params.toString()}`, { scroll: false })
  }, [activeCategory, activeStep, router, searchParams])

  useEffect(() => {
    if (!isPlaying || current.steps.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setActiveStep((currentStep) => (currentStep + 1) % current.steps.length)
    }, 1800)

    return () => window.clearInterval(interval)
  }, [isPlaying, current.steps.length])

  useEffect(() => {
    setIsPlaying(false)
  }, [activeCategory])

  function toggleSimulationPlayback() {
    if (current.steps.length <= 1) {
      return
    }

    setIsPlaying((value) => !value)
  }

  async function handleCopyStepLink(stepIndex: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('flow', activeCategory)
    params.set('step', String(stepIndex + 1))

    const absoluteUrl = `${window.location.origin}/docs?${params.toString()}`
    await navigator.clipboard.writeText(absoluteUrl)

    const stepKey = `${activeCategory}-${stepIndex}`
    setCopiedStepKey(stepKey)
    window.setTimeout(() => {
      setCopiedStepKey((currentKey) => (currentKey === stepKey ? null : currentKey))
    }, 1800)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <Card className="sticky top-24 border-slate-200 bg-white">
              <CardContent className="space-y-4 p-4">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Documentation</h1>
                  <p className="mt-1 text-sm text-slate-600">Guided onboarding and process playbooks for every use case.</p>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Search docs..." className="pl-9" />
                </div>

                <nav className="space-y-1">
                  {sideNav.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        item === 'Process Flows'
                          ? 'bg-sky-100 text-sky-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6 lg:col-span-9">
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-slate-900">
                  <BookOpen className="h-6 w-6 text-sky-600" />
                  Getting Started - Process Flows
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Pick your use case and follow a step-by-step flow simulation for GPS tracking, tenant creation, vendor onboarding, and day-to-day operations.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  This documentation workspace runs in read-only simulation mode. It does not perform create, update, or delete operations on production systems.
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {categories.map((category) => {
                    const Icon = category.icon
                    const active = category.id === current.id
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(category.id)
                          setActiveStep(0)
                        }}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          active
                            ? 'border-sky-300 bg-sky-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${active ? 'text-sky-700' : 'text-slate-500'}`} />
                          <span className={`text-sm font-semibold ${active ? 'text-sky-900' : 'text-slate-900'}`}>
                            {category.label}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-600">{category.subtitle}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <current.icon className="h-6 w-6 text-sky-700" />
                  <CardTitle className="text-xl text-slate-900">{current.label} Workflow</CardTitle>
                  <Badge variant="outline" className="border-sky-300 bg-sky-50 text-sky-900">
                    {current.steps.length} Steps
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">Audience: {current.audience}</p>
              </CardHeader>

              <CardContent>
                <div
                  className="mb-6 rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-emerald-50 p-4"
                  role="button"
                  tabIndex={0}
                  onClick={toggleSimulationPlayback}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggleSimulationPlayback()
                    }
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Flow Simulation</p>
                      <p className="text-xs text-slate-500">Click the panel or use the control to play through the sequence.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-sky-300 bg-white/80 text-sky-900">
                        Step {activeStep + 1} of {current.steps.length}
                      </Badge>
                      <Badge variant="outline" className="border-sky-300 bg-white/80 text-sky-900">
                        {isPlaying ? 'Playing' : 'Paused'}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    {simulationSteps.map((step, index) => {
                      const StepIcon = step.icon
                      const absoluteIndex = current.steps.findIndex((s) => s.title === step.title)
                      const isActive = absoluteIndex === activeStep
                      return (
                        <button
                          key={`sim-${step.title}`}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setIsPlaying(false)
                            setActiveStep(absoluteIndex)
                          }}
                          className={`rounded-xl border p-3 text-left shadow-sm transition-colors ${
                            isActive
                              ? 'border-sky-300 bg-sky-100/80'
                              : 'border-white/80 bg-white/80 hover:bg-white'
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <div className="rounded-md bg-sky-100 p-1.5">
                              <StepIcon className="h-4 w-4 text-sky-700" />
                            </div>
                            <span className="text-xs font-semibold text-slate-900">Scene {absoluteIndex + 1}</span>
                          </div>
                          <p className="line-clamp-2 text-xs text-slate-600">{step.title}</p>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-sky-200/70 pt-3">
                    <p className="text-xs text-slate-600">
                      The simulation auto-advances through each scene and loops back to the beginning.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant={isPlaying ? 'default' : 'outline'}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleSimulationPlayback()
                      }}
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {current.steps.map((step, index) => {
                    const StepIcon = step.icon
                    const isActive = index === activeStep
                    const stepKey = `${current.id}-${index}`
                    const copied = copiedStepKey === stepKey
                    return (
                      <div
                        key={step.title}
                        onClick={() => setActiveStep(index)}
                        className={`relative rounded-xl border bg-white p-4 text-left transition-colors ${
                          isActive
                            ? 'border-sky-300 bg-sky-50/60'
                            : 'border-slate-200 hover:border-sky-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <Badge className="bg-slate-900 text-white hover:bg-slate-900">Step {index + 1}</Badge>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              type="button"
                              className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleCopyStepLink(index)
                              }}
                            >
                              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              <span className="ml-1">{copied ? 'Copied' : 'Copy link'}</span>
                            </Button>
                            <StepIcon className="h-5 w-5 text-sky-700" />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="mt-2 text-sm text-slate-600">{step.detail}</p>

                        <details
                          open={isActive}
                          className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <summary className="cursor-pointer list-none font-semibold text-slate-800">
                            How to do this
                          </summary>
                          <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-600">
                            {step.howTo.map((tip) => (
                              <li key={tip}>{tip}</li>
                            ))}
                          </ol>
                        </details>

                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="w-full justify-between" disabled>
                            Simulation only
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {index < current.steps.length - 1 && (
                          <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-400 lg:block" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link href="/support">Need Help</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/track">Try Tracking Demo</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function DocumentationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <DocumentationPageContent />
    </Suspense>
  )
}
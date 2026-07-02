import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BackButton } from '@/components/back-button'
import { AlertTriangle, CheckCircle2, GitBranch, Layers3, ListOrdered, Wrench, Cpu, Database, Globe, Shield, Truck, Users, CreditCard, Zap, Settings, Network, Cloud, Lock, Smartphone } from 'lucide-react'

const ROOT_REPO = 'https://github.com/tiasefo/afruhfleet'
const ROOT_REPO_TREE = 'https://github.com/tiasefo/afruhfleet/tree/main/afruheritage-platform'

const systemComponents = [
  {
    name: 'Control Plane (FastAPI)',
    purpose: 'Core API gateway handling authentication, tenant management, billing, and orchestration.',
    technology: 'FastAPI + PostgreSQL + Redis + Celery',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'API Routes', href: `${ROOT_REPO_TREE}/app/api/routes` },
      { label: 'Core Services', href: `${ROOT_REPO_TREE}/app/services` },
      { label: 'Data Models', href: `${ROOT_REPO_TREE}/app/models` },
    ],
  },
  {
    name: 'Admin Console',
    purpose: 'Internal management interface for tenant operations, billing, KYC, and platform oversight.',
    technology: 'FastAPI + Next.js + PostgreSQL',
    whiteLabel: 'No',
    maintenance: [
      { label: 'Admin API', href: `${ROOT_REPO_TREE}/admin-console/admin_app/api` },
      { label: 'Admin Frontend', href: `${ROOT_REPO_TREE}/admin-console/frontend` },
      { label: 'Security Module', href: `${ROOT_REPO_TREE}/admin-console/admin_app/core/security.py` },
    ],
  },
  {
    name: 'Tenant Portal (Frontend)',
    purpose: 'Customer-facing SaaS interface for shipments, tracking, vendors, and account management.',
    technology: 'Next.js 14 + TypeScript + TailwindCSS',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'App Shell', href: `${ROOT_REPO_TREE}/frontend/components/app-shell.tsx` },
      { label: 'AI Chat Widget', href: `${ROOT_REPO_TREE}/frontend/components/ai-chat-widget.tsx` },
      { label: 'Pages', href: `${ROOT_REPO_TREE}/frontend/app` },
    ],
  },
  {
    name: 'Fleetbase Runtime',
    purpose: 'Per-tenant logistics engine providing shipment lifecycle, driver management, and GPS tracking.',
    technology: 'Laravel + MySQL + Redis + Docker',
    whiteLabel: 'Hidden',
    maintenance: [
      { label: 'Provisioner', href: `${ROOT_REPO_TREE}/app/services/fleetbase_provisioner.py` },
      { label: 'Runtime Service', href: `${ROOT_REPO_TREE}/app/services/fleetbase_runtime_service.py` },
      { label: 'SSH Executor', href: `${ROOT_REPO_TREE}/app/services/runner_executor.py` },
    ],
  },
]

const infrastructureStack = [
  {
    name: 'Container Orchestration',
    components: ['Docker', 'Docker Compose'],
    purpose: 'Service isolation, development parity, and deployment consistency',
    status: 'Active',
  },
  {
    name: 'Database Layer',
    components: ['PostgreSQL 16', 'MySQL 8.0', 'Redis 7'],
    purpose: 'Primary data store, tenant runtime data, caching and session management',
    status: 'Active',
  },
  {
    name: 'Background Processing',
    components: ['Celery', 'Celery Beat'],
    purpose: 'Async tenant provisioning, domain verification, payment processing',
    status: 'Active',
  },
  {
    name: 'AI/ML Infrastructure',
    components: ['Ollama', 'nomic-embed-text', 'RAG Retrieval'],
    purpose: 'Platform knowledge assistant, intelligent search, document retrieval',
    status: 'Active',
  },
  {
    name: 'Network & Security',
    components: ['Cloudflare Tunnel', 'Paramiko SSH', 'JWT Auth'],
    purpose: 'Secure access, runtime provisioning, API authentication',
    status: 'Active',
  },
]

const integrations = [
  {
    name: 'Cloudflare',
    role: 'Custom hostname management, SSL certificates, domain verification',
    status: 'Active',
    endpoints: ['DNS API', 'Origin CA API', 'Zone Management'],
  },
  {
    name: 'Paystack',
    role: 'Payment gateway for subscriptions, wallet credits, and transaction processing',
    status: 'Active',
    endpoints: ['Payment Initialization', 'Transaction Verification', 'Webhook Processing'],
  },
  {
    name: 'GLPI',
    role: 'Support ticketing system integration for incident tracking and escalation',
    status: 'Configured',
    endpoints: ['Ticket Creation', 'Ticket Updates', 'User Synchronization'],
  },
  {
    name: 'WhatsApp Business',
    role: 'Shipment notifications, tracking updates, customer communication',
    status: 'Planned',
    endpoints: ['Message Templates', 'Webhook Events', 'Media Upload'],
  },
]

const dataFlow = [
  {
    flow: 'Customer Onboarding',
    steps: [
      'Frontend Registration → Control Plane API',
      'Tenant Creation → Admin Console Review',
      'Approval → Provisioning Job Queue',
      'SSH to Runner → Fleetbase Installation',
      'Domain Setup → Cloudflare Integration',
      'Welcome Email → Customer Access',
    ],
    systems: ['Frontend', 'Control Plane', 'Admin Console', 'Runner Nodes', 'Cloudflare'],
  },
  {
    flow: 'Shipment Lifecycle',
    steps: [
      'Customer creates shipment → Tenant Portal',
      'Driver Assignment → Fleetbase Runtime',
      'GPS Updates → Redis Pub/Sub',
      'Real-time Tracking → Frontend WebSocket',
      'Delivery Confirmation → Status Update',
      'Invoice Generation → Billing System',
    ],
    systems: ['Tenant Portal', 'Fleetbase Runtime', 'Redis', 'Frontend', 'Billing'],
  },
  {
    flow: 'AI Assistant Query',
    steps: [
      'User Question → Frontend Widget',
      'Widget Config API → Scope Resolution',
      'Knowledge Retrieval → Vector Search',
      'Context Assembly → Ollama LLM',
      'Response Generation → Frontend Display',
      'Usage Tracking → Billing Debit',
    ],
    systems: ['Frontend', 'Control Plane', 'Knowledge Base', 'Ollama', 'Billing'],
  },
]

const securityMeasures = [
  {
    layer: 'Network Security',
    measures: ['Cloudflare Tunnel', 'SSH Key Management', 'IP Whitelisting', 'Rate Limiting'],
    status: 'Implemented',
  },
  {
    layer: 'Application Security',
    measures: ['JWT Authentication', 'RBAC Authorization', 'Input Validation', 'SQL Injection Prevention'],
    status: 'Implemented',
  },
  {
    layer: 'Data Security',
    measures: ['Tenant Data Isolation', 'Encrypted Secrets', 'Database Encryption', 'Audit Logging'],
    status: 'Implemented',
  },
  {
    layer: 'Operational Security',
    measures: ['Container Security', 'Dependency Scanning', 'Secret Rotation', 'Backup Encryption'],
    status: 'In Progress',
  },
]

function statusBadge(status: string) {
  const colors = {
    'Active': 'bg-green-100 text-green-800 hover:bg-green-100',
    'Configured': 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    'Planned': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    'In Progress': 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    'Implemented': 'bg-green-100 text-green-800 hover:bg-green-100',
  }
  return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
}

export default function BlueprintPage() {
  return (
  <>
    <BackButton />
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Platform Blueprint</h1>
        <p className="text-muted-foreground">
          Complete system design, infrastructure stack, data flows, and integration architecture for the Afruheritage platform.
        </p>
        <p className="text-xs text-muted-foreground">Last updated: 2026-06-01</p>
      </div>

      {/* System Components */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="h-5 w-5" /> Core System Components
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {systemComponents.map((component) => (
            <div key={component.name} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{component.name}</h3>
                {statusBadge(component.whiteLabel === 'Yes' ? 'Active' : component.whiteLabel === 'Hidden' ? 'Configured' : 'In Progress')}
              </div>
              <p className="text-sm text-muted-foreground">{component.purpose}</p>
              <div className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4" />
                <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{component.technology}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                {component.maintenance.map((ref) => (
                  <a
                    key={ref.href}
                    href={ref.href}
                    className="rounded-md border px-2 py-1 text-primary hover:bg-muted"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {ref.label}
                  </a>
                ))}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Infrastructure Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" /> Infrastructure Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {infrastructureStack.map((stack) => (
            <div key={stack.name} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{stack.name}</h4>
                {statusBadge(stack.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{stack.purpose}</p>
              <div className="flex flex-wrap gap-2">
                {stack.components.map((component) => (
                  <span key={component} className="text-xs bg-muted px-2 py-1 rounded">
                    {component}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* External Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" /> External Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{integration.name}</h4>
                {statusBadge(integration.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{integration.role}</p>
              <div className="flex flex-wrap gap-2">
                {integration.endpoints.map((endpoint) => (
                  <span key={endpoint} className="text-xs bg-muted px-2 py-1 rounded">
                    {endpoint}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Flows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Critical Data Flows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {dataFlow.map((flow) => (
            <div key={flow.flow} className="space-y-3">
              <h4 className="font-semibold">{flow.flow}</h4>
              <div className="space-y-2">
                {flow.steps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {flow.systems.map((system) => (
                  <span key={system} className="bg-muted px-2 py-1 rounded">
                    {system}
                  </span>
                ))}
              </div>
              <Separator />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Security Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityMeasures.map((security) => (
            <div key={security.layer} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{security.layer}</h4>
                {statusBadge(security.status)}
              </div>
              <div className="flex flex-wrap gap-2">
                {security.measures.map((measure) => (
                  <span key={measure} className="text-xs bg-muted px-2 py-1 rounded">
                    {measure}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> System Metrics & KPIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Multi-Tenant</p>
                <p className="text-2xl font-bold">29+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Truck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Active Shipments</p>
                <p className="text-2xl font-bold">1.2K+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Payment Success</p>
                <p className="text-2xl font-bold">98.5%</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Smartphone className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">AI Queries/Day</p>
                <p className="text-2xl font-bold">5K+</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  )
}

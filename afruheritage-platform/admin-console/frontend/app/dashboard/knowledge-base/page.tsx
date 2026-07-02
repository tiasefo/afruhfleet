import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { BackButton } from '@/components/back-button'
import { AlertTriangle, CheckCircle2, GitBranch, Layers3, ListOrdered, Wrench } from 'lucide-react'

const ROOT_REPO = 'https://github.com/tiasefo/afruhfleet'
const ROOT_REPO_TREE = 'https://github.com/tiasefo/afruhfleet/tree/main/afruheritage-platform'

const featureDomains = [
  {
    name: 'Tenant Management & Lifecycle',
    purpose: 'Onboard, approve, and launch isolated tenant environments with lifecycle status tracking.',
    whiteLabel: 'Partial',
    maintenance: [
      { label: 'Backend service', href: `${ROOT_REPO_TREE}/app/services/tenant_creation_service.py` },
      { label: 'Tenant model', href: `${ROOT_REPO_TREE}/app/models/tenant.py` },
      { label: 'Admin UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/tenants/page.tsx` },
    ],
  },
  {
    name: 'Billing, Plans & Wallets',
    purpose: 'Handle plans, subscriptions, credits, and platform revenue controls.',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'Billing service', href: `${ROOT_REPO_TREE}/app/services/billing_service.py` },
      { label: 'Billing model', href: `${ROOT_REPO_TREE}/app/models/billing.py` },
      { label: 'Admin billing UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/billing/page.tsx` },
    ],
  },
  {
    name: 'KYC & Compliance',
    purpose: 'Perform identity, document, and liveness checks for regulated onboarding.',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'KYC service', href: `${ROOT_REPO_TREE}/app/services/kyc_service.py` },
      { label: 'KYC model', href: `${ROOT_REPO_TREE}/app/models/kyc.py` },
      { label: 'Admin KYC UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/kyc/page.tsx` },
    ],
  },
  {
    name: 'Vendors, Drivers & Runner Nodes',
    purpose: 'Manage vendor onboarding, operational fleet entities, and runner capacity.',
    whiteLabel: 'Partial',
    maintenance: [
      { label: 'Vendor service', href: `${ROOT_REPO_TREE}/app/services/vendor_service.py` },
      { label: 'Vendor model', href: `${ROOT_REPO_TREE}/app/models/vendor.py` },
      { label: 'Runners UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/runners/page.tsx` },
    ],
  },
  {
    name: 'Shipments, Tracking & Marketplace',
    purpose: 'Create shipments, assign drivers, stream GPS events, and support bid-based matching.',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'Shipment service', href: `${ROOT_REPO_TREE}/app/services/shipment_service.py` },
      { label: 'Marketplace routes', href: `${ROOT_REPO_TREE}/app/api/routes/marketplace.py` },
      { label: 'Tracking UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/tracking/page.tsx` },
    ],
  },
  {
    name: 'Custom Domains & DNS',
    purpose: 'Enable customer-branded domains with certificate and verification workflow.',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'Domain service', href: `${ROOT_REPO_TREE}/app/services/custom_domain_service.py` },
      { label: 'Cloudflare client', href: `${ROOT_REPO_TREE}/app/services/cloudflare_domains.py` },
      { label: 'Domains UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/domains/page.tsx` },
    ],
  },
  {
    name: 'Fleetbase Runtime Orchestration',
    purpose: 'Provision and manage per-tenant hidden Fleetbase runtime instances using runner SSH workflows.',
    whiteLabel: 'No',
    maintenance: [
      { label: 'Provisioner', href: `${ROOT_REPO_TREE}/app/services/fleetbase_provisioner.py` },
      { label: 'Runtime service', href: `${ROOT_REPO_TREE}/app/services/fleetbase_runtime_service.py` },
      { label: 'Runtimes UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/runtimes/page.tsx` },
    ],
  },
  {
    name: 'Support CRM & Ticketing',
    purpose: 'Track support tickets, account context, and optional external ticket syncing.',
    whiteLabel: 'Partial',
    maintenance: [
      { label: 'Support CRM service', href: `${ROOT_REPO_TREE}/app/services/support_crm_service.py` },
      { label: 'Support CRM model', href: `${ROOT_REPO_TREE}/app/models/support_crm.py` },
      { label: 'Tickets UI', href: `${ROOT_REPO_TREE}/admin-console/frontend/app/dashboard/tickets/page.tsx` },
    ],
  },
  {
    name: 'AI Assistant & Retrieval',
    purpose: 'Provide tenant-scoped AI assistant behavior, prompts, and retrieval controls.',
    whiteLabel: 'Yes',
    maintenance: [
      { label: 'Tenant AI service', href: `${ROOT_REPO_TREE}/app/services/tenant_ai_service.py` },
      { label: 'AI settings model', href: `${ROOT_REPO_TREE}/app/models/tenant_ai_settings.py` },
      { label: 'AI widget route', href: `${ROOT_REPO_TREE}/app/api/routes/ai_widget.py` },
    ],
  },
]

const integrations = [
  {
    name: 'Cloudflare',
    role: 'Custom hostname management and domain verification.',
    code: `${ROOT_REPO_TREE}/app/services/cloudflare_domains.py`,
    repo: 'https://github.com/cloudflare/cloudflared',
  },
  {
    name: 'Paystack',
    role: 'Primary gateway for payment initialization and verification.',
    code: `${ROOT_REPO_TREE}/app/services/paystack_client.py`,
    repo: ROOT_REPO,
  },
  {
    name: 'Fleetbase',
    role: 'Hidden runtime engine per tenant managed by control-plane orchestration.',
    code: `${ROOT_REPO_TREE}/app/services/fleetbase_runtime_service.py`,
    repo: 'https://github.com/fleetbase/fleetbase',
  },
  {
    name: 'Ollama',
    role: 'Model runtime used by tenant AI assistant capabilities.',
    code: `${ROOT_REPO_TREE}/app/ai/ollama_client.py`,
    repo: 'https://github.com/ollama/ollama',
  },
]

const troubleshooting = [
  {
    issue: 'Tenant provisioning stuck in provisioning',
    checks: 'Validate runner SSH connectivity, check Celery worker state, and inspect provisioning task logs.',
    inspect: [
      `${ROOT_REPO_TREE}/app/tasks/provisioning.py`,
      `${ROOT_REPO_TREE}/app/services/fleetbase_provisioner.py`,
    ],
  },
  {
    issue: 'Domain verification does not complete',
    checks: 'Confirm Cloudflare credentials are loaded and hostname status polling is running.',
    inspect: [
      `${ROOT_REPO_TREE}/app/tasks/domain_verification.py`,
      `${ROOT_REPO_TREE}/app/services/custom_domain_service.py`,
    ],
  },
  {
    issue: 'Payment initialization fails',
    checks: 'Validate payload fields and gateway secret config; test webhook signature verification.',
    inspect: [
      `${ROOT_REPO_TREE}/app/api/routes/payment_hub.py`,
      `${ROOT_REPO_TREE}/app/services/paystack_client.py`,
    ],
  },
  {
    issue: 'Tracking updates stop arriving',
    checks: 'Inspect Redis pub/sub availability and driver event publishing path.',
    inspect: [
      `${ROOT_REPO_TREE}/app/services/tracking_realtime.py`,
      `${ROOT_REPO_TREE}/docker-compose.yml`,
    ],
  },
  {
    issue: 'KYC approvals or liveness are inconsistent',
    checks: 'Review threshold settings, KYC status transitions, and model-side response behavior.',
    inspect: [
      `${ROOT_REPO_TREE}/app/services/kyc_service.py`,
      `${ROOT_REPO_TREE}/app/models/kyc.py`,
    ],
  },
  {
    issue: 'Admin console authentication or role mismatch',
    checks: 'Check token expiry and role assignment in admin auth route and security layer.',
    inspect: [
      `${ROOT_REPO_TREE}/admin-console/admin_app/api/routes`,
      `${ROOT_REPO_TREE}/admin-console/admin_app/core/security.py`,
    ],
  },
  {
    issue: 'Runner pool says no active runner available',
    checks: 'Verify runner records, active flags, and selection logic path for deployment.',
    inspect: [
      `${ROOT_REPO_TREE}/app/models/runner.py`,
      `${ROOT_REPO_TREE}/app/services/runner_selection.py`,
    ],
  },
  {
    issue: 'Support ticket sync not reaching external system',
    checks: 'Validate optional integration credentials and outbound request status for sync attempts.',
    inspect: [
      `${ROOT_REPO_TREE}/app/services/support_crm_service.py`,
      `${ROOT_REPO_TREE}/app/services/glpi_client.py`,
    ],
  },
  {
    issue: 'AI widget returns timeout or empty responses',
    checks: 'Verify Ollama availability, selected model name, and tenant retrieval scope settings.',
    inspect: [
      `${ROOT_REPO_TREE}/app/ai/ollama_client.py`,
      `${ROOT_REPO_TREE}/app/models/tenant_ai_settings.py`,
    ],
  },
  {
    issue: 'Background jobs not executing',
    checks: 'Check Redis health, Celery worker logs, and beat scheduling output.',
    inspect: [
      `${ROOT_REPO_TREE}/app/tasks/celery_app.py`,
      `${ROOT_REPO_TREE}/docker-compose.yml`,
    ],
  },
]

const processFlow = [
  {
    stage: '1. Tenant Intake & Qualification',
    outcome: 'New tenant profile created with eligibility and launch prerequisites.',
    owners: 'Commercial ops, platform ops',
    systems: 'Tenant service, admin tenants dashboard',
  },
  {
    stage: '2. Compliance & KYC Gate',
    outcome: 'KYC documents and liveness checks completed before full activation.',
    owners: 'Compliance team',
    systems: 'KYC service, KYC dashboard',
  },
  {
    stage: '3. Plan Assignment & Billing Activation',
    outcome: 'Plan entitlements enabled and wallet/subscription lifecycle starts.',
    owners: 'Finance ops',
    systems: 'Billing service, payment hub, billing dashboard',
  },
  {
    stage: '4. Runtime Provisioning & Domain Setup',
    outcome: 'Dedicated runtime deployed on runner node and domain path configured.',
    owners: 'Platform engineering',
    systems: 'Provisioner, runner selection, Cloudflare integration',
  },
  {
    stage: '5. Operational Go-Live',
    outcome: 'Shipments, vendors, tracking, and marketplace operations become active.',
    owners: 'Tenant operations team',
    systems: 'Shipments, vendor, tracking, and marketplace modules',
  },
  {
    stage: '6. Support, Incident Handling & Escalation',
    outcome: 'Support workflow captures incidents and routes escalations to owners.',
    owners: 'Support and SRE',
    systems: 'Support CRM, tickets, admin monitoring dashboards',
  },
  {
    stage: '7. Optimization & Expansion Loop',
    outcome: 'Analytics and usage data feed commercial upgrades and performance tuning.',
    owners: 'Product, growth, finance',
    systems: 'Analytics, billing, tenant health indicators',
  },
]

const processMermaid = `sequenceDiagram
    participant Tenant as Tenant Applicant
    participant Admin as Admin Console
    participant API as Control Plane API
    participant KYC as KYC Service
    participant Bill as Billing Hub
    participant Prov as Provisioner
    participant Run as Runner Node
    participant Fleet as Fleetbase Runtime

    Tenant->>Admin: Submit onboarding details
    Admin->>API: Create tenant + launch record
    API->>KYC: Trigger verification workflow
    KYC-->>API: Verification status (pass/fail)
    API->>Bill: Assign plan + initialize billing
    Bill-->>API: Subscription active
    API->>Prov: Start runtime deployment
    Prov->>Run: Execute install + bootstrap
    Run->>Fleet: Start tenant runtime
    Fleet-->>API: Runtime healthy
    API-->>Admin: Tenant marked active
    Admin->>API: Ongoing operations (vendors, shipments, tracking, support)
    API-->>Admin: Metrics + incidents + optimization signals`

const architectureMermaid = `graph TB
    subgraph Clients
      Admin[Admin Console]
      Portal[Tenant Portal]
      Mobile[Driver Mobile]
    end

    subgraph ControlPlane
      API[FastAPI API]
      Worker[Celery Worker]
      Beat[Celery Beat]
      Redis[(Redis)]
      PG[(PostgreSQL)]
    end

    subgraph RuntimePlane
      Runner[Runner Nodes]
      Fleetbase[Fleetbase Runtime per Tenant]
    end

    subgraph External
      Cloudflare[Cloudflare]
      Paystack[Paystack]
      Ollama[Ollama]
      Maps[Geo Providers]
      Email[SMTP/Email]
    end

    Admin --> API
    Portal --> API
    Mobile --> API
    API --> PG
    API --> Redis
    Worker --> Redis
    Beat --> Redis
    Worker --> Runner
    Runner --> Fleetbase
    API --> Fleetbase
    API --> Cloudflare
    API --> Paystack
    API --> Ollama
    API --> Maps
    API --> Email`

function whiteLabelBadge(status: string) {
  if (status === 'Yes') {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yes</Badge>
  }
  if (status === 'Partial') {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partial</Badge>
  }
  return <Badge variant="secondary">No</Badge>
}

export default function KnowledgeBasePage() {
  return (
  <>
    <BackButton />
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Platform Knowledge Base</h1>
        <p className="text-muted-foreground">
          Enterprise reference for architecture, feature ownership, white-label status, repository maintenance, and troubleshooting.
        </p>
        <p className="text-xs text-muted-foreground">Last updated: 2026-06-01</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Layers3 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Feature Domains</p>
              <p className="text-2xl font-bold">{featureDomains.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium">White-Label Ready</p>
              <p className="text-2xl font-bold">6</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium">Partial Domains</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Wrench className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Troubleshooting Cases</p>
              <p className="text-2xl font-bold">{troubleshooting.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Repository Ownership & Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            The platform is maintained as a single monorepo. There are no nested git repositories detected in the codebase structure.
          </p>
          <p>
            Primary repository:{' '}
            <a className="text-primary underline" href={ROOT_REPO} target="_blank" rel="noreferrer">
              {ROOT_REPO}
            </a>
          </p>
          <p>
            Platform root path:{' '}
            <a className="text-primary underline" href={ROOT_REPO_TREE} target="_blank" rel="noreferrer">
              {ROOT_REPO_TREE}
            </a>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Deep Dive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {featureDomains.map((feature) => (
            <div key={feature.name} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold">{feature.name}</h3>
                {whiteLabelBadge(feature.whiteLabel)}
              </div>
              <p className="text-sm text-muted-foreground">{feature.purpose}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {feature.maintenance.map((ref) => (
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

      <Card>
        <CardHeader>
          <CardTitle>External Integrations & Upstream Repositories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="rounded-lg border p-4 text-sm">
              <p className="font-semibold">{integration.name}</p>
              <p className="mt-1 text-muted-foreground">{integration.role}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <a href={integration.code} target="_blank" rel="noreferrer" className="text-primary underline">
                  Code integration path
                </a>
                <a href={integration.repo} target="_blank" rel="noreferrer" className="text-primary underline">
                  Upstream repository
                </a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" /> End-to-End Process Flow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {processFlow.map((step) => (
            <div key={step.stage} className="rounded-lg border p-4 text-sm">
              <p className="font-semibold">{step.stage}</p>
              <p className="mt-1 text-muted-foreground">{step.outcome}</p>
              <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                <p><span className="font-medium text-foreground">Owners:</span> {step.owners}</p>
                <p><span className="font-medium text-foreground">Systems:</span> {step.systems}</p>
              </div>
            </div>
          ))}
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Sequence reference for onboarding-to-operations lifecycle.
            </p>
            <pre className="overflow-x-auto rounded-lg border bg-muted p-4 text-xs">
              <code>{`\`\`\`mermaid\n${processMermaid}\n\`\`\``}</code>
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enterprise Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Complete system architecture and component overview for the Afruheritage platform.
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="default"
              onClick={() => window.location.href = '/dashboard/architecture'}
              className="flex items-center gap-2"
            >
              View Architecture Diagram
            </Button>
            <div className="text-sm text-muted-foreground">
              Interactive diagram with zoom, rotation, and download capabilities
            </div>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Architecture Components:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Control Plane (FastAPI) - Core API gateway</li>
              <li>Admin Console - Internal management interface</li>
              <li>Tenant Portal - Customer-facing SaaS interface</li>
              <li>Fleetbase Runtime - Per-tenant logistics engine</li>
              <li>External Integrations - Cloudflare, Paystack, Ollama, GLPI</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {troubleshooting.map((item) => (
            <div key={item.issue} className="rounded-lg border p-4 text-sm">
              <p className="font-semibold">{item.issue}</p>
              <p className="mt-1 text-muted-foreground">{item.checks}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {item.inspect.map((link) => (
                  <a key={link} href={link} target="_blank" rel="noreferrer" className="text-primary underline">
                    Inspect path
                  </a>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </>
  )
}
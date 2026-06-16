'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Route,
  Server,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Database,
  Globe,
  Lock,
} from 'lucide-react'

const API_ROUTES = [
  { method: 'POST', path: '/sentinel/auth/login', desc: 'Admin authentication — returns JWT + control plane token.' },
  { method: 'GET', path: '/sentinel/auth/me', desc: 'Get current admin user profile.' },
  { method: 'GET', path: '/sentinel/dashboard/stats', desc: 'Platform-wide analytics summary (tenant count, revenue, shipments).' },
  { method: 'GET', path: '/sentinel/tenants', desc: 'List all tenants with status, plan, and domain info.' },
  { method: 'GET', path: '/sentinel/tenants/{id}', desc: 'Get detailed tenant record including runtime and provisioning status.' },
  { method: 'POST', path: '/sentinel/tenants/{id}/approve', desc: 'Approve a pending tenant application.' },
  { method: 'POST', path: '/sentinel/tenants/{id}/launch', desc: 'Trigger Fleetbase provisioning on a runner node.' },
  { method: 'GET', path: '/sentinel/billing/plans', desc: 'List all subscription plans with feature flags and limits.' },
  { method: 'POST', path: '/sentinel/billing/sentinel/assign-plan', desc: 'Assign or change a tenant\'s subscription plan.' },
  { method: 'POST', path: '/sentinel/billing/sentinel/adjust-credits', desc: 'Add or deduct wallet credits for a tenant.' },
  { method: 'GET', path: '/sentinel/runners', desc: 'List all runner nodes with SSH connectivity status.' },
  { method: 'GET', path: '/sentinel/runtime', desc: 'List all Fleetbase runtimes and their health status.' },
  { method: 'GET', path: '/sentinel/domains', desc: 'List custom domains with Cloudflare verification status.' },
  { method: 'GET', path: '/sentinel/vendors', desc: 'List delivery vendors with approval status.' },
  { method: 'POST', path: '/sentinel/vendors/{id}/approve', desc: 'Approve a pending delivery vendor.' },
  { method: 'GET', path: '/sentinel/kyc/list', desc: 'List all KYC submissions with verification status.' },
  { method: 'POST', path: '/sentinel/kyc/{id}/review', desc: 'Submit KYC review result (approve / reject).' },
  { method: 'GET', path: '/sentinel/tickets', desc: 'List all support tickets across all tenants.' },
  { method: 'GET', path: '/sentinel/tracking/shipments', desc: 'Global shipment tracking search for support.' },
  { method: 'GET', path: '/sentinel/control-center/summary', desc: 'Control Center dashboard summary.' },
  { method: 'GET', path: '/sentinel/control-center/features', desc: 'List all platform feature flags.' },
  { method: 'PATCH', path: '/sentinel/control-center/features/{code}', desc: 'Enable or disable a feature globally.' },
  { method: 'GET', path: '/sentinel/control-center/tenant-features', desc: 'List per-tenant feature assignments.' },
  { method: 'POST', path: '/sentinel/control-center/tenant-features', desc: 'Create a new tenant feature assignment.' },
  { method: 'DELETE', path: '/sentinel/control-center/tenant-features/{id}', desc: 'Remove a tenant feature assignment.' },
]

const COMPONENTS = [
  { name: 'Control Plane API', port: 8000, role: 'Main backend — tenant CRUD, billing, AI, support, webhooks.' },
  { name: 'Admin Console API', port: 4000, role: 'Legacy admin API — will be absorbed into Sentinel over time.' },
  { name: 'Sentinel (this service)', port: 9200, role: 'Admin UI + Control Center + operational docs. Serves static frontend.' },
  { name: 'SaaS Frontend', port: 3000, role: 'Tenant-facing storefront and dashboard. Next.js with rewrite proxy to :8000.' },
  { name: 'PostgreSQL', port: 5432, role: 'Shared database for control plane, Sentinel, and tenant metadata.' },
  { name: 'Redis', port: 6379, role: 'Celery broker, cache, and session store.' },
  { name: 'Celery Worker', port: '-', role: 'Background tasks — tenant provisioning, billing, GLPI sync.' },
  { name: 'Nginx', port: 80, role: 'Reverse proxy. Routes subdomains to :3000, API to :8000, Sentinel to :9200.' },
]

const TROUBLESHOOTING = [
  {
    symptom: 'Tenant provisioning stuck at "pending"',
    causes: [
      'Runner node SSH key invalid or runner offline.',
      'Insufficient disk space on runner node.',
      'Docker daemon not running on runner.',
    ],
    fix: 'Check runner SSH connectivity via /sentinel/runners. Verify runner has Docker installed and disk > 20GB free. Re-trigger launch if needed.',
  },
  {
    symptom: 'Custom domain shows "DNS verification failed"',
    causes: [
      'Cloudflare API token expired.',
      'TXT/CNAME records not propagated yet (can take 5-60 minutes).',
      'Domain already in another Cloudflare account.',
    ],
    fix: 'Check Cloudflare token in .env. Use dig/nslookup to verify DNS propagation. If domain is in another CF account, transfer it first.',
  },
  {
    symptom: 'Paystack payments not processing',
    causes: [
      'Test vs Live key mismatch.',
      'Webhook endpoint not reachable from Paystack servers.',
      'Currency not supported on test keys.',
    ],
    fix: 'Verify PAYSTACK_SECRET_KEY is the correct environment key. Ensure webhook URL is publicly reachable (not localhost). Use GHS currency.',
  },
  {
    symptom: 'GLPI tickets not syncing',
    causes: [
      'GLPI base URL unreachable.',
      'App-Token or User-Token expired.',
      'Session-Token conflict with Authorization header.',
    ],
    fix: 'Verify GLPI_BASE_URL is reachable from the API container. Check tokens in .env. Ensure _headers() does not send Authorization when using Session-Token.',
  },
  {
    symptom: 'AI chat widget returns generic or incorrect answers',
    causes: [
      'Ollama model not loaded or wrong model assigned.',
      'RAG vector DB not populated with tenant knowledge.',
      'Knowledge base ingestion failed.',
    ],
    fix: 'Check Ollama status at /api/v1/ai/health. Verify tenant AI settings model assignment. Re-run knowledge ingestion script if vector store is empty.',
  },
  {
    symptom: 'Sentinel UI shows blank page after build',
    causes: [
      'Next.js static export failed on dynamic route.',
      'API rewrites pointing to wrong port.',
      'Missing node_modules during build.',
    ],
    fix: 'Ensure all [id] dynamic routes have generateStaticParams. Check next.config.mjs rewrites point to port 9200. Run npm install before building.',
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700',
  POST: 'bg-green-100 text-green-700',
  PATCH: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
}

export default function DocumentationPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Sentinel Operational Documentation
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Internal reference for Afruheritage platform operations, support, and troubleshooting.
          This page is restricted to admin staff.
        </p>
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes"><Route className="h-3.5 w-3.5 mr-1" /> API Routes</TabsTrigger>
          <TabsTrigger value="components"><Cpu className="h-3.5 w-3.5 mr-1" /> Components</TabsTrigger>
          <TabsTrigger value="troubleshooting"><AlertTriangle className="h-3.5 w-3.5 mr-1" /> Troubleshooting</TabsTrigger>
          <TabsTrigger value="wiring"><Database className="h-3.5 w-3.5 mr-1" /> Backend Wiring</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sentinel API Route Reference</CardTitle>
              <CardDescription>All routes prefixed with <code className="bg-muted px-1 rounded">/sentinel</code>. Requires admin JWT.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {API_ROUTES.map((r, i) => (
                <div key={i} className="flex items-start gap-3 border-b last:border-0 pb-2 last:pb-0">
                  <Badge className={`${METHOD_COLORS[r.method] || 'bg-gray-100'} text-[10px] shrink-0 mt-0.5`}>{r.method}</Badge>
                  <div>
                    <code className="text-sm font-mono bg-muted px-1 rounded">{r.path}</code>
                    <p className="text-sm text-muted-foreground mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Components</CardTitle>
              <CardDescription>How the Afruheritage platform is wired together.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMPONENTS.map((c) => (
                <div key={c.name} className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Server className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{c.name}</p>
                        {c.port !== '-' && <Badge variant="outline" className="text-[10px]">Port {c.port}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{c.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Authentication Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Admin logs in via <code className="bg-muted px-1 rounded">POST /sentinel/auth/login</code> → receives admin JWT.</p>
              <p>2. Sentinel frontend stores JWT in localStorage as <code className="bg-muted px-1 rounded">admin_token</code>.</p>
              <p>3. For control plane data, Sentinel backend uses <code className="bg-muted px-1 rounded">X-CP-Token</code> header to authenticate with port 8000 API.</p>
              <p>4. Control plane validates the CP token against its own JWT secret. All tenant data is fetched server-to-server.</p>
              <p>5. Sentinel never exposes the CP token to the browser. Tenant isolation is maintained.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="troubleshooting" className="mt-4 space-y-3">
          {TROUBLESHOOTING.map((item, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <CardTitle className="text-base">{item.symptom}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Likely Causes:</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                    {item.causes.map((cause, j) => (
                      <li key={j}>{cause}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start gap-2 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-800">{item.fix}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="wiring" className="mt-4 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Flow Architecture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><strong>Tenant Onboarding:</strong> Tenant form → POST /api/v1/tenants → DB record created → Admin approves via Sentinel → Launch triggers Celery task → SSH to runner → <code className="bg-muted px-1 rounded">flb install-fleetbase</code> → Fleetbase runtime registered.</p>
              <p><strong>Billing:</strong> Tenant subscribes → Paystack charge → Wallet credited → Usage debited daily → Read-only mode if balance &lt; 0.</p>
              <p><strong>Custom Domains:</strong> Tenant adds domain → Cloudflare DNS record created → TXT/CNAME verification → SSL certificate issued → Domain activated → Nginx reload.</p>
              <p><strong>Support Tickets:</strong> Public form → POST /api/v1/support-crm/public/tickets → Created in DB + GLPI sync → Tenant views via /support/dashboard → Admin views via Sentinel.</p>
              <p><strong>AI Chat:</strong> Widget config fetched per tenant → Message sent to /api/v1/ai/chat → Ollama LLM with RAG retrieval → Response streamed back.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Database Schema Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>tenant</strong> — Core tenant record with slug, subdomain, status, plan_id, runner_node_id.</p>
              <p><strong>plan / subscription</strong> — Billing tiers with feature flags (max_drivers, dispatch_enabled, etc.).</p>
              <p><strong>wallet / wallet_transaction</strong> — GHS credit system. Auto-debit on shipment creation.</p>
              <p><strong>fleetbase_runtime</strong> — Tracks each tenant's isolated Fleetbase deployment (host, db, status).</p>
              <p><strong>support_ticket</strong> — Linked to tenant. Synced to GLPI via glpi_ticket_id.</p>
              <p><strong>global_feature_flags / tenant_feature_assignments</strong> — Sentinel Control Center tables for phased feature rollouts.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

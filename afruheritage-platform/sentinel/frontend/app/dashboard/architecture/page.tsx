'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Maximize2,
  Share2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ArchitecturePage() {
  const router = useRouter()
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleReset = () => {
    setZoom(100)
    setRotation(0)
  }
  const handleRotate = () => setRotation(prev => prev + 90)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/architecture-diagram.png'
    link.download = 'afruheritage-platform-architecture.png'
    link.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Afruheritage Platform Architecture',
          text: 'Check out the Afruheritage platform architecture diagram',
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/knowledge-base')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Knowledge Base
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Platform Architecture</h1>
            <p className="text-muted-foreground">
              Complete system architecture and component overview
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Last Updated: June 2026
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Version 2.0
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Architecture Diagram Controls</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="flex items-center gap-1"
              >
                <ZoomOut className="h-4 w-4" />
                Zoom Out
              </Button>
              <span className="text-sm font-medium min-w-[3rem] text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="flex items-center gap-1"
              >
                <ZoomIn className="h-4 w-4" />
                Zoom In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                className="flex items-center gap-1"
              >
                <RotateCw className="h-4 w-4" />
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-1"
              >
                <Maximize2 className="h-4 w-4" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Use the controls above to zoom, rotate, download, or share the architecture diagram.
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Afruheritage Platform Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-auto border rounded-lg bg-gray-50 p-4">
            <div
              className="transition-transform duration-300 ease-in-out"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
                width: '100%',
                height: '100%'
              }}
            >
              <img 
                src="/architecture-diagram.png" 
                alt="Afruheritage Platform Architecture Diagram"
                className="w-full h-auto max-w-none"
                style={{
                  minWidth: '800px',
                  minHeight: '600px'
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Description */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm">Control Plane (FastAPI)</h4>
              <p className="text-sm text-muted-foreground">
                Core API gateway handling authentication, tenant management, billing, and orchestration.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Admin Console</h4>
              <p className="text-sm text-muted-foreground">
                Internal management interface for tenant operations, billing, KYC, and platform oversight.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Tenant Portal (Frontend)</h4>
              <p className="text-sm text-muted-foreground">
                Customer-facing SaaS interface for shipments, tracking, vendors, and account management.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Fleetbase Runtime</h4>
              <p className="text-sm text-muted-foreground">
                Per-tenant logistics engine providing shipment lifecycle, driver management, and GPS tracking.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Technology Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm">Backend Infrastructure</h4>
              <p className="text-sm text-muted-foreground">
                FastAPI + PostgreSQL + Redis + Celery + Docker
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Frontend Technologies</h4>
              <p className="text-sm text-muted-foreground">
                Next.js 14 + TypeScript + TailwindCSS + shadcn/ui
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">AI & Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Ollama + RAG Retrieval + Vector Search + Real-time Analytics
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">External Integrations</h4>
              <p className="text-sm text-muted-foreground">
                Cloudflare + Paystack + GLPI + WhatsApp Business API
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Flows */}
      <Card>
        <CardHeader>
          <CardTitle>Key System Flows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold text-sm mb-2">1. Customer Onboarding Flow</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Frontend Registration → Control Plane API</li>
              <li>Tenant Creation → Admin Console Review</li>
              <li>Approval → Provisioning Job Queue</li>
              <li>SSH to Runner → Fleetbase Installation</li>
              <li>Domain Setup → Cloudflare Integration</li>
              <li>Welcome Email → Customer Access</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">2. Shipment Lifecycle Flow</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Customer creates shipment → Tenant Portal</li>
              <li>Driver Assignment → Fleetbase Runtime</li>
              <li>GPS Updates → Redis Pub/Sub</li>
              <li>Real-time Tracking → Frontend WebSocket</li>
              <li>Delivery Confirmation → Status Update</li>
              <li>Invoice Generation → Billing System</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">3. AI Assistant Query Flow</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>User Question → Frontend Widget</li>
              <li>Widget Config API → Scope Resolution</li>
              <li>Knowledge Retrieval → Vector Search</li>
              <li>Context Assembly → Ollama LLM</li>
              <li>Response Generation → Frontend Display</li>
              <li>Usage Tracking → Billing Debit</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

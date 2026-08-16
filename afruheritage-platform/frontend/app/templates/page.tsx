'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Eye, Loader2, RotateCcw, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { templatesApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'

interface StorefrontTemplate {
  id: string
  template_code: string
  name: string
  description: string
  preset: {
    primary_color?: string
    secondary_color?: string
    accent_color?: string
    tags?: string[]
    features?: string[]
    storage_fees_enabled?: boolean
    preview_route?: string
  }
  is_active: boolean
  status: string
  version: string
  renderer_key: string | null
  preview_route: string | null
  preview_image: string | null
  compatible_plugins: string[]
  incompatible_plugins: string[]
  created_at: string
}

interface InstallationRecord {
  id: string
  template_code: string
  template_version: string
  previous_template_code: string | null
  previous_template_version: string | null
  status: string
  requested_at: string
  started_at: string | null
  completed_at: string | null
  failed_at: string | null
  failure_reason: string | null
  correlation_id: string | null
}

interface CompatibilityResult {
  compatible: boolean
  blocking_issues: string[]
  warnings?: string[]
}

const IMPLEMENTED_ENGINES = new Set([
  'bookings',
  'ecommerce',
  'fleet',
  'freight',
  'mall',
  'realestate',
  'restaurant',
])

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<StorefrontTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [stagedInstallationId, setStagedInstallationId] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTemplateCode, setActiveTemplateCode] = useState<string | null>(null)
  const [installations, setInstallations] = useState<InstallationRecord[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [compatibility, setCompatibility] = useState<Record<string, CompatibilityResult>>({})
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'platform_admin' || user?.is_superuser

  useEffect(() => {
    loadTemplates()
    loadInstallations()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await templatesApi.list()
      setTemplates(data)
      // Pre-fetch compatibility for each template
      for (const t of data as StorefrontTemplate[]) {
        fetchCompatibility(t.template_code)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }

  const loadInstallations = async () => {
    try {
      const data: any = await templatesApi.installations()
      setInstallations(data.installations || [])
      const active = (data.installations || []).find((i: InstallationRecord) => i.status === 'completed')
      if (active) {
        setActiveTemplateCode(active.template_code)
      }
    } catch (err) {
      // installations endpoint may not exist yet — non-fatal
    }
  }

  const fetchCompatibility = async (templateCode: string) => {
    try {
      const data: any = await templatesApi.compatibility(templateCode)
      setCompatibility((prev) => ({ ...prev, [templateCode]: data }))
    } catch (err) {
      // non-fatal
    }
  }

  const selectTemplate = async (templateCode: string) => {
    const compat = compatibility[templateCode]
    if (compat && !compat.compatible) {
      setError(`Cannot install: ${compat.blocking_issues.join(', ')}`)
      return
    }
    setSelecting(templateCode)
    setError('')
    setSuccess('')
    try {
      const data: any = await templatesApi.select(templateCode)
      setSelectedTemplate(templateCode)
      setStagedInstallationId(data.installation_id || null)
      setSuccess(`Staged ${data.template_name || templateCode}. Click Publish to make it live.`)
      loadInstallations()
    } catch (err: any) {
      setError(err?.message || err?.detail || 'Failed to select template.')
    } finally {
      setSelecting(null)
    }
  }

  const handlePublish = async () => {
    setPublishing(true)
    setError('')
    setSuccess('')
    try {
      const data: any = await templatesApi.publish(stagedInstallationId || undefined)
      setActiveTemplateCode(data.template_code)
      setSelectedTemplate(data.template_code)
      setStagedInstallationId(null)
      setSuccess(`Published ${data.template_code || 'template'}. Your live storefront has been updated.`)
      loadInstallations()
    } catch (err: any) {
      setError(err?.message || err?.detail || 'Failed to publish template.')
    } finally {
      setPublishing(false)
    }
  }

  const handleRollback = async () => {
    setRollingBack(true)
    setError('')
    setSuccess('')
    try {
      const data: any = await templatesApi.rollback()
      setActiveTemplateCode(data.template_code)
      setSelectedTemplate(data.template_code)
      setSuccess(`Rolled back to ${data.template_code || 'default'}.`)
      loadInstallations()
    } catch (err: any) {
      setError(err?.message || err?.detail || 'Failed to rollback template.')
    } finally {
      setRollingBack(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Storefront Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a storefront template. Only templates with production renderers are marked as ready.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/plugins">
            <Button variant="outline" size="sm" className="gap-1">
              <Plug className="h-4 w-4" />
              Plugins
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRollback}
            disabled={rollingBack}
          >
            {rollingBack ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-1" />
            )}
            Rollback
          </Button>
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          You are signed in as a Tenant Admin. You can browse, preview, select, install, and roll back templates for your tenant only. Global catalog publishing is restricted to Platform Super Admins.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setError('')
                loadTemplates()
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isImplemented = IMPLEMENTED_ENGINES.has(template.template_code)
          const isActive = activeTemplateCode === template.template_code
          const isPending = selectedTemplate === template.template_code && !isActive
          const compat = compatibility[template.template_code]
          const isCompatible = !compat || compat.compatible
          const previewRoute = template.preset?.preview_route || template.preview_route || `/templates/${template.template_code}`

          return (
            <Card key={template.id} className={!isImplemented || !isCompatible ? 'opacity-75' : ''} data-testid={`template-card-${template.template_code}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg"
                      style={{ backgroundColor: template.preset?.primary_color || '#1a3a4a' }}
                    />
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {template.template_code} v{template.version}
                      </p>
                    </div>
                  </div>
                  {isActive && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Live
                    </Badge>
                  )}
                  {isPending && (
                    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                      Staged
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                {template.preset?.tags && (
                  <div className="flex flex-wrap gap-1">
                    {template.preset.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {isImplemented ? (
                    <Badge variant="secondary">Ready</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600">
                      Preview only
                    </Badge>
                  )}
                  {template.preset?.storage_fees_enabled && (
                    <Badge variant="outline" className="text-xs">
                      Storage fees
                    </Badge>
                  )}
                  {compat && !compat.compatible && (
                    <Badge variant="outline" className="text-xs text-amber-600">
                      Blocked
                    </Badge>
                  )}
                </div>

                {compat && !compat.compatible && compat.blocking_issues.length > 0 && (
                  <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                    <p className="font-medium mb-1">Compatibility issues:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {compat.blocking_issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                    <p className="mt-1 text-amber-600">Contact your platform administrator to resolve these requirements before selecting this template.</p>
                  </div>
                )}

                {template.compatible_plugins && template.compatible_plugins.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Compatible plugins:</span> {template.compatible_plugins.join(', ')}
                  </div>
                )}

                {template.incompatible_plugins && template.incompatible_plugins.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Incompatible:</span> {template.incompatible_plugins.join(', ')}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!isImplemented || !isCompatible || selecting === template.template_code || isActive || publishing}
                    onClick={() => isPending ? handlePublish() : selectTemplate(template.template_code)}
                  >
                    {selecting === template.template_code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : publishing && isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isActive ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Live
                      </>
                    ) : isPending ? (
                      'Publish'
                    ) : (
                      'Install'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewRoute, '_blank')}
                    aria-label={`Preview ${template.name} in new tab`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {installations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Installation history</h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Template</th>
                  <th className="text-left p-3 font-medium">Previous</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((inst) => (
                  <tr key={inst.id} className="border-t border-border">
                    <td className="p-3 font-mono">{inst.template_code}</td>
                    <td className="p-3 font-mono text-muted-foreground">{inst.previous_template_code || '—'}</td>
                    <td className="p-3">
                      <Badge variant={inst.status === 'completed' ? 'default' : inst.status === 'rolled_back' ? 'outline' : 'destructive'}>
                        {inst.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{new Date(inst.requested_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

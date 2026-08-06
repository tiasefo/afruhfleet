'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Check, Eye, Loader2, RotateCcw, ShieldCheck, Plug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getAuthToken } from '@/lib/auth'
import { getCurrentUser, isPlatformAdmin } from '@/lib/auth'

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
    theme_class?: string
    image?: string
    swatches?: string[]
  }
  is_active: boolean
  status: string
  version: string
  renderer_key: string | null
  preview_route: string | null
  preview_image: string | null
  compatible_plugins: string[]
  incompatible_plugins: string[]
  required_capabilities: string[]
  optional_capabilities: string[]
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

export default function PortalTemplatesPage() {
  const [templates, setTemplates] = useState<StorefrontTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<string | null>(null)
  const [rollingBack, setRollingBack] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTemplateCode, setActiveTemplateCode] = useState<string | null>(null)
  const [installations, setInstallations] = useState<InstallationRecord[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [compatibility, setCompatibility] = useState<Record<string, { compatible: boolean; blocking_issues: string[]; warnings?: string[] }>>({})

  const user = getCurrentUser()
  const canPublishGlobally = isPlatformAdmin(user)

  useEffect(() => {
    loadTemplates()
    loadInstallations()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    setError('')
    try {
      const token = getAuthToken()
      const res = await fetch('/api/v1/storefront-templates', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
        for (const t of data as StorefrontTemplate[]) {
          fetchCompatibility(t.template_code)
        }
      } else if (res.status === 403) {
        setError('Only tenant admins can view templates.')
      } else {
        setError('Failed to load templates.')
      }
    } catch (err) {
      setError('Network error loading templates.')
    } finally {
      setLoading(false)
    }
  }

  const loadInstallations = async () => {
    try {
      const token = getAuthToken()
      const res = await fetch('/api/v1/storefront-templates/installations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInstallations(data.installations || [])
        const active = (data.installations || []).find((i: InstallationRecord) => i.status === 'completed')
        if (active) {
          setActiveTemplateCode(active.template_code)
          setSelectedTemplate(active.template_code)
        }
      }
    } catch (err) {
      // installations endpoint may not exist yet — non-fatal
    }
  }

  const fetchCompatibility = async (templateCode: string) => {
    try {
      const token = getAuthToken()
      const res = await fetch(`/api/v1/storefront-templates/compatibility/${templateCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCompatibility((prev) => ({ ...prev, [templateCode]: data }))
      }
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
      const token = getAuthToken()
      const res = await fetch('/api/v1/storefront-templates/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ template_code: templateCode }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedTemplate(templateCode)
        setActiveTemplateCode(templateCode)
        setSuccess(`Installed ${data.template_name}. Your storefront now renders this template.`)
        loadInstallations()
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || 'Failed to select template.')
      }
    } catch (err) {
      setError('Network error selecting template.')
    } finally {
      setSelecting(null)
    }
  }

  const rollbackTemplate = async () => {
    setRollingBack(true)
    setError('')
    setSuccess('')
    try {
      const token = getAuthToken()
      const res = await fetch('/api/v1/storefront-templates/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setActiveTemplateCode(data.template_code)
        setSelectedTemplate(data.template_code)
        setSuccess(`Rolled back to ${data.template_code || 'default'}.`)
        loadInstallations()
      } else {
        const errData = await res.json().catch(() => ({}))
        setError(errData.detail || 'Failed to rollback.')
      }
    } catch (err) {
      setError('Network error during rollback.')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template Store</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a storefront template for your tenant. All templates are production-ready.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTemplateCode && (
            <Button variant="outline" size="sm" onClick={rollbackTemplate} disabled={rollingBack}>
              {rollingBack ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
              Roll back
            </Button>
          )}
          <Link href="/portal/plugins">
            <Button variant="outline" size="sm" className="gap-1">
              <Plug className="h-4 w-4" />
              Plugins
            </Button>
          </Link>
        </div>
      </div>

      {!canPublishGlobally && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          You are signed in as a Tenant Admin. You can browse, preview, select, install, and roll back templates for your tenant only. Global catalog publishing is restricted to Platform Super Admins.
        </div>
      )}

      {canPublishGlobally && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          You are signed in as a Platform Super Admin. You can manage the global catalog and publish templates from the <Link href="/admin/templates" className="underline">Admin Templates</Link> page.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isSelected = activeTemplateCode === template.template_code
          const compat = compatibility[template.template_code]
          const isCompatible = !compat || compat.compatible
          const previewRoute = template.preset?.preview_route || template.preview_route || `/templates/${template.template_code}`

          return (
            <Card key={template.id} className={!isCompatible ? 'opacity-75' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-8 rounded-lg"
                      style={{
                        backgroundColor: template.preset?.primary_color || '#1a3a4a',
                      }}
                    />
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {template.template_code} v{template.version}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="default" className="gap-1">
                      <Check className="h-3 w-3" />
                      Active
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
                  <Badge variant="secondary">Ready</Badge>
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
                    {compat.blocking_issues.join(', ')}
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
                    disabled={!isCompatible || selecting === template.template_code || isSelected}
                    onClick={() => selectTemplate(template.template_code)}
                  >
                    {selecting === template.template_code ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      'Install'
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewRoute, '_blank')}
                    title="Preview real template"
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

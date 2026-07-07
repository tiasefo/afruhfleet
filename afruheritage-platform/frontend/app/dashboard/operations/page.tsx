'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Package,
  Plug,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  Store,
  XCircle,
} from 'lucide-react'

const API_BASE = '/api/v1'

interface EndpointHealth {
  tenant_id: string
  tenant_name: string
  template_code: string
  all_healthy: boolean
  missing: string[]
  checks: Array<{ plugin: string; healthy: boolean; details: string }>
}

interface TemplateInfo {
  id: string
  template_code: string
  name: string
  description: string | null
  preset: Record<string, any>
  is_active: boolean
  created_at: string
}

interface ImportLog {
  total_rows: number
  created: number
  updated: number
  errors: Array<{ row: number; error: string }>
}

type Tab = 'features' | 'endpoints' | 'templates' | 'imports'

export default function OperationsCenterPage() {
  const [tab, setTab] = useState<Tab>('endpoints')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Endpoint health
  const [healthData, setHealthData] = useState<EndpointHealth[]>([])
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)

  // Templates
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)

  // Import logs (from localStorage — recent imports)
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/storefront-templates/admin/endpoint-health`, { headers })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      setHealthData(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load endpoint health')
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/storefront-templates/admin/all`, { headers })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      setTemplates(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (tab === 'endpoints') fetchHealth()
    else if (tab === 'templates') fetchTemplates()
    else if (tab === 'imports') {
      // Load recent import logs from localStorage
      try {
        const logs = JSON.parse(localStorage.getItem('import_logs') || '[]')
        setImportLogs(logs)
      } catch {
        setImportLogs([])
      }
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [tab])

  const tabs: Array<{ key: Tab; label: string; icon: typeof Activity }> = [
    { key: 'endpoints', label: 'Endpoint Health', icon: Activity },
    { key: 'templates', label: 'Template Operations', icon: Store },
    { key: 'features', label: 'Feature Management', icon: Plug },
    { key: 'imports', label: 'Bulk Import Monitor', icon: Package },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Software Operations Center
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor endpoint health, manage templates, track bulk imports, and control tenant features
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              if (tab === 'endpoints') fetchHealth()
              else if (tab === 'templates') fetchTemplates()
            }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Endpoint Health Tab */}
        {tab === 'endpoints' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : healthData.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Server className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No tenant endpoint health data available</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {healthData.filter(h => h.all_healthy).length}
                      </div>
                      <div className="text-sm text-gray-500">Healthy Tenants</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {healthData.filter(h => !h.all_healthy).length}
                      </div>
                      <div className="text-sm text-gray-500">Issues Found</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{healthData.length}</div>
                      <div className="text-sm text-gray-500">Total Tenants</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tenant Health List */}
                {healthData.map((tenant) => (
                  <Card key={tenant.tenant_id}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setExpandedTenant(
                        expandedTenant === tenant.tenant_id ? null : tenant.tenant_id
                      )}
                    >
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          {expandedTenant === tenant.tenant_id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>{tenant.tenant_name}</span>
                          <Badge variant="outline" className="text-xs">{tenant.template_code}</Badge>
                        </div>
                        {tenant.all_healthy ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> All Healthy
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" /> {tenant.missing.length} Issues
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedTenant === tenant.tenant_id && (
                      <CardContent>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plugin</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {tenant.checks.map((check) => (
                              <tr key={check.plugin}>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{check.plugin}</td>
                                <td className="px-4 py-2">
                                  {check.healthy ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                      <CheckCircle className="h-3 w-3" /> Healthy
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                      <XCircle className="h-3 w-3" /> Unhealthy
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">{check.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Template Operations Tab */}
        {tab === 'templates' && (
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{templates.length}</div>
                      <div className="text-sm text-gray-500">Total Templates</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {templates.filter(t => t.is_active).length}
                      </div>
                      <div className="text-sm text-gray-500">Active</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {templates.filter(t => t.preset?.storage_fees_enabled).length}
                      </div>
                      <div className="text-sm text-gray-500">Storage Fees</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">
                        {templates.reduce((acc, t) => acc + (t.preset?.features?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-gray-500">Total Features</div>
                    </CardContent>
                  </Card>
                </div>

                {templates.map((tmpl) => (
                  <Card key={tmpl.id}>
                    <CardHeader
                      className="cursor-pointer"
                      onClick={() => setExpandedTemplate(
                        expandedTemplate === tmpl.template_code ? null : tmpl.template_code
                      )}
                    >
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                          {expandedTemplate === tmpl.template_code ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>{tmpl.name}</span>
                          <Badge variant="outline" className="text-xs">{tmpl.template_code}</Badge>
                          {tmpl.preset?.storage_fees_enabled && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Storage Fees</Badge>
                          )}
                        </div>
                        {tmpl.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600">Inactive</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    {expandedTemplate === tmpl.template_code && (
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{tmpl.description}</p>

                        {/* Features */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {(tmpl.preset?.features || []).map((feature: string) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                <Plug className="h-3 w-3 mr-1" /> {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Required Endpoints */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Required Endpoints</h4>
                          <div className="space-y-1">
                            {(tmpl.preset?.required_endpoints || []).map((ep: string) => (
                              <div key={ep} className="flex items-center gap-2 text-xs font-mono text-gray-700 bg-gray-50 rounded px-3 py-1.5">
                                <Server className="h-3 w-3 text-gray-400" />
                                {ep}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Fallbacks */}
                        {tmpl.preset?.fallbacks && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Fallbacks</h4>
                            <div className="space-y-1">
                              {Object.entries(tmpl.preset.fallbacks).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="font-medium">{key}:</span>
                                  <span>{val as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Import Profile */}
                        {tmpl.preset?.import_profile && (
                          <div>
                            <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Import Profile</h4>
                            <div className="rounded-lg border bg-gray-50 p-3 text-xs text-gray-700">
                              <div className="mb-1">
                                <span className="font-medium">Accepted files:</span>{' '}
                                {(tmpl.preset.import_profile.accepted_files || []).join(', ')}
                              </div>
                              <div className="mb-1">
                                <span className="font-medium">Column mappings:</span>{' '}
                                {Object.keys(tmpl.preset.import_profile.column_mapping || {}).length} columns
                              </div>
                              <div>
                                <span className="font-medium">Member matching:</span>{' '}
                                {tmpl.preset.import_profile.member_matching?.strategy || 'name'}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Feature Management Tab */}
        {tab === 'features' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-base font-medium text-gray-600 mb-2">Feature Management</h3>
              <p className="text-sm text-gray-500 mb-4">
                Toggle features on/off per tenant from the Endpoint Health tab. Auto-fix plugins run automatically
                when a template is selected.
              </p>
              <Button variant="outline" onClick={() => setTab('endpoints')}>
                <Activity className="h-4 w-4 mr-2" />
                View Endpoint Health
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Bulk Import Monitor Tab */}
        {tab === 'imports' && (
          <div className="space-y-4">
            {importLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <h3 className="text-base font-medium text-gray-600 mb-2">No Import History</h3>
                  <p className="text-sm text-gray-500">
                    Bulk import results will appear here after shipments are imported.
                  </p>
                </CardContent>
              </Card>
            ) : (
              importLogs.map((log, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Import #{idx + 1}</span>
                      <div className="flex gap-2">
                        <Badge className="bg-green-100 text-green-800">{log.created} created</Badge>
                        <Badge className="bg-blue-100 text-blue-800">{log.updated} updated</Badge>
                        {log.errors.length > 0 && (
                          <Badge className="bg-red-100 text-red-800">{log.errors.length} errors</Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 mb-2">
                      Total rows: <span className="font-medium">{log.total_rows}</span>
                    </div>
                    {log.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto rounded border bg-gray-50 p-2">
                        {log.errors.map((err, i) => (
                          <div key={i} className="text-xs text-red-600">
                            Row {err.row}: {err.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

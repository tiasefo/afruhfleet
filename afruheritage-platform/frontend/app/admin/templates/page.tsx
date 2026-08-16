'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Check, Eye, Loader2, ShieldCheck, Plug, Plus, Pencil, Power, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { templatesApi } from '@/lib/api'

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

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<StorefrontTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<StorefrontTemplate | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    template_code: '',
    name: '',
    description: '',
    preset: '{\n  "primary_color": "#1a3a4a",\n  "tags": []\n}',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await templatesApi.listAll()
      setTemplates(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load templates.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setActionLoading('create')
    try {
      let presetObj
      try { presetObj = JSON.parse(createForm.preset) } catch { presetObj = {} }
      await templatesApi.create({
        template_code: createForm.template_code,
        name: createForm.name,
        description: createForm.description,
        preset: presetObj,
      })
      setShowCreate(false)
      setCreateForm({ template_code: '', name: '', description: '', preset: '{\n  "primary_color": "#1a3a4a",\n  "tags": []\n}' })
      await loadTemplates()
    } catch (err: any) {
      setError(err?.message || 'Failed to create template.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = (template: StorefrontTemplate) => {
    setEditing(template)
    setEditForm({ name: template.name, description: template.description, is_active: template.is_active })
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setActionLoading('edit-' + editing.id)
    try {
      await templatesApi.update(editing.id, {
        name: editForm.name,
        description: editForm.description,
        is_active: editForm.is_active,
      })
      setEditing(null)
      await loadTemplates()
    } catch (err: any) {
      setError(err?.message || 'Failed to update template.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleActive = async (template: StorefrontTemplate) => {
    setActionLoading('toggle-' + template.id)
    try {
      await templatesApi.update(template.id, { is_active: !template.is_active })
      await loadTemplates()
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle template.')
    } finally {
      setActionLoading(null)
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
          <h1 className="text-2xl font-bold text-foreground">Global Template Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the global template catalog. These templates are available to all tenants for selection.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="gap-1" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? 'Cancel' : 'New Template'}
          </Button>
          <Link href="/admin/plugins">
            <Button variant="outline" size="sm" className="gap-1">
              <Plug className="h-4 w-4" />
              Plugins
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        You are signed in as a Platform Super Admin. You can create, edit, publish, and retire templates globally.
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>Create New Template</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Template Code</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={createForm.template_code}
                  onChange={(e) => setCreateForm({ ...createForm, template_code: e.target.value })}
                  placeholder="e.g. modern-logistics"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Modern Logistics"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preset (JSON)</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                rows={5}
                value={createForm.preset}
                onChange={(e) => setCreateForm({ ...createForm, preset: e.target.value })}
              />
            </div>
            <Button size="sm" onClick={handleCreate} disabled={actionLoading === 'create' || !createForm.template_code || !createForm.name}>
              {actionLoading === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Template'}
            </Button>
          </CardContent>
        </Card>
      )}

      {editing && (
        <Card>
          <CardHeader><CardTitle>Edit Template: {editing.template_code}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Published (active)</label>
              <input
                type="checkbox"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit} disabled={actionLoading === 'edit-' + editing.id}>
                {actionLoading === 'edit-' + editing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className={!template.is_active ? 'opacity-75' : ''}>
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
                <Badge variant={template.is_active ? 'default' : 'outline'} className="gap-1">
                  {template.is_active ? (
                    <><Check className="h-3 w-3" /> Published</>
                  ) : (
                    'Retired'
                  )}
                </Badge>
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
                <Badge variant="secondary">{template.status}</Badge>
                {template.renderer_key && (
                  <Badge variant="outline" className="text-xs">
                    Renderer: {template.renderer_key}
                  </Badge>
                )}
              </div>

              {template.compatible_plugins && template.compatible_plugins.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Compatible plugins:</span> {template.compatible_plugins.join(', ')}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open(template.preview_route || `/templates/${template.template_code}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(template)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant={template.is_active ? 'destructive' : 'default'}
                  onClick={() => handleToggleActive(template)}
                  disabled={actionLoading === 'toggle-' + template.id}
                >
                  {actionLoading === 'toggle-' + template.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Power className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No templates in the global catalog.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

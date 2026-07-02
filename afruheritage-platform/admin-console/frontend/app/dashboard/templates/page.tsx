'use client'

import { useState, useEffect, useCallback } from 'react'
import { api, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import {
  Store,
  Plus,
  Trash2,
  Power,
  Palette,
  Loader2,
  AlertCircle,
  Pencil,
  X,
} from 'lucide-react'

interface Template {
  id: string
  template_code: string
  name: string
  description: string | null
  preset: Record<string, string>
  is_active: boolean
  created_at: string
}

const PRESET_KEYS = [
  'primary_color', 'secondary_color', 'accent_color', 'background_color',
  'font_family', 'header_style', 'footer_style', 'card_style',
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<Template[]>('/admin/templates/admin/all')
      setTemplates(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return
    try {
      await api.delete(`/admin/templates/admin/${id}`)
      setTemplates(list => list.filter(t => t.id !== id))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  const handleToggle = async (t: Template) => {
    try {
      const updated = await api.patch<Template>(`/admin/templates/admin/${t.id}`, {
        is_active: !t.is_active,
      })
      setTemplates(list => list.map(x => x.id === t.id ? updated : x))
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  if (isLoading) {
    return (
    <>
      <BackButton />
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button className="mt-4" onClick={load}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Storefront Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage templates that tenants can select for their storefront branding.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowCreate(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map(t => (
          <Card key={t.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="h-4 w-4 text-primary" />
                  {t.name}
                </CardTitle>
                <Badge variant={t.is_active ? 'default' : 'secondary'}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{t.template_code}</p>
            </CardHeader>
            <CardContent className="pt-0">
              {t.description && (
                <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
              )}

              <div className="flex items-center gap-2 mb-3">
                {['primary_color', 'secondary_color', 'accent_color'].map(key => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className="h-6 w-6 rounded border border-border"
                      style={{ backgroundColor: t.preset?.[key] || '#ccc' }}
                    />
                  </div>
                ))}
                <span className="text-xs text-muted-foreground ml-1">Color theme</span>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(t); setShowCreate(true) }}>
                  <Pencil className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleToggle(t)}>
                  <Power className="h-3 w-3 mr-1" /> {t.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(t.id, t.name)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showCreate && (
        <TemplateEditor
          template={editing}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: Template | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(template?.name || '')
  const [templateCode, setTemplateCode] = useState(template?.template_code || '')
  const [description, setDescription] = useState(template?.description || '')
  const [preset, setPreset] = useState<Record<string, string>>(template?.preset || {})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setErr(null)
    try {
      if (template) {
        await api.patch(`/admin/templates/admin/${template.id}`, {
          name, description, preset,
        })
      } else {
        await api.post('/admin/templates/admin', {
          template_code: templateCode, name, description, preset,
        })
      }
      onSaved()
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{template ? 'Edit Template' : 'New Template'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!template && (
            <div>
              <label className="text-sm font-medium">Template Code</label>
              <input
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                value={templateCode}
                onChange={e => setTemplateCode(e.target.value)}
                placeholder="e.g. azure_cloud"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Template display name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <Palette className="h-3 w-3" /> Preset
            </label>
            <div className="mt-2 space-y-2">
              {PRESET_KEYS.map(key => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-40 text-xs text-muted-foreground">{key}</span>
                  {key.endsWith('_color') ? (
                    <input
                      type="color"
                      className="h-8 w-12 rounded border"
                      value={preset[key] || '#000000'}
                      onChange={e => setPreset({ ...preset, [key]: e.target.value })}
                    />
                  ) : null}
                  <input
                    className="flex-1 rounded border px-2 py-1 text-xs"
                    value={preset[key] || ''}
                    onChange={e => setPreset({ ...preset, [key]: e.target.value })}
                    placeholder={key.endsWith('_color') ? '#0078D4' : 'value'}
                  />
                </div>
              ))}
            </div>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || (!template && !templateCode) || !name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

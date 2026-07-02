'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { templatesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Store,
  Palette,
  Loader2,
  AlertCircle,
  Check,
  Type,
  Layout,
  Square,
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

export default function TemplateDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [template, setTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(false)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const all = await templatesApi.list()
        const found = all.find((t: any) => t.template_code === slug)
        if (found) {
          setTemplate(found)
        } else {
          setError('Template not found')
        }
      } catch (err) {
        setError('Failed to load template')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [slug])

  const handleSelect = async () => {
    if (!template) return
    setSelecting(true)
    try {
      await templatesApi.select(template.template_code)
      setSelected(true)
    } catch (err) {
      alert('Failed to select template. Make sure you are logged in.')
    } finally {
      setSelecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm text-red-600">{error || 'Template not found'}</p>
          <Link href="/templates">
            <Button className="mt-4" variant="outline">Back to Templates</Button>
          </Link>
        </div>
      </div>
    )
  }

  const preset = template.preset || {}
  const colors = [
    { label: 'Primary', value: preset.primary_color, key: 'primary_color' },
    { label: 'Secondary', value: preset.secondary_color, key: 'secondary_color' },
    { label: 'Accent', value: preset.accent_color, key: 'accent_color' },
    { label: 'Background', value: preset.background_color, key: 'background_color' },
  ]
  const styles = [
    { label: 'Font Family', value: preset.font_family, icon: Type },
    { label: 'Header Style', value: preset.header_style, icon: Layout },
    { label: 'Footer Style', value: preset.footer_style, icon: Layout },
    { label: 'Card Style', value: preset.card_style, icon: Square },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/templates" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            All Templates
          </Link>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <span className="font-bold">Afruheritage</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Template header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-2">{template.template_code}</Badge>
            <h1 className="text-3xl font-bold tracking-tight">{template.name}</h1>
            {template.description && (
              <p className="mt-2 max-w-xl text-muted-foreground">{template.description}</p>
            )}
          </div>
          <Button
            size="lg"
            onClick={handleSelect}
            disabled={selecting || selected}
          >
            {selecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : selected ? (
              <Check className="h-4 w-4 mr-2" />
            ) : (
              <Palette className="h-4 w-4 mr-2" />
            )}
            {selected ? 'Selected!' : 'Select This Template'}
          </Button>
        </div>

        {/* Preview mockup */}
        <div className="mt-8 overflow-hidden rounded-xl border border-border">
          <div
            className="p-8"
            style={{
              backgroundColor: preset.background_color || '#ffffff',
              fontFamily: preset.font_family || 'sans-serif',
            }}
          >
            {/* Mock header */}
            <div
              className="mb-6 flex items-center justify-between rounded-lg p-4"
              style={{
                backgroundColor: preset.header_style === 'dark' ? preset.secondary_color : '#ffffff',
                boxShadow: preset.header_style === 'white_with_shadow' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                color: preset.header_style === 'dark' ? '#ffffff' : preset.secondary_color,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded"
                  style={{ backgroundColor: preset.primary_color }}
                />
                <span className="font-bold">{template.name}</span>
              </div>
              <div className="flex gap-4 text-sm">
                <span>Dashboard</span>
                <span>Shipments</span>
                <span>Tracking</span>
              </div>
            </div>

            {/* Mock cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {['Active Shipments', 'In Transit', 'Delivered'].map((label, i) => (
                <div
                  key={label}
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: preset.card_style === 'flat' ? 'transparent' : '#ffffff',
                    border: preset.card_style === 'rounded_with_border' ? `1px solid ${preset.secondary_color}20` : 'none',
                    borderRadius: preset.card_style?.startsWith('rounded') ? '12px' : '0',
                    boxShadow: preset.card_style === 'rounded_with_shadow' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-2xl font-bold" style={{ color: preset.primary_color }}>
                    {[128, 34, 89][i]}
                  </p>
                </div>
              ))}
            </div>

            {/* Mock footer */}
            <div
              className="mt-6 rounded-lg p-4 text-center text-xs"
              style={{
                backgroundColor: preset.footer_style === 'dark' ? preset.secondary_color : preset.footer_style === 'light' ? '#f5f5f5' : '#ffffff',
                color: preset.footer_style === 'dark' ? '#ffffff' : '#666',
              }}
            >
              Powered by Afruheritage · {template.name} template
            </div>
          </div>
        </div>

        {/* Color palette */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" />
                Color Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {colors.map(c => (
                <div key={c.key} className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ backgroundColor: c.value || '#ccc' }}
                  />
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{c.value || '—'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layout className="h-4 w-4 text-primary" />
                Style Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {styles.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.value || '—'}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {selected && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-sm font-medium text-green-800">
              Template selected! Your storefront has been updated.
            </p>
            <Link href="/dashboard">
              <Button className="mt-3">Go to Dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}

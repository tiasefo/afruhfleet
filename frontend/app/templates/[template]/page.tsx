import { notFound } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8100'

interface Preset {
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  background_color?: string
  font_family?: string
  header_style?: string
  footer_style?: string
  card_style?: string
  theme_class?: string
  image?: string
  swatches?: string[]
  tags?: string[]
  features?: string[]
  storage_fees_enabled?: boolean
}

interface StorefrontTemplate {
  id: string
  template_code: string
  name: string
  description: string
  preset: Preset
  is_active: boolean
  status: string
  version: string
  renderer_key: string | null
  preview_image: string | null
  compatible_plugins: string[]
  incompatible_plugins: string[]
  required_capabilities: string[]
  optional_capabilities: string[]
}

async function fetchTemplateCatalog(): Promise<StorefrontTemplate[]> {
  const res = await fetch(`${API_BASE}/api/v1/storefront-templates/catalog`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  return res.json()
}

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ template: string }>
}) {
  const { template } = await params
  const catalog = await fetchTemplateCatalog()
  const item = catalog.find((t) => t.template_code === template)

  if (!item || !item.is_active) {
    notFound()
  }

  const preset = item.preset || {}
  const primary = preset.primary_color || '#1a3a4a'
  const secondary = preset.secondary_color || '#3aa6b9'
  const accent = preset.accent_color || '#eef6f8'
  const features = preset.features || []
  const tags = preset.tags || []
  const swatches = preset.swatches || [primary, secondary, accent]

  return (
    <main
      className="min-h-screen"
      style={{
        fontFamily: preset.font_family || 'Inter, sans-serif',
        backgroundColor: preset.background_color || '#ffffff',
      }}
    >
      <header
        className="border-b px-6 py-4"
        style={{
          backgroundColor: preset.header_style === 'dark' ? primary : '#ffffff',
          color: preset.header_style === 'dark' ? '#ffffff' : primary,
          borderColor: secondary,
        }}
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: accent, color: primary }}>
            Preview
          </span>
        </div>
      </header>

      <section
        className="px-6 py-16"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          color: '#ffffff',
        }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                {item.renderer_key || item.template_code} • v{item.version}
              </p>
              <h2 className="text-4xl font-bold leading-tight">{item.name}</h2>
              <p className="text-lg opacity-95">{item.description}</p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{ borderColor: 'rgba(255,255,255,0.4)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <div className="space-y-3">
                {features.length > 0 ? (
                  features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold"
                        style={{ backgroundColor: '#ffffff', color: primary }}
                      >
                        ✓
                      </div>
                      <span className="capitalize">{feature.replace(/_/g, ' ')}</span>
                    </div>
                  ))
                ) : (
                  <p className="opacity-90">Core template features enabled.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border p-6" style={{ borderColor: secondary }}>
            <h3 className="mb-3 text-lg font-semibold" style={{ color: primary }}>
              Color palette
            </h3>
            <div className="flex flex-wrap gap-3">
              {swatches.map((color, i) => (
                <div
                  key={i}
                  className="h-12 w-12 rounded-full border shadow-sm"
                  style={{ backgroundColor: color, borderColor: '#e5e7eb' }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-6" style={{ borderColor: secondary }}>
            <h3 className="mb-3 text-lg font-semibold" style={{ color: primary }}>
              Capabilities
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              {item.required_capabilities.length > 0 ? (
                item.required_capabilities.map((c) => <li key={c}>• {c}</li>)
              ) : (
                <li>• No hard-required capabilities</li>
              )}
              {item.optional_capabilities.length > 0 &&
                item.optional_capabilities.map((c) => (
                  <li key={c} className="text-gray-500">
                    • {c} (optional)
                  </li>
                ))}
            </ul>
          </div>

          <div className="rounded-xl border p-6" style={{ borderColor: secondary }}>
            <h3 className="mb-3 text-lg font-semibold" style={{ color: primary }}>
              Plugins
            </h3>
            {item.compatible_plugins.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-700">
                {item.compatible_plugins.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-600">Compatible with the core platform plugin set.</p>
            )}
            {item.incompatible_plugins.length > 0 && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Not compatible with: {item.incompatible_plugins.join(', ')}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer
        className="border-t px-6 py-8"
        style={{
          backgroundColor: preset.footer_style === 'dark' ? primary : accent,
          color: preset.footer_style === 'dark' ? '#ffffff' : primary,
        }}
      >
        <div className="mx-auto max-w-5xl text-center text-sm">
          Template preview for <strong>{item.name}</strong> — part of the Afruheritage tenant storefront catalog.
        </div>
      </footer>
    </main>
  )
}

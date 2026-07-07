"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Save, Upload, X, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface BrandingData {
  company_name?: string
  tagline?: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  background_color?: string
  support_email?: string
  support_phone?: string
  support_url?: string
  legal_company_name?: string
  legal_footer_text?: string
  terms_url?: string
  privacy_url?: string
  default_language?: string
  supported_languages?: string
  maps_enabled?: boolean
  public_tracking_enabled?: boolean
  csv_import_enabled?: boolean
  group_members_enabled?: boolean
  template_code?: string
  storefront_config?: any
  pseudo_email_domain?: string
}

interface BrandingDrawerProps {
  tenantId: string
  trigger?: React.ReactNode
}

export function BrandingDrawer({ tenantId, trigger }: BrandingDrawerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [branding, setBranding] = useState<BrandingData>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const loadBranding = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/branding/${tenantId}`)
      setBranding(data)
    } catch (e: any) {
      toast.error("Failed to load branding: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadBranding()
    }
  }, [open, tenantId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/branding/${tenantId}`, branding)
      toast.success("Branding saved successfully")
      setOpen(false)
    } catch (e: any) {
      toast.error("Failed to save branding: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async () => {
    if (!logoFile) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", logoFile)

      const data = await api.post(`/branding/${tenantId}/logo`, formData)

      setBranding((prev) => ({ ...prev, logo_url: data.logo_url }))
      toast.success("Logo uploaded successfully")
      setLogoFile(null)
    } catch (e: any) {
      toast.error("Failed to upload logo: " + e.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Palette className="h-4 w-4 mr-1" />
            Branding
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Storefront Branding</SheetTitle>
          <SheetDescription>
            Customize your storefront appearance, colors, and contact information
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="appearance" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Logo & Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={branding.company_name || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, company_name: e.target.value })
                      }
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label>Tagline</Label>
                    <Input
                      value={branding.tagline || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, tagline: e.target.value })
                      }
                      placeholder="Your tagline or slogan"
                    />
                  </div>
                  <div>
                    <Label>Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        value={branding.logo_url || ""}
                        onChange={(e) =>
                          setBranding({ ...branding, logo_url: e.target.value })
                        }
                        placeholder="https://example.com/logo.png"
                      />
                      {branding.logo_url && (
                        <img
                          src={branding.logo_url}
                          alt="Logo preview"
                          className="h-10 w-10 rounded border object-cover"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Upload New Logo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        size="sm"
                        onClick={handleLogoUpload}
                        disabled={!logoFile || uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Favicon URL</Label>
                    <Input
                      value={branding.favicon_url || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, favicon_url: e.target.value })
                      }
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Color Scheme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding.primary_color || "#000000"}
                          onChange={(e) =>
                            setBranding({ ...branding, primary_color: e.target.value })
                          }
                          className="h-10 w-16 p-1"
                        />
                        <Input
                          value={branding.primary_color || ""}
                          onChange={(e) =>
                            setBranding({ ...branding, primary_color: e.target.value })
                          }
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding.secondary_color || "#ffffff"}
                          onChange={(e) =>
                            setBranding({ ...branding, secondary_color: e.target.value })
                          }
                          className="h-10 w-16 p-1"
                        />
                        <Input
                          value={branding.secondary_color || ""}
                          onChange={(e) =>
                            setBranding({ ...branding, secondary_color: e.target.value })
                          }
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding.accent_color || "#f59e0b"}
                          onChange={(e) =>
                            setBranding({ ...branding, accent_color: e.target.value })
                          }
                          className="h-10 w-16 p-1"
                        />
                        <Input
                          value={branding.accent_color || ""}
                          onChange={(e) =>
                            setBranding({ ...branding, accent_color: e.target.value })
                          }
                          placeholder="#f59e0b"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding.background_color || "#f8fafc"}
                          onChange={(e) =>
                            setBranding({ ...branding, background_color: e.target.value })
                          }
                          className="h-10 w-16 p-1"
                        />
                        <Input
                          value={branding.background_color || ""}
                          onChange={(e) =>
                            setBranding({ ...branding, background_color: e.target.value })
                          }
                          placeholder="#f8fafc"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Support Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={branding.support_email || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, support_email: e.target.value })
                      }
                      placeholder="support@example.com"
                    />
                  </div>
                  <div>
                    <Label>Support Phone</Label>
                    <Input
                      value={branding.support_phone || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, support_phone: e.target.value })
                      }
                      placeholder="+233 55 624 9064"
                    />
                  </div>
                  <div>
                    <Label>Support URL</Label>
                    <Input
                      value={branding.support_url || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, support_url: e.target.value })
                      }
                      placeholder="https://example.com/support"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Legal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Legal Company Name</Label>
                    <Input
                      value={branding.legal_company_name || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, legal_company_name: e.target.value })
                      }
                      placeholder="Your Legal Company Name Ltd"
                    />
                  </div>
                  <div>
                    <Label>Legal Footer Text</Label>
                    <Textarea
                      value={branding.legal_footer_text || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, legal_footer_text: e.target.value })
                      }
                      placeholder="© 2024 Your Company. All rights reserved."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Terms of Service URL</Label>
                    <Input
                      value={branding.terms_url || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, terms_url: e.target.value })
                      }
                      placeholder="https://example.com/terms"
                    />
                  </div>
                  <div>
                    <Label>Privacy Policy URL</Label>
                    <Input
                      value={branding.privacy_url || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, privacy_url: e.target.value })
                      }
                      placeholder="https://example.com/privacy"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Language & Localization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Default Language</Label>
                    <Input
                      value={branding.default_language || "en"}
                      onChange={(e) =>
                        setBranding({ ...branding, default_language: e.target.value })
                      }
                      placeholder="en"
                    />
                  </div>
                  <div>
                    <Label>Supported Languages (comma-separated)</Label>
                    <Input
                      value={branding.supported_languages || "en,zh"}
                      onChange={(e) =>
                        setBranding({ ...branding, supported_languages: e.target.value })
                      }
                      placeholder="en,zh,fr"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Feature Flags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maps Enabled</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable map visualization for shipments
                      </p>
                    </div>
                    <Switch
                      checked={branding.maps_enabled || false}
                      onCheckedChange={(checked) =>
                        setBranding({ ...branding, maps_enabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Tracking Enabled</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow unauthenticated public tracking
                      </p>
                    </div>
                    <Switch
                      checked={branding.public_tracking_enabled || false}
                      onCheckedChange={(checked) =>
                        setBranding({ ...branding, public_tracking_enabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>CSV Import Enabled</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable bulk shipment import via CSV
                      </p>
                    </div>
                    <Switch
                      checked={branding.csv_import_enabled || false}
                      onCheckedChange={(checked) =>
                        setBranding({ ...branding, csv_import_enabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Group Members Enabled</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable group member management
                      </p>
                    </div>
                    <Switch
                      checked={branding.group_members_enabled || false}
                      onCheckedChange={(checked) =>
                        setBranding({ ...branding, group_members_enabled: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Import Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Pseudo-Email Domain</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Domain suffix for member login emails (format: phone@domain)
                    </p>
                    <Input
                      value={branding.pseudo_email_domain || "phone.afruheritage.com"}
                      onChange={(e) =>
                        setBranding({ ...branding, pseudo_email_domain: e.target.value })
                      }
                      placeholder="phone.afruheritage.com"
                    />
                  </div>
                  <div>
                    <Label>Template Code</Label>
                    <Input
                      value={branding.template_code || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, template_code: e.target.value })
                      }
                      placeholder="amooksco"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

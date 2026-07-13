"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Save,
  RotateCcw,
} from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface ProvisioningAlert {
  id: string
  tenant_id: string
  tenant_name: string
  failure_reason: string
  stage: string
  resolved: boolean
  resolved_at: string | null
  created_at: string
}

interface TenantProvisioning {
  id: string
  company_name: string
  slug: string
  launch_status: string
  fleetbase_org_id: string | null
  subdomain: string | null
}

interface AlertSettings {
  provisioning_failure_emails: string
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  provisioning: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-purple-100 text-purple-700 border-purple-200",
  queued: "bg-yellow-100 text-yellow-700 border-yellow-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  pending_verification: "bg-orange-100 text-orange-700 border-orange-200",
  suspended: "bg-red-100 text-red-700 border-red-200",
}

export function TenantProvisioningDrawer({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<ProvisioningAlert[]>([])
  const [tenants, setTenants] = useState<TenantProvisioning[]>([])
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({ provisioning_failure_emails: "" })
  const [editingEmails, setEditingEmails] = useState(false)
  const [emailInput, setEmailInput] = useState("")
  const [savingEmails, setSavingEmails] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [a, t, s] = await Promise.all([
        api.get<ProvisioningAlert[]>("/sentinel/provisioning/alerts?resolved=false"),
        api.get<TenantProvisioning[]>("/sentinel/provisioning/tenants"),
        api.get<AlertSettings>("/sentinel/settings/alerts"),
      ])
      setAlerts(a)
      setTenants(t)
      setAlertSettings(s)
      setEmailInput(s.provisioning_failure_emails)
    } catch {
      toast.error("Failed to load provisioning data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadData()
  }, [open, loadData])

  const retryProvisioning = async (tenantId: string) => {
    setActionLoading(tenantId)
    try {
      const result = await api.post<{ advanced: boolean; actions: string[]; error: string | null }>(
        `/sentinel/provisioning/retry/${tenantId}`
      )
      if (result.advanced) {
        toast.success("Provisioning succeeded")
      } else if (result.error) {
        toast.error(`Provisioning failed: ${result.error}`)
      } else {
        toast.info("No action needed — tenant already active")
      }
      loadData()
    } catch {
      toast.error("Retry failed")
    } finally {
      setActionLoading(null)
    }
  }

  const resolveAlert = async (alertId: string) => {
    setActionLoading(alertId)
    try {
      await api.post(`/sentinel/provisioning/alerts/${alertId}/resolve`)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      toast.success("Alert resolved")
    } catch {
      toast.error("Failed to resolve alert")
    } finally {
      setActionLoading(null)
    }
  }

  const saveEmails = async () => {
    setSavingEmails(true)
    try {
      const updated = await api.patch<AlertSettings>("/sentinel/settings/alerts", {
        provisioning_failure_emails: emailInput,
      })
      setAlertSettings(updated)
      setEditingEmails(false)
      toast.success("Alert emails saved")
    } catch {
      toast.error("Failed to save alert emails")
    } finally {
      setSavingEmails(false)
    }
  }

  const failedTenants = tenants.filter(
    (t) => t.launch_status === "failed" || t.launch_status === "draft" || t.launch_status === "pending_verification"
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Server className="h-4 w-4" />
            Tenant Provisioning
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {alerts.length}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Tenant Provisioning
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 px-4 pb-8">
            <Tabs defaultValue="alerts">
              <TabsList className="w-full">
                <TabsTrigger value="alerts" className="flex-1 gap-1">
                  Alerts
                  {alerts.length > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {alerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tenants" className="flex-1">Tenants</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
              </TabsList>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="space-y-4">
                {alerts.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 flex flex-col items-center text-muted-foreground">
                      <CheckCircle2 className="h-10 w-10 mb-2 text-green-500" />
                      <p>No unresolved alerts</p>
                    </CardContent>
                  </Card>
                ) : (
                  alerts.map((alert) => (
                    <Card key={alert.id}>
                      <CardContent className="py-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{alert.tenant_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Stage: {alert.stage} · {new Date(alert.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="destructive">Failed</Badge>
                        </div>
                        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          {alert.failure_reason}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryProvisioning(alert.tenant_id)}
                            disabled={actionLoading === alert.tenant_id}
                            className="gap-1"
                          >
                            {actionLoading === alert.tenant_id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3" />
                            )}
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resolveAlert(alert.id)}
                            disabled={actionLoading === alert.id}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Resolve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Tenants Tab */}
              <TabsContent value="tenants" className="space-y-3">
                {tenants.map((t) => (
                  <Card key={t.id}>
                    <CardContent className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{t.company_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                        {t.fleetbase_org_id && (
                          <p className="text-xs text-green-600 truncate">
                            Org: {t.fleetbase_org_id}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`capitalize ${STATUS_COLORS[t.launch_status] || ""}`}
                          variant="outline"
                        >
                          {t.launch_status}
                        </Badge>
                        {(t.launch_status === "failed" ||
                          t.launch_status === "draft" ||
                          t.launch_status === "pending_verification" ||
                          t.launch_status === "approved") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryProvisioning(t.id)}
                            disabled={actionLoading === t.id}
                            className="gap-1"
                          >
                            {actionLoading === t.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                            Advance
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Provisioning Failure Emails
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Comma-separated email addresses to notify when tenant provisioning fails.
                    </p>
                    {editingEmails ? (
                      <>
                        <Input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="admin@afruheritage.com, ops@afruheritage.com"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEmails} disabled={savingEmails} className="gap-1">
                            {savingEmails ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Save className="h-3 w-3" />
                            )}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingEmails(false)
                              setEmailInput(alertSettings.provisioning_failure_emails)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">
                          {alertSettings.provisioning_failure_emails || (
                            <span className="text-muted-foreground italic">No emails configured</span>
                          )}
                        </p>
                        <Button size="sm" variant="outline" onClick={() => setEditingEmails(true)}>
                          Edit
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

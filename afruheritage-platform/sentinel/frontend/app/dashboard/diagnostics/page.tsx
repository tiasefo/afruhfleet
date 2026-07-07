'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Activity,
  RefreshCw,
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function DiagnosticsPage() {
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [endpointHealth, setEndpointHealth] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [sys, end, logs] = await Promise.all([
        api.get('/sentinel/diagnostics/system'),
        api.get('/sentinel/diagnostics/endpoints'),
        api.get('/sentinel/diagnostics/audit-logs'),
      ])
      setSystemHealth(sys)
      setEndpointHealth(end)
      setAuditLogs(logs)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnostics</h1>
          <p className="mt-1 text-muted-foreground">System health and monitoring</p>
        </div>
        <Button variant="outline" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* System Health */}
          {systemHealth && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Cpu className="h-4 w-4" />
                      CPU
                    </div>
                    <div className="text-2xl font-bold">{systemHealth.admin_console?.cpu_percent || 0}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MemoryStick className="h-4 w-4" />
                      Memory
                    </div>
                    <div className="text-2xl font-bold">{systemHealth.admin_console?.memory_percent || 0}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HardDrive className="h-4 w-4" />
                      Disk
                    </div>
                    <div className="text-2xl font-bold">{systemHealth.admin_console?.disk_percent || 0}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Server className="h-4 w-4" />
                      Control Plane
                    </div>
                    <Badge className={systemHealth.control_plane_status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {systemHealth.control_plane_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Endpoint Health */}
          {endpointHealth && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Endpoint Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(endpointHealth.endpoints || {}).map(([name, health]: [string, any]) => (
                    <div key={name} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="font-medium">{name}</span>
                      <div className="flex items-center gap-2">
                        {health.status === 'healthy' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <Badge className={health.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {health.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Logs */}
          {auditLogs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogs.logs?.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">No audit logs found</div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.logs?.slice(0, 10).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                        <div>
                          <div className="font-medium">{log.action}</div>
                          <div className="text-muted-foreground">{log.admin_email} · {log.entity_type}</div>
                        </div>
                        <div className="text-muted-foreground">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { fleetbaseAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Server, 
  Terminal, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Monitor,
  Network,
  HardDrive,
  Zap,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Trash2
} from 'lucide-react'

const runnerStatuses = [
  { value: 'online', label: 'Online', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'offline', label: 'Offline', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
]

const runtimeStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'installing', label: 'Installing', color: 'bg-blue-100 text-blue-800', icon: Download },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'suspended', label: 'Suspended', color: 'bg-orange-100 text-orange-800', icon: Pause },
]

export default function RuntimeOrchestrationPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [runners, setRunners] = useState<any[]>([])
  const [runtimes, setRuntimes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showRunnerModal, setShowRunnerModal] = useState(false)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [runnerFilter, setRunnerFilter] = useState('')
  
  // Runner form state
  const [runnerForm, setRunnerForm] = useState({
    name: '',
    hostname: '',
    ssh_port: '22',
    ssh_user: 'root',
    root_runtime_path: '/opt/afruheritage/tenants',
    max_tenants: '50',
    supports_reference_install: false,
  })
  
  // Deploy form state
  const [deployForm, setDeployForm] = useState({
    tenant_id: '',
    runner_id: '',
    is_reference_install: false,
  })

  useEffect(() => {
    loadRuntimeData()
  }, [])

  const loadRuntimeData = async () => {
    setIsLoading(true)
    try {
      // Mock data for now - in real implementation would call APIs
      const mockRunners = [
        {
          id: 'runner-1',
          name: 'Primary Runner - Accra',
          hostname: 'runner1.afruheritage.com',
          ssh_port: 22,
          ssh_user: 'root',
          root_runtime_path: '/opt/afruheritage/tenants',
          status: 'online',
          max_tenants: 50,
          current_tenants: 12,
          supports_reference_install: true,
          cpu_usage: 45,
          memory_usage: 67,
          disk_usage: 78,
          last_heartbeat: '2024-01-20T10:30:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'runner-2',
          name: 'Secondary Runner - Kumasi',
          hostname: 'runner2.afruheritage.com',
          ssh_port: 22,
          ssh_user: 'root',
          root_runtime_path: '/opt/afruheritage/tenants',
          status: 'online',
          max_tenants: 30,
          current_tenants: 8,
          supports_reference_install: false,
          cpu_usage: 32,
          memory_usage: 45,
          disk_usage: 56,
          last_heartbeat: '2024-01-20T10:29:00Z',
          created_at: '2024-01-05T00:00:00Z',
        },
        {
          id: 'runner-3',
          name: 'Backup Runner - Tema',
          hostname: 'runner3.afruheritage.com',
          ssh_port: 22,
          ssh_user: 'root',
          root_runtime_path: '/opt/afruheritage/tenants',
          status: 'maintenance',
          max_tenants: 25,
          current_tenants: 0,
          supports_reference_install: false,
          cpu_usage: 0,
          memory_usage: 0,
          disk_usage: 45,
          last_heartbeat: '2024-01-19T15:45:00Z',
          created_at: '2024-01-10T00:00:00Z',
        },
      ]
      
      const mockRuntimes = [
        {
          id: 'runtime-1',
          tenant_id: 'tenant-1',
          tenant_slug: 'demo-company',
          runner_id: 'runner-1',
          status: 'active',
          install_directory: '/opt/afruheritage/tenants/demo-company',
          runtime_url: 'https://demo-company.afruheritage.com',
          console_url: 'https://demo-company.afruheritage.com/console',
          api_url: 'https://demo-company.afruheritage.com/api',
          fleetbase_version: 'v2.4.1',
          last_error: null,
          is_reference_install: false,
          created_at: '2024-01-15T10:30:00Z',
          last_heartbeat: '2024-01-20T10:25:00Z',
        },
        {
          id: 'runtime-2',
          tenant_id: 'tenant-2',
          tenant_slug: 'reference',
          runner_id: 'runner-1',
          status: 'active',
          install_directory: '/opt/afruheritage/tenants/reference',
          runtime_url: 'https://reference.afruheritage.com',
          console_url: 'https://reference.afruheritage.com/console',
          api_url: 'https://reference.afruheritage.com/api',
          fleetbase_version: 'v2.4.1',
          last_error: null,
          is_reference_install: true,
          created_at: '2024-01-10T09:00:00Z',
          last_heartbeat: '2024-01-20T10:28:00Z',
        },
        {
          id: 'runtime-3',
          tenant_id: 'tenant-3',
          tenant_slug: 'test-company',
          runner_id: 'runner-2',
          status: 'installing',
          install_directory: '/opt/afruheritage/tenants/test-company',
          runtime_url: null,
          console_url: null,
          api_url: null,
          fleetbase_version: 'v2.4.1',
          last_error: null,
          is_reference_install: false,
          created_at: '2024-01-19T14:15:00Z',
          last_heartbeat: null,
        },
      ]
      
      setRunners(mockRunners)
      setRuntimes(mockRuntimes)
    } catch (error) {
      console.error('Failed to load runtime data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRunner = async () => {
    if (!runnerForm.name || !runnerForm.hostname) return
    
    setIsProcessing(true)
    try {
      // Mock creation - in real implementation would call API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      await loadRuntimeData()
      setShowRunnerModal(false)
      setRunnerForm({
        name: '',
        hostname: '',
        ssh_port: '22',
        ssh_user: 'root',
        root_runtime_path: '/opt/afruheritage/tenants',
        max_tenants: '50',
        supports_reference_install: false,
      })
    } catch (error) {
      console.error('Failed to create runner:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeployRuntime = async () => {
    if (!deployForm.tenant_id || !deployForm.runner_id) return
    
    setIsProcessing(true)
    try {
      // Mock deployment - in real implementation would call API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await loadRuntimeData()
      setShowDeployModal(false)
      setDeployForm({
        tenant_id: '',
        runner_id: '',
        is_reference_install: false,
      })
    } catch (error) {
      console.error('Failed to deploy runtime:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getRunnerStatusInfo = (status: string) => {
    return runnerStatuses.find(s => s.value === status) || runnerStatuses[0]
  }

  const getRuntimeStatusInfo = (status: string) => {
    return runtimeStatuses.find(s => s.value === status) || runtimeStatuses[0]
  }

  const filteredRuntimes = runtimes.filter(runtime => {
    const matchesStatus = !statusFilter || runtime.status === statusFilter
    const matchesRunner = !runnerFilter || runtime.runner_id === runnerFilter
    return matchesStatus && matchesRunner
  })

  const onlineRunners = runners.filter(r => r.status === 'online')
  const activeRuntimes = runtimes.filter(r => r.status === 'active')
  const installingRuntimes = runtimes.filter(r => r.status === 'installing')
  const totalTenants = runners.reduce((sum, r) => sum + r.current_tenants, 0)
  const maxTenants = runners.reduce((sum, r) => sum + r.max_tenants, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Runtime Orchestration</h1>
              <p className="mt-2 text-sm text-gray-600">Manage Fleetbase runners and runtime deployments</p>
            </div>
            <div className="flex space-x-3">
              <Dialog open={showRunnerModal} onOpenChange={setShowRunnerModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Server className="w-4 h-4 mr-2" />
                    Add Runner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Runner</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Runner Name</label>
                        <Input
                          value={runnerForm.name}
                          onChange={(e) => setRunnerForm({ ...runnerForm, name: e.target.value })}
                          placeholder="Primary Runner - Accra"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Hostname</label>
                        <Input
                          value={runnerForm.hostname}
                          onChange={(e) => setRunnerForm({ ...runnerForm, hostname: e.target.value })}
                          placeholder="runner1.afruheritage.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">SSH Port</label>
                        <Input
                          value={runnerForm.ssh_port}
                          onChange={(e) => setRunnerForm({ ...runnerForm, ssh_port: e.target.value })}
                          placeholder="22"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">SSH User</label>
                        <Input
                          value={runnerForm.ssh_user}
                          onChange={(e) => setRunnerForm({ ...runnerForm, ssh_user: e.target.value })}
                          placeholder="root"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Runtime Path</label>
                      <Input
                        value={runnerForm.root_runtime_path}
                        onChange={(e) => setRunnerForm({ ...runnerForm, root_runtime_path: e.target.value })}
                        placeholder="/opt/afruheritage/tenants"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Max Tenants</label>
                        <Input
                          value={runnerForm.max_tenants}
                          onChange={(e) => setRunnerForm({ ...runnerForm, max_tenants: e.target.value })}
                          placeholder="50"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id="reference-install"
                          checked={runnerForm.supports_reference_install}
                          onChange={(e) => setRunnerForm({ ...runnerForm, supports_reference_install: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="reference-install" className="text-sm">
                          Supports Reference Install
                        </label>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button onClick={handleCreateRunner} disabled={!runnerForm.name || !runnerForm.hostname || isProcessing}>
                        {isProcessing ? 'Creating...' : 'Add Runner'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowRunnerModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Deploy Runtime
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Deploy New Runtime</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Tenant ID</label>
                      <Input
                        value={deployForm.tenant_id}
                        onChange={(e) => setDeployForm({ ...deployForm, tenant_id: e.target.value })}
                        placeholder="tenant-uuid"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Runner</label>
                      <Select value={deployForm.runner_id} onValueChange={(value) => setDeployForm({ ...deployForm, runner_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select runner" />
                        </SelectTrigger>
                        <SelectContent>
                          {runners.filter(r => r.status === 'online').map((runner) => (
                            <SelectItem key={runner.id} value={runner.id}>
                              {runner.name} ({runner.current_tenants}/{runner.max_tenants} tenants)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="reference-install"
                        checked={deployForm.is_reference_install}
                        onChange={(e) => setDeployForm({ ...deployForm, is_reference_install: e.target.checked })}
                        className="rounded"
                      />
                      <label htmlFor="reference-install" className="text-sm">
                        Reference Install (Template)
                      </label>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button onClick={handleDeployRuntime} disabled={!deployForm.tenant_id || !deployForm.runner_id || isProcessing}>
                        {isProcessing ? 'Deploying...' : 'Deploy Runtime'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowDeployModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Server className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Runners</p>
                  <p className="text-2xl font-bold text-gray-900">{runners.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Online Runners</p>
                  <p className="text-2xl font-bold text-gray-900">{onlineRunners.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tenant Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTenants}/{maxTenants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Runtimes</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRuntimes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Runners Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Runner Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            {runners.length > 0 ? (
              <div className="space-y-4">
                {runners.map((runner) => {
                  const statusInfo = getRunnerStatusInfo(runner.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={runner.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Server className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">{runner.name}</h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              {runner.supports_reference_install && (
                                <Badge variant="outline" className="text-xs">
                                  Reference Support
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Network className="h-3 w-3 mr-1" />
                                {runner.hostname}:{runner.ssh_port}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {runner.current_tenants}/{runner.max_tenants} tenants
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Created: {new Date(runner.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-6 mt-3">
                              <div className="flex items-center space-x-2">
                                <Monitor className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">CPU: {runner.cpu_usage}%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <HardDrive className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">Memory: {runner.memory_usage}%</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-gray-500" />
                                <span className="text-sm text-gray-600">Disk: {runner.disk_usage}%</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                              <Clock className="h-3 w-3" />
                              Last heartbeat: {new Date(runner.last_heartbeat).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Terminal className="w-4 h-4 mr-2" />
                            SSH
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Restart
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Server className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No runners configured</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Add your first runner to start deploying runtimes
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowRunnerModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Runner
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Runtime Deployments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Runtime Deployments</CardTitle>
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {runtimeStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={runnerFilter} onValueChange={setRunnerFilter}>
                  <SelectTrigger className="w-40">
                    <Server className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Runner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Runners</SelectItem>
                    {runners.map((runner) => (
                      <SelectItem key={runner.id} value={runner.id}>
                        {runner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRuntimes.length > 0 ? (
              <div className="space-y-4">
                {filteredRuntimes.map((runtime) => {
                  const statusInfo = getRuntimeStatusInfo(runtime.status)
                  const StatusIcon = statusInfo.icon
                  const runner = runners.find(r => r.id === runtime.runner_id)
                  
                  return (
                    <div key={runtime.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">{runtime.tenant_slug}</h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              {runtime.is_reference_install && (
                                <Badge variant="outline" className="text-xs">
                                  Reference
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {runner?.name || 'Unknown Runner'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Terminal className="h-3 w-3 mr-1" />
                                Fleetbase v{runtime.fleetbase_version}
                              </div>
                              <div className="flex items-center">
                                <HardDrive className="h-3 w-3 mr-1" />
                                {runtime.install_directory}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Created: {new Date(runtime.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {runtime.runtime_url && (
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <a href={runtime.runtime_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  🌐 Runtime
                                </a>
                                <a href={runtime.console_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  🎛️ Console
                                </a>
                                <a href={runtime.api_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  🔌 API
                                </a>
                              </div>
                            )}
                            
                            {runtime.last_heartbeat && (
                              <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                                <Clock className="h-3 w-3" />
                                Last heartbeat: {new Date(runtime.last_heartbeat).toLocaleString()}
                              </div>
                            )}
                            
                            {runtime.last_error && (
                              <div className="mt-2 text-sm text-red-600">
                                <AlertTriangle className="h-3 w-3 inline mr-1" />
                                {runtime.last_error}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {runtime.status === 'active' && (
                            <Button variant="outline" size="sm">
                              <Pause className="w-4 h-4 mr-2" />
                              Suspend
                            </Button>
                          )}
                          {runtime.status === 'failed' && (
                            <Button variant="outline" size="sm">
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Retry
                            </Button>
                          )}
                          {runtime.status === 'suspended' && (
                            <Button variant="outline" size="sm">
                              <Play className="w-4 h-4 mr-2" />
                              Resume
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No runtime deployments</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Deploy your first Fleetbase runtime to get started
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowDeployModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Deploy Runtime
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

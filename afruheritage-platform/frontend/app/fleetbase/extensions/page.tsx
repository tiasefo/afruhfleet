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
import { BackButton } from '@/components/back-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Terminal,
  Package, 
  Download, 
  Upload, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Zap,
  Code,
  Play,
  Pause,
  Trash2,
  CreditCard,
  BarChart,
  Bell,
  Calendar
} from 'lucide-react'

const runtimeStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'installing', label: 'Installing', color: 'bg-blue-100 text-blue-800', icon: Download },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'failed', label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'suspended', label: 'Suspended', color: 'bg-orange-100 text-orange-800', icon: Pause },
]

const extensionTypes = [
  { value: 'payment_gateway', label: 'Payment Gateway', icon: Settings },
  { value: 'shipping_provider', label: 'Shipping Provider', icon: Package },
  { value: 'analytics', label: 'Analytics', icon: BarChart },
  { value: 'notification', label: 'Notification', icon: Bell },
  { value: 'custom', label: 'Custom Extension', icon: Code },
]

export default function ExtensionsPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [runtimes, setRuntimes] = useState<any[]>([])
  const [extensions, setExtensions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Deploy form state
  const [deployForm, setDeployForm] = useState({
    tenant_id: '',
    runner_id: '',
    is_reference_install: false,
  })
  
  // Extension form state
  const [extensionForm, setExtensionForm] = useState({
    name: '',
    type: 'custom',
    version: '',
    description: '',
    repository_url: '',
    config: '',
  })

  useEffect(() => {
    loadExtensionsData()
  }, [])

  const loadExtensionsData = async () => {
    setIsLoading(true)
    try {
      const runtimesRes = await fleetbaseAPI.getRuntimes()
      setRuntimes(runtimesRes.data || [])
      setExtensions([])
    } catch (error) {
      console.error('Failed to load extensions data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeployRuntime = async () => {
    if (!deployForm.tenant_id || !deployForm.runner_id) return
    
    setIsProcessing(true)
    try {
      await fleetbaseAPI.deployRuntime(deployForm)
      
      await loadExtensionsData()
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

  const handleInstallExtension = async () => {
    if (!extensionForm.name || !extensionForm.type) return
    
    setIsProcessing(true)
    try {
      // Mock installation - in real implementation would call API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      await loadExtensionsData()
      setShowExtensionModal(false)
      setExtensionForm({
        name: '',
        type: 'custom',
        version: '',
        description: '',
        repository_url: '',
        config: '',
      })
    } catch (error) {
      console.error('Failed to install extension:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return runtimeStatuses.find(s => s.value === status) || runtimeStatuses[0]
  }

  const getExtensionTypeInfo = (type: string) => {
    return extensionTypes.find(t => t.value === type) || extensionTypes[0]
  }

  const activeRuntimes = runtimes.filter(r => r.status === 'active')
  const installingRuntimes = runtimes.filter(r => r.status === 'installing')
  const failedRuntimes = runtimes.filter(r => r.status === 'failed')
  const activeExtensions = extensions.filter(e => e.status === 'active')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackButton fallback="/dashboard" />
      {/* Coming Soon Banner */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-sm font-medium">
          This page is under development. Deploy and install actions are not yet functional.
        </div>
      </div>
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fleetbase Extensions <span className="text-lg font-normal text-gray-500">(Coming Soon)</span></h1>
              <p className="mt-2 text-sm text-gray-600">Manage runtime deployments and extensions</p>
            </div>
            <div className="flex space-x-3">
              <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Server className="w-4 h-4 mr-2" />
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
                      <label className="text-sm font-medium">Runner ID</label>
                      <Select value={deployForm.runner_id} onValueChange={(value) => setDeployForm({ ...deployForm, runner_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select runner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="runner-1">Runner 1 - Primary</SelectItem>
                          <SelectItem value="runner-2">Runner 2 - Secondary</SelectItem>
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
              
              <Dialog open={showExtensionModal} onOpenChange={setShowExtensionModal}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Install Extension
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Install Extension</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Extension Name</label>
                        <Input
                          value={extensionForm.name}
                          onChange={(e) => setExtensionForm({ ...extensionForm, name: e.target.value })}
                          placeholder="My Custom Extension"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Select value={extensionForm.type} onValueChange={(value) => setExtensionForm({ ...extensionForm, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {extensionTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Version</label>
                        <Input
                          value={extensionForm.version}
                          onChange={(e) => setExtensionForm({ ...extensionForm, version: e.target.value })}
                          placeholder="1.0.0"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Repository URL</label>
                        <Input
                          value={extensionForm.repository_url}
                          onChange={(e) => setExtensionForm({ ...extensionForm, repository_url: e.target.value })}
                          placeholder="https://github.com/user/extension"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={extensionForm.description}
                        onChange={(e) => setExtensionForm({ ...extensionForm, description: e.target.value })}
                        placeholder="Extension description"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Configuration (JSON)</label>
                      <textarea
                        value={extensionForm.config}
                        onChange={(e) => setExtensionForm({ ...extensionForm, config: e.target.value })}
                        placeholder='{"api_key": "...", "enabled": true}'
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button onClick={handleInstallExtension} disabled={!extensionForm.name || !extensionForm.type || isProcessing}>
                        {isProcessing ? 'Installing...' : 'Install Extension'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowExtensionModal(false)}>
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
                  <p className="text-sm font-medium text-gray-600">Total Runtimes</p>
                  <p className="text-2xl font-bold text-gray-900">{runtimes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRuntimes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Download className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Installing</p>
                  <p className="text-2xl font-bold text-gray-900">{installingRuntimes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Extensions</p>
                  <p className="text-2xl font-bold text-gray-900">{extensions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Runtime Deployments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Runtime Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            {runtimes.length > 0 ? (
              <div className="space-y-4">
                {runtimes.map((runtime) => {
                  const statusInfo = getStatusInfo(runtime.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={runtime.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Server className="h-6 w-6 text-blue-600" />
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
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Terminal className="h-3 w-3 mr-1" />
                                Fleetbase v{runtime.fleetbase_version}
                              </div>
                              <div className="flex items-center">
                                <Package className="h-3 w-3 mr-1" />
                                {runtime.install_directory}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Created: {new Date(runtime.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
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
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
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

        {/* Extensions */}
        <Card>
          <CardHeader>
            <CardTitle>Installed Extensions</CardTitle>
          </CardHeader>
          <CardContent>
            {extensions.length > 0 ? (
              <div className="space-y-4">
                {extensions.map((extension) => {
                  const typeInfo = getExtensionTypeInfo(extension.type)
                  const TypeIcon = typeInfo.icon
                  
                  return (
                    <div key={extension.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                            <TypeIcon className="h-6 w-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">{extension.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                <TypeIcon className="w-3 h-3 mr-1" />
                                {typeInfo.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                v{extension.version}
                              </Badge>
                              <Badge className={extension.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {extension.status}
                              </Badge>
                            </div>
                            
                            <p className="mt-1 text-sm text-gray-600">{extension.description}</p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Code className="h-3 w-3 mr-1" />
                                {extension.installed_runtimes.length} runtime(s)
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(extension.created_at).toLocaleDateString()}
                              </div>
                              <a href={extension.repository_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                📦 Repository
                              </a>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Update
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
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No extensions installed</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Install extensions to extend Fleetbase functionality
                </p>
                <div className="mt-6">
                  <Button onClick={() => setShowExtensionModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Install Extension
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

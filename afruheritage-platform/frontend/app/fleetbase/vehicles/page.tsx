'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useBranding } from '@/hooks/useBranding'
import { useTranslation } from '@/hooks/useTranslation'
import { vendorAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Truck, 
  Car, 
  Bike, 
  Search,
  Loader2,
  Plus,
  MapPin,
  Calendar,
  Settings,
  Fuel,
  Wrench,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Users
} from 'lucide-react'

const vehicleTypes = [
  { value: 'truck', label: 'Truck', icon: Truck, capacity: '1-5 tons' },
  { value: 'car', label: 'Car', icon: Car, capacity: '0.5-1 ton' },
  { value: 'motorbike', label: 'Motorbike', icon: Bike, capacity: '0.1-0.3 tons' },
  { value: 'bicycle', label: 'Bicycle', icon: Bike, capacity: '0.05-0.1 tons' },
]

const vehicleStatuses = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800', icon: Wrench },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  { value: 'retired', label: 'Retired', color: 'bg-red-100 text-red-800', icon: XCircle },
]

export default function VehiclesPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [driverFilter, setDriverFilter] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    vehicle_type: '',
    make: '',
    model: '',
    year: '',
    license_plate: '',
    vin: '',
    color: '',
    capacity: '',
    driver_id: '',
    insurance_number: '',
    insurance_expiry: '',
    registration_expiry: '',
    last_maintenance: '',
    next_maintenance: '',
  })

  useEffect(() => {
    loadVehiclesData()
  }, [])

  const loadVehiclesData = async () => {
    setIsLoading(true)
    try {
      const [driversData] = await Promise.all([
        vendorAPI.getVendors(),
      ])
      
      setDrivers(driversData || [])
      
      // Extract vehicle information from drivers
      const extractedVehicles = driversData.flatMap((driver: any) => {
        if (!driver.vehicle_types || !Array.isArray(driver.vehicle_types)) return []
        
        return driver.vehicle_types.map((vehicleType: string, index: number) => ({
          id: `${driver.id}-${vehicleType}-${index}`,
          driver_id: driver.id,
          driver_name: driver.full_name,
          driver_email: driver.email,
          vehicle_type: vehicleType,
          make: driver.vehicle_model || 'Unknown',
          model: driver.vehicle_model || 'Unknown',
          year: driver.vehicle_year || 'Unknown',
          license_plate: driver.vehicle_reg_number || 'Unknown',
          vin: `VIN-${driver.id.slice(0, 8)}-${index}`,
          color: 'Unknown',
          capacity: getVehicleCapacity(vehicleType),
          status: driver.status === 'approved' ? 'active' : 'inactive',
          insurance_number: `INS-${driver.id.slice(0, 8)}`,
          insurance_expiry: '2024-12-31',
          registration_expiry: '2024-12-31',
          last_maintenance: '2024-01-15',
          next_maintenance: '2024-07-15',
          created_at: driver.created_at,
        }))
      })
      
      setVehicles(extractedVehicles)
    } catch (error) {
      console.error('Failed to load vehicles data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getVehicleCapacity = (type: string) => {
    const vehicle = vehicleTypes.find(v => v.value === type)
    return vehicle?.capacity || 'Unknown'
  }

  const handleCreateVehicle = async () => {
    if (!formData.vehicle_type || !formData.make || !formData.model || !formData.license_plate) return
    
    setIsProcessing(true)
    try {
      // This would typically create a vehicle record
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await loadVehiclesData()
      setShowCreateModal(false)
      setFormData({
        vehicle_type: '',
        make: '',
        model: '',
        year: '',
        license_plate: '',
        vin: '',
        color: '',
        capacity: '',
        driver_id: '',
        insurance_number: '',
        insurance_expiry: '',
        registration_expiry: '',
        last_maintenance: '',
        next_maintenance: '',
      })
    } catch (error) {
      console.error('Failed to create vehicle:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return vehicleStatuses.find(s => s.value === status) || vehicleStatuses[0]
  }

  const getVehicleInfo = (type: string) => {
    return vehicleTypes.find(v => v.value === type) || vehicleTypes[0]
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = `${vehicle.make} ${vehicle.model} ${vehicle.license_plate} ${vehicle.driver_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !typeFilter || vehicle.vehicle_type === typeFilter
    const matchesStatus = !statusFilter || vehicle.status === statusFilter
    const matchesDriver = !driverFilter || vehicle.driver_id === driverFilter
    return matchesSearch && matchesType && matchesStatus && matchesDriver
  })

  const activeVehicles = vehicles.filter(v => v.status === 'active')
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance')
  const totalCapacity = vehicles.reduce((sum, v) => {
    const capacity = parseFloat(v.capacity?.split(' ')[0] || '0')
    return sum + capacity
  }, 0)

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
              <h1 className="text-3xl font-bold text-gray-900">Vehicle Fleet</h1>
              <p className="mt-2 text-sm text-gray-600">Manage delivery vehicles and maintenance schedules</p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Vehicle Type</label>
                      <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Driver</label>
                      <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.filter(d => d.status === 'approved').map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Make</label>
                      <Input
                        value={formData.make}
                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                        placeholder="Toyota"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Model</label>
                      <Input
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="Hilux"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Year</label>
                      <Input
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        placeholder="2022"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">License Plate</label>
                      <Input
                        value={formData.license_plate}
                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                        placeholder="ABC-1234"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">VIN</label>
                      <Input
                        value={formData.vin}
                        onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                        placeholder="1HGBH41JXMN109186"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Color</label>
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="White"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Capacity (tons)</label>
                      <Input
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="2.5"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Insurance Number</label>
                      <Input
                        value={formData.insurance_number}
                        onChange={(e) => setFormData({ ...formData, insurance_number: e.target.value })}
                        placeholder="INS-123456"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={handleCreateVehicle} disabled={!formData.vehicle_type || !formData.make || !formData.model || !formData.license_plate || isProcessing}>
                      {isProcessing ? 'Creating...' : 'Add Vehicle'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Truck className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{activeVehicles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">{maintenanceVehicles.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Fuel className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCapacity.toFixed(1)} tons</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search vehicles by make, model, plate, or driver..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <Truck className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {vehicleStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={driverFilter} onValueChange={setDriverFilter}>
                  <SelectTrigger className="w-40">
                    <Users className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Drivers</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles List */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Fleet</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredVehicles.length > 0 ? (
              <div className="space-y-4">
                {filteredVehicles.map((vehicle) => {
                  const statusInfo = getStatusInfo(vehicle.status)
                  const vehicleInfo = getVehicleInfo(vehicle.vehicle_type)
                  const StatusIcon = statusInfo.icon
                  const VehicleIcon = vehicleInfo.icon
                  
                  return (
                    <div key={vehicle.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <VehicleIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">
                                {vehicle.make} {vehicle.model}
                              </h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <VehicleIcon className="w-3 h-3 mr-1" />
                                {vehicleInfo.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <span className="font-medium">Plate:</span> {vehicle.license_plate}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium">Year:</span> {vehicle.year}
                              </div>
                              <div className="flex items-center">
                                <span className="font-medium">Capacity:</span> {vehicle.capacity}
                              </div>
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1" />
                                {vehicle.driver_name}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Next maintenance: {vehicle.next_maintenance}
                              </div>
                              <div className="flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Insurance: {vehicle.insurance_expiry}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Manage
                          </Button>
                          <Button variant="outline" size="sm">
                            <Wrench className="w-4 h-4 mr-2" />
                            Maintenance
                          </Button>
                          <Button variant="outline" size="sm">
                            <MapPin className="w-4 h-4 mr-2" />
                            Track
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Truck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchTerm || typeFilter || statusFilter || driverFilter ? 'No vehicles found' : 'No vehicles yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {searchTerm || typeFilter || statusFilter || driverFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first vehicle'
                  }
                </p>
                {!searchTerm && !typeFilter && !statusFilter && !driverFilter && (
                  <div className="mt-6">
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Vehicle
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

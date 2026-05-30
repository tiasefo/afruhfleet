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
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Search,
  Loader2,
  Car,
  Truck,
  Bike,
  CheckCircle,
  XCircle,
  Clock,
  Navigation,
  Star,
  Calendar,
  Filter,
  Building
} from 'lucide-react'

const driverStatuses = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock },
  { value: 'under_review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  { value: 'suspended', label: 'Suspended', color: 'bg-orange-100 text-orange-800', icon: XCircle },
]

const availabilityStatuses = [
  { value: 'offline', label: 'Offline', color: 'bg-gray-100 text-gray-800' },
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-800' },
  { value: 'en_route_pickup', label: 'En Route to Pickup', color: 'bg-blue-100 text-blue-800' },
  { value: 'delivering', label: 'Delivering', color: 'bg-purple-100 text-purple-800' },
]

const vehicleTypes = [
  { value: 'truck', label: 'Truck', icon: Truck },
  { value: 'car', label: 'Car', icon: Car },
  { value: 'motorbike', label: 'Motorbike', icon: Bike },
  { value: 'bicycle', label: 'Bicycle', icon: Bike },
]

export default function DriversPage() {
  const { user } = useAuth()
  const { branding } = useBranding()
  const { t } = useTranslation()
  
  const [drivers, setDrivers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  
  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    setIsLoading(true)
    try {
      const driversData = await vendorAPI.getVendors()
      setDrivers(driversData || [])
    } catch (error) {
      console.error('Failed to load drivers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    return driverStatuses.find(s => s.value === status) || driverStatuses[0]
  }

  const getAvailabilityInfo = (status: string) => {
    return availabilityStatuses.find(s => s.value === status) || availabilityStatuses[0]
  }

  const getVehicleInfo = (type: string) => {
    return vehicleTypes.find(v => v.value === type) || vehicleTypes[0]
  }

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = `${driver.full_name} ${driver.email} ${driver.phone}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || driver.status === statusFilter
    const matchesAvailability = !availabilityFilter || driver.availability_status === availabilityFilter
    const matchesVehicle = !vehicleFilter || driver.vehicle_types?.includes(vehicleFilter)
    return matchesSearch && matchesStatus && matchesAvailability && matchesVehicle
  })

  const activeDrivers = drivers.filter(d => d.status === 'approved')
  const availableDrivers = drivers.filter(d => d.availability_status === 'available')
  const deliveringDrivers = drivers.filter(d => d.availability_status === 'delivering')

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
              <h1 className="text-3xl font-bold text-gray-900">Fleet Drivers</h1>
              <p className="mt-2 text-sm text-gray-600">Manage delivery drivers and vehicle fleet</p>
            </div>
            <Button>
              <Users className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                  <p className="text-2xl font-bold text-gray-900">{activeDrivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Navigation className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Now</p>
                  <p className="text-2xl font-bold text-gray-900">{availableDrivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Car className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Delivering</p>
                  <p className="text-2xl font-bold text-gray-900">{deliveringDrivers.length}</p>
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
                    placeholder="Search drivers by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {driverStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Availability</SelectItem>
                    {availabilityStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-40">
                    <Car className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Vehicles</SelectItem>
                    {vehicleTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drivers List */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDrivers.length > 0 ? (
              <div className="space-y-4">
                {filteredDrivers.map((driver) => {
                  const statusInfo = getStatusInfo(driver.status)
                  const availabilityInfo = getAvailabilityInfo(driver.availability_status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={driver.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-medium text-gray-900">{driver.full_name}</h3>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <Badge className={availabilityInfo.color}>
                                {availabilityInfo.label}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              {driver.email && (
                                <div className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {driver.email}
                                </div>
                              )}
                              {driver.phone && (
                                <div className="flex items-center">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {driver.phone}
                                </div>
                              )}
                              {driver.business_name && (
                                <div className="flex items-center">
                                  <Building className="h-3 w-3 mr-1" />
                                  {driver.business_name}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Star className="h-3 w-3 mr-1" />
                                {driver.average_rating || 'N/A'}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {driver.total_deliveries || 0} deliveries
                              </div>
                            </div>
                            
                            {driver.last_known_location && (
                              <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                                <MapPin className="h-3 w-3" />
                                <span>Last seen: {driver.last_known_location}</span>
                              </div>
                            )}
                            
                            {driver.vehicle_types && driver.vehicle_types.length > 0 && (
                              <div className="flex items-center space-x-2 mt-2">
                                {driver.vehicle_types.map((vehicleType: string) => {
                                  const vehicleInfo = getVehicleInfo(vehicleType)
                                  const VehicleIcon = vehicleInfo.icon
                                  return (
                                    <Badge key={vehicleType} variant="outline" className="text-xs">
                                      <VehicleIcon className="w-3 h-3 mr-1" />
                                      {vehicleInfo.label}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Navigation className="w-4 h-4 mr-2" />
                            Track
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-2" />
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  {searchTerm || statusFilter || availabilityFilter || vehicleFilter ? 'No drivers found' : 'No drivers yet'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {searchTerm || statusFilter || availabilityFilter || vehicleFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first driver'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

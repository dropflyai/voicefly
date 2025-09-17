"use client"

import { useState, useEffect } from 'react'
import { MapPin, Phone, Clock, Users, Plus, Edit, Trash2, Settings, Building, Mail } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email: string
  hours: {
    [key: string]: string
  }
  staff_count: number
  services: string[]
  status: 'active' | 'inactive' | 'maintenance'
  manager: string
  established: string
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // Demo location data
    const demoLocations: Location[] = [
      {
        id: 'loc_1',
        name: 'Downtown Voice Center',
        address: '123 Business District Blvd',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        phone: '+1 (555) 123-4567',
        email: 'downtown@voicefly.ai',
        hours: {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM',
          wednesday: '9:00 AM - 6:00 PM',
          thursday: '9:00 AM - 6:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: '10:00 AM - 2:00 PM',
          sunday: 'Closed'
        },
        staff_count: 25,
        services: ['Voice AI Setup', 'Training', 'Technical Support', 'Consultations'],
        status: 'active',
        manager: 'Sarah Johnson',
        established: '2023-01-15'
      },
      {
        id: 'loc_2',
        name: 'Tech Hub Branch',
        address: '456 Innovation Drive',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        phone: '+1 (555) 234-5678',
        email: 'austin@voicefly.ai',
        hours: {
          monday: '8:00 AM - 7:00 PM',
          tuesday: '8:00 AM - 7:00 PM',
          wednesday: '8:00 AM - 7:00 PM',
          thursday: '8:00 AM - 7:00 PM',
          friday: '8:00 AM - 6:00 PM',
          saturday: '9:00 AM - 3:00 PM',
          sunday: 'Closed'
        },
        staff_count: 18,
        services: ['Enterprise Solutions', 'Custom Integrations', 'Advanced Training'],
        status: 'active',
        manager: 'Michael Chen',
        established: '2023-06-20'
      },
      {
        id: 'loc_3',
        name: 'East Coast Operations',
        address: '789 Corporate Plaza',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1 (555) 345-6789',
        email: 'nyc@voicefly.ai',
        hours: {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM',
          wednesday: '9:00 AM - 6:00 PM',
          thursday: '9:00 AM - 6:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: 'Closed',
          sunday: 'Closed'
        },
        staff_count: 32,
        services: ['Voice AI Setup', 'Training', 'Support', 'Sales', 'Account Management'],
        status: 'active',
        manager: 'Jennifer Walsh',
        established: '2022-11-10'
      },
      {
        id: 'loc_4',
        name: 'West Coast Service Center',
        address: '321 Tech Valley Road',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        phone: '+1 (555) 456-7890',
        email: 'seattle@voicefly.ai',
        hours: {
          monday: '8:30 AM - 5:30 PM',
          tuesday: '8:30 AM - 5:30 PM',
          wednesday: '8:30 AM - 5:30 PM',
          thursday: '8:30 AM - 5:30 PM',
          friday: '8:30 AM - 4:30 PM',
          saturday: 'Closed',
          sunday: 'Closed'
        },
        staff_count: 15,
        services: ['Technical Support', 'Maintenance', 'Remote Assistance'],
        status: 'maintenance',
        manager: 'David Rodriguez',
        established: '2024-03-01'
      }
    ]
    setLocations(demoLocations)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-red-600 bg-red-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatAddress = (location: Location) => {
    return `${location.address}, ${location.city}, ${location.state} ${location.zipCode}`
  }

  const getTotalStaff = () => locations.reduce((sum, loc) => sum + loc.staff_count, 0)
  const getActiveLocations = () => locations.filter(loc => loc.status === 'active').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Locations</h1>
          <p className="text-gray-600">Manage your business locations and service centers</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Locations</p>
                <p className="text-2xl font-bold text-gray-900">{getActiveLocations()}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalStaff()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Staff/Location</p>
                <p className="text-2xl font-bold text-gray-900">
                  {locations.length > 0 ? Math.round(getTotalStaff() / locations.length) : 0}
                </p>
              </div>
              <Settings className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Locations List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">All Locations</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" />
                Add Location
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 ${
                    selectedLocation?.id === location.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{location.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(location.status)}`}>
                          {location.status}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {location.city}, {location.state}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        {location.staff_count} staff members
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-1" />
                        {location.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Details */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedLocation ? 'Location Details' : 'Select a Location'}
                </h3>
                {selectedLocation && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {selectedLocation ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">{selectedLocation.name}</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <p className="text-sm text-gray-600">{formatAddress(selectedLocation)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          <p className="text-sm text-gray-600">{selectedLocation.phone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-sm text-gray-600">{selectedLocation.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                          <p className="text-sm text-gray-600">{selectedLocation.manager}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Staff Count</label>
                          <p className="text-sm text-gray-600">{selectedLocation.staff_count} members</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Services Offered</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedLocation.services.map((service, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Hours */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Operating Hours</h5>
                    <div className="grid grid-cols-1 gap-1">
                      {Object.entries(selectedLocation.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="capitalize text-gray-600">{day}:</span>
                          <span className="text-gray-900">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      View on Map
                    </button>
                    <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm">
                      Contact Location
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No location selected</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose a location from the list to view its details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
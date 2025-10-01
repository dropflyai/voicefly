'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon, 
  BuildingStorefrontIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  ClockIcon,
  UserGroupIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Layout from '../../../../components/Layout'
import LocationForm from '../../../../components/LocationForm'
import { LocationAPIImpl, BusinessAPI } from '../../../../lib/supabase'
import type { Location, CreateLocationRequest, Business } from '../../../../lib/supabase-types-mvp'

// Mock business ID - in real app, this would come from auth context
const DEMO_BUSINESS_ID = '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'

interface LocationPageProps {
  params: {
    id: string
  }
}

export default function LocationPage({ params }: LocationPageProps) {
  const router = useRouter()
  const [location, setLocation] = useState<Location | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const locationAPI = new LocationAPIImpl()

  useEffect(() => {
    loadLocationData()
  }, [params.id])

  const loadLocationData = async () => {
    try {
      setIsPageLoading(true)
      setError(null)

      // Load business info
      const businessData = await BusinessAPI.getBusiness(DEMO_BUSINESS_ID)
      if (businessData) {
        setBusiness(businessData)
      }

      // Load all locations to find the specific one
      const locations = await locationAPI.getLocations(DEMO_BUSINESS_ID)
      const targetLocation = locations.find(loc => loc.id === params.id)
      
      if (!targetLocation) {
        setError('Location not found')
        return
      }

      setLocation(targetLocation)

    } catch (error) {
      console.error('Failed to load location:', error)
      setError('Failed to load location details. Please try again.')
    } finally {
      setIsPageLoading(false)
    }
  }

  const handleUpdateLocation = async (data: CreateLocationRequest) => {
    if (!location) return

    try {
      setIsLoading(true)
      const updatedLocation = await locationAPI.updateLocation(location.id, data)
      setLocation(updatedLocation)
      setIsEditFormOpen(false)
    } catch (error) {
      console.error('Failed to update location:', error)
      setError('Failed to update location. Please try again.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPrimary = async () => {
    if (!location || location.is_primary) return

    if (!confirm('Set this as your primary location? This will update your main business address.')) {
      return
    }

    try {
      setIsLoading(true)
      await locationAPI.setAsPrimary(location.id)
      setLocation(prev => prev ? { ...prev, is_primary: true } : null)
    } catch (error) {
      console.error('Failed to set primary location:', error)
      setError('Failed to set primary location. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteLocation = async () => {
    if (!location) return

    if (location.is_primary) {
      alert('Cannot delete the primary location. Please set another location as primary first.')
      return
    }

    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
      return
    }

    try {
      setIsLoading(true)
      await locationAPI.deleteLocation(location.id)
      router.push('/dashboard/locations')
    } catch (error) {
      console.error('Failed to delete location:', error)
      setError('Failed to delete location. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (location: Location) => {
    const parts = [
      location.address_line1,
      location.address_line2,
      `${location.city}, ${location.state} ${location.postal_code}`,
      location.country !== 'US' ? location.country : null
    ].filter(Boolean)
    return parts.join(', ')
  }

  if (isPageLoading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error && !location) {
    return (
      <Layout business={business}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Location Not Found</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/locations')}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Locations
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!location) {
    return null
  }

  return (
    <Layout business={business}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/locations')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {location.name}
                {location.is_primary && (
                  <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Primary
                  </span>
                )}
                {location.is_active ? (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="w-3 h-3 mr-1" />
                    Inactive
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Location details and management</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!location.is_primary && (
              <button
                onClick={handleSetPrimary}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Set as Primary
              </button>
            )}
            
            <button
              onClick={() => setIsEditFormOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              Edit Location
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="text-red-600 hover:text-red-700 underline text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Location Name</p>
                    <p className="text-gray-900">{location.name}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Address</p>
                    <p className="text-gray-900">{formatAddress(location)}</p>
                  </div>
                </div>

                {location.phone && (
                  <div className="flex items-start space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Phone</p>
                      <p className="text-gray-900">{location.phone}</p>
                    </div>
                  </div>
                )}

                {location.email && (
                  <div className="flex items-start space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-gray-900">{location.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Timezone</p>
                    <p className="text-gray-900">{location.timezone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Integration Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCardIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Square</p>
                      <p className="text-xs text-gray-500">Payment processing</p>
                    </div>
                  </div>
                  <div>
                    {location.square_location_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCardIcon className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Stripe</p>
                      <p className="text-xs text-gray-500">Payment processing</p>
                    </div>
                  </div>
                  <div>
                    {location.stripe_account_id ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Staff</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month's Appointments</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month's Revenue</span>
                  <span className="text-sm font-medium text-gray-900">-</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Location-specific analytics coming soon
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditFormOpen(true)}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Edit Location Details
                </button>

                {!location.is_primary && (
                  <>
                    <button
                      onClick={handleSetPrimary}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
                    >
                      Set as Primary Location
                    </button>
                    
                    <button
                      onClick={handleDeleteLocation}
                      disabled={isLoading}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete Location
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Modal */}
        <LocationForm
          location={location}
          isOpen={isEditFormOpen}
          onClose={() => setIsEditFormOpen(false)}
          onSubmit={handleUpdateLocation}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  )
}
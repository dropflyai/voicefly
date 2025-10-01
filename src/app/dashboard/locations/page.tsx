'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import LocationCard from '../../../components/LocationCard'
import LocationForm from '../../../components/LocationForm'
import Layout from '../../../components/Layout'
import { LocationAPIImpl, BusinessAPI } from '../../../lib/supabase'
import { BrandedSMSService } from '../../../lib/branded-sms-service'
import { BrandedEmailService } from '../../../lib/branded-email-service'
import type { Location, CreateLocationRequest, Business } from '../../../lib/supabase-types-mvp'

// Mock business ID - in real app, this would come from auth context
const DEMO_BUSINESS_ID = '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const locationAPI = new LocationAPIImpl()

  // Load initial data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsPageLoading(true)
      setError(null)

      // Load business info
      const businessData = await BusinessAPI.getBusiness(DEMO_BUSINESS_ID)
      if (businessData) {
        setBusiness(businessData)
      }

      // Load locations
      const locationsData = await locationAPI.getLocations(DEMO_BUSINESS_ID)
      setLocations(locationsData)

    } catch (error) {
      console.error('Failed to load locations:', error)
      setError('Failed to load locations. Please try again.')
    } finally {
      setIsPageLoading(false)
    }
  }

  const handleAddLocation = () => {
    setSelectedLocation(null)
    setIsFormOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location)
    setIsFormOpen(true)
  }

  const handleDeleteLocation = async (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId)
    
    if (!location) return
    
    if (!confirm(`Are you sure you want to delete "${location.name}"? This will:\n\n• Cancel all upcoming appointments at this location\n• Notify affected customers via SMS and email\n• Remove all location-specific data\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      setIsLoading(true)
      
      // First, send notifications to customers about location closure
      if (business) {
        await BrandedSMSService.sendEmergencyLocationBroadcast(
          DEMO_BUSINESS_ID,
          `Important: Our ${location.name} location is permanently closing. We will contact you personally to reschedule your appointments at our other locations. Thank you for your understanding.`,
          [locationId]
        )
      }
      
      // Delete the location
      await locationAPI.deleteLocation(locationId)
      
      // Remove from local state
      setLocations(prev => prev.filter(loc => loc.id !== locationId))
      
      // Show success message
      setError(`Successfully closed ${location.name}. Customer notifications have been sent.`)
    } catch (error) {
      console.error('Failed to delete location:', error)
      setError('Failed to delete location. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPrimary = async (locationId: string) => {
    try {
      const location = locations.find(loc => loc.id === locationId)
      if (!location) return
      
      await locationAPI.setAsPrimary(locationId)
      
      // Update local state
      setLocations(prev => prev.map(loc => ({
        ...loc,
        is_primary: loc.id === locationId
      })))
      
      // Send notification to staff about primary location change
      if (business) {
        // This would integrate with staff notification system in a real implementation
        console.log(`Primary location changed to: ${location.name}`)
        
        // Example of how staff notifications would work:
        // await BrandedSMSService.sendStaffLocationAlert(
        //   staffPhoneNumber,
        //   `Primary location has been changed to ${location.name}. Please update your schedules accordingly.`,
        //   locationId,
        //   DEMO_BUSINESS_ID
        // )
      }
      
      setError(`Successfully set ${location.name} as the primary location.`)
      
    } catch (error) {
      console.error('Failed to set primary location:', error)
      setError('Failed to set primary location. Please try again.')
    }
  }

  const handleFormSubmit = async (data: CreateLocationRequest) => {
    try {
      setIsLoading(true)
      
      if (selectedLocation) {
        // Update existing location
        const updated = await locationAPI.updateLocation(selectedLocation.id, data)
        setLocations(prev => prev.map(loc => 
          loc.id === selectedLocation.id ? updated : loc
        ))
        
        setError(`Successfully updated ${data.name} location details.`)
      } else {
        // Create new location
        const newLocation = await locationAPI.createLocation(DEMO_BUSINESS_ID, data)
        setLocations(prev => [...prev, newLocation])
        
        // Send notification about new location opening
        if (business && locations.length > 0) {
          // This would notify existing customers about the new location
          // In a real implementation, this would be more targeted
          console.log(`New location ${data.name} has been added!`)
          
          // Example of promotional SMS for new location:
          // await BrandedSMSService.sendCrossLocationPromotion(
          //   customerPhone,
          //   DEMO_BUSINESS_ID,
          //   `🎉 Exciting news! We've opened a new location at ${data.address_line1}, ${data.city}! Book your next appointment at any of our convenient locations.`,
          //   [newLocation.id]
          // )
        }
        
        setError(`Successfully added ${data.name} as a new location! ${locations.length === 0 ? 'This is now your primary location.' : ''}`)
      }

      setIsFormOpen(false)
      setSelectedLocation(null)
    } catch (error) {
      console.error('Failed to save location:', error)
      setError('Failed to save location. Please try again.')
      throw error // Re-throw to let form handle it
    } finally {
      setIsLoading(false)
    }
  }

  const getPrimaryLocation = () => {
    return locations.find(loc => loc.is_primary) || null
  }

  const getSecondaryLocations = () => {
    return locations.filter(loc => !loc.is_primary)
  }

  const canAddMoreLocations = () => {
    if (!business) return false
    
    const limits = {
      starter: 1,
      professional: 1,
      business: 3,
      enterprise: -1 // unlimited
    }
    
    const limit = limits[business.subscription_tier as keyof typeof limits] || 1
    return limit === -1 || locations.length < limit
  }

  const getMaxLocationsText = () => {
    if (!business) return ''
    
    const limits = {
      starter: '1 location',
      professional: '1 location', 
      business: '3 locations',
      enterprise: 'unlimited locations'
    }
    
    return limits[business.subscription_tier as keyof typeof limits] || '1 location'
  }

  if (isPageLoading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your salon locations. Your plan allows {getMaxLocationsText()}.
            </p>
          </div>
          
          {canAddMoreLocations() && (
            <button
              onClick={handleAddLocation}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Location
            </button>
          )}
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

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No locations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first location.
            </p>
            {canAddMoreLocations() && (
              <div className="mt-6">
                <button
                  onClick={handleAddLocation}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Your First Location
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Primary Location */}
            {getPrimaryLocation() && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Primary Location</h2>
                <LocationCard
                  location={getPrimaryLocation()!}
                  isPrimary={true}
                  onEdit={handleEditLocation}
                  onDelete={handleDeleteLocation}
                  onSetPrimary={handleSetPrimary}
                />
              </div>
            )}

            {/* Secondary Locations */}
            {getSecondaryLocations().length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Locations</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getSecondaryLocations().map(location => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      isPrimary={false}
                      onEdit={handleEditLocation}
                      onDelete={handleDeleteLocation}
                      onSetPrimary={handleSetPrimary}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add More Button */}
            {canAddMoreLocations() && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleAddLocation}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Another Location
                </button>
              </div>
            )}

            {/* Plan Limit Notice */}
            {!canAddMoreLocations() && business?.subscription_tier !== 'enterprise' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <BuildingStorefrontIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Location Limit Reached
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Your {business?.subscription_tier} plan allows {getMaxLocationsText()}. 
                        Upgrade to add more locations.
                      </p>
                    </div>
                    <div className="mt-4">
                      <div className="-mx-2 -my-1.5 flex">
                        <button
                          type="button"
                          className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location Form Modal */}
        <LocationForm
          location={selectedLocation}
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false)
            setSelectedLocation(null)
          }}
          onSubmit={handleFormSubmit}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  )
}
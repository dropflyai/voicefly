'use client'

import { useState, useEffect } from 'react'
import { PlusIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import Layout from '../../../../components/Layout'
import PaymentProcessorConfig from '../../../../components/PaymentProcessorConfig'
import LocationSelector from '../../../../components/LocationSelector'
import { PaymentAPIImpl, BusinessAPI, LocationAPIImpl } from '../../../../lib/supabase'
import type { PaymentProcessor, Business, Location } from '../../../../lib/supabase-types-mvp'

// Mock business ID - in real app, this would come from auth context
const DEMO_BUSINESS_ID = '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'

export default function PaymentProcessorsPage() {
  const [processors, setProcessors] = useState<PaymentProcessor[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paymentAPI = new PaymentAPIImpl()
  const locationAPI = new LocationAPIImpl()

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
      
      // Set primary location as default
      const primaryLocation = locationsData.find(loc => loc.is_primary)
      if (primaryLocation) {
        setSelectedLocation(primaryLocation)
      }

      // Load payment processors
      const processorsData = await paymentAPI.getPaymentProcessors(DEMO_BUSINESS_ID)
      setProcessors(processorsData)

    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsPageLoading(false)
    }
  }

  const handleSaveProcessor = async (processorData: Partial<PaymentProcessor>) => {
    if (!selectedLocation) {
      throw new Error('Please select a location first')
    }

    try {
      setIsLoading(true)
      
      const savedProcessor = await paymentAPI.configureProcessor(
        DEMO_BUSINESS_ID,
        selectedLocation.id,
        processorData
      )

      // Update local state
      setProcessors(prev => {
        const existingIndex = prev.findIndex(p => 
          p.processor_type === savedProcessor.processor_type && 
          p.location_id === savedProcessor.location_id
        )
        
        if (existingIndex >= 0) {
          return prev.map((p, i) => i === existingIndex ? savedProcessor : p)
        } else {
          return [...prev, savedProcessor]
        }
      })

    } catch (error) {
      console.error('Failed to save processor:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async (processorData: Partial<PaymentProcessor>): Promise<boolean> => {
    // Mock test - in real implementation, this would test the actual API connection
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Simulate success/failure based on whether API keys are provided
    const hasRequiredFields = processorData.api_key_public && 
                              processorData.api_key_secret && 
                              processorData.account_id

    if (processorData.processor_type === 'square') {
      return hasRequiredFields && !!processorData.application_id
    }

    return !!hasRequiredFields
  }

  const getProcessorForLocation = (processorType: 'square' | 'stripe', locationId: string) => {
    return processors.find(p => 
      p.processor_type === processorType && 
      p.location_id === locationId
    )
  }

  const createDefaultProcessor = (processorType: 'square' | 'stripe', locationId: string): Partial<PaymentProcessor> => {
    return {
      processor_type: processorType,
      business_id: DEMO_BUSINESS_ID,
      location_id: locationId,
      is_active: false,
      is_live_mode: false,
      api_key_public: '',
      api_key_secret: '',
      webhook_secret: '',
      account_id: '',
      application_id: processorType === 'square' ? '' : undefined,
      auto_capture: true,
      allow_tips: true,
      default_tip_percentages: [15, 18, 20, 25]
    }
  }

  if (isPageLoading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">Payment Processors</h1>
            <p className="text-gray-600 mt-1">
              Configure Square and Stripe payment processing for your locations
            </p>
          </div>
        </div>

        {/* Location Selector */}
        {locations.length > 1 && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Location</h3>
              <div className="max-w-md">
                <LocationSelector
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                  placeholder="Select a location"
                  includeAllOption={false}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Payment processors are configured per location. Select a location to manage its payment settings.
              </p>
            </div>
          </div>
        )}

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

        {!selectedLocation ? (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select a location</h3>
            <p className="mt-1 text-sm text-gray-500">
              Choose a location to configure payment processors.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Location Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CreditCardIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Configuring payment processors for: {selectedLocation.name}
                  </h3>
                  <p className="text-xs text-blue-700 mt-1">
                    {selectedLocation.city}, {selectedLocation.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Square Configuration */}
            <PaymentProcessorConfig
              processor={(
                getProcessorForLocation('square', selectedLocation.id) ||
                createDefaultProcessor('square', selectedLocation.id)
              ) as Partial<PaymentProcessor> & { processor_type: 'square' | 'stripe' }}
              onSave={handleSaveProcessor}
              onTest={handleTestConnection}
              businessId={business?.id}
              onImportServices={async () => {
                // Refresh services after import
                window.location.href = '/dashboard/services'
              }}
              isLoading={isLoading}
            />

            {/* Stripe Configuration */}
            <PaymentProcessorConfig
              processor={(
                getProcessorForLocation('stripe', selectedLocation.id) ||
                createDefaultProcessor('stripe', selectedLocation.id)
              ) as Partial<PaymentProcessor> & { processor_type: 'square' | 'stripe' }}
              onSave={handleSaveProcessor}
              onTest={handleTestConnection}
              businessId={business?.id}
              onImportServices={async () => {
                // Refresh services after import
                window.location.href = '/dashboard/services'
              }}
              isLoading={isLoading}
            />

            {/* Integration Guide */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Integration Guide</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Square Setup</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Sign up for a Square account</li>
                    <li>Get your Application ID from Square Developer Dashboard</li>
                    <li>Generate an Access Token for your location</li>
                    <li>Configure webhook endpoint (optional)</li>
                    <li>Test the connection before going live</li>
                  </ol>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Stripe Setup</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Create a Stripe account</li>
                    <li>Get your Publishable Key from the API keys section</li>
                    <li>Get your Secret Key (keep this secure)</li>
                    <li>Set up webhook endpoints for real-time updates</li>
                    <li>Test with sample payments before going live</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Security Notice
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Always start with sandbox/test mode before switching to live payments. 
                        Keep your secret keys secure and never share them publicly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
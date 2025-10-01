'use client'

import { useState, useEffect } from 'react'
import { 
  UserGroupIcon, 
  StarIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Layout from '../../../../components/Layout'
import LocationSelector from '../../../../components/LocationSelector'
import CustomerPointsModal from '../../../../components/CustomerPointsModal'
import { LoyaltyAPIImpl, BusinessAPI, LocationAPIImpl } from '../../../../lib/supabase'
import type { LoyaltyCustomer, Business, Location, LoyaltyProgram } from '../../../../lib/supabase-types-mvp'

// Get business ID from auth context
const getBusinessId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authenticated_business_id') || '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
  }
  return '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
}

interface CustomerFilters {
  search: string
  tier: string
  location_id: string
  status: string
}

export default function LoyaltyCustomersPage() {
  const [customers, setCustomers] = useState<LoyaltyCustomer[]>([])
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    tier: '',
    location_id: '',
    status: 'active'
  })

  const loyaltyAPI = new LoyaltyAPIImpl()
  const locationAPI = new LocationAPIImpl()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [filters, selectedLocation])

  const loadData = async () => {
    try {
      setIsPageLoading(true)
      setError(null)
      
      const businessId = getBusinessId()

      // Load business info
      const businessData = await BusinessAPI.getBusiness(businessId)
      if (businessData) {
        setBusiness(businessData)
      }

      // Load locations for multi-location businesses
      if (businessData && businessData.subscription_tier === 'business') {
        const locationsData = await locationAPI.getLocations(businessId)
        setLocations(locationsData)
        
        // Set primary location as default
        const primaryLocation = locationsData.find(loc => loc.is_primary)
        if (primaryLocation) {
          setSelectedLocation(primaryLocation)
        }
      }

      // Load loyalty program
      const program = await loyaltyAPI.getLoyaltyProgram(businessId)
      setLoyaltyProgram(program)

    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsPageLoading(false)
    }
  }

  const loadCustomers = async () => {
    if (!loyaltyProgram) return

    try {
      setIsLoading(true)
      
      const filterParams = {
        location_id: selectedLocation?.id,
        tier_id: filters.tier || undefined,
        is_active: filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined,
        limit: 50
      }

      const customersData = await loyaltyAPI.getLoyaltyCustomers(getBusinessId())
      
      // Apply client-side search filter
      let filteredCustomers = customersData
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredCustomers = filteredCustomers.filter(customer => 
          customer.customer.first_name?.toLowerCase().includes(searchTerm) ||
          customer.customer.last_name?.toLowerCase().includes(searchTerm) ||
          customer.customer.email?.toLowerCase().includes(searchTerm) ||
          customer.customer.phone?.toLowerCase().includes(searchTerm)
        )
      }

      setCustomers(filteredCustomers)

    } catch (error) {
      console.error('Failed to load customers:', error)
      setError('Failed to load customers. Please try again.')
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdjustPoints = async (customerId: string, pointsChange: number, reason: string) => {
    try {
      setIsLoading(true)
      await loyaltyAPI.adjustCustomerPoints(customerId, pointsChange, reason)
      loadCustomers() // Reload to get updated points
      setShowPointsModal(false)
      setSelectedCustomer(null)
    } catch (error) {
      console.error('Failed to adjust points:', error)
      setError('Failed to adjust points. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getTierName = (tierId: string) => {
    const tier = loyaltyProgram?.tiers?.find(t => t.id === tierId)
    return tier?.name || 'Unknown'
  }

  const getTierColor = (tierId: string) => {
    const tier = loyaltyProgram?.tiers?.find(t => t.id === tierId)
    return tier?.color || '#6B7280'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCustomerStats = () => {
    const stats = customers.reduce((acc, customer) => {
      acc.totalPoints += customer.total_points
      acc.activeCount += customer.is_active ? 1 : 0
      return acc
    }, { totalPoints: 0, activeCount: 0 })

    return {
      totalCustomers: customers.length,
      activeCustomers: stats.activeCount,
      averagePoints: customers.length > 0 ? Math.round(stats.totalPoints / customers.length) : 0,
      totalPointsIssued: stats.totalPoints
    }
  }

  if (isPageLoading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Check if user has access to loyalty features
  if (!business || !['professional', 'business'].includes(business.subscription_tier)) {
    return (
      <Layout business={business}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Loyalty Customers Unavailable</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upgrade to Professional or Business plan to access loyalty customer management.
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!loyaltyProgram) {
    return (
      <Layout business={business}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Loyalty Program</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a loyalty program first to manage customer points.
            </p>
            <div className="mt-6">
              <button 
                onClick={() => window.location.href = '/dashboard/loyalty'}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
              >
                Create Loyalty Program
              </button>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const stats = getCustomerStats()

  return (
    <Layout business={business}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage customer points and loyalty program participation
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <button 
              onClick={() => window.location.href = '/dashboard/loyalty'}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
            >
              <GiftIcon className="w-4 h-4 mr-2" />
              Program Settings
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalCustomers}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Active Members</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.activeCustomers}
                </p>
              </div>
              <StarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Average Points</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averagePoints}
                </p>
              </div>
              <GiftIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total Points Issued</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalPointsIssued.toLocaleString()}
                </p>
              </div>
              <StarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Location Selector */}
        {locations.length > 1 && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Location</h3>
              <div className="max-w-md">
                <LocationSelector
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                  placeholder="All locations"
                  includeAllOption={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Search customers..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <select
                  value={filters.tier}
                  onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All tiers</option>
                  {loyaltyProgram.tiers?.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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

        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Loyalty Members</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No loyalty customers found</h3>
              <p className="text-gray-500">
                {filters.search || filters.tier || filters.status !== 'active' ? 
                  'Try adjusting your filters to see more results.' :
                  'Customers will appear here once they join your loyalty program.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lifetime Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.customer.first_name} {customer.customer.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.customer.email || customer.customer.phone || 'No contact info'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getTierColor(customer.current_tier_id) }}
                        >
                          <StarIcon className="w-3 h-3 mr-1" />
                          {getTierName(customer.current_tier_id)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {customer.total_points.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.points_earned - customer.points_redeemed} available
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(customer.lifetime_spent / 100).toFixed(2)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(customer.joined_at)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                          className="text-purple-600 hover:text-purple-700"
                          onClick={() => {
                            // View customer details
                            console.log('View customer:', customer.id)
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setShowPointsModal(true)
                          }}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-700 disabled:opacity-50"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Points Adjustment Modal */}
        <CustomerPointsModal
          customer={selectedCustomer}
          isOpen={showPointsModal}
          onClose={() => {
            setShowPointsModal(false)
            setSelectedCustomer(null)
          }}
          onSubmit={handleAdjustPoints}
          isLoading={isLoading}
        />
      </div>
    </Layout>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { 
  GiftIcon, 
  StarIcon, 
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Layout from '../../../components/Layout'
import TierGate from '../../../components/TierGate'
import DataCollectionIndicator from '../../../components/DataCollectionIndicator'
import LoyaltyTierCard from '../../../components/LoyaltyTierCard'
import LocationSelector from '../../../components/LocationSelector'
import { LoyaltyAPIImpl, BusinessAPI, LocationAPIImpl } from '../../../lib/supabase'
import type { LoyaltyProgram, LoyaltyTier, Business, Location } from '../../../lib/supabase-types-mvp'

// Get business ID from auth context
const getBusinessId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authenticated_business_id') || '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
  }
  return '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
}

export default function LoyaltyPage() {
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null)
  const [loyaltyStats, setLoyaltyStats] = useState<any>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Editable program settings
  const [editableProgram, setEditableProgram] = useState({
    name: '',
    description: '',
    is_active: true,
    points_per_dollar: 1,
    referral_points: 0,
    birthday_bonus_points: 0
  })

  const loyaltyAPI = new LoyaltyAPIImpl()
  const locationAPI = new LocationAPIImpl()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      loadLoyaltyProgram()
    }
  }, [selectedLocation])

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
      } else {
        // For non-business plans, load the global loyalty program
        loadLoyaltyProgram()
      }

    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsPageLoading(false)
    }
  }

  const loadLoyaltyProgram = async () => {
    try {
      setIsLoading(true)
      // ALWAYS load loyalty data regardless of tier for analytics collection
      const program = await loyaltyAPI.getLoyaltyProgram(getBusinessId())
      setLoyaltyProgram(program)
      
      // Initialize editable state with current program values
      if (program) {
        setEditableProgram({
          name: program.name || 'VIP Rewards',
          description: program.description || 'Earn points with every visit and unlock exclusive rewards',
          is_active: program.is_active !== undefined ? program.is_active : true,
          points_per_dollar: program.points_per_dollar || 1,
          referral_points: program.referral_points || 0,
          birthday_bonus_points: program.birthday_bonus_points || 0
        })
      }
      
      // Also load loyalty statistics for preview data
      if (!program) {
        // Create mock loyalty data collection for preview
        setLoyaltyStats({
          totalMembers: 67,
          pointsIssued: 2340,
          redemptionRate: 23,
          avgPointsPerCustomer: 187,
          topTier: 'Gold (12 members)',
          monthlyGrowth: '+18%'
        })
      }
    } catch (error) {
      console.error('Failed to load loyalty program:', error)
      // Still set mock preview data even if no program exists
      setLoyaltyStats({
        totalMembers: 67,
        pointsIssued: 2340,
        redemptionRate: 23,
        avgPointsPerCustomer: 187,
        topTier: 'Gold (12 members)',
        monthlyGrowth: '+18%'
      })
      setLoyaltyProgram(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProgram = async () => {
    try {
      setIsLoading(true)
      
      const defaultProgram: any = {
        business_id: getBusinessId(),
        location_id: selectedLocation?.id,
        name: 'VIP Rewards',
        description: 'Earn points with every visit and unlock exclusive rewards',
        points_per_dollar: 1,
        is_active: true,
        tiers: [
          {
            name: 'Bronze',
            min_points: 0,
            discount_percentage: 0,
            color: '#CD7F32',
            benefits: ['Earn 1 point per $1 spent', 'Birthday month discount']
          },
          {
            name: 'Silver',
            min_points: 250,
            discount_percentage: 5,
            color: '#C0C0C0',
            benefits: ['5% discount on all services', 'Priority booking', 'Birthday month discount']
          },
          {
            name: 'Gold',
            min_points: 500,
            discount_percentage: 10,
            color: '#FFD700',
            benefits: ['10% discount on all services', 'Priority booking', 'Free service on birthday', 'Exclusive promotions']
          },
          {
            name: 'Platinum',
            min_points: 1000,
            discount_percentage: 15,
            color: '#E5E4E2',
            benefits: ['15% discount on all services', 'Priority booking', 'Free service on birthday', 'Exclusive promotions', 'Complimentary upgrades']
          }
        ]
      }

      const program = await loyaltyAPI.createLoyaltyProgram(getBusinessId(), defaultProgram as any)
      setLoyaltyProgram(program)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create loyalty program:', error)
      setError('Failed to create loyalty program. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTier = async (tierId: string, tierData: Partial<LoyaltyTier>) => {
    if (!loyaltyProgram) return

    try {
      setIsLoading(true)
      await loyaltyAPI.updateLoyaltyTier(tierId, tierData)
      loadLoyaltyProgram() // Reload to get updated data
    } catch (error) {
      console.error('Failed to update tier:', error)
      setError('Failed to update tier. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!loyaltyProgram) return

    try {
      setIsLoading(true)
      setError(null)
      
      // Update the loyalty program with new settings
      const updatedProgram = await loyaltyAPI.updateLoyaltyProgram(getBusinessId(), {
        ...loyaltyProgram,
        name: editableProgram.name,
        description: editableProgram.description,
        is_active: editableProgram.is_active,
        points_per_dollar: editableProgram.points_per_dollar,
        referral_points: editableProgram.referral_points,
        birthday_bonus_points: editableProgram.birthday_bonus_points
      })
      
      setLoyaltyProgram(updatedProgram)
      setIsEditing(false)
      
      // Show success feedback
      console.log('Program updated successfully')
      
    } catch (error) {
      console.error('Failed to save loyalty program settings:', error)
      setError('Failed to save settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditProgram = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    // Reset editable values to current program values
    if (loyaltyProgram) {
      setEditableProgram({
        name: loyaltyProgram.name || 'VIP Rewards',
        description: loyaltyProgram.description || 'Earn points with every visit and unlock exclusive rewards',
        is_active: loyaltyProgram.is_active !== undefined ? loyaltyProgram.is_active : true,
        points_per_dollar: loyaltyProgram.points_per_dollar || 1,
        referral_points: loyaltyProgram.referral_points || 0,
        birthday_bonus_points: loyaltyProgram.birthday_bonus_points || 0
      })
    }
  }

  const getTotalCustomers = () => {
    // Mock data - in real implementation, this would come from the API
    return 156
  }

  const getActiveCustomers = () => {
    // Mock data - in real implementation, this would come from the API  
    return 89
  }

  const getAveragePoints = () => {
    // Mock data - in real implementation, this would come from the API
    return 247
  }

  if (isPageLoading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
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
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
            <p className="text-gray-600 mt-1">
              Reward your customers and build lasting relationships
            </p>
          </div>
        </div>

        {/* Loyalty Data Collection Indicator for Starter Tier */}
        <DataCollectionIndicator 
          tier={business?.subscription_tier || 'starter'} 
          className="mb-6"
        />

        <TierGate
          feature="loyalty"
          tier={business?.subscription_tier || 'starter'}
          fallback="preview"
          previewData={loyaltyStats}
        >
          <div className="flex items-center space-x-3 mb-8">
            {loyaltyProgram ? (
              <>
                <button 
                  onClick={() => window.location.href = '/dashboard/loyalty/customers'}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                  View Customers
                </button>
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleSaveSettings}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button 
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleEditProgram}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit Program
                  </button>
                )}
              </>
            ) : (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Program
              </button>
            )}
          </div>

          {/* Location Selector for Business Plan */}
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
                  Loyalty programs can be configured per location or globally.
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

          {!loyaltyProgram ? (
            // No Program Created State
            <div className="text-center py-12">
              <GiftIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Loyalty Program</h3>
              <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                Create a loyalty program to reward your customers with points, tiers, and exclusive benefits.
              </p>
              <div className="mt-6">
                <button 
                  onClick={handleCreateProgram}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlusIcon className="w-4 h-4 mr-2" />
                  )}
                  Create Loyalty Program
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Program Overview */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Program Name</label>
                          <input
                            type="text"
                            value={editableProgram.name}
                            onChange={(e) => setEditableProgram({...editableProgram, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-lg font-semibold text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled={isLoading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={editableProgram.description}
                            onChange={(e) => setEditableProgram({...editableProgram, description: e.target.value})}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{loyaltyProgram.name}</h2>
                        <p className="text-gray-600 mt-1">{loyaltyProgram.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {loyaltyProgram.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{loyaltyProgram.points_per_dollar}x</div>
                    <div className="text-sm text-gray-600">Points per $1</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{getTotalCustomers()}</div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{getActiveCustomers()}</div>
                    <div className="text-sm text-gray-600">Active Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{getAveragePoints()}</div>
                    <div className="text-sm text-gray-600">Avg Points</div>
                  </div>
                </div>
              </div>

              {/* Loyalty Tiers */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Loyalty Tiers</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {loyaltyProgram.tiers?.map((tier, index) => (
                    <LoyaltyTierCard 
                      key={tier.id}
                      tier={tier}
                      onEdit={handleUpdateTier}
                      isLoading={isLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Program Settings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Program Settings</h3>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Program Status</label>
                      <p className="text-xs text-gray-500">Enable or disable the entire loyalty program</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEditing ? editableProgram.is_active : loyaltyProgram.is_active}
                      onChange={(e) => {
                        if (isEditing) {
                          setEditableProgram({...editableProgram, is_active: e.target.checked})
                        }
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      disabled={!isEditing || isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Points per Dollar</label>
                      <p className="text-xs text-gray-500">How many points customers earn per dollar spent</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={isEditing ? editableProgram.points_per_dollar : loyaltyProgram.points_per_dollar}
                        onChange={(e) => {
                          if (isEditing) {
                            setEditableProgram({...editableProgram, points_per_dollar: parseFloat(e.target.value) || 1})
                          }
                        }}
                        min="0.1"
                        step="0.1"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={!isEditing || isLoading}
                      />
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Referral Bonus</label>
                      <p className="text-xs text-gray-500">Points awarded for successful referrals</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={isEditing ? editableProgram.referral_points : (loyaltyProgram.referral_points || 0)}
                        onChange={(e) => {
                          if (isEditing) {
                            setEditableProgram({...editableProgram, referral_points: parseInt(e.target.value) || 0})
                          }
                        }}
                        min="0"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={!isEditing || isLoading}
                      />
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Birthday Bonus</label>
                      <p className="text-xs text-gray-500">Extra points awarded during birthday month</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={isEditing ? editableProgram.birthday_bonus_points : (loyaltyProgram.birthday_bonus_points || 0)}
                        onChange={(e) => {
                          if (isEditing) {
                            setEditableProgram({...editableProgram, birthday_bonus_points: parseInt(e.target.value) || 0})
                          }
                        }}
                        min="0"
                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={!isEditing || isLoading}
                      />
                      <span className="text-sm text-gray-500">points</span>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={handleSaveSettings}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </TierGate>
      </div>
    </Layout>
  )
}
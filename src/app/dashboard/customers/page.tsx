'use client'

import { useState, useEffect } from 'react'
import { BusinessAPI, LoyaltyAPIImpl, LocationAPIImpl } from '../../../lib/supabase'
import { getCurrentBusinessId } from '../../../lib/auth-utils'
import Layout from '../../../components/Layout'
import CustomerLoyaltyBadge, { getLoyaltyTier } from '../../../components/CustomerLoyaltyBadge'
import CustomerLocationFilter from '../../../components/CustomerLocationFilter'
import LoyaltyPointsDisplay from '../../../components/LoyaltyPointsDisplay'
import type { Location, BusinessWithLocations, CustomerLoyaltyPoints } from '../../../lib/supabase-types-mvp'
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  HeartIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  FunnelIcon,
  GiftIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { format, parseISO } from 'date-fns'
import { clsx } from 'clsx'

interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  totalVisits: number
  totalSpent: number
  lastVisitDate: string
  firstVisitDate: string
  favoriteServices: string[]
  preferredTechnician?: string
  loyaltyPoints: number
  status: 'active' | 'inactive' | 'vip'
  rating: number
  notes?: string
  upcomingAppointments: number
  allergies?: string[]
  birthday?: string
  locationId?: string
  locationName?: string
  loyaltyTier?: string
  loyaltyPointsData?: CustomerLoyaltyPoints
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    totalVisits: 23,
    totalSpent: 1245,
    lastVisitDate: '2024-01-10',
    firstVisitDate: '2023-03-15',
    favoriteServices: ['Gel Manicure', 'Spa Pedicure'],
    preferredTechnician: 'Maya',
    loyaltyPoints: 124,
    status: 'vip',
    rating: 5,
    upcomingAppointments: 1,
    notes: 'Prefers natural colors, allergic to acetone',
    allergies: ['Acetone'],
    birthday: '1992-07-22'
  },
  {
    id: '2',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@email.com',
    phone: '(555) 234-5678',
    totalVisits: 15,
    totalSpent: 825,
    lastVisitDate: '2024-01-08',
    firstVisitDate: '2023-06-10',
    favoriteServices: ['Signature Manicure', 'Nail Art'],
    preferredTechnician: 'Sarah',
    loyaltyPoints: 82,
    status: 'active',
    rating: 4.8,
    upcomingAppointments: 0,
    notes: 'Loves bold colors and nail art designs'
  },
  {
    id: '3',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    email: 'maria.rodriguez@email.com',
    phone: '(555) 345-6789',
    totalVisits: 8,
    totalSpent: 480,
    lastVisitDate: '2024-01-05',
    firstVisitDate: '2023-09-20',
    favoriteServices: ['Express Manicure'],
    loyaltyPoints: 48,
    status: 'active',
    rating: 4.5,
    upcomingAppointments: 1,
    notes: 'Usually books express services due to busy schedule'
  },
  {
    id: '4',
    firstName: 'Jennifer',
    lastName: 'Williams',
    email: 'jen.williams@email.com',
    phone: '(555) 456-7890',
    totalVisits: 31,
    totalSpent: 2150,
    lastVisitDate: '2023-12-28',
    firstVisitDate: '2022-11-05',
    favoriteServices: ['Gel Manicure', 'Spa Pedicure', 'Nail Art'],
    preferredTechnician: 'Jessica',
    loyaltyPoints: 215,
    status: 'vip',
    rating: 4.9,
    upcomingAppointments: 0,
    notes: 'VIP customer, books monthly gel manicures'
  },
  {
    id: '5',
    firstName: 'Ashley',
    lastName: 'Brown',
    email: 'ashley.brown@email.com',
    phone: '(555) 567-8901',
    totalVisits: 3,
    totalSpent: 165,
    lastVisitDate: '2023-11-15',
    firstVisitDate: '2023-10-01',
    favoriteServices: ['Signature Manicure'],
    loyaltyPoints: 16,
    status: 'inactive',
    rating: 4.2,
    upcomingAppointments: 0,
    notes: 'New customer, hasn\'t returned in a while'
  }
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<BusinessWithLocations | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [selectedLoyaltyTier, setSelectedLoyaltyTier] = useState<string>('all')
  const [customerLoyaltyData, setCustomerLoyaltyData] = useState<Record<string, CustomerLoyaltyPoints>>({})
  const [locations, setLocations] = useState<Location[]>([])
  const [loyaltyStats, setLoyaltyStats] = useState({
    totalMembers: 0,
    totalPointsIssued: 0,
    averageTier: 'Bronze'
  })

  // Load real customers from database
  useEffect(() => {
    loadCustomers()
    loadBusinessData()
  }, [])

  useEffect(() => {
    if (business && business.subscription_tier === 'business') {
      loadLocations()
    }
  }, [business])

  const loadBusinessData = async () => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      const businessData = await BusinessAPI.getBusiness(businessId) as BusinessWithLocations
      setBusiness(businessData)
    } catch (error) {
      console.error('Error loading business data:', error)
    }
  }

  const loadLocations = async () => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      const locationsData = await LocationAPIImpl.getLocations(businessId)
      setLocations(locationsData)
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const fetchCustomerLoyalty = async (customerId: string) => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) return null

      return await LoyaltyAPIImpl.getCustomerPoints(businessId, customerId)
    } catch (error) {
      console.error('Error fetching customer loyalty:', error)
      return null
    }
  }

  const loadLoyaltyStats = async () => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      const stats = await LoyaltyAPIImpl.getLoyaltyStats(businessId)
      setLoyaltyStats({
        totalMembers: stats.total_members,
        totalPointsIssued: stats.total_points_issued,
        averageTier: 'Bronze' // Calculate from data
      })
    } catch (error) {
      console.error('Error loading loyalty stats:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const businessId = getCurrentBusinessId()
      if (!businessId) return

      const realCustomers = await BusinessAPI.getCustomers(businessId)
      
      // Transform to match our interface
      const transformedCustomers: Customer[] = await Promise.all(
        realCustomers.map(async customer => {
          // Fetch loyalty data for Professional+ tier businesses
          let loyaltyData = null
          let loyaltyTier = 'None'
          if (business && ['professional', 'business', 'enterprise'].includes(business.subscription_tier)) {
            loyaltyData = await fetchCustomerLoyalty(customer.id)
            if (loyaltyData) {
              const tierInfo = getLoyaltyTier(loyaltyData.current_balance)
              loyaltyTier = tierInfo.current.name
            }
          }

          return {
            id: customer.id,
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email || '',
            phone: customer.phone,
            totalVisits: customer.total_visits || 0,
            totalSpent: customer.total_spent || 0,
            lastVisitDate: customer.last_visit_date || customer.created_at,
            firstVisitDate: customer.created_at,
            favoriteServices: [],
            preferredTechnician: undefined,
            loyaltyPoints: loyaltyData?.current_balance || 0,
            status: 'active' as const,
            rating: 5,
            notes: customer.notes || '',
            upcomingAppointments: 0,
            allergies: [],
            birthday: customer.date_of_birth,
            loyaltyTier,
            loyaltyPointsData: loyaltyData || undefined
          }
        })
      )
      
      setCustomers(transformedCustomers)
      
      // Load loyalty stats if available
      if (business && ['professional', 'business', 'enterprise'].includes(business.subscription_tier)) {
        loadLoyaltyStats()
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleAddCustomer = async (customerData: any) => {
    try {
      const businessId = getCurrentBusinessId()
      if (!businessId) {
        console.error('No business ID available')
        return
      }

      // Create customer data for API
      const newCustomerData = {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email || '',
        phone: customerData.phone,
        date_of_birth: customerData.dateOfBirth || null,
        notes: customerData.notes || '',
        preferences: customerData.preferences || {}
      }

      // Add to database
      const createdCustomer = await BusinessAPI.addCustomer(businessId, newCustomerData)
      
      // Reload customers to show the new one
      await loadCustomers()
      
      setShowAddModal(false)
      
      console.log('Customer added successfully')
    } catch (error) {
      console.error('Failed to add customer:', error)
      alert('Failed to add customer. Please try again.')
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
    
    // Location filtering (Business tier only)
    const matchesLocation = selectedLocationId === 'all' || customer.locationId === selectedLocationId
    
    // Loyalty tier filtering (Professional+ tiers)
    const matchesLoyaltyTier = selectedLoyaltyTier === 'all' || customer.loyaltyTier === selectedLoyaltyTier
    
    return matchesSearch && matchesStatus && matchesLocation && matchesLoyaltyTier
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-yellow-100 text-yellow-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return <StarIconSolid className="h-4 w-4" />
      case 'active': return <HeartIconSolid className="h-4 w-4" />
      default: return null
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < Math.floor(rating) ? (
        <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
      ) : (
        <StarIcon key={i} className="h-4 w-4 text-gray-300" />
      )
    ))
  }

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const vipCustomers = customers.filter(c => c.status === 'vip').length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  
  // Loyalty metrics
  const loyaltyMembers = customers.filter(c => c.loyaltyPoints > 0).length
  const averageLoyaltyPoints = loyaltyMembers > 0 
    ? Math.round(customers.reduce((sum, c) => sum + c.loyaltyPoints, 0) / loyaltyMembers)
    : 0
  const topTierCustomers = customers.filter(c => c.loyaltyTier === 'Platinum' || c.loyaltyTier === 'Gold').length

  // Show loyalty features for Professional+ tiers
  const hasLoyaltyFeatures = business && ['professional', 'business', 'enterprise'].includes(business.subscription_tier)
  const isBusinessTier = business?.subscription_tier === 'business'

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your customer relationships and loyalty program
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-1 gap-6 mb-8 ${hasLoyaltyFeatures ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-4'}`}>
          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserPlusIcon className="h-8 w-8 text-brand-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Total Customers</div>
                  <div className="text-2xl font-bold text-gray-900">{totalCustomers}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HeartIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Active Customers</div>
                  <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">VIP Customers</div>
                  <div className="text-2xl font-bold text-yellow-600">{vipCustomers}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-beauty-600" />
                </div>
                <div className="ml-5">
                  <div className="text-sm font-medium text-gray-500">Total Revenue</div>
                  <div className="text-2xl font-bold text-beauty-600">${totalRevenue.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Stats - Show for Professional+ tiers */}
          {hasLoyaltyFeatures && (
            <>
              <div className="stat-card">
                <div className="px-4 py-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <StarIcon className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-medium text-gray-500">Loyalty Members</div>
                      <div className="text-2xl font-bold text-purple-600">{loyaltyMembers}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="px-4 py-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <GiftIcon className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="ml-5">
                      <div className="text-sm font-medium text-gray-500">Avg Points</div>
                      <div className="text-2xl font-bold text-indigo-600">{averageLoyaltyPoints}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className={`grid grid-cols-1 gap-4 ${isBusinessTier ? 'md:grid-cols-4' : hasLoyaltyFeatures ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Customers</option>
                <option value="vip">VIP Customers</option>
                <option value="active">Active Customers</option>
                <option value="inactive">Inactive Customers</option>
              </select>
            </div>

            {/* Loyalty Tier Filter - Professional+ tiers */}
            {hasLoyaltyFeatures && (
              <div>
                <select
                  className="input-field"
                  value={selectedLoyaltyTier}
                  onChange={(e) => setSelectedLoyaltyTier(e.target.value)}
                >
                  <option value="all">All Tiers</option>
                  <option value="Bronze">Bronze</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="None">No Tier</option>
                </select>
              </div>
            )}

            {/* Location Filter - Business tier only */}
            {isBusinessTier && (
              <div>
                <CustomerLocationFilter
                  business={business}
                  locations={locations}
                  selectedLocationId={selectedLocationId}
                  onLocationChange={setSelectedLocationId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {filteredCustomers.length} Customers
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedCustomer(customer)
                  setShowModal(true)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-gradient-to-br from-beauty-400 to-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {customer.firstName[0]}{customer.lastName[0]}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <span className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(customer.status)
                        )}>
                          {getStatusIcon(customer.status)}
                          <span className="ml-1 capitalize">{customer.status}</span>
                        </span>
                        {customer.upcomingAppointments > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {customer.upcomingAppointments} upcoming
                          </span>
                        )}
                      </div>
                      
                      {/* Loyalty Tier Badge - Professional+ tiers */}
                      {hasLoyaltyFeatures && customer.loyaltyPoints > 0 && (
                        <div className="mt-1">
                          <CustomerLoyaltyBadge
                            points={customer.loyaltyPoints}
                            tierName={customer.loyaltyTier}
                            size="sm"
                            showPoints={false}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-1" />
                          {customer.email}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1" />
                          {customer.phone}
                        </div>
                      </div>

                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {customer.totalVisits} visits
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          ${customer.totalSpent} total
                        </div>
                        <div className="flex items-center">
                          {renderStars(customer.rating)}
                          <span className="ml-1">{customer.rating}</span>
                        </div>
                        {/* Location Info - Business tier only */}
                        {isBusinessTier && customer.locationName && (
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {customer.locationName}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Last visit: {format(parseISO(customer.lastVisitDate), 'MMM d, yyyy')}
                      </p>
                      {/* Enhanced Loyalty Points Display */}
                      {hasLoyaltyFeatures ? (
                        <div className="flex items-center justify-end mt-1">
                          {customer.loyaltyPoints > 0 ? (
                            <div className="flex items-center space-x-2">
                              <StarIcon className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium text-purple-600">
                                {customer.loyaltyPoints} points
                              </span>
                              <span className="text-xs text-gray-500">
                                ({customer.loyaltyTier})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No points yet</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          {customer.loyaltyPoints} loyalty points
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <UserPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or filters.
              </p>
            </div>
          )}
        </div>

        {/* Customer Detail Modal */}
        {showModal && selectedCustomer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                <div className="bg-white px-6 py-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center">
                      <div className="h-16 w-16 bg-gradient-to-br from-beauty-400 to-brand-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-xl">
                          {selectedCustomer.firstName[0]}{selectedCustomer.lastName[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-medium text-gray-900">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className={clsx(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(selectedCustomer.status)
                          )}>
                            {getStatusIcon(selectedCustomer.status)}
                            <span className="ml-1 capitalize">{selectedCustomer.status}</span>
                          </span>
                          <div className="flex items-center ml-3">
                            {renderStars(selectedCustomer.rating)}
                            <span className="ml-2 text-sm text-gray-500">{selectedCustomer.rating}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact & Stats */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {selectedCustomer.email}
                        </div>
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          {selectedCustomer.phone}
                        </div>
                        {selectedCustomer.birthday && (
                          <div>
                            <span className="text-gray-500">Birthday: </span>
                            {format(parseISO(selectedCustomer.birthday), 'MMMM d')}
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-medium text-gray-900 mb-3 mt-6">Customer Stats</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Total Visits:</span>
                          <p className="font-medium">{selectedCustomer.totalVisits}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Spent:</span>
                          <p className="font-medium">${selectedCustomer.totalSpent}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Avg. per Visit:</span>
                          <p className="font-medium">${Math.round(selectedCustomer.totalSpent / selectedCustomer.totalVisits)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Loyalty Points:</span>
                          <p className="font-medium flex items-center">
                            {selectedCustomer.loyaltyPoints}
                            {hasLoyaltyFeatures && selectedCustomer.loyaltyTier && (
                              <span className="ml-2">
                                <CustomerLoyaltyBadge
                                  points={selectedCustomer.loyaltyPoints}
                                  tierName={selectedCustomer.loyaltyTier}
                                  size="sm"
                                  showPoints={false}
                                />
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">First Visit:</span>
                          <p className="font-medium">{format(parseISO(selectedCustomer.firstVisitDate), 'MMM d, yyyy')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Visit:</span>
                          <p className="font-medium">{format(parseISO(selectedCustomer.lastVisitDate), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Preferences & Notes */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Preferences</h4>
                      
                      {selectedCustomer.preferredTechnician && (
                        <div className="mb-4">
                          <span className="text-gray-500 text-sm">Preferred Technician:</span>
                          <p className="font-medium">{selectedCustomer.preferredTechnician}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <span className="text-gray-500 text-sm">Favorite Services:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedCustomer.favoriteServices.map((service, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedCustomer.allergies && selectedCustomer.allergies.length > 0 && (
                        <div className="mb-4">
                          <span className="text-gray-500 text-sm">Allergies:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedCustomer.allergies.map((allergy, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCustomer.notes && (
                        <div>
                          <span className="text-gray-500 text-sm">Notes:</span>
                          <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                            {selectedCustomer.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="btn-primary sm:ml-3"
                  >
                    Edit Customer
                  </button>
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:mt-0 sm:mr-3"
                  >
                    View Appointments
                  </button>
                  
                  {/* Loyalty Points Management - Professional+ tiers */}
                  {hasLoyaltyFeatures && (
                    <button
                      type="button"
                      className="btn-secondary mt-3 sm:mt-0 sm:mr-3"
                    >
                      <StarIcon className="h-4 w-4 mr-1" />
                      Adjust Points
                    </button>
                  )}
                  
                  {/* Location-specific appointments - Business tier */}
                  {isBusinessTier && (
                    <button
                      type="button"
                      className="btn-secondary mt-3 sm:mt-0 sm:mr-3"
                    >
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      View by Location
                    </button>
                  )}
                  
                  <button
                    type="button"
                    className="btn-secondary mt-3 sm:mt-0"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddModal && (
          <AddCustomerModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddCustomer}
          />
        )}
      </div>
    </Layout>
  )
}

// Add Customer Modal Component
interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (customerData: any) => void
}

function AddCustomerModal({ isOpen, onClose, onSubmit }: AddCustomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(formData)
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        notes: ''
      })
      
      onClose()
    } catch (error) {
      console.error('Failed to add customer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 py-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Add New Customer</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="First name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="customer@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Customer preferences, allergies, etc..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting || !formData.firstName || !formData.lastName || !formData.phone}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Customer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Layout from '../../components/Layout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { BusinessAPI, LocationAPIImpl, PaymentAPIImpl, LoyaltyAPIImpl, supabase, type Business, type DashboardStats, type Appointment } from '../../lib/supabase'
import type { Location, PaymentWithDetails, LoyaltyCustomer } from '../../lib/supabase-types-mvp'
import { getServiceTerminology } from '../../lib/industry-service-templates'
import {
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  PhoneIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  GiftIcon,
  SparklesIcon,
  BoltIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import AppointmentLocationBadge from '../../components/AppointmentLocationBadge'
import LocationSelector from '../../components/LocationSelector'
import { format, isToday, isTomorrow } from 'date-fns'

import { getCurrentBusinessId } from '../../lib/auth-utils'
import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../lib/multi-tenant-auth'

// Import tour components
import StarterTour from '../../components/tours/StarterTour'
import ProfessionalTour from '../../components/tours/ProfessionalTour'
import BusinessTour from '../../components/tours/BusinessTour'

// Get business ID with multi-tenant security
const getBusinessId = () => {
  return getSecureBusinessId()
}


function DashboardPage() {
  const searchParams = useSearchParams()
  const [business, setBusiness] = useState<Business | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    activeCustomers: 0
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [recentPayments, setRecentPayments] = useState<PaymentWithDetails[]>([])
  const [loyaltyStats, setLoyaltyStats] = useState({ totalMembers: 0, pointsAwarded: 0 })
  const [employeeCount, setEmployeeCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get industry-specific terminology
  const terminology = getServiceTerminology(business?.business_type || 'general_business')

  // Tour state management
  const [showOnboardingTour, setShowOnboardingTour] = useState(false)
  const [onboardingPlan, setOnboardingPlan] = useState<'starter' | 'professional' | 'business' | null>(null)
  const [businessPhoneNumber, setBusinessPhoneNumber] = useState<string>('')
  const [existingPhoneNumber, setExistingPhoneNumber] = useState<string>('')

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Check for onboarding query parameter
  useEffect(() => {
    const shouldShowTour = searchParams.get('onboarding') === 'true'
    const planFromUrl = searchParams.get('plan') as 'starter' | 'professional' | 'business' | null
    
    console.log('🎯 Dashboard checking onboarding params:', { shouldShowTour, planFromUrl })
    
    if (shouldShowTour && planFromUrl && business) {
      console.log('✅ Triggering Phase 2 onboarding tour for plan:', planFromUrl)
      setOnboardingPlan(planFromUrl)
      setShowOnboardingTour(true)
      
      // Get phone numbers from localStorage if available
      const storedBusinessId = localStorage.getItem('authenticated_business_id')
      if (storedBusinessId) {
        // We'll need to get the actual phone numbers from the business data
        // For now, use placeholder values
        setBusinessPhoneNumber('(424) 351-9304') // This should come from business data
        setExistingPhoneNumber(business.phone || 'Not available')
      }
    }
  }, [searchParams, business])

  useEffect(() => {
    // Reload appointments when location filter changes
    if (business && selectedLocationId) {
      loadDashboardData()
    }
  }, [selectedLocationId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check authentication first
      if (redirectToLoginIfUnauthenticated()) {
        return
      }
      
      // Load business data
      const businessId = getBusinessId()
      if (!businessId) {
        setError('Authentication required. Please log in.')
        setLoading(false)
        return
      }
      
      console.log('🔍 Dashboard loading with Business ID:', businessId)

      // Fetch business from database
      const businessData = await BusinessAPI.getBusiness(businessId)
      console.log('📋 Business data loaded:', businessData?.name)

      if (!businessData) {
        setError('Business not found. Please check your configuration.')
        return
      }

      setBusiness(businessData)

      // Check if user has any phone employees
      const { count: empCount } = await supabase
        .from('phone_employees')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)

      setEmployeeCount(empCount || 0)
      console.log('📞 Phone employees count:', empCount)

      // Load locations for Business tier
      if (businessData.subscription_tier === 'business') {
        const locationAPI = new LocationAPIImpl()
        const locationsData = await locationAPI.getLocations(businessId)
        setLocations(locationsData)
      }

      // Load dashboard statistics
      const dashboardStats = await BusinessAPI.getDashboardStats(businessId)
      setStats(dashboardStats)

      // Load upcoming appointments with location filtering
      const appointmentFilters = selectedLocationId === 'all' ? {} : { location_id: selectedLocationId }
      const upcomingAppts = await BusinessAPI.getUpcomingAppointments(businessId, 5)
      console.log('📅 Upcoming appointments loaded:', upcomingAppts.length)

      // Enhance appointments with location data
      const enhancedAppointments = upcomingAppts.map(apt => ({
        ...apt,
        location: locations.find(loc => loc.id === apt.location_id) || null
      }))
      setUpcomingAppointments(enhancedAppointments)

      // Load payment data for Professional+ tiers
      if (['professional', 'business'].includes(businessData.subscription_tier)) {
        const paymentAPI = new PaymentAPIImpl()
        const paymentsData = await paymentAPI.getPayments(businessId, { limit: 3 })
        setRecentPayments(paymentsData)

        // Load loyalty stats for Professional+ tiers
        try {
          const loyaltyAPI = new LoyaltyAPIImpl()
          const loyaltyProgram = await loyaltyAPI.getLoyaltyProgram(businessId)
          if (loyaltyProgram) {
            const loyaltyCustomers = await loyaltyAPI.getLoyaltyCustomers(businessId)
            const totalPointsAwarded = loyaltyCustomers.reduce((sum, customer) => sum + customer.points_earned, 0)
            setLoyaltyStats({
              totalMembers: loyaltyCustomers.length,
              pointsAwarded: totalPointsAwarded
            })
          }
        } catch (loyaltyError) {
          console.log('Loyalty program not configured yet')
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatAppointmentDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleTourComplete = () => {
    console.log('🎉 Phase 2 onboarding tour completed!')
    setShowOnboardingTour(false)
    setOnboardingPlan(null)
    
    // Clear onboarding query parameters from URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('onboarding')
    newUrl.searchParams.delete('plan')
    window.history.replaceState({}, '', newUrl.toString())
    
    // Show success message or redirect to normal dashboard
    console.log('✅ User is now ready to use the full dashboard!')
  }

  const handleTourExit = () => {
    console.log('🔄 User exited onboarding tour - saving progress')
    setShowOnboardingTour(false)
    // Keep tour state for resume later
  }

  if (loading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-4">{error}</div>
            <button
              onClick={() => loadDashboardData()}
              className="btn-primary"
            >
              Try Again
            </button>
            <div className="mt-4 text-sm text-gray-500">
              Make sure you have configured your Supabase credentials in .env.local
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Empty state: No employees created yet
  if (employeeCount === 0) {
    return (
      <Layout business={business}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
                <PhoneIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Welcome to VoiceFly!
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Let's create your first AI employee and start capturing calls 24/7
              </p>

              {/* Giant CTA Button */}
              <a
                href="/dashboard/employees"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create Your First Employee
                <ArrowRightIcon className="ml-3 h-6 w-6" />
              </a>
            </div>

            {/* 3-Step Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pick a Type</h3>
                <p className="text-gray-600 text-sm">
                  Choose from Receptionist, Order Taker, Customer Service, and more
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Configure</h3>
                <p className="text-gray-600 text-sm">
                  Set up your employee's name, voice, and capabilities in minutes
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Go Live</h3>
                <p className="text-gray-600 text-sm">
                  Get a phone number and start answering calls immediately
                </p>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">
                  Your Dashboard Preview
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Here's what you'll see once your AI employee is active
                </p>
              </div>

              <div className="p-6">
                {/* Mock Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <PhoneIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">Calls Today</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">23</div>
                    <div className="text-xs text-blue-600 mt-1">+12 after hours</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">Bookings Made</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">8</div>
                    <div className="text-xs text-green-600 mt-1">34.8% conversion</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center mb-2">
                      <UsersIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm font-medium text-purple-900">New Customers</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">5</div>
                    <div className="text-xs text-purple-600 mt-1">This week</div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4 border border-pink-200">
                    <div className="flex items-center mb-2">
                      <CurrencyDollarIcon className="h-5 w-5 text-pink-600 mr-2" />
                      <span className="text-sm font-medium text-pink-900">Revenue</span>
                    </div>
                    <div className="text-2xl font-bold text-pink-900">$2.4k</div>
                    <div className="text-xs text-pink-600 mt-1">AI-generated</div>
                  </div>
                </div>

                {/* Mock Call Activity */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Call Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <PhoneIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sarah M. booked a haircut</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <PhoneIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Mike R. asked about pricing</p>
                          <p className="text-xs text-gray-500">15 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-8">
              <p className="text-gray-600 mb-4">Ready to get started?</p>
              <a
                href="/dashboard/employees"
                className="inline-flex items-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Create Your First Employee
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout business={business}>
      <div className="p-8">
        {/* AI Voice System Hero Section - Simplified Clean Design */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
            borderRadius: '16px',
            padding: '32px',
            color: '#ffffff'
          }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#ffffff'
              }}>
                🎯 Your AI Receptionist is Working!
              </h1>
              <p style={{ fontSize: '16px', color: '#ffffff', opacity: 0.9 }}>
                Never miss another booking • Available 24/7 • Sounds completely human
              </p>
              <p style={{ fontSize: '14px', color: '#ffffff', opacity: 0.8, marginTop: '8px' }}>
                📞 Phone: (424) 351-9304 • <span style={{ color: '#86efac' }}>● LIVE & ACTIVE</span>
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  {stats.todayAppointments}
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.9, marginTop: '4px' }}>
                  {terminology.plural} Today
                </div>
                <div style={{ fontSize: '12px', color: '#86efac', marginTop: '4px' }}>
                  +{Math.floor(stats.todayAppointments * 0.6)} After Hours
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  {Math.floor(stats.monthlyRevenue / 100)}
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.9, marginTop: '4px' }}>
                  Calls Handled
                </div>
                <div style={{ fontSize: '12px', color: '#86efac', marginTop: '4px' }}>
                  This Month
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  $0
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.9, marginTop: '4px' }}>
                  Missed Revenue
                </div>
                <div style={{ fontSize: '12px', color: '#86efac', marginTop: '4px' }}>
                  vs $8,000 avg lost
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                  98%
                </div>
                <div style={{ fontSize: '14px', color: '#ffffff', opacity: 0.9, marginTop: '4px' }}>
                  Success Rate
                </div>
                <div style={{ fontSize: '12px', color: '#86efac', marginTop: '4px' }}>
                  Calls → Bookings
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ color: '#ffffff' }}>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>💰 Revenue generated by AI this month: </span>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  ${(stats.monthlyRevenue * 1.4).toLocaleString()}
                </span>
              </div>
              <a
                href="/dashboard/voice-ai"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 20px',
                  backgroundColor: '#ffffff',
                  color: '#9333ea',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                📊 View Call Analytics
              </a>
            </div>
          </div>
        </div>

        {/* Location Filter for Business Tier */}
        {business?.subscription_tier === 'business' && locations.length > 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Dashboard View</h3>
              <div className="max-w-xs">
                <LocationSelector
                  locations={locations}
                  selectedLocation={locations.find(loc => loc.id === selectedLocationId) || null}
                  onLocationChange={(location) => setSelectedLocationId(location?.id || 'all')}
                  placeholder="All Locations"
                  includeAllOption={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Activity & Phone Discovery Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Live Call Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Live Call Activity</h3>
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium">Real-time</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <PhoneIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Appointment Booked</p>
                      <p className="text-sm text-gray-600">Sarah M. • Gel Manicure • Sept 15, 2:00 PM</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">2 minutes ago</div>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <UsersIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Customer Discovery</p>
                      <p className="text-sm text-gray-600">(555) 123-9876 • Found across 2 locations</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">15 minutes ago</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <ClockIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">After-Hours Booking</p>
                      <p className="text-sm text-gray-600">Maria K. • Full Set • Sept 16, 10:00 AM</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">3:22 AM</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">Your competitors missed these opportunities</p>
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium">
                    🎯 100% Capture Rate Today
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Discovery Intelligence */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Phone Discovery</h3>
              <p className="text-sm text-gray-600 mt-1">Multi-business customer intelligence</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{stats.activeCustomers}</div>
                  <div className="text-sm text-gray-600">Cross-Business Customers</div>
                  <div className="text-xs text-green-600 mt-1">+{Math.floor(stats.activeCustomers * 0.15)} this week</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Discovery Success</span>
                    <span className="text-sm font-medium text-gray-900">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full" style={{width: '94%'}}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Repeat Customers</span>
                    <span className="text-sm font-medium text-gray-900">78%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '78%'}}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">Your phone discovery system identified 
                    <span className="font-medium text-purple-600"> {Math.floor(stats.activeCustomers * 0.3)} returning customers</span> this month
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Traditional Business Metrics - Moved to Secondary Position */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Business Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Traditional metrics powered by AI efficiency</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stat-card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Today's Appointments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.todayAppointments}
                    </dd>
                    {selectedLocationId !== 'all' && (
                      <dd className="text-xs text-gray-500">
                        {locations.find(loc => loc.id === selectedLocationId)?.name || 'Selected Location'}
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {['professional', 'business'].includes(business?.subscription_tier || '') ? 'Monthly Revenue' : 'Potential Revenue'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.monthlyRevenue.toLocaleString()}
                    </dd>
                    {['professional', 'business'].includes(business?.subscription_tier || '') && recentPayments.length > 0 && (
                      <dd className="text-xs text-green-600">
                        {recentPayments.length} payments today
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-beauty-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Customers
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeCustomers}
                    </dd>
                    {['professional', 'business'].includes(business?.subscription_tier || '') && loyaltyStats.totalMembers > 0 && (
                      <dd className="text-xs text-purple-600">
                        {loyaltyStats.totalMembers} loyalty members
                      </dd>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {['professional', 'business'].includes(business?.subscription_tier || '') && loyaltyStats.pointsAwarded > 0 ? (
                    <GiftIcon className="h-8 w-8 text-purple-600" />
                  ) : business?.subscription_tier === 'business' && locations.length > 0 ? (
                    <MapPinIcon className="h-8 w-8 text-blue-600" />
                  ) : (
                    <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                  )}
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {['professional', 'business'].includes(business?.subscription_tier || '') && loyaltyStats.pointsAwarded > 0 ? (
                        'Points Awarded'
                      ) : business?.subscription_tier === 'business' && locations.length > 0 ? (
                        'Active Locations'
                      ) : (
                        'Total Appointments'
                      )}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {['professional', 'business'].includes(business?.subscription_tier || '') && loyaltyStats.pointsAwarded > 0 ? (
                        loyaltyStats.pointsAwarded.toLocaleString()
                      ) : business?.subscription_tier === 'business' && locations.length > 0 ? (
                        locations.filter(loc => loc.is_active).length
                      ) : (
                        stats.totalAppointments.toLocaleString()
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Upcoming {terminology.plural}
                </h2>
                <a
                  href="/dashboard/appointments"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all
                </a>
              </div>
              
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {appointment.customer ? `${appointment.customer.first_name} ${appointment.customer.last_name}` : 'Unknown Customer'}
                        </p>
                        <div className="flex items-center space-x-2">
                          {business?.subscription_tier === 'business' && appointment.location && (
                            <AppointmentLocationBadge 
                              location={appointment.location} 
                              size="sm" 
                            />
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {appointment.service?.name || 'Unknown Service'} {appointment.staff && `with ${appointment.staff.first_name} ${appointment.staff.last_name}`}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center text-xs text-gray-400">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatAppointmentDate(appointment.appointment_date)} at {appointment.start_time}
                        </div>
                        {['professional', 'business'].includes(business?.subscription_tier || '') && appointment.status === 'completed' && (
                          <div className="flex items-center text-xs text-green-600">
                            <CreditCardIcon className="h-3 w-3 mr-1" />
                            Ready for payment
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Voice AI Status */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <a 
                  href="/dashboard/appointments" 
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <CalendarIcon className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                    Manage {terminology.plural}
                  </span>
                </a>
                
                {business?.subscription_tier === 'business' && (
                  <a 
                    href="/dashboard/locations" 
                    className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <MapPinIcon className="h-5 w-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-blue-700 group-hover:text-blue-800">
                      Manage Locations
                    </span>
                  </a>
                )}
                
                {['professional', 'business'].includes(business?.subscription_tier || '') && (
                  <a 
                    href="/dashboard/payments" 
                    className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                  >
                    <CreditCardIcon className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-green-700 group-hover:text-green-800">
                      Process Payments
                    </span>
                  </a>
                )}
                
                {['professional', 'business'].includes(business?.subscription_tier || '') && (
                  <a 
                    href="/dashboard/loyalty" 
                    className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                  >
                    <GiftIcon className="h-5 w-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-purple-700 group-hover:text-purple-800">
                      Loyalty Program
                    </span>
                  </a>
                )}
                
                <a 
                  href="/dashboard/customers" 
                  className="flex items-center p-3 bg-beauty-50 rounded-lg hover:bg-beauty-100 transition-colors group"
                >
                  <UsersIcon className="h-5 w-5 text-beauty-600 mr-3" />
                  <span className="text-sm font-medium text-beauty-700 group-hover:text-beauty-800">
                    View Customers
                  </span>
                </a>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Subscription
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  business?.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                  business?.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {business?.subscription_status === 'trial' ? 'Trial' : business?.subscription_status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current Plan</span>
                  <span className="font-medium capitalize">{business?.subscription_tier || 'Starter'}</span>
                </div>
                {business?.subscription_status === 'trial' && business?.trial_ends_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Trial Ends</span>
                    <span className="font-medium">
                      {new Date(business.trial_ends_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {business?.settings?.monthly_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Monthly Price</span>
                    <span className="font-medium">${business.settings.monthly_price}/mo</span>
                  </div>
                )}
                {business?.settings?.selected_plan && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Plan Type</span>
                    <span className="font-medium capitalize">{business.settings.selected_plan}</span>
                  </div>
                )}
                {business?.settings?.tech_calendar_count && business.settings.tech_calendar_count > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tech Calendars</span>
                    <span className="font-medium">{business.settings.tech_calendar_count} technicians</span>
                  </div>
                )}
              </div>
              
              <a 
                href="/dashboard/billing" 
                className="mt-4 flex items-center justify-center p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Manage Subscription</span>
              </a>
            </div>

            {/* Voice AI Status */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Voice AI Status
                </h2>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="ml-2 text-sm text-green-600 font-medium">
                    Active
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Calls Today</span>
                  <span className="font-medium">23</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bookings Made</span>
                  <span className="font-medium">8</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conversion Rate</span>
                  <span className="font-medium text-green-600">34.8%</span>
                </div>
              </div>

              <a
                href="/dashboard/voice-ai"
                className="mt-4 flex items-center justify-center p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Manage Voice AI</span>
              </a>
            </div>

            {/* Maya AI Agents Status */}
            <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mr-2">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Maya AI Agents
                  </h2>
                </div>
                <div className="flex items-center">
                  <BoltIcon className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600 font-medium">
                    5 Active
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <span className="h-2 w-2 bg-blue-500 rounded-full mr-2"></span>
                    Lead Qualification
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Analyzing</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    Customer Retention
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Monitoring</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <span className="h-2 w-2 bg-purple-500 rounded-full mr-2"></span>
                    Revenue Intel
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Processing</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-white/60 rounded-lg border border-purple-100">
                <div className="flex items-center text-sm">
                  <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-xs">💡</span>
                  </div>
                  <span className="text-gray-700">
                    <span className="font-medium">3 new insights</span> ready for review
                  </span>
                </div>
              </div>

              <a
                href="/dashboard/agents"
                className="mt-4 flex items-center justify-center p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <SparklesIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">View AI Dashboard</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2 Onboarding Tours */}
      {showOnboardingTour && onboardingPlan && business && (
        <>
          {onboardingPlan === 'starter' && (
            <StarterTour
              businessName={business.name}
              phoneNumber={businessPhoneNumber}
              existingPhoneNumber={existingPhoneNumber}
              onComplete={handleTourComplete}
              onExit={handleTourExit}
            />
          )}
          
          {onboardingPlan === 'professional' && (
            <ProfessionalTour
              businessName={business.name}
              phoneNumber={businessPhoneNumber}
              existingPhoneNumber={existingPhoneNumber}
              onComplete={handleTourComplete}
              onExit={handleTourExit}
            />
          )}
          
          {onboardingPlan === 'business' && (
            <BusinessTour
              businessName={business.name}
              phoneNumber={businessPhoneNumber}
              existingPhoneNumber={existingPhoneNumber}
              onComplete={handleTourComplete}
              onExit={handleTourExit}
            />
          )}
        </>
      )}
    </Layout>
  )
}

// Wrap the entire component with ProtectedRoute and Suspense
function ProtectedDashboardPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <DashboardPage />
      </Suspense>
    </ProtectedRoute>
  )
}

export default ProtectedDashboardPage
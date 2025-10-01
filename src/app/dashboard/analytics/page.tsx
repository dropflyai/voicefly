'use client'

import { useState, useEffect } from 'react'
import Layout from '../../../components/Layout'
import { 
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  AdjustmentsHorizontalIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import SmartAnalytics from '../../../components/SmartAnalytics'
import { FeatureGate, useFeatureFlags } from '../../../lib/feature-flags'
import TierGate from '../../../components/TierGate'
import DataCollectionIndicator from '../../../components/DataCollectionIndicator'
import { BrandedAnalytics, BrandedRevenueChart, BrandedServicePopularityChart, BrandedStaffPerformanceChart, BrandedCustomerRetentionChart } from '../../../components/BrandedAnalytics'
import { RevenueChart, ServicePopularityChart, CustomerRetentionChart } from '../../../components/analytics/RevenueChart'
import StaffPerformance from '../../../components/analytics/StaffPerformance'
import DailyReport from '../../../components/reports/DailyReport'
import LocationSelector from '../../../components/LocationSelector'
import { LocationAPIImpl, BusinessAPI } from '../../../lib/supabase'
import type { Location, Business } from '../../../lib/supabase-types-mvp'

// Get business ID from auth context
const getBusinessId = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authenticated_business_id') || '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
  }
  return '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'staff' | 'services' | 'reports'>('overview')
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [serviceData, setServiceData] = useState<any[]>([])
  const [staffData, setStaffData] = useState<any[]>([])
  const [retentionData, setRetentionData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const locationAPI = new LocationAPIImpl()
  const featureFlags = useFeatureFlags()

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Reload analytics when filters change
  useEffect(() => {
    if (business) {
      loadAnalyticsData()
    }
  }, [business, selectedLocationId, dateRange])

  const loadInitialData = async () => {
    try {
      const businessId = getBusinessId()
      
      // Load business info
      const businessData = await BusinessAPI.getBusiness(businessId)
      if (businessData) {
        setBusiness(businessData)
      }

      // Load locations
      const locationsData = await locationAPI.getLocations(businessId)
      setLocations(locationsData)
      
      // Set default location (primary or first location)
      const primaryLocation = locationsData.find(loc => loc.is_primary)
      if (primaryLocation) {
        setSelectedLocationId(primaryLocation.id)
      } else if (locationsData.length > 0) {
        setSelectedLocationId(locationsData[0].id)
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // Get selected location for filtering
      const selectedLocation = locations.find(loc => loc.id === selectedLocationId)
      const locationName = selectedLocation?.name || 'All Locations'
      
      // In production, this would filter data by selectedLocationId and dateRange
      // Mock data for development - adjusted based on location
      const baseRevenue = selectedLocationId ? 1200 : 2400 // Individual location vs all locations
      const mockRevenueData = [
        { date: '2025-01-01', revenue: 2400, appointments: 12, averageTicket: 200 },
        { date: '2025-01-02', revenue: 1800, appointments: 9, averageTicket: 200 },
        { date: '2025-01-03', revenue: 3200, appointments: 16, averageTicket: 200 },
        { date: '2025-01-04', revenue: 2800, appointments: 14, averageTicket: 200 },
        { date: '2025-01-05', revenue: 4200, appointments: 21, averageTicket: 200 },
        { date: '2025-01-06', revenue: 3800, appointments: 19, averageTicket: 200 },
        { date: '2025-01-07', revenue: 2200, appointments: 11, averageTicket: 200 }
      ]

      const mockServiceData = [
        { name: 'Gel Manicure', revenue: 8500, percentage: 35, color: '#8b5cf6' },
        { name: 'Pedicure', revenue: 6200, percentage: 26, color: '#10b981' },
        { name: 'Nail Art', revenue: 4800, percentage: 20, color: '#f59e0b' },
        { name: 'French Tips', revenue: 2900, percentage: 12, color: '#ef4444' },
        { name: 'Polish Change', revenue: 1600, percentage: 7, color: '#3b82f6' }
      ]

      const mockStaffData = [
        { name: 'Sarah J.', revenue: 6800, appointments: 85, utilizationRate: 92, averageTicket: 80 },
        { name: 'Maria R.', revenue: 5760, appointments: 72, utilizationRate: 88, averageTicket: 80 },
        { name: 'Emily C.', revenue: 4875, appointments: 65, utilizationRate: 75, averageTicket: 75 },
        { name: 'Ashley W.', revenue: 4350, appointments: 58, utilizationRate: 68, averageTicket: 75 }
      ]

      const mockRetentionData = [
        { cohortMonth: 'Sep 2024', cohortSize: 45, returned: 38, retentionRate: 84.4 },
        { cohortMonth: 'Oct 2024', cohortSize: 52, returned: 41, retentionRate: 78.8 },
        { cohortMonth: 'Nov 2024', cohortSize: 48, returned: 35, retentionRate: 72.9 },
        { cohortMonth: 'Dec 2024', cohortSize: 61, returned: 49, retentionRate: 80.3 },
        { cohortMonth: 'Jan 2025', cohortSize: 58, returned: 47, retentionRate: 81.0 }
      ]

      setRevenueData(mockRevenueData)
      setServiceData(mockServiceData)
      setStaffData(mockStaffData)
      setRetentionData(mockRetentionData)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    console.log('Exporting analytics data...')
    alert('Analytics export would be implemented here')
  }

  return (
    <Layout business={business}>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 mr-3 text-purple-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Get insights into your salon's performance and growth opportunities
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
                  Period:
                </label>
                <select 
                  id="dateRange"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {(['professional', 'business', 'enterprise'].includes(business?.subscription_tier || 'starter')) ? (
                <button
                  onClick={handleExportData}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              ) : (
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-md">
                  Export available in Professional+
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Collection Indicator for Starter Tier */}
        <DataCollectionIndicator 
          tier={business?.subscription_tier || 'starter'} 
          className="mb-6"
        />
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'revenue', name: 'Revenue', icon: CurrencyDollarIcon },
                { id: 'staff', name: 'Staff Performance', icon: UserGroupIcon },
                { id: 'services', name: 'Services', icon: CalendarIcon },
                { id: 'reports', name: 'Reports', icon: ArrowDownTrayIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content - Always load data, but gate UI display */}
        {activeTab === 'overview' && (
          <div>
            <SmartAnalytics 
              businessId={getBusinessId()}
              dateRange={dateRange}
              className="mb-8"
            />
          </div>
        )}

        {activeTab === 'revenue' && (
          <div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Analytics</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Daily Revenue Trend</h4>
                    <RevenueChart data={revenueData} type="line" height={300} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Revenue by Service</h4>
                    <ServicePopularityChart data={serviceData} height={300} />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Customer Retention</h4>
                  <CustomerRetentionChart data={retentionData} height={300} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div>
            <StaffPerformance businessId={getBusinessId()} dateRange={dateRange} />
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Analytics</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Revenue Distribution</h4>
                  <ServicePopularityChart data={serviceData} height={300} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Service Performance</h4>
                  <div className="space-y-4">
                    {serviceData.map((service, index) => {
                      const maxRevenue = Math.max(...serviceData.map(s => s.revenue))
                      const percentage = (service.revenue / maxRevenue) * 100
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{service.name}</span>
                            <span className="text-lg font-bold text-green-600">
                              ${service.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              {service.percentage}% of total
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <DailyReport businessId={getBusinessId()} />
        )}

        {/* Advanced Analytics for Professional+ */}
        {(['professional', 'business', 'enterprise'].includes(business?.subscription_tier || 'starter')) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Advanced Reporting</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Customer Lifetime Value</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average CLV</span>
                    <span className="font-semibold text-green-600">$485</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Top 20% CLV</span>
                    <span className="font-semibold text-green-600">$1,200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Visit Frequency</span>
                    <span className="font-semibold">6.2 times/year</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Service Profitability</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Highest Margin</span>
                    <span className="font-semibold text-green-600">Nail Art (78%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Most Popular</span>
                    <span className="font-semibold">Gel Manicure (45 bookings)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Revenue/Hour</span>
                    <span className="font-semibold text-green-600">$75.50</span>
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
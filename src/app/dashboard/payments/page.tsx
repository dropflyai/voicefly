'use client'

import { useState, useEffect } from 'react'
import { 
  CreditCardIcon, 
  FunnelIcon, 
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import Layout from '../../../components/Layout'
import PaymentStatusBadge from '../../../components/PaymentStatusBadge'
import LocationSelector from '../../../components/LocationSelector'
import { PaymentAPIImpl, BusinessAPI, LocationAPIImpl } from '../../../lib/supabase'
import type { PaymentWithDetails, Business, Location } from '../../../lib/supabase-types-mvp'

import { getSecureBusinessId, redirectToLoginIfUnauthenticated } from '../../../lib/multi-tenant-auth'

interface PaymentFilters {
  search: string
  status: string
  location_id: string
  date_range: string
  payment_method: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [business, setBusiness] = useState<Business | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '',
    status: '',
    location_id: '',
    date_range: 'last_30_days',
    payment_method: ''
  })

  const [showFilters, setShowFilters] = useState(false)

  const paymentAPI = new PaymentAPIImpl()
  const locationAPI = new LocationAPIImpl()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadPayments()
  }, [filters, selectedLocation])

  const loadData = async () => {
    try {
      setIsPageLoading(true)
      setError(null)

      if (redirectToLoginIfUnauthenticated()) return
      const bid = getSecureBusinessId()
      if (!bid) { setError('Authentication required.'); setIsPageLoading(false); return }

      // Load business info
      const businessData = await BusinessAPI.getBusiness(bid)
      if (businessData) {
        setBusiness(businessData)
      }

      // Load locations for Business+ plans
      if (businessData && ['business', 'enterprise'].includes(businessData.subscription_tier)) {
        const locationsData = await locationAPI.getLocations(bid)
        setLocations(locationsData)
      }

    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load data. Please try again.')
    } finally {
      setIsPageLoading(false)
    }
  }

  const loadPayments = async () => {
    try {
      setIsLoading(true)
      
      const dateRange = getDateRange(filters.date_range)
      const filterParams = {
        location_id: selectedLocation?.id,
        date_range: dateRange,
        status: filters.status || undefined,
        limit: 50
      }

      const bid = getSecureBusinessId()
      if (!bid) return
      const paymentsData = await paymentAPI.getPayments(bid, filterParams)
      
      // Apply client-side filters
      let filteredPayments = paymentsData
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        filteredPayments = filteredPayments.filter(payment => 
          payment.customer?.first_name?.toLowerCase().includes(searchTerm) ||
          payment.customer?.last_name?.toLowerCase().includes(searchTerm) ||
          payment.processor_transaction_id?.toLowerCase().includes(searchTerm) ||
          payment.id.toLowerCase().includes(searchTerm)
        )
      }

      if (filters.payment_method) {
        filteredPayments = filteredPayments.filter(payment => 
          payment.processor_type === filters.payment_method
        )
      }

      setPayments(filteredPayments)

    } catch (error) {
      console.error('Failed to load payments:', error)
      setError('Failed to load payments. Please try again.')
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = (range: string): [string, string] | undefined => {
    const now = new Date()
    const start = new Date()

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        return [start.toISOString(), now.toISOString()]
      
      case 'last_7_days':
        start.setDate(now.getDate() - 7)
        return [start.toISOString(), now.toISOString()]
      
      case 'last_30_days':
        start.setDate(now.getDate() - 30)
        return [start.toISOString(), now.toISOString()]
      
      case 'last_90_days':
        start.setDate(now.getDate() - 90)
        return [start.toISOString(), now.toISOString()]
      
      default:
        return undefined
    }
  }

  const formatCurrency = (amountInCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amountInCents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const handleRefund = async (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const refundAmount = prompt(`Enter refund amount (max: ${formatCurrency(payment.total_amount)}):`)
    if (!refundAmount) return

    const amount = parseFloat(refundAmount.replace(/[^0-9.]/g, '')) * 100

    if (amount <= 0 || amount > payment.total_amount) {
      alert('Invalid refund amount')
      return
    }

    const reason = prompt('Refund reason (optional):') || 'Customer request'

    try {
      setIsLoading(true)
      await paymentAPI.refundPayment(paymentId, amount, reason)
      loadPayments() // Reload to get updated status
    } catch (error) {
      console.error('Failed to process refund:', error)
      alert('Failed to process refund. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalStats = () => {
    const stats = payments.reduce((acc, payment) => {
      if (payment.status === 'paid') {
        acc.totalAmount += payment.total_amount
        acc.totalCount += 1
      }
      return acc
    }, { totalAmount: 0, totalCount: 0 })

    return stats
  }

  if (isPageLoading) {
    return (
      <Layout business={business}>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-surface-highest rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-16 bg-surface-highest rounded"></div>
              <div className="h-96 bg-surface-highest rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  const stats = getTotalStats()

  return (
    <Layout business={business}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Payments</h1>
            <p className="text-text-secondary mt-1">
              Track and manage all payment transactions
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-[rgba(65,71,84,0.2)] rounded-md text-sm font-medium text-text-primary hover:bg-surface"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </button>
            
            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-surface-low rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)] p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-text-secondary">Total Revenue</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </div>

          <div className="bg-surface-low rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)] p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-text-secondary">Total Transactions</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {stats.totalCount}
                </p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-brand-primary" />
            </div>
          </div>

          <div className="bg-surface-low rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)] p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-text-secondary">Average Transaction</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {stats.totalCount > 0 ? formatCurrency(stats.totalAmount / stats.totalCount) : '$0.00'}
                </p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-surface-low rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)] p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-text-secondary">Success Rate</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {payments.length > 0 ? 
                    Math.round((payments.filter(p => p.status === 'paid').length / payments.length) * 100) : 0
                  }%
                </p>
              </div>
              <CreditCardIcon className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-surface-low rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)] p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-md text-sm"
                    placeholder="Search customers, IDs..."
                  />
                </div>
              </div>

              {locations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Location
                  </label>
                  <LocationSelector
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onLocationChange={setSelectedLocation}
                    placeholder="All locations"
                    includeAllOption={true}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-md text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Date Range
                </label>
                <select
                  value={filters.date_range}
                  onChange={(e) => setFilters({ ...filters, date_range: e.target.value })}
                  className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-md text-sm"
                >
                  <option value="today">Today</option>
                  <option value="last_7_days">Last 7 days</option>
                  <option value="last_30_days">Last 30 days</option>
                  <option value="last_90_days">Last 90 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.payment_method}
                  onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-[rgba(65,71,84,0.2)] rounded-md text-sm"
                >
                  <option value="">All methods</option>
                  <option value="square">Square</option>
                  <option value="stripe">Stripe</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[#93000a]/5 border border-red-200 rounded-md">
            <p className="text-[#ffb4ab] text-sm">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="text-[#ffb4ab] hover:text-[#ffb4ab] underline text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-surface-low rounded-lg shadow-sm border border-[rgba(65,71,84,0.15)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(65,71,84,0.15)]">
            <h3 className="text-lg font-medium text-text-primary">Recent Payments</h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <ArrowPathIcon className="h-8 w-8 text-text-muted animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCardIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No payments found</h3>
              <p className="text-text-secondary">
                {filters.search || filters.status || selectedLocation ? 
                  'Try adjusting your filters to see more results.' :
                  'Payments will appear here once customers start making purchases.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[rgba(65,71,84,0.15)]">
                <thead className="bg-surface">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    {locations.length > 1 && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Location
                      </th>
                    )}
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface-low divide-y divide-[rgba(65,71,84,0.15)]">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-surface">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">
                          {payment.customer ? 
                            `${payment.customer.first_name} ${payment.customer.last_name}` :
                            'Unknown Customer'
                          }
                        </div>
                        <div className="text-sm text-text-secondary">
                          {payment.customer?.email || payment.customer?.phone || 'No contact info'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary">
                          {formatCurrency(payment.total_amount)}
                        </div>
                        {payment.tip_amount > 0 && (
                          <div className="text-xs text-text-secondary">
                            +{formatCurrency(payment.tip_amount)} tip
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusBadge status={payment.status} size="sm" />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary capitalize">
                        {payment.processor_type}
                        {payment.payment_method_details?.last_four && (
                          <div className="text-xs text-text-secondary">
                            •••• {payment.payment_method_details.last_four}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                        {formatDate(payment.created_at)}
                      </td>
                      
                      {locations.length > 1 && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                          {payment.location?.name || 'N/A'}
                        </td>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button className="text-purple-400 hover:text-purple-400">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {payment.status === 'paid' && (
                          <button
                            onClick={() => handleRefund(payment.id)}
                            disabled={isLoading}
                            className="text-[#ffb4ab] hover:text-[#ffb4ab] disabled:opacity-50"
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  CreditCardIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import PlanComparison from '../../../../components/PlanComparison'
import CancellationModal from '../../../../components/CancellationModal'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface BillingInfo {
  currentPlan: 'starter' | 'professional' | 'business'
  billingCycle: 'monthly' | 'yearly'
  nextBillingDate: string
  amount: number
  paymentMethod: {
    type: 'card' | 'bank'
    last4: string
    brand?: string
    expiryMonth?: number
    expiryYear?: number
  }
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing'
}

interface InvoiceHistory {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  description: string
  downloadUrl?: string
}

function BillingContent() {
  const searchParams = useSearchParams()
  const [showPlanComparison, setShowPlanComparison] = useState(false)
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null)
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [businessInfo, setBusinessInfo] = useState<{id: string, name: string, phone: string} | null>(null)

  // Check if user came here to upgrade
  const upgradeParam = searchParams.get('upgrade')
  const billingParam = searchParams.get('billing')

  useEffect(() => {
    loadBillingInfo()
    loadInvoiceHistory()
    loadBusinessInfo()
    
    // Auto-open plan comparison if upgrade parameter is present
    if (upgradeParam) {
      setShowPlanComparison(true)
    }
  }, [upgradeParam])
  
  const loadBusinessInfo = () => {
    // Get business info from localStorage or session
    const businessId = localStorage.getItem('authenticated_business_id')
    const businessName = localStorage.getItem('authenticated_business_name')
    const businessPhone = localStorage.getItem('authenticated_business_phone') || '(424) 351-9304'
    
    if (businessId && businessName) {
      setBusinessInfo({
        id: businessId,
        name: businessName,
        phone: businessPhone
      })
    }
  }

  const loadBillingInfo = async () => {
    try {
      // This would connect to your billing API
      const response = await fetch('/api/billing/info')
      if (response.ok) {
        const data = await response.json()
        setBillingInfo(data)
      } else {
        // Mock data for development
        setBillingInfo({
          currentPlan: 'starter',
          billingCycle: 'monthly',
          nextBillingDate: '2024-01-15',
          amount: 47,
          paymentMethod: {
            type: 'card',
            last4: '4242',
            brand: 'visa',
            expiryMonth: 12,
            expiryYear: 2025
          },
          subscriptionStatus: 'active'
        })
      }
    } catch (error) {
      console.error('Failed to load billing info:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceHistory = async () => {
    try {
      const response = await fetch('/api/billing/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoiceHistory(data.invoices)
      } else {
        // Mock data for development
        setInvoiceHistory([
          {
            id: 'inv_001',
            date: '2023-12-15',
            amount: 47,
            status: 'paid',
            description: 'Starter Plan - December 2023'
          },
          {
            id: 'inv_002', 
            date: '2023-11-15',
            amount: 47,
            status: 'paid',
            description: 'Starter Plan - November 2023'
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load invoice history:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      canceled: 'bg-red-100 text-red-800 border-red-200',
      past_due: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      trialing: 'bg-blue-100 text-blue-800 border-blue-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'pending':
        return <ArrowPathIcon className="w-5 h-5 text-yellow-500" />
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription, payment method, and billing history</p>
      </div>

      {/* Current Subscription */}
      {billingInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Current Subscription</h2>
              {getStatusBadge(billingInfo.subscriptionStatus)}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Current Plan</label>
                <div className="text-xl font-bold text-gray-900 capitalize">
                  {billingInfo.currentPlan}
                </div>
                <div className="text-sm text-gray-600">
                  ${billingInfo.amount}/{billingInfo.billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Billing Cycle</label>
                <div className="text-lg font-medium text-gray-900 capitalize">
                  {billingInfo.billingCycle}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Next Billing Date</label>
                <div className="text-lg font-medium text-gray-900">
                  {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Next Amount</label>
                <div className="text-lg font-bold text-green-600">
                  ${billingInfo.amount}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPlanComparison(true)}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Change Plan
                </button>
                <button 
                  onClick={() => setShowCancellationModal(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      {billingInfo?.paymentMethod && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <CreditCardIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {billingInfo.paymentMethod.brand?.toUpperCase()} •••• {billingInfo.paymentMethod.last4}
                  </div>
                  {billingInfo.paymentMethod.expiryMonth && billingInfo.paymentMethod.expiryYear && (
                    <div className="text-sm text-gray-500">
                      Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod.expiryYear}
                    </div>
                  )}
                </div>
              </div>
              
              <button className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Billing History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoiceHistory.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {new Date(invoice.date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{invoice.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${invoice.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getInvoiceStatusIcon(invoice.status)}
                      <span className={`ml-2 text-sm font-medium ${
                        invoice.status === 'paid' ? 'text-green-700' :
                        invoice.status === 'pending' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium text-sm">
                      <DocumentTextIcon className="w-4 h-4 mr-1" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {invoiceHistory.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No billing history</h3>
            <p className="text-gray-500">Your invoices will appear here once billing begins.</p>
          </div>
        )}
      </div>

      {/* Plan Comparison Modal */}
      {showPlanComparison && (
        <PlanComparison
          currentPlan={billingInfo?.currentPlan}
          highlightPlan={upgradeParam as 'starter' | 'professional' | 'business'}
          onClose={() => setShowPlanComparison(false)}
          showModal={true}
        />
      )}
      
      {/* Cancellation Modal */}
      {showCancellationModal && businessInfo && (
        <CancellationModal
          isOpen={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          businessName={businessInfo.name}
          phoneNumber={businessInfo.phone}
          onConfirmCancel={async (data) => {
            try {
              const response = await fetch('/api/subscription/cancel', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  businessId: businessInfo.id,
                  ...data
                })
              })
              
              if (response.ok) {
                // Refresh the page or redirect
                window.location.href = '/dashboard'
              } else {
                throw new Error('Cancellation failed')
              }
            } catch (error) {
              console.error('Cancellation error:', error)
              alert('Failed to cancel subscription. Please try again.')
            }
          }}
        />
      )}
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading billing information...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
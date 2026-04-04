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
  subscriptionStatus: 'active' | 'cancelled' | 'past_due' | 'trial'
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
      active: 'bg-emerald-500/10 text-green-800 border-green-200',
      canceled: 'bg-[#93000a]/10 text-red-800 border-red-200',
      past_due: 'bg-accent/10 text-yellow-800 border-yellow-200',
      trialing: 'bg-brand-primary/10 text-blue-800 border-blue-200'
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles] || 'bg-surface-high text-text-primary border-[rgba(65,71,84,0.15)]'}`}>
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
        return <ExclamationTriangleIcon className="w-5 h-5 text-[#ffb4ab]" />
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
        <h1 className="text-3xl font-bold text-text-primary">Billing & Subscription</h1>
        <p className="text-text-secondary">Manage your subscription, payment method, and billing history</p>
      </div>

      {/* Current Subscription */}
      {billingInfo && (
        <div className="bg-surface-low rounded-xl shadow-sm border border-[rgba(65,71,84,0.15)]">
          <div className="p-6 border-b border-[rgba(65,71,84,0.15)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">Current Subscription</h2>
              {getStatusBadge(billingInfo.subscriptionStatus)}
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Current Plan</label>
                <div className="text-xl font-bold text-text-primary capitalize">
                  {billingInfo.currentPlan}
                </div>
                <div className="text-sm text-text-secondary">
                  ${billingInfo.amount}/{billingInfo.billingCycle === 'monthly' ? 'month' : 'year'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Billing Cycle</label>
                <div className="text-lg font-medium text-text-primary capitalize">
                  {billingInfo.billingCycle}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Next Billing Date</label>
                <div className="text-lg font-medium text-text-primary">
                  {new Date(billingInfo.nextBillingDate).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Next Amount</label>
                <div className="text-lg font-bold text-emerald-500">
                  ${billingInfo.amount}
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-[rgba(65,71,84,0.15)]">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPlanComparison(true)}
                  className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Change Plan
                </button>
                <button 
                  onClick={() => setShowCancellationModal(true)}
                  className="px-4 py-2 bg-surface-high text-text-primary font-medium rounded-lg hover:bg-surface-highest transition-colors"
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
        <div className="bg-surface-low rounded-xl shadow-sm border border-[rgba(65,71,84,0.15)]">
          <div className="p-6 border-b border-[rgba(65,71,84,0.15)]">
            <h2 className="text-lg font-semibold text-text-primary">Payment Method</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-surface-high rounded-lg">
                  <CreditCardIcon className="w-6 h-6 text-text-secondary" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">
                    {billingInfo.paymentMethod.brand?.toUpperCase()} •••• {billingInfo.paymentMethod.last4}
                  </div>
                  {billingInfo.paymentMethod.expiryMonth && billingInfo.paymentMethod.expiryYear && (
                    <div className="text-sm text-text-secondary">
                      Expires {billingInfo.paymentMethod.expiryMonth}/{billingInfo.paymentMethod.expiryYear}
                    </div>
                  )}
                </div>
              </div>
              
              <button className="px-4 py-2 bg-surface-high text-text-primary font-medium rounded-lg hover:bg-surface-highest transition-colors">
                Update Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div className="bg-surface-low rounded-xl shadow-sm border border-[rgba(65,71,84,0.15)]">
        <div className="p-6 border-b border-[rgba(65,71,84,0.15)]">
          <h2 className="text-lg font-semibold text-text-primary">Billing History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface-low divide-y divide-[rgba(65,71,84,0.15)]">
              {invoiceHistory.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-surface">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 text-text-muted mr-2" />
                      <span className="text-sm text-text-primary">
                        {new Date(invoice.date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-text-primary">{invoice.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-primary">
                      ${invoice.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getInvoiceStatusIcon(invoice.status)}
                      <span className={`ml-2 text-sm font-medium ${
                        invoice.status === 'paid' ? 'text-emerald-500' :
                        invoice.status === 'pending' ? 'text-accent' :
                        'text-[#ffb4ab]'
                      }`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="inline-flex items-center text-purple-400 hover:text-purple-800 font-medium text-sm">
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
            <DocumentTextIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No billing history</h3>
            <p className="text-text-secondary">Your invoices will appear here once billing begins.</p>
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
          <p className="mt-2 text-text-secondary">Loading billing information...</p>
        </div>
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}
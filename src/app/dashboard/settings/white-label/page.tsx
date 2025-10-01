'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  GlobeAltIcon, 
  ShieldCheckIcon, 
  PaintBrushIcon, 
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
// import { WhiteLabelService } from '@/lib/white-label-service'
// import { BrandedEmailService } from '@/lib/branded-email-service'

interface WhiteLabelDomain {
  id: string
  business_id: string
  domain: string
  subdomain?: string
  is_active: boolean
  ssl_enabled: boolean
  ssl_verified_at?: string
  dns_verified_at?: string
  config: any
  created_at: string
  updated_at: string
}

interface DomainSetupStep {
  step: number
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  instructions?: string[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function WhiteLabelSettingsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [domains, setDomains] = useState<WhiteLabelDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [showDomainForm, setShowDomainForm] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<WhiteLabelDomain | null>(null)
  const [activeTab, setActiveTab] = useState<'domains' | 'branding' | 'reports' | 'preview'>('domains')
  const [whiteLabelConfig, setWhiteLabelConfig] = useState({
    platform_name: 'Your Salon Booking',
    logo_url: '',
    favicon_url: '',
    colors: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#f59e0b'
    },
    font_family: 'Inter',
    hide_powered_by: true,
    custom_footer: '© 2025 Your Business. All rights reserved.'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const businessId = localStorage.getItem('authenticated_business_id') || '00000000-0000-0000-0000-000000000000'
      
      // Load business info
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (businessError) throw businessError
      setBusiness(businessData)

      // Only load domains if Business+ tier
      if (['business', 'enterprise'].includes(businessData.subscription_tier)) {
        // const domainsData = await WhiteLabelService.getBusinessDomains(businessId)
        const domainsData = [] // Mock for build
        setDomains(domainsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!business || !newDomain.trim()) return

    try {
      setLoading(true)
      
      const domainData = {
        domain: newDomain.trim(),
        config: {
          branding: whiteLabelConfig,
          features: {
            custom_email_domain: true,
            custom_sms_sender: true,
            remove_platform_branding: true,
            custom_login_page: true,
            white_label_dashboard: true
          },
          email: {
            from_domain: `bookings@${newDomain.trim()}`
          },
          sms: {
            sender_id: business.name.substring(0, 11).toUpperCase()
          },
          analytics: {
            custom_tracking: true,
            branded_reports: true
          },
          legal: {
            support_email: `support@${newDomain.trim()}`
          }
        }
      }

      // await WhiteLabelService.createWhiteLabelDomain(business.id, domainData)
      
      setNewDomain('')
      setShowDomainForm(false)
      loadData()
    } catch (error) {
      console.error('Error creating domain:', error)
      alert('Failed to create white-label domain. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this white-label domain? This will break any existing customer links and cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      // await WhiteLabelService.deleteWhiteLabelDomain(domainId, business.id)
      loadData()
    } catch (error) {
      console.error('Error deleting domain:', error)
      alert('Failed to delete domain. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTestWhiteLabelEmail = async () => {
    if (!selectedDomain) return

    try {
      // await WhiteLabelService.sendWhiteLabelEmail(
      //   selectedDomain.domain,
      //   'test@example.com',
      //   'Test White-Label Email',
      //   `<h1>Testing white-label email from ${selectedDomain.domain}</h1><p>This email demonstrates your custom branding and domain setup.</p>`
      // )
      alert('Test email functionality temporarily disabled for deployment')
    } catch (error) {
      console.error('Error sending test email:', error)
      alert('Failed to send test email.')
    }
  }

  const getDomainSetupSteps = (domain: WhiteLabelDomain): DomainSetupStep[] => {
    return [
      {
        step: 1,
        title: 'Add DNS Records',
        description: 'Configure CNAME record with your domain provider',
        status: domain.dns_verified_at ? 'completed' : 'pending',
        instructions: [
          'Log into your domain registrar (GoDaddy, Namecheap, etc.)',
          'Add a CNAME record:',
          `• Type: CNAME`,
          `• Name: @ (or www)`,
          `• Value: cname.dropfly.ai`,
          '• TTL: 3600 (or Auto)',
          'Save the record and wait for DNS propagation (up to 48 hours)'
        ]
      },
      {
        step: 2,
        title: 'SSL Certificate',
        description: 'Automatic SSL certificate provisioning',
        status: domain.ssl_enabled ? 'completed' : domain.dns_verified_at ? 'in_progress' : 'pending'
      },
      {
        step: 3,
        title: 'Domain Verification',
        description: 'Verify domain ownership and activate white-label',
        status: domain.is_active && domain.ssl_enabled ? 'completed' : 'pending'
      },
      {
        step: 4,
        title: 'Branding Configuration',
        description: 'Customize platform appearance and branding',
        status: domain.config?.branding?.platform_name ? 'completed' : 'pending'
      }
    ]
  }

  const canUseWhiteLabel = business && ['business', 'enterprise'].includes(business.subscription_tier)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!canUseWhiteLabel) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <GlobeAltIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">White-Label Features</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            White-label features with custom domains are available on Business and Enterprise plans.
          </p>
          
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-purple-900 mb-3">White-Label Features Include:</h4>
            <ul className="text-left text-purple-800 space-y-2 max-w-md mx-auto">
              <li>• Custom domain (yourbrand.com)</li>
              <li>• Complete platform rebranding</li>
              <li>• Remove "Powered by DropFly"</li>
              <li>• Custom email domain</li>
              <li>• Branded reports and analytics</li>
              <li>• White-label customer portal</li>
            </ul>
          </div>
          
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium">
            Upgrade to Business Plan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">White-Label Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure custom domains and complete platform rebranding for your business.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            Business Plan
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'domains', name: 'Domains', icon: GlobeAltIcon },
            { id: 'branding', name: 'Branding', icon: PaintBrushIcon },
            { id: 'reports', name: 'Reports', icon: DocumentTextIcon },
            { id: 'preview', name: 'Preview', icon: EyeIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {/* Add Domain Form */}
          {showDomainForm ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Add Custom Domain</h2>
              <form onSubmit={handleCreateDomain} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="yourbrand.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Enter your domain without https:// or www. (e.g., yourbrand.com)
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Domain'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDomainForm(false)
                      setNewDomain('')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setShowDomainForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Domain</span>
              </button>
            </div>
          )}

          {/* Domains List */}
          {domains.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <GlobeAltIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No custom domains</h3>
              <p className="text-gray-600 mb-6">
                Add your first custom domain to enable white-label branding.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {domains.map(domain => (
                <div key={domain.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <GlobeAltIcon className="h-6 w-6 text-purple-600" />
                      <div>
                        <h3 className="text-lg font-semibold">{domain.domain}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            domain.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {domain.is_active ? (
                              <>
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                Setup Required
                              </>
                            )}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            domain.ssl_enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {domain.ssl_enabled ? (
                              <>
                                <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                SSL Enabled
                              </>
                            ) : (
                              'SSL Pending'
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedDomain(domain)}
                        className="px-3 py-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleDeleteDomain(domain.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Setup Steps */}
                  <div className="space-y-3">
                    {getDomainSetupSteps(domain).map(step => (
                      <div key={step.step} className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          step.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : step.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : step.status === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircleIcon className="h-4 w-4" />
                          ) : (
                            step.step
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm text-gray-600">{step.description}</p>
                          {step.instructions && step.status === 'pending' && (
                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                              <p className="font-medium mb-2">Setup Instructions:</p>
                              <ul className="space-y-1 text-xs">
                                {step.instructions.map((instruction, i) => (
                                  <li key={i}>{instruction}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {domain.is_active && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Domain is live at: <a href={`https://${domain.domain}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">https://{domain.domain}</a>
                        </p>
                        <button
                          onClick={handleTestWhiteLabelEmail}
                          className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          Test Email
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">Platform Branding Configuration</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Branding Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={whiteLabelConfig.platform_name}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, platform_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Your Salon Booking"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform Logo URL
                </label>
                <input
                  type="url"
                  value={whiteLabelConfig.logo_url}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://yourbrand.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <input
                    type="color"
                    value={whiteLabelConfig.colors.primary}
                    onChange={(e) => setWhiteLabelConfig(prev => ({
                      ...prev,
                      colors: { ...prev.colors, primary: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={whiteLabelConfig.colors.secondary}
                    onChange={(e) => setWhiteLabelConfig(prev => ({
                      ...prev,
                      colors: { ...prev.colors, secondary: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <input
                    type="color"
                    value={whiteLabelConfig.colors.accent}
                    onChange={(e) => setWhiteLabelConfig(prev => ({
                      ...prev,
                      colors: { ...prev.colors, accent: e.target.value }
                    }))}
                    className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Footer Text
                </label>
                <input
                  type="text"
                  value={whiteLabelConfig.custom_footer}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, custom_footer: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  placeholder="© 2025 Your Business. All rights reserved."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hide_powered_by"
                  checked={whiteLabelConfig.hide_powered_by}
                  onChange={(e) => setWhiteLabelConfig(prev => ({ ...prev, hide_powered_by: e.target.checked }))}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="hide_powered_by" className="ml-2 block text-sm text-gray-900">
                  Hide "Powered by DropFly" branding
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-4">Live Preview</h3>
              <div 
                className="border rounded-lg p-6 space-y-4"
                style={{ 
                  background: `linear-gradient(135deg, ${whiteLabelConfig.colors.primary}10 0%, ${whiteLabelConfig.colors.secondary}10 100%)`,
                  fontFamily: whiteLabelConfig.font_family
                }}
              >
                {whiteLabelConfig.logo_url && (
                  <img src={whiteLabelConfig.logo_url} alt="Logo" className="h-12" />
                )}
                <h2 style={{ color: whiteLabelConfig.colors.primary }} className="text-xl font-bold">
                  {whiteLabelConfig.platform_name}
                </h2>
                <div className="space-y-2">
                  <button 
                    className="w-full py-2 rounded text-white font-medium"
                    style={{ backgroundColor: whiteLabelConfig.colors.primary }}
                  >
                    Book Appointment
                  </button>
                  <p className="text-sm text-gray-600">{whiteLabelConfig.custom_footer}</p>
                  {!whiteLabelConfig.hide_powered_by && (
                    <p className="text-xs text-gray-400">Powered by DropFly</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">Branded Report Templates</h2>
          <p className="text-gray-600 mb-6">
            Create custom report templates with your branding for automated reports.
          </p>
          
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Report template configuration coming soon.</p>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6">White-Label Preview</h2>
          <p className="text-gray-600 mb-6">
            Preview how your white-label platform will appear to customers.
          </p>
          
          <div className="text-center py-12">
            <EyeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Interactive preview coming soon.</p>
          </div>
        </div>
      )}
    </div>
  )
}
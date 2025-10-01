'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PhotoIcon, SwatchIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
// import { RevenueChart, ServicePopularityChart } from '@/components/analytics/RevenueChart'
// import { BookingWidget } from '@/components/BookingWidget'
// import { SMSService } from '@/lib/sms-service'
// import { EmailService } from '@/lib/email-service'

interface BrandingConfig {
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family: string
  custom_css?: string
  favicon_url?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BrandingSettingsPage() {
  const [business, setBusiness] = useState<any>(null)
  const [branding, setBranding] = useState<BrandingConfig>({
    primary_color: '#8b5cf6',
    secondary_color: '#ec4899',
    accent_color: '#f59e0b',
    font_family: 'Inter'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Mock data for preview charts
  const mockRevenueData = [
    { date: '2025-01-01', revenue: 1200, appointments: 15, averageTicket: 80 },
    { date: '2025-01-02', revenue: 980, appointments: 12, averageTicket: 82 },
    { date: '2025-01-03', revenue: 1450, appointments: 18, averageTicket: 81 },
    { date: '2025-01-04', revenue: 1100, appointments: 14, averageTicket: 79 },
    { date: '2025-01-05', revenue: 1680, appointments: 21, averageTicket: 80 }
  ]

  const mockServiceData = [
    { name: 'Gel Manicure', revenue: 3600, percentage: 45, color: branding.primary_color },
    { name: 'Pedicure', revenue: 2400, percentage: 30, color: branding.secondary_color },
    { name: 'Nail Art', revenue: 1200, percentage: 15, color: branding.accent_color },
    { name: 'Polish Change', revenue: 800, percentage: 10, color: '#6b7280' }
  ]

  useEffect(() => {
    loadBusinessData()
  }, [])

  const loadBusinessData = async () => {
    try {
      // Get current business from localStorage (in a real app, this would come from auth context)
      const businessId = localStorage.getItem('authenticated_business_id') || '00000000-0000-0000-0000-000000000000'
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (error) throw error

      setBusiness(data)
      if (data.branding) {
        setBranding({ ...branding, ...data.branding })
      }
    } catch (error) {
      console.error('Error loading business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    if (!business) return

    try {
      const fileName = `${business.id}/logo-${Date.now()}.${file.name.split('.').pop()}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName)

      setBranding(prev => ({ ...prev, logo_url: publicUrl }))
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    }
  }

  const saveBranding = async () => {
    if (!business) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ branding })
        .eq('id', business.id)

      if (error) throw error

      setSuccessMessage('Branding settings saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)

      // Update charts and preview in real-time
      document.documentElement.style.setProperty('--brand-primary', branding.primary_color)
      document.documentElement.style.setProperty('--brand-secondary', branding.secondary_color)
      document.documentElement.style.setProperty('--brand-accent', branding.accent_color)
    } catch (error) {
      console.error('Error saving branding:', error)
      alert('Failed to save branding settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const sendTestBrandedEmail = async () => {
    if (!business) return

    const testAppointment = {
      customer: { first_name: 'Preview Customer', email: 'test@example.com' },
      business: { name: business.name },
      appointment_date: '2025-09-03',
      start_time: '2:00 PM',
      service: { name: 'Gel Manicure', base_price: 45 }
    }

    try {
      // await EmailService.sendAppointmentConfirmation(testAppointment)
      alert('Test email functionality temporarily disabled for deployment')
    } catch (error) {
      console.error('Failed to send test email:', error)
      alert('Failed to send test email.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6" style={{
      '--brand-primary': branding.primary_color,
      '--brand-secondary': branding.secondary_color,
      '--brand-accent': branding.accent_color
    } as any}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Customization</h1>
          <p className="text-gray-600 mt-2">
            Customize your brand colors and logo. Changes apply to booking widgets, emails, SMS, and analytics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              previewMode 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <EyeIcon className="h-5 w-5" />
            <span>{previewMode ? 'Exit Preview' : 'Preview Mode'}</span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
          <CheckIcon className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Branding Controls */}
        <div className="xl:col-span-1 space-y-6">
          {/* Logo Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <PhotoIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold">Business Logo</h2>
            </div>

            <div className="space-y-4">
              <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                {branding.logo_url ? (
                  <img src={branding.logo_url} alt="Logo" className="max-h-28 max-w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <span className="text-gray-500 text-sm">No logo uploaded</span>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setLogoFile(file)
                    handleLogoUpload(file)
                  }
                }}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
              >
                <PhotoIcon className="h-5 w-5" />
                <span>Upload Logo</span>
              </label>
              <p className="text-xs text-gray-600">
                Recommended: 500x500px, PNG or SVG format
              </p>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <SwatchIcon className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-semibold">Brand Colors</h2>
            </div>

            <div className="space-y-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.secondary_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={branding.accent_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.accent_color}
                    onChange={(e) => setBranding(prev => ({ ...prev, accent_color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Font Family */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Typography</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={branding.font_family}
                onChange={(e) => setBranding(prev => ({ ...prev, font_family: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="Inter">Inter (Default)</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Poppins">Poppins</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={saveBranding}
              disabled={saving}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {saving ? 'Saving...' : 'Save Branding'}
            </button>
            
            <button
              onClick={sendTestBrandedEmail}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Send Test Email
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="xl:col-span-2 space-y-6">
          {/* Analytics Preview with Custom Branding */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: branding.primary_color }}>
              Branded Analytics Preview
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart with Brand Colors */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Revenue Trends</h3>
                <div className="branded-chart p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">Revenue Analytics</span>
                    <div className="flex space-x-2">
                      {mockRevenueData.map((_, i) => (
                        <div 
                          key={i}
                          className="w-8 h-2 rounded"
                          style={{ backgroundColor: branding.primary_color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-2xl font-bold" style={{ color: branding.primary_color }}>
                    ${mockRevenueData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue (Demo)</div>
                </div>
              </div>

              {/* Service Popularity with Brand Colors */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Service Popularity</h3>
                <div className="branded-chart p-4 border border-gray-200 rounded-lg space-y-3">
                  {mockServiceData.map((service, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="text-sm">{service.name}</span>
                      </div>
                      <div className="text-sm font-medium">{service.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Widget Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: branding.primary_color }}>
              Branded Booking Widget
            </h2>
            
            <div className="max-w-md mx-auto border border-gray-200 rounded-lg p-6 branded-widget">
              {/* Widget Header with Logo */}
              <div className="text-center mb-6">
                {branding.logo_url && (
                  <img src={branding.logo_url} alt="Logo" className="h-16 mx-auto mb-4" />
                )}
                <h3 className="text-xl font-semibold" style={{ color: branding.primary_color }}>
                  {business?.name || 'Your Business Name'}
                </h3>
                <p className="text-gray-600 text-sm mt-1">Book your appointment online</p>
              </div>

              {/* Sample Service Selection */}
              <div className="space-y-3">
                <div 
                  className="p-3 rounded-lg border cursor-pointer transition-colors"
                  style={{ 
                    borderColor: branding.primary_color + '40',
                    backgroundColor: branding.primary_color + '10'
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Gel Manicure</span>
                    <span style={{ color: branding.primary_color }}>$45</span>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Pedicure</span>
                    <span className="text-gray-600">$55</span>
                  </div>
                </div>
              </div>

              {/* Branded Button */}
              <button 
                className="w-full py-3 mt-6 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: branding.primary_color }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = branding.secondary_color
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = branding.primary_color
                }}
              >
                Book Appointment
              </button>
            </div>
          </div>

          {/* Email Template Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6" style={{ color: branding.primary_color }}>
              Branded Email Template
            </h2>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden max-w-lg mx-auto">
              {/* Email Header */}
              <div 
                className="p-6 text-white"
                style={{ 
                  background: `linear-gradient(135deg, ${branding.primary_color} 0%, ${branding.secondary_color} 100%)` 
                }}
              >
                {branding.logo_url && (
                  <img src={branding.logo_url} alt="Logo" className="h-12 mb-3" />
                )}
                <h1 className="text-2xl font-bold">Appointment Confirmed!</h1>
                <p className="opacity-90 text-sm">Your booking is all set</p>
              </div>
              
              {/* Email Body */}
              <div className="p-6 bg-gray-50">
                <div className="bg-white p-6 rounded-lg">
                  <h2 style={{ color: branding.primary_color }} className="text-lg font-semibold mb-4">
                    Hello Customer!
                  </h2>
                  <p className="text-gray-700 mb-4">
                    We're excited to see you! Your appointment has been confirmed.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between py-1">
                      <span className="font-medium">📅 Date:</span>
                      <span>September 3, 2025</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">⏰ Time:</span>
                      <span>2:00 PM</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">💅 Service:</span>
                      <span>Gel Manicure</span>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full py-2 mt-4 rounded text-white font-medium text-sm"
                    style={{ backgroundColor: branding.accent_color }}
                  >
                    Manage Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS Injection for Branded Charts */}
      <style jsx>{`
        .branded-chart .recharts-line-curve {
          stroke: ${branding.primary_color} !important;
        }
        
        .branded-chart .recharts-bar {
          fill: ${branding.primary_color} !important;
        }
        
        .branded-chart .recharts-active-dot {
          stroke: ${branding.secondary_color} !important;
          fill: ${branding.secondary_color} !important;
        }
        
        .branded-widget {
          font-family: ${branding.font_family}, sans-serif;
        }
      `}</style>
    </div>
  )
}
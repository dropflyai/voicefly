'use client'

import { useState, useEffect } from 'react'

interface BrandedAnalyticsProps {
  businessId: string
  branding?: {
    primary_color?: string
    secondary_color?: string
    accent_color?: string
    logo_url?: string
  }
  dateRange?: string
}

export function BrandedAnalytics({ businessId, branding, dateRange = 'month' }: BrandedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState({
    revenue: [],
    services: [],
    staff: [],
    retention: []
  })

  useEffect(() => {
    // Apply branding colors to charts
    if (branding) {
      const root = document.documentElement
      if (branding.primary_color) {
        root.style.setProperty('--chart-primary', branding.primary_color)
      }
      if (branding.secondary_color) {
        root.style.setProperty('--chart-secondary', branding.secondary_color)
      }
      if (branding.accent_color) {
        root.style.setProperty('--chart-accent', branding.accent_color)
      }
    }
  }, [branding])

  return (
    <div className="branded-analytics space-y-6">
      <style jsx>{`
        .branded-analytics {
          --chart-primary: ${branding?.primary_color || '#8b5cf6'};
          --chart-secondary: ${branding?.secondary_color || '#ec4899'};
          --chart-accent: ${branding?.accent_color || '#f59e0b'};
        }
      `}</style>
      
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: branding?.primary_color || '#8b5cf6' }}>
          Branded Analytics Preview
        </h3>
        <p>Analytics charts will be styled with your custom brand colors:</p>
        <div className="flex space-x-4 mt-4">
          <div 
            className="w-16 h-8 rounded" 
            style={{ backgroundColor: branding?.primary_color || '#8b5cf6' }}
          ></div>
          <div 
            className="w-16 h-8 rounded" 
            style={{ backgroundColor: branding?.secondary_color || '#ec4899' }}
          ></div>
          <div 
            className="w-16 h-8 rounded" 
            style={{ backgroundColor: branding?.accent_color || '#f59e0b' }}
          ></div>
        </div>
      </div>
    </div>
  )
}

// Placeholder chart exports that reference existing analytics components
export function BrandedRevenueChart(props: any) {
  return <div className="p-4 border rounded">Revenue Chart (Branded)</div>
}

export function BrandedServicePopularityChart(props: any) {
  return <div className="p-4 border rounded">Service Chart (Branded)</div>
}

export function BrandedStaffPerformanceChart(props: any) {
  return <div className="p-4 border rounded">Staff Chart (Branded)</div>
}

export function BrandedCustomerRetentionChart(props: any) {
  return <div className="p-4 border rounded">Retention Chart (Branded)</div>
}
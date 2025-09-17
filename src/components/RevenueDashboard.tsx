"use client"

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, Calendar, Phone, Target, Zap } from 'lucide-react'

interface RevenueMetrics {
  total_revenue: number
  monthly_revenue: number
  appointments_booked: number
  deals_closed: number
  roi_percentage: number
  cost_savings: number
}

export default function RevenueDashboard({ businessId }: { businessId: string }) {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [businessId])

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/revenue?business_id=${businessId}`)
      const data = await response.json()
      setMetrics(data.metrics)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return <div className="text-center py-8">Failed to load revenue metrics</div>
  }

  const metricCards = [
    {
      title: "Total Revenue Generated",
      value: `$${metrics.total_revenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      change: "+" + Math.round((metrics.total_revenue / 1000) * 100) / 100 + "K this month"
    },
    {
      title: "ROI from AI Agent",
      value: `${metrics.roi_percentage}%`,
      icon: TrendingUp,
      color: "bg-blue-500",
      change: "Return on investment"
    },
    {
      title: "Appointments Booked",
      value: metrics.appointments_booked.toString(),
      icon: Calendar,
      color: "bg-purple-500",
      change: "By AI voice agent"
    },
    {
      title: "Deals Closed",
      value: metrics.deals_closed.toString(),
      icon: Target,
      color: "bg-orange-500",
      change: "From voice calls"
    },
    {
      title: "Cost Savings",
      value: `$${metrics.cost_savings.toLocaleString()}`,
      icon: Zap,
      color: "bg-yellow-500",
      change: "vs human receptionist"
    },
    {
      title: "Monthly Revenue",
      value: `$${metrics.monthly_revenue.toLocaleString()}`,
      icon: Phone,
      color: "bg-indigo-500",
      change: "AI-generated revenue"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Revenue Hero */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">RevFly Impact</h2>
          <p className="text-xl opacity-90 mb-4">Your AI is generating real money 💰</p>
          <div className="text-5xl font-bold">
            ${metrics.total_revenue.toLocaleString()}
          </div>
          <p className="text-lg opacity-80 mt-2">Total revenue generated this month</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border">
              <div className="flex items-center justify-between mb-4">
                <div className={`${metric.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-500">
                    {metric.change}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {metric.title}
              </h3>
            </div>
          )
        })}
      </div>

      {/* ROI Calculator */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <h3 className="text-xl font-bold mb-4">Revenue vs Investment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              ${metrics.total_revenue.toLocaleString()}
            </div>
            <p className="text-gray-600">Revenue Generated</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              $297
            </div>
            <p className="text-gray-600">Monthly Investment</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {metrics.roi_percentage}%
            </div>
            <p className="text-gray-600">Return on Investment</p>
          </div>
        </div>

        {metrics.roi_percentage > 100 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold">
              🎉 Your AI agent has already paid for itself {Math.floor(metrics.roi_percentage / 100)}x over!
            </p>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-3">🚀 Scale Your Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Optimization Opportunities:</h4>
            <ul className="text-sm opacity-90 space-y-1">
              <li>• Increase call volume by 50%</li>
              <li>• Add upselling to voice scripts</li>
              <li>• Enable 24/7 booking availability</li>
              <li>• Integrate with more lead sources</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Projected Impact:</h4>
            <ul className="text-sm opacity-90 space-y-1">
              <li>• +${Math.round(metrics.total_revenue * 0.5).toLocaleString()} monthly revenue</li>
              <li>• +{Math.round(metrics.appointments_booked * 0.3)} appointments</li>
              <li>• {Math.round(metrics.roi_percentage * 1.5)}% ROI increase</li>
              <li>• Upgrade to Professional tier</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
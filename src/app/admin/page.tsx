'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Stats {
  totalConversations: number
  leadsCaptured: number
  leadCaptureRate: number
  topInsights: { situation: string; times_seen: number; conversion_rate: number }[]
  recentConversations: { id: string; outcome: string; exchange_count: number; visitor_business_type: string; created_at: string }[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      if (res.ok) setStats(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-gray-500">Loading...</div>
  if (!stats) return <div className="text-red-500">Failed to load stats</div>

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Maya Performance</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Conversations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalConversations}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Leads Captured</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.leadsCaptured}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Lead Capture Rate</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{stats.leadCaptureRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Insights */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Most Seen Objections/Questions</h2>
          {stats.topInsights.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topInsights.map((insight, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 flex-1 leading-snug">{insight.situation}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                    {insight.times_seen}x
                  </span>
                </div>
              ))}
            </div>
          )}
          <a href="/admin/insights" className="text-xs text-blue-600 hover:underline mt-4 block">Manage insights →</a>
        </div>

        {/* Recent Conversations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Conversations</h2>
          {stats.recentConversations.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentConversations.map((c) => (
                <a key={c.id} href="/admin/conversations" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors block">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    c.outcome === 'lead_captured' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {c.outcome === 'lead_captured' ? 'Lead' : 'Browsing'}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">{c.visitor_business_type || 'Unknown business'}</span>
                  <span className="text-xs text-gray-400">{c.exchange_count} msgs</span>
                </a>
              ))}
            </div>
          )}
          <a href="/admin/conversations" className="text-xs text-blue-600 hover:underline mt-4 block">View all →</a>
        </div>
      </div>
    </div>
  )
}

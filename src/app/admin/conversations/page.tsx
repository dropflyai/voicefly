'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Conversation {
  id: string
  session_id: string
  outcome: string
  lead_captured: boolean
  exchange_count: number
  visitor_business_type: string | null
  visitor_employee_interest: string | null
  insights_extracted: boolean
  created_at: string
  messages?: { role: string; content: string }[]
}

interface ExtractedInsight {
  category: string
  situation: string
  winning_response: string
  trigger_keywords: string[]
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedMessages, setExpandedMessages] = useState<{ role: string; content: string }[]>([])
  const [extracting, setExtracting] = useState<string | null>(null)
  const [suggestedInsights, setSuggestedInsights] = useState<ExtractedInsight[] | null>(null)
  const [savingInsight, setSavingInsight] = useState(false)
  const [token, setToken] = useState<string>('')
  const [filter, setFilter] = useState<'all' | 'lead_captured' | 'browsing'>('all')

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setToken(session.access_token)
    }
    init()
  }, [])

  useEffect(() => {
    if (!token) return
    load()
  }, [token, filter])

  async function load() {
    setLoading(true)
    const url = `/api/admin/conversations?limit=30${filter !== 'all' ? `&outcome=${filter}` : ''}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setConversations(data.conversations)
      setTotal(data.total)
    }
    setLoading(false)
  }

  async function expandConversation(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    const res = await fetch(`/api/admin/conversations/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      const data = await res.json()
      setExpandedMessages(data.conversation.messages || [])
    }
    setExpandedId(id)
    setSuggestedInsights(null)
  }

  async function extractInsights(id: string) {
    setExtracting(id)
    setSuggestedInsights(null)
    const res = await fetch(`/api/admin/conversations/${id}/extract`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      setSuggestedInsights(data.insights)
    }
    setExtracting(null)
  }

  async function saveInsight(insight: ExtractedInsight, conversationId: string) {
    setSavingInsight(true)
    await fetch('/api/admin/insights', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...insight, source: 'extracted', source_conversation_id: conversationId })
    })
    setSavingInsight(false)
    setSuggestedInsights(prev => prev ? prev.filter(i => i.situation !== insight.situation) : null)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversations <span className="text-gray-400 font-normal text-lg">({total})</span></h1>
        <div className="flex gap-2">
          {(['all', 'lead_captured', 'browsing'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {f === 'all' ? 'All' : f === 'lead_captured' ? 'Leads' : 'Browsing'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="space-y-2">
          {conversations.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div
                onClick={() => expandConversation(c.id)}
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
                  c.outcome === 'lead_captured' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.outcome === 'lead_captured' ? 'Lead' : 'Browsing'}
                </span>
                <span className="text-sm text-gray-700 flex-1">{c.visitor_business_type || 'Unknown business'}</span>
                {c.visitor_employee_interest && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.visitor_employee_interest}</span>
                )}
                <span className="text-sm text-gray-500">{c.exchange_count} msgs</span>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
                {c.insights_extracted && <span className="text-xs text-purple-600">extracted</span>}
              </div>

              {expandedId === c.id && (
                <div className="border-t border-gray-100 p-4">
                  {/* Conversation replay */}
                  <div className="space-y-2 mb-4 max-h-72 overflow-y-auto">
                    {expandedMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-lg text-sm px-3 py-2 rounded-xl ${
                          m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className="whitespace-pre-line">{m.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => extractInsights(c.id)}
                      disabled={extracting === c.id}
                      className="text-sm px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {extracting === c.id ? 'Extracting...' : 'Extract Insights'}
                    </button>
                  </div>

                  {/* Suggested insights */}
                  {suggestedInsights && expandedId === c.id && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">Suggested insights ({suggestedInsights.length}):</p>
                      {suggestedInsights.length === 0 && <p className="text-sm text-gray-400">No useful insights found in this conversation.</p>}
                      {suggestedInsights.map((insight, i) => (
                        <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-xs font-medium text-purple-600 uppercase">{insight.category}</span>
                              <p className="text-sm font-medium text-gray-800 mt-0.5">{insight.situation}</p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{insight.winning_response}</p>
                            </div>
                            <button
                              onClick={() => saveInsight(insight, c.id)}
                              disabled={savingInsight}
                              className="text-xs px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex-shrink-0 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {conversations.length === 0 && <p className="text-gray-400 text-center py-8">No conversations yet</p>}
        </div>
      )}
    </div>
  )
}

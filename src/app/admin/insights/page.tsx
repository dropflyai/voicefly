'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface Insight {
  id: string
  category: string
  situation: string
  winning_response: string
  trigger_keywords: string[]
  times_seen: number
  times_used: number
  conversion_rate: number
  effectiveness_score: number
  is_active: boolean
  source: string
  created_at: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIES = ['objection', 'question', 'winning_close', 'demo_script']

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newInsight, setNewInsight] = useState({ category: 'objection', situation: '', winning_response: '', trigger_keywords: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setToken(session.access_token); load(session.access_token) }
    }
    init()
  }, [])

  async function load(t = token) {
    setLoading(true)
    const res = await fetch('/api/admin/insights', { headers: { Authorization: `Bearer ${t}` } })
    if (res.ok) setInsights((await res.json()).insights)
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/admin/insights/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current })
    })
    setInsights(prev => prev.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  async function setScore(id: string, score: number) {
    await fetch(`/api/admin/insights/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ effectiveness_score: score })
    })
    setInsights(prev => prev.map(i => i.id === id ? { ...i, effectiveness_score: score } : i))
  }

  async function deleteInsight(id: string) {
    if (!confirm('Delete this insight?')) return
    await fetch(`/api/admin/insights/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setInsights(prev => prev.filter(i => i.id !== id))
  }

  async function addInsight() {
    if (!newInsight.situation || !newInsight.winning_response) return
    setSaving(true)
    const res = await fetch('/api/admin/insights', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: newInsight.category,
        situation: newInsight.situation,
        winning_response: newInsight.winning_response,
        trigger_keywords: newInsight.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean),
      })
    })
    if (res.ok) {
      const data = await res.json()
      setInsights(prev => [data.insight, ...prev])
      setNewInsight({ category: 'objection', situation: '', winning_response: '', trigger_keywords: '' })
      setShowAddForm(false)
    }
    setSaving(false)
  }

  const suggested = insights.filter(i => i.source === 'suggested' && !i.is_active)
  const active = insights.filter(i => i.is_active)
  const inactive = insights.filter(i => !i.is_active && i.source !== 'suggested')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maya Insights <span className="text-gray-400 font-normal text-lg">({insights.length})</span></h1>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Add Insight
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Insight</h3>
          <div className="space-y-3">
            <select value={newInsight.category} onChange={e => setNewInsight(p => ({ ...p, category: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input value={newInsight.situation} onChange={e => setNewInsight(p => ({ ...p, situation: e.target.value }))}
              placeholder="Situation: when should Maya use this?" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <textarea value={newInsight.winning_response} onChange={e => setNewInsight(p => ({ ...p, winning_response: e.target.value }))}
              placeholder="Winning response text..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
            <input value={newInsight.trigger_keywords} onChange={e => setNewInsight(p => ({ ...p, trigger_keywords: e.target.value }))}
              placeholder="Trigger keywords (comma separated): robotic, fake, sound like ai" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={addInsight} disabled={saving} className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setShowAddForm(false)} className="text-sm px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="space-y-6">
          {/* Suggested — awaiting review */}
          {suggested.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">Suggested by n8n ({suggested.length})</h2>
              <InsightList insights={suggested} expandedId={expandedId} setExpandedId={setExpandedId} onToggle={toggleActive} onScore={setScore} onDelete={deleteInsight} />
            </section>
          )}

          {/* Active */}
          <section>
            <h2 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">Active in Maya ({active.length})</h2>
            <InsightList insights={active} expandedId={expandedId} setExpandedId={setExpandedId} onToggle={toggleActive} onScore={setScore} onDelete={deleteInsight} />
          </section>

          {/* Inactive */}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Inactive ({inactive.length})</h2>
              <InsightList insights={inactive} expandedId={expandedId} setExpandedId={setExpandedId} onToggle={toggleActive} onScore={setScore} onDelete={deleteInsight} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function InsightList({ insights, expandedId, setExpandedId, onToggle, onScore, onDelete }: {
  insights: Insight[]
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  onToggle: (id: string, current: boolean) => void
  onScore: (id: string, score: number) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {insights.map(insight => (
        <div key={insight.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
              insight.category === 'objection' ? 'bg-red-100 text-red-600' :
              insight.category === 'question' ? 'bg-blue-100 text-blue-600' :
              insight.category === 'winning_close' ? 'bg-green-100 text-green-600' :
              'bg-purple-100 text-purple-600'
            }`}>{insight.category}</span>

            <p className="text-sm text-gray-800 flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === insight.id ? null : insight.id)}>
              {insight.situation}
            </p>

            {/* Score stars */}
            <div className="flex gap-0.5 flex-shrink-0">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => onScore(insight.id, s)}
                  className={`text-sm ${s <= insight.effectiveness_score ? 'text-yellow-400' : 'text-gray-200'} hover:text-yellow-400 transition-colors`}>
                  ★
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-400 flex-shrink-0">{insight.times_seen}x seen</span>

            {/* Toggle active */}
            <button onClick={() => onToggle(insight.id, insight.is_active)}
              className={`text-xs px-3 py-1 rounded-full transition-colors flex-shrink-0 ${
                insight.is_active ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
              }`}>
              {insight.is_active ? 'Active' : 'Inactive'}
            </button>

            <button onClick={() => onDelete(insight.id)} className="text-gray-300 hover:text-red-500 transition-colors text-sm">✕</button>
          </div>

          {expandedId === insight.id && (
            <div className="border-t border-gray-100 p-4 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 mb-1">Response:</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{insight.winning_response}</p>
              {insight.trigger_keywords?.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {insight.trigger_keywords.map(k => (
                    <span key={k} className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{k}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

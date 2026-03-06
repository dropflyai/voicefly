'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { supabase } from '../lib/supabase-client'

export interface VoiceItem {
  voiceId: string
  name: string
  gender: string | null
  age: string | null
  accent: string | null
  description: string | null
  previewUrl: string | null
}

export default function VoicePicker({
  voiceId,
  voiceName,
  voicePreviewUrl,
  onSelect,
}: {
  voiceId: string
  voiceName: string
  voicePreviewUrl: string | null
  onSelect: (v: { voiceId: string; voiceName: string; voicePreviewUrl: string | null }) => void
}) {
  const [open, setOpen] = useState(false)
  const [voices, setVoices] = useState<VoiceItem[]>([])
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState<'all' | 'male' | 'female'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchVoices = useCallback(async (searchTerm: string, genderFilter: string, pg: number, append = false) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const params = new URLSearchParams({ page: String(pg), limit: '16' })
      if (searchTerm) params.set('search', searchTerm)
      if (genderFilter !== 'all') params.set('gender', genderFilter)

      const res = await fetch(`/api/voices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setVoices(prev => append ? [...prev, ...data.voices] : data.voices)
      setHasMore(data.hasMore ?? false)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!open) return
    if (voices.length === 0) fetchVoices('', 'all', 1)
  }, [open, fetchVoices, voices.length])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(1)
      fetchVoices(val, gender, 1)
    }, 300)
  }

  const handleGender = (g: 'all' | 'male' | 'female') => {
    setGender(g)
    setPage(1)
    fetchVoices(search, g, 1)
  }

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchVoices(search, gender, next, true)
  }

  const playPreview = (v: VoiceItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!v.previewUrl) return
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (playingId === v.voiceId) { setPlayingId(null); return }
    const audio = new Audio(v.previewUrl)
    audioRef.current = audio
    setPlayingId(v.voiceId)
    audio.play()
    audio.onended = () => setPlayingId(null)
  }

  const selectVoice = (v: VoiceItem) => {
    onSelect({ voiceId: v.voiceId, voiceName: v.name, voicePreviewUrl: v.previewUrl })
    setOpen(false)
    if (audioRef.current) { audioRef.current.pause(); setPlayingId(null) }
  }

  return (
    <div>
      {/* Selected voice chip */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex-1 min-w-0">
          <span className="text-sm font-medium text-blue-900 truncate">{voiceName || 'No voice selected'}</span>
          {voicePreviewUrl && (
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setPlayingId(null); return }
                const audio = new Audio(voicePreviewUrl)
                audioRef.current = audio
                setPlayingId('selected')
                audio.play()
                audio.onended = () => setPlayingId(null)
              }}
              className="text-blue-600 hover:text-blue-800 flex-shrink-0 text-xs"
            >
              {playingId === 'selected' ? '⏹' : '▶ Preview'}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {open ? 'Close' : 'Browse voices'}
        </button>
      </div>

      {/* Browser panel */}
      {open && (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          {/* Filters */}
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search voices..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'female', 'male'] as const).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleGender(g)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    gender === g ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Voice grid */}
          <div className="max-h-72 overflow-y-auto p-2">
            {loading && voices.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">Loading voices...</div>
            ) : voices.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">No voices found</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {voices.map(v => (
                  <button
                    key={v.voiceId}
                    type="button"
                    onClick={() => selectVoice(v)}
                    className={`text-left p-2 rounded-lg border transition-all ${
                      voiceId === v.voiceId
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-medium text-gray-900 truncate">{v.name}</span>
                      {v.previewUrl && (
                        <button
                          type="button"
                          onClick={e => playPreview(v, e)}
                          className="text-blue-500 hover:text-blue-700 flex-shrink-0 text-xs mt-0.5"
                        >
                          {playingId === v.voiceId ? '⏹' : '▶'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {v.gender && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{v.gender}</span>
                      )}
                      {v.accent && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{v.accent}</span>
                      )}
                      {v.age && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{v.age}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full mt-2 py-2 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more voices'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

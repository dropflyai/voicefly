"use client"

import { useState, useRef, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  BeakerIcon,
  BookmarkIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  LightBulbIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import DOMPurify from 'isomorphic-dompurify'

type ResearchMode = 'deep' | 'quick' | 'prospect' | 'competitor' | 'market'
type ResearchStatus = 'idle' | 'searching' | 'analyzing' | 'complete' | 'error'

interface Source {
  title: string
  url: string
  snippet: string
  relevance: number
}

interface ResearchResult {
  query: string
  mode: ResearchMode
  summary: string
  sources: Source[]
  insights: string[]
  timestamp: string
  duration: number
}

interface SavedResearch {
  id: string
  title: string
  mode: ResearchMode
  timestamp: string
  summary: string
}

const researchTemplates = {
  prospect: [
    "Find all {industry} businesses in {location} with {criteria}",
    "What are the top pain points for {industry} owners?",
    "Average appointment volume for {industry} practices",
    "Common objections when selling to {industry}",
    "Best times to contact {industry} decision makers"
  ],
  competitor: [
    "What features does {competitor} offer?",
    "Pricing analysis for {competitor}",
    "Customer reviews and complaints about {competitor}",
    "How does {competitor} position themselves?",
    "What integrations does {competitor} support?"
  ],
  market: [
    "Market size for {industry} in {location}",
    "Growth trends in {industry} sector",
    "Technology adoption rates in {industry}",
    "Average customer lifetime value in {industry}",
    "Regulatory changes affecting {industry}"
  ]
}

export default function ResearchPage() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<ResearchMode>('deep')
  const [status, setStatus] = useState<ResearchStatus>('idle')
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([])
  const [showTemplates, setShowTemplates] = useState(true)
  const [streamedContent, setStreamedContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Load saved research from localStorage
    const saved = localStorage.getItem('voicefly_research')
    if (saved) {
      setSavedResearch(JSON.parse(saved))
    }
  }, [])

  const handleResearch = async () => {
    if (!query.trim()) return

    setStatus('searching')
    setShowTemplates(false)
    setResult(null)
    setStreamedContent('')

    const startTime = Date.now()

    try {
      // Deep Research mode - multiple parallel searches
      if (mode === 'deep') {
        await performDeepResearch(query)
      } else if (mode === 'quick') {
        await performQuickResearch(query)
      } else if (mode === 'prospect') {
        await performProspectResearch(query)
      } else if (mode === 'competitor') {
        await performCompetitorResearch(query)
      } else if (mode === 'market') {
        await performMarketResearch(query)
      }

      const duration = Date.now() - startTime
      setStatus('complete')

      // Save to history
      const newResearch: SavedResearch = {
        id: Date.now().toString(),
        title: query.slice(0, 50) + (query.length > 50 ? '...' : ''),
        mode,
        timestamp: new Date().toISOString(),
        summary: streamedContent.slice(0, 200)
      }
      const updated = [newResearch, ...savedResearch].slice(0, 20)
      setSavedResearch(updated)
      localStorage.setItem('voicefly_research', JSON.stringify(updated))

    } catch (error) {
      console.error('Research failed:', error)
      setStatus('error')
      setStreamedContent('Research failed. Please try again.')
    }
  }

  const performDeepResearch = async (query: string) => {
    await callResearchAPI(query, 'deep')
  }

  const performQuickResearch = async (query: string) => {
    await callResearchAPI(query, 'quick')
  }

  const performProspectResearch = async (query: string) => {
    await callResearchAPI(query, 'prospect')
  }

  const performCompetitorResearch = async (query: string) => {
    await callResearchAPI(query, 'competitor')
  }

  const performMarketResearch = async (query: string) => {
    await callResearchAPI(query, 'market')
  }

  const callResearchAPI = async (query: string, mode: ResearchMode) => {
    try {
      setStatus('searching')

      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode })
      })

      if (!response.ok) throw new Error('Research failed')

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      setStatus('analyzing')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        setStreamedContent(prev => prev + chunk)
      }

      setStatus('complete')
    } catch (error) {
      console.error('Research error:', error)
      setStatus('error')
      setStreamedContent('Research failed. Please try again.')
    }
  }


  const copyToClipboard = () => {
    navigator.clipboard.writeText(streamedContent)
    alert('Copied to clipboard!')
  }

  const saveAsNote = () => {
    // In production, save to database
    alert('Saved as note!')
  }

  const useTemplate = (template: string) => {
    setQuery(template)
    setShowTemplates(false)
  }

  const loadSavedResearch = (research: SavedResearch) => {
    setQuery(research.title)
    setMode(research.mode)
    // In production, load full research from database
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-purple-600" />
                AI Research Hub
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Deep research powered by multiple AI agents
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <BookmarkIcon className="w-4 h-4 inline mr-2" />
                Saved ({savedResearch.length})
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700">
                <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Research Modes */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Research Mode</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setMode('deep')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'deep'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BeakerIcon className="w-4 h-4 inline mr-2" />
                  Deep Research
                  <span className="block text-xs text-gray-500 mt-1">2-4 min, comprehensive</span>
                </button>
                <button
                  onClick={() => setMode('quick')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'quick'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <MagnifyingGlassIcon className="w-4 h-4 inline mr-2" />
                  Quick Answer
                  <span className="block text-xs text-gray-500 mt-1">30 sec, concise</span>
                </button>
                <button
                  onClick={() => setMode('prospect')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'prospect'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserGroupIcon className="w-4 h-4 inline mr-2" />
                  Prospect Intel
                  <span className="block text-xs text-gray-500 mt-1">Find & analyze prospects</span>
                </button>
                <button
                  onClick={() => setMode('competitor')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'competitor'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
                  Competitor Analysis
                  <span className="block text-xs text-gray-500 mt-1">Features, pricing, reviews</span>
                </button>
                <button
                  onClick={() => setMode('market')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'market'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4 inline mr-2" />
                  Market Research
                  <span className="block text-xs text-gray-500 mt-1">Trends, size, opportunities</span>
                </button>
              </div>
            </div>

            {/* Recent Research */}
            {savedResearch.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Research</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {savedResearch.map((research) => (
                    <button
                      key={research.id}
                      onClick={() => loadSavedResearch(research)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {research.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(research.timestamp).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Input */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleResearch()
                    }
                  }}
                  placeholder="Ask anything... Try: 'Find all dental practices in Miami with 3+ locations'"
                  className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
                <button
                  onClick={handleResearch}
                  disabled={status === 'searching' || status === 'analyzing'}
                  className="absolute right-2 bottom-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {status === 'searching' || status === 'analyzing' ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 inline mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="w-4 h-4 inline mr-2" />
                      Research
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Cmd/Ctrl + Enter to search • {mode === 'deep' ? '2-4 min' : '30 sec'} • Sources cited
              </div>
            </div>

            {/* Templates */}
            {showTemplates && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                  Research Templates
                </h3>
                <div className="space-y-3">
                  {mode && researchTemplates[mode]?.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => useTemplate(template)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                    >
                      <div className="text-sm text-gray-700 group-hover:text-purple-700">
                        {template}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {streamedContent && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {status === 'searching' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        Searching sources...
                      </div>
                    )}
                    {status === 'analyzing' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BeakerIcon className="w-4 h-4 animate-pulse" />
                        Analyzing data...
                      </div>
                    )}
                    {status === 'complete' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <SparklesIcon className="w-4 h-4" />
                        Research complete
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyToClipboard}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Copy to clipboard"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={saveAsNote}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Save as note"
                    >
                      <BookmarkIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                      title="Share research"
                    >
                      <LinkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        streamedContent
                          .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                          .replace(/^## (.*)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$2</h2>')
                          .replace(/^### (.*)/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$3</h3>')
                          .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
                          .replace(/^• (.*)/gm, '<li class="ml-4">$1</li>')
                          .replace(/^✓ (.*)/gm, '<li class="ml-4 text-green-600">✓ $1</li>')
                          .replace(/^❌ (.*)/gm, '<li class="ml-4 text-red-600">❌ $1</li>')
                      )
                    }}
                  />
                </div>
              </div>
            )}

            {/* Empty State */}
            {!streamedContent && !showTemplates && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <GlobeAltIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start Your Research
                </h3>
                <p className="text-gray-500 mb-6">
                  Enter a query above or select a template to begin
                </p>
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  View Templates
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

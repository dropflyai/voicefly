"use client"

import { useState, useEffect } from 'react'
import { Search, Globe, Brain, Download, Bookmark, Clock, ExternalLink, Zap, Filter, Plus, FileText, Target, Cpu, BarChart3, MessageCircle, RefreshCw } from 'lucide-react'

interface ResearchResult {
  title: string
  url: string
  snippet: string
  source: string
  timestamp: string
  relevance_score: number
  citations?: number[]
  type: 'web' | 'academic' | 'news' | 'social'
}

interface CompanyProfile {
  company_name: string
  website: string
  industry: string
  employees: string
  revenue: string
  tech_stack: string[]
  recent_news: string[]
  competitors: string[]
  pain_points: string[]
  contact_info: any[]
}

export default function ResearchBrowser() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<ResearchResult[]>([])
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedResearch, setSavedResearch] = useState<any[]>([])
  const [searchFocus, setSearchFocus] = useState<'general' | 'academic' | 'news' | 'social'>('general')
  const [isDeepResearch, setIsDeepResearch] = useState(false)
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [activeSpace, setActiveSpace] = useState<string>('default')
  const [researchSpaces, setResearchSpaces] = useState<any[]>([
    { id: 'default', name: 'General Research', count: 0 }
  ])
  const [citations, setCitations] = useState<any[]>([])
  const [researchProgress, setResearchProgress] = useState<any[]>([])
  const [autonomousMode, setAutonomousMode] = useState(false)

  // Enhanced AI-powered research with Perplexity + Manus capabilities
  const performResearch = async (searchQuery: string) => {
    setIsSearching(true)
    setQuery(searchQuery)
    setResearchProgress([])
    setCitations([])

    try {
      // Add to search history
      setSearchHistory(prev => [searchQuery, ...prev.slice(0, 9)])

      // Simulate autonomous research progress (Manus-style)
      if (autonomousMode || isDeepResearch) {
        setResearchProgress([
          { step: 1, action: 'Analyzing query and formulating research plan', status: 'completed' },
          { step: 2, action: 'Searching multiple web sources', status: 'in_progress' },
          { step: 3, action: 'Gathering academic and news sources', status: 'pending' },
          { step: 4, action: 'Cross-referencing and fact-checking', status: 'pending' },
          { step: 5, action: 'Generating comprehensive report', status: 'pending' }
        ])

        // Simulate progressive research steps
        await new Promise(resolve => setTimeout(resolve, 1500))
        setResearchProgress(prev => prev.map(step =>
          step.step === 2 ? { ...step, status: 'completed' } :
          step.step === 3 ? { ...step, status: 'in_progress' } : step
        ))

        await new Promise(resolve => setTimeout(resolve, 1000))
        setResearchProgress(prev => prev.map(step =>
          step.step === 3 ? { ...step, status: 'completed' } :
          step.step === 4 ? { ...step, status: 'in_progress' } : step
        ))

        await new Promise(resolve => setTimeout(resolve, 1000))
        setResearchProgress(prev => prev.map(step =>
          step.step === 4 ? { ...step, status: 'completed' } :
          step.step === 5 ? { ...step, status: 'in_progress' } : step
        ))
      } else {
        // Standard research
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Generate focus-specific results (Perplexity-style)
      const getFocusIcon = (type: string) => {
        switch(type) {
          case 'academic': return '📚'
          case 'news': return '📰'
          case 'social': return '💬'
          default: return '🌐'
        }
      }

      const mockResults: ResearchResult[] = [
        {
          title: `${searchQuery} - ${searchFocus === 'academic' ? 'Academic Research' : 'Comprehensive Analysis'}`,
          url: `https://example.com/${searchQuery.toLowerCase()}`,
          snippet: `${autonomousMode ? 'Autonomous AI analysis of' : 'AI-powered analysis of'} ${searchQuery} including business model, competitive landscape, recent developments, and growth opportunities...`,
          source: `${searchFocus === 'academic' ? 'Academic Sources' : 'WebOps Intelligence'}`,
          timestamp: new Date().toISOString(),
          relevance_score: 95,
          citations: [1, 2, 3],
          type: searchFocus as any
        },
        {
          title: `${searchQuery} Technology Stack & Digital Presence`,
          url: `https://builtwith.com/${searchQuery}`,
          snippet: `Technical analysis revealing WordPress, Google Analytics, Salesforce integration. Recent website updates suggest expansion...`,
          source: 'Tech Intelligence',
          timestamp: new Date().toISOString(),
          relevance_score: 88,
          citations: [4, 5],
          type: 'web'
        },
        {
          title: `${searchQuery} Financial Performance & Market Position`,
          url: `https://finance.example.com/${searchQuery}`,
          snippet: `Revenue estimated at $2-5M annually. Growing 15% YoY. Key competitors include... Recent funding round indicates...`,
          source: 'Financial Intelligence',
          timestamp: new Date().toISOString(),
          relevance_score: 92,
          citations: [6, 7, 8],
          type: 'news'
        },
        {
          title: `${searchQuery} Recent News & Market Activity`,
          url: `https://news.example.com/${searchQuery}`,
          snippet: `Latest developments: New product launch, hiring spree, expansion plans. CEO quoted saying "We're focused on..."`,
          source: 'News Intelligence',
          timestamp: new Date().toISOString(),
          relevance_score: 85,
          citations: [9, 10],
          type: 'news'
        },
        {
          title: `${searchQuery} Contact Discovery & Decision Makers`,
          url: `https://contacts.example.com/${searchQuery}`,
          snippet: `Key contacts identified: CEO John Smith (john@company.com), CTO Sarah Johnson (sarah@company.com). Direct phone numbers...`,
          source: 'Contact Intelligence',
          timestamp: new Date().toISOString(),
          relevance_score: 97,
          citations: [11, 12],
          type: 'social'
        }
      ]

      // Mock company profile
      const mockProfile: CompanyProfile = {
        company_name: searchQuery,
        website: `https://${searchQuery.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: 'Professional Services',
        employees: '25-50',
        revenue: '$2-5M annually',
        tech_stack: ['WordPress', 'Google Analytics', 'Salesforce', 'Stripe'],
        recent_news: [
          'Expanded to new market segment',
          'Hired 5 new employees this quarter',
          'Launched new product line',
          'Received industry recognition award'
        ],
        competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
        pain_points: [
          'Lead generation challenges',
          'Customer retention',
          'Scaling operations',
          'Digital transformation'
        ],
        contact_info: [
          { name: 'John Smith', title: 'CEO', email: 'john@company.com', phone: '+1-555-0123' },
          { name: 'Sarah Johnson', title: 'CTO', email: 'sarah@company.com', phone: '+1-555-0124' }
        ]
      }

      // Generate citations (Perplexity-style)
      const mockCitations = [
        { id: 1, title: `${searchQuery} Official Website`, url: `https://${searchQuery.toLowerCase()}.com`, accessed: new Date().toISOString() },
        { id: 2, title: 'Industry Analysis Report', url: 'https://industry-reports.com/analysis', accessed: new Date().toISOString() },
        { id: 3, title: 'Market Research Database', url: 'https://market-data.com/research', accessed: new Date().toISOString() },
        { id: 4, title: 'Technology Stack Analysis', url: 'https://builtwith.com/detailed-report', accessed: new Date().toISOString() },
        { id: 5, title: 'Digital Presence Audit', url: 'https://digital-audit.com/report', accessed: new Date().toISOString() },
        { id: 6, title: 'Financial Performance Data', url: 'https://finance.com/company-data', accessed: new Date().toISOString() },
        { id: 7, title: 'Revenue Estimates Report', url: 'https://revenue-tracker.com/estimates', accessed: new Date().toISOString() },
        { id: 8, title: 'Market Position Analysis', url: 'https://market-position.com/analysis', accessed: new Date().toISOString() },
        { id: 9, title: 'Recent News Coverage', url: 'https://news-aggregator.com/recent', accessed: new Date().toISOString() },
        { id: 10, title: 'Press Release Archive', url: 'https://press-releases.com/archive', accessed: new Date().toISOString() },
        { id: 11, title: 'LinkedIn Company Profile', url: 'https://linkedin.com/company/profile', accessed: new Date().toISOString() },
        { id: 12, title: 'Contact Database', url: 'https://contacts-db.com/directory', accessed: new Date().toISOString() }
      ]

      // Generate follow-up questions (Perplexity-style)
      const mockFollowUps = [
        `What are ${searchQuery}'s main competitors?`,
        `How has ${searchQuery} grown over the past year?`,
        `What technology does ${searchQuery} use?`,
        `Who are the key decision makers at ${searchQuery}?`,
        `What are ${searchQuery}'s biggest challenges?`
      ]

      setResults(mockResults)
      setCompanyProfile(mockProfile)
      setCitations(mockCitations)
      setFollowUpQuestions(mockFollowUps)

      // Final step completion for autonomous mode
      if (autonomousMode || isDeepResearch) {
        setResearchProgress(prev => prev.map(step =>
          step.step === 5 ? { ...step, status: 'completed' } : step
        ))
      }

    } catch (error) {
      console.error('Research failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const saveResearch = (result: ResearchResult) => {
    setSavedResearch(prev => [
      {
        ...result,
        saved_at: new Date().toISOString(),
        tags: ['research', 'prospect']
      },
      ...prev
    ])
  }

  const exportProfile = () => {
    if (companyProfile) {
      const data = JSON.stringify(companyProfile, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${companyProfile.company_name}-profile.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">RevFly Research</h1>
            {autonomousMode && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center">
                <Cpu className="h-3 w-3 mr-1" />
                Autonomous
              </span>
            )}
          </div>

          {/* Search Focus Tabs (Perplexity-style) */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'general', label: 'General', icon: Globe },
              { id: 'academic', label: 'Academic', icon: FileText },
              { id: 'news', label: 'News', icon: MessageCircle },
              { id: 'social', label: 'Social', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSearchFocus(id as any)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  searchFocus === id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Research any company or topic with ${searchFocus} focus...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && query && performResearch(query)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Research Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsDeepResearch(!isDeepResearch)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDeepResearch
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Deep Research</span>
            </button>
            <button
              onClick={() => setAutonomousMode(!autonomousMode)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                autonomousMode
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Autonomous</span>
            </button>
          </div>

          <button
            onClick={() => query && performResearch(query)}
            disabled={isSearching || !query}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              isDeepResearch || autonomousMode
                ? 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
            } text-white`}
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {autonomousMode ? 'Autonomous Research...' :
                   isDeepResearch ? 'Deep Research...' : 'Researching...'}
                </span>
              </>
            ) : (
              <>
                {autonomousMode ? <Cpu className="h-4 w-4" /> :
                 isDeepResearch ? <BarChart3 className="h-4 w-4" /> :
                 <Zap className="h-4 w-4" />}
                <span>
                  {autonomousMode ? 'Autonomous Research' :
                   isDeepResearch ? 'Deep Research' : 'Research'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Enhanced Sidebar */}
        <div className="w-80 bg-white border-r p-4 overflow-y-auto">
          {/* Research Spaces (Perplexity-style) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Research Spaces
              </h3>
              <button
                onClick={() => {
                  const spaceName = prompt('Space name:')
                  if (spaceName) {
                    setResearchSpaces(prev => [...prev, {
                      id: spaceName.toLowerCase().replace(/\s+/g, '-'),
                      name: spaceName,
                      count: 0
                    }])
                  }
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {researchSpaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => setActiveSpace(space.id)}
                  className={`w-full text-left text-sm p-2 rounded flex items-center justify-between transition-colors ${
                    activeSpace === space.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{space.name}</span>
                  <span className="text-xs opacity-60">{space.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Focus Status */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Search Focus
            </h3>
            <div className={`p-3 rounded-lg border-2 ${
              searchFocus === 'academic' ? 'border-blue-200 bg-blue-50' :
              searchFocus === 'news' ? 'border-green-200 bg-green-50' :
              searchFocus === 'social' ? 'border-purple-200 bg-purple-50' :
              'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {searchFocus === 'academic' && <FileText className="h-4 w-4 text-blue-600" />}
                {searchFocus === 'news' && <MessageCircle className="h-4 w-4 text-green-600" />}
                {searchFocus === 'social' && <Target className="h-4 w-4 text-purple-600" />}
                {searchFocus === 'general' && <Globe className="h-4 w-4 text-gray-600" />}
                <span className="font-medium text-sm capitalize">{searchFocus} Search</span>
              </div>
              <p className="text-xs text-gray-600">
                {searchFocus === 'academic' && 'Prioritizing peer-reviewed sources and scholarly articles'}
                {searchFocus === 'news' && 'Focusing on recent news coverage and press releases'}
                {searchFocus === 'social' && 'Including social media and community discussions'}
                {searchFocus === 'general' && 'Comprehensive web search across all sources'}
              </p>
            </div>
          </div>

          {/* Research Mode Status */}
          {(isDeepResearch || autonomousMode) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Cpu className="h-4 w-4 mr-2" />
                Research Mode
              </h3>
              <div className="space-y-2">
                {isDeepResearch && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm text-purple-700">Deep Research</span>
                    </div>
                    <p className="text-xs text-purple-600">Performing comprehensive multi-source analysis</p>
                  </div>
                )}
                {autonomousMode && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <Cpu className="h-4 w-4 text-purple-600" />
                      <span className="font-medium text-sm text-purple-700">Autonomous Mode</span>
                    </div>
                    <p className="text-xs text-purple-600">AI agent conducting independent research</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Search History */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Recent Searches
            </h3>
            <div className="space-y-1">
              {searchHistory.map((search, index) => (
                <button
                  key={index}
                  onClick={() => performResearch(search)}
                  className="w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded truncate"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Research */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Research ({savedResearch.length})
            </h3>
            <div className="space-y-2">
              {savedResearch.slice(0, 5).map((research, index) => (
                <div key={index} className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  <div className="font-medium truncate">{research.title}</div>
                  <div className="text-gray-400">
                    {new Date(research.saved_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {!results.length && !isSearching && (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">
                  AI-Powered Business Research
                </h2>
                <p className="text-gray-500 max-w-md mb-6">
                  Search for any company or topic to get comprehensive intelligence including
                  technology stack, financials, contacts, and competitive analysis.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">🔍 Deep Research</h4>
                    <p className="text-sm text-gray-600">Comprehensive multi-source analysis like Perplexity</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">🤖 Autonomous Mode</h4>
                    <p className="text-sm text-gray-600">AI agent conducts research independently like Manus</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">📚 Focus Modes</h4>
                    <p className="text-sm text-gray-600">Academic, news, social, or general research</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">📋 Research Spaces</h4>
                    <p className="text-sm text-gray-600">Organize research by project or topic</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto">
                {autonomousMode || isDeepResearch ? (
                  // Autonomous/Deep Research Progress (Manus-style)
                  <div className="w-full">
                    <div className="mb-6">
                      {autonomousMode ? (
                        <Cpu className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      ) : (
                        <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        {autonomousMode ? 'Autonomous AI Research in Progress...' : 'Deep Research Analysis...'}
                      </h3>
                      <p className="text-gray-500">
                        {autonomousMode
                          ? 'AI agent independently analyzing multiple sources'
                          : 'Performing comprehensive multi-source research'
                        }
                      </p>
                    </div>

                    {/* Research Progress Steps */}
                    <div className="space-y-3">
                      {researchProgress.map((step) => (
                        <div key={step.step} className="flex items-center space-x-3 text-left">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            step.status === 'completed' ? 'bg-green-100 text-green-800' :
                            step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {step.status === 'completed' ? '✓' :
                             step.status === 'in_progress' ? (
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                             ) : step.step}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${
                              step.status === 'completed' ? 'text-green-700' :
                              step.status === 'in_progress' ? 'text-blue-700' :
                              'text-gray-500'
                            }`}>
                              {step.action}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Standard Research Loading
                  <div>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      AI Research in Progress...
                    </h3>
                    <p className="text-gray-500">
                      Analyzing web data, financial records, and business intelligence
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-6">
              {/* Company Profile Summary */}
              {companyProfile && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {companyProfile.company_name}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{companyProfile.industry}</span>
                        <span>•</span>
                        <span>{companyProfile.employees} employees</span>
                        <span>•</span>
                        <span>{companyProfile.revenue}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={exportProfile}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                      </button>
                      <a
                        href={companyProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Visit</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Tech Stack</h4>
                      <div className="space-y-1">
                        {companyProfile.tech_stack.map((tech, i) => (
                          <span key={i} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Pain Points</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {companyProfile.pain_points.map((pain, i) => (
                          <li key={i}>• {pain}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Recent News</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {companyProfile.recent_news.map((news, i) => (
                          <li key={i}>• {news}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Key Contacts</h4>
                      <div className="space-y-2">
                        {companyProfile.contact_info.map((contact, i) => (
                          <div key={i} className="text-sm">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-gray-600">{contact.title}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-up Questions (Perplexity-style) */}
              {followUpQuestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up Questions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => performResearch(question)}
                        className="text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        <span className="text-blue-700 text-sm font-medium">{question}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Research Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Research Results</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {results.length} results • {searchFocus} focus
                    </span>
                    {(autonomousMode || isDeepResearch) && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                        {autonomousMode ? 'Autonomous' : 'Deep Research'}
                      </span>
                    )}
                  </div>
                </div>

                {results.map((result, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                            {result.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.type === 'academic' ? 'bg-blue-100 text-blue-700' :
                            result.type === 'news' ? 'bg-green-100 text-green-700' :
                            result.type === 'social' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                          <span>{result.source}</span>
                          <span>•</span>
                          <span>Relevance: {result.relevance_score}%</span>
                          <span>•</span>
                          <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => saveResearch(result)}
                        className="ml-4 p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Bookmark className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="text-gray-700 mb-3">{result.snippet}</p>

                    {/* Citations Display (Perplexity-style) */}
                    {result.citations && result.citations.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600 mr-2">Sources:</span>
                        {result.citations.map((citationId) => {
                          const citation = citations.find(c => c.id === citationId)
                          return citation ? (
                            <a
                              key={citationId}
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 mr-1"
                              title={citation.title}
                            >
                              {citationId}
                            </a>
                          ) : null
                        })}
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Globe className="h-4 w-4" />
                        <span>View Source</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Citations Section (Perplexity-style) */}
              {citations.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Citations</h3>
                  <div className="space-y-3">
                    {citations.map((citation) => (
                      <div key={citation.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center justify-center">
                          {citation.id}
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm truncate block"
                          >
                            {citation.title}
                          </a>
                          <p className="text-xs text-gray-500 mt-1">
                            Accessed: {new Date(citation.accessed).toLocaleDateString()}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
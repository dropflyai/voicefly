"use client"

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenResearch: (query: string, mode: string) => void
  context?: {
    page: string
    entityType?: string
    entityName?: string
    entityId?: string
  }
}

type CommandAction = {
  id: string
  name: string
  description: string
  icon: any
  action: () => void
  keywords: string[]
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenResearch,
  context
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    // Load recent searches
    const saved = localStorage.getItem('recent_research')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }

    // Keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        // Parent component handles open/close
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleResearch = (researchQuery: string, mode: string = 'quick') => {
    // Save to recent
    const updated = [researchQuery, ...recentSearches.filter(q => q !== researchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent_research', JSON.stringify(updated))

    onOpenResearch(researchQuery, mode)
    onClose()
  }

  // Context-aware suggestions
  const getContextSuggestions = () => {
    if (!context) return []

    const suggestions = []

    if (context.entityType === 'lead' || context.entityType === 'prospect') {
      suggestions.push({
        id: 'research-prospect',
        name: `Research ${context.entityName}`,
        description: 'Get prospect intelligence, pain points, and buying signals',
        icon: UserGroupIcon,
        action: () => handleResearch(`Research ${context.entityName} business pain points and buying signals`, 'prospect'),
        keywords: ['prospect', 'lead', 'research', 'intel']
      })
      suggestions.push({
        id: 'competitor-analysis',
        name: 'Competitor Analysis',
        description: 'What competitors does this prospect use?',
        icon: BuildingOfficeIcon,
        action: () => handleResearch(`What competitors does ${context.entityName} currently use for scheduling?`, 'competitor'),
        keywords: ['competitor', 'analysis', 'compare']
      })
    }

    if (context.page === 'marketing' || context.page === 'campaigns') {
      suggestions.push({
        id: 'pain-points',
        name: 'Research Pain Points',
        description: 'Top pain points for your target audience',
        icon: ChartBarIcon,
        action: () => handleResearch('Top pain points for medical practices with appointment scheduling', 'market'),
        keywords: ['pain', 'points', 'audience', 'target']
      })
    }

    if (context.page === 'appointments' || context.page === 'demo') {
      suggestions.push({
        id: 'talking-points',
        name: 'Get Demo Talking Points',
        description: 'Research-based talking points for this demo',
        icon: DocumentTextIcon,
        action: () => handleResearch(`Demo talking points for ${context.entityName}`, 'prospect'),
        keywords: ['demo', 'talking', 'points', 'prep']
      })
    }

    return suggestions
  }

  const quickActions: CommandAction[] = [
    {
      id: 'deep-research',
      name: 'Deep Research',
      description: 'Comprehensive 2-4 min analysis',
      icon: SparklesIcon,
      action: () => handleResearch(query, 'deep'),
      keywords: ['deep', 'comprehensive', 'detailed']
    },
    {
      id: 'quick-answer',
      name: 'Quick Answer',
      description: '30 second response',
      icon: MagnifyingGlassIcon,
      action: () => handleResearch(query, 'quick'),
      keywords: ['quick', 'fast', 'answer']
    },
    {
      id: 'prospect-intel',
      name: 'Prospect Intelligence',
      description: 'Business profiling & buying signals',
      icon: UserGroupIcon,
      action: () => handleResearch(query, 'prospect'),
      keywords: ['prospect', 'lead', 'intel', 'profile']
    },
    {
      id: 'competitor',
      name: 'Competitor Analysis',
      description: 'Features, pricing, positioning',
      icon: BuildingOfficeIcon,
      action: () => handleResearch(query, 'competitor'),
      keywords: ['competitor', 'competitive', 'compare']
    },
    {
      id: 'market',
      name: 'Market Research',
      description: 'TAM/SAM, trends, opportunities',
      icon: ChartBarIcon,
      action: () => handleResearch(query, 'market'),
      keywords: ['market', 'tam', 'trends', 'size']
    }
  ]

  const contextSuggestions = getContextSuggestions()
  const filteredActions = query
    ? quickActions.filter(action =>
        action.keywords.some(keyword => keyword.includes(query.toLowerCase())) ||
        action.name.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions

  return (
    <Transition.Root show={isOpen} as={Fragment} afterLeave={() => setQuery('')}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
              {/* Search Input */}
              <div className="relative">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                  placeholder="Research anything... (or select mode below)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      handleResearch(query, 'quick')
                    }
                  }}
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Context-Aware Suggestions */}
              {contextSuggestions.length > 0 && !query && (
                <div className="py-2 px-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    Smart Suggestions
                  </div>
                  <ul className="space-y-1">
                    {contextSuggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          onClick={suggestion.action}
                          className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <suggestion.icon className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-purple-600" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{suggestion.name}</div>
                            <div className="text-xs text-gray-500 group-hover:text-purple-600">
                              {suggestion.description}
                            </div>
                          </div>
                          <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Research Modes */}
              {!query && (
                <div className="py-2 px-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    Research Modes
                  </div>
                  <ul className="space-y-1">
                    {quickActions.map((action) => (
                      <li key={action.id}>
                        <button
                          onClick={action.action}
                          disabled={!query.trim()}
                          className={`group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                            query.trim()
                              ? 'hover:bg-purple-50 hover:text-purple-700'
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <action.icon className={`h-5 w-5 flex-shrink-0 ${
                            query.trim() ? 'text-gray-400 group-hover:text-purple-600' : 'text-gray-300'
                          }`} />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{action.name}</div>
                            <div className={`text-xs ${
                              query.trim() ? 'text-gray-500 group-hover:text-purple-600' : 'text-gray-400'
                            }`}>
                              {action.description}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Filtered Results */}
              {query && filteredActions.length > 0 && (
                <div className="py-2 px-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                    Research with...
                  </div>
                  <ul className="space-y-1">
                    {filteredActions.map((action) => (
                      <li key={action.id}>
                        <button
                          onClick={action.action}
                          className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <action.icon className="h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-purple-600" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{action.name}</div>
                            <div className="text-xs text-gray-500 group-hover:text-purple-600">
                              "{query}" - {action.description}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && !query && (
                <div className="py-2 px-2">
                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 flex items-center gap-2">
                    <ClockIcon className="h-3.5 w-3.5" />
                    Recent Searches
                  </div>
                  <ul className="space-y-1">
                    {recentSearches.slice(0, 3).map((search, idx) => (
                      <li key={idx}>
                        <button
                          onClick={() => {
                            setQuery(search)
                            handleResearch(search, 'quick')
                          }}
                          className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                          <span className="flex-1 text-left text-gray-700 truncate">{search}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer */}
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 flex items-center justify-between">
                <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">⌘K</kbd> to open</span>
                <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Enter</kbd> to research</span>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

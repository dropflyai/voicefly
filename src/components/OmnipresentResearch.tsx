"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import CommandPalette from './CommandPalette'
import ResearchPanel from './ResearchPanel'
import { usePathname } from 'next/navigation'

interface ResearchContextType {
  openResearch: (query?: string, mode?: string) => void
  openCommandPalette: () => void
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined)

export function useResearch() {
  const context = useContext(ResearchContext)
  if (!context) {
    throw new Error('useResearch must be used within OmnipresentResearchProvider')
  }
  return context
}

interface OmnipresentResearchProviderProps {
  children: ReactNode
}

export default function OmnipresentResearchProvider({ children }: OmnipresentResearchProviderProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [researchPanelOpen, setResearchPanelOpen] = useState(false)
  const [researchQuery, setResearchQuery] = useState('')
  const [researchMode, setResearchMode] = useState('quick')
  const [context, setContext] = useState<any>({})

  const pathname = usePathname()

  // Detect context from current page
  useEffect(() => {
    const pathParts = pathname?.split('/') || []
    const page = pathParts[pathParts.length - 1] || 'dashboard'

    // Extract entity type and ID if available
    let entityType, entityId, entityName

    if (pathname?.includes('/leads/')) {
      entityType = 'lead'
      entityId = pathParts[pathParts.length - 1]
      // In production, fetch entity name from database
      entityName = 'Lead #' + entityId
    } else if (pathname?.includes('/customers/')) {
      entityType = 'prospect'
      entityId = pathParts[pathParts.length - 1]
      entityName = 'Customer #' + entityId
    } else if (pathname?.includes('/appointments/')) {
      entityType = 'appointment'
      entityId = pathParts[pathParts.length - 1]
      entityName = 'Appointment #' + entityId
    }

    setContext({
      page,
      entityType,
      entityId,
      entityName,
      pathname
    })
  }, [pathname])

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openResearch = (query?: string, mode: string = 'quick') => {
    if (query) {
      setResearchQuery(query)
      setResearchMode(mode)
      setResearchPanelOpen(true)
      setCommandPaletteOpen(false)
    }
  }

  const openCommandPalette = () => {
    setCommandPaletteOpen(true)
  }

  return (
    <ResearchContext.Provider value={{ openResearch, openCommandPalette }}>
      {children}

      {/* Floating Research Button (Toolbar) */}
      <button
        onClick={openCommandPalette}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all hover:scale-105 group"
        title="Research (⌘K)"
      >
        <SparklesIcon className="h-5 w-5" />
        <span className="font-medium">Research</span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-purple-700 rounded group-hover:bg-purple-800">
          ⌘K
        </kbd>
      </button>

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenResearch={openResearch}
        context={context}
      />

      {/* Research Panel */}
      <ResearchPanel
        isOpen={researchPanelOpen}
        onClose={() => setResearchPanelOpen(false)}
        query={researchQuery}
        mode={researchMode}
        context={context}
      />
    </ResearchContext.Provider>
  )
}

// Export toolbar button component for custom placement
export function ResearchToolbarButton() {
  const { openCommandPalette } = useResearch()

  return (
    <button
      onClick={openCommandPalette}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
      title="Research (⌘K)"
    >
      <SparklesIcon className="h-5 w-5" />
      <span>Research</span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
        ⌘K
      </kbd>
    </button>
  )
}

// Export context button for page-specific placement
export function ContextualResearchButton({ query, mode = 'prospect', label }: { query: string; mode?: string; label: string }) {
  const { openResearch } = useResearch()

  return (
    <button
      onClick={() => openResearch(query, mode)}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
    >
      <SparklesIcon className="h-4 w-4" />
      {label}
    </button>
  )
}

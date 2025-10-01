"use client"

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  BookmarkIcon,
  PaperAirplaneIcon,
  DocumentPlusIcon,
  SpeakerWaveIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface ResearchPanelProps {
  isOpen: boolean
  onClose: () => void
  query: string
  mode: string
  context?: {
    page: string
    entityType?: string
    entityName?: string
    entityId?: string
  }
}

interface SmartAction {
  id: string
  label: string
  icon: any
  description: string
  action: (content: string) => void
  available: boolean
}

export default function ResearchPanel({
  isOpen,
  onClose,
  query,
  mode,
  context
}: ResearchPanelProps) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'searching' | 'complete'>('idle')
  const [copiedAction, setCopiedAction] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && query) {
      performResearch()
    }
  }, [isOpen, query])

  const performResearch = async () => {
    setStatus('searching')
    setContent('')

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setContent(prev => prev + chunk)
      }

      setStatus('complete')
    } catch (error) {
      console.error('Research failed:', error)
      setContent('Research failed. Please try again.')
      setStatus('complete')
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content)
    setCopiedAction('clipboard')
    setTimeout(() => setCopiedAction(null), 2000)
  }

  const getSmartActions = (): SmartAction[] => {
    const actions: SmartAction[] = []

    // Copy to Lead/Prospect Notes
    if (context?.entityType === 'lead' || context?.entityType === 'prospect') {
      actions.push({
        id: 'copy-to-notes',
        label: 'Add to Notes',
        icon: DocumentPlusIcon,
        description: `Add research to ${context.entityName} notes`,
        action: (content) => {
          // In production, save to database
          console.log('Saving to notes:', context.entityId, content)
          setCopiedAction('notes')
          setTimeout(() => setCopiedAction(null), 2000)
        },
        available: true
      })
    }

    // Create Email Campaign
    if (context?.page === 'marketing' || context?.page === 'campaigns' || mode === 'prospect' || mode === 'market') {
      actions.push({
        id: 'create-email-campaign',
        label: 'Create Email Campaign',
        icon: PaperAirplaneIcon,
        description: 'Use insights to create email campaign',
        action: (content) => {
          // Extract key insights and create campaign
          const insights = extractInsights(content)
          console.log('Creating email campaign:', insights)
          setCopiedAction('email')
          setTimeout(() => {
            // Navigate to campaign editor with pre-filled data
            window.location.href = `/dashboard/marketing/campaigns/new?insights=${encodeURIComponent(JSON.stringify(insights))}`
          }, 1000)
        },
        available: true
      })
    }

    // Create Voice Campaign (VAPI script)
    if (mode === 'prospect' || mode === 'competitor') {
      actions.push({
        id: 'create-voice-script',
        label: 'Generate Voice Script',
        icon: SpeakerWaveIcon,
        description: 'Create VAPI call script from insights',
        action: (content) => {
          const script = generateVoiceScript(content, context)
          console.log('Voice script:', script)
          setCopiedAction('voice')
          setTimeout(() => setCopiedAction(null), 2000)
        },
        available: true
      })
    }

    // Save as Template
    actions.push({
      id: 'save-template',
      label: 'Save as Template',
      icon: BookmarkIcon,
      description: 'Save research for future use',
      action: (content) => {
        const templates = JSON.parse(localStorage.getItem('research_templates') || '[]')
        templates.push({
          query,
          mode,
          content: content.slice(0, 500),
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('research_templates', JSON.stringify(templates))
        setCopiedAction('template')
        setTimeout(() => setCopiedAction(null), 2000)
      },
      available: true
    })

    // Copy to Clipboard
    actions.push({
      id: 'copy',
      label: 'Copy to Clipboard',
      icon: ClipboardDocumentIcon,
      description: 'Copy full research',
      action: copyToClipboard,
      available: true
    })

    return actions
  }

  const extractInsights = (content: string) => {
    // Extract key points from research
    const lines = content.split('\n')
    const insights = []

    for (const line of lines) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('✓')) {
        insights.push(line.replace(/^[•\-✓]\s*/, '').trim())
      }
    }

    return {
      query,
      insights: insights.slice(0, 5),
      fullContent: content
    }
  }

  const generateVoiceScript = (content: string, context: any) => {
    // Generate VAPI-friendly voice script
    const insights = extractInsights(content)

    return {
      greeting: `Hi, this is Maya from VoiceFly calling for ${context?.entityName}.`,
      value_prop: `We help ${context?.entityType}s like yours ${insights.insights[0] || 'improve efficiency'}.`,
      qualifying_questions: [
        'How many calls does your team handle daily?',
        'What percentage would you say go to voicemail?',
        'Have you considered AI automation for appointment booking?'
      ],
      objection_handling: insights.insights.slice(1, 3),
      closing: 'Would you be open to a quick 5-minute demo to see how this works?'
    }
  }

  const smartActions = getSmartActions()

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-purple-600 px-6 py-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Dialog.Title className="text-lg font-semibold text-white">
                            AI Research
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-purple-100 truncate">
                            {query}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="ml-3 text-purple-100 hover:text-white"
                          onClick={onClose}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>

                      {/* Status */}
                      {status === 'searching' && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-purple-100">
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          <span>Researching...</span>
                        </div>
                      )}
                    </div>

                    {/* Research Content */}
                    <div className="flex-1 px-6 py-6">
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: content
                            .replace(/^# (.*)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                            .replace(/^## (.*)/gm, '<h2 class="text-xl font-semibold mt-5 mb-3">$2</h2>')
                            .replace(/^### (.*)/gm, '<h3 class="text-lg font-medium mt-4 mb-2">$3</h3>')
                            .replace(/^\*\*(.*)\*\*/gm, '<strong>$1</strong>')
                            .replace(/^• (.*)/gm, '<li class="ml-4">$1</li>')
                            .replace(/^✓ (.*)/gm, '<li class="ml-4 text-green-600">✓ $1</li>')
                        }}
                      />
                    </div>

                    {/* Smart Actions Footer */}
                    {status === 'complete' && (
                      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="text-sm font-semibold text-gray-700 mb-3">
                          Smart Actions
                        </div>
                        <div className="space-y-2">
                          {smartActions.map((action) => (
                            <button
                              key={action.id}
                              onClick={() => action.action(content)}
                              disabled={!action.available}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                                copiedAction === action.id.replace('copy-to-', '').replace('create-', '').replace('-campaign', '').replace('-script', '')
                                  ? 'bg-green-50 border-green-300 text-green-700'
                                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              {copiedAction === action.id.replace('copy-to-', '').replace('create-', '').replace('-campaign', '').replace('-script', '') ? (
                                <CheckIcon className="h-5 w-5 text-green-600" />
                              ) : (
                                <action.icon className="h-5 w-5 text-gray-400" />
                              )}
                              <div className="flex-1 text-left">
                                <div className="font-medium text-sm">{action.label}</div>
                                <div className="text-xs text-gray-500">{action.description}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

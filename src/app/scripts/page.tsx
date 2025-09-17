"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Pause, MessageSquare, Settings } from 'lucide-react'

interface Script {
  id: string
  name: string
  description: string
  content: string
  category: 'greeting' | 'qualification' | 'objection' | 'closing'
  isActive: boolean
  lastModified: string
  usageCount: number
}

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    // Load demo scripts
    const demoScripts: Script[] = [
      {
        id: '1',
        name: 'Warm Greeting',
        description: 'Friendly opening script for initial contact',
        content: 'Hi there! Thanks for your interest in our services. I\'m Maya, your AI assistant. How can I help you today?',
        category: 'greeting',
        isActive: true,
        lastModified: '2024-03-15',
        usageCount: 1247
      },
      {
        id: '2',
        name: 'Lead Qualification',
        description: 'Standard questions to qualify potential leads',
        content: 'To better assist you, may I ask what specific services you\'re interested in and what\'s your timeline for getting started?',
        category: 'qualification',
        isActive: true,
        lastModified: '2024-03-14',
        usageCount: 892
      },
      {
        id: '3',
        name: 'Price Objection Handler',
        description: 'Response to pricing concerns',
        content: 'I understand budget is important. Let me share how our service typically pays for itself within the first month through increased efficiency...',
        category: 'objection',
        isActive: true,
        lastModified: '2024-03-13',
        usageCount: 456
      },
      {
        id: '4',
        name: 'Appointment Closing',
        description: 'Script to schedule a consultation',
        content: 'Based on what you\'ve shared, I think a quick 15-minute consultation would be perfect. Are you available this week for a brief call?',
        category: 'closing',
        isActive: true,
        lastModified: '2024-03-12',
        usageCount: 623
      }
    ]
    setScripts(demoScripts)
  }, [])

  const filteredScripts = scripts.filter(script => 
    filter === 'all' || script.category === filter
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greeting': return 'bg-blue-100 text-blue-800'
      case 'qualification': return 'bg-green-100 text-green-800'
      case 'objection': return 'bg-yellow-100 text-yellow-800'
      case 'closing': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Scripts</h1>
          <p className="text-gray-600">Manage conversation scripts for your voice AI assistant</p>
        </div>

        {/* Header Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Scripts
              </button>
              <button
                onClick={() => setFilter('greeting')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'greeting' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Greetings
              </button>
              <button
                onClick={() => setFilter('qualification')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'qualification' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Qualification
              </button>
              <button
                onClick={() => setFilter('objection')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'objection' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Objections
              </button>
              <button
                onClick={() => setFilter('closing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'closing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Closing
              </button>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Script
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scripts List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Scripts Library</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredScripts.map((script) => (
                <div 
                  key={script.id} 
                  className={`p-6 cursor-pointer hover:bg-gray-50 ${
                    selectedScript?.id === script.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedScript(script)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{script.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(script.category)}`}>
                          {script.category}
                        </span>
                        {script.isActive && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{script.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>Used {script.usageCount} times</span>
                        <span>Modified {script.lastModified}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Script Preview/Editor */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedScript ? (isEditing ? 'Edit Script' : 'Script Preview') : 'Select a Script'}
                </h3>
                {selectedScript && (
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      Test
                    </button>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg flex items-center gap-1"
                    >
                      {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {selectedScript ? (
                <div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Script Name</label>
                        <input 
                          type="text" 
                          defaultValue={selectedScript.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input 
                          type="text" 
                          defaultValue={selectedScript.description}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                        <textarea 
                          rows={8}
                          defaultValue={selectedScript.content}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-2">{selectedScript.name}</h4>
                        <p className="text-sm text-gray-500 mb-4">{selectedScript.description}</p>
                        <div className="flex items-center gap-2 mb-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(selectedScript.category)}`}>
                            {selectedScript.category}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">Used {selectedScript.usageCount} times</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">{selectedScript.content}</p>
                      </div>
                      <div className="mt-6 flex gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Test Script
                        </button>
                        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Preview in Chat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-sm font-medium text-gray-900">No script selected</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Choose a script from the list to view or edit its content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
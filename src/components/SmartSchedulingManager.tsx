'use client'

import { useState, useEffect } from 'react'
import { 
  ClockIcon, 
  CogIcon, 
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { SmartSchedulingEngine, SchedulingRule, DEFAULT_SCHEDULING_RULES } from '../lib/smart-scheduling'
import { useFeatureFlags } from '../lib/feature-flags'

interface SmartSchedulingManagerProps {
  businessId: string
  onRuleUpdate?: () => void
}

export default function SmartSchedulingManager({ 
  businessId, 
  onRuleUpdate 
}: SmartSchedulingManagerProps) {
  const featureFlags = useFeatureFlags() // Smart scheduling requires Professional+
  const [schedulingEngine, setSchedulingEngine] = useState<SmartSchedulingEngine | null>(null)
  const [rules, setRules] = useState<SchedulingRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddRule, setShowAddRule] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  // Check if user has access to smart scheduling - use multiCalendar as proxy for advanced scheduling
  const hasSmartScheduling = featureFlags.multiCalendar

  useEffect(() => {
    if (hasSmartScheduling) {
      initializeEngine()
    }
  }, [businessId, hasSmartScheduling])

  const initializeEngine = async () => {
    try {
      const engine = new SmartSchedulingEngine(businessId)
      await engine.loadConstraints()
      setSchedulingEngine(engine)
      
      // Load existing rules (would come from database)
      // For now, use default rules
      setRules(DEFAULT_SCHEDULING_RULES.map((rule, index) => ({
        ...rule,
        id: `rule-${index}`,
        business_id: businessId
      })))
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to initialize scheduling engine:', error)
      setIsLoading(false)
    }
  }

  const testScheduling = async () => {
    if (!schedulingEngine) return

    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const testDate = tomorrow.toISOString().split('T')[0]

      // Test finding available slots
      const slots = await schedulingEngine.findAvailableSlots(
        'test-service-id', // Would be actual service ID
        testDate
      )

      setTestResults({
        date: testDate,
        slotsFound: slots.length,
        slots: slots.slice(0, 5) // Show first 5
      })
    } catch (error) {
      console.error('Scheduling test failed:', error)
      setTestResults({ error: 'Test failed' })
    }
  }

  const toggleRule = async (ruleId: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, is_active: !rule.is_active }
          : rule
      )
    )
    onRuleUpdate?.()
  }

  const deleteRule = async (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
    onRuleUpdate?.()
  }

  if (!hasSmartScheduling) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Smart Scheduling</h3>
          <p className="text-gray-500 mb-4">
            Upgrade to Professional or higher to access intelligent scheduling rules
          </p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
            Upgrade Plan
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Smart Scheduling Rules</h2>
              <p className="text-gray-600">Automate appointment scheduling with intelligent rules</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={testScheduling}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Test Scheduling
            </button>
            <button
              onClick={() => setShowAddRule(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Rule
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Scheduling Test Results</h4>
            {testResults.error ? (
              <p className="text-red-600">{testResults.error}</p>
            ) : (
              <div>
                <p className="text-blue-700">
                  Found <strong>{testResults.slotsFound}</strong> available slots for {testResults.date}
                </p>
                {testResults.slots.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-blue-600 mb-1">Sample slots:</p>
                    <div className="flex flex-wrap gap-2">
                      {testResults.slots.map((slot: any, index: number) => (
                        <span key={index} className="bg-white text-blue-700 px-2 py-1 rounded text-sm">
                          {slot.time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduling Rules */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Rules</h3>
          <p className="text-gray-500 mt-1">Configure how appointments are automatically scheduled</p>
        </div>

        <div className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <div key={rule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className={`mt-1 ${rule.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                    {rule.is_active ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <XCircleIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {getRuleDescription(rule)}
                    </p>
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {rule.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span>Priority: {rule.priority}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      rule.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {rules.filter(r => r.is_active).length}
              </p>
              <p className="text-gray-600">Active Rules</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {schedulingEngine ? '✓' : '✗'}
              </p>
              <p className="text-gray-600">Engine Status</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">Auto</p>
              <p className="text-gray-600">Scheduling Mode</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to generate rule descriptions
function getRuleDescription(rule: SchedulingRule): string {
  switch (rule.type) {
    case 'buffer_time':
      const before = rule.actions.buffer_minutes_before || 0
      const after = rule.actions.buffer_minutes_after || 0
      return `Adds ${before} min buffer before and ${after} min after appointments`
    
    case 'time_block':
      if (rule.conditions.time_ranges) {
        const range = rule.conditions.time_ranges[0]
        return `Blocks appointments between ${range.start} - ${range.end}`
      }
      return 'Blocks specific time periods'
    
    case 'service_constraint':
      return 'Applies special constraints for specific services'
    
    case 'staff_preference':
      return 'Considers staff availability and preferences'
    
    case 'capacity_limit':
      return 'Limits concurrent appointments based on capacity'
    
    default:
      return 'Custom scheduling rule'
  }
}
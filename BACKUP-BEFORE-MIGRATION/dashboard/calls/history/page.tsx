"use client"

import { useState, useEffect } from 'react'
import { Phone, Clock, User, TrendingUp, TrendingDown, Search, Filter, Download } from 'lucide-react'

interface CallRecord {
  id: string
  callerName: string
  callerPhone: string
  duration: string
  timestamp: string
  outcome: 'qualified' | 'not-interested' | 'callback' | 'voicemail'
  agent: string
  sentiment: 'positive' | 'neutral' | 'negative'
  recording?: string
}

export default function CallHistoryPage() {
  const [callHistory, setCallHistory] = useState<CallRecord[]>([])
  const [filteredCalls, setFilteredCalls] = useState<CallRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOutcome, setFilterOutcome] = useState<string>('all')
  const [filterSentiment, setFilterSentiment] = useState<string>('all')

  useEffect(() => {
    // Generate demo call history data
    const demoData: CallRecord[] = [
      {
        id: '1',
        callerName: 'Sarah Johnson',
        callerPhone: '+1 (555) 123-4567',
        duration: '4:32',
        timestamp: '2024-03-15 10:30 AM',
        outcome: 'qualified',
        agent: 'Maya AI',
        sentiment: 'positive'
      },
      {
        id: '2',
        callerName: 'Michael Chen',
        callerPhone: '+1 (555) 234-5678',
        duration: '2:15',
        timestamp: '2024-03-15 09:45 AM',
        outcome: 'callback',
        agent: 'Maya AI',
        sentiment: 'neutral'
      },
      {
        id: '3',
        callerName: 'Jennifer Walsh',
        callerPhone: '+1 (555) 345-6789',
        duration: '6:22',
        timestamp: '2024-03-15 09:12 AM',
        outcome: 'qualified',
        agent: 'Maya AI',
        sentiment: 'positive'
      },
      {
        id: '4',
        callerName: 'David Rodriguez',
        callerPhone: '+1 (555) 456-7890',
        duration: '1:48',
        timestamp: '2024-03-15 08:55 AM',
        outcome: 'not-interested',
        agent: 'Maya AI',
        sentiment: 'neutral'
      },
      {
        id: '5',
        callerName: 'Emily Foster',
        callerPhone: '+1 (555) 567-8901',
        duration: '0:35',
        timestamp: '2024-03-15 08:30 AM',
        outcome: 'voicemail',
        agent: 'Maya AI',
        sentiment: 'neutral'
      }
    ]
    setCallHistory(demoData)
    setFilteredCalls(demoData)
  }, [])

  useEffect(() => {
    let filtered = callHistory.filter(call => {
      const matchesSearch = call.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           call.callerPhone.includes(searchTerm)
      const matchesOutcome = filterOutcome === 'all' || call.outcome === filterOutcome
      const matchesSentiment = filterSentiment === 'all' || call.sentiment === filterSentiment

      return matchesSearch && matchesOutcome && matchesSentiment
    })
    setFilteredCalls(filtered)
  }, [searchTerm, filterOutcome, filterSentiment, callHistory])

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'qualified': return 'text-green-600 bg-green-100'
      case 'callback': return 'text-blue-600 bg-blue-100'
      case 'not-interested': return 'text-red-600 bg-red-100'
      case 'voicemail': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <div className="h-4 w-4 rounded-full bg-gray-400"></div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Call History</h1>
          <p className="text-gray-600">Review all voice AI interactions and call outcomes</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Outcomes</option>
              <option value="qualified">Qualified</option>
              <option value="callback">Callback</option>
              <option value="not-interested">Not Interested</option>
              <option value="voicemail">Voicemail</option>
            </select>

            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{callHistory.length}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Qualified Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {callHistory.filter(call => call.outcome === 'qualified').length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">3:42</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">67%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Call History Table */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Caller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sentiment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{call.callerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.callerPhone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOutcomeColor(call.outcome)}`}>
                        {call.outcome.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getSentimentIcon(call.sentiment)}
                        <span className="ml-2 text-sm text-gray-500 capitalize">{call.sentiment}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {call.agent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCalls.length === 0 && (
            <div className="text-center py-12">
              <Phone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No calls found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
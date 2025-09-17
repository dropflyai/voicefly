"use client"

import { useState, useEffect } from 'react'
import {
  Phone, PhoneCall, Clock, User, MapPin,
  Mic, MicOff, Volume2, VolumeX, Download,
  AlertCircle, CheckCircle, XCircle, Play,
  Pause, SkipForward, Rewind, Heart,
  ThumbsUp, ThumbsDown, MessageSquare, Calendar
} from 'lucide-react'

interface LiveCall {
  id: string
  callerName: string
  callerPhone: string
  callerLocation: string
  duration: string
  status: 'ringing' | 'active' | 'hold' | 'ending'
  sentiment: 'positive' | 'neutral' | 'negative'
  callType: 'inbound' | 'outbound'
  campaign?: string
  agent: string
  startTime: string
  transcript: string[]
  currentPhrase: string
}

export default function LiveCallsPage() {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([])
  const [selectedCall, setSelectedCall] = useState<LiveCall | null>(null)
  const [isListening, setIsListening] = useState(false)

  // Simulate real-time call data
  useEffect(() => {
    const mockCalls: LiveCall[] = [
      {
        id: 'call-001',
        callerName: 'Sarah Johnson',
        callerPhone: '+1 (555) 123-4567',
        callerLocation: 'New York, NY',
        duration: '00:02:45',
        status: 'active',
        sentiment: 'positive',
        callType: 'inbound',
        campaign: 'Enterprise Software Outreach',
        agent: 'VoiceFly AI Agent',
        startTime: '2:15 PM',
        transcript: [
          'AI: Thank you for calling! This is Maya, how can I help you today?',
          'Caller: Hi, I saw your ad about the new software solution.',
          'AI: Great! I\'d be happy to tell you more about our enterprise platform.',
          'Caller: What kind of pricing do you have?'
        ],
        currentPhrase: 'AI: Our pricing starts at $297 per month for the professional tier...'
      },
      {
        id: 'call-002',
        callerName: 'Michael Chen',
        callerPhone: '+1 (555) 987-6543',
        callerLocation: 'San Francisco, CA',
        duration: '00:01:12',
        status: 'active',
        sentiment: 'neutral',
        callType: 'inbound',
        agent: 'VoiceFly AI Agent',
        startTime: '2:18 PM',
        transcript: [
          'AI: Hello! This is Maya, your AI assistant. How may I help you?',
          'Caller: I\'m calling about your healthcare solution.',
          'AI: Wonderful! Are you looking for our medical practice management system?'
        ],
        currentPhrase: 'Caller: Yes, can you tell me about the features?'
      },
      {
        id: 'call-003',
        callerName: 'Jennifer Lopez',
        callerPhone: '+1 (555) 456-7890',
        callerLocation: 'Miami, FL',
        duration: '00:00:33',
        status: 'ringing',
        sentiment: 'neutral',
        callType: 'inbound',
        agent: 'VoiceFly AI Agent',
        startTime: '2:19 PM',
        transcript: [],
        currentPhrase: 'Call connecting...'
      }
    ]
    setLiveCalls(mockCalls)
    setSelectedCall(mockCalls[0])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ringing': return 'text-yellow-600 bg-yellow-100'
      case 'active': return 'text-green-600 bg-green-100'
      case 'hold': return 'text-orange-600 bg-orange-100'
      case 'ending': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-600" />
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-600" />
      default: return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'border-green-200 bg-green-50'
      case 'negative': return 'border-red-200 bg-red-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Calls</h1>
          <p className="mt-1 text-sm text-gray-600">Monitor active voice conversations in real-time</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            {liveCalls.filter(call => call.status === 'active').length} Active Calls
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Calls
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Calls List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Calls</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {liveCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => setSelectedCall(call)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedCall?.id === call.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{call.callerName}</span>
                        {getSentimentIcon(call.sentiment)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {call.callerPhone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status.charAt(0).toUpperCase() + call.status.slice(1)}
                        </span>
                        <span className="text-gray-500">{call.duration}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-gray-500">
                      <span>{call.startTime}</span>
                      <div className="mt-1">
                        {call.callType === 'inbound' ? (
                          <Phone className="h-4 w-4 text-green-600" />
                        ) : (
                          <PhoneCall className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call Details & Live Transcript */}
        <div className="lg:col-span-2">
          {selectedCall ? (
            <div className="space-y-6">
              {/* Call Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedCall.callerName}</h2>
                    <p className="text-gray-600">{selectedCall.callerPhone}</p>
                  </div>
                  <div className="mt-4 sm:mt-0 flex gap-2">
                    <button
                      onClick={() => setIsListening(!isListening)}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                        isListening
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isListening ? 'Mute' : 'Listen'}
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Record
                    </button>
                  </div>
                </div>

                {/* Call Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{selectedCall.duration}</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${
                      selectedCall.sentiment === 'positive' ? 'text-green-600' :
                      selectedCall.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {selectedCall.sentiment.charAt(0).toUpperCase() + selectedCall.sentiment.slice(1)}
                    </div>
                    <div className="text-sm text-gray-600">Sentiment</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{selectedCall.agent}</div>
                    <div className="text-sm text-gray-600">Agent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{selectedCall.callerLocation}</div>
                    <div className="text-sm text-gray-600">Location</div>
                  </div>
                </div>
              </div>

              {/* Live Transcript */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Live Transcript</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live</span>
                  </div>
                </div>
                <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                  {selectedCall.transcript.map((line, index) => {
                    const isAI = line.startsWith('AI:')
                    return (
                      <div
                        key={index}
                        className={`flex ${isAI ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isAI
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="text-xs opacity-75 mb-1">
                            {isAI ? 'AI Agent' : selectedCall.callerName}
                          </div>
                          <div className="text-sm">
                            {line.replace(/^(AI:|Caller:)\s*/, '')}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Current Speaking */}
                  {selectedCall.currentPhrase && (
                    <div className={`flex ${selectedCall.currentPhrase.startsWith('AI:') ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg border-2 border-dashed ${
                          selectedCall.currentPhrase.startsWith('AI:')
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                          Currently speaking...
                        </div>
                        <div className="text-sm text-gray-900">
                          {selectedCall.currentPhrase.replace(/^(AI:|Caller:)\s*/, '')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm hover:bg-green-200 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Mark Qualified
                  </button>
                  <button className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm hover:bg-blue-200 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule Follow-up
                  </button>
                  <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm hover:bg-yellow-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Flag for Review
                  </button>
                  <button className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm hover:bg-red-200 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    End Call
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Call Selected</h3>
              <p className="text-gray-600">Select a call from the list to view live transcript and details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Vapi from '@vapi-ai/web'

interface TranscriptMessage {
  role: 'user' | 'assistant'
  text: string
}

type CallStatus = 'idle' | 'connecting' | 'active' | 'ended' | 'error'

interface VoiceInterviewProps {
  assistantConfig: Record<string, any>
  onCallEnd: (transcript: string) => void
  onError: (error: string) => void
}

const VAPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || ''

export default function VoiceInterview({
  assistantConfig,
  onCallEnd,
  onError,
}: VoiceInterviewProps) {
  const [status, setStatus] = useState<CallStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const vapiRef = useRef<Vapi | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const latestTranscriptRef = useRef<TranscriptMessage[]>([])

  // Keep ref in sync with state for use in callbacks
  useEffect(() => {
    latestTranscriptRef.current = transcript
  }, [transcript])

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        try { vapiRef.current.stop() } catch {}
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startTimer = useCallback(() => {
    setCallDuration(0)
    timerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const buildTranscriptString = useCallback((messages: TranscriptMessage[]): string => {
    return messages
      .map(m => `${m.role === 'user' ? 'User' : 'Interviewer'}: ${m.text}`)
      .join('\n')
  }, [])

  const startCall = useCallback(async () => {
    if (!VAPI_PUBLIC_KEY) {
      setErrorMessage('Voice interviews are not configured. Please use text mode.')
      onError('VAPI public key not configured')
      return
    }

    setStatus('connecting')
    setErrorMessage(null)
    setTranscript([])

    try {
      const vapi = new Vapi(VAPI_PUBLIC_KEY)
      vapiRef.current = vapi

      vapi.on('call-start', () => {
        setStatus('active')
        startTimer()
      })

      vapi.on('call-end', () => {
        setStatus('ended')
        stopTimer()
        const finalTranscript = buildTranscriptString(latestTranscriptRef.current)
        if (finalTranscript.trim()) {
          onCallEnd(finalTranscript)
        }
      })

      vapi.on('message', (message: any) => {
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          const role = message.role === 'user' ? 'user' : 'assistant'
          setTranscript(prev => [...prev, { role, text: message.transcript }])
        }
      })

      vapi.on('speech-start', () => {
        // Could add visual indicator
      })

      vapi.on('error', (error: any) => {
        console.error('VAPI error:', error)
        const msg = error?.message || 'Call error occurred'
        if (msg.includes('microphone') || msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorMessage('Microphone access denied. Please enable microphone permissions and try again.')
        } else {
          setErrorMessage(msg)
        }
        setStatus('error')
        stopTimer()
        onError(msg)
      })

      // Start with inline assistant config (transient)
      await vapi.start(assistantConfig)
    } catch (err: any) {
      console.error('Failed to start call:', err)
      const msg = err?.message || 'Failed to start voice interview'
      setErrorMessage(msg)
      setStatus('error')
      onError(msg)
    }
  }, [assistantConfig, onCallEnd, onError, startTimer, stopTimer, buildTranscriptString])

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      try { vapiRef.current.stop() } catch {}
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMuted = !isMuted
      vapiRef.current.setMuted(newMuted)
      setIsMuted(newMuted)
    }
  }, [isMuted])

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      {status !== 'idle' && status !== 'error' && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              status === 'active' ? 'bg-green-500' :
              'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600">
              {status === 'connecting' ? 'Connecting...' :
               status === 'active' ? 'Interview in progress' :
               'Interview complete'}
            </span>
          </div>
          {(status === 'active' || status === 'ended') && (
            <span className="text-sm text-gray-400 font-mono">{formatTime(callDuration)}</span>
          )}
        </div>
      )}

      {/* Transcript Display */}
      {transcript.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto bg-white">
          <div className="space-y-3">
            {transcript.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <span className="block text-xs font-medium mb-0.5 opacity-60">
                    {msg.role === 'user' ? 'You' : 'Interviewer'}
                  </span>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {status === 'idle' || status === 'error' ? (
          <button
            type="button"
            onClick={startCall}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            <MicIcon />
            Start Interview
          </button>
        ) : status === 'connecting' ? (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-full font-medium">
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Connecting...
          </div>
        ) : status === 'active' ? (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <button
              type="button"
              onClick={endCall}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium"
            >
              <StopIcon />
              End Interview
            </button>
          </>
        ) : null /* ended - no controls, parent handles next step */}
      </div>

      {/* Help Text */}
      {status === 'idle' && (
        <p className="text-center text-xs text-gray-400">
          Click to start a voice conversation. The AI will ask about your business.
        </p>
      )}
      {status === 'active' && (
        <p className="text-center text-xs text-gray-400">
          Speak naturally. End the interview when you feel you've covered everything.
        </p>
      )}
    </div>
  )
}

// ============================================
// INLINE SVG ICONS (to avoid external deps)
// ============================================

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
    </svg>
  )
}

function MicOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18z" />
      <path d="M8.25 4.5a3.75 3.75 0 017.5 0v4.94l-7.5-7.5V4.5z" />
      <path d="M6.75 11.25a.75.75 0 00-1.5 0v1.5a6.751 6.751 0 006 6.709v2.291h-3a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5h-3v-2.291a6.718 6.718 0 003.62-1.474l-1.082-1.082A5.25 5.25 0 016.75 12.75v-1.5z" />
      <path d="M15.75 4.5v7.94l-5.75-5.75V4.5a3.75 3.75 0 017.5 0v8.25c0 .303-.036.599-.104.883l-1.152-1.152c.005-.077.006-.155.006-.231V4.5z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
  )
}

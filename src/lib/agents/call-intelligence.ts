/**
 * Call Intelligence Agent
 *
 * Analyzes voice calls in real-time, extracts insights,
 * qualifies leads, and triggers follow-up actions.
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../supabase-client'
import { CreditSystem } from '../credit-system'
import { ErrorTracker, ErrorCategory, ErrorSeverity } from '../error-tracking'
import AuditLogger, { AuditEventType } from '../audit-logger'
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentInsight,
  AgentAction,
  AgentAlert,
  CallAnalysis,
  CallOutcome,
  CallSentiment,
  AgentCreditCost,
  AgentEvent,
} from './types'
import { mayaPrime } from './maya-prime'

// Agent configuration
const CALL_INTELLIGENCE_CONFIG: AgentConfig = {
  id: 'call-intelligence',
  name: 'Call Intelligence Agent',
  description: 'Analyzes voice calls, extracts insights, and qualifies leads',
  cluster: 'customer',
  enabled: true,
  triggers: [
    { event: AgentEvent.CALL_ENDED },
    { event: AgentEvent.CALL_TRANSFERRED },
  ],
}

// Keywords for sentiment and intent detection
const INTENT_KEYWORDS = {
  appointment: ['book', 'schedule', 'appointment', 'available', 'opening', 'slot', 'when can'],
  pricing: ['price', 'cost', 'how much', 'fee', 'rate', 'charge', 'insurance', 'payment'],
  emergency: ['urgent', 'emergency', 'pain', 'hurting', 'immediately', 'asap', 'today'],
  information: ['question', 'tell me', 'information', 'learn about', 'what is', 'how does'],
  complaint: ['complaint', 'unhappy', 'disappointed', 'problem', 'issue', 'wrong'],
  followup: ['follow up', 'callback', 'call back', 'return call', 'check in'],
}

const SENTIMENT_INDICATORS = {
  positive: ['thank', 'great', 'perfect', 'wonderful', 'excellent', 'appreciate', 'helpful'],
  negative: ['frustrated', 'angry', 'upset', 'disappointed', 'terrible', 'worst', 'never'],
  urgent: ['need', 'urgent', 'asap', 'immediately', 'right away', 'emergency'],
}

export class CallIntelligenceAgent {
  private static instance: CallIntelligenceAgent
  private errorTracker = ErrorTracker.getInstance()
  private anthropic: Anthropic | null = null
  private config: AgentConfig

  private constructor() {
    this.config = CALL_INTELLIGENCE_CONFIG
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
    // Register with Maya Prime
    mayaPrime.registerAgent(this.config)
  }

  static getInstance(): CallIntelligenceAgent {
    if (!CallIntelligenceAgent.instance) {
      CallIntelligenceAgent.instance = new CallIntelligenceAgent()
    }
    return CallIntelligenceAgent.instance
  }

  /**
   * Analyze a completed call
   */
  async analyzeCall(
    callId: string,
    businessId: string,
    callData: VAPICallData
  ): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = this.generateExecutionId()

    try {
      // Check credits
      const hasCredits = await CreditSystem.hasCredits(businessId, AgentCreditCost.CALL_ANALYSIS)
      if (!hasCredits) {
        return {
          success: false,
          executionId,
          agentId: this.config.id,
          businessId,
          duration: Date.now() - startTime,
          error: 'Insufficient credits for call analysis',
        }
      }

      // Perform analysis
      const analysis = await this.performAnalysis(callId, businessId, callData)

      // Generate insights
      const insights = this.generateInsights(analysis, callData)

      // Determine follow-up actions
      const actions = this.determineActions(analysis, businessId)

      // Check for alerts
      const alerts = this.checkForAlerts(analysis)

      // Store analysis
      await this.storeAnalysis(analysis)

      // Deduct credits
      await CreditSystem.deductCredits(
        businessId,
        AgentCreditCost.CALL_ANALYSIS,
        'call_analysis',
        { callId }
      )

      // Log to audit
      await AuditLogger.log({
        event_type: AuditEventType.SYSTEM_EVENT,
        business_id: businessId,
        metadata: {
          action: 'call_analyzed',
          callId,
          outcome: analysis.outcome,
          leadQuality: analysis.leadQuality,
        },
        severity: 'low',
      })

      // Trigger follow-up agents if needed
      if (analysis.followUpRequired) {
        mayaPrime.queueAction({
          type: 'follow_up',
          target: 'lead',
          payload: {
            callId,
            leadId: callData.leadId,
            suggestedAction: analysis.suggestedFollowUp,
          },
          priority: analysis.leadQuality === 'hot' ? 'high' : 'medium',
          scheduledFor: this.calculateFollowUpTime(analysis),
        })
      }

      return {
        success: true,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        output: analysis,
        insights,
        actions,
        alerts,
      }
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Call analysis failed'),
        ErrorCategory.MAYA_JOB,
        ErrorSeverity.MEDIUM,
        { businessId, callId }
      )

      return {
        success: false,
        executionId,
        agentId: this.config.id,
        businessId,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Perform call analysis - uses AI when available, falls back to rules
   */
  private async performAnalysis(
    callId: string,
    businessId: string,
    callData: VAPICallData
  ): Promise<CallAnalysis> {
    const transcript = callData.transcript || ''
    const transcriptLower = transcript.toLowerCase()

    // Try AI-powered analysis first (much higher quality)
    if (this.anthropic && transcript.length > 50) {
      try {
        return await this.aiAnalysis(callId, businessId, callData, transcript)
      } catch (err) {
        console.error('[CallIntelligence] AI analysis failed, using rules:', err)
      }
    }

    // Fallback: rule-based analysis
    const intentDetected = this.detectIntents(transcriptLower)
    const sentiment = this.analyzeSentiment(transcriptLower)
    const outcome = this.determineOutcome(callData, intentDetected)
    const keyTopics = this.extractKeyTopics(transcriptLower)
    const leadQuality = this.qualifyLead(callData, sentiment, intentDetected)
    const appointmentBooked = outcome === 'appointment_booked'
    const followUpRequired = this.needsFollowUp(outcome, sentiment, leadQuality)
    const suggestedFollowUp = this.suggestFollowUp(outcome, sentiment, intentDetected)
    const coachingOpportunities = this.identifyCoachingOpportunities(callData, outcome)

    return {
      callId,
      businessId,
      duration: callData.duration || 0,
      outcome,
      sentiment,
      intentDetected,
      keyTopics,
      appointmentBooked,
      leadQuality,
      followUpRequired,
      suggestedFollowUp,
      transcriptSummary: this.summarizeTranscript(transcript),
      coachingOpportunities,
    }
  }

  /**
   * AI-powered call analysis using Anthropic Haiku
   */
  private async aiAnalysis(
    callId: string,
    businessId: string,
    callData: VAPICallData,
    transcript: string
  ): Promise<CallAnalysis> {
    const response = await this.anthropic!.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Analyze this phone call transcript. Return ONLY valid JSON.

TRANSCRIPT:
${transcript.substring(0, 3000)}

CALL DURATION: ${callData.duration || 0} seconds

Return this JSON structure:
{
  "summary": "2-3 sentence summary of the call",
  "sentiment": {
    "overall": "positive" | "neutral" | "negative",
    "score": -1.0 to 1.0,
    "customerFrustration": true/false,
    "urgencyLevel": "high" | "medium" | "low"
  },
  "intents": ["appointment", "pricing", "information", "complaint", "followup", "emergency"],
  "topics": ["scheduling", "pricing", "services", "hours", "location"],
  "outcome": "appointment_booked" | "callback_scheduled" | "information_provided" | "voicemail_left" | "no_answer" | "customer_declined" | "transferred" | "other",
  "leadQuality": "hot" | "warm" | "cold",
  "followUpRequired": true/false,
  "suggestedFollowUp": "specific action to take",
  "coaching": ["specific coaching tips for improving this type of call"]
}

Only include intents and topics that are actually present. Be specific in coaching tips.`,
      }],
    })

    const text = response.content[0]
    if (text.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const jsonMatch = text.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON in response')
    }

    const ai = JSON.parse(jsonMatch[0])

    // Map AI outcome or use VAPI's explicit outcome
    const outcome: CallOutcome = callData.outcome
      ? this.determineOutcome(callData, ai.intents || [])
      : (ai.outcome as CallOutcome) || 'other'

    return {
      callId,
      businessId,
      duration: callData.duration || 0,
      outcome,
      sentiment: {
        overall: ai.sentiment?.overall || 'neutral',
        score: ai.sentiment?.score || 0,
        customerFrustration: ai.sentiment?.customerFrustration || false,
        urgencyLevel: ai.sentiment?.urgencyLevel || 'low',
      },
      intentDetected: ai.intents || [],
      keyTopics: ai.topics || [],
      appointmentBooked: outcome === 'appointment_booked',
      leadQuality: ai.leadQuality || 'warm',
      followUpRequired: ai.followUpRequired ?? false,
      suggestedFollowUp: ai.suggestedFollowUp,
      transcriptSummary: ai.summary || transcript.substring(0, 200),
      coachingOpportunities: ai.coaching || [],
    }
  }

  /**
   * Detect intents from transcript
   */
  private detectIntents(transcript: string): string[] {
    const detectedIntents: string[] = []

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((keyword) => transcript.includes(keyword))) {
        detectedIntents.push(intent)
      }
    }

    return detectedIntents
  }

  /**
   * Analyze sentiment from transcript
   */
  private analyzeSentiment(transcript: string): CallSentiment {
    let positiveCount = 0
    let negativeCount = 0
    let urgentCount = 0

    for (const word of SENTIMENT_INDICATORS.positive) {
      if (transcript.includes(word)) positiveCount++
    }
    for (const word of SENTIMENT_INDICATORS.negative) {
      if (transcript.includes(word)) negativeCount++
    }
    for (const word of SENTIMENT_INDICATORS.urgent) {
      if (transcript.includes(word)) urgentCount++
    }

    const score = (positiveCount - negativeCount) / Math.max(1, positiveCount + negativeCount)
    const overall = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral'

    return {
      overall,
      score,
      customerFrustration: negativeCount > 2,
      urgencyLevel: urgentCount > 1 ? 'high' : urgentCount > 0 ? 'medium' : 'low',
    }
  }

  /**
   * Determine call outcome
   */
  private determineOutcome(callData: VAPICallData, intents: string[]): CallOutcome {
    // Check explicit outcome from VAPI
    if (callData.outcome) {
      const outcomeMap: Record<string, CallOutcome> = {
        'appointment-booked': 'appointment_booked',
        'callback-scheduled': 'callback_scheduled',
        'information-provided': 'information_provided',
        'voicemail': 'voicemail_left',
        'no-answer': 'no_answer',
        'declined': 'customer_declined',
        'transferred': 'transferred',
      }
      return outcomeMap[callData.outcome] || 'other'
    }

    // Infer from intents and call metadata
    if (intents.includes('appointment')) {
      return 'appointment_booked'
    }
    if (intents.includes('followup')) {
      return 'callback_scheduled'
    }
    if (intents.includes('information')) {
      return 'information_provided'
    }
    if (callData.duration < 30) {
      return 'no_answer'
    }

    return 'other'
  }

  /**
   * Extract key topics from transcript
   */
  private extractKeyTopics(transcript: string): string[] {
    const topics: string[] = []

    // Simple keyword-based topic extraction
    const topicKeywords: Record<string, string[]> = {
      'scheduling': ['appointment', 'schedule', 'book', 'available'],
      'pricing': ['price', 'cost', 'insurance', 'payment'],
      'services': ['service', 'treatment', 'procedure', 'cleaning'],
      'location': ['location', 'address', 'directions', 'parking'],
      'hours': ['hours', 'open', 'close', 'weekend'],
    }

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((keyword) => transcript.includes(keyword))) {
        topics.push(topic)
      }
    }

    return topics
  }

  /**
   * Qualify lead based on call analysis
   */
  private qualifyLead(
    callData: VAPICallData,
    sentiment: CallSentiment,
    intents: string[]
  ): 'hot' | 'warm' | 'cold' {
    let score = 50 // Start neutral

    // Positive factors
    if (intents.includes('appointment')) score += 30
    if (intents.includes('pricing')) score += 15
    if (sentiment.overall === 'positive') score += 10
    if (sentiment.urgencyLevel === 'high') score += 20
    if (callData.duration > 180) score += 10 // Long call = engaged

    // Negative factors
    if (sentiment.customerFrustration) score -= 20
    if (sentiment.overall === 'negative') score -= 15
    if (callData.duration < 60) score -= 10 // Very short call
    if (intents.includes('complaint')) score -= 25

    // Classify
    if (score >= 70) return 'hot'
    if (score >= 40) return 'warm'
    return 'cold'
  }

  /**
   * Determine if follow-up is needed
   */
  private needsFollowUp(
    outcome: CallOutcome,
    sentiment: CallSentiment,
    leadQuality: 'hot' | 'warm' | 'cold'
  ): boolean {
    // Always follow up on hot leads that didn't book
    if (leadQuality === 'hot' && outcome !== 'appointment_booked') return true

    // Follow up on warm leads with positive sentiment
    if (leadQuality === 'warm' && sentiment.overall !== 'negative') return true

    // Follow up on callbacks
    if (outcome === 'callback_scheduled') return true

    // Follow up on frustrated customers
    if (sentiment.customerFrustration) return true

    return false
  }

  /**
   * Suggest follow-up action
   */
  private suggestFollowUp(
    outcome: CallOutcome,
    sentiment: CallSentiment,
    intents: string[]
  ): string {
    if (sentiment.customerFrustration) {
      return 'Priority callback from manager to address concerns'
    }

    if (intents.includes('pricing')) {
      return 'Send pricing information and special offers'
    }

    if (intents.includes('appointment') && outcome !== 'appointment_booked') {
      return 'Call back within 24 hours to help schedule appointment'
    }

    if (intents.includes('information')) {
      return 'Send email with requested information and available slots'
    }

    return 'Standard follow-up call in 48-72 hours'
  }

  /**
   * Identify coaching opportunities from call
   */
  private identifyCoachingOpportunities(callData: VAPICallData, outcome: CallOutcome): string[] {
    const opportunities: string[] = []

    // If call was long but didn't convert
    if (callData.duration > 300 && outcome !== 'appointment_booked') {
      opportunities.push('Long call without booking - review closing techniques')
    }

    // If transfer was needed
    if (outcome === 'transferred') {
      opportunities.push('Call required transfer - expand AI capabilities for this scenario')
    }

    return opportunities
  }

  /**
   * Summarize transcript for quick review
   */
  private summarizeTranscript(transcript: string): string {
    if (!transcript || transcript.length < 100) {
      return transcript || 'No transcript available'
    }

    // Simple summarization - take first and last portions
    const words = transcript.split(' ')
    if (words.length <= 50) return transcript

    const start = words.slice(0, 25).join(' ')
    const end = words.slice(-25).join(' ')
    return `${start}... [middle omitted] ...${end}`
  }

  /**
   * Calculate optimal follow-up time
   */
  private calculateFollowUpTime(analysis: CallAnalysis): Date {
    const now = new Date()

    // Hot leads - follow up quickly
    if (analysis.leadQuality === 'hot') {
      return new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours
    }

    // Frustrated customers - ASAP during business hours
    if (analysis.sentiment.customerFrustration) {
      return new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours
    }

    // Warm leads
    if (analysis.leadQuality === 'warm') {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    }

    // Cold leads
    return new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours
  }

  /**
   * Generate insights from analysis
   */
  private generateInsights(analysis: CallAnalysis, callData: VAPICallData): AgentInsight[] {
    const insights: AgentInsight[] = []

    // Hot lead insight
    if (analysis.leadQuality === 'hot') {
      insights.push({
        type: 'opportunity',
        title: 'Hot Lead Identified',
        description: `High-intent caller detected. ${analysis.appointmentBooked ? 'Successfully booked.' : 'Needs follow-up.'}`,
        confidence: 0.85,
        impact: 'high',
        suggestedActions: analysis.appointmentBooked
          ? ['Prepare for appointment', 'Send confirmation']
          : ['Priority callback within 4 hours', 'Send availability options'],
      })
    }

    // Frustrated customer insight
    if (analysis.sentiment.customerFrustration) {
      insights.push({
        type: 'risk',
        title: 'Customer Frustration Detected',
        description: 'Caller showed signs of frustration. May need manager intervention.',
        confidence: 0.75,
        impact: 'high',
        suggestedActions: ['Manager callback', 'Review call recording', 'Update service protocols'],
      })
    }

    // Pricing interest insight
    if (analysis.intentDetected.includes('pricing') && !analysis.appointmentBooked) {
      insights.push({
        type: 'opportunity',
        title: 'Price-Sensitive Prospect',
        description: 'Caller expressed interest in pricing but did not book.',
        confidence: 0.7,
        impact: 'medium',
        suggestedActions: ['Send special offer', 'Provide financing options', 'Highlight value proposition'],
      })
    }

    return insights
  }

  /**
   * Determine actions based on analysis
   */
  private determineActions(analysis: CallAnalysis, businessId: string): AgentAction[] {
    const actions: AgentAction[] = []

    // Follow-up action
    if (analysis.followUpRequired) {
      actions.push({
        type: 'schedule_follow_up',
        target: 'lead',
        payload: {
          reason: analysis.suggestedFollowUp,
          leadQuality: analysis.leadQuality,
        },
        priority: analysis.leadQuality === 'hot' ? 'high' : 'medium',
        scheduledFor: this.calculateFollowUpTime(analysis),
      })
    }

    // Send information action
    if (analysis.intentDetected.includes('information') && !analysis.appointmentBooked) {
      actions.push({
        type: 'send_email',
        target: 'lead',
        payload: {
          template: 'information_request',
          topics: analysis.keyTopics,
        },
        priority: 'medium',
      })
    }

    // Manager escalation for frustrated customers
    if (analysis.sentiment.customerFrustration) {
      actions.push({
        type: 'escalate',
        target: 'manager',
        payload: {
          reason: 'Customer frustration detected',
          callId: analysis.callId,
        },
        priority: 'high',
        requiresApproval: false,
      })
    }

    return actions
  }

  /**
   * Check for alert conditions
   */
  private checkForAlerts(analysis: CallAnalysis): AgentAlert[] {
    const alerts: AgentAlert[] = []

    // Frustrated customer alert
    if (analysis.sentiment.customerFrustration) {
      alerts.push({
        severity: 'warning',
        title: 'Frustrated Customer',
        message: `Customer showed frustration during call. Recommended: ${analysis.suggestedFollowUp}`,
        category: 'customer_experience',
        timestamp: new Date(),
        metadata: { callId: analysis.callId },
      })
    }

    // Emergency/urgent request
    if (analysis.sentiment.urgencyLevel === 'high' && analysis.intentDetected.includes('emergency')) {
      alerts.push({
        severity: 'critical',
        title: 'Urgent Customer Request',
        message: 'Customer expressed urgent/emergency need. Immediate attention required.',
        category: 'urgent_request',
        timestamp: new Date(),
        metadata: { callId: analysis.callId },
      })
    }

    return alerts
  }

  /**
   * Store analysis in database
   */
  private async storeAnalysis(analysis: CallAnalysis): Promise<void> {
    try {
      // Update the voice call record with analysis
      await supabase
        .from('voice_ai_calls')
        .update({
          analysis: {
            outcome: analysis.outcome,
            sentiment: analysis.sentiment,
            intentDetected: analysis.intentDetected,
            keyTopics: analysis.keyTopics,
            leadQuality: analysis.leadQuality,
            followUpRequired: analysis.followUpRequired,
            suggestedFollowUp: analysis.suggestedFollowUp,
            coachingOpportunities: analysis.coachingOpportunities,
          },
          lead_quality: analysis.leadQuality,
          outcome: analysis.outcome,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', analysis.callId)
    } catch (error) {
      this.errorTracker.trackError(
        error instanceof Error ? error : new Error('Failed to store call analysis'),
        ErrorCategory.DATABASE,
        ErrorSeverity.LOW,
        { callId: analysis.callId }
      )
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `call_intel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return this.config
  }
}

// VAPI call data interface
export interface VAPICallData {
  callId: string
  leadId?: string
  duration: number
  transcript?: string
  outcome?: string
  recordingUrl?: string
  startTime: Date
  endTime: Date
  metadata?: Record<string, any>
}

// Export singleton
export const callIntelligenceAgent = CallIntelligenceAgent.getInstance()
export default CallIntelligenceAgent

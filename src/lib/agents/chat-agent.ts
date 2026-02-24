/**
 * Chat Agent
 *
 * Observes widget chat sessions and surfaces insights back to the business:
 * - Qualifies leads from chat conversations (name, email, intent)
 * - Detects booking intent and flags for follow-up
 * - Aggregates chat session metrics for the daily summary
 * - Emits LEAD_CREATED when a visitor provides contact info
 *
 * Triggered by CHAT_ENDED events emitted from the /api/widget/chat endpoint.
 */

import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '../supabase-client'
import {
  AgentConfig,
  AgentContext,
  AgentResult,
  AgentInsight,
  AgentAction,
  AgentEvent,
  AgentCreditCost,
} from './types'
import { agentRegistry } from './agent-registry'

const CHAT_AGENT_CONFIG: AgentConfig = {
  id: 'chat',
  name: 'Chat Agent',
  description: 'Analyzes widget chat sessions, qualifies leads, and surfaces booking intent',
  cluster: 'customer',
  enabled: true,
  triggers: [
    { event: AgentEvent.CHAT_ENDED },
  ],
}

export interface ChatSessionData {
  sessionId: string
  employeeId: string
  businessId: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  visitorId: string
  leadInfo?: { name?: string; email?: string }
  startedAt: string
  endedAt: string
}

export class ChatAgent {
  private static instance: ChatAgent
  private anthropic: Anthropic | null = null

  private constructor() {}

  static getInstance(): ChatAgent {
    if (!ChatAgent.instance) {
      ChatAgent.instance = new ChatAgent()
    }
    return ChatAgent.instance
  }

  getConfig(): AgentConfig {
    return CHAT_AGENT_CONFIG
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    }
    return this.anthropic
  }

  async execute(context: AgentContext, session?: ChatSessionData): Promise<AgentResult> {
    const startTime = Date.now()
    const executionId = `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`

    if (!session) {
      return {
        success: false,
        executionId,
        agentId: CHAT_AGENT_CONFIG.id,
        businessId: context.businessId,
        duration: Date.now() - startTime,
        error: 'No session data provided',
      }
    }

    try {
      const analysis = await this.analyzeSession(session)

      // Emit LEAD_CREATED if we detected contact info or strong intent
      if (analysis.leadDetected && (session.leadInfo?.name || analysis.detectedEmail || analysis.detectedName)) {
        agentRegistry.emitEvent(AgentEvent.LEAD_CREATED, session.businessId, {
          source: 'widget-chat',
          visitorId: session.visitorId,
          employeeId: session.employeeId,
          name: session.leadInfo?.name ?? analysis.detectedName,
          email: session.leadInfo?.email ?? analysis.detectedEmail,
          intent: analysis.intent,
          sessionId: session.sessionId,
        }).catch(err => console.error('[ChatAgent] LEAD_CREATED emit error:', err))
      }

      const insights: AgentInsight[] = [{
        type: 'chat_analysis',
        title: `Chat session: ${analysis.intent}`,
        description: analysis.summary,
        confidence: analysis.confidence,
        impact: analysis.leadDetected ? 'high' : 'low',
        data: analysis,
      }]

      const actions: AgentAction[] = []
      if (analysis.bookingIntent) {
        actions.push({
          type: 'flag_for_followup',
          description: 'Visitor expressed booking intent in chat',
          priority: 'high',
          data: { sessionId: session.sessionId, visitorId: session.visitorId },
        })
      }

      console.log(`[ChatAgent] Session ${session.sessionId} — intent: ${analysis.intent}, lead: ${analysis.leadDetected}`)

      return {
        success: true,
        executionId,
        agentId: CHAT_AGENT_CONFIG.id,
        businessId: context.businessId,
        duration: Date.now() - startTime,
        insights,
        actions,
      }
    } catch (err: any) {
      console.error('[ChatAgent] Analysis error:', err)
      return {
        success: false,
        executionId,
        agentId: CHAT_AGENT_CONFIG.id,
        businessId: context.businessId,
        duration: Date.now() - startTime,
        error: err.message,
      }
    }
  }

  private async analyzeSession(session: ChatSessionData): Promise<{
    intent: string
    summary: string
    confidence: number
    leadDetected: boolean
    bookingIntent: boolean
    detectedName?: string
    detectedEmail?: string
  }> {
    const transcript = session.messages
      .map(m => `${m.role === 'user' ? 'VISITOR' : 'ASSISTANT'}: ${m.content}`)
      .join('\n')

    const prompt = `Analyze this chat widget conversation and return a JSON object with:
- intent: one of "appointment_booking", "pricing_inquiry", "support_question", "general_inquiry", "complaint", "other"
- summary: 1-2 sentence summary of what the visitor wanted
- confidence: 0.0-1.0 confidence in the intent classification
- leadDetected: true if the visitor seems like a qualified lead (expressed real need or interest)
- bookingIntent: true if the visitor explicitly asked about booking or scheduling
- detectedName: string or null (if visitor mentioned their name in the chat)
- detectedEmail: string or null (if visitor mentioned their email)

Transcript:
${transcript}

Respond with only the JSON object, no other text.`

    try {
      const response = await this.getAnthropic().messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      return JSON.parse(text)
    } catch {
      // Fallback to simple heuristic
      const lower = transcript.toLowerCase()
      return {
        intent: lower.includes('book') || lower.includes('schedul') ? 'appointment_booking' : 'general_inquiry',
        summary: `Chat session with ${session.messages.filter(m => m.role === 'user').length} visitor messages.`,
        confidence: 0.5,
        leadDetected: !!session.leadInfo?.name,
        bookingIntent: lower.includes('book') || lower.includes('appointment'),
        detectedName: session.leadInfo?.name,
        detectedEmail: session.leadInfo?.email,
      }
    }
  }
}

export const chatAgent = ChatAgent.getInstance()

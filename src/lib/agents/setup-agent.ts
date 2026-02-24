/**
 * Setup & Onboarding Agent
 *
 * A conversational agent that guides new business owners through
 * setting up their first phone employee. Asks about their business,
 * determines the right employee type and configuration, then
 * auto-provisions everything.
 *
 * Uses Anthropic Messages API (Sonnet) for multi-turn conversation.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface SetupMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SetupState {
  sessionId: string
  businessId: string
  messages: SetupMessage[]
  phase: 'greeting' | 'discovery' | 'configuration' | 'confirmation' | 'provisioning' | 'complete'
  collectedData: {
    businessName?: string
    businessType?: string
    industry?: string
    employeeType?: 'receptionist' | 'personal_assistant' | 'order_taker'
    employeeName?: string
    greeting?: string
    services?: string[]
    businessHours?: string
    transferNumber?: string
    specialInstructions?: string
    voiceGender?: string
    // Order taker specific
    menuItems?: Array<{ name: string; price: number; category?: string }>
    acceptsPayments?: boolean
    deliveryAvailable?: boolean
  }
  error?: string
}

const SYSTEM_PROMPT = `You are the VoiceFly Setup Assistant. You're helping a business owner set up their first AI phone employee.

Your job is to have a friendly, efficient conversation to collect the information needed to create their phone employee. Follow this flow:

PHASE 1 - DISCOVERY (2-3 questions):
- What type of business do they run?
- What do they need the phone employee to do? (answer calls and book appointments / take orders / manage personal schedule)
- What's the business name?

PHASE 2 - CONFIGURATION (3-4 questions):
- What should the employee's name be? (suggest something friendly based on their business)
- What should the greeting be? (suggest one based on their business)
- What are their business hours?
- Any special instructions? (dietary accommodations for restaurants, insurance for medical, etc.)
- For order takers: What are their top menu items and prices?
- Should the employee be male or female voiced?

PHASE 3 - CONFIRMATION:
- Summarize everything collected
- Ask for confirmation
- If confirmed, respond with EXACTLY this format on its own line:
  [SETUP_COMPLETE]

RULES:
- Be concise - each message should be 1-3 sentences max
- Don't ask more than 2 questions at a time
- Make smart suggestions based on the business type (e.g., restaurant = order_taker, salon = receptionist)
- Use a warm, professional tone
- If the user seems confused, offer simpler choices
- When you have enough info, move to confirmation. Don't over-ask.

EMPLOYEE TYPES:
- receptionist: Answers calls, books appointments, takes messages, transfers calls. Best for: salons, medical offices, service businesses.
- order_taker: Takes food/product orders, manages menu, processes payments. Best for: restaurants, cafes, food trucks.
- personal_assistant: Manages calendar, sends reminders, handles scheduling. Best for: professionals, consultants, small offices.`

export class SetupAgent {
  private anthropic: Anthropic | null = null

  constructor() {
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    }
  }

  /**
   * Start a new setup session
   */
  async startSession(businessId: string): Promise<SetupState> {
    const sessionId = `setup_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // Get business info if available
    const { data: business } = await supabase
      .from('businesses')
      .select('name, business_type')
      .eq('id', businessId)
      .single()

    const greeting = business?.name
      ? `Hey! I'm here to help you set up your first AI phone employee for ${business.name}. This will only take a couple minutes. What kind of business do you run?`
      : `Hey! I'm here to help you set up your first AI phone employee. This will only take a couple minutes. What's your business name and what kind of business do you run?`

    const state: SetupState = {
      sessionId,
      businessId,
      messages: [{ role: 'assistant', content: greeting }],
      phase: 'discovery',
      collectedData: {
        businessName: business?.name,
        businessType: business?.business_type,
      },
    }

    // Store session
    await this.saveSession(state)

    return state
  }

  /**
   * Process a user message and generate a response
   */
  async chat(sessionId: string, userMessage: string): Promise<SetupState> {
    // Load session
    const state = await this.loadSession(sessionId)
    if (!state) {
      throw new Error('Session not found')
    }

    // Add user message
    state.messages.push({ role: 'user', content: userMessage })

    // If already complete, don't process further
    if (state.phase === 'complete') {
      state.messages.push({
        role: 'assistant',
        content: 'Your phone employee is already set up! Head to your dashboard to see them in action.',
      })
      await this.saveSession(state)
      return state
    }

    // Generate response
    const response = await this.generateResponse(state)

    // Check if setup is complete
    if (response.includes('[SETUP_COMPLETE]')) {
      state.phase = 'provisioning'
      const cleanResponse = response.replace('[SETUP_COMPLETE]', '').trim()
      state.messages.push({ role: 'assistant', content: cleanResponse || 'Setting up your phone employee now...' })

      // Extract data from conversation and provision
      await this.extractDataFromConversation(state)
      const provisionResult = await this.provisionEmployee(state)

      if (provisionResult.success) {
        state.phase = 'complete'
        state.messages.push({
          role: 'assistant',
          content: `Your phone employee "${state.collectedData.employeeName || 'Assistant'}" is ready! ${provisionResult.phoneNumber ? `Their phone number is ${provisionResult.phoneNumber}.` : ''} You can customize them further from your dashboard.`,
        })
      } else {
        state.messages.push({
          role: 'assistant',
          content: `I've saved your configuration, but there was a small issue with the final setup: ${provisionResult.error}. You can complete the setup from your dashboard.`,
        })
        state.phase = 'complete'
        state.error = provisionResult.error
      }
    } else {
      state.messages.push({ role: 'assistant', content: response })
      // Update phase based on conversation progress
      this.updatePhase(state)
    }

    await this.saveSession(state)
    return state
  }

  /**
   * Generate a response using Anthropic
   */
  private async generateResponse(state: SetupState): Promise<string> {
    if (!this.anthropic) {
      return this.generateFallbackResponse(state)
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        system: SYSTEM_PROMPT + `\n\nCurrent collected data: ${JSON.stringify(state.collectedData)}\nCurrent phase: ${state.phase}`,
        messages: state.messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      })

      const text = response.content[0]
      if (text.type === 'text') {
        return text.text.trim()
      }
      return this.generateFallbackResponse(state)
    } catch (err) {
      console.error('[SetupAgent] Anthropic error:', err)
      return this.generateFallbackResponse(state)
    }
  }

  /**
   * Fallback response when Anthropic is not available
   */
  private generateFallbackResponse(state: SetupState): string {
    const messageCount = state.messages.filter(m => m.role === 'user').length

    if (messageCount === 1) {
      return "Got it! What should we name your phone employee? Something friendly like 'Alex' or 'Sam' works great."
    }
    if (messageCount === 2) {
      return "Great name! What are your business hours? (e.g., Mon-Fri 9am-5pm)"
    }
    if (messageCount === 3) {
      return `Alright, here's what I've got:\n- Business: ${state.collectedData.businessName || 'Your business'}\n- Employee type: Receptionist\n- Name: ${state.collectedData.employeeName || 'Alex'}\n\nShall I go ahead and set this up?\n[SETUP_COMPLETE]`
    }
    return "[SETUP_COMPLETE]"
  }

  /**
   * Extract structured data from the conversation using AI
   */
  private async extractDataFromConversation(state: SetupState): Promise<void> {
    if (!this.anthropic) {
      // Use simple heuristics
      state.collectedData.employeeType = state.collectedData.employeeType || 'receptionist'
      state.collectedData.employeeName = state.collectedData.employeeName || 'Alex'
      return
    }

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Extract structured data from this setup conversation. Return ONLY valid JSON.

Conversation:
${state.messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Extract this JSON structure (use null for unknown fields):
{
  "businessName": "string",
  "businessType": "string (e.g., restaurant, salon, medical, etc.)",
  "employeeType": "receptionist | personal_assistant | order_taker",
  "employeeName": "string",
  "greeting": "string (the phone greeting)",
  "businessHours": "string",
  "transferNumber": "string or null",
  "specialInstructions": "string or null",
  "voiceGender": "male | female",
  "services": ["array of services offered"],
  "menuItems": [{"name": "string", "price": number}]
}`,
        }],
      })

      const text = response.content[0]
      if (text.type === 'text') {
        const jsonMatch = text.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const extracted = JSON.parse(jsonMatch[0])
          state.collectedData = { ...state.collectedData, ...extracted }
        }
      }
    } catch (err) {
      console.error('[SetupAgent] Data extraction error:', err)
      // Keep whatever we have
    }
  }

  /**
   * Provision the phone employee based on collected data
   */
  private async provisionEmployee(state: SetupState): Promise<{
    success: boolean
    employeeId?: string
    phoneNumber?: string
    error?: string
  }> {
    try {
      const data = state.collectedData
      const employeeType = data.employeeType || 'receptionist'

      // Create employee in database
      const { data: employee, error } = await supabase
        .from('phone_employees')
        .insert({
          business_id: state.businessId,
          name: data.employeeName || 'Alex',
          job_type: employeeType,
          status: 'active',
          greeting: data.greeting || `Thank you for calling ${data.businessName || 'our business'}. How can I help you today?`,
          personality: 'friendly and professional',
          voice_gender: data.voiceGender || 'female',
          business_hours: data.businessHours,
          special_instructions: data.specialInstructions,
          transfer_number: data.transferNumber,
          services: data.services,
          menu_items: data.menuItems,
          config: {
            setupAgent: true,
            sessionId: state.sessionId,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      return {
        success: true,
        employeeId: employee.id,
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  /**
   * Update the conversation phase based on collected data
   */
  private updatePhase(state: SetupState): void {
    const userMessages = state.messages.filter(m => m.role === 'user').length

    if (userMessages <= 2) {
      state.phase = 'discovery'
    } else if (userMessages <= 5) {
      state.phase = 'configuration'
    } else {
      state.phase = 'confirmation'
    }
  }

  // ============================================
  // SESSION PERSISTENCE
  // ============================================

  private async saveSession(state: SetupState): Promise<void> {
    try {
      await supabase.from('setup_sessions').upsert({
        id: state.sessionId,
        business_id: state.businessId,
        messages: state.messages,
        phase: state.phase,
        collected_data: state.collectedData,
        error: state.error,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } catch (err) {
      // Session persistence is best-effort
      console.error('[SetupAgent] Failed to save session:', err)
    }
  }

  private async loadSession(sessionId: string): Promise<SetupState | null> {
    try {
      const { data } = await supabase
        .from('setup_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (!data) return null

      return {
        sessionId: data.id,
        businessId: data.business_id,
        messages: data.messages || [],
        phase: data.phase || 'discovery',
        collectedData: data.collected_data || {},
        error: data.error,
      }
    } catch (err) {
      return null
    }
  }
}

// Export singleton
export const setupAgent = new SetupAgent()

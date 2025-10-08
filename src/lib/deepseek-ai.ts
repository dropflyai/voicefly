/**
 * DeepSeek-R1 API Integration
 * Powers all backend AI operations at 98% lower cost than GPT-4
 *
 * Why DeepSeek-R1:
 * - 27x cheaper than OpenAI o1 ($0.55/$2.19 vs $15/$60 per M tokens)
 * - Equals o1 reasoning capabilities (97.3% MATH-500)
 * - Best practical coding performance (9/9 tests passed)
 * - 75% off-peak discount (16:30-00:30 UTC)
 * - Open source (MIT license)
 * - 90% cost savings with intelligent caching
 *
 * Use cases:
 * - Web research & data extraction
 * - Document processing
 * - Smart scheduling logic
 * - Customer intent analysis
 * - Business insights & analytics
 * - Marketing content generation
 * - Code generation and review
 * - Complex reasoning tasks
 */

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface DeepSeekResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
      reasoning_content?: string // DeepSeek-R1 shows its reasoning
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_cache_hit_tokens?: number // Track cache savings
    prompt_cache_miss_tokens?: number
  }
}

export class DeepSeekAI {
  private apiKey: string
  private baseURL: string = 'https://api.deepseek.com'
  private model: string = 'deepseek-reasoner' // DeepSeek-R1 model

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || ''
    if (!this.apiKey) {
      console.warn('⚠️ DEEPSEEK_API_KEY not set - DeepSeek AI features will not work')
    }
  }

  /**
   * General purpose AI completion
   * Use for: web ops, research, data processing, analysis, coding
   */
  async complete(
    prompt: string,
    options?: {
      systemPrompt?: string
      temperature?: number
      maxTokens?: number
      showReasoning?: boolean // Get DeepSeek's chain-of-thought
    }
  ): Promise<string> {
    const messages: DeepSeekMessage[] = []

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt
      })
    }

    messages.push({
      role: 'user',
      content: prompt
    })

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000
        })
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
      }

      const data: DeepSeekResponse = await response.json()
      const choice = data.choices[0]

      // Log cache savings if available
      if (data.usage.prompt_cache_hit_tokens) {
        const cacheHitRate = (data.usage.prompt_cache_hit_tokens / data.usage.prompt_tokens) * 100
        console.log(`💰 DeepSeek cache hit: ${cacheHitRate.toFixed(1)}% (~${(cacheHitRate * 0.9).toFixed(0)}% cost savings)`)
      }

      // Return reasoning + answer if requested
      if (options?.showReasoning && choice.message.reasoning_content) {
        return `**REASONING:**\n${choice.message.reasoning_content}\n\n**ANSWER:**\n${choice.message.content}`
      }

      return choice.message.content
    } catch (error) {
      console.error('DeepSeek AI completion error:', error)
      throw error
    }
  }

  /**
   * Web research & data extraction
   * Use for: competitor analysis, market research, lead enrichment
   */
  async webResearch(query: string, context?: string): Promise<string> {
    const systemPrompt = `You are a professional web researcher and data analyst.
Your task is to provide accurate, well-researched information with sources.
Always cite your sources and provide actionable insights.
Use step-by-step reasoning to ensure thorough analysis.`

    const prompt = context
      ? `Research query: ${query}\n\nAdditional context: ${context}\n\nProvide detailed findings with sources.`
      : `Research the following and provide detailed findings with sources:\n\n${query}`

    return this.complete(prompt, { systemPrompt, showReasoning: false })
  }

  /**
   * Customer intent analysis
   * Use for: analyzing call transcripts, extracting booking intent
   */
  async analyzeIntent(
    transcript: string,
    options?: {
      extractBookingInfo?: boolean
      sentiment?: boolean
    }
  ): Promise<{
    intent: string
    confidence: number
    booking?: {
      service?: string
      preferredDate?: string
      preferredTime?: string
    }
    sentiment?: 'positive' | 'neutral' | 'negative'
    summary: string
  }> {
    const systemPrompt = `You are an expert at analyzing customer conversations.
Extract intent, booking information, and sentiment from transcripts.
Return results in JSON format.
Use reasoning to ensure accurate interpretation.`

    const prompt = `Analyze this customer conversation transcript:

${transcript}

Extract:
${options?.extractBookingInfo ? '- Booking intent (service, date, time preferences)' : ''}
${options?.sentiment ? '- Customer sentiment (positive/neutral/negative)' : ''}
- Overall intent and confidence (0-100)
- Brief summary

Return as JSON.`

    const response = await this.complete(prompt, { systemPrompt, temperature: 0.3 })

    try {
      return JSON.parse(response)
    } catch {
      // If JSON parsing fails, return structured default
      return {
        intent: 'unknown',
        confidence: 0,
        summary: response
      }
    }
  }

  /**
   * Smart scheduling suggestions
   * Use for: finding optimal appointment times, resolving conflicts
   */
  async suggestAppointmentTimes(
    customerPreferences: string,
    availableSlots: Array<{ date: string; time: string }>,
    context?: string
  ): Promise<Array<{ date: string; time: string; reason: string }>> {
    const systemPrompt = `You are an intelligent scheduling assistant.
Your job is to recommend the best appointment times based on customer preferences and availability.
Use logical reasoning to prioritize slots.`

    const prompt = `Customer preferences: ${customerPreferences}

Available time slots:
${availableSlots.map(s => `- ${s.date} at ${s.time}`).join('\n')}

${context ? `Additional context: ${context}` : ''}

Recommend the top 3 best time slots and explain why each is suitable.
Return as JSON array: [{ date, time, reason }]`

    const response = await this.complete(prompt, { systemPrompt, temperature: 0.5 })

    try {
      return JSON.parse(response)
    } catch {
      return []
    }
  }

  /**
   * Business insights generation
   * Use for: analytics, reporting, trend analysis
   */
  async generateInsights(
    data: any,
    insightType: 'revenue' | 'customers' | 'appointments' | 'marketing'
  ): Promise<{
    summary: string
    insights: string[]
    recommendations: string[]
    trends: string[]
  }> {
    const systemPrompt = `You are a business intelligence analyst specializing in ${insightType} analysis.
Provide actionable insights, identify trends, and make strategic recommendations.
Use data-driven reasoning to support your conclusions.`

    const prompt = `Analyze this ${insightType} data and provide insights:

${JSON.stringify(data, null, 2)}

Provide:
1. Executive summary
2. Key insights (3-5 points)
3. Actionable recommendations (3-5 points)
4. Trends and patterns

Return as JSON.`

    const response = await this.complete(prompt, { systemPrompt, temperature: 0.4 })

    try {
      return JSON.parse(response)
    } catch {
      return {
        summary: response,
        insights: [],
        recommendations: [],
        trends: []
      }
    }
  }

  /**
   * Marketing content generation
   * Use for: email campaigns, SMS messages, social media
   */
  async generateMarketing(
    type: 'email' | 'sms' | 'social',
    purpose: string,
    targetAudience: string,
    context?: string
  ): Promise<{
    subject?: string
    content: string
    callToAction: string
  }> {
    const systemPrompt = `You are an expert marketing copywriter.
Create compelling, conversion-focused ${type} content that resonates with the target audience.`

    const prompt = `Create ${type} content for:

Purpose: ${purpose}
Target audience: ${targetAudience}
${context ? `Context: ${context}` : ''}

Requirements:
- Compelling and conversion-focused
- Clear call-to-action
- Appropriate tone for ${type}
${type === 'sms' ? '- Keep under 160 characters' : ''}

Return as JSON: { ${type === 'email' ? 'subject, ' : ''}content, callToAction }`

    const response = await this.complete(prompt, { systemPrompt, temperature: 0.7 })

    try {
      return JSON.parse(response)
    } catch {
      return {
        content: response,
        callToAction: 'Learn more'
      }
    }
  }

  /**
   * Document processing & extraction
   * Use for: parsing contracts, extracting key info from documents
   */
  async processDocument(
    documentText: string,
    extractionGoals: string[]
  ): Promise<Record<string, any>> {
    const systemPrompt = `You are an expert at document analysis and information extraction.
Extract structured data accurately and thoroughly using logical reasoning.`

    const prompt = `Extract the following information from this document:

${extractionGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Document:
${documentText}

Return extracted information as JSON.`

    const response = await this.complete(prompt, { systemPrompt, temperature: 0.2 })

    try {
      return JSON.parse(response)
    } catch {
      return { raw: response }
    }
  }

  /**
   * Code generation and review
   * Use for: generating code, reviewing code, debugging
   * DeepSeek-R1 excels at coding (9/9 practical tests passed)
   */
  async generateCode(
    description: string,
    language: string,
    requirements?: string[]
  ): Promise<{
    code: string
    explanation: string
    tests?: string
  }> {
    const systemPrompt = `You are an expert software engineer.
Generate clean, efficient, well-documented code.
Use reasoning to ensure correctness and best practices.`

    const prompt = `Generate ${language} code for:

${description}

${requirements ? `Requirements:\n${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}` : ''}

Return as JSON: { code, explanation, tests }`

    const response = await this.complete(prompt, {
      systemPrompt,
      temperature: 0.3,
      showReasoning: true // See DeepSeek's coding reasoning
    })

    try {
      // Extract JSON from response (may include reasoning)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return { code: response, explanation: 'See response' }
    } catch {
      return { code: response, explanation: 'Parse failed' }
    }
  }

  /**
   * Multi-turn conversation
   * Use for: complex agentic tasks requiring back-and-forth
   */
  async chat(
    messages: DeepSeekMessage[],
    options?: {
      temperature?: number
      maxTokens?: number
      showReasoning?: boolean
    }
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000
        })
      })

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`)
      }

      const data: DeepSeekResponse = await response.json()
      const choice = data.choices[0]

      // Return reasoning + answer if requested
      if (options?.showReasoning && choice.message.reasoning_content) {
        return `**REASONING:**\n${choice.message.reasoning_content}\n\n**ANSWER:**\n${choice.message.content}`
      }

      return choice.message.content
    } catch (error) {
      console.error('DeepSeek AI chat error:', error)
      throw error
    }
  }

  /**
   * Estimate cost for a request
   * DeepSeek-R1 pricing:
   * - $0.14/M input (cache hit)
   * - $0.55/M input (cache miss)
   * - $2.19/M output
   * - 75% discount off-peak (16:30-00:30 UTC)
   */
  estimateCost(
    inputTokens: number,
    outputTokens: number,
    options?: {
      cacheHitRate?: number // 0-1, defaults to 0 (conservative)
      isOffPeak?: boolean // 75% discount during 16:30-00:30 UTC
    }
  ): number {
    const cacheHitRate = options?.cacheHitRate || 0
    const cacheHitTokens = inputTokens * cacheHitRate
    const cacheMissTokens = inputTokens * (1 - cacheHitRate)

    const inputCost = (cacheHitTokens / 1000000) * 0.14 + (cacheMissTokens / 1000000) * 0.55
    const outputCost = (outputTokens / 1000000) * 2.19

    let totalCost = inputCost + outputCost

    // Apply off-peak discount if applicable
    if (options?.isOffPeak) {
      totalCost = totalCost * 0.25 // 75% discount
    }

    return totalCost
  }

  /**
   * Check if current time is off-peak (16:30-00:30 UTC)
   * Returns true if 75% discount applies
   */
  isOffPeakTime(): boolean {
    const now = new Date()
    const utcHours = now.getUTCHours()
    const utcMinutes = now.getUTCMinutes()
    const totalMinutes = utcHours * 60 + utcMinutes

    // Off-peak: 16:30 (990 min) to 00:30 (30 min next day)
    // This is: 16:30-23:59 OR 00:00-00:30
    return totalMinutes >= 990 || totalMinutes <= 30
  }
}

// Singleton instance
let deepseekInstance: DeepSeekAI | null = null

export function getDeepSeekAI(): DeepSeekAI {
  if (!deepseekInstance) {
    deepseekInstance = new DeepSeekAI()
  }
  return deepseekInstance
}

// Convenience functions
export const deepseekWebResearch = (query: string, context?: string) =>
  getDeepSeekAI().webResearch(query, context)

export const deepseekAnalyzeIntent = (transcript: string, options?: any) =>
  getDeepSeekAI().analyzeIntent(transcript, options)

export const deepseekGenerateInsights = (data: any, type: any) =>
  getDeepSeekAI().generateInsights(data, type)

export const deepseekGenerateMarketing = (type: any, purpose: string, audience: string, context?: string) =>
  getDeepSeekAI().generateMarketing(type, purpose, audience, context)

export const deepseekGenerateCode = (description: string, language: string, requirements?: string[]) =>
  getDeepSeekAI().generateCode(description, language, requirements)

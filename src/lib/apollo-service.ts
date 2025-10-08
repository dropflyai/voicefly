/**
 * Apollo.io Lead Search Service
 * Uses OUR Apollo API key to search and deliver leads to customers
 * Cost already factored into subscription pricing
 */

import { getDeepSeekAI } from './deepseek-ai'

export interface LeadSearchCriteria {
  // Required
  industry?: string[] // e.g., ['dental', 'healthcare']
  location?: {
    city?: string
    state?: string
    country?: string
    radius?: number // miles
  }

  // Optional filters
  companySize?: {
    min?: number
    max?: number
  }
  revenue?: {
    min?: number // in millions
    max?: number
  }
  jobTitles?: string[] // e.g., ['Owner', 'Manager', 'Director']
  keywords?: string[] // Company description keywords

  // Limits
  limit?: number // Max leads to return (default 50)
}

export interface ApolloLead {
  // Company info
  companyName: string
  companyDomain?: string
  companyPhone?: string
  companyIndustry?: string
  companySize?: string
  companyRevenue?: string
  companyDescription?: string

  // Contact info
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  phone?: string
  jobTitle?: string
  linkedinUrl?: string

  // Location
  city?: string
  state?: string
  country?: string

  // Metadata
  apolloId?: string
  confidence?: number // 0-100
  lastUpdated?: string
}

export interface EnrichedLead extends ApolloLead {
  // DeepSeek-R1 research
  deepResearch: {
    painPoints: string[]
    buyingSignals: string[]
    decisionMakers: string[]
    competitorInfo: string
    recentNews: string[]
    outreachStrategy: string
    emailSubject: string
    voicePitch: string
    confidence: number // 0-100
  }

  // Segmentation
  segment: 'cold' | 'warm' | 'hot'
  qualificationScore: number // 0-100

  // Recommended actions
  recommendedChannel: 'email' | 'voice' | 'both'
  estimatedCloseDate?: string
  estimatedDealValue?: number
}

export class ApolloService {
  private apiKey: string
  private baseURL = 'https://api.apollo.io/v1'

  constructor() {
    this.apiKey = process.env.APOLLO_API_KEY || ''

    if (!this.apiKey) {
      console.warn('⚠️ APOLLO_API_KEY not configured - lead search disabled')
    }
  }

  /**
   * Search for leads using Apollo API
   */
  async searchLeads(criteria: LeadSearchCriteria): Promise<ApolloLead[]> {
    if (!this.apiKey) {
      throw new Error('Apollo API key not configured')
    }

    try {
      console.log('🔍 Searching Apollo for leads:', criteria)

      // Build Apollo API query
      const query = this.buildApolloQuery(criteria)

      const response = await fetch(`${this.baseURL}/mixed_people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey
        },
        body: JSON.stringify(query)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Apollo API error: ${response.status} - ${error}`)
      }

      const data = await response.json()

      // Transform Apollo response to our format
      const leads = this.transformApolloResults(data)

      console.log(`✅ Found ${leads.length} leads from Apollo`)

      return leads

    } catch (error) {
      console.error('Apollo search error:', error)
      throw error
    }
  }

  /**
   * Enrich a single lead with DeepSeek-R1 research
   */
  async enrichLead(lead: ApolloLead): Promise<EnrichedLead> {
    const deepseek = getDeepSeekAI()

    const researchPrompt = `You are a B2B sales research expert. Analyze this lead and provide deep insights for outreach.

LEAD INFO:
Company: ${lead.companyName}
Industry: ${lead.companyIndustry || 'Unknown'}
Size: ${lead.companySize || 'Unknown'}
Revenue: ${lead.companyRevenue || 'Unknown'}
Contact: ${lead.fullName || lead.firstName + ' ' + lead.lastName}
Job Title: ${lead.jobTitle || 'Unknown'}
Location: ${lead.city}, ${lead.state}

RESEARCH REQUIREMENTS:
1. Identify 3-5 key pain points this company likely faces
2. Find buying signals or triggers (hiring, funding, expansion, etc.)
3. Identify decision makers and their priorities
4. Research their competitors
5. Recent company news or events
6. Best outreach strategy (email vs voice)
7. Craft compelling email subject line
8. Draft 30-second voice pitch
9. Qualification score (0-100) based on fit

Return JSON format:
{
  "painPoints": ["pain 1", "pain 2", ...],
  "buyingSignals": ["signal 1", ...],
  "decisionMakers": ["role 1: priorities", ...],
  "competitorInfo": "brief competitor analysis",
  "recentNews": ["news 1", ...],
  "outreachStrategy": "detailed strategy",
  "emailSubject": "compelling subject line",
  "voicePitch": "30-second phone pitch",
  "qualificationScore": 0-100,
  "confidence": 0-100
}`

    try {
      const research = await deepseek.complete(researchPrompt, {
        temperature: 0.4,
        maxTokens: 2000,
        showReasoning: false
      })

      const parsed = JSON.parse(research)

      // Determine segment based on qualification score
      let segment: 'cold' | 'warm' | 'hot'
      if (parsed.qualificationScore >= 75) segment = 'hot'
      else if (parsed.qualificationScore >= 50) segment = 'warm'
      else segment = 'cold'

      // Determine recommended channel
      const hasDirectContact = !!lead.phone
      const recommendedChannel = segment === 'hot' && hasDirectContact ? 'voice' :
                                 segment === 'warm' ? 'both' :
                                 'email'

      return {
        ...lead,
        deepResearch: {
          painPoints: parsed.painPoints || [],
          buyingSignals: parsed.buyingSignals || [],
          decisionMakers: parsed.decisionMakers || [],
          competitorInfo: parsed.competitorInfo || '',
          recentNews: parsed.recentNews || [],
          outreachStrategy: parsed.outreachStrategy || '',
          emailSubject: parsed.emailSubject || '',
          voicePitch: parsed.voicePitch || '',
          confidence: parsed.confidence || 0
        },
        segment,
        qualificationScore: parsed.qualificationScore || 0,
        recommendedChannel,
        estimatedCloseDate: this.estimateCloseDate(segment),
        estimatedDealValue: this.estimateDealValue(lead, segment)
      }

    } catch (error) {
      console.error('Lead enrichment error:', error)

      // Return basic enriched lead on error
      return {
        ...lead,
        deepResearch: {
          painPoints: [],
          buyingSignals: [],
          decisionMakers: [],
          competitorInfo: '',
          recentNews: [],
          outreachStrategy: 'Standard outreach sequence',
          emailSubject: `Quick question about ${lead.companyName}`,
          voicePitch: `Hi, I'm calling about solutions for ${lead.companyIndustry} companies...`,
          confidence: 0
        },
        segment: 'cold',
        qualificationScore: 50,
        recommendedChannel: 'email'
      }
    }
  }

  /**
   * Batch enrich multiple leads
   */
  async enrichLeads(leads: ApolloLead[]): Promise<EnrichedLead[]> {
    console.log(`🧠 Enriching ${leads.length} leads with DeepSeek-R1...`)

    const enriched: EnrichedLead[] = []

    // Process in batches of 5 to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(lead => this.enrichLead(lead))
      )
      enriched.push(...batchResults)

      console.log(`✅ Enriched ${enriched.length}/${leads.length} leads`)
    }

    return enriched
  }

  /**
   * Search and enrich leads in one call
   */
  async searchAndEnrichLeads(criteria: LeadSearchCriteria): Promise<EnrichedLead[]> {
    const rawLeads = await this.searchLeads(criteria)
    const enrichedLeads = await this.enrichLeads(rawLeads)
    return enrichedLeads
  }

  /**
   * Build Apollo API query from criteria
   */
  private buildApolloQuery(criteria: LeadSearchCriteria): any {
    const query: any = {
      page: 1,
      per_page: criteria.limit || 50,
      person_titles: criteria.jobTitles || ['Owner', 'CEO', 'President', 'Manager', 'Director'],
      q_organization_keyword_tags: criteria.industry || []
    }

    // Location filters
    if (criteria.location) {
      if (criteria.location.city) query.person_locations = [criteria.location.city]
      if (criteria.location.state) query.person_locations = [`${criteria.location.state}, USA`]
    }

    // Company size
    if (criteria.companySize) {
      const sizeRanges = []
      if (criteria.companySize.min && criteria.companySize.min < 10) sizeRanges.push('1-10')
      if (criteria.companySize.min && criteria.companySize.min < 50) sizeRanges.push('11-50')
      if (!criteria.companySize.max || criteria.companySize.max > 50) sizeRanges.push('51-200', '201-500', '501-1000', '1001+')
      query.organization_num_employees_ranges = sizeRanges
    }

    // Keywords
    if (criteria.keywords && criteria.keywords.length > 0) {
      query.q_keywords = criteria.keywords.join(' ')
    }

    return query
  }

  /**
   * Transform Apollo API response to our format
   */
  private transformApolloResults(data: any): ApolloLead[] {
    if (!data.people || !Array.isArray(data.people)) {
      return []
    }

    return data.people.map((person: any) => ({
      // Company info
      companyName: person.organization?.name || '',
      companyDomain: person.organization?.website_url || '',
      companyPhone: person.organization?.phone || '',
      companyIndustry: person.organization?.industry || '',
      companySize: person.organization?.estimated_num_employees?.toString() || '',
      companyRevenue: person.organization?.estimated_annual_revenue || '',
      companyDescription: person.organization?.short_description || '',

      // Contact info
      firstName: person.first_name || '',
      lastName: person.last_name || '',
      fullName: person.name || `${person.first_name} ${person.last_name}`,
      email: person.email || '',
      phone: person.phone_numbers?.[0]?.raw_number || '',
      jobTitle: person.title || '',
      linkedinUrl: person.linkedin_url || '',

      // Location
      city: person.city || '',
      state: person.state || '',
      country: person.country || 'USA',

      // Metadata
      apolloId: person.id || '',
      confidence: person.email_status === 'verified' ? 95 : 70,
      lastUpdated: new Date().toISOString()
    }))
  }

  /**
   * Estimate close date based on segment
   */
  private estimateCloseDate(segment: 'cold' | 'warm' | 'hot'): string {
    const now = new Date()
    const daysToAdd = segment === 'hot' ? 30 : segment === 'warm' ? 60 : 90
    now.setDate(now.getDate() + daysToAdd)
    return now.toISOString().split('T')[0]
  }

  /**
   * Estimate deal value based on company size and segment
   */
  private estimateDealValue(lead: ApolloLead, segment: 'cold' | 'warm' | 'hot'): number {
    // Base deal value on company size
    let baseValue = 5000 // Default for small companies

    if (lead.companySize) {
      const size = parseInt(lead.companySize.replace(/\D/g, ''))
      if (size > 500) baseValue = 20000
      else if (size > 100) baseValue = 12000
      else if (size > 50) baseValue = 8000
    }

    // Adjust based on segment (hot leads have higher likelihood)
    const segmentMultiplier = segment === 'hot' ? 1.5 : segment === 'warm' ? 1.0 : 0.7

    return Math.round(baseValue * segmentMultiplier)
  }
}

/**
 * Singleton instance
 */
let apolloServiceInstance: ApolloService | null = null

export function getApolloService(): ApolloService {
  if (!apolloServiceInstance) {
    apolloServiceInstance = new ApolloService()
  }
  return apolloServiceInstance
}

/**
 * Convenience function for quick lead search
 */
export async function searchLeads(criteria: LeadSearchCriteria): Promise<EnrichedLead[]> {
  const apollo = getApolloService()
  return apollo.searchAndEnrichLeads(criteria)
}

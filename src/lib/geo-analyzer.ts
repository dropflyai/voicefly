/**
 * GEO (Generative Engine Optimization) Analyzer
 * Powered by DeepSeek-R1 AI for 98% cost savings + superior reasoning
 *
 * Analyzes content for AI citation potential and provides actionable recommendations
 */

import { getDeepSeekAI } from './deepseek-ai'

export interface GEOScore {
  overall: number // 0-100
  breakdown: {
    freshness: number // 0-100
    structure: number // 0-100
    citations: number // 0-100
    directAnswers: number // 0-100
    aiReadability: number // 0-100
  }
}

export interface GEORecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: 'freshness' | 'structure' | 'citations' | 'content' | 'technical'
  issue: string
  recommendation: string
  impact: string // Expected impact if fixed
  effort: 'quick' | 'medium' | 'large' // Time to implement
}

export interface GEOAnalysisResult {
  score: GEOScore
  recommendations: GEORecommendation[]
  strengths: string[]
  weaknesses: string[]
  citationPotential: 'excellent' | 'good' | 'fair' | 'poor'
  estimatedCost: number // Cost of this analysis in dollars
}

export interface ContentMetadata {
  url: string
  title: string
  description?: string
  lastUpdated?: string
  wordCount: number
  headings: {
    h1: string[]
    h2: string[]
    h3: string[]
  }
  hasLists: boolean
  hasTables: boolean
  hasStatistics: boolean
  hasCitations: boolean
  hasSchema: boolean
}

/**
 * Analyze content for GEO optimization
 */
export async function analyzeContentForGEO(
  content: string,
  metadata: ContentMetadata
): Promise<GEOAnalysisResult> {
  const deepseek = getDeepSeekAI()
  const startTime = Date.now()
  const isOffPeak = deepseek.isOffPeakTime()

  // Construct analysis prompt
  const analysisPrompt = `You are a Generative Engine Optimization (GEO) expert. Analyze the following web content for optimization across AI platforms (ChatGPT, Claude, Perplexity, Gemini).

CONTENT METADATA:
- URL: ${metadata.url}
- Title: ${metadata.title}
- Description: ${metadata.description || 'N/A'}
- Last Updated: ${metadata.lastUpdated || 'Unknown'}
- Word Count: ${metadata.wordCount}
- H1 headings: ${metadata.headings.h1.join(', ') || 'None'}
- H2 headings: ${metadata.headings.h2.slice(0, 5).join(', ')}${metadata.headings.h2.length > 5 ? '...' : ''}
- Has Lists: ${metadata.hasLists}
- Has Tables: ${metadata.hasTables}
- Has Statistics: ${metadata.hasStatistics}
- Has Citations: ${metadata.hasCitations}
- Has Schema Markup: ${metadata.hasSchema}

CONTENT:
${content.slice(0, 8000)} ${content.length > 8000 ? '...[truncated]' : ''}

ANALYSIS FRAMEWORK:

1. FRESHNESS SCORE (0-100):
- Content age (2-3 months = excellent, 6+ months = poor)
- "Last Updated" date visibility
- Current year in title/content
- Recent statistics/data

2. STRUCTURE SCORE (0-100):
- Clear H1/H2/H3 hierarchy
- Direct answer in first 100 words
- Use of lists, tables, bullet points
- Short paragraphs (2-3 sentences)
- TL;DR summary presence

3. CITATIONS SCORE (0-100):
- Statistics with sources
- Expert quotes
- External citations
- Data and research
- Source credibility

4. DIRECT ANSWERS SCORE (0-100):
- Question answered immediately
- Clear, concise opening
- FAQ format presence
- Conversational tone
- No marketing fluff before answer

5. AI READABILITY SCORE (0-100):
- Can AI easily parse content?
- Schema markup present?
- Clear semantic HTML?
- Server-side rendered?
- No JS-dependent content?

Return JSON format:
{
  "scores": {
    "freshness": <0-100>,
    "structure": <0-100>,
    "citations": <0-100>,
    "directAnswers": <0-100>,
    "aiReadability": <0-100>
  },
  "recommendations": [
    {
      "priority": "critical|high|medium|low",
      "category": "freshness|structure|citations|content|technical",
      "issue": "Specific problem identified",
      "recommendation": "Exact action to take",
      "impact": "Expected result if fixed",
      "effort": "quick|medium|large"
    }
  ],
  "strengths": ["What's working well"],
  "weaknesses": ["What needs improvement"],
  "citationPotential": "excellent|good|fair|poor"
}`

  try {
    // Use DeepSeek-R1 for analysis (98% cheaper than GPT-4, better reasoning)
    const analysisResult = await deepseek.complete(analysisPrompt, {
      temperature: 0.3, // Lower temp for more consistent analysis
      maxTokens: 3000,
      showReasoning: false // Don't need reasoning output for this
    })

    // Parse AI response
    const parsed = JSON.parse(analysisResult)

    // Calculate overall score
    const scores = parsed.scores
    const overall = Math.round(
      (scores.freshness * 0.25 +
        scores.structure * 0.25 +
        scores.citations * 0.20 +
        scores.directAnswers * 0.20 +
        scores.aiReadability * 0.10)
    )

    // Estimate cost (DeepSeek-R1 pricing with potential cache hit and off-peak)
    const elapsedMs = Date.now() - startTime
    const estimatedTokens = content.length / 4 + 3000 // Rough estimate
    const inputTokens = estimatedTokens * 0.7
    const outputTokens = estimatedTokens * 0.3
    const cost = deepseek.estimateCost(inputTokens, outputTokens, {
      cacheHitRate: 0.3, // Conservative 30% cache hit estimate
      isOffPeak
    })

    return {
      score: {
        overall,
        breakdown: scores
      },
      recommendations: parsed.recommendations || [],
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      citationPotential: parsed.citationPotential || 'fair',
      estimatedCost: cost
    }
  } catch (error) {
    console.error('GEO analysis error:', error)
    throw new Error('Failed to analyze content for GEO')
  }
}

/**
 * Quick GEO scan (faster, cheaper, less detailed)
 */
export async function quickGEOScan(
  content: string,
  metadata: Partial<ContentMetadata>
): Promise<{ score: number; topIssues: string[] }> {
  const deepseek = getDeepSeekAI()

  const quickPrompt = `Analyze this content for AI citation potential. Return JSON with:
1. Overall score (0-100)
2. Top 3 issues to fix

Content: ${content.slice(0, 2000)}

Return format:
{
  "score": <0-100>,
  "topIssues": ["issue 1", "issue 2", "issue 3"]
}`

  try {
    const result = await deepseek.complete(quickPrompt, { temperature: 0.3, maxTokens: 500 })
    const parsed = JSON.parse(result)
    return {
      score: parsed.score || 0,
      topIssues: parsed.topIssues || []
    }
  } catch (error) {
    console.error('Quick GEO scan error:', error)
    return { score: 0, topIssues: ['Analysis failed'] }
  }
}

/**
 * Analyze competitor content
 */
export async function analyzeCompetitorGEO(
  competitorContent: string,
  competitorUrl: string
): Promise<{
  score: number
  strengths: string[]
  learnings: string[]
}> {
  const deepseek = getDeepSeekAI()

  const prompt = `Analyze this competitor's content for GEO optimization. Identify what they're doing well that we can learn from.

Competitor URL: ${competitorUrl}
Content: ${competitorContent.slice(0, 5000)}

Return JSON:
{
  "score": <0-100>,
  "strengths": ["What they do well for AI citations"],
  "learnings": ["What we can apply to our content"]
}`

  try {
    const result = await deepseek.complete(prompt, { temperature: 0.3, maxTokens: 2000 })
    return JSON.parse(result)
  } catch (error) {
    console.error('Competitor GEO analysis error:', error)
    return { score: 0, strengths: [], learnings: [] }
  }
}

/**
 * Generate GEO-optimized content rewrite suggestions
 */
export async function generateGEORewrite(
  originalContent: string,
  focusArea: 'intro' | 'structure' | 'citations' | 'faq'
): Promise<{
  original: string
  suggested: string
  improvements: string[]
}> {
  const deepseek = getDeepSeekAI()

  const prompts = {
    intro: `Rewrite the first 100 words to include a direct answer optimized for AI citations. Original: ${originalContent.slice(0, 500)}`,
    structure: `Restructure this content with clear H2/H3 headings, bullet points, and short paragraphs. Original: ${originalContent.slice(0, 1000)}`,
    citations: `Add 3-5 statistics with [citation needed] placeholders where sources should be added. Original: ${originalContent.slice(0, 1000)}`,
    faq: `Convert this content into a FAQ format with 5-10 questions and concise answers. Original: ${originalContent.slice(0, 1000)}`
  }

  const prompt = `${prompts[focusArea]}

Return JSON:
{
  "original": "excerpt of original",
  "suggested": "improved version",
  "improvements": ["what changed and why"]
}`

  try {
    const result = await deepseek.complete(prompt, { temperature: 0.5, maxTokens: 2000 })
    return JSON.parse(result)
  } catch (error) {
    console.error('GEO rewrite generation error:', error)
    return {
      original: originalContent.slice(0, 200),
      suggested: 'Rewrite failed',
      improvements: []
    }
  }
}

/**
 * Batch analyze multiple pages
 */
export async function batchAnalyzeGEO(
  pages: Array<{ url: string; content: string; metadata: Partial<ContentMetadata> }>
): Promise<Array<{
  url: string
  score: number
  topIssues: string[]
  priority: 'high' | 'medium' | 'low'
}>> {
  const results = []

  for (const page of pages) {
    try {
      const scan = await quickGEOScan(page.content, page.metadata)
      results.push({
        url: page.url,
        score: scan.score,
        topIssues: scan.topIssues,
        priority: (scan.score < 50 ? 'high' : scan.score < 70 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      })
    } catch (error) {
      console.error(`Failed to analyze ${page.url}:`, error)
      results.push({
        url: page.url,
        score: 0,
        topIssues: ['Analysis failed'],
        priority: 'high'
      })
    }
  }

  return results
}

/**
 * Monitor citation frequency across AI platforms
 * (Requires manual testing - returns checklist)
 */
export function generateCitationMonitoringChecklist(
  brandName: string,
  targetQueries: string[]
): {
  queries: Array<{
    query: string
    platforms: Array<{
      name: string
      url: string
      checkFor: string
    }>
  }>
} {
  const platforms = [
    { name: 'ChatGPT', url: 'https://chat.openai.com/', checkFor: `Mentions of ${brandName} in response or citations` },
    { name: 'Claude', url: 'https://claude.ai/', checkFor: `${brandName} cited or recommended` },
    { name: 'Perplexity', url: 'https://www.perplexity.ai/', checkFor: `${brandName} in citations section` },
    { name: 'Gemini', url: 'https://gemini.google.com/', checkFor: `${brandName} mentioned or linked` }
  ]

  return {
    queries: targetQueries.map(query => ({
      query,
      platforms
    }))
  }
}

/**
 * Calculate GEO ROI
 */
export function calculateGEOROI(
  currentScore: number,
  targetScore: number,
  monthlyTraffic: number,
  conversionRate: number,
  avgDealValue: number
): {
  potentialAICitations: number
  estimatedTrafficIncrease: number
  estimatedRevenueIncrease: number
  roi: number
} {
  // Assumptions based on research:
  // - Every 10 point GEO score increase = +5% AI citation rate
  // - AI citations drive 2-3% traffic increase per 10 points

  const scoreIncrease = targetScore - currentScore
  const citationRateIncrease = (scoreIncrease / 10) * 0.05
  const trafficIncrease = Math.round(monthlyTraffic * (scoreIncrease / 10) * 0.025)
  const newConversions = trafficIncrease * conversionRate
  const revenueIncrease = newConversions * avgDealValue

  // Cost of GEO optimization (conservative estimate)
  const optimizationCost = 2000 // One-time content updates

  return {
    potentialAICitations: Math.round(citationRateIncrease * 100),
    estimatedTrafficIncrease: trafficIncrease,
    estimatedRevenueIncrease: Math.round(revenueIncrease),
    roi: Math.round(((revenueIncrease * 12 - optimizationCost) / optimizationCost) * 100)
  }
}

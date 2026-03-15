/**
 * Extract From Website API
 *
 * POST /api/phone-employees/extract-from-website
 *
 * Fetches a URL server-side and uses Claude to extract structured
 * business configuration data for the given phone employee job type.
 *
 * Improvements over v1:
 * - Schema.org (ld+json) extraction before Claude is called
 * - Multi-page crawl: up to 4 high-value subpages fetched in parallel
 * - Combined text (homepage + subpages) sent to Claude, capped at 12 000 chars
 * - Response includes pagesScanned count
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { validateBusinessAccess } from '@/lib/api-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ============================================
// SCHEMA.ORG EXTRACTION
// ============================================

function extractSchemaOrg(html: string): Record<string, any> {
  const schemas: any[] = []
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1])
      // Handle both single object and @graph arrays
      if (Array.isArray(parsed['@graph'])) {
        schemas.push(...parsed['@graph'])
      } else if (Array.isArray(parsed)) {
        schemas.push(...parsed)
      } else {
        schemas.push(parsed)
      }
    } catch {}
  }

  const result: Record<string, any> = {}

  for (const schema of schemas) {
    const type = schema['@type']

    // Hours — works for LocalBusiness, Restaurant, etc.
    if (schema.openingHours) {
      result.hours = Array.isArray(schema.openingHours)
        ? schema.openingHours.join(', ')
        : schema.openingHours
    }
    if (schema.openingHoursSpecification) {
      result.hoursSpec = schema.openingHoursSpecification
    }

    // Address
    if (schema.address) {
      const a = schema.address
      result.address = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode]
        .filter(Boolean)
        .join(', ')
    }

    // Phone
    if (schema.telephone) result.phone = schema.telephone

    // Business description
    if (schema.description && !result.description) result.description = schema.description

    // Business name
    if (schema.name && !result.businessName) result.businessName = schema.name

    // FAQ
    if (type === 'FAQPage' && schema.mainEntity) {
      result.faqs = (Array.isArray(schema.mainEntity) ? schema.mainEntity : [schema.mainEntity])
        .map((item: any) => ({
          question: item.name || item.question || '',
          answer:
            typeof item.acceptedAnswer === 'object'
              ? item.acceptedAnswer.text
              : item.answer || '',
          keywords: [],
        }))
        .filter((f: any) => f.question && f.answer)
    }

    // Menu (Restaurant)
    if (type === 'Restaurant' && schema.hasMenu) {
      result.menuUrl = typeof schema.hasMenu === 'string' ? schema.hasMenu : schema.hasMenu?.url
    }
    if (schema.servesCuisine) result.cuisine = schema.servesCuisine

    // Services / Offers
    if (schema.makesOffer || schema.hasOfferCatalog) {
      const offers = schema.makesOffer || schema.hasOfferCatalog?.offerCatalog || []
      if (Array.isArray(offers) && offers.length > 0) {
        result.services = offers
          .map((o: any) => ({
            name: o.name || o.itemOffered?.name || '',
            description: o.description || o.itemOffered?.description || '',
            price: o.price || o.priceSpecification?.price || null,
          }))
          .filter((s: any) => s.name)
      }
    }

    // Staff / employees
    if (schema.employee || schema.member) {
      const people = schema.employee || schema.member || []
      result.staff = (Array.isArray(people) ? people : [people])
        .map((p: any) => ({ name: p.name, role: p.jobTitle || '' }))
        .filter((p: any) => p.name)
    }
  }

  return result
}

// ============================================
// MULTI-PAGE CRAWL HELPERS
// ============================================

const HIGH_VALUE_PATTERNS = [
  /\/(faq|faqs|frequently-asked|questions)/i,
  /\/(menu|food|drink|specials)/i,
  /\/(services|service|what-we-do|offerings)/i,
  /\/(about|about-us|our-team|team|staff)/i,
  /\/(contact|contact-us|location|hours)/i,
  /\/(book|booking|schedule|appointments|reservations)/i,
  /\/(policy|policies|returns|refunds|warranty|terms)/i,
  /\/(prices|pricing|rates|packages|plans)/i,
]

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl)
  const links: Set<string> = new Set()
  const regex = /href=["']([^"'#?]+)["']/gi
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1]
      const url = new URL(href, base.origin)
      // Same origin only, not the homepage itself
      if (
        url.hostname === base.hostname &&
        url.pathname !== '/' &&
        url.pathname !== base.pathname
      ) {
        links.add(url.href.split('?')[0]) // strip query params
      }
    } catch {}
  }
  return Array.from(links)
}

function scoreLink(url: string): number {
  for (let i = 0; i < HIGH_VALUE_PATTERNS.length; i++) {
    if (HIGH_VALUE_PATTERNS[i].test(url)) return HIGH_VALUE_PATTERNS.length - i
  }
  return 0
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ============================================
// EXTRACTION PROMPT BUILDER
// ============================================

function buildExtractionPrompt(text: string, jobType: string, schemaContext: string = ''): string {
  return `Extract business information from this website content for setting up a ${jobType} phone employee.

Return a JSON object with these fields (omit fields you can't find, use empty arrays not null):
- businessDescription: string (1-2 sentence summary of what the business does)
- address: string (full street address if found)
- phone: string (main business phone number)
- hours: string (business hours if mentioned, e.g. "Mon-Fri 9am-5pm")
- detectedIndustry: string (must be one of: "Medical / Healthcare", "Dental", "Law Firm", "Real Estate", "Beauty / Salon / Spa", "Fitness & Wellness", "Home Services", "Restaurant / Food", "Retail", "General Business")
- services: { name: string, duration?: number, description?: string, price?: number }[] (all services/offerings found)
- faqs: array of { question: string, answer: string, keywords: string[] } (up to 10 common caller questions with answers from the content)
- staff: { name: string, role: string }[] (team members, stylists, doctors, etc.)
- policies: { cancellation?: string, booking?: string, returns?: string, warranty?: string, lateFee?: string } (any policies mentioned)
- paymentMethods: string[] (e.g. ["Cash", "Visa", "Mastercard", "Apple Pay"])
- parkingInfo: string (parking or directions info if mentioned)
- socialMedia: { platform: string, url: string }[] (social media links found)
- brandTone: string (one of: "professional", "friendly", "luxury", "casual", "clinical" — infer from the writing style)
- promotions: string[] (any current deals, discounts, or special offers)
${jobType === 'order-taker' ? '- menu: { categories: { name: string, items: { name: string, price: number, description?: string }[] }[] }' : ''}
${jobType === 'appointment-scheduler' ? '- appointmentTypes: { name: string, duration: number, description?: string, price?: number }[]' : ''}
${jobType === 'customer-service' ? '- supportedProducts: string[]\n- commonIssues: { issue: string, resolution: string }[]' : ''}
${schemaContext}
Website content:
${text}

Return only valid JSON. No explanation.`
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, jobType, businessId } = body

    // Validate required fields
    if (!url || !jobType || !businessId) {
      return NextResponse.json(
        { error: 'url, jobType, and businessId are required' },
        { status: 400 }
      )
    }

    // Auth check — JWT required
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. Fetch homepage
    let homeHtml: string
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        return NextResponse.json({ error: 'Could not fetch that URL' }, { status: 422 })
      }
      homeHtml = await res.text()
    } catch {
      return NextResponse.json({ error: 'Could not fetch that URL' }, { status: 422 })
    }

    // 2. Extract Schema.org from homepage
    const schemaData = extractSchemaOrg(homeHtml)

    // 3. Find and fetch high-value subpages (up to 4, in parallel)
    const allLinks = extractInternalLinks(homeHtml, url)
    const scored = allLinks
      .map(link => ({ link, score: scoreLink(link) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ link }) => link)

    const subpageHtmls = await Promise.all(scored.map(fetchPage))

    // Extract Schema.org from subpages too and merge (subpage fills gaps)
    for (const html of subpageHtmls) {
      if (!html) continue
      const subSchema = extractSchemaOrg(html)
      if (subSchema.faqs?.length && !schemaData.faqs?.length) schemaData.faqs = subSchema.faqs
      if (subSchema.hours && !schemaData.hours) schemaData.hours = subSchema.hours
      if (subSchema.address && !schemaData.address) schemaData.address = subSchema.address
      if (subSchema.staff?.length && !schemaData.staff?.length) schemaData.staff = subSchema.staff
      if (subSchema.services?.length && !schemaData.services?.length)
        schemaData.services = subSchema.services
    }

    // 4. Build combined text for Claude (homepage + subpages, capped)
    const homeText = stripHtml(homeHtml).slice(0, 4000)
    const subTexts = subpageHtmls
      .filter((h): h is string => h !== null)
      .map(h => stripHtml(h).slice(0, 2000))
      .join('\n\n---\n\n')
    const combinedText = [homeText, subTexts].filter(Boolean).join('\n\n---\n\n').slice(0, 12000)

    // 5. Build schema context string to inject into the prompt
    const schemaContext =
      Object.keys(schemaData).length > 0
        ? `\n\nStructured data already extracted (use this, don't re-extract):\n${JSON.stringify(schemaData, null, 2)}\n`
        : ''

    // 6. Call Claude for extraction
    const extractionPrompt = buildExtractionPrompt(combinedText, jobType, schemaContext)
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      messages: [{ role: 'user', content: extractionPrompt }],
    })

    const rawContent = response.content[0]
    const rawText = rawContent.type === 'text' ? rawContent.text : ''

    let parsedData: unknown
    try {
      // Strip markdown code fences if present
      const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
      parsedData = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        { error: 'Could not extract information from that page. Try uploading a document instead.' },
        { status: 422 }
      )
    }

    // Merge Schema.org data as fallbacks (Claude extraction takes priority)
    const extracted = parsedData as Record<string, any>
    if (schemaData.address && !extracted.address) extracted.address = schemaData.address
    if (schemaData.phone && !extracted.phone) extracted.phone = schemaData.phone
    if (schemaData.hours && !extracted.hours) extracted.hours = schemaData.hours
    if (schemaData.businessName && !extracted.businessName) extracted.businessName = schemaData.businessName
    if (schemaData.staff?.length && !extracted.staff?.length) extracted.staff = schemaData.staff
    if (schemaData.faqs?.length && !extracted.faqs?.length) extracted.faqs = schemaData.faqs
    if (schemaData.services?.length && !extracted.services?.length) extracted.services = schemaData.services

    return NextResponse.json({
      success: true,
      extracted,
      source: 'website',
      pagesScanned: 1 + scored.length,
    })
  } catch (error: any) {
    console.error('Extract from website error:', error)
    return NextResponse.json(
      { error: 'Failed to extract information from website' },
      { status: 500 }
    )
  }
}

/**
 * Extract From Document API
 *
 * POST /api/phone-employees/extract-from-document
 *
 * Accepts a multipart form upload (PDF, DOCX, TXT, MD) and uses Claude
 * to extract structured business configuration data for the given phone
 * employee job type.
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import mammoth from 'mammoth'
import { validateBusinessAccess } from '@/lib/api-auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ============================================
// EXTRACTION PROMPT BUILDER
// ============================================

function buildExtractionPrompt(text: string, jobType: string): string {
  return `Extract business information from this website content for setting up a ${jobType} phone employee.

Return a JSON object with these fields (omit fields you can't find, use empty arrays not null):
- businessDescription: string (1-2 sentence summary of what the business does)
- faqs: array of { question: string, answer: string, keywords: string[] } (up to 10 common caller questions with answers from the content)
- hours: string (business hours if mentioned, e.g. "Mon-Fri 9am-5pm")
- policies: { cancellation?: string, returns?: string, warranty?: string } (any policies mentioned)
${jobType === 'order-taker' ? '- menu: { categories: { name: string, items: { name: string, price: number, description?: string }[] }[] }' : ''}
${jobType === 'appointment-scheduler' ? '- appointmentTypes: { name: string, duration: number, description?: string, price?: number }[]' : ''}
${jobType === 'receptionist' || jobType === 'appointment-scheduler' ? '- services: { name: string, duration?: number, description?: string, price?: number }[]' : ''}
${jobType === 'customer-service' ? '- supportedProducts: string[]\n- commonIssues: { issue: string, resolution: string }[]' : ''}

Website content:
${text}

Return only valid JSON. No explanation.`
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const jobType = formData.get('jobType') as string
    const businessId = formData.get('businessId') as string

    // Validate required fields
    if (!file || !jobType || !businessId) {
      return NextResponse.json(
        { error: 'file, jobType, and businessId are required' },
        { status: 400 }
      )
    }

    // Auth check
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // File size check (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    const mimeType = file.type

    const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf')
    const isDocx =
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    const isText = mimeType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')

    if (!isPdf && !isDocx && !isText) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, Word document, or text file.' },
        { status: 400 }
      )
    }

    let response: Anthropic.Message

    if (isPdf) {
      // Use Anthropic native PDF support
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 },
              },
              {
                type: 'text',
                text: buildExtractionPrompt('', jobType),
              },
            ],
          },
        ],
      })
    } else if (isDocx) {
      const arrayBuffer = await file.arrayBuffer()
      const { value: text } = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) })
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: buildExtractionPrompt(text.slice(0, 12000), jobType) }],
      })
    } else {
      // TXT or MD
      const text = await file.text()
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: buildExtractionPrompt(text.slice(0, 12000), jobType) }],
      })
    }

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

    return NextResponse.json({
      success: true,
      extracted: parsedData,
      source: 'document',
    })
  } catch (error: any) {
    console.error('Extract from document error:', error)
    return NextResponse.json(
      { error: 'Failed to extract information from document' },
      { status: 500 }
    )
  }
}

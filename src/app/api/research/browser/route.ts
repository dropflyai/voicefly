import { NextRequest, NextResponse } from 'next/server'
import { getBrowserService, closeBrowserService } from '@/lib/browser-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface BrowserResearchRequest {
  url?: string
  query?: string
  mode: 'navigate' | 'extract' | 'search'
  selectors?: { [key: string]: string }
  screenshot?: boolean
  businessId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: BrowserResearchRequest = await request.json()
    const { url, query, mode, selectors, screenshot, businessId } = body

    if (!mode) {
      return NextResponse.json(
        { error: 'Mode is required (navigate, extract, or search)' },
        { status: 400 }
      )
    }

    const browserService = getBrowserService()
    let result

    switch (mode) {
      case 'navigate':
        if (!url) {
          return NextResponse.json(
            { error: 'URL is required for navigate mode' },
            { status: 400 }
          )
        }
        result = await browserService.navigateAndExtract(url, { screenshot })
        break

      case 'extract':
        if (!url || !selectors) {
          return NextResponse.json(
            { error: 'URL and selectors are required for extract mode' },
            { status: 400 }
          )
        }
        result = await browserService.extractStructuredData(url, selectors)
        break

      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for search mode' },
            { status: 400 }
          )
        }
        result = await browserService.searchAndExtract(query, {
          maxResults: 10
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid mode. Use navigate, extract, or search' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      mode,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Browser research error:', error)
    return NextResponse.json(
      {
        error: 'Browser research failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    modes: {
      navigate: {
        description: 'Navigate to a URL and extract full page content',
        params: { url: 'string', screenshot: 'boolean (optional)' }
      },
      extract: {
        description: 'Extract specific elements from a page using CSS selectors',
        params: { url: 'string', selectors: 'object' }
      },
      search: {
        description: 'Perform a web search and extract results',
        params: { query: 'string', maxResults: 'number (optional)' }
      }
    },
    examples: {
      navigate: {
        url: 'https://example.com',
        mode: 'navigate',
        screenshot: true
      },
      extract: {
        url: 'https://example.com',
        mode: 'extract',
        selectors: {
          title: 'h1',
          description: 'p.description',
          links: 'a[]'  // [] suffix for multiple elements
        }
      },
      search: {
        query: 'medical practice management software',
        mode: 'search'
      }
    }
  })
}

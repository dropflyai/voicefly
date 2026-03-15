import { NextRequest, NextResponse } from 'next/server'
import { getBrowserService, closeBrowserService } from '@/lib/browser-service'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Internal/private IP ranges that must be blocked to prevent SSRF
const BLOCKED_IP_PATTERNS = [
  /^127\./,                          // 127.0.0.0/8 loopback
  /^10\./,                           // 10.0.0.0/8 private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 private
  /^192\.168\./,                     // 192.168.0.0/16 private
  /^169\.254\./,                     // 169.254.0.0/16 link-local
  /^0\./,                            // 0.0.0.0/8
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 unique local
  /^fe80:/i,                         // IPv6 link-local
]

const BLOCKED_HOSTNAMES = ['localhost', '0.0.0.0', '[::1]']

function isBlockedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString)
    const hostname = parsed.hostname.toLowerCase()

    // Block known internal hostnames
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return true
    }

    // Block internal IP ranges
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return true
      }
    }

    return false
  } catch {
    // If URL cannot be parsed, block it
    return true
  }
}

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
    // Authenticate: require a valid Supabase JWT
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: invalid or expired token' },
        { status: 401 }
      )
    }

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
        if (isBlockedUrl(url)) {
          return NextResponse.json(
            { error: 'URL targets a blocked internal address' },
            { status: 403 }
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
        if (isBlockedUrl(url)) {
          return NextResponse.json(
            { error: 'URL targets a blocked internal address' },
            { status: 403 }
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

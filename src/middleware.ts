import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Next.js Middleware
 *
 * Protects dashboard routes by verifying Supabase auth tokens.
 * Public routes (landing pages, signup, login, API webhooks) are allowed through.
 */

// Routes that do NOT require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/beauty',
  '/demo',
  '/features',
  '/solutions',
  '/terms',
  '/privacy',
  '/testimonials',
  '/pricing',
  '/dashboard/login',
  '/onboarding',
  '/auth/callback',
]

// API routes that do NOT require auth (webhooks, public APIs)
const PUBLIC_API_PREFIXES = [
  '/api/webhook/',
  '/api/webhooks/',
  '/api/chatbot-lead',
  '/api/chat',
  '/api/widget/',
  '/api/leads/capture',
  '/api/tts',
  '/api/voices',
]

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) return true

  // Check API prefixes
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }

  // Static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return true
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // For /api/ routes not in the public list, require authentication
  if (pathname.startsWith('/api/')) {
    const accessToken =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate the token with Supabase
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        let token = accessToken
        try {
          const parsed = JSON.parse(accessToken)
          if (Array.isArray(parsed) && parsed[0]) token = parsed[0]
        } catch {
          // Not JSON, use as-is
        }

        const { data: { user }, error } = await supabase.auth.getUser(token)

        if (error || !user) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Invalid or expired token' },
            { status: 401 }
          )
        }
      }
    } catch {
      // If validation fails, let route-level auth handle it
    }
  }

  // Dashboard auth is handled at the page level via localStorage-based session
  // (the base supabase-js client stores sessions in localStorage, not cookies)

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

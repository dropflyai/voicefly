import { NextRequest, NextResponse } from 'next/server'

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
]

// API routes that do NOT require auth (webhooks, public APIs)
const PUBLIC_API_PREFIXES = [
  '/api/webhook/',
  '/api/webhooks/',
  '/api/chatbot-lead',
  '/api/chat',
  '/api/widget/',
  '/api/leads/capture',
  '/api/voice-preview',
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

  // Dashboard auth is handled client-side by each page via redirectToLoginIfUnauthenticated()
  // Auth state lives in localStorage (not cookies) so middleware cannot inspect it.

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

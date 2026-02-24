/**
 * Calendly OAuth Authorize
 *
 * GET /api/integrations/calendly/oauth?businessId=xxx
 *
 * Redirects the user to Calendly's OAuth authorization page.
 * The businessId is passed through the `state` parameter so we know
 * which business to associate the token with on callback.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  const businessId = request.nextUrl.searchParams.get('businessId')
  if (!businessId) {
    return NextResponse.json({ error: 'businessId required' }, { status: 400 })
  }

  const authResult = await validateBusinessAccess(request, businessId)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = process.env.CALENDLY_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Calendly OAuth not configured' }, { status: 500 })
  }

  const from = request.nextUrl.searchParams.get('from')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/integrations/calendly/oauth/callback`

  // Encode businessId + user token in state so the callback can verify and associate
  const state = Buffer.from(JSON.stringify({
    businessId,
    // Include a random nonce for CSRF protection
    nonce: Math.random().toString(36).substring(2, 15),
    // Pass through the origin page so the callback can redirect back
    ...(from ? { from } : {}),
  })).toString('base64url')

  const authUrl = new URL('https://auth.calendly.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}

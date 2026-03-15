/**
 * Square OAuth Authorize
 *
 * POST /api/integrations/square/authorize
 * Body: { businessId }
 * Returns: { authUrl }
 *
 * Generates the Square OAuth URL that the user should be redirected to.
 */

import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { validateBusinessAccess } from '@/lib/api-auth'

const SQUARE_OAUTH_BASE = 'https://connect.squareup.com'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const applicationId = process.env.SQUARE_APPLICATION_ID
    if (!applicationId) {
      return NextResponse.json(
        { error: 'Square application not configured' },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/integrations/square/callback`

    const scopes = [
      'MERCHANT_PROFILE_READ',
      'ORDERS_READ',
      'ORDERS_WRITE',
      'ITEMS_READ',
    ].join('+')

    // state = base64({ businessId, nonce }) for CSRF protection
    const nonce = randomUUID()
    const state = Buffer.from(JSON.stringify({ businessId, nonce })).toString('base64url')

    const authUrl =
      `${SQUARE_OAUTH_BASE}/oauth2/authorize` +
      `?client_id=${applicationId}` +
      `&scope=${scopes}` +
      `&session=false` +
      `&state=${state}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`

    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('[Square Authorize] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

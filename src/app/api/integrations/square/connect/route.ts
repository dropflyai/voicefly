/**
 * Square Manual Connect
 *
 * POST /api/integrations/square/connect
 * Body: { businessId, accessToken, locationId? }
 *
 * Validates a Square access token and stores the integration credentials
 * in business_integrations for later catalog syncs.
 *
 * Note: This is for manual token-based connections. For OAuth-based
 * connections (recommended), use /api/integrations/square/authorize instead.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { validateSquareToken } from '@/lib/integrations/square-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, accessToken, locationId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Validate the Square token before storing
    const tokenCheck = await validateSquareToken(accessToken)
    if (!tokenCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid Square access token', detail: tokenCheck.error },
        { status: 400 }
      )
    }

    const merchantName = tokenCheck.merchantName

    // Upsert into business_integrations
    const { error: upsertError } = await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'square',
          status: 'connected',
          credentials: {
            accessToken,
            ...(locationId ? { locationId } : {}),
          },
          config: {
            ...(merchantName ? { merchantName } : {}),
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )

    if (upsertError) {
      console.error('[Square Connect] Failed to upsert integration:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save Square connection' },
        { status: 500 }
      )
    }

    console.log(
      `[Square Connect] Connected Square for business ${businessId}` +
        (merchantName ? ` (${merchantName})` : '')
    )

    return NextResponse.json({
      success: true,
      ...(merchantName ? { merchantName } : {}),
    })
  } catch (error: any) {
    console.error('[Square Connect] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

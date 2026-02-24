/**
 * HubSpot Connect API
 *
 * POST /api/integrations/hubspot/connect - Store Private App Token connection
 *
 * Dedicated endpoint for the initial connection flow.
 * Validates the token against HubSpot and stores it if valid.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { HubSpotService } from '@/lib/hubspot-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, token } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!token) {
      return NextResponse.json(
        { error: 'HubSpot Private App token required' },
        { status: 400 }
      )
    }

    // Validate that the token looks reasonable (HubSpot private app tokens start with "pat-")
    if (typeof token !== 'string' || token.trim().length < 10) {
      return NextResponse.json(
        { error: 'Invalid token format. HubSpot Private App tokens typically start with "pat-".' },
        { status: 400 }
      )
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Attempt to connect
    const result = await HubSpotService.connectWithToken(businessId, token.trim())

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      portalId: result.portalId,
      message: 'Successfully connected to HubSpot.',
    })
  } catch (error: any) {
    console.error('[API] HubSpot connect error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

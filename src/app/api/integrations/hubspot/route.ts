/**
 * HubSpot Integration API
 *
 * GET  /api/integrations/hubspot?businessId=xxx  - Get connection status
 * POST /api/integrations/hubspot                  - Perform actions (connect, verify, update-settings, disconnect)
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { HubSpotService } from '@/lib/hubspot-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const status = await HubSpotService.getConnectionStatus(businessId)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('[API] HubSpot GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, action, token, settings } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    switch (action) {
      case 'connect': {
        if (!token) {
          return NextResponse.json({ error: 'Token required for connect action' }, { status: 400 })
        }
        const result = await HubSpotService.connectWithToken(businessId, token)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          portalId: result.portalId,
          message: 'Successfully connected to HubSpot.',
        })
      }

      case 'verify': {
        const result = await HubSpotService.verifyConnection(businessId)
        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error,
          }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'HubSpot connection verified.',
        })
      }

      case 'update-settings': {
        if (!settings || typeof settings !== 'object') {
          return NextResponse.json({ error: 'Settings object required' }, { status: 400 })
        }
        const result = await HubSpotService.updateSettings(businessId, settings)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'HubSpot settings updated.',
        })
      }

      case 'disconnect': {
        const result = await HubSpotService.disconnect(businessId)
        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Disconnected from HubSpot.',
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: connect, verify, update-settings, disconnect` },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('[API] HubSpot POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/sms-registration/status?businessId=...
 * POST /api/sms-registration/status (with { businessId, advance: true })
 *
 * GET returns the current registration state.
 * POST with advance=true polls Twilio and advances the state machine.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { getRegistrationForBusiness, checkAndAdvance } from '@/lib/a2p/service'

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const registration = await getRegistrationForBusiness(businessId)
    return NextResponse.json({ registration })
  } catch (err: any) {
    console.error('[sms-registration/status GET]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to load status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body as { businessId: string }

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const registration = await checkAndAdvance(businessId)
    return NextResponse.json({ success: true, registration })
  } catch (err: any) {
    console.error('[sms-registration/status POST]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to advance status' },
      { status: 500 }
    )
  }
}

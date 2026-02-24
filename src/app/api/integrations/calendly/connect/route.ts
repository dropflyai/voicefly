/**
 * Calendly Manual Connect
 *
 * POST /api/integrations/calendly/connect
 * Body: { businessId, accessToken }
 *
 * Validates a Calendly personal access token and stores the integration
 * credentials in business_integrations for later event type syncs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { validateCalendlyToken, syncCalendlyAccount } from '@/lib/integrations/calendly-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, accessToken } = body

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

    // Validate the Calendly token before storing
    const tokenCheck = await validateCalendlyToken(accessToken)
    if (!tokenCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid Calendly access token', detail: tokenCheck.error },
        { status: 400 }
      )
    }

    const { userName, email: userEmail } = tokenCheck

    // Fetch user URI and scheduling URL for the webhook to use
    let schedulingUrl: string | null = null
    let userUri: string | null = null
    try {
      const syncResult = await syncCalendlyAccount(accessToken)
      schedulingUrl = syncResult.schedulingUrl
      userUri = syncResult.userName ? syncResult.schedulingUrl : null
    } catch {}

    // Upsert into business_integrations
    const { error: upsertError } = await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'calendly',
          status: 'connected',
          credentials: {
            accessToken,
          },
          config: {
            ...(userName ? { userName } : {}),
            ...(userEmail ? { userEmail } : {}),
            ...(schedulingUrl ? { schedulingUrl } : {}),
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )

    if (upsertError) {
      console.error('[Calendly Connect] Failed to upsert integration:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save Calendly connection' },
        { status: 500 }
      )
    }

    console.log(
      `[Calendly Connect] Connected Calendly for business ${businessId}` +
        (userName ? ` (${userName})` : '')
    )

    return NextResponse.json({
      success: true,
      ...(userName ? { userName } : {}),
      ...(userEmail ? { userEmail } : {}),
    })
  } catch (error: any) {
    console.error('[Calendly Connect] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

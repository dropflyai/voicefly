/**
 * Toast Manual Connect
 *
 * POST /api/integrations/toast/connect
 * Body: { businessId, clientId, clientSecret, restaurantGuid, useSandbox? }
 *
 * Validates Toast OAuth credentials and stores the integration in
 * business_integrations for later menu syncs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { validateToastCredentials } from '@/lib/integrations/toast-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, clientId, clientSecret, restaurantGuid, useSandbox = true } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 })
    }

    if (!clientSecret) {
      return NextResponse.json({ error: 'Client secret required' }, { status: 400 })
    }

    if (!restaurantGuid) {
      return NextResponse.json({ error: 'Restaurant GUID required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Validate the Toast credentials before storing
    const credentialCheck = await validateToastCredentials(
      clientId,
      clientSecret,
      restaurantGuid,
      useSandbox
    )
    if (!credentialCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid Toast credentials', detail: credentialCheck.error },
        { status: 400 }
      )
    }

    const restaurantName = credentialCheck.restaurantName

    // Upsert into business_integrations
    const { error: upsertError } = await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'toast',
          status: 'connected',
          credentials: {
            clientId,
            clientSecret,
            restaurantGuid,
            useSandbox,
          },
          config: {
            ...(restaurantName ? { restaurantName } : {}),
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )

    if (upsertError) {
      console.error('[Toast Connect] Failed to upsert integration:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save Toast connection' },
        { status: 500 }
      )
    }

    console.log(
      `[Toast Connect] Connected Toast for business ${businessId}` +
        (restaurantName ? ` (${restaurantName})` : '') +
        (useSandbox ? ' [sandbox]' : '')
    )

    return NextResponse.json({
      success: true,
      ...(restaurantName ? { restaurantName } : {}),
      sandboxMode: useSandbox,
    })
  } catch (error: any) {
    console.error('[Toast Connect] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * Clover Manual Connect
 *
 * POST /api/integrations/clover/connect
 * Body: { businessId, accessToken, merchantId }
 *
 * Validates Clover credentials and stores the integration in
 * business_integrations for later catalog syncs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { validateCloverCredentials } from '@/lib/integrations/clover-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, accessToken, merchantId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Validate the Clover credentials before storing
    const credentialCheck = await validateCloverCredentials(accessToken, merchantId)
    if (!credentialCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid Clover credentials', detail: credentialCheck.error },
        { status: 400 }
      )
    }

    const merchantName = credentialCheck.merchantName

    // Upsert into business_integrations
    const { error: upsertError } = await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'clover',
          status: 'connected',
          credentials: {
            accessToken,
            merchantId,
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
      console.error('[Clover Connect] Failed to upsert integration:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save Clover connection' },
        { status: 500 }
      )
    }

    console.log(
      `[Clover Connect] Connected Clover for business ${businessId}` +
        (merchantName ? ` (${merchantName})` : '')
    )

    return NextResponse.json({
      success: true,
      ...(merchantName ? { merchantName } : {}),
    })
  } catch (error: any) {
    console.error('[Clover Connect] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

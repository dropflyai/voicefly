/**
 * Square Connection Status
 *
 * GET /api/integrations/square/status?businessId=xxx
 *
 * Returns the current Square connection status for a business.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('square_connections')
      .select('square_location_id, last_synced_at, auto_sync_enabled, is_active')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return NextResponse.json({
        connected: false,
        locationId: null,
        lastSyncedAt: null,
        autoSyncEnabled: false,
      })
    }

    return NextResponse.json({
      connected: true,
      locationId: data.square_location_id,
      lastSyncedAt: data.last_synced_at,
      autoSyncEnabled: data.auto_sync_enabled,
    })
  } catch (error: any) {
    console.error('[Square Status] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

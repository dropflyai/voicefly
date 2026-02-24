/**
 * Square Disconnect
 *
 * POST /api/integrations/square/disconnect
 * Body: { businessId }
 *
 * Deactivates the Square connection for a business.
 * Does not delete the row -- just sets is_active = false.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    const { error } = await supabase
      .from('square_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', businessId)

    if (error) {
      console.error('[Square Disconnect] DB error:', error)
      return NextResponse.json({ error: 'Failed to disconnect Square' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Square disconnected' })
  } catch (error: any) {
    console.error('[Square Disconnect] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

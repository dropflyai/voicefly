/**
 * Business Integrations - Platform Route
 *
 * DELETE /api/integrations/[platform] - Disconnect an integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')
    const { platform } = params

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('business_integrations')
      .delete()
      .eq('business_id', businessId)
      .eq('platform', platform)

    if (error) {
      console.error('[API] Failed to delete integration:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API] Failed to delete integration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

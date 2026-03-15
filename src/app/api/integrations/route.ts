/**
 * Business Integrations API
 *
 * GET  /api/integrations - List all integrations for a business
 * POST /api/integrations - Create or update an integration (upsert)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import type { BusinessIntegration } from '@/lib/integrations/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

function rowToIntegration(row: any): BusinessIntegration {
  return {
    id: row.id,
    businessId: row.business_id,
    platform: row.platform,
    status: row.status,
    config: row.config ?? {},
    lastSyncedAt: row.last_synced_at ?? null,
    syncError: row.sync_error ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const [{ data, error }, { data: hubspotConn }] = await Promise.all([
      supabase
        .from('business_integrations')
        .select('id, business_id, platform, status, config, last_synced_at, sync_error, created_at, updated_at')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true }),
      supabase
        .from('hubspot_connections')
        .select('id, business_id, is_connected, portal_id, updated_at')
        .eq('business_id', businessId)
        .eq('is_connected', true)
        .maybeSingle(),
    ])

    if (error) {
      console.error('[API] Failed to fetch integrations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const integrations: BusinessIntegration[] = (data ?? []).map(rowToIntegration)

    // Merge HubSpot connection status from its dedicated table
    if (hubspotConn) {
      integrations.push({
        id: hubspotConn.id,
        businessId: hubspotConn.business_id,
        platform: 'hubspot',
        status: 'connected',
        config: { portalId: hubspotConn.portal_id },
        lastSyncedAt: null,
        syncError: null,
        createdAt: hubspotConn.updated_at,
        updatedAt: hubspotConn.updated_at,
      })
    }

    return NextResponse.json({ integrations })
  } catch (error: any) {
    console.error('[API] Failed to fetch integrations:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, platform, credentials, config } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!platform) {
      return NextResponse.json({ error: 'Platform required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform,
          status: 'connected',
          credentials: credentials ?? {},
          config: config ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )
      .select('id, business_id, platform, status, config, last_synced_at, sync_error, created_at, updated_at')
      .single()

    if (error) {
      console.error('[API] Failed to upsert integration:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      integration: rowToIntegration(data),
    }, { status: 200 })
  } catch (error: any) {
    console.error('[API] Failed to upsert integration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

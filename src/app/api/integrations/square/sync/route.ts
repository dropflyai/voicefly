/**
 * Square Catalog Sync
 *
 * POST /api/integrations/square/sync
 * Body: { businessId, employeeId? }
 *
 * Pulls the Square catalog and maps it to VoiceFly's OrderTakerConfig
 * menu format. If employeeId is provided, updates that employee's
 * job_config.menu in place.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { syncSquareCatalog } from '@/lib/integrations/square-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, employeeId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    // Fetch Square credentials — check square_connections (OAuth) first,
    // then fall back to business_integrations (API key)
    const { data: oauthConn } = await supabase
      .from('square_connections')
      .select('access_token, location_id')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .single()

    if (oauthConn) {
      // Use OAuth token from square_connections
      const result = await syncSquareCatalog(oauthConn.access_token, oauthConn.location_id)
      if (employeeId) {
        const { data: emp } = await supabase
          .from('phone_employees')
          .select('job_config')
          .eq('id', employeeId)
          .single()
        const updatedConfig = { ...(emp?.job_config || {}), menu: result.menu }
        await supabase.from('phone_employees').update({ job_config: updatedConfig }).eq('id', employeeId)
      }
      return NextResponse.json({
        success: true,
        menu: result.menu,
        itemCount: result.itemCount,
        categoryCount: result.categoryCount,
        locationName: result.locationName,
      })
    }

    // Fall back to business_integrations (API key connect)
    const { data: integration, error: integrationError } = await supabase
      .from('business_integrations')
      .select('id, credentials, config, status')
      .eq('business_id', businessId)
      .eq('platform', 'square')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Square not connected' }, { status: 404 })
    }

    const credentials = integration.credentials as {
      accessToken: string
      locationId?: string
    }

    if (!credentials?.accessToken) {
      return NextResponse.json({ error: 'Square credentials missing' }, { status: 400 })
    }

    // Sync the Square catalog
    let syncResult
    try {
      syncResult = await syncSquareCatalog(
        credentials.accessToken,
        credentials.locationId
      )
    } catch (syncError: any) {
      console.error('[Square Catalog Sync] Sync failed:', syncError)

      // Record error in the integration row
      await supabase
        .from('business_integrations')
        .update({
          status: 'error',
          sync_error: syncError.message || 'Unknown sync error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)

      return NextResponse.json(
        { error: syncError.message || 'Failed to sync Square catalog' },
        { status: 500 }
      )
    }

    // Mark last_synced_at and clear any previous error
    await supabase
      .from('business_integrations')
      .update({
        status: 'connected',
        last_synced_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)

    // If employeeId provided, update that employee's job_config.menu
    if (employeeId) {
      // Fetch the current job_config so we merge rather than replace
      const { data: employee, error: employeeError } = await supabase
        .from('phone_employees')
        .select('job_config')
        .eq('id', employeeId)
        .eq('business_id', businessId)
        .single()

      if (employeeError || !employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      const currentJobConfig = (employee.job_config as Record<string, any>) || {}

      const updatedJobConfig = {
        ...currentJobConfig,
        menu: syncResult.menu,
      }

      const { error: updateError } = await supabase
        .from('phone_employees')
        .update({
          job_config: updatedJobConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', employeeId)
        .eq('business_id', businessId)

      if (updateError) {
        console.error('[Square Catalog Sync] Failed to update employee job_config:', updateError)
        return NextResponse.json(
          { error: 'Sync succeeded but failed to update employee menu' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      menu: syncResult.menu,
      itemCount: syncResult.itemCount,
      categoryCount: syncResult.categoryCount,
      ...(syncResult.locationName ? { locationName: syncResult.locationName } : {}),
    })
  } catch (error: any) {
    console.error('[Square Catalog Sync] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

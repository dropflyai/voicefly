/**
 * Clover Catalog Sync
 *
 * POST /api/integrations/clover/sync
 * Body: { businessId, employeeId? }
 *
 * Pulls the Clover catalog and maps it to VoiceFly's OrderTakerConfig
 * menu format. If employeeId is provided, updates that employee's
 * job_config.menu in place.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { syncCloverCatalog } from '@/lib/integrations/clover-sync'

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

    // Fetch Clover integration credentials from business_integrations
    const { data: integration, error: integrationError } = await supabase
      .from('business_integrations')
      .select('id, credentials, config, status')
      .eq('business_id', businessId)
      .eq('platform', 'clover')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Clover not connected' }, { status: 404 })
    }

    const credentials = integration.credentials as {
      accessToken: string
      merchantId: string
    }

    if (!credentials?.accessToken || !credentials?.merchantId) {
      return NextResponse.json({ error: 'Clover credentials missing' }, { status: 400 })
    }

    // Sync the Clover catalog
    let syncResult
    try {
      syncResult = await syncCloverCatalog(credentials.accessToken, credentials.merchantId)
    } catch (syncError: any) {
      console.error('[Clover Catalog Sync] Sync failed:', syncError)

      await supabase
        .from('business_integrations')
        .update({
          status: 'error',
          sync_error: syncError.message || 'Unknown sync error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)

      return NextResponse.json(
        { error: syncError.message || 'Failed to sync Clover catalog' },
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
        console.error('[Clover Catalog Sync] Failed to update employee job_config:', updateError)
        return NextResponse.json(
          { error: 'Sync succeeded but failed to update employee menu' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      itemCount: syncResult.itemCount,
      categoryCount: syncResult.categoryCount,
      ...(syncResult.merchantName ? { merchantName: syncResult.merchantName } : {}),
    })
  } catch (error: any) {
    console.error('[Clover Catalog Sync] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

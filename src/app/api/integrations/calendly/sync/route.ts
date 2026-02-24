/**
 * Calendly Event Types Sync
 *
 * POST /api/integrations/calendly/sync
 * Body: { businessId, employeeId? }
 *
 * Pulls active event types from Calendly and maps them to VoiceFly's
 * appointment scheduler format. If employeeId is provided, updates that
 * employee's job_config.appointmentTypes in place.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { syncCalendlyAccount } from '@/lib/integrations/calendly-sync'

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

    // Fetch Calendly integration credentials from business_integrations
    const { data: integration, error: integrationError } = await supabase
      .from('business_integrations')
      .select('id, credentials, config, status')
      .eq('business_id', businessId)
      .eq('platform', 'calendly')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Calendly not connected' }, { status: 404 })
    }

    const credentials = integration.credentials as {
      accessToken: string
    }

    if (!credentials?.accessToken) {
      return NextResponse.json({ error: 'Calendly credentials missing' }, { status: 400 })
    }

    // Sync the Calendly account
    let syncResult
    try {
      syncResult = await syncCalendlyAccount(credentials.accessToken)
    } catch (syncError: any) {
      console.error('[Calendly Sync] Sync failed:', syncError)

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
        { error: syncError.message || 'Failed to sync Calendly account' },
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

    // If employeeId provided, update that employee's job_config.appointmentTypes
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

      // Map Calendly event types to appointment scheduler format
      const appointmentTypes = syncResult.eventTypes.map((et) => ({
        name: et.name,
        duration: et.duration,
        ...(et.description ? { description: et.description } : {}),
        schedulingUrl: et.schedulingUrl,
      }))

      const updatedJobConfig = {
        ...currentJobConfig,
        appointmentTypes,
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
        console.error('[Calendly Sync] Failed to update employee job_config:', updateError)
        return NextResponse.json(
          { error: 'Sync succeeded but failed to update employee appointment types' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      eventTypes: syncResult.eventTypes,
      userName: syncResult.userName,
    })
  } catch (error: any) {
    console.error('[Calendly Sync] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

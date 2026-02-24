/**
 * Shopify Product Sync
 *
 * POST /api/integrations/shopify/sync
 * Body: { businessId, employeeId? }
 *
 * Pulls active products and policies from the connected Shopify store.
 * If employeeId is provided, updates that employee's job_config with
 * supportedProducts and returnPolicy for customer-service use.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { syncShopifyStore } from '@/lib/integrations/shopify-sync'

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

    // Fetch Shopify integration credentials from business_integrations
    const { data: integration, error: integrationError } = await supabase
      .from('business_integrations')
      .select('id, credentials, config, status')
      .eq('business_id', businessId)
      .eq('platform', 'shopify')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Shopify not connected' }, { status: 404 })
    }

    const credentials = integration.credentials as {
      shopDomain: string
      accessToken: string
    }

    if (!credentials?.shopDomain || !credentials?.accessToken) {
      return NextResponse.json({ error: 'Shopify credentials missing' }, { status: 400 })
    }

    // Sync the Shopify store
    let syncResult
    try {
      syncResult = await syncShopifyStore(credentials.shopDomain, credentials.accessToken)
    } catch (syncError: any) {
      console.error('[Shopify Sync] Sync failed:', syncError)

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
        { error: syncError.message || 'Failed to sync Shopify store' },
        { status: 500 }
      )
    }

    // Mark last_synced_at, update config with latest shop info, clear any previous error
    await supabase
      .from('business_integrations')
      .update({
        status: 'connected',
        last_synced_at: new Date().toISOString(),
        sync_error: null,
        config: {
          ...(integration.config as Record<string, any>),
          shopName: syncResult.shopName,
          currency: syncResult.currency,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)

    // If employeeId provided, update that employee's job_config
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
        supportedProducts: syncResult.products.map((p) => p.name),
        ...(syncResult.returnPolicy ? { returnPolicy: syncResult.returnPolicy } : {}),
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
        console.error('[Shopify Sync] Failed to update employee job_config:', updateError)
        return NextResponse.json(
          { error: 'Sync succeeded but failed to update employee config' },
          { status: 500 }
        )
      }
    }

    console.log(
      `[Shopify Sync] Synced ${syncResult.productCount} products for business ${businessId}` +
        ` (${syncResult.shopName})`
    )

    return NextResponse.json({
      success: true,
      productCount: syncResult.productCount,
      shopName: syncResult.shopName,
    })
  } catch (error: any) {
    console.error('[Shopify Sync] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

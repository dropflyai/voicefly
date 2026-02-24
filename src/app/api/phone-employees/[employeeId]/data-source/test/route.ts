/**
 * Employee Data Source Test API
 *
 * POST /api/phone-employees/[employeeId]/data-source/test
 * Body: { businessId, phoneNumber }
 *
 * Fires a dry-run lookup against the employee's configured data source
 * and returns the raw result. Used by the wizard "Test Connection" button.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params
    const body = await request.json()
    const { businessId, phoneNumber } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber required for test' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const { data: employee, error } = await supabase
      .from('phone_employees')
      .select('data_source')
      .eq('id', employeeId)
      .eq('business_id', businessId)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const ds = employee.data_source
    if (!ds) {
      return NextResponse.json({ error: 'No data source configured on this employee' }, { status: 400 })
    }

    switch (ds.type) {
      case 'voicefly-contacts': {
        const { data: contact } = await supabase
          .from('customers')
          .select('name, email, phone, notes')
          .eq('business_id', businessId)
          .eq('phone', phoneNumber)
          .single()
        return NextResponse.json({
          success: true,
          result: contact ?? null,
          found: !!contact,
          source: 'voicefly-contacts',
        })
      }

      case 'hubspot': {
        const { data: integration } = await supabase
          .from('business_integrations')
          .select('credentials')
          .eq('business_id', businessId)
          .eq('platform', 'hubspot')
          .single()

        if (!integration) {
          return NextResponse.json({ success: false, error: 'HubSpot integration not connected' })
        }

        const accessToken = integration.credentials?.accessToken
        if (!accessToken) {
          return NextResponse.json({ success: false, error: 'HubSpot access token missing' })
        }

        // Search HubSpot contacts by phone
        const hsRes = await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/search`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filterGroups: [{
                filters: [{
                  propertyName: 'phone',
                  operator: 'EQ',
                  value: phoneNumber,
                }],
              }],
              properties: ['firstname', 'lastname', 'email', 'phone', 'company'],
              limit: 1,
            }),
          }
        )
        const hsData = await hsRes.json()
        const contact = hsData.results?.[0]?.properties ?? null
        return NextResponse.json({
          success: true,
          result: contact,
          found: !!contact,
          source: 'hubspot',
        })
      }

      case 'custom-webhook': {
        if (!ds.webhookUrl) {
          return NextResponse.json({ success: false, error: 'No webhookUrl configured' })
        }

        const webhookRes = await fetch(ds.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(ds.webhookSecret ? { 'X-Webhook-Secret': ds.webhookSecret } : {}),
          },
          body: JSON.stringify({ phone: phoneNumber }),
        })

        const status = webhookRes.status
        const result = await webhookRes.json().catch(() => null)

        return NextResponse.json({
          success: webhookRes.ok,
          httpStatus: status,
          result,
          source: 'custom-webhook',
        })
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown data source type: ${ds.type}` })
    }
  } catch (error: any) {
    console.error('[DataSource Test] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

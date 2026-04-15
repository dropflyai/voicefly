/**
 * Twilio A2P Status Callback Webhook
 *
 * Twilio posts here when a Brand Registration, Campaign, or Customer Profile
 * status changes. We look up the matching registration row and advance the
 * state machine via checkAndAdvance().
 *
 * Each campaign we submit includes this URL as its StatusCallback; Twilio also
 * sends brand + customer profile updates here as long as we configure them
 * (see registerCampaign / registerBrand calls).
 *
 * Form fields vary by event type; we accept any of:
 *   - CampaignSid     (for campaign events)
 *   - BrandSid        (for brand events)
 *   - CustomerProfileSid (for customer profile events)
 *   - ResourceSid     (generic — some payloads use this)
 *   - Status          (optional — advisory, we still poll truth from Twilio)
 *
 * Signature verification uses the standard Twilio pattern: sign the URL +
 * sorted form fields with the auth token.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { checkAndAdvance } from '@/lib/a2p/service'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('[twilio-a2p webhook] TWILIO_AUTH_TOKEN not configured')
    return new NextResponse('Service Unavailable', { status: 503 })
  }

  // Parse form-encoded body
  const formData = await request.formData()
  const fields: Record<string, string> = {}
  formData.forEach((value, key) => { fields[key] = value as string })

  // Verify Twilio signature — protects against forged requests
  const signature = request.headers.get('x-twilio-signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio-a2p`
  const isValid = twilio.validateRequest(authToken, signature, url, fields)
  if (!isValid) {
    console.warn('[twilio-a2p webhook] Invalid signature', { url, signature: signature.slice(0, 10) })
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Figure out which resource was updated
  const campaignSid = fields.CampaignSid || null
  const brandSid = fields.BrandSid || null
  const customerProfileSid = fields.CustomerProfileSid || null
  const resourceSid = fields.ResourceSid || campaignSid || brandSid || customerProfileSid

  if (!resourceSid) {
    console.warn('[twilio-a2p webhook] No resource SID in payload', fields)
    return NextResponse.json({ ok: true }) // ack to stop retries
  }

  // Look up the tenant registration row by any matching SID
  const { data: rows } = await supabase
    .from('tenant_a2p_registrations')
    .select('business_id, status')
    .or(
      [
        campaignSid ? `twilio_campaign_sid.eq.${campaignSid}` : null,
        brandSid ? `twilio_brand_sid.eq.${brandSid}` : null,
        customerProfileSid ? `twilio_customer_profile_sid.eq.${customerProfileSid}` : null,
      ].filter(Boolean).join(',')
    )
    .limit(1)

  const row = rows?.[0]
  if (!row) {
    console.warn('[twilio-a2p webhook] No registration matched SID', { campaignSid, brandSid, customerProfileSid })
    return NextResponse.json({ ok: true })
  }

  console.log(`[twilio-a2p webhook] Advancing business ${row.business_id} from ${row.status}`, {
    campaignSid, brandSid, customerProfileSid, status: fields.Status,
  })

  try {
    const updated = await checkAndAdvance(row.business_id)
    return NextResponse.json({ ok: true, status: updated.status })
  } catch (err: any) {
    console.error('[twilio-a2p webhook] checkAndAdvance failed', err)
    // Ack to Twilio anyway — the cron poller will retry
    return NextResponse.json({ ok: true, error: err.message })
  }
}

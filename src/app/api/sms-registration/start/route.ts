/**
 * POST /api/sms-registration/start
 *
 * Starts the A2P 10DLC registration flow for a tenant business.
 * Creates the Twilio Customer Profile, attaches business info, and
 * submits the profile for review.
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateBusinessAccess } from '@/lib/api-auth'
import { startRegistration } from '@/lib/a2p/service'
import type { BusinessLegalInfo } from '@/lib/a2p/twilio-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, info } = body as { businessId: string; info: BusinessLegalInfo }

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const missing = validateBusinessInfo(info)
    if (missing.length) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missing },
        { status: 400 }
      )
    }

    const registration = await startRegistration(businessId, info)

    return NextResponse.json({ success: true, registration })
  } catch (err: any) {
    console.error('[sms-registration/start]', err)
    return NextResponse.json(
      { error: err.message || 'Failed to start registration', code: err.code },
      { status: err.status || 500 }
    )
  }
}

function validateBusinessInfo(info: BusinessLegalInfo): string[] {
  const required: (keyof BusinessLegalInfo)[] = [
    'legal_name', 'ein', 'business_type', 'industry', 'website',
    'address_street', 'address_city', 'address_state', 'address_zip',
    'address_country', 'phone',
    'contact_first_name', 'contact_last_name', 'contact_email',
    'contact_phone', 'contact_title', 'contact_job_position',
  ]
  return required.filter(k => !info?.[k])
}

/**
 * SMS Test Endpoint — disabled in production
 *
 * POST /api/test/sms
 * Only available in development. Returns 404 in production.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return NextResponse.json({
        success: false,
        error: 'Twilio not configured',
        configured: {
          accountSid: !!TWILIO_ACCOUNT_SID,
          authToken: !!TWILIO_AUTH_TOKEN,
          phoneNumber: !!TWILIO_PHONE_NUMBER,
        },
      }, { status: 400 })
    }

    if (TWILIO_ACCOUNT_SID.includes('placeholder') || TWILIO_AUTH_TOKEN.includes('placeholder')) {
      return NextResponse.json({
        success: false,
        error: 'Twilio credentials are still placeholders. Replace with real credentials in .env.local',
      }, { status: 400 })
    }

    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 })
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: message,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: result.message || 'Twilio error',
        code: result.code,
        status: result.status,
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      to: result.to,
      from: result.from,
      status: result.status,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

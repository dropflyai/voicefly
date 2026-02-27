/**
 * Shared Twilio SMS Client
 *
 * Single place for sending SMS via Twilio REST API.
 * Used by: AI responder, manual send endpoint, webhook handlers.
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export interface SendSmsParams {
  to: string
  from?: string
  body: string
}

export interface SendSmsResult {
  success: boolean
  sid?: string
  error?: string
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return { success: false, error: 'Twilio credentials not configured' }
  }

  const from = params.from || TWILIO_PHONE_NUMBER
  if (!from) {
    return { success: false, error: 'No from number available' }
  }

  try {
    const authHeader = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')
    const body = new URLSearchParams({
      To: params.to,
      From: from,
      Body: params.body,
    })

    const resp = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    if (!resp.ok) {
      const errBody = await resp.text()
      console.error(`[TwilioClient] Error (${resp.status}):`, errBody)
      return { success: false, error: `Twilio ${resp.status}` }
    }

    const result = await resp.json()
    return { success: true, sid: result.sid }
  } catch (err) {
    console.error('[TwilioClient] Send error:', err)
    return { success: false, error: String(err) }
  }
}

export function getPlatformPhoneNumber(): string | undefined {
  return TWILIO_PHONE_NUMBER
}

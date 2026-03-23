const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER!
const TWILIO_MSG_SID = process.env.TWILIO_MESSAGING_SERVICE_SID

export async function sendSms(to: string, body: string): Promise<{ sid: string; status: string }> {
  const params = new URLSearchParams()
  params.append('To', to)
  params.append('Body', body)

  if (TWILIO_MSG_SID) {
    params.append('MessagingServiceSid', TWILIO_MSG_SID)
  } else {
    params.append('From', TWILIO_FROM)
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Twilio SMS failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return { sid: data.sid, status: data.status }
}

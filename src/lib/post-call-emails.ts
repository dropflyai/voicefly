/**
 * Post-Call Email Templates
 *
 * Generates follow-up email HTML for leads qualified by Jordan (lead qualifier phone employee).
 * Used after a call ends and scoreLead() determines the lead tier.
 *
 * - HOT: Immediate follow-up with calendar link and demo setup
 * - WARM: Thank you with promise to build free demo
 * - COLD: No email sent (just logged)
 */

const CALENDAR_LINK = 'https://cal.com/voicefly/discovery'
const VOICEFLY_WEBSITE = 'https://voiceflyai.com'

export interface PostCallEmailParams {
  callerName: string
  callerEmail: string
  callerCompany?: string
  tier: 'hot' | 'warm' | 'cold'
  interest?: string
  reasoning?: string
}

export interface PostCallEmailResult {
  subject: string
  html: string
  text: string
}

/**
 * Generate the appropriate follow-up email based on lead tier.
 * Returns null for cold leads (no email should be sent).
 */
export function generatePostCallEmail(params: PostCallEmailParams): PostCallEmailResult | null {
  switch (params.tier) {
    case 'hot':
      return generateHotLeadEmail(params)
    case 'warm':
      return generateWarmLeadEmail(params)
    case 'cold':
      return null // No email for cold leads
    default:
      return null
  }
}

// ============================================
// HOT LEAD EMAIL
// ============================================

function generateHotLeadEmail(params: PostCallEmailParams): PostCallEmailResult {
  const firstName = params.callerName.split(' ')[0]
  const companyLine = params.callerCompany
    ? ` for ${params.callerCompany}`
    : ''

  const subject = `${firstName}, your custom VoiceFly demo is in the works`

  const text = `Hey ${firstName},

Great talking to you! I can already tell VoiceFly is going to be a game-changer${companyLine}.

I'm personally setting up a custom demo tailored to your business. You'll see exactly how an AI phone employee would handle your calls, book appointments, and qualify leads -- all on autopilot.

Here's my calendar link to lock in a time for your demo walkthrough:
${CALENDAR_LINK}

Pick whatever works best for you. I'll have the demo ready to blow your mind.

Talk soon,
Tony Smith
Founder, VoiceFly
${VOICEFLY_WEBSITE}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VoiceFly</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1a1a2e; font-size: 16px; line-height: 1.6;">
                Hey ${firstName},
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great talking to you! I can already tell VoiceFly is going to be a game-changer${companyLine}.
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                I'm personally setting up a <strong>custom demo</strong> tailored to your business. You'll see exactly how an AI phone employee would handle your calls, book appointments, and qualify leads &mdash; all on autopilot.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${CALENDAR_LINK}" style="display: inline-block; background-color: #1a1a2e; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      Book Your Demo Walkthrough
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Pick whatever time works best for you. I'll have the demo ready to blow your mind.
              </p>
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Talk soon,<br>
                <strong>Tony Smith</strong><br>
                <span style="color: #666666;">Founder, VoiceFly</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f0f5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 13px;">
                <a href="${VOICEFLY_WEBSITE}" style="color: #1a1a2e; text-decoration: none;">voiceflyai.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}

// ============================================
// WARM LEAD EMAIL
// ============================================

function generateWarmLeadEmail(params: PostCallEmailParams): PostCallEmailResult {
  const firstName = params.callerName.split(' ')[0]
  const businessRef = params.callerCompany
    ? `${params.callerCompany}`
    : 'your business'

  const subject = `${firstName}, your free VoiceFly demo is coming`

  const text = `Hey ${firstName},

Thanks for checking out VoiceFly! I enjoyed our conversation.

As promised, I'm going to build a free demo specifically for ${businessRef}. You'll be able to hear exactly what your AI phone employee would sound like -- handling real calls, answering questions about your services, and booking appointments.

No commitment, no pressure. I just want you to see what's possible.

I'll have it ready soon and will reach out when it's good to go. In the meantime, if you have any questions, just reply to this email.

Talk soon,
Tony Smith
Founder, VoiceFly
${VOICEFLY_WEBSITE}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1a1a2e; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">VoiceFly</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1a1a2e; font-size: 16px; line-height: 1.6;">
                Hey ${firstName},
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thanks for checking out VoiceFly! I enjoyed our conversation.
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                As promised, I'm going to build a <strong>free demo</strong> specifically for ${businessRef}. You'll be able to hear exactly what your AI phone employee would sound like &mdash; handling real calls, answering questions about your services, and booking appointments.
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                No commitment, no pressure. I just want you to see what's possible.
              </p>
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                I'll have it ready soon and will reach out when it's good to go. In the meantime, if you have any questions, just reply to this email.
              </p>
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Talk soon,<br>
                <strong>Tony Smith</strong><br>
                <span style="color: #666666;">Founder, VoiceFly</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f0f0f5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #888888; font-size: 13px;">
                <a href="${VOICEFLY_WEBSITE}" style="color: #1a1a2e; text-decoration: none;">voiceflyai.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}

export default generatePostCallEmail

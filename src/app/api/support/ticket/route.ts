import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { sendEmail } from '@/lib/gmail'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/support/ticket
 * Creates a support ticket from the AI agent escalation.
 * Stores in support_tickets table and optionally fires n8n webhook.
 */
export async function POST(req: NextRequest) {
  try {
    const authResult = await validateBusinessAccess(req, '')
    const body = await req.json()
    const { businessId, summary, conversation, userEmail } = body

    if (!businessId || !summary) {
      return NextResponse.json({ error: 'businessId and summary required' }, { status: 400 })
    }

    // Validate business access
    const authCheck = await validateBusinessAccess(req, businessId)
    if (!authCheck.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get business name for context
    const { data: business } = await supabase
      .from('businesses')
      .select('name, subscription_tier')
      .eq('id', businessId)
      .single()

    const ticket = {
      business_id: businessId,
      business_name: business?.name || 'Unknown',
      plan: business?.subscription_tier || 'starter',
      user_email: userEmail || null,
      summary,
      conversation: conversation || [],
      status: 'open',
      created_at: new Date().toISOString(),
    }

    // Store in support_tickets table (create if doesn't exist, will gracefully fail)
    const { error: insertError } = await supabase
      .from('support_tickets')
      .insert(ticket)

    if (insertError) {
      // Table might not exist yet — log but don't fail
      console.warn('[Support] Could not store ticket in DB:', insertError.message)
    }

    // Fire n8n webhook if configured (non-blocking)
    const n8nWebhookUrl = process.env.N8N_SUPPORT_WEBHOOK_URL
    if (n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      }).catch(err => console.error('[Support] n8n webhook error:', err))
    }

    // Send email notification to Tony
    try {
      const conversationHtml = (conversation || [])
        .map((msg: { role: string; content: string }) =>
          `<p><strong>${msg.role === 'user' ? 'Customer' : 'Maya (AI)'}:</strong> ${msg.content}</p>`
        )
        .join('')

      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://voiceflyai.com'}/admin`

      await sendEmail({
        to: 'tony@dropfly.io',
        from: 'support@voiceflyai.com',
        subject: `[VoiceFly Support] New ticket from ${business?.name || 'Unknown'}`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">New Support Ticket</h2>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px 0; color: #666; width: 130px;">Business:</td><td style="padding: 8px 0; font-weight: bold;">${business?.name || 'Unknown'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">Plan:</td><td style="padding: 8px 0;">${business?.subscription_tier || 'starter'}</td></tr>
              <tr><td style="padding: 8px 0; color: #666;">User Email:</td><td style="padding: 8px 0;">${userEmail || 'Not provided'}</td></tr>
            </table>
            <h3 style="color: #1a1a1a;">Summary</h3>
            <p style="background: #f3f4f6; padding: 12px; border-radius: 6px;">${summary}</p>
            ${conversationHtml ? `<h3 style="color: #1a1a1a;">Conversation</h3><div style="background: #f9fafb; padding: 12px; border-radius: 6px; font-size: 14px;">${conversationHtml}</div>` : ''}
            <p style="margin-top: 24px;">
              <a href="${dashboardUrl}" style="background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View in Dashboard</a>
            </p>
          </div>
        `,
      })
      console.log(`[Support] Email notification sent for ticket from ${business?.name}`)
    } catch (emailError: any) {
      // Don't fail the ticket creation if email fails
      console.error('[Support] Email notification failed:', emailError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Support ticket created. We\'ll get back to you soon.',
    })
  } catch (error: any) {
    console.error('[Support] Error creating ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}

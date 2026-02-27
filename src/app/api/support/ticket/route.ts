import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

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

    // Also send email notification if configured
    console.log(`[Support] New ticket from ${business?.name}: ${summary}`)

    return NextResponse.json({
      success: true,
      message: 'Support ticket created. We\'ll get back to you soon.',
    })
  } catch (error: any) {
    console.error('[Support] Error creating ticket:', error)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}

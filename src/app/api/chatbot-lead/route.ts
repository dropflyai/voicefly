import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, businessName, businessType, employeeInterest, sessionId } = body

    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const nameParts = (name?.trim() || '').split(' ')
    const firstName = nameParts[0] || null
    const lastName = nameParts.slice(1).join(' ') || null

    // Insert lead into CRM
    const { error: leadError } = await supabase.from('leads').insert({
      email: email.trim().toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      company_name: businessName?.trim() || null,
      industry: businessType?.trim() || null,
      lead_source: 'chatbot',
      lead_status: 'new',
      notes: employeeInterest ? `Interested in: ${employeeInterest}` : null,
      business_id: null,
    })

    if (leadError) {
      console.error('[API] Chatbot lead insert error:', leadError)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    // Mark the conversation as lead_captured for analytics (fire-and-forget)
    if (sessionId) {
      void supabase.from('chat_conversations')
        .update({ lead_captured: true, outcome: 'lead_captured', updated_at: new Date().toISOString() })
        .eq('session_id', sessionId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Chatbot lead error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

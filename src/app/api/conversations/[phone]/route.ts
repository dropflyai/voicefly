/**
 * GET /api/conversations/[phone]?businessId=X
 *
 * Returns the full SMS message thread for a specific phone number.
 * Also marks inbound messages as read.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')

  if (!businessId || !phone) {
    return NextResponse.json({ error: 'businessId and phone required' }, { status: 400 })
  }

  const authResult = await validateBusinessAccess(request, businessId)
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
    )
  }

  const decodedPhone = decodeURIComponent(phone)

  // Fetch all SMS messages for this conversation
  const { data: messages, error } = await supabase
    .from('communication_logs')
    .select('id, direction, content, created_at, metadata, read')
    .eq('business_id', businessId)
    .eq('type', 'sms')
    .eq('customer_phone', decodedPhone)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('[Conversation] Query error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  // Mark unread inbound messages as read (fire-and-forget)
  supabase
    .from('communication_logs')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('type', 'sms')
    .eq('customer_phone', decodedPhone)
    .eq('direction', 'inbound')
    .eq('read', false)
    .then(({ error: updateError }) => {
      if (updateError) console.error('[Conversation] Mark read error:', updateError)
    })

  return NextResponse.json({ messages: messages || [] })
}

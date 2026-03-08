import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { validateBusinessAccess } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('phone_messages')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (err) {
    console.error('Error fetching phone messages:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, businessId, status, callback_completed } = body

    if (!messageId || !businessId) {
      return NextResponse.json({ error: 'messageId and businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    const supabase = createServerClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status) updates.status = status
    if (callback_completed !== undefined) updates.callback_completed = callback_completed

    const { error } = await supabase
      .from('phone_messages')
      .update(updates)
      .eq('id', messageId)
      .eq('business_id', businessId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error updating phone message:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

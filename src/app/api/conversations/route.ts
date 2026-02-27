/**
 * GET /api/conversations?businessId=X&employeeId=Y
 *
 * Returns SMS conversation threads grouped by customer phone number.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('businessId')
  const employeeId = searchParams.get('employeeId')

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

  // Fetch recent SMS messages
  let query = supabase
    .from('communication_logs')
    .select('id, customer_phone, employee_id, direction, content, read, created_at')
    .eq('business_id', businessId)
    .eq('type', 'sms')
    .not('customer_phone', 'is', null)
    .order('created_at', { ascending: false })
    .limit(500)

  if (employeeId) {
    query = query.eq('employee_id', employeeId)
  }

  const { data: messages, error } = await query

  if (error) {
    console.error('[Conversations] Query error:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }

  // Group by customer_phone into conversation threads
  const threadMap = new Map<string, {
    customerPhone: string
    employeeId: string | null
    lastMessage: string
    lastMessageAt: string
    lastDirection: string
    messageCount: number
    unreadCount: number
  }>()

  for (const msg of messages || []) {
    const phone = msg.customer_phone
    if (!phone) continue

    const existing = threadMap.get(phone)
    if (!existing) {
      threadMap.set(phone, {
        customerPhone: phone,
        employeeId: msg.employee_id,
        lastMessage: msg.content || '',
        lastMessageAt: msg.created_at,
        lastDirection: msg.direction,
        messageCount: 1,
        unreadCount: msg.direction === 'inbound' && !msg.read ? 1 : 0,
      })
    } else {
      existing.messageCount++
      if (msg.direction === 'inbound' && !msg.read) {
        existing.unreadCount++
      }
    }
  }

  // Fetch employee names for the threads
  const employeeIds = [...new Set([...threadMap.values()].map(t => t.employeeId).filter(Boolean))]
  let employeeMap: Record<string, string> = {}

  if (employeeIds.length > 0) {
    const { data: employees } = await supabase
      .from('phone_employees')
      .select('id, name')
      .in('id', employeeIds)

    if (employees) {
      employeeMap = Object.fromEntries(employees.map(e => [e.id, e.name]))
    }
  }

  // Build response array sorted by most recent
  const conversations = [...threadMap.values()]
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    .map(t => ({
      ...t,
      employeeName: t.employeeId ? employeeMap[t.employeeId] || null : null,
    }))

  return NextResponse.json({ conversations })
}

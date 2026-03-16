import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateAuth } from '@/lib/api-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function validateAdminAccess(request: NextRequest) {
  const webhookSecret = request.headers.get('x-webhook-secret')
  if (webhookSecret && webhookSecret === process.env.N8N_WEBHOOK_SECRET) {
    return { success: true, user: { email: process.env.ADMIN_EMAIL } }
  }

  const result = await validateAuth(request)
  if (!result.success) return result
  if (result.user!.email !== process.env.ADMIN_EMAIL) {
    return { success: false, error: 'Forbidden' }
  }
  return result
}

/**
 * GET /api/admin/support-analytics
 * Returns support conversation analytics: resolution rates, top queries, ticket stats.
 */
export async function GET(request: NextRequest) {
  const auth = await validateAdminAccess(request)
  if (!auth.success) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === 'Forbidden' ? 403 : 401 }
    )
  }

  try {
    // Fetch support conversations (context = 'support') and all support tickets in parallel
    const [conversationsResult, ticketsResult] = await Promise.all([
      supabase
        .from('chat_conversations')
        .select('id, messages, exchange_count, outcome, created_at, business_id')
        .eq('context', 'support')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase
        .from('support_tickets')
        .select('id, business_id, status, created_at, summary'),
    ])

    const conversations = conversationsResult.data || []
    const tickets = ticketsResult.data || []

    // --- Overview ---
    const totalConversations = conversations.length
    const escalatedToTicket = tickets.length

    // A conversation is "resolved by Maya" if it has no matching ticket
    // and didn't end with an unresolved/escalated outcome
    const ticketBusinessTimes = new Set(
      tickets.map(t => `${t.business_id}:${t.created_at?.substring(0, 13)}`)
    )

    let resolvedByMaya = 0
    let totalExchanges = 0

    for (const conv of conversations) {
      totalExchanges += conv.exchange_count || 0
      const convKey = `${conv.business_id}:${conv.created_at?.substring(0, 13)}`
      const wasEscalated = ticketBusinessTimes.has(convKey)
      if (!wasEscalated && conv.outcome !== 'escalated') {
        resolvedByMaya++
      }
    }

    const resolutionRate = totalConversations > 0
      ? `${Math.round((resolvedByMaya / totalConversations) * 100)}%`
      : '0%'
    const avgExchanges = totalConversations > 0
      ? Math.round(totalExchanges / totalConversations)
      : 0

    // --- Top Queries ---
    // Extract the first user message from each conversation as the "query"
    const queryCounts: Record<string, { count: number; resolvedCount: number }> = {}

    for (const conv of conversations) {
      const messages = conv.messages as Array<{ role: string; content: string }> | null
      if (!messages || messages.length === 0) continue

      const firstUserMsg = messages.find(m => m.role === 'user')
      if (!firstUserMsg) continue

      const query = firstUserMsg.content.trim().substring(0, 120)
      if (!query) continue

      if (!queryCounts[query]) {
        queryCounts[query] = { count: 0, resolvedCount: 0 }
      }
      queryCounts[query].count++

      const convKey = `${conv.business_id}:${conv.created_at?.substring(0, 13)}`
      const wasEscalated = ticketBusinessTimes.has(convKey)
      if (!wasEscalated && conv.outcome !== 'escalated') {
        queryCounts[query].resolvedCount++
      }
    }

    const sortedQueries = Object.entries(queryCounts)
      .sort(([, a], [, b]) => b.count - a.count)

    const topQueries = sortedQueries
      .slice(0, 10)
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        resolved: stats.resolvedCount === stats.count,
      }))

    // Unresolved: queries where at least one instance was not resolved
    const unresolvedQueries = sortedQueries
      .filter(([, stats]) => stats.resolvedCount < stats.count)
      .slice(0, 10)
      .map(([query, stats]) => ({
        query,
        count: stats.count - stats.resolvedCount,
        ticketCreated: true, // if unresolved, a ticket was likely created
      }))

    // --- Ticket Stats ---
    const ticketsByStatus = { open: 0, in_progress: 0, resolved: 0 }
    let totalResolutionMs = 0
    let resolvedTicketCount = 0

    for (const ticket of tickets) {
      const status = (ticket.status || 'open').toLowerCase().replace(' ', '_')
      if (status === 'open') ticketsByStatus.open++
      else if (status === 'in_progress') ticketsByStatus.in_progress++
      else if (status === 'resolved' || status === 'closed') {
        ticketsByStatus.resolved++
        // Estimate resolution time if we had updated_at; for now just count
        resolvedTicketCount++
      }
    }

    const avgResolutionTime = resolvedTicketCount > 0 && totalResolutionMs > 0
      ? `${Math.round(totalResolutionMs / resolvedTicketCount / 3600000)}h`
      : resolvedTicketCount > 0 ? 'N/A' : '0h'

    return NextResponse.json({
      overview: {
        totalConversations,
        resolvedByMaya,
        escalatedToTicket,
        resolutionRate,
        avgExchanges,
      },
      topQueries,
      unresolvedQueries,
      ticketStats: {
        open: ticketsByStatus.open,
        inProgress: ticketsByStatus.in_progress,
        resolved: ticketsByStatus.resolved,
        avgResolutionTime,
      },
    })
  } catch (error: any) {
    console.error('[Support Analytics] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch support analytics' }, { status: 500 })
  }
}

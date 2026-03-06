/**
 * Email Notification Service
 *
 * Sends transactional email notifications for call events.
 * Used as the primary notification channel for trial businesses
 * and as a fallback when SMS is unavailable.
 */

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_ADDRESS = 'VoiceFly <notifications@voiceflyai.com>'

interface NotifyOwnerOptions {
  businessId: string
  ownerEmail: string
  businessName: string
}

// ============================================
// MESSAGE NOTIFICATION
// ============================================

export async function sendMessageNotification(
  opts: NotifyOwnerOptions & {
    callerName: string
    callerPhone: string
    message: string
    urgency: string
    forPerson?: string
    callbackRequested?: boolean
  }
) {
  const urgencyBadge = opts.urgency === 'urgent' || opts.urgency === 'high'
    ? '<span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;">URGENT</span> '
    : ''

  const callbackLine = opts.callbackRequested
    ? '<p style="color:#2563eb;font-weight:600;margin-top:8px;">Callback requested</p>'
    : ''

  const forLine = opts.forPerson ? `<p style="color:#6b7280;margin:4px 0;">For: ${opts.forPerson}</p>` : ''

  return sendNotification(opts.ownerEmail, `${opts.urgency === 'urgent' || opts.urgency === 'high' ? '[URGENT] ' : ''}New message from ${opts.callerName}`, `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">
          ${urgencyBadge}New Message for ${opts.businessName}
        </h2>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;font-weight:600;color:#1e293b;">${opts.callerName}</p>
          <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${opts.callerPhone}</p>
          ${forLine}
          <p style="margin:8px 0 0;color:#334155;line-height:1.5;">"${opts.message}"</p>
          ${callbackLine}
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
          Taken by your AI employee &middot; <a href="https://www.voiceflyai.com/dashboard" style="color:#2563eb;text-decoration:none;">View in Dashboard</a>
        </p>
      </div>
    </div>
  `)
}

// ============================================
// APPOINTMENT NOTIFICATION
// ============================================

export async function sendAppointmentNotification(
  opts: NotifyOwnerOptions & {
    customerName: string
    customerPhone?: string
    service?: string
    date: string
    time: string
  }
) {
  const formattedDate = new Date(opts.date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return sendNotification(opts.ownerEmail, `New appointment: ${opts.customerName} on ${formattedDate}`, `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 16px;color:#166534;font-size:18px;">
          Appointment Booked for ${opts.businessName}
        </h2>
        <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:16px;">
          <p style="margin:0 0 4px;font-weight:600;color:#1e293b;">${opts.customerName}</p>
          ${opts.customerPhone ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${opts.customerPhone}</p>` : ''}
          ${opts.service ? `<p style="margin:0 0 4px;color:#334155;">Service: ${opts.service}</p>` : ''}
          <p style="margin:0;color:#334155;font-weight:600;">${formattedDate} at ${formatTime(opts.time)}</p>
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
          Booked by your AI employee &middot; <a href="https://www.voiceflyai.com/dashboard" style="color:#2563eb;text-decoration:none;">View in Dashboard</a>
        </p>
      </div>
    </div>
  `)
}

// ============================================
// CALL SUMMARY NOTIFICATION
// ============================================

export async function sendCallSummaryNotification(
  opts: NotifyOwnerOptions & {
    callerPhone?: string
    duration: number
    summary?: string
    employeeName: string
    jobType: string
  }
) {
  const minutes = Math.floor(opts.duration / 60)
  const seconds = opts.duration % 60
  const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

  return sendNotification(opts.ownerEmail, `Call handled by ${opts.employeeName} (${durationStr})`, `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">
          Call Completed &middot; ${opts.businessName}
        </h2>
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;">
          ${opts.callerPhone ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Caller: ${opts.callerPhone}</p>` : ''}
          <p style="margin:0 0 4px;color:#334155;">Duration: <strong>${durationStr}</strong></p>
          <p style="margin:0 0 8px;color:#334155;">Handled by: ${opts.employeeName}</p>
          ${opts.summary ? `<div style="margin:12px 0 0;padding:12px;background:#f8fafc;border-radius:6px;"><p style="margin:0;color:#475569;font-size:14px;line-height:1.5;">${opts.summary}</p></div>` : ''}
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#94a3b8;">
          <a href="https://www.voiceflyai.com/dashboard" style="color:#2563eb;text-decoration:none;">View full transcript in Dashboard</a>
        </p>
      </div>
    </div>
  `)
}

// ============================================
// ORDER NOTIFICATION
// ============================================

export async function sendOrderNotification(
  opts: NotifyOwnerOptions & {
    customerName?: string
    customerPhone?: string
    orderType?: string
    items: Array<{ name: string; quantity: number; price?: number }>
    total?: number
  }
) {
  const itemsHtml = opts.items.map(item =>
    `<tr><td style="padding:4px 0;color:#334155;">${item.name} x${item.quantity}</td>${item.price ? `<td style="padding:4px 0;text-align:right;color:#334155;">$${item.price.toFixed(2)}</td>` : ''}</tr>`
  ).join('')

  return sendNotification(opts.ownerEmail, `New order${opts.customerName ? ` from ${opts.customerName}` : ''}`, `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 16px;color:#854d0e;font-size:18px;">
          New Order &middot; ${opts.businessName}
        </h2>
        <div style="background:#fff;border:1px solid #fde68a;border-radius:8px;padding:16px;">
          ${opts.customerName ? `<p style="margin:0 0 4px;font-weight:600;color:#1e293b;">${opts.customerName}</p>` : ''}
          ${opts.customerPhone ? `<p style="margin:0 0 4px;color:#6b7280;font-size:14px;">${opts.customerPhone}</p>` : ''}
          ${opts.orderType ? `<p style="margin:0 0 8px;color:#334155;">Type: ${opts.orderType}</p>` : ''}
          <table style="width:100%;border-collapse:collapse;margin-top:8px;">
            ${itemsHtml}
          </table>
          ${opts.total ? `<p style="margin:12px 0 0;font-weight:700;color:#1e293b;font-size:16px;border-top:1px solid #e2e8f0;padding-top:8px;">Total: $${opts.total.toFixed(2)}</p>` : ''}
        </div>
        <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">
          Taken by your AI employee &middot; <a href="https://www.voiceflyai.com/dashboard" style="color:#2563eb;text-decoration:none;">View in Dashboard</a>
        </p>
      </div>
    </div>
  `)
}

// ============================================
// HELPERS
// ============================================

async function sendNotification(to: string, subject: string, html: string) {
  if (!resend) {
    console.log('[EmailNotify] Resend not configured, skipping:', subject)
    return { success: false, error: 'Resend not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('[EmailNotify] Send error:', error)
      return { success: false, error: error.message }
    }

    console.log(`[EmailNotify] Sent to ${to}: ${subject}`)
    return { success: true, id: data?.id }
  } catch (err: any) {
    console.error('[EmailNotify] Error:', err)
    return { success: false, error: err.message }
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Look up the business owner's email for notifications.
 * Returns the email of the first admin/owner user for the business.
 */
export async function getOwnerEmail(businessId: string): Promise<string | null> {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get the owner user_id from business_users
  const { data: membership } = await supabase
    .from('business_users')
    .select('user_id')
    .eq('business_id', businessId)
    .eq('role', 'owner')
    .limit(1)
    .single()

  if (!membership?.user_id) {
    // Fallback: any admin
    const { data: admin } = await supabase
      .from('business_users')
      .select('user_id')
      .eq('business_id', businessId)
      .in('role', ['owner', 'admin'])
      .limit(1)
      .single()

    if (!admin?.user_id) return null

    const { data: { user } } = await supabase.auth.admin.getUserById(admin.user_id)
    return user?.email || null
  }

  const { data: { user } } = await supabase.auth.admin.getUserById(membership.user_id)
  return user?.email || null
}

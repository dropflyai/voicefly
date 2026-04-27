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
// LEAD SCORE NOTIFICATION (to owner)
// ============================================

export async function sendLeadScoreOwnerNotification(opts: {
  ownerEmail: string
  businessName: string
  tier: 'hot' | 'warm' | 'cold'
  callerName?: string
  callerPhone?: string
  reasoning?: string
  employeeName?: string
}) {
  const tierConfig = {
    hot: {
      label: 'HOT LEAD',
      bg: '#fef2f2',
      border: '#fecaca',
      headerBg: '#ef4444',
      tagBg: '#ef4444',
      action: 'Follow up immediately — this person is ready to buy.',
    },
    warm: {
      label: 'WARM LEAD',
      bg: '#fffbeb',
      border: '#fde68a',
      headerBg: '#f59e0b',
      tagBg: '#f59e0b',
      action: 'Good candidate for nurture — follow up within 48 hours.',
    },
    cold: {
      label: 'COLD LEAD',
      bg: '#f8fafc',
      border: '#e2e8f0',
      headerBg: '#64748b',
      tagBg: '#64748b',
      action: 'Not a fit right now. Keep on file for future campaigns.',
    },
  }

  const t = tierConfig[opts.tier]

  return sendNotification(
    opts.ownerEmail,
    `${t.label}: ${opts.callerName || 'Unknown caller'} (${opts.callerPhone || 'no number'})`,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:${t.bg};border:1px solid ${t.border};border-radius:12px;padding:24px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <span style="background:${t.tagBg};color:#fff;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:0.5px;">${t.label}</span>
          <span style="color:#64748b;font-size:14px;">${opts.businessName}</span>
        </div>
        <div style="background:#fff;border:1px solid ${t.border};border-radius:8px;padding:16px;margin-bottom:12px;">
          <p style="margin:0 0 4px;font-weight:700;color:#1e293b;font-size:16px;">${opts.callerName || 'Unknown'}</p>
          ${opts.callerPhone ? `<p style="margin:0 0 8px;color:#6b7280;font-size:14px;">${opts.callerPhone}</p>` : ''}
          ${opts.reasoning ? `<p style="margin:8px 0 0;color:#475569;font-size:14px;line-height:1.5;padding-top:8px;border-top:1px solid #f1f5f9;">"${opts.reasoning}"</p>` : ''}
        </div>
        <p style="margin:0 0 12px;color:#334155;font-size:14px;font-weight:500;">${t.action}</p>
        <p style="margin:0;font-size:12px;color:#94a3b8;">
          Scored by ${opts.employeeName || 'your AI employee'} &middot;
          <a href="https://www.voiceflyai.com/dashboard" style="color:#2563eb;text-decoration:none;">View in Dashboard</a>
        </p>
      </div>
    </div>
  `
  )
}

// ============================================
// LEAD FOLLOW-UP EMAIL (to the lead)
// ============================================

export async function sendLeadFollowUpEmail(opts: {
  toEmail: string
  leadName?: string
  businessName: string
  employeeName?: string
  tier: 'hot' | 'warm'
}) {
  const firstName = opts.leadName ? opts.leadName.split(' ')[0] : null
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'
  const subject = opts.tier === 'hot'
    ? `Great speaking with you — next steps from ${opts.businessName}`
    : `Thanks for connecting with ${opts.businessName}`

  const body = opts.tier === 'hot'
    ? `Our team will be in touch very shortly to get you taken care of. We're looking forward to working with you.`
    : `We enjoyed speaking with you today. While the timing might not be perfect right now, we'd love to stay in touch. When you're ready, we're here.`

  const demoSection = opts.tier === 'hot'
    ? `<div style="margin:16px 0;padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;">
          <p style="margin:0 0 8px;font-weight:600;color:#0369a1;font-size:14px;">Want to see what your business could sound like?</p>
          <p style="margin:0 0 10px;color:#334155;font-size:14px;line-height:1.5;">Try a live interactive demo of our AI phone employees across different industries — dental, salon, auto shop, restaurant, and more. No signup needed.</p>
          <a href="https://www.voiceflyai.com/demo" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;">Try the live demo →</a>
        </div>`
    : `<div style="margin:16px 0;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
          <p style="margin:0 0 6px;color:#475569;font-size:13px;">In the meantime, curious what an AI phone employee sounds like?</p>
          <a href="https://www.voiceflyai.com/demo" style="color:#2563eb;font-size:13px;text-decoration:none;font-weight:500;">Try the interactive demo →</a>
        </div>`

  return sendNotification(
    opts.toEmail,
    subject,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
        <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;">${opts.businessName}</h2>
        <p style="margin:0 0 12px;color:#334155;line-height:1.6;">${greeting}</p>
        <p style="margin:0 0 12px;color:#334155;line-height:1.6;">
          Thank you for speaking with ${opts.employeeName || 'us'} today. ${body}
        </p>
        ${demoSection}
        <p style="margin:0;color:#334155;line-height:1.6;">
          Feel free to call us anytime or reply to this email with any questions.
        </p>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            This message was sent on behalf of ${opts.businessName}.
          </p>
        </div>
      </div>
    </div>
  `
  )
}

// ============================================
// WELCOME EMAIL
// ============================================

export async function sendWelcomeEmail(opts: {
  ownerEmail: string
  businessName: string
}) {
  return sendNotification(
    opts.ownerEmail,
    'Welcome to VoiceFly — your AI phone employee is almost ready',
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
        <h1 style="margin:0 0 8px;color:#1e293b;font-size:24px;font-weight:700;">Welcome to VoiceFly</h1>
        <p style="margin:0 0 20px;color:#64748b;font-size:15px;">Hi ${opts.businessName},</p>
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
          VoiceFly gives your business AI employees that answer your calls 24/7 — so you never miss a customer again.
        </p>
        <div style="text-align:center;margin:28px 0;">
          <a href="https://www.voiceflyai.com/dashboard"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
            Set Up Your First Employee
          </a>
        </div>
        <div style="border-top:1px solid #e2e8f0;margin-top:28px;padding-top:20px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;">
            Questions? Reply to this email anytime.
          </p>
        </div>
      </div>
    </div>
  `
  )
}

// ============================================
// EMPLOYEE READY EMAIL
// ============================================

function formatJobType(jobType: string): string {
  return jobType
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function sendEmployeeReadyEmail(opts: {
  ownerEmail: string
  businessName: string
  employeeName: string
  phoneNumber: string
  jobType: string
}) {
  const formattedJobType = formatJobType(opts.jobType)

  return sendNotification(
    opts.ownerEmail,
    `${opts.employeeName} is ready — your AI employee is live at ${opts.phoneNumber}`,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:32px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <span style="background:#16a34a;color:#fff;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:0.5px;">LIVE</span>
          <span style="color:#166534;font-size:14px;font-weight:600;">${opts.businessName}</span>
        </div>
        <h2 style="margin:0 0 4px;color:#166534;font-size:22px;font-weight:700;">${opts.employeeName}</h2>
        <p style="margin:0 0 4px;color:#4ade80;font-size:14px;">${formattedJobType}</p>
        <div style="background:#fff;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Phone Number</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#166534;letter-spacing:1px;">${opts.phoneNumber}</p>
        </div>
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
          You can call this number right now to test your AI employee.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://www.voiceflyai.com/dashboard/employees"
             style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
            View Employee Dashboard
          </a>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#6b7280;text-align:center;">
          Calls to this number will be answered 24/7 and use your monthly minutes.
        </p>
      </div>
    </div>
  `
  )
}

// ============================================
// SMS REGISTRATION APPROVED EMAIL
// ============================================

export async function sendSmsApprovedEmail(opts: {
  ownerEmail: string
  businessName: string
  smsPhoneNumber?: string | null
}) {
  return sendNotification(
    opts.ownerEmail,
    `SMS is live for ${opts.businessName} — your AI can now text customers`,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:32px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <span style="background:#2563eb;color:#fff;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:0.5px;">APPROVED</span>
          <span style="color:#1e40af;font-size:14px;font-weight:600;">${opts.businessName}</span>
        </div>
        <h2 style="margin:0 0 12px;color:#1e40af;font-size:22px;font-weight:700;">SMS is live.</h2>
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
          Your A2P 10DLC registration was approved by US wireless carriers. Your AI phone employee can now send appointment confirmations, reminders, and follow-ups by text.
        </p>
        ${opts.smsPhoneNumber ? `
        <div style="background:#fff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">SMS Number</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#1e40af;letter-spacing:1px;">${opts.smsPhoneNumber}</p>
        </div>
        ` : ''}
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
          Nothing else to do on your end — SMS will automatically fire on calls that need follow-ups going forward.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://www.voiceflyai.com/dashboard/messages"
             style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
            Open SMS Dashboard
          </a>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#6b7280;text-align:center;">
          Your plan includes a monthly SMS allowance. You can check usage anytime in your dashboard.
        </p>
      </div>
    </div>
  `
  )
}

// ============================================
// INSURANCE VERIFICATION NEEDED EMAIL
// ============================================

export async function sendInsuranceVerificationNeededEmail(opts: {
  ownerEmail: string
  businessName: string
  customerName: string
  customerPhone: string
  carrier: string
  memberId: string
  procedureInquired: string | null
  recordId: string
}) {
  const dashboardUrl = `https://www.voiceflyai.com/dashboard/insurance-verifications`
  const procedureLine = opts.procedureInquired
    ? `<p style="margin:0 0 4px;color:#6b7280;font-size:13px;">For: ${opts.procedureInquired}</p>`
    : ''

  return sendNotification(
    opts.ownerEmail,
    `New insurance to verify: ${opts.customerName} (${opts.carrier})`,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:32px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <span style="background:#0284c7;color:#fff;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:0.5px;">VERIFY</span>
          <span style="color:#0c4a6e;font-size:14px;font-weight:600;">${opts.businessName}</span>
        </div>
        <h2 style="margin:0 0 12px;color:#0c4a6e;font-size:22px;font-weight:700;">${opts.customerName}</h2>
        ${procedureLine}
        <div style="background:#fff;border:1px solid #bae6fd;border-radius:8px;padding:16px;margin:20px 0;">
          <div style="margin-bottom:8px;">
            <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Carrier</p>
            <p style="margin:0;font-size:16px;font-weight:600;color:#0c4a6e;">${opts.carrier}</p>
          </div>
          <div style="margin-bottom:8px;">
            <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Member ID</p>
            <p style="margin:0;font-size:14px;font-family:'SF Mono',Monaco,monospace;color:#0c4a6e;">${opts.memberId}</p>
          </div>
          <div>
            <p style="margin:0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Callback</p>
            <p style="margin:0;font-size:14px;color:#0c4a6e;">${opts.customerPhone}</p>
          </div>
        </div>
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
          Verify coverage with the carrier, then update the record. The patient will get an SMS confirmation automatically once you mark it verified.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${dashboardUrl}"
             style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
            Open Verification Queue
          </a>
        </div>
      </div>
    </div>
  `
  )
}

// ============================================
// SMS USAGE WARNING EMAIL (80% of monthly limit)
// ============================================

export async function sendSmsUsageWarningEmail(opts: {
  ownerEmail: string
  businessName: string
  segmentsUsed: number
  segmentsLimit: number
}) {
  const percentUsed = Math.round((opts.segmentsUsed / opts.segmentsLimit) * 100)
  const remaining = Math.max(0, opts.segmentsLimit - opts.segmentsUsed)

  return sendNotification(
    opts.ownerEmail,
    `${opts.businessName}: You've used ${percentUsed}% of your SMS allowance this month`,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:32px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
          <span style="background:#f59e0b;color:#fff;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:0.5px;">SMS USAGE</span>
          <span style="color:#92400e;font-size:14px;font-weight:600;">${opts.businessName}</span>
        </div>
        <h2 style="margin:0 0 12px;color:#92400e;font-size:22px;font-weight:700;">${percentUsed}% of your SMS allowance used</h2>
        <div style="background:#fff;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span style="color:#6b7280;font-size:13px;">Used this month</span>
            <span style="color:#111827;font-weight:600;">${opts.segmentsUsed.toLocaleString()} / ${opts.segmentsLimit.toLocaleString()} segments</span>
          </div>
          <div style="height:8px;background:#fef3c7;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(100, percentUsed)}%;background:#f59e0b;"></div>
          </div>
          <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">${remaining.toLocaleString()} segments remaining until next billing cycle.</p>
        </div>
        <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">
          When you exceed your allowance, additional messages are billed at your plan's overage rate. Upgrade to a higher tier for more included segments and a lower per-segment rate.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://www.voiceflyai.com/dashboard/billing"
             style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
            Manage Plan
          </a>
        </div>
      </div>
    </div>
  `
  )
}

// ============================================
// LOW CREDIT WARNING EMAIL
// ============================================

export async function sendLowCreditWarningEmail(opts: {
  ownerEmail: string
  businessName: string
  minutesRemaining: number
  totalMinutes: number
  percentRemaining: number
}) {
  const percentUsed = 100 - opts.percentRemaining
  const barWidth = Math.round(Math.max(0, Math.min(100, percentUsed)))

  return sendNotification(
    opts.ownerEmail,
    `⚠️ ${opts.businessName}: you're running low on call minutes`,
    `
    <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:32px;">
        <h2 style="margin:0 0 8px;color:#92400e;font-size:20px;font-weight:700;">
          Running Low on Minutes
        </h2>
        <p style="margin:0 0 20px;color:#78350f;font-size:15px;">
          ${opts.businessName} has used ${percentUsed}% of this month&rsquo;s call minutes.
        </p>
        <div style="margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 6px;font-size:13px;color:#92400e;font-weight:600;">
                ${opts.minutesRemaining} min remaining of ${opts.totalMinutes} min
              </td>
            </tr>
            <tr>
              <td style="padding:0;">
                <table style="width:100%;border-collapse:collapse;background:#fde68a;border-radius:4px;overflow:hidden;">
                  <tr>
                    <td style="padding:0;width:${barWidth}%;background:#f59e0b;height:12px;border-radius:4px 0 0 4px;"></td>
                    <td style="padding:0;"></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
        <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
          When minutes run out, new calls cannot be answered. Add more minutes or upgrade your plan to stay covered.
        </p>
        <div style="text-align:center;margin:20px 0;">
          <a href="https://www.voiceflyai.com/dashboard/billing"
             style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">
            Add More Minutes
          </a>
        </div>
        <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;text-align:center;">
          <a href="https://www.voiceflyai.com/dashboard/billing" style="color:#d97706;text-decoration:none;">View billing &amp; plans</a>
        </p>
      </div>
    </div>
  `
  )
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

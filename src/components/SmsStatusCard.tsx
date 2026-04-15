'use client'

/**
 * SMS Status Card — shown on the main dashboard.
 *
 * Three states:
 *   1. No registration started    → "Enable SMS" CTA to /dashboard/settings/sms
 *   2. Registration in progress   → status timeline + "View details" link
 *   3. Active                     → usage bar (used / limit) + upgrade CTA if >80%
 *
 * Self-fetches so the dashboard page stays uncluttered. Fails silently if the
 * migration hasn't run (old businesses without sms_* columns).
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChatBubbleLeftRightIcon, CheckCircleIcon, ArrowRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase-client'

interface Props {
  businessId: string
  /**
   * Total call count — when >= 3, the "not started" nudge becomes more
   * emphatic because the tenant has seen the product work.
   */
  callCount?: number
}

interface SmsState {
  enabled: boolean
  segmentsUsed: number
  segmentsLimit: number
  registrationStatus:
    | 'none'
    | 'draft'
    | 'customer_profile_pending'
    | 'customer_profile_approved'
    | 'customer_profile_rejected'
    | 'brand_pending'
    | 'brand_approved'
    | 'brand_rejected'
    | 'campaign_pending'
    | 'campaign_approved'
    | 'campaign_rejected'
    | 'active'
}

const PENDING_STATUSES = ['customer_profile_pending', 'customer_profile_approved', 'brand_pending', 'brand_approved', 'campaign_pending']
const REJECTED_STATUSES = ['customer_profile_rejected', 'brand_rejected', 'campaign_rejected']

export default function SmsStatusCard({ businessId, callCount = 0 }: Props) {
  const [state, setState] = useState<SmsState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch business SMS columns + registration status in parallel
        const { data: { session } } = await supabase.auth.getSession()
        const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}

        const [bizRes, regRes] = await Promise.all([
          supabase
            .from('businesses')
            .select('sms_enabled, sms_segments_used, sms_segments_limit')
            .eq('id', businessId)
            .maybeSingle(),
          fetch(`/api/sms-registration/status?businessId=${businessId}`, { headers }).catch(() => null),
        ])

        const regData = regRes?.ok ? await regRes.json() : null
        const registrationStatus = regData?.registration?.status || 'none'

        setState({
          enabled: !!bizRes.data?.sms_enabled,
          segmentsUsed: bizRes.data?.sms_segments_used ?? 0,
          segmentsLimit: bizRes.data?.sms_segments_limit ?? 0,
          registrationStatus: registrationStatus as SmsState['registrationStatus'],
        })
      } catch (err) {
        console.error('[SmsStatusCard] load failed', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [businessId])

  if (loading || !state) return null

  // ── State 3: Active ──
  if (state.enabled && state.segmentsLimit > 0) {
    const percent = Math.min(100, Math.round((state.segmentsUsed / state.segmentsLimit) * 100))
    const isHigh = percent >= 80
    const remaining = Math.max(0, state.segmentsLimit - state.segmentsUsed)

    return (
      <section className={`rounded-xl p-5 ${isHigh ? 'bg-accent/10 border border-accent/20' : 'bg-surface-low'}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-brand-primary" />
            <h3 className="font-semibold text-text-primary">SMS usage</h3>
            <span className="inline-flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircleIcon className="h-3 w-3" /> Active
            </span>
          </div>
          {isHigh && (
            <Link href="/dashboard/billing" className="text-xs font-medium text-accent underline whitespace-nowrap">
              Upgrade for more
            </Link>
          )}
        </div>

        <div className="flex items-baseline justify-between mb-2 text-sm">
          <span className="text-text-secondary">
            {state.segmentsUsed.toLocaleString()} / {state.segmentsLimit.toLocaleString()} segments this month
          </span>
          <span className={`font-semibold ${isHigh ? 'text-accent' : 'text-text-primary'}`}>
            {remaining.toLocaleString()} remaining
          </span>
        </div>
        <div className="h-2 w-full bg-surface-high rounded-full overflow-hidden">
          <div
            className={`h-full ${isHigh ? 'bg-accent' : 'bg-brand-primary'} transition-all`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>
    )
  }

  // ── State 2: In progress ──
  if (PENDING_STATUSES.includes(state.registrationStatus)) {
    const stepLabel =
      state.registrationStatus.startsWith('customer_profile') ? 'Identity being verified (1-2 days)' :
      state.registrationStatus.startsWith('brand') ? 'Brand registration with carriers (few days)' :
      'Campaign approval in progress (2-3 weeks total)'

    return (
      <section className="rounded-xl p-5 bg-surface-low border border-brand-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-brand-light" />
          <h3 className="font-semibold text-text-primary">SMS registration in progress</h3>
          <span className="inline-flex items-center gap-1 text-xs text-brand-light bg-brand-primary/10 px-2 py-0.5 rounded-full animate-pulse">
            Pending
          </span>
        </div>
        <p className="text-sm text-text-secondary mb-3">{stepLabel}</p>
        <Link href="/dashboard/settings/sms" className="text-xs font-medium text-brand-light hover:text-brand-primary inline-flex items-center gap-1">
          View status
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </section>
    )
  }

  // ── Rejected: prompt to retry ──
  if (REJECTED_STATUSES.includes(state.registrationStatus)) {
    return (
      <section className="rounded-xl p-5 bg-accent/10 border border-accent/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-text-primary">SMS registration was not approved</h3>
              <p className="text-sm text-text-secondary mt-0.5">Update your business info and resubmit to enable SMS.</p>
            </div>
          </div>
          <Link
            href="/dashboard/settings/sms"
            className="text-xs font-semibold bg-accent text-surface px-3 py-1.5 rounded-lg whitespace-nowrap"
          >
            Fix & retry
          </Link>
        </div>
      </section>
    )
  }

  // ── State 1: Not started — high-intent nudge (emphasized if the tenant has call traction) ──
  const hasTraction = callCount >= 3

  return (
    <section className={`rounded-xl p-5 border ${
      hasTraction
        ? 'bg-brand-primary/10 border-brand-primary/40 ring-1 ring-brand-primary/20'
        : 'bg-brand-primary/5 border-brand-primary/20'
    }`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-text-primary">
              {hasTraction
                ? `You've handled ${callCount} calls — reduce no-shows with SMS reminders`
                : 'Unlock SMS follow-ups'}
            </h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {hasTraction
                ? 'Let your AI automatically text appointment confirmations and reminders. Businesses that enable SMS reminders typically see 60% fewer no-shows. Registration is included in your plan.'
                : 'Let your AI send appointment confirmations, reminders, and follow-up texts. Included in your plan — we handle A2P registration with carriers at no extra cost.'}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/sms"
          className="text-xs font-semibold bg-brand-primary text-brand-on px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-[#0060d0] transition-colors"
        >
          Enable SMS
        </Link>
      </div>
    </section>
  )
}

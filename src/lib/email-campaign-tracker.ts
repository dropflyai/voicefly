/**
 * VoiceFly Email Campaign Tracker
 *
 * Tracks opens, clicks, conversions, and supports A/B testing.
 * Uses a tracking pixel for opens and redirect links for clicks.
 *
 * Flow:
 * 1. Create campaign with variants (A/B test)
 * 2. Send emails with tracking pixel + tracked links
 * 3. Track opens via /api/track/open?cid=X&eid=Y (1x1 pixel)
 * 4. Track clicks via /api/track/click?cid=X&eid=Y&url=Z (redirect)
 * 5. Track conversions when a recipient signs up or upgrades
 * 6. Dashboard shows which variant wins
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://voicefly.ai'

// ============================================================================
// Types
// ============================================================================

export interface EmailCampaign {
  id: string
  name: string
  status: 'draft' | 'sending' | 'sent' | 'completed'
  type: 'single' | 'ab_test'
  variants: CampaignVariant[]
  targetAudience: string
  totalRecipients: number
  sentAt?: string
  completedAt?: string
  createdAt: string
}

export interface CampaignVariant {
  id: string
  label: string  // "A" or "B"
  subject: string
  htmlBody: string
  recipientCount: number
  metrics: VariantMetrics
}

export interface VariantMetrics {
  sent: number
  opened: number
  uniqueOpens: number
  clicked: number
  uniqueClicks: number
  replied: number
  converted: number
  unsubscribed: number
  openRate: number
  clickRate: number
  conversionRate: number
}

export interface EmailRecipient {
  id: string
  campaignId: string
  variantId: string
  email: string
  name?: string
  businessName?: string
  industry?: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'converted' | 'bounced' | 'unsubscribed'
  sentAt?: string
  firstOpenedAt?: string
  lastOpenedAt?: string
  openCount: number
  clickedLinks: string[]
  convertedAt?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Campaign Management
// ============================================================================

/**
 * Create a new email campaign (single or A/B test).
 */
export async function createCampaign(options: {
  name: string
  type: 'single' | 'ab_test'
  variants: { label: string; subject: string; htmlBody: string }[]
  targetAudience?: string
}): Promise<EmailCampaign> {
  const variantsWithMetrics = options.variants.map((v, i) => ({
    id: `var_${Date.now()}_${i}`,
    ...v,
    recipientCount: 0,
    metrics: emptyMetrics(),
  }))

  const { data, error } = await supabase
    .from('email_campaigns')
    .insert({
      name: options.name,
      status: 'draft',
      type: options.type,
      variants: variantsWithMetrics,
      target_audience: options.targetAudience || 'prospects',
      total_recipients: 0,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create campaign: ${error.message}`)
  return mapCampaignRecord(data)
}

/**
 * Add recipients to a campaign. For A/B tests, auto-splits 50/50.
 */
export async function addRecipients(
  campaignId: string,
  recipients: { email: string; name?: string; businessName?: string; industry?: string }[]
): Promise<{ added: number; variantSplit: Record<string, number> }> {
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('variants, type')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')

  const variants = campaign.variants as CampaignVariant[]
  const split: Record<string, number> = {}
  variants.forEach(v => { split[v.id] = 0 })

  const rows = recipients.map((r, i) => {
    // For A/B test, alternate between variants
    const variantIndex = campaign.type === 'ab_test' ? i % variants.length : 0
    const variant = variants[variantIndex]
    split[variant.id] = (split[variant.id] || 0) + 1

    return {
      campaign_id: campaignId,
      variant_id: variant.id,
      email: r.email,
      name: r.name || null,
      business_name: r.businessName || null,
      industry: r.industry || null,
      status: 'pending',
      open_count: 0,
      clicked_links: [],
    }
  })

  const { error } = await supabase
    .from('email_campaign_recipients')
    .insert(rows)

  if (error) throw new Error(`Failed to add recipients: ${error.message}`)

  // Update campaign totals
  await supabase
    .from('email_campaigns')
    .update({ total_recipients: recipients.length })
    .eq('id', campaignId)

  return { added: recipients.length, variantSplit: split }
}

/**
 * Get campaign with full metrics.
 */
export async function getCampaignWithMetrics(campaignId: string): Promise<EmailCampaign & { recipients: EmailRecipient[] }> {
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (!campaign) throw new Error('Campaign not found')

  const { data: recipients } = await supabase
    .from('email_campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true })

  const mapped = mapCampaignRecord(campaign)

  // Recalculate metrics from recipient data
  for (const variant of mapped.variants) {
    const varRecipients = (recipients || []).filter((r: { variant_id: string }) => r.variant_id === variant.id)
    variant.recipientCount = varRecipients.length
    variant.metrics = calculateMetrics(varRecipients)
  }

  return {
    ...mapped,
    recipients: (recipients || []).map(mapRecipientRecord),
  }
}

/**
 * List all campaigns.
 */
export async function listCampaigns(options?: {
  status?: string
  limit?: number
}): Promise<EmailCampaign[]> {
  let query = supabase
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit || 20)

  if (options?.status) query = query.eq('status', options.status)

  const { data, error } = await query
  if (error) throw new Error(`Failed to list campaigns: ${error.message}`)
  return (data || []).map(mapCampaignRecord)
}

// ============================================================================
// Tracking
// ============================================================================

/**
 * Record an email open (called by tracking pixel endpoint).
 */
export async function trackOpen(campaignId: string, recipientEmail: string): Promise<void> {
  const now = new Date().toISOString()

  const { data: recipient } = await supabase
    .from('email_campaign_recipients')
    .select('id, open_count, first_opened_at')
    .eq('campaign_id', campaignId)
    .eq('email', recipientEmail)
    .single()

  if (!recipient) return

  await supabase
    .from('email_campaign_recipients')
    .update({
      status: 'opened',
      first_opened_at: recipient.first_opened_at || now,
      last_opened_at: now,
      open_count: (recipient.open_count || 0) + 1,
    })
    .eq('id', recipient.id)
}

/**
 * Record a link click (called by redirect endpoint).
 */
export async function trackClick(campaignId: string, recipientEmail: string, url: string): Promise<void> {
  const { data: recipient } = await supabase
    .from('email_campaign_recipients')
    .select('id, clicked_links, first_opened_at')
    .eq('campaign_id', campaignId)
    .eq('email', recipientEmail)
    .single()

  if (!recipient) return

  const now = new Date().toISOString()
  const links = (recipient.clicked_links || []) as string[]
  if (!links.includes(url)) links.push(url)

  await supabase
    .from('email_campaign_recipients')
    .update({
      status: 'clicked',
      clicked_links: links,
      first_opened_at: recipient.first_opened_at || now,
      last_opened_at: now,
    })
    .eq('id', recipient.id)
}

/**
 * Record a conversion (signup or upgrade).
 */
export async function trackConversion(email: string): Promise<{ campaignId: string; variantId: string } | null> {
  const now = new Date().toISOString()

  // Find the most recent campaign this email was part of
  const { data } = await supabase
    .from('email_campaign_recipients')
    .select('id, campaign_id, variant_id')
    .eq('email', email)
    .in('status', ['sent', 'opened', 'clicked'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null

  await supabase
    .from('email_campaign_recipients')
    .update({ status: 'converted', converted_at: now })
    .eq('id', data.id)

  return { campaignId: data.campaign_id, variantId: data.variant_id }
}

// ============================================================================
// A/B Test Analysis
// ============================================================================

/**
 * Get A/B test results with winner determination.
 */
export async function getABTestResults(campaignId: string): Promise<{
  campaign: string
  variants: { label: string; subject: string; metrics: VariantMetrics }[]
  winner: { label: string; reason: string } | null
  confidence: string
  recommendation: string
}> {
  const campaign = await getCampaignWithMetrics(campaignId)

  if (campaign.type !== 'ab_test' || campaign.variants.length < 2) {
    throw new Error('Not an A/B test campaign')
  }

  const variants = campaign.variants.map(v => ({
    label: v.label,
    subject: v.subject,
    metrics: v.metrics,
  }))

  // Determine winner based on conversion rate, then click rate, then open rate
  let winner: { label: string; reason: string } | null = null
  const [a, b] = variants

  if (a.metrics.sent < 10 || b.metrics.sent < 10) {
    return {
      campaign: campaign.name,
      variants,
      winner: null,
      confidence: 'insufficient_data',
      recommendation: `Need at least 10 sends per variant. Currently: ${a.label}=${a.metrics.sent}, ${b.label}=${b.metrics.sent}`,
    }
  }

  // Compare conversion rates first
  if (a.metrics.conversionRate !== b.metrics.conversionRate) {
    const w = a.metrics.conversionRate > b.metrics.conversionRate ? a : b
    const l = a.metrics.conversionRate > b.metrics.conversionRate ? b : a
    winner = { label: w.label, reason: `${w.metrics.conversionRate.toFixed(1)}% conversion vs ${l.metrics.conversionRate.toFixed(1)}%` }
  }
  // Then click rates
  else if (a.metrics.clickRate !== b.metrics.clickRate) {
    const w = a.metrics.clickRate > b.metrics.clickRate ? a : b
    const l = a.metrics.clickRate > b.metrics.clickRate ? b : a
    winner = { label: w.label, reason: `${w.metrics.clickRate.toFixed(1)}% click rate vs ${l.metrics.clickRate.toFixed(1)}%` }
  }
  // Then open rates
  else if (a.metrics.openRate !== b.metrics.openRate) {
    const w = a.metrics.openRate > b.metrics.openRate ? a : b
    const l = a.metrics.openRate > b.metrics.openRate ? b : a
    winner = { label: w.label, reason: `${w.metrics.openRate.toFixed(1)}% open rate vs ${l.metrics.openRate.toFixed(1)}%` }
  }

  const totalSends = a.metrics.sent + b.metrics.sent
  const confidence = totalSends >= 100 ? 'high' : totalSends >= 50 ? 'medium' : 'low'

  const winnerLabel = winner?.label || 'tie'
  const recommendation = winner
    ? `Use variant ${winnerLabel} ("${variants.find(v => v.label === winnerLabel)?.subject}") for future sends. ${winner.reason}.`
    : 'No clear winner yet. Continue testing or increase sample size.'

  return {
    campaign: campaign.name,
    variants,
    winner,
    confidence,
    recommendation,
  }
}

/**
 * Get who opened but didn't convert (the hot leads).
 */
export async function getOpenedNotConverted(campaignId: string): Promise<EmailRecipient[]> {
  const { data } = await supabase
    .from('email_campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .in('status', ['opened', 'clicked'])
    .order('open_count', { ascending: false })

  return (data || []).map(mapRecipientRecord)
}

/**
 * Get recipients who haven't opened at all.
 */
export async function getNonOpeners(campaignId: string): Promise<EmailRecipient[]> {
  const { data } = await supabase
    .from('email_campaign_recipients')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'sent')

  return (data || []).map(mapRecipientRecord)
}

// ============================================================================
// Email Injection (adds tracking to HTML)
// ============================================================================

/**
 * Inject tracking pixel and tracked links into an email HTML body.
 */
export function injectTracking(
  html: string,
  campaignId: string,
  recipientEmail: string
): string {
  const encodedEmail = encodeURIComponent(recipientEmail)

  // Add tracking pixel before </body>
  const pixel = `<img src="${APP_URL}/api/track/open?cid=${campaignId}&e=${encodedEmail}" width="1" height="1" style="display:none;" alt="">`
  let tracked = html.replace('</body>', pixel + '</body>')

  // Replace links with tracked redirects
  tracked = tracked.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      // Don't track unsubscribe or mailto links
      if (url.includes('unsubscribe') || url.startsWith('mailto:')) return match
      const encodedUrl = encodeURIComponent(url)
      return `href="${APP_URL}/api/track/click?cid=${campaignId}&e=${encodedEmail}&url=${encodedUrl}"`
    }
  )

  return tracked
}

// ============================================================================
// Helpers
// ============================================================================

function emptyMetrics(): VariantMetrics {
  return {
    sent: 0, opened: 0, uniqueOpens: 0, clicked: 0, uniqueClicks: 0,
    replied: 0, converted: 0, unsubscribed: 0,
    openRate: 0, clickRate: 0, conversionRate: 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateMetrics(recipients: any[]): VariantMetrics {
  const sent = recipients.filter(r => r.status !== 'pending').length
  const opened = recipients.filter(r => r.first_opened_at).length
  const clicked = recipients.filter(r => (r.clicked_links || []).length > 0).length
  const converted = recipients.filter(r => r.status === 'converted').length

  return {
    sent,
    opened: recipients.reduce((sum: number, r: { open_count: number }) => sum + (r.open_count || 0), 0),
    uniqueOpens: opened,
    clicked: recipients.reduce((sum: number, r: { clicked_links: string[] }) => sum + (r.clicked_links || []).length, 0),
    uniqueClicks: clicked,
    replied: 0,
    converted,
    unsubscribed: recipients.filter(r => r.status === 'unsubscribed').length,
    openRate: sent > 0 ? (opened / sent) * 100 : 0,
    clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
    conversionRate: sent > 0 ? (converted / sent) * 100 : 0,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCampaignRecord(row: any): EmailCampaign {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    type: row.type,
    variants: row.variants || [],
    targetAudience: row.target_audience,
    totalRecipients: row.total_recipients || 0,
    sentAt: row.sent_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecipientRecord(row: any): EmailRecipient {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    variantId: row.variant_id,
    email: row.email,
    name: row.name,
    businessName: row.business_name,
    industry: row.industry,
    status: row.status,
    sentAt: row.sent_at,
    firstOpenedAt: row.first_opened_at,
    lastOpenedAt: row.last_opened_at,
    openCount: row.open_count || 0,
    clickedLinks: row.clicked_links || [],
    convertedAt: row.converted_at,
    metadata: row.metadata,
  }
}

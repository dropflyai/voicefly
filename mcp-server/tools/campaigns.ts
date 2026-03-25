/**
 * VoiceFly MCP — Email Campaign Tools
 *
 * 7 tools for email campaign tracking and A/B testing:
 * - Create campaigns (single or A/B test)
 * - Add recipients
 * - Get campaign metrics
 * - A/B test results
 * - Who opened but didn't convert
 * - Non-openers for re-send
 * - Track conversion manually
 */

import { createClient } from '@supabase/supabase-js'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const campaignTools: Tool[] = [
  {
    name: 'create_email_campaign',
    description: 'Create a new email campaign (single send or A/B test). For A/B tests, provide two variants with different subjects to test which performs better.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Campaign name (e.g., "March VoiceFly Outreach")' },
        type: { type: 'string', enum: ['single', 'ab_test'], description: 'Single email or A/B test. Default: single' },
        variant_a_subject: { type: 'string', description: 'Subject line for variant A (or the only variant)' },
        variant_b_subject: { type: 'string', description: 'Subject line for variant B (only for A/B tests)' },
        target_audience: { type: 'string', description: 'Description of target audience' },
      },
      required: ['name', 'variant_a_subject'],
    },
  },
  {
    name: 'add_campaign_recipients',
    description: 'Add recipients to an email campaign. For A/B tests, recipients are automatically split 50/50 between variants.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
        recipients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              name: { type: 'string' },
              business_name: { type: 'string' },
              industry: { type: 'string' },
            },
            required: ['email'],
          },
        },
      },
      required: ['campaign_id', 'recipients'],
    },
  },
  {
    name: 'get_campaign_metrics',
    description: 'Get full metrics for an email campaign — opens, clicks, conversions, open rate, click rate, conversion rate. For A/B tests, shows per-variant breakdown.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_ab_test_results',
    description: 'Get A/B test results with winner determination. Shows which variant has better open rate, click rate, and conversion rate, plus confidence level and recommendation.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID (must be an A/B test campaign)' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_opened_not_converted',
    description: 'Get recipients who opened the email but did NOT convert — these are hot leads ready for follow-up. Sorted by open count (most engaged first).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_non_openers',
    description: 'Get recipients who never opened the email — candidates for a re-send with a different subject line.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        campaign_id: { type: 'string', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'list_email_campaigns',
    description: 'List all email campaigns with their status and basic metrics.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['draft', 'sending', 'sent', 'completed'] },
        limit: { type: 'number', description: 'Max results. Default: 20' },
      },
    },
  },
]

export async function handleCampaignTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'create_email_campaign': {
      const type = (args.type as string) || 'single'
      const variants = [{
        id: `var_${Date.now()}_a`,
        label: 'A',
        subject: args.variant_a_subject as string,
        htmlBody: '',
        recipientCount: 0,
        metrics: { sent: 0, opened: 0, uniqueOpens: 0, clicked: 0, uniqueClicks: 0, replied: 0, converted: 0, unsubscribed: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
      }]

      if (type === 'ab_test' && args.variant_b_subject) {
        variants.push({
          id: `var_${Date.now()}_b`,
          label: 'B',
          subject: args.variant_b_subject as string,
          htmlBody: '',
          recipientCount: 0,
          metrics: { sent: 0, opened: 0, uniqueOpens: 0, clicked: 0, uniqueClicks: 0, replied: 0, converted: 0, unsubscribed: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
        })
      }

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: args.name as string,
          status: 'draft',
          type,
          variants,
          target_audience: (args.target_audience as string) || 'prospects',
          total_recipients: 0,
        })
        .select()
        .single()

      if (error) return JSON.stringify({ error: error.message })
      return JSON.stringify({ success: true, campaign: data }, null, 2)
    }

    case 'add_campaign_recipients': {
      const campaignId = args.campaign_id as string
      const recipients = args.recipients as { email: string; name?: string; business_name?: string; industry?: string }[]

      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('variants, type')
        .eq('id', campaignId)
        .single()

      if (!campaign) return JSON.stringify({ error: 'Campaign not found' })

      const variants = campaign.variants as { id: string }[]
      const rows = recipients.map((r, i) => ({
        campaign_id: campaignId,
        variant_id: variants[campaign.type === 'ab_test' ? i % variants.length : 0].id,
        email: r.email,
        name: r.name || null,
        business_name: r.business_name || null,
        industry: r.industry || null,
        status: 'pending',
        open_count: 0,
        clicked_links: [],
      }))

      const { error } = await supabase.from('email_campaign_recipients').insert(rows)
      if (error) return JSON.stringify({ error: error.message })

      await supabase.from('email_campaigns').update({ total_recipients: recipients.length }).eq('id', campaignId)

      return JSON.stringify({ success: true, added: recipients.length })
    }

    case 'get_campaign_metrics': {
      const campaignId = args.campaign_id as string

      const { data: campaign } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (!campaign) return JSON.stringify({ error: 'Campaign not found' })

      const { data: recipients } = await supabase
        .from('email_campaign_recipients')
        .select('variant_id, status, open_count, clicked_links, first_opened_at, converted_at')
        .eq('campaign_id', campaignId)

      const variants = (campaign.variants as { id: string; label: string; subject: string }[]).map(v => {
        const vRecipients = (recipients || []).filter(r => r.variant_id === v.id)
        const sent = vRecipients.filter(r => r.status !== 'pending').length
        const opened = vRecipients.filter(r => r.first_opened_at).length
        const clicked = vRecipients.filter(r => (r.clicked_links || []).length > 0).length
        const converted = vRecipients.filter(r => r.status === 'converted').length

        return {
          label: v.label,
          subject: v.subject,
          recipients: vRecipients.length,
          sent,
          opened,
          clicked,
          converted,
          openRate: sent > 0 ? `${((opened / sent) * 100).toFixed(1)}%` : '0%',
          clickRate: sent > 0 ? `${((clicked / sent) * 100).toFixed(1)}%` : '0%',
          conversionRate: sent > 0 ? `${((converted / sent) * 100).toFixed(1)}%` : '0%',
        }
      })

      return JSON.stringify({
        campaign: campaign.name,
        type: campaign.type,
        status: campaign.status,
        totalRecipients: campaign.total_recipients,
        variants,
      }, null, 2)
    }

    case 'get_ab_test_results': {
      const campaignId = args.campaign_id as string
      // Reuse get_campaign_metrics logic + add winner determination
      const metricsResult = await handleCampaignTool('get_campaign_metrics', { campaign_id: campaignId })
      const metrics = JSON.parse(metricsResult)

      if (metrics.error) return metricsResult
      if (metrics.type !== 'ab_test') return JSON.stringify({ error: 'Not an A/B test campaign' })
      if (metrics.variants.length < 2) return JSON.stringify({ error: 'Need at least 2 variants' })

      const [a, b] = metrics.variants
      let winner = null
      let reason = ''

      const aConv = parseFloat(a.conversionRate)
      const bConv = parseFloat(b.conversionRate)
      const aClick = parseFloat(a.clickRate)
      const bClick = parseFloat(b.clickRate)
      const aOpen = parseFloat(a.openRate)
      const bOpen = parseFloat(b.openRate)

      if (aConv !== bConv) {
        winner = aConv > bConv ? a.label : b.label
        reason = `${winner} has higher conversion rate: ${aConv > bConv ? a.conversionRate : b.conversionRate} vs ${aConv > bConv ? b.conversionRate : a.conversionRate}`
      } else if (aClick !== bClick) {
        winner = aClick > bClick ? a.label : b.label
        reason = `${winner} has higher click rate: ${aClick > bClick ? a.clickRate : b.clickRate} vs ${aClick > bClick ? b.clickRate : a.clickRate}`
      } else if (aOpen !== bOpen) {
        winner = aOpen > bOpen ? a.label : b.label
        reason = `${winner} has higher open rate: ${aOpen > bOpen ? a.openRate : b.openRate} vs ${aOpen > bOpen ? b.openRate : a.openRate}`
      }

      const totalSent = (a.sent || 0) + (b.sent || 0)

      return JSON.stringify({
        ...metrics,
        winner: winner ? { label: winner, reason } : null,
        confidence: totalSent >= 100 ? 'high' : totalSent >= 50 ? 'medium' : 'low',
        recommendation: winner
          ? `Use variant ${winner} ("${metrics.variants.find((v: { label: string }) => v.label === winner)?.subject}") for future sends.`
          : 'No clear winner yet. Need more data.',
      }, null, 2)
    }

    case 'get_opened_not_converted': {
      const { data } = await supabase
        .from('email_campaign_recipients')
        .select('*')
        .eq('campaign_id', args.campaign_id as string)
        .in('status', ['opened', 'clicked'])
        .order('open_count', { ascending: false })

      return JSON.stringify({
        count: data?.length || 0,
        hotLeads: (data || []).map(r => ({
          email: r.email,
          name: r.name,
          businessName: r.business_name,
          industry: r.industry,
          status: r.status,
          openCount: r.open_count,
          clickedLinks: r.clicked_links,
          firstOpened: r.first_opened_at,
        })),
      }, null, 2)
    }

    case 'get_non_openers': {
      const { data } = await supabase
        .from('email_campaign_recipients')
        .select('*')
        .eq('campaign_id', args.campaign_id as string)
        .eq('status', 'sent')

      return JSON.stringify({
        count: data?.length || 0,
        nonOpeners: (data || []).map(r => ({
          email: r.email,
          name: r.name,
          businessName: r.business_name,
          sentAt: r.sent_at,
        })),
      }, null, 2)
    }

    case 'list_email_campaigns': {
      let query = supabase
        .from('email_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit((args.limit as number) || 20)

      if (args.status) query = query.eq('status', args.status as string)

      const { data, error } = await query
      if (error) return JSON.stringify({ error: error.message })

      return JSON.stringify({
        count: data?.length || 0,
        campaigns: (data || []).map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          totalRecipients: c.total_recipients,
          sentAt: c.sent_at,
          createdAt: c.created_at,
        })),
      }, null, 2)
    }

    default:
      return JSON.stringify({ error: `Unknown campaign tool: ${name}` })
  }
}

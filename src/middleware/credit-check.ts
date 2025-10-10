/**
 * Credit Check Middleware
 * Validates credit availability before allowing feature usage
 */

import { NextRequest, NextResponse } from 'next/server'
import CreditSystem, { CreditCost } from '@/lib/credit-system'

interface CreditCheckOptions {
  cost: number
  feature: string
  metadata?: any
}

/**
 * Middleware to check and deduct credits for API endpoints
 * Usage in API routes:
 *
 * export async function POST(req: NextRequest) {
 *   const result = await checkAndDeductCredits(req, {
 *     cost: CreditCost.MAYA_DEEP_RESEARCH,
 *     feature: 'maya_research',
 *     metadata: { query: 'market analysis' }
 *   })
 *
 *   if (!result.success) {
 *     return result.response // Returns 402 Payment Required
 *   }
 *
 *   // Continue with feature logic...
 * }
 */
export async function checkAndDeductCredits(
  req: NextRequest,
  options: CreditCheckOptions
): Promise<{
  success: boolean
  businessId?: string
  balance?: any
  response?: NextResponse
}> {
  try {
    // Get business ID from request (assumes auth middleware has run)
    const businessId = req.headers.get('x-business-id')

    if (!businessId) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
    }

    // Check if business has enough credits
    const hasCredits = await CreditSystem.hasCredits(businessId, options.cost)

    if (!hasCredits) {
      const balance = await CreditSystem.getBalance(businessId)

      return {
        success: false,
        businessId,
        balance,
        response: NextResponse.json(
          {
            error: 'Insufficient credits',
            required: options.cost,
            available: balance?.total_credits || 0,
            feature: options.feature,
            upgrade_url: '/dashboard/billing',
            purchase_url: '/dashboard/billing/credits'
          },
          { status: 402 } // 402 Payment Required
        )
      }
    }

    // Deduct credits
    const result = await CreditSystem.deductCredits(
      businessId,
      options.cost,
      options.feature,
      options.metadata
    )

    if (!result.success) {
      return {
        success: false,
        businessId,
        balance: result.balance,
        response: NextResponse.json(
          {
            error: result.error || 'Failed to deduct credits',
            feature: options.feature
          },
          { status: 500 }
        )
      }
    }

    // Success - credits deducted
    return {
      success: true,
      businessId,
      balance: result.balance
    }
  } catch (error) {
    console.error('Credit check middleware error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper to check credits without deducting (for previews)
 */
export async function checkCreditsOnly(
  businessId: string,
  requiredCredits: number
): Promise<{
  hasEnough: boolean
  balance: any
}> {
  const hasEnough = await CreditSystem.hasCredits(businessId, requiredCredits)
  const balance = await CreditSystem.getBalance(businessId)

  return { hasEnough, balance }
}

/**
 * Get credit cost for a feature
 */
export function getCreditCost(feature: string, options?: any): number {
  switch (feature) {
    case 'voice_call_inbound':
      return CreditCost.VOICE_CALL_INBOUND
    case 'voice_call_outbound':
      return CreditCost.VOICE_CALL_OUTBOUND
    case 'maya_deep_research':
      return CreditCost.MAYA_DEEP_RESEARCH
    case 'maya_quick_research':
      return CreditCost.MAYA_QUICK_RESEARCH
    case 'maya_market_analysis':
      return CreditCost.MAYA_MARKET_ANALYSIS
    case 'appointment_booking':
      return CreditCost.APPOINTMENT_BOOKING
    case 'appointment_reminder':
      return CreditCost.APPOINTMENT_REMINDER
    case 'lead_enrichment':
      return CreditCost.LEAD_ENRICHMENT
    case 'email_campaign':
      return CreditSystem.calculateCampaignCost(options?.recipientCount || 0, 'email')
    case 'sms_campaign':
      return CreditSystem.calculateCampaignCost(options?.recipientCount || 0, 'sms')
    case 'workflow_execution':
      return CreditCost.WORKFLOW_EXECUTION
    case 'automation_trigger':
      return CreditCost.AUTOMATION_TRIGGER
    case 'ai_chat_message':
      return CreditCost.AI_CHAT_MESSAGE
    default:
      return 1 // Default cost
  }
}

/**
 * Low credit warning threshold (20%)
 */
export async function checkLowCreditWarning(businessId: string): Promise<{
  shouldWarn: boolean
  balance: any
  percentageRemaining: number
}> {
  const balance = await CreditSystem.getBalance(businessId)

  if (!balance) {
    return { shouldWarn: false, balance: null, percentageRemaining: 0 }
  }

  // Calculate total allocation (monthly + purchased)
  const totalAllocation = balance.monthly_credits + balance.purchased_credits
  const percentageRemaining = (balance.total_credits / Math.max(totalAllocation, 1)) * 100

  return {
    shouldWarn: percentageRemaining <= 20 && balance.total_credits > 0,
    balance,
    percentageRemaining
  }
}

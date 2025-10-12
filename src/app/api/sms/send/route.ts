import { NextRequest, NextResponse } from 'next/server'
import { SMSService } from '@/lib/sms-service'
import { SMSTemplates, SMSTemplateData } from '@/lib/sms-templates'
import { deductCredits, hasEnoughCredits } from '@/lib/credit-system'
import { logAuditEvent } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, template, templateData, businessId, userId } = body

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient phone number is required' },
        { status: 400 }
      )
    }

    if (!message && !template) {
      return NextResponse.json(
        { error: 'Either message or template is required' },
        { status: 400 }
      )
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Check if business has enough SMS credits (1 credit per SMS)
    const hasCredits = await hasEnoughCredits(businessId, 1)
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient SMS credits. Please upgrade your plan or purchase additional credits.' },
        { status: 402 } // Payment Required
      )
    }

    // Format phone number to E.164 format
    const formattedPhone = SMSService.formatPhoneNumber(to)

    // Generate message from template if provided
    let finalMessage = message
    if (template && templateData) {
      finalMessage = SMSTemplates.getTemplate(template, templateData as SMSTemplateData)
    }

    // Send SMS via Twilio
    const result = await SMSService.sendSMS(formattedPhone, finalMessage)

    if (result.success) {
      // Deduct SMS credit
      await deductCredits(businessId, 1, 'sms')

      // Log audit event
      await logAuditEvent({
        eventType: 'sms_sent',
        userId: userId || 'system',
        resourceType: 'sms',
        resourceId: result.sid,
        metadata: {
          to: formattedPhone,
          template: template || 'custom',
          messageLength: finalMessage.length,
          businessId
        }
      })

      return NextResponse.json({
        success: true,
        messageId: result.sid,
        to: formattedPhone,
        creditsRemaining: await getCreditsRemaining(businessId)
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get remaining credits
async function getCreditsRemaining(businessId: string): Promise<number> {
  // This would query the database for remaining SMS credits
  // For now, return a placeholder
  return 100
}

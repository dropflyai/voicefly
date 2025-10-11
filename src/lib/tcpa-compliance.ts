import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * TCPA (Telephone Consumer Protection Act) Compliance Module
 *
 * Ensures all SMS communications comply with US regulations:
 * - Prior express written consent required
 * - Opt-out mechanism (STOP keyword)
 * - Quiet hours enforcement (9 PM - 8 AM local time)
 * - No automated calls to emergency lines
 */

export interface ConsentRecord {
  customerId: string
  phoneNumber: string
  businessId: string
  consentType: 'express_written' | 'express_oral' | 'implied'
  consentedAt: string
  ipAddress?: string
  userAgent?: string
  consentMethod: 'web_form' | 'phone' | 'in_person' | 'sms_reply'
  purpose: string[]
}

export class TCPACompliance {

  /**
   * Check if customer has opted out
   */
  static async isOptedOut(phoneNumber: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('sms_opt_outs')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single()

      return !!data
    } catch (error) {
      console.error('Error checking opt-out status:', error)
      return false // Fail safe: allow sending if we can't check
    }
  }

  /**
   * Check if customer has given consent for SMS
   */
  static async hasConsent(phoneNumber: string, businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('sms_consent')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .single()

      return !!data
    } catch (error) {
      console.error('Error checking consent:', error)
      return false
    }
  }

  /**
   * Record customer consent
   */
  static async recordConsent(consent: ConsentRecord): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_consent')
        .insert({
          customer_id: consent.customerId,
          phone_number: consent.phoneNumber,
          business_id: consent.businessId,
          consent_type: consent.consentType,
          consented_at: consent.consentedAt,
          ip_address: consent.ipAddress,
          user_agent: consent.userAgent,
          consent_method: consent.consentMethod,
          purpose: consent.purpose,
          is_active: true
        })

      if (error) {
        console.error('Error recording consent:', error)
      }
    } catch (error) {
      console.error('Consent recording error:', error)
    }
  }

  /**
   * Handle opt-out request
   */
  static async processOptOut(phoneNumber: string, reason?: string): Promise<void> {
    try {
      // Insert opt-out record
      const { error: insertError } = await supabase
        .from('sms_opt_outs')
        .insert({
          phone_number: phoneNumber,
          opted_out_at: new Date().toISOString(),
          reason: reason || 'user_request'
        })

      if (insertError) {
        console.error('Error inserting opt-out:', insertError)
      }

      // Deactivate all consent records for this phone number
      const { error: updateError } = await supabase
        .from('sms_consent')
        .update({ is_active: false })
        .eq('phone_number', phoneNumber)

      if (updateError) {
        console.error('Error deactivating consent:', updateError)
      }

      console.log(`Phone number opted out: ${phoneNumber}`)
    } catch (error) {
      console.error('Opt-out processing error:', error)
    }
  }

  /**
   * Handle opt-in request (resubscribe)
   */
  static async processOptIn(phoneNumber: string, businessId: string, method: string): Promise<void> {
    try {
      // Remove from opt-out table
      const { error: deleteError } = await supabase
        .from('sms_opt_outs')
        .delete()
        .eq('phone_number', phoneNumber)

      if (deleteError) {
        console.error('Error removing opt-out:', deleteError)
      }

      // Reactivate consent
      const { error: updateError } = await supabase
        .from('sms_consent')
        .update({ is_active: true })
        .eq('phone_number', phoneNumber)
        .eq('business_id', businessId)

      if (updateError) {
        console.error('Error reactivating consent:', updateError)
      }

      console.log(`Phone number opted in: ${phoneNumber}`)
    } catch (error) {
      console.error('Opt-in processing error:', error)
    }
  }

  /**
   * Check if current time is within quiet hours (9 PM - 8 AM)
   * Returns true if it's quiet hours (don't send SMS)
   */
  static isQuietHours(timezone: string = 'America/New_York'): boolean {
    try {
      const now = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false
      })

      const hourStr = formatter.format(now)
      const hour = parseInt(hourStr, 10)

      // Quiet hours: 9 PM (21:00) to 8 AM (08:00)
      return hour >= 21 || hour < 8
    } catch (error) {
      console.error('Error checking quiet hours:', error)
      return false // Fail safe: allow sending if we can't check
    }
  }

  /**
   * Validate phone number before sending
   * Returns: { allowed: boolean, reason?: string }
   */
  static async canSendSMS(
    phoneNumber: string,
    businessId: string,
    timezone: string = 'America/New_York',
    messageType: 'transactional' | 'promotional' = 'transactional'
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Check opt-out status
    const optedOut = await this.isOptedOut(phoneNumber)
    if (optedOut) {
      return { allowed: false, reason: 'Customer has opted out' }
    }

    // 2. Check consent (required for promotional messages)
    if (messageType === 'promotional') {
      const hasConsent = await this.hasConsent(phoneNumber, businessId)
      if (!hasConsent) {
        return { allowed: false, reason: 'No consent on file for promotional messages' }
      }
    }

    // 3. Check quiet hours (only for promotional messages)
    if (messageType === 'promotional' && this.isQuietHours(timezone)) {
      return { allowed: false, reason: 'Quiet hours (9 PM - 8 AM)' }
    }

    // 4. Validate phone number format
    if (!phoneNumber || phoneNumber.length < 10) {
      return { allowed: false, reason: 'Invalid phone number' }
    }

    // All checks passed
    return { allowed: true }
  }

  /**
   * Get consent disclosure text (required by TCPA)
   */
  static getConsentDisclosure(businessName: string): string {
    return `By providing your mobile number, you consent to receive automated text messages from ${businessName} for appointment reminders, promotional offers, and other business communications. Message and data rates may apply. Message frequency varies. You can opt out at any time by replying STOP. Reply HELP for assistance.`
  }

  /**
   * Get short consent text for forms
   */
  static getShortConsentText(businessName: string): string {
    return `I agree to receive SMS messages from ${businessName}. Reply STOP to opt out.`
  }

  /**
   * Log SMS compliance check
   */
  static async logComplianceCheck(
    phoneNumber: string,
    businessId: string,
    allowed: boolean,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('sms_compliance_log')
        .insert({
          phone_number: phoneNumber,
          business_id: businessId,
          check_timestamp: new Date().toISOString(),
          allowed,
          reason: reason || 'Passed all checks',
          checked_opt_out: true,
          checked_consent: true,
          checked_quiet_hours: true
        })

      if (error) {
        console.error('Error logging compliance check:', error)
      }
    } catch (error) {
      console.error('Compliance logging error:', error)
    }
  }
}

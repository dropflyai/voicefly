const twilio = require('twilio');
const { supabase } = require('../lib/supabase');

class SMSService {
    constructor() {
        this.defaultClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }

    // Get business-specific Twilio configuration
    async getBusinessTwilioConfig(businessId) {
        const { data: phoneNumber } = await supabase
            .from('business_phone_numbers')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_sms_enabled', true)
            .eq('is_primary', true)
            .single();

        if (phoneNumber && phoneNumber.provider_sid && phoneNumber.provider_token) {
            return {
                client: twilio(phoneNumber.provider_sid, phoneNumber.provider_token),
                from: phoneNumber.phone_number
            };
        }

        // Fallback to default
        return {
            client: this.defaultClient,
            from: process.env.TWILIO_PHONE_NUMBER
        };
    }

    // Send verification code
    async sendVerificationCode(businessId, to, code) {
        try {
            const { client, from } = await this.getBusinessTwilioConfig(businessId);

            const message = await client.messages.create({
                body: `Your verification code is: ${code}. This code expires in 10 minutes.`,
                from: from,
                to: to
            });

            // Log SMS for analytics
            await supabase
                .from('analytics_events')
                .insert({
                    business_id: businessId,
                    event_type: 'sms_verification_sent',
                    event_data: {
                        to: to,
                        message_sid: message.sid,
                        code_length: code.length
                    }
                });

            return { success: true, messageSid: message.sid };

        } catch (error) {
            console.error('SMS send error:', error);
            throw new Error('Failed to send verification code');
        }
    }

    // Send appointment reminder (enhanced existing functionality)
    async sendAppointmentReminder(businessId, customerId, appointmentData) {
        try {
            // Check customer preferences
            const { data: customer } = await supabase
                .from('customers')
                .select('phone, preferences')
                .eq('id', customerId)
                .single();

            if (!customer.preferences?.sms_reminders) {
                console.log('Customer has disabled SMS reminders');
                return { success: true, skipped: true, reason: 'customer_preference' };
            }

            const { client, from } = await this.getBusinessTwilioConfig(businessId);

            const message = `Reminder: You have an appointment tomorrow at ${appointmentData.time} for ${appointmentData.service}. Reply CANCEL to cancel.`;

            const result = await client.messages.create({
                body: message,
                from: from,
                to: customer.phone
            });

            return { success: true, messageSid: result.sid };

        } catch (error) {
            console.error('SMS reminder error:', error);
            throw error;
        }
    }
}

module.exports = new SMSService();
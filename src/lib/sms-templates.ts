// SMS Message Templates for Service Business Platform

export interface SMSTemplateData {
  customerName?: string
  businessName?: string
  businessType?: string
  appointmentDate?: string
  appointmentTime?: string
  serviceName?: string
  servicePrice?: string
  location?: string
  confirmationCode?: string
  cancelUrl?: string
  rescheduleUrl?: string
  promoCode?: string
  discount?: string
  expiryDate?: string
  pointsEarned?: number
  totalPoints?: number
  nextReward?: string
  amount?: string
  paymentMethod?: string
  oldDate?: string
  oldTime?: string
}

export class SMSTemplates {
  
  /**
   * Appointment Confirmation Template
   */
  static appointmentConfirmation(data: SMSTemplateData): string {
    return `✨ Appointment Confirmed!

${data.businessName}
📅 ${data.appointmentDate} at ${data.appointmentTime}
🎯 ${data.serviceName}${data.servicePrice ? ' - $' + data.servicePrice : ''}
📍 ${data.location || 'Main Location'}

Confirmation: #${data.confirmationCode}

Reply CANCEL to cancel or call us with questions.

Thank you for choosing ${data.businessName}! 💖`
  }

  /**
   * Appointment Reminder Template (24 hours before)
   */
  static appointmentReminder24h(data: SMSTemplateData): string {
    return `⏰ Tomorrow's Appointment Reminder

Hi ${data.customerName}! Your appointment at ${data.businessName} is tomorrow at ${data.appointmentTime}.

🎯 Service: ${data.serviceName}
📍 ${data.location || 'Main Location'}

We're excited to see you! ✨

Reply RESCHEDULE if you need to change your appointment.`
  }

  /**
   * Appointment Reminder Template (2 hours before)  
   */
  static appointmentReminder2h(data: SMSTemplateData): string {
    return `🕐 Appointment Reminder - 2 Hours

Hi ${data.customerName}! Your appointment at ${data.businessName} is in 2 hours (${data.appointmentTime}).

🎯 ${data.serviceName}
📍 ${data.location || 'Main Location'}

See you soon! 💖

Reply if you're running late.`
  }

  /**
   * Appointment Cancelled Template
   */
  static appointmentCancellation(data: SMSTemplateData): string {
    return `❌ Appointment Cancelled

Your appointment at ${data.businessName} on ${data.appointmentDate} at ${data.appointmentTime} has been cancelled.

We're sorry to see you go! Book again anytime:
📱 ${process.env.NEXT_PUBLIC_APP_URL || 'Call us to book'}

Thank you! 💖`
  }

  /**
   * Appointment Rescheduled Template
   */
  static appointmentRescheduled(data: SMSTemplateData): string {
    return `🔄 Appointment Rescheduled

Your appointment has been moved:

FROM: ${data.oldDate} at ${data.oldTime}
TO: ${data.appointmentDate} at ${data.appointmentTime}

🎯 Service: ${data.serviceName}
📍 ${data.location || 'Main Location'}

Thanks for your flexibility! See you then! ✨`
  }

  /**
   * Payment Receipt Template
   */
  static paymentReceipt(data: SMSTemplateData): string {
    return `🧾 Payment Receipt

${data.businessName}
💰 Amount: $${data.amount}
💳 Payment: ${data.paymentMethod}
🗓️ Service: ${data.serviceName} on ${data.appointmentDate}

Thank you for your payment! Your appointment is confirmed. 💖

Questions? Just reply to this message.`
  }

  /**
   * New Customer Welcome Template
   */
  static welcomeNewCustomer(data: SMSTemplateData): string {
    return `👋 Welcome to ${data.businessName}!

Hi ${data.customerName}! Thank you for choosing us for your service needs. We're excited to serve you!

📱 Book anytime: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}
📞 Questions? Just reply to this message
🎁 First-time customer discount available!

Welcome to the family! 💖`
  }

  /**
   * Loyalty Points Update Template
   */
  static loyaltyPointsEarned(data: SMSTemplateData): string {
    return `🎯 Loyalty Points Earned!

Great news ${data.customerName}! You earned ${data.pointsEarned} points from your recent visit to ${data.businessName}!

💎 Total Points: ${data.totalPoints}
🎁 Next Reward: ${data.nextReward || 'Coming soon!'}

Keep visiting to earn more rewards! 💖`
  }

  /**
   * Promotional Offer Template
   */
  static promotionalOffer(data: SMSTemplateData): string {
    return `🎁 Special Offer Just For You!

${data.discount ? data.discount + ' OFF' : 'Special Discount'} your next appointment at ${data.businessName}!

${data.promoCode ? `Code: ${data.promoCode}` : ''}
${data.expiryDate ? `Valid until: ${data.expiryDate}` : ''}

Book now: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}

Terms apply. One-time use. ✨

Reply STOP to opt out of promotions.`
  }

  /**
   * Birthday Special Template
   */
  static birthdaySpecial(data: SMSTemplateData): string {
    return `🎂 Happy Birthday ${data.customerName}!

Celebrate your special day with us! ${data.businessName} wants to treat you to something special.

🎁 Birthday Special: ${data.discount || '20% OFF'} your next service
📅 Valid for 30 days from today
🎯 Any service of your choice!

Book your birthday treat: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}

Make it a beautiful day! 💖✨`
  }

  /**
   * Appointment Available (Waitlist) Template
   */
  static appointmentAvailable(data: SMSTemplateData): string {
    return `🎉 Great news! We have an opening for you:

${data.businessName}
📅 ${data.appointmentDate} at ${data.appointmentTime}
🎯 ${data.serviceName}
📍 ${data.location || 'Main Location'}

Book now: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}

This spot won't last long! ⏰`
  }

  /**
   * Service Reminder (maintenance appointments)
   */
  static serviceReminder(data: SMSTemplateData): string {
    return `💫 Time for Your Service!

Hi ${data.customerName}! It's been a while since your last visit to ${data.businessName}.

You deserve some pampering! ✨

🎁 Come back special: ${data.discount || '15% OFF'} your next service
📱 Book easily: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}

We miss you! 💖`
  }

  /**
   * No-Show Follow-Up Template
   */
  static noShowFollowUp(data: SMSTemplateData): string {
    return `😔 We Missed You Today

Hi ${data.customerName}, we had your appointment reserved at ${data.appointmentTime} today but didn't see you.

We hope everything is okay! 💖

📱 Reschedule anytime: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}
💡 Tip: Set a reminder 2 hours before your appointment

Looking forward to seeing you soon! ✨`
  }

  /**
   * Review Request Template
   */
  static reviewRequest(data: SMSTemplateData): string {
    return `⭐ How Was Your Experience?

Hi ${data.customerName}! Thank you for visiting ${data.businessName}. We hope you love the results! ✨

We'd love to hear about your experience:
📱 Leave a review: [Review Link]
📸 Share a photo and tag us!

Your feedback helps us improve! 💖

Book your next appointment: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}`
  }

  /**
   * Holiday Hours Notice Template
   */
  static holidayHours(data: SMSTemplateData): string {
    return `🎄 Holiday Hours Notice

Hi ${data.customerName}! ${data.businessName} holiday hours:

📅 [Holiday Dates]: [Special Hours]
📅 Regular hours resume: [Date]

Planning ahead? Book now:
📱 ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}

Happy Holidays! ✨💖`
  }

  /**
   * Staff Appreciation Template
   */
  static staffAppreciation(data: SMSTemplateData): string {
    return `🎆 Your Service Provider Rocks!

Hi ${data.customerName}! We're so glad you enjoyed your service with [Service Provider Name] at ${data.businessName}!

🌟 Consider leaving them a great review
💝 Tips can be added to your next visit
📱 Request them for your next appointment

Book again: ${process.env.NEXT_PUBLIC_APP_URL || 'Call us'}

Thank you for being amazing! 💖`
  }

  /**
   * Emergency/Urgent Template
   */
  static urgentNotice(data: SMSTemplateData): string {
    return `🚨 Important Notice

Hi ${data.customerName}, we need to reach you about your upcoming appointment at ${data.businessName}.

Please call us immediately: [Phone Number]

We sincerely apologize for any inconvenience.

Thank you for your understanding. 💖`
  }

  /**
   * Automated Response Templates for Incoming Messages
   */
  static autoResponses = {
    cancel: "We understand you need to cancel. Please call us to confirm your cancellation and avoid any fees. Thank you!",
    
    reschedule: "We'd be happy to reschedule! Please call us or visit our website to choose a new time that works better for you.",
    
    confirm: "Perfect! Your appointment is confirmed. We look forward to seeing you! 💖",
    
    stop: "You have been unsubscribed from promotional messages. You will still receive important appointment confirmations.",
    
    help: "For immediate assistance, please call us at [Phone Number]. You can also visit our website to book, reschedule, or cancel appointments.",
    
    hours: `Our hours are:
Mon-Sat: 9:00 AM - 7:00 PM
Sunday: 11:00 AM - 5:00 PM
Call us: [Phone Number] 💖`,
    
    pricing: "For current pricing, please visit our website or call us. We offer competitive rates and package deals! ✨",
    
    location: `We're located at:
[Business Address]
Easy parking available!
📍 [Google Maps Link]`,
    
    services: "We offer a full range of professional services! Visit our website or call to learn about all our services. 🎯",
    
    default: "Thanks for your message! For immediate assistance, please call us. We'll get back to you soon! 💖"
  }

  /**
   * Get template by name
   */
  static getTemplate(templateName: string, data: SMSTemplateData): string {
    switch (templateName.toLowerCase()) {
      case 'confirmation':
        return this.appointmentConfirmation(data)
      case 'reminder24':
        return this.appointmentReminder24h(data)
      case 'reminder2':
        return this.appointmentReminder2h(data)
      case 'cancellation':
        return this.appointmentCancellation(data)
      case 'rescheduled':
        return this.appointmentRescheduled(data)
      case 'receipt':
        return this.paymentReceipt(data)
      case 'welcome':
        return this.welcomeNewCustomer(data)
      case 'loyalty':
        return this.loyaltyPointsEarned(data)
      case 'promotion':
        return this.promotionalOffer(data)
      case 'birthday':
        return this.birthdaySpecial(data)
      case 'available':
        return this.appointmentAvailable(data)
      case 'reminder_service':
        return this.serviceReminder(data)
      case 'no_show':
        return this.noShowFollowUp(data)
      case 'review':
        return this.reviewRequest(data)
      case 'holiday':
        return this.holidayHours(data)
      case 'staff':
        return this.staffAppreciation(data)
      case 'urgent':
        return this.urgentNotice(data)
      default:
        return this.appointmentConfirmation(data) // Default to confirmation
    }
  }
}
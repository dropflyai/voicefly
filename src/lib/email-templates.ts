// Email Templates for Service Business Platform

export interface EmailTemplateData {
  customerName?: string
  businessName?: string
  businessType?: string
  appointmentDate?: string
  appointmentTime?: string
  serviceName?: string
  servicePrice?: string
  location?: string
  confirmationCode?: string
  amount?: string
  paymentMethod?: string
  promoCode?: string
  discount?: string
  expiryDate?: string
  cancelUrl?: string
  rescheduleUrl?: string
  reviewUrl?: string
  websiteUrl?: string
  campaignName?: string
  unsubscribeUrl?: string
}

export class EmailTemplates {
  
  /**
   * Generate common email header HTML
   */
  private static getEmailHeader(title: string, gradient: string = 'linear-gradient(135deg, #ff6b9d, #ff8e9b)'): string {
    return `
      <div class="header" style="background: ${gradient}; color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${title}</h1>
      </div>
    `
  }

  /**
   * Generate common email footer HTML
   */
  private static getEmailFooter(data: EmailTemplateData): string {
    const currentYear = new Date().getFullYear()
    return `
      <div class="footer" style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px;">
        <p style="margin: 0 0 10px 0;">© ${currentYear} ${data.businessName}. All rights reserved.</p>
        ${data.websiteUrl ? `<p style="margin: 0 0 10px 0;"><a href="${data.websiteUrl}" style="color: #007bff;">Visit our website</a></p>` : ''}
        ${data.unsubscribeUrl ? `<p style="margin: 0; font-size: 12px;"><a href="${data.unsubscribeUrl}" style="color: #999;">Unsubscribe</a> | <a href="#" style="color: #999;">Update Preferences</a></p>` : ''}
      </div>
    `
  }

  /**
   * Get base email styles
   */
  private static getEmailStyles(): string {
    return `
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .content {
          padding: 30px 20px;
        }
        .card {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          border-left: 4px solid #007bff;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin: 10px 5px;
        }
        .button:hover {
          background-color: #0056b3;
        }
        .button.secondary {
          background-color: #6c757d;
        }
        .button.secondary:hover {
          background-color: #545b62;
        }
        .button.success {
          background-color: #28a745;
        }
        .button.success:hover {
          background-color: #1e7e34;
        }
        .button.warning {
          background-color: #ffc107;
          color: #212529;
        }
        .button.warning:hover {
          background-color: #e0a800;
        }
        .button.danger {
          background-color: #dc3545;
        }
        .button.danger:hover {
          background-color: #c82333;
        }
        .highlight {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        .text-center {
          text-align: center;
        }
        .emoji {
          font-size: 24px;
        }
        .price {
          font-size: 24px;
          font-weight: bold;
          color: #28a745;
        }
        h2 {
          color: #333;
          margin-top: 0;
        }
        h3 {
          color: #555;
          border-bottom: 2px solid #eee;
          padding-bottom: 10px;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
        }
        .appointment-details {
          background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
          border-left: 4px solid #28a745;
        }
        .promotion-box {
          background: linear-gradient(135deg, #fff3cd, #ffeaa7);
          border: 3px dashed #fd7e14;
          text-align: center;
          padding: 20px;
          border-radius: 10px;
        }
        .review-stars {
          font-size: 30px;
          color: #ffc107;
          text-align: center;
        }
      </style>
    `
  }

  /**
   * Get business-specific content based on business type
   */
  private static getBusinessContent(businessType?: string) {
    const type = (businessType || 'other').toLowerCase()
    
    const contentMap: Record<string, {
      serviceWord: string
      plural: string
      carePhrase: string
      expertTitle: string
      specialties: string[]
      hashtag: string
      emoji: string
      actionPhrase: string
    }> = {
      'nail salon': {
        serviceWord: 'nail care',
        plural: 'nails',
        carePhrase: 'nail care needs',
        expertTitle: 'Expert nail technicians',
        specialties: ['Latest nail art and techniques', 'Premium nail products', 'Relaxing nail spa experience', 'Professional manicure & pedicure'],
        hashtag: 'Nails',
        emoji: '💅',
        actionPhrase: 'beautiful nails'
      },
      'hair salon': {
        serviceWord: 'hair care',
        plural: 'hair',
        carePhrase: 'hair care needs',
        expertTitle: 'Expert hair stylists',
        specialties: ['Latest hair trends and techniques', 'Premium hair products', 'Professional color services', 'Custom cuts and styling'],
        hashtag: 'Hair',
        emoji: '💇',
        actionPhrase: 'beautiful hair'
      },
      'day spa': {
        serviceWord: 'wellness',
        plural: 'treatments',
        carePhrase: 'wellness needs',
        expertTitle: 'Expert spa therapists',
        specialties: ['Relaxing massage therapy', 'Premium spa treatments', 'Rejuvenating facial services', 'Holistic wellness approach'],
        hashtag: 'Spa',
        emoji: '🧘',
        actionPhrase: 'ultimate relaxation'
      },
      'medical spa': {
        serviceWord: 'aesthetic care',
        plural: 'treatments',
        carePhrase: 'aesthetic care needs',
        expertTitle: 'Licensed medical professionals',
        specialties: ['Advanced aesthetic treatments', 'Medical-grade procedures', 'Professional skincare', 'Cutting-edge technology'],
        hashtag: 'MedSpa',
        emoji: '✨',
        actionPhrase: 'aesthetic goals'
      },
      'beauty salon': {
        serviceWord: 'beauty care',
        plural: 'treatments',
        carePhrase: 'beauty care needs',
        expertTitle: 'Expert beauty professionals',
        specialties: ['Full-service beauty treatments', 'Premium beauty products', 'Professional makeup services', 'Complete beauty transformation'],
        hashtag: 'Beauty',
        emoji: '✨',
        actionPhrase: 'beauty goals'
      },
      'massage therapy': {
        serviceWord: 'therapeutic care',
        plural: 'sessions',
        carePhrase: 'therapeutic needs',
        expertTitle: 'Licensed massage therapists',
        specialties: ['Therapeutic massage techniques', 'Pain relief and recovery', 'Stress reduction therapy', 'Customized treatment plans'],
        hashtag: 'Massage',
        emoji: '💆',
        actionPhrase: 'wellness and relief'
      },
      'barbershop': {
        serviceWord: 'grooming',
        plural: 'services',
        carePhrase: 'grooming needs',
        expertTitle: 'Master barbers',
        specialties: ['Classic and modern cuts', 'Professional beard grooming', 'Traditional hot towel shaves', 'Personalized styling'],
        hashtag: 'Barber',
        emoji: '💈',
        actionPhrase: 'perfect look'
      },
      'esthetics': {
        serviceWord: 'skincare',
        plural: 'treatments',
        carePhrase: 'skincare needs',
        expertTitle: 'Licensed estheticians',
        specialties: ['Professional skincare treatments', 'Anti-aging procedures', 'Acne treatment programs', 'Customized facial services'],
        hashtag: 'Skincare',
        emoji: '🌟',
        actionPhrase: 'glowing skin'
      },
      'wellness center': {
        serviceWord: 'wellness',
        plural: 'services',
        carePhrase: 'wellness needs',
        expertTitle: 'Certified wellness coaches',
        specialties: ['Holistic health programs', 'Nutrition and fitness guidance', 'Stress management techniques', 'Mind-body wellness'],
        hashtag: 'Wellness',
        emoji: '🌿',
        actionPhrase: 'optimal wellness'
      },
      'other': {
        serviceWord: 'service',
        plural: 'services',
        carePhrase: 'service needs',
        expertTitle: 'Expert professionals',
        specialties: ['Professional service delivery', 'Personalized attention', 'Quality results', 'Exceptional customer experience'],
        hashtag: 'Service',
        emoji: '⭐',
        actionPhrase: 'service goals'
      }
    }
    
    return contentMap[type] || contentMap['other']
  }

  /**
   * Welcome Email Template
   */
  static welcomeEmail(data: EmailTemplateData): string {
    const businessContent = this.getBusinessContent(data.businessType)
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.businessName}!</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('👋 Welcome to ' + data.businessName + '!')}
    
    <div class="content">
      <h2>Hello ${data.customerName || 'there'}!</h2>
      <p>Welcome to the ${data.businessName} family! We're absolutely thrilled you've chosen us for your ${businessContent.carePhrase}.</p>
      
      <div class="highlight text-center">
        <div class="emoji">🎁</div>
        <h3>New Customer Special!</h3>
        <p><strong>15% OFF</strong> your first service</p>
        <p><small>Use code: <strong>WELCOME15</strong></small></p>
      </div>

      <h3>What makes us special:</h3>
      <ul>
        <li>${businessContent.emoji} ${businessContent.expertTitle} with years of experience</li>
        ${businessContent.specialties.map(specialty => `<li>✨ ${specialty}</li>`).join('\n        ')}
        <li>📱 Easy 24/7 online booking system</li>
        <li>🎯 Exclusive loyalty rewards program</li>
      </ul>

      <div class="text-center" style="margin: 30px 0;">
        <a href="${data.websiteUrl || '#'}" class="button success">Book Your First Appointment</a>
      </div>

      <p>Have questions about our services or want to learn more? We're here to help! Simply reply to this email or give us a call.</p>
      
      <p>We can't wait to pamper you and help you achieve the ${businessContent.actionPhrase} you deserve!</p>
      
      <p style="margin-top: 30px;">
        With love and excitement,<br>
        <strong>The ${data.businessName} Team</strong> 💖
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Appointment Confirmation Email Template
   */
  static appointmentConfirmation(data: EmailTemplateData): string {
    const businessContent = this.getBusinessContent(data.businessType)
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed - ${data.businessName}</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('✨ Appointment Confirmed!', 'linear-gradient(135deg, #28a745, #20c997)')}
    
    <div class="content">
      <h2>Hello ${data.customerName || 'Beautiful'}!</h2>
      <p>Great news! Your appointment has been confirmed. We're excited to pamper you!</p>
      
      <div class="card appointment-details">
        <h3>📅 Your Appointment Details</h3>
        <p><strong>Date:</strong> ${data.appointmentDate}</p>
        <p><strong>Time:</strong> ${data.appointmentTime}</p>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        ${data.servicePrice ? `<p><strong>Price:</strong> <span class="price">$${data.servicePrice}</span></p>` : ''}
        <p><strong>Location:</strong> ${data.location || 'Main Location'}</p>
        <p><strong>Confirmation Code:</strong> <strong>#${data.confirmationCode}</strong></p>
      </div>

      <div class="highlight">
        <h3>📝 Before Your Appointment:</h3>
        <ul>
          <li>Please arrive 10 minutes early</li>
          <li>Bring your confirmation code: <strong>#${data.confirmationCode}</strong></li>
          <li>Have any inspiration photos or preferences ready</li>
          <li>Let us know about any allergies or preferences</li>
        </ul>
      </div>

      <div class="text-center" style="margin: 30px 0;">
        ${data.rescheduleUrl ? `<a href="${data.rescheduleUrl}" class="button warning">Reschedule</a>` : ''}
        ${data.cancelUrl ? `<a href="${data.cancelUrl}" class="button danger">Cancel</a>` : ''}
      </div>

      <p>Need to make changes or have questions? Just reply to this email or give us a call. We're here to help!</p>
      
      <p style="margin-top: 30px;">
        Can't wait to see you soon!<br>
        <strong>The ${data.businessName} Team</strong> ${businessContent.emoji}
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Appointment Reminder Email Template
   */
  static appointmentReminder(data: EmailTemplateData, hoursAhead: number = 24): string {
    const businessContent = this.getBusinessContent(data.businessType)
    const reminderTime = hoursAhead === 24 ? 'tomorrow' : `in ${hoursAhead} hours`
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder - ${data.businessName}</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('⏰ Appointment Reminder', 'linear-gradient(135deg, #17a2b8, #20c997)')}
    
    <div class="content">
      <h2>Hi ${data.customerName || 'there'}!</h2>
      <p>This is a friendly reminder that your appointment is <strong>${reminderTime}</strong>!</p>
      
      <div class="card appointment-details">
        <h3>Your Upcoming Appointment</h3>
        <p><strong>📅 When:</strong> ${data.appointmentDate} at ${data.appointmentTime}</p>
        <p><strong>💅 Service:</strong> ${data.serviceName}</p>
        <p><strong>📍 Where:</strong> ${data.location || 'Main Location'}</p>
        <p><strong>🏪 Business:</strong> ${data.businessName}</p>
        <p><strong>🎫 Confirmation:</strong> #${data.confirmationCode}</p>
      </div>

      <div class="highlight">
        <h3>📋 Quick Checklist:</h3>
        <ul>
          <li>✅ Arrive 10 minutes early</li>
          <li>✅ Bring your confirmation code</li>
          <li>✅ Have inspiration photos ready</li>
          <li>✅ Remove any existing products if needed</li>
          <li>✅ Inform us of any allergies</li>
        </ul>
      </div>

      <div class="text-center" style="margin: 30px 0;">
        ${data.rescheduleUrl ? `<a href="${data.rescheduleUrl}" class="button warning">Need to Reschedule?</a>` : ''}
        ${data.cancelUrl ? `<a href="${data.cancelUrl}" class="button secondary">Cancel</a>` : ''}
      </div>

      <p>Running late? No problem! Just give us a quick call and we'll do our best to accommodate you.</p>
      
      <p style="margin-top: 30px;">
        Looking forward to seeing you soon!<br>
        <strong>The ${data.businessName} Team</strong> ✨
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Payment Receipt Email Template
   */
  static paymentReceipt(data: EmailTemplateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${data.businessName}</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('🧾 Payment Receipt', 'linear-gradient(135deg, #6f42c1, #8e44ad)')}
    
    <div class="content">
      <h2>Hi ${data.customerName || 'there'}!</h2>
      <p>Thank you for your payment! Your transaction has been processed successfully.</p>
      
      <div class="card">
        <h3>💳 Payment Details</h3>
        <p><strong>Amount Paid:</strong> <span class="price">$${data.amount}</span></p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        <p><strong>Service:</strong> ${data.serviceName}</p>
        <p><strong>Appointment:</strong> ${data.appointmentDate} at ${data.appointmentTime}</p>
        <p><strong>Location:</strong> ${data.location || 'Main Location'}</p>
        <p><strong>Receipt Date:</strong> ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div class="highlight text-center">
        <h3>✅ Your appointment is now confirmed!</h3>
        <p>We're all set and ready to pamper you at your scheduled time.</p>
      </div>

      <p><strong>Need this receipt for your records?</strong> Simply save this email or print it out.</p>

      <p>Questions about your payment or appointment? Just reply to this email and we'll help you right away.</p>
      
      <div class="text-center" style="margin: 30px 0;">
        <a href="${data.websiteUrl || '#'}" class="button">Book Another Appointment</a>
      </div>
      
      <p style="margin-top: 30px;">
        Thank you for choosing ${data.businessName}!<br>
        <strong>The ${data.businessName} Team</strong> 💖
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Promotional Email Template
   */
  static promotionalEmail(data: EmailTemplateData): string {
    const businessContent = this.getBusinessContent(data.businessType)
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Offer - ${data.businessName}</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('🎁 Special Offer Just For You!', 'linear-gradient(135deg, #fd7e14, #ff6b35)')}
    
    <div class="content">
      <h2>Hi ${data.customerName || 'Beautiful'}!</h2>
      <p>We have something amazing just for you! Don't miss out on this exclusive offer.</p>
      
      <div class="promotion-box">
        <div style="font-size: 48px; font-weight: bold; color: #fd7e14; margin-bottom: 10px;">
          ${data.discount || '20% OFF'}
        </div>
        <h3 style="margin: 10px 0; color: #333;">Your Next Service</h3>
        ${data.promoCode ? `<p><strong>Use Promo Code:</strong> <span style="background: #333; color: white; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${data.promoCode}</span></p>` : ''}
        ${data.expiryDate ? `<p style="color: #dc3545;"><strong>Valid Until:</strong> ${data.expiryDate}</p>` : ''}
        
        <div style="margin-top: 20px;">
          <a href="${data.websiteUrl || '#'}" class="button" style="background-color: #fd7e14; font-size: 18px; padding: 15px 30px;">Book Now & Save!</a>
        </div>
      </div>

      <h3>Why choose ${data.businessName}?</h3>
      <ul>
        <li>${businessContent.emoji} <strong>Expert Professionals:</strong> Skilled professionals with years of experience</li>
        <li>✨ <strong>Latest Trends:</strong> Stay ahead with the newest techniques and services</li>
        <li>🏆 <strong>Premium Products:</strong> We use only the best, safest products</li>
        <li>😊 <strong>Relaxing Environment:</strong> Clean, comfortable, and welcoming space</li>
        <li>⏰ <strong>Flexible Scheduling:</strong> Easy online booking available 24/7</li>
      </ul>

      <div class="highlight text-center">
        <h3>⚡ Limited Time Offer!</h3>
        <p>This exclusive discount won't last long. Book your appointment today and treat yourself to the pampering you deserve!</p>
      </div>

      <div class="text-center" style="margin: 30px 0;">
        <a href="${data.websiteUrl || '#'}" class="button success" style="font-size: 16px;">Book Your Appointment Now</a>
      </div>
      
      <p style="margin-top: 30px;">
        Can't wait to pamper you soon!<br>
        <strong>The ${data.businessName} Team</strong> 💅✨
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Review Request Email Template
   */
  static reviewRequest(data: EmailTemplateData): string {
    const businessContent = this.getBusinessContent(data.businessType)
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was your experience? - ${data.businessName}</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('⭐ How was your experience?', 'linear-gradient(135deg, #17a2b8, #20c997)')}
    
    <div class="content">
      <h2>Hi ${data.customerName || 'there'}!</h2>
      <p>Thank you for visiting ${data.businessName}! We hope you absolutely love your ${businessContent.actionPhrase}.</p>
      
      <div class="card text-center">
        <div class="review-stars">⭐⭐⭐⭐⭐</div>
        <h3>We'd love your feedback!</h3>
        <p>Your review helps us improve our services and lets other clients know what to expect from us.</p>
        
        ${data.reviewUrl ? `
        <div style="margin: 20px 0;">
          <a href="${data.reviewUrl}" class="button success" style="font-size: 16px; padding: 15px 25px;">Leave a Review</a>
        </div>
        ` : ''}
      </div>

      <h3>📸 Show off your amazing results!</h3>
      <ul>
        <li><strong>Take a photo</strong> of your ${businessContent.plural}</li>
        <li><strong>Tag us</strong> on Instagram, Facebook, or TikTok</li>
        <li><strong>Share with friends</strong> and spread the love!</li>
        <li><strong>Use hashtag</strong> #${data.businessName?.replace(/\s+/g, '')}${businessContent.hashtag}</li>
      </ul>

      <div class="highlight text-center">
        <h3>🎁 Review Bonus!</h3>
        <p>Leave us a review and get <strong>10% OFF</strong> your next appointment!</p>
        <p><small>Show us your published review during your next visit</small></p>
      </div>

      <div class="text-center" style="margin: 30px 0;">
        <a href="${data.websiteUrl || '#'}" class="button">Book Your Next Appointment</a>
      </div>

      <p>Have suggestions or special requests for your next visit? Just reply to this email - we love hearing from our clients!</p>
      
      <p style="margin-top: 30px;">
        Thank you for being such an amazing client!<br>
        <strong>The ${data.businessName} Team</strong> 💅💖
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Birthday Special Email Template
   */
  static birthdaySpecial(data: EmailTemplateData): string {
    const businessContent = this.getBusinessContent(data.businessType)
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Happy Birthday! - ${data.businessName}</title>
  ${this.getEmailStyles()}
</head>
<body>
  <div class="container">
    ${this.getEmailHeader('🎂 Happy Birthday ' + (data.customerName || 'Beautiful') + '!', 'linear-gradient(135deg, #e91e63, #ad1457)')}
    
    <div class="content">
      <div class="text-center" style="margin: 20px 0;">
        <div style="font-size: 48px;">🎉🎂🎈</div>
      </div>

      <h2 style="text-align: center;">It's Your Special Day!</h2>
      <p style="text-align: center; font-size: 18px;">The entire ${data.businessName} team wants to wish you the happiest of birthdays!</p>
      
      <div class="promotion-box">
        <div style="font-size: 36px; font-weight: bold; color: #e91e63; margin-bottom: 10px;">
          ${data.discount || '25% OFF'}
        </div>
        <h3 style="margin: 10px 0; color: #333;">Birthday Special!</h3>
        <p>Valid for any service of your choice</p>
        <p style="color: #dc3545;"><strong>Valid for 30 days from your birthday</strong></p>
        
        <div style="margin-top: 20px;">
          <a href="${data.websiteUrl || '#'}" class="button" style="background-color: #e91e63; font-size: 18px; padding: 15px 30px;">Claim Your Birthday Treat</a>
        </div>
      </div>

      <h3 style="text-align: center;">🎁 Make Your Day Extra Special</h3>
      <p style="text-align: center;">Treat yourself to:</p>
      <ul>
        ${businessContent.specialties.map(specialty => `<li>${businessContent.emoji} <strong>${specialty.split(' ').slice(0,2).join(' ')}:</strong> ${specialty}</li>`).join('\n        ')}
      </ul>

      <div class="text-center" style="margin: 30px 0;">
        <p style="font-size: 18px; color: #e91e63; font-weight: bold;">🌟 "Because every birthday deserves ${businessContent.actionPhrase}!" 🌟</p>
      </div>
      
      <p style="margin-top: 30px; text-align: center; font-size: 18px;">
        Wishing you a year filled with beauty, happiness, and amazing ${businessContent.plural}!<br>
        <strong>The ${data.businessName} Team</strong> 🎂💖
      </p>
    </div>
    
    ${this.getEmailFooter(data)}
  </div>
</body>
</html>`
  }

  /**
   * Get template by name
   */
  static getTemplate(templateName: string, data: EmailTemplateData, options?: any): string {
    switch (templateName.toLowerCase()) {
      case 'welcome':
        return this.welcomeEmail(data)
      case 'confirmation':
        return this.appointmentConfirmation(data)
      case 'reminder':
        return this.appointmentReminder(data, options?.hoursAhead || 24)
      case 'receipt':
        return this.paymentReceipt(data)
      case 'promotional':
      case 'promotion':
        return this.promotionalEmail(data)
      case 'review':
        return this.reviewRequest(data)
      case 'birthday':
        return this.birthdaySpecial(data)
      default:
        return this.appointmentConfirmation(data) // Default fallback
    }
  }

  /**
   * Get available templates list
   */
  static getAvailableTemplates(): Array<{name: string, description: string, requiredData: string[]}> {
    return [
      {
        name: 'welcome',
        description: 'Welcome email for new customers',
        requiredData: ['customerName', 'businessName']
      },
      {
        name: 'confirmation',
        description: 'Appointment confirmation email',
        requiredData: ['customerName', 'businessName', 'appointmentDate', 'appointmentTime', 'serviceName']
      },
      {
        name: 'reminder',
        description: 'Appointment reminder email',
        requiredData: ['customerName', 'businessName', 'appointmentDate', 'appointmentTime', 'serviceName']
      },
      {
        name: 'receipt',
        description: 'Payment receipt email',
        requiredData: ['customerName', 'businessName', 'amount', 'paymentMethod', 'serviceName']
      },
      {
        name: 'promotional',
        description: 'Promotional/marketing email',
        requiredData: ['customerName', 'businessName', 'discount']
      },
      {
        name: 'review',
        description: 'Review request email',
        requiredData: ['customerName', 'businessName']
      },
      {
        name: 'birthday',
        description: 'Birthday special offer email',
        requiredData: ['customerName', 'businessName']
      }
    ]
  }
}
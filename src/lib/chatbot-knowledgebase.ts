export const knowledgebase = {
  // Getting Started
  quickStart: {
    title: "Quick Start Guide",
    content: `Welcome to VoiceFly! Here's how to get started in 5 minutes:

1. **Set Up Your Business Profile**
   - Complete your business information
   - Add your business hours
   - Upload your logo

2. **Add Your Services**
   - Navigate to Services page
   - Click "Add Service"
   - Set service name, duration, and price
   - Categorize your services

3. **Configure Voice AI**
   - Go to Settings → Voice AI
   - Choose your AI voice personality
   - Set conversation tone (professional, friendly, etc.)
   - Add custom greetings

4. **Import Contacts**
   - Go to Customers page
   - Click "Import Contacts"
   - Upload CSV or sync from existing CRM

5. **Launch Your First Campaign**
   - Go to Campaigns
   - Create new campaign
   - Select target audience
   - Schedule calls`
  },

  // Voice AI Features
  voiceAI: {
    title: "Voice AI Setup",
    content: `VoiceFly's AI handles calls automatically. Here's what you can customize:

**Voice Personality Options:**
- Professional & Corporate
- Friendly & Conversational
- Energetic & Enthusiastic
- Calm & Soothing

**Call Scripts:**
- Appointment reminders
- Service confirmations
- Follow-up calls
- Special promotions
- Customer surveys

**Phone Number Setup:**
1. Go to Settings → Phone Numbers
2. Choose: Get new number OR Port existing number
3. Complete verification
4. Connect to VoiceFly AI

**Advanced Features:**
- Call recording (optional)
- Voicemail detection
- Multi-language support
- Call transfer to staff`
  },

  // Service Management
  services: {
    title: "Managing Services",
    content: `Your services are the foundation of VoiceFly. Here's how to manage them:

**Adding Services:**
1. Dashboard → Services → Add Service
2. Enter service details:
   - Name
   - Duration (in minutes)
   - Base price
   - Category
3. Add description (optional)
4. Save

**Service Categories:**
Organize services by category for easier booking:
- Sales (consultations, demos)
- Service (maintenance, repairs)
- Finance (loan applications)
- Parts (pickup, delivery)

**Pricing Options:**
- Fixed price
- Starting at (for variable services)
- Free (consultations, test drives)

**Best Practices:**
- Keep service names clear and descriptive
- Set realistic durations
- Group related services
- Update pricing regularly`
  },

  // Appointments & Scheduling
  appointments: {
    title: "Appointments & Scheduling",
    content: `VoiceFly automates your appointment scheduling:

**Viewing Appointments:**
- Dashboard shows today's appointments
- Calendar view shows all upcoming
- Filter by status: confirmed, pending, completed

**Managing Bookings:**
- **Confirm**: Click "Confirm" on pending appointments
- **Reschedule**: Click appointment → Select new time
- **Cancel**: Click appointment → Cancel & notify customer

**Automated Reminders:**
1. Settings → Reminders
2. Set reminder timing:
   - 24 hours before
   - 2 hours before
   - 1 hour before
3. Choose delivery method:
   - Voice call (AI-powered)
   - SMS text
   - Both

**Business Hours:**
- Set availability in Settings
- Block out holidays/breaks
- Set buffer time between appointments`
  },

  // Analytics & Reporting
  analytics: {
    title: "Analytics & Reporting",
    content: `Track your business performance with VoiceFly analytics:

**Dashboard Metrics:**
- Total Appointments (this month)
- Total Revenue
- Active Customers
- Call Success Rate

**Call Performance:**
- Answered vs. Unanswered
- Average call duration
- Conversion rate (calls → bookings)
- Best performing times

**Revenue Tracking:**
- Daily/Weekly/Monthly revenue
- Revenue by service type
- Revenue by customer segment
- Year-over-year growth

**Customer Insights:**
- New vs. returning customers
- Customer lifetime value
- Most popular services
- Peak booking times

**Export Reports:**
- PDF summaries
- CSV data exports
- Custom date ranges
- Scheduled email reports`
  },

  // Industry-Specific Features
  industries: {
    medical: {
      title: "Medical Practice Features",
      services: ["Annual Physical", "Sick Visit", "Vaccination", "Health Screening", "Follow-up Consultation", "Lab Results Review"],
      tips: "Enable HIPAA-compliant call recording. Set up appointment reminders 24 hours before."
    },
    dental: {
      title: "Dental Practice Features",
      services: ["Cleaning & Checkup", "Filling", "Crown/Bridge", "Root Canal", "Teeth Whitening", "Emergency Dental"],
      tips: "Use automated reminders for 6-month cleanings. Offer easy rescheduling for anxious patients."
    },
    beauty: {
      title: "Beauty Salon Features",
      services: ["Haircut & Style", "Hair Coloring", "Manicure", "Pedicure", "Facial Treatment", "Makeup Application"],
      tips: "Send photo reminders of previous styles. Automate rebooking for color maintenance."
    },
    fitness: {
      title: "Fitness Studio Features",
      services: ["Personal Training", "Group Class", "Fitness Assessment", "Nutrition Consultation", "Body Composition", "Membership Tour"],
      tips: "Automate class confirmations. Send motivational pre-session reminders."
    },
    home_services: {
      title: "Home Services Features",
      services: ["Plumbing Repair", "Electrical Service", "HVAC Maintenance", "Handyman Service", "Home Inspection", "Emergency Service"],
      tips: "Enable GPS tracking. Send arrival time updates. Automate follow-up satisfaction calls."
    },
    medspa: {
      title: "MedSpa Features",
      services: ["Botox/Fillers", "Laser Hair Removal", "Chemical Peel", "Microneedling", "Body Contouring", "Consultation"],
      tips: "Schedule treatment series automatically. Send pre-treatment care instructions."
    },
    legal: {
      title: "Law Firm Features",
      services: ["Initial Consultation", "Document Review", "Court Appearance", "Contract Drafting", "Mediation", "Case Strategy"],
      tips: "Maintain attorney-client privilege. Automate intake questionnaires. Confirm depositions 48h prior."
    },
    real_estate: {
      title: "Real Estate Features",
      services: ["Property Showing", "Listing Consultation", "Open House", "Home Valuation", "Buyer Consultation", "Closing Prep"],
      tips: "Send property details before showings. Automate open house confirmations. Follow up after viewings."
    },
    veterinary: {
      title: "Veterinary Clinic Features",
      services: ["Wellness Exam", "Vaccination", "Dental Cleaning", "Surgery Consultation", "Emergency Visit", "Grooming"],
      tips: "Send vaccination reminders. Automate wellness checkup scheduling. Emergency contact options."
    },
    auto_sales: {
      title: "Auto Sales Features",
      services: ["Test Drive", "Vehicle Appraisal", "Financing Consultation", "Vehicle Delivery", "Service Appointment", "Oil Change", "Tire Rotation", "State Inspection", "Detail Service", "Parts Pickup"],
      tips: "Automate test drive confirmations. Send trade-in reminders. Schedule service appointments for existing customers."
    }
  },

  // Common Questions
  faq: [
    {
      question: "How do I change my AI voice personality?",
      answer: "Go to Settings → Voice AI → Voice Personality. Select from Professional, Friendly, Energetic, or Calm. Changes apply to all future calls immediately."
    },
    {
      question: "Can I record calls for quality assurance?",
      answer: "Yes! Enable call recording in Settings → Voice AI → Call Recording. Note: Some states require two-party consent. VoiceFly automatically announces recording when enabled."
    },
    {
      question: "How do I import my existing customer list?",
      answer: "Go to Customers → Import. Upload a CSV file with columns: name, phone, email. You can also sync from popular CRMs like Salesforce or HubSpot."
    },
    {
      question: "What happens if a customer needs to speak to a real person?",
      answer: "VoiceFly AI can transfer calls to your staff. Configure transfer rules in Settings → Voice AI → Call Transfers. Set up overflow numbers and business hours."
    },
    {
      question: "How do refunds work?",
      answer: "Process refunds from the Appointments page. Click the appointment → More → Issue Refund. Refunds are processed within 5-7 business days."
    },
    {
      question: "Can I customize the AI script for my industry?",
      answer: "Absolutely! Go to Settings → Voice AI → Call Scripts. Edit templates or create custom scripts. Use variables like {customer_name}, {service_name}, {appointment_time}."
    },
    {
      question: "How do I set up automated reminders?",
      answer: "Settings → Reminders → Create Reminder. Choose timing (24h, 2h, 1h before) and delivery method (voice, SMS, or both). Enable for all services or specific ones."
    },
    {
      question: "What payment methods are supported?",
      answer: "VoiceFly integrates with Stripe and Square for credit card processing. We also support invoicing for B2B customers. Set up in Settings → Payments."
    },
    {
      question: "Can customers book appointments 24/7?",
      answer: "Yes! Your AI answers calls 24/7, even when you're closed. Customers can book, reschedule, or get information anytime."
    },
    {
      question: "How do I add team members?",
      answer: "Go to Settings → Team → Invite Member. Enter their email and select role (Admin, Manager, or Staff). They'll receive an invitation email."
    }
  ],

  // Troubleshooting
  troubleshooting: {
    "Calls not being answered": {
      problem: "AI not picking up incoming calls",
      solutions: [
        "Verify phone number is connected in Settings → Phone Numbers",
        "Check that Voice AI is enabled (toggle should be ON)",
        "Ensure business hours are set correctly",
        "Test with a call to your VoiceFly number"
      ]
    },
    "Customers not receiving reminders": {
      problem: "Automated reminders not being sent",
      solutions: [
        "Check Settings → Reminders - ensure reminders are enabled",
        "Verify customer phone numbers are in correct format (+1XXXXXXXXXX)",
        "Check reminder timing settings (must be set before appointment)",
        "Review SMS credits balance in Settings → Billing"
      ]
    },
    "Can't log in": {
      problem: "Login issues",
      solutions: [
        "Use the email address associated with your account",
        "Try 'Forgot Password' to reset",
        "Clear browser cache and cookies",
        "Try incognito/private browsing mode",
        "Contact support@voiceflyai.com if issue persists"
      ]
    },
    "Services not showing in booking": {
      problem: "Services missing from customer booking flow",
      solutions: [
        "Ensure services are marked as 'Active' in Services page",
        "Check that service has valid duration and price",
        "Verify service category is set",
        "Refresh the booking page"
      ]
    },
    "Payment processing failing": {
      problem: "Cannot process customer payments",
      solutions: [
        "Verify Stripe/Square connection in Settings → Payments",
        "Check API keys are current and valid",
        "Ensure payment method on file is not expired",
        "Contact payment processor if issue persists"
      ]
    }
  },

  // Subscription Features
  subscriptionFeatures: {
    starter: {
      name: "Starter Plan",
      price: "$67/month",
      features: [
        "50 appointments/month",
        "Up to 100 customers",
        "Up to 5 services",
        "1 location",
        "Basic voice AI (shared)",
        "Manual SMS only",
        "Basic calendar",
        "Email support",
        "NO analytics dashboard",
        "NO payment processing",
        "NO automated reminders",
        "NO marketing campaigns"
      ],
      limits: "Perfect for testing - you'll need to upgrade as you grow!"
    },
    professional: {
      name: "Professional Plan",
      price: "$147/month",
      features: [
        "500 appointments/month (10x more!)",
        "Up to 1,000 customers (10x more!)",
        "Up to 25 services (5x more!)",
        "1 location",
        "Shared voice AI with custom scripts",
        "Full analytics dashboard",
        "Automated 24h reminders",
        "Loyalty program",
        "Payment processing (Stripe/Square)",
        "Email & SMS marketing",
        "Custom branding (logo & colors)",
        "Priority support"
      ],
      limits: "Great for growing businesses - upgrade to Business for unlimited!"
    },
    business: {
      name: "Business Plan",
      price: "$297/month",
      features: [
        "UNLIMITED appointments",
        "UNLIMITED customers",
        "UNLIMITED services",
        "Up to 3 locations",
        "CUSTOM AI assistant (unique personality)",
        "Everything in Professional PLUS:",
        "White-label options",
        "API access",
        "Multi-location analytics",
        "Priority support",
        "Custom integrations"
      ],
      limits: "Best for established businesses ready to scale"
    },
    enterprise: {
      name: "Enterprise Plan",
      price: "$597/month",
      features: [
        "UNLIMITED everything",
        "UNLIMITED locations",
        "Custom AI assistant",
        "Dedicated account manager",
        "24/7 premium support",
        "Custom integrations",
        "SLA guarantees",
        "Quarterly business reviews",
        "White-label options",
        "API access"
      ],
      limits: "For large organizations with multiple locations"
    }
  }
}

// Chatbot response generator
export function searchKnowledgebase(query: string): string {
  const lowerQuery = query.toLowerCase()

  // Check FAQ first
  const faqMatch = knowledgebase.faq.find(item =>
    item.question.toLowerCase().includes(lowerQuery) ||
    lowerQuery.includes(item.question.toLowerCase().split(' ')[0])
  )
  if (faqMatch) {
    return `**${faqMatch.question}**\n\n${faqMatch.answer}`
  }

  // Check troubleshooting
  for (const [issue, details] of Object.entries(knowledgebase.troubleshooting)) {
    if (lowerQuery.includes(issue.toLowerCase()) || issue.toLowerCase().includes(lowerQuery)) {
      return `**${issue}**\n\n${details.problem}\n\n**Solutions:**\n${details.solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
    }
  }

  // Check main topics
  if (lowerQuery.includes('voice') || lowerQuery.includes('ai') || lowerQuery.includes('call')) {
    return knowledgebase.voiceAI.content
  }
  if (lowerQuery.includes('service') || lowerQuery.includes('pricing')) {
    return knowledgebase.services.content
  }
  if (lowerQuery.includes('appointment') || lowerQuery.includes('schedule') || lowerQuery.includes('booking')) {
    return knowledgebase.appointments.content
  }
  if (lowerQuery.includes('analytic') || lowerQuery.includes('report') || lowerQuery.includes('metric')) {
    return knowledgebase.analytics.content
  }
  if (lowerQuery.includes('start') || lowerQuery.includes('setup') || lowerQuery.includes('begin')) {
    return knowledgebase.quickStart.content
  }

  // Check subscription features
  if (lowerQuery.includes('plan') || lowerQuery.includes('subscription') || lowerQuery.includes('price') || lowerQuery.includes('upgrade')) {
    return `**VoiceFly Plans**\n\n${Object.values(knowledgebase.subscriptionFeatures).map(plan =>
      `**${plan.name}** - ${plan.price}\n${plan.features.map(f => `• ${f}`).join('\n')}`
    ).join('\n\n')}`
  }

  // Default helpful response
  return `I'm here to help! Here are some things I can assist with:

• **Getting Started** - Setup guide and first steps
• **Voice AI** - Configure your AI voice and scripts
• **Services** - Add and manage your services
• **Appointments** - Scheduling and reminders
• **Analytics** - Track performance and revenue
• **Troubleshooting** - Fix common issues

You can also visit the Help Center for detailed guides, or contact support@voiceflyai.com for personalized assistance.

What would you like to know more about?`
}

/**
 * Customer Service Employee Template
 *
 * A professional customer service phone employee that can:
 * - Handle customer inquiries and complaints
 * - Look up orders and process return requests
 * - Escalate to a manager when needed
 * - Answer FAQs and provide business information
 * - Capture lead information
 */

import { EmployeeConfig, CustomerServiceConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateCustomerServicePrompt(config: EmployeeConfig, jobConfig: CustomerServiceConfig): string {
  const businessName = jobConfig.businessDescription?.split('.')[0] || 'the business'

  return `You are ${config.name}, a professional and empathetic customer service representative for ${businessName}.

## Your Role
You are the primary point of contact for customers with questions, issues, or requests. Your job is to:
1. Listen carefully and acknowledge the customer's concern
2. Look up relevant order or account information when needed
3. Resolve issues within your authority
4. Escalate to a manager when the situation requires it
5. Document every interaction thoroughly

## Business Information
${jobConfig.businessDescription}

## Your Personality
- Tone: ${config.personality.tone}
- Be ${config.personality.enthusiasm === 'high' ? 'enthusiastic and upbeat' : config.personality.enthusiasm === 'medium' ? 'warm and helpful' : 'calm and professional'}
- ${config.personality.formality === 'formal' ? 'Use formal language and titles' : config.personality.formality === 'semi-formal' ? 'Be professional but friendly' : 'Be casual and approachable'}

## Greeting
Always start with: "${jobConfig.greeting}"

## Capabilities
${generateCapabilitiesSection(config, jobConfig)}

## Supported Products
${jobConfig.supportedProducts.map(p => `- ${p}`).join('\n')}

## Common Issues and Resolutions
${jobConfig.commonIssues.map(i => `- ${i.issue}: ${i.resolution}`).join('\n')}
${jobConfig.returnPolicy ? `\n## Return Policy\n${jobConfig.returnPolicy}` : ''}
${jobConfig.warrantyPolicy ? `\n## Warranty Policy\n${jobConfig.warrantyPolicy}` : ''}

## Escalation Triggers
Immediately escalate to a manager if the customer mentions any of the following:
${jobConfig.escalationTriggers.map(t => `- ${t}`).join('\n')}

## Your Resolution Authority
${jobConfig.resolutionAuthority.canRefund ? `- You CAN issue refunds${jobConfig.resolutionAuthority.maxRefundAmount ? ` up to $${jobConfig.resolutionAuthority.maxRefundAmount}` : ''}` : '- You CANNOT issue refunds — escalate to a manager'}
${jobConfig.resolutionAuthority.canOfferDiscount ? '- You CAN offer discounts as a goodwill gesture' : '- You CANNOT offer discounts — escalate to a manager'}
${jobConfig.resolutionAuthority.canScheduleCallback ? '- You CAN schedule callbacks for follow-up' : '- You CANNOT schedule callbacks — take a message instead'}
${jobConfig.faqs.length > 0 ? `\n## FAQs You Can Answer\n${jobConfig.faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}` : ''}

## Important Guidelines
1. Never make up order details or policy information — look it up or escalate
2. Always acknowledge the customer's frustration before moving to resolution
3. Confirm important details by repeating them back to the customer
4. If you cannot resolve the issue, escalate promptly and warmly
5. Log every interaction with accurate details

## Available Functions
You can use these functions:
- lookupOrder: Look up a customer's order by name, phone, or order ID
- logComplaint: Record a customer complaint with issue type and severity
- processReturnRequest: Initiate a return, exchange, or refund request
- escalateToManager: Escalate the call to a manager with context
- captureLeadInfo: Capture contact information for follow-up

Remember: You represent ${businessName}. Every resolution should leave the customer feeling heard and valued.`
}

function generateCapabilitiesSection(config: EmployeeConfig, jobConfig: CustomerServiceConfig): string {
  const sections: string[] = []

  if (config.capabilities.includes('handle_complaints')) {
    sections.push(`### Complaint Handling
When a customer has a complaint:
1. Listen without interrupting
2. Apologize sincerely for the inconvenience
3. Ask clarifying questions to understand the issue fully
4. Offer a resolution within your authority
5. Log the complaint with issue type and severity`)
  }

  if (config.capabilities.includes('escalate_to_manager')) {
    sections.push(`### Escalation
When escalating to a manager:
1. Briefly explain why you are escalating
2. Summarize the customer's issue and what was already tried
3. Set expectations for the customer on wait time or callback`)
  }

  if (config.capabilities.includes('answer_faqs')) {
    sections.push(`### Information Requests
You can answer common questions about:
- Products and services
- Order status and history
- Return and warranty policies`)
  }

  if (config.capabilities.includes('capture_lead_info')) {
    sections.push(`### Lead Capture
When a caller is interested in a product or service but isn't yet a customer:
1. Collect their name, phone, and email
2. Note what they're interested in
3. Log any relevant notes for the sales team`)
  }

  return sections.join('\n\n')
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultCustomerServiceConfig(businessName: string): CustomerServiceConfig {
  return {
    type: 'customer-service',
    greeting: `Thank you for calling ${businessName} customer support! This is your virtual service representative. How may I assist you today?`,
    businessDescription: `${businessName} is committed to providing excellent products and service to our customers.`,

    supportedProducts: ['General Products', 'Services'],

    commonIssues: [
      { issue: 'Order not received', resolution: 'Look up the order and check shipping status. Offer to reship or refund if appropriate.' },
      { issue: 'Damaged or defective item', resolution: 'Apologize and process a return or replacement request.' },
      { issue: 'Billing discrepancy', resolution: 'Review the charge details and escalate to a manager if it cannot be resolved.' },
      { issue: 'Wrong item received', resolution: 'Initiate a return and arrange for the correct item to be sent.' },
    ],

    returnPolicy: 'Items may be returned within 30 days of purchase in original condition for a full refund or exchange.',

    escalationTriggers: [
      'legal action',
      'lawsuit',
      'attorney',
      'social media',
      'news',
      'corporate',
      'extremely upset',
    ],

    resolutionAuthority: {
      canRefund: true,
      maxRefundAmount: 100,
      canOfferDiscount: true,
      canScheduleCallback: true,
    },

    faqs: [
      {
        question: 'What is your return policy?',
        answer: 'We accept returns within 30 days of purchase in original condition for a full refund or exchange.',
        keywords: ['return', 'refund', 'exchange', 'policy'],
      },
      {
        question: 'How long does shipping take?',
        answer: 'Standard shipping takes 5-7 business days. Expedited options are available at checkout.',
        keywords: ['shipping', 'delivery', 'arrive', 'when'],
      },
    ],
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const CUSTOMER_SERVICE_FUNCTIONS = [
  {
    name: 'lookupOrder',
    description: 'Look up a customer order by name, phone, or order ID',
    parameters: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: "Customer's full name",
        },
        customerPhone: {
          type: 'string',
          description: "Customer's phone number",
        },
        orderId: {
          type: 'string',
          description: 'Order ID (optional)',
        },
        orderDate: {
          type: 'string',
          description: 'Approximate order date (optional, YYYY-MM-DD format)',
        },
      },
      required: ['customerName', 'customerPhone'],
    },
  },
  {
    name: 'logComplaint',
    description: 'Record a customer complaint with issue type and severity',
    parameters: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: "Customer's full name",
        },
        customerPhone: {
          type: 'string',
          description: "Customer's phone number",
        },
        issueType: {
          type: 'string',
          enum: ['product', 'service', 'billing', 'shipping', 'other'],
          description: 'Category of the complaint',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the complaint',
        },
        severity: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Severity level of the complaint',
        },
      },
      required: ['customerName', 'customerPhone', 'issueType', 'description', 'severity'],
    },
  },
  {
    name: 'processReturnRequest',
    description: 'Initiate a return, exchange, refund, or repair request for a customer',
    parameters: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: "Customer's full name",
        },
        customerPhone: {
          type: 'string',
          description: "Customer's phone number",
        },
        orderId: {
          type: 'string',
          description: 'Order ID for the item being returned',
        },
        reason: {
          type: 'string',
          description: 'Reason for the return request',
        },
        preferredResolution: {
          type: 'string',
          enum: ['refund', 'exchange', 'store_credit', 'repair'],
          description: "Customer's preferred resolution",
        },
      },
      required: ['customerName', 'customerPhone', 'orderId', 'reason', 'preferredResolution'],
    },
  },
  {
    name: 'escalateToManager',
    description: 'Escalate the call to a manager with context about the situation',
    parameters: {
      type: 'object',
      properties: {
        customerName: {
          type: 'string',
          description: "Customer's full name",
        },
        customerPhone: {
          type: 'string',
          description: "Customer's phone number",
        },
        reason: {
          type: 'string',
          description: 'Reason for escalating to a manager',
        },
        priority: {
          type: 'string',
          enum: ['normal', 'urgent'],
          description: 'Priority level of the escalation',
        },
        issueDescription: {
          type: 'string',
          description: 'Summary of the issue for the manager',
        },
      },
      required: ['customerName', 'customerPhone', 'reason', 'priority', 'issueDescription'],
    },
  },
  {
    name: 'captureLeadInfo',
    description: 'Capture contact information and interest details for a prospective customer',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Prospect's full name",
        },
        phone: {
          type: 'string',
          description: "Prospect's phone number",
        },
        email: {
          type: 'string',
          description: "Prospect's email address (optional)",
        },
        interestedIn: {
          type: 'string',
          description: 'Product or service they are interested in (optional)',
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the sales team (optional)',
        },
      },
      required: ['name', 'phone'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createCustomerServiceEmployee(params: {
  businessId: string
  businessName: string
  name?: string
  customConfig?: Partial<CustomerServiceConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultCustomerServiceConfig(params.businessName)
  const jobConfig: CustomerServiceConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'customer-service',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Alex',
    jobType: 'customer-service',
    complexity: 'moderate',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'sarah',
      speed: 1.0,
      stability: 0.8,
    },

    personality: params.personality || {
      tone: 'warm',
      enthusiasm: 'medium',
      formality: 'semi-formal',
    },

    schedule: {
      timezone: 'America/Los_Angeles',
      businessHours: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: null,
        sunday: null,
      },
      afterHoursMessage: `Thank you for calling ${params.businessName} customer support. We're currently closed. Our hours are Monday through Friday, 9 AM to 5 PM. Please leave a message and we'll call you back on the next business day.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['customer-service'],
    jobConfig,
    isActive: true,
  }
}

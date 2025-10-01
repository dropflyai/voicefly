// Vapi Integration for Multi-Tenant Phone Numbers
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SHARED_ASSISTANT_ID = '8ab7e000-aea8-4141-a471-33133219a471'; // Your existing assistant

export async function assignPhoneNumber(businessId, businessName) {
  try {
    // 1. Buy a new phone number for this business
    const phoneResponse = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'twilio',
        // Auto-purchase from available pool
        // Vapi will assign next available number
      })
    });

    if (!phoneResponse.ok) {
      throw new Error(`Failed to purchase phone number: ${phoneResponse.statusText}`);
    }

    const phoneData = await phoneResponse.json();
    const phoneNumber = phoneData.number;

    // 2. Configure the phone number to use our shared assistant
    const configResponse = await fetch(`https://api.vapi.ai/phone-number/${phoneData.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId: SHARED_ASSISTANT_ID,
        // The webhook will receive businessId in metadata
        serverUrl: 'https://fbb8dc638db6.ngrok-free.app/webhook/vapi',
        serverUrlSecret: 'your-webhook-secret' // Optional security
      })
    });

    if (!configResponse.ok) {
      throw new Error(`Failed to configure phone number: ${configResponse.statusText}`);
    }

    return {
      success: true,
      phoneNumber: phoneNumber,
      phoneId: phoneData.id,
      message: `Phone number ${phoneNumber} assigned to ${businessName}`
    };

  } catch (error) {
    console.error('Phone assignment error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function createCustomAssistant(businessData) {
  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${businessData.name} Concierge`,
        firstMessage: `Thank you for calling ${businessData.name}! How can I help you today?`,
        systemMessage: `You are a helpful booking assistant for ${businessData.name}, a service business. 
        Help customers book appointments, check availability, and answer questions about services.
        
        Business Hours: ${businessData.hours}
        Location: ${businessData.address}
        
        Always be friendly and professional. When booking, make sure to get:
        - Customer name and phone number
        - Preferred service type
        - Preferred date and time
        - Any special requests`,
        
        model: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.7
        },
        voice: {
          provider: '11labs',
          voiceId: 'sarah', // Or let salon choose voice
          stability: 0.5,
          similarityBoost: 0.75
        },
        
        // Same functions as shared assistant
        tools: [
          {
            type: 'function',
            function: {
              name: 'check_availability',
              description: 'Check available appointment slots',
              parameters: {
                type: 'object',
                properties: {
                  preferred_date: { type: 'string' },
                  service_type: { type: 'string' }
                },
                required: ['preferred_date']
              },
              server: {
                url: 'https://fbb8dc638db6.ngrok-free.app/webhook/vapi'
              }
            }
          },
          {
            type: 'function', 
            function: {
              name: 'book_appointment',
              description: 'Book a new appointment',
              parameters: {
                type: 'object',
                properties: {
                  customer_name: { type: 'string' },
                  customer_phone: { type: 'string' },
                  appointment_date: { type: 'string' },
                  start_time: { type: 'string' },
                  service_type: { type: 'string' }
                },
                required: ['customer_name', 'customer_phone', 'appointment_date', 'start_time']
              },
              server: {
                url: 'https://fbb8dc638db6.ngrok-free.app/webhook/vapi'
              }
            }
          }
          // ... other functions
        ]
      })
    });

    const assistantData = await response.json();
    return assistantData;

  } catch (error) {
    console.error('Assistant creation error:', error);
    throw error;
  }
}
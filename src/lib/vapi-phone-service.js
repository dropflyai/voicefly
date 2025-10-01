// Vapi Phone Number Management Service
// Handles automatic phone number purchasing and assignment

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY || process.env.VAPI_API_KEY;
const SHARED_ASSISTANT_ID = '8ab7e000-aea8-4141-a471-33133219a471'; // Your existing assistant
const WEBHOOK_URL = 'https://fbb8dc638db6.ngrok-free.app/webhook/vapi'; // Your current webhook

export class VapiPhoneService {
  
  static async purchasePhoneNumber(areaCode = null) {
    try {
      console.log('🔄 Purchasing phone number from Vapi...');
      
      const requestBody = {
        provider: 'twilio',
        // Optional: specify area code preferences
        ...(areaCode && { areaCode })
      };
      
      const response = await fetch('https://api.vapi.ai/phone-number', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Vapi API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          apiKey: VAPI_API_KEY ? `${VAPI_API_KEY.substring(0, 8)}...` : 'NOT SET'
        });
        throw new Error(`Vapi API error: ${response.status} - ${errorData}`);
      }

      const phoneData = await response.json();
      console.log('✅ Phone number purchased:', phoneData.number);
      
      return {
        success: true,
        phoneId: phoneData.id,
        phoneNumber: phoneData.number,
        providerId: phoneData.providerId,
        data: phoneData
      };

    } catch (error) {
      console.error('❌ Phone purchase failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async configurePhoneNumber(phoneId, businessId, businessName, assistantId = null) {
    try {
      console.log(`🔄 Configuring phone ${phoneId} for business: ${businessName}`);
      
      const response = await fetch(`https://api.vapi.ai/phone-number/${phoneId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assistantId: assistantId || SHARED_ASSISTANT_ID, // Use provided assistant or default to shared
          serverUrl: WEBHOOK_URL,
          // Add business context in metadata (if supported)
          metadata: {
            businessId: businessId,
            businessName: businessName
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Phone configuration failed: ${response.status} - ${errorData}`);
      }

      const configData = await response.json();
      console.log('✅ Phone number configured for business');
      
      return {
        success: true,
        data: configData
      };

    } catch (error) {
      console.error('❌ Phone configuration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async assignPhoneToSalon(businessId, businessName, assistantId = null, preferredAreaCode = null) {
    try {
      console.log(`🎯 Assigning phone number to salon: ${businessName}`);
      console.log(`📞 Using assistant: ${assistantId || SHARED_ASSISTANT_ID} (${assistantId ? 'custom' : 'shared'})`);

      // Step 1: Purchase a new phone number
      const purchaseResult = await this.purchasePhoneNumber(preferredAreaCode);
      if (!purchaseResult.success) {
        return purchaseResult;
      }

      // Step 2: Configure it for our assistant and webhook
      const configResult = await this.configurePhoneNumber(
        purchaseResult.phoneId, 
        businessId, 
        businessName,
        assistantId // Pass the assistant ID
      );
      
      if (!configResult.success) {
        // TODO: Consider releasing the purchased number if configuration fails
        return {
          success: false,
          error: `Phone purchased but configuration failed: ${configResult.error}`
        };
      }

      return {
        success: true,
        phoneId: purchaseResult.phoneId,
        phoneNumber: purchaseResult.phoneNumber,
        message: `Phone number ${purchaseResult.phoneNumber} successfully assigned to ${businessName}`,
        vapiData: {
          phoneNumberId: purchaseResult.phoneId,
          number: purchaseResult.phoneNumber,
          providerId: purchaseResult.providerId
        }
      };

    } catch (error) {
      console.error('❌ Phone assignment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async listAvailableNumbers(areaCode = null, limit = 10) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(areaCode && { areaCode })
      });
      
      const response = await fetch(`https://api.vapi.ai/phone-number/available?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        numbers: data
      };

    } catch (error) {
      console.error('❌ Failed to list available numbers:', error);
      return {
        success: false,
        error: error.message,
        numbers: []
      };
    }
  }

  // Utility: Format phone number for display
  static formatPhoneNumber(phoneNumber) {
    // Convert +12345678901 to (234) 567-8901
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.substring(1);
      return `(${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
    }
    return phoneNumber;
  }

  // Test function for development
  static async testConnection() {
    try {
      const response = await fetch('https://api.vapi.ai/assistant', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Vapi connection successful' : 'Vapi connection failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// For Node.js environments (non-Next.js)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VapiPhoneService };
}
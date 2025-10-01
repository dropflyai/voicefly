#!/usr/bin/env node

/**
 * MULTI-TENANT Webhook Server for Vapi Assistant
 * Routes calls based on phone number to correct business
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://irvyhhkoiyzartmmvbxw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydnloaGtvaXl6YXJ0bW12Ynh3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTExODI5MywiZXhwIjoyMDcwNjk0MjkzfQ.61Zfyc87GpmpIlWFL1fyX6wcfydqCu6DUFuHnpNSvhk';

console.log('🚀 MULTI-TENANT Webhook server starting...');
console.log('📞 Phone-based business routing enabled');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Business Context Injector (same as before)
class BusinessContextInjector {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchBusinessContext(businessId) {
        const cacheKey = `business_${businessId}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        try {
            console.log(`🏢 Fetching business context for: ${businessId}`);

            const { data: business } = await supabase
                .from('businesses')
                .select(`
                    id, name, phone, email, website,
                    address_line1, city, state, postal_code, country,
                    subscription_tier, timezone
                `)
                .eq('id', businessId)
                .single();

            if (!business) {
                throw new Error(`Business not found: ${businessId}`);
            }

            const { data: services } = await supabase
                .from('services')
                .select('id, name, description, duration_minutes, base_price, category, requires_deposit, deposit_amount')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            const { data: staff } = await supabase
                .from('staff')
                .select('id, first_name, last_name, role, specialties, is_active')
                .eq('business_id', businessId)
                .eq('is_active', true)
                .order('first_name');

            const { data: businessHours } = await supabase
                .from('business_hours')
                .select('day_of_week, is_closed, open_time, close_time')
                .eq('business_id', businessId)
                .order('day_of_week');

            const context = {
                business,
                services: services || [],
                staff: staff || [],
                businessHours: businessHours || []
            };

            this.cache.set(cacheKey, {
                data: context,
                timestamp: Date.now()
            });

            return context;
        } catch (error) {
            console.error(`❌ Error fetching business context:`, error);
            return null;
        }
    }

    async injectIntoFunctionResponse(response, businessId) {
        if (typeof response === 'string') {
            const context = await this.fetchBusinessContext(businessId);
            if (!context) return response;

            const { business } = context;
            return response.replace(/{BUSINESS_NAME}/g, business.name);
        }

        if (typeof response === 'object' && response !== null) {
            const injectedResponse = { ...response };
            
            if (injectedResponse.message) {
                const context = await this.fetchBusinessContext(businessId);
                if (context) {
                    const { business } = context;
                    injectedResponse.message = injectedResponse.message.replace(/{BUSINESS_NAME}/g, business.name);
                }
            }
            
            return injectedResponse;
        }

        return response;
    }
}

const businessContextInjector = new BusinessContextInjector();

// MULTI-TENANT: Phone number to business ID mapping
async function getBusinessIdFromPhone(phoneNumber) {
    try {
        // Clean phone number (remove formatting)
        const cleanPhone = phoneNumber?.replace(/[\D]/g, '');
        console.log(`📞 Looking up business for phone: ${cleanPhone}`);
        
        // Method 1: Direct phone match in businesses table
        const { data: business, error } = await supabase
            .from('businesses')
            .select('id, name, phone')
            .eq('phone', phoneNumber)
            .single();
            
        if (business) {
            console.log(`✅ Found business by phone: ${business.name} (${business.id})`);
            return business.id;
        }
        
        // Method 2: Check if this is our known demo/test number
        if (cleanPhone === '4243519304') {
            console.log('📱 Using demo business for (424) 351-9304');
            // Return the latest business for now (Bella's Nails)
            const { data: latestBusiness } = await supabase
                .from('businesses')
                .select('id, name')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
                
            if (latestBusiness) {
                console.log(`🎯 Demo routing to: ${latestBusiness.name} (${latestBusiness.id})`);
                return latestBusiness.id;
            }
        }
        
        // Method 3: Fallback to default demo business
        console.log('⚠️  No phone match, using default business');
        return '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad';
        
    } catch (error) {
        console.error('❌ Error looking up business by phone:', error);
        return '8424aa26-4fd5-4d4b-92aa-8a9c5ba77dad'; // Default fallback
    }
}

// Express middleware
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Multi-tenant webhook handler
app.post('/webhook/vapi', async (req, res) => {
    try {
        const message = req.body.message;
        const call = req.body.call; // Vapi provides call info including phone numbers
        
        console.log('📞 Webhook received:', JSON.stringify({
            type: message?.type,
            hasToolCalls: !!message?.toolCalls,
            hasFunctionCall: !!message?.functionCall,
            callId: call?.id,
            // Safely log phone info without exposing full numbers
            customerNumber: call?.customer?.number ? 'xxx-xxx-' + call.customer.number.slice(-4) : 'unknown',
            assistantNumber: call?.assistantPhoneNumber ? 'xxx-xxx-' + call.assistantPhoneNumber.slice(-4) : 'unknown'
        }));
        
        // MULTI-TENANT: Get business ID from phone number
        const phoneNumber = call?.assistantPhoneNumber || call?.phoneNumber;
        const businessId = await getBusinessIdFromPhone(phoneNumber);
        
        console.log('🏢 Routing to business ID:', businessId);
        
        // Validate business exists
        const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('id, name, subscription_tier')
            .eq('id', businessId)
            .single();

        if (businessError || !business) {
            console.error('❌ Business validation failed:', businessError);
            return res.status(400).json({ error: 'Invalid business ID' });
        }

        console.log(`✅ Webhook authorized for business: ${business.name}`);

        // Handle function calls
        if (message?.toolCalls) {
            const results = [];
            
            for (const toolCall of message.toolCalls) {
                const result = await handleToolCall(toolCall, businessId);
                results.push(result);
            }

            return res.json({ results });
        }
        
        if (message?.functionCall) {
            const result = await handleToolCall({ function: message.functionCall }, businessId);
            return res.json(result);
        }

        // Handle user's first input - respond with personalized greeting
        if (message?.type === 'transcript' || (message && !message.toolCalls && !message.functionCall)) {
            console.log('👋 Handling user first input - sending personalized greeting');
            const context = await businessContextInjector.fetchBusinessContext(businessId);
            if (context && context.business) {
                const personalizedGreeting = `Hi! Thanks for calling ${context.business.name}! I'm your AI booking assistant. How can I help you today?`;
                console.log('📞 Sending greeting:', personalizedGreeting);
                return res.json({
                    message: personalizedGreeting
                });
            }
        }

        res.json({ status: 'received', businessId: businessId });
        
    } catch (error) {
        console.error(`❌ Webhook error:`, error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'The booking system is temporarily unavailable. Please try again in a moment.'
        });
    }
});

// Enhanced function call handler (same as before)
async function handleToolCall(toolCall, businessId) {
    const { function: fn } = toolCall;
    
    let result;
    
    try {
        switch (fn.name) {
            case 'check_availability':
                result = await checkAvailability(fn.arguments, businessId);
                break;
                
            case 'book_appointment':
                result = await bookAppointment(fn.arguments, businessId);
                break;
                
            case 'check_appointments':
                result = await checkAppointments(fn.arguments, businessId);
                break;
                
            case 'cancel_appointment':
                result = await cancelAppointment(fn.arguments, businessId);
                break;
                
            default:
                result = { error: `Unknown function: ${fn.name}` };
        }
        
        const injectedResult = await businessContextInjector.injectIntoFunctionResponse(result, businessId);
        console.log(`✅ Business context injected for function: ${fn.name}`);
        return injectedResult;
        
    } catch (contextError) {
        console.error('❌ Error injecting business context:', contextError);
        return result;
    }
}

// Enhanced booking function with detailed logging
async function bookAppointment(args, businessId) {
    try {
        console.log('📝 BOOKING ATTEMPT:', {
            businessId,
            customerName: args.customer_name,
            customerPhone: args.customer_phone,
            serviceType: args.service_type,
            appointmentDate: args.appointment_date,
            startTime: args.start_time
        });
        
        // Validate required parameters
        if (!args.customer_name || !args.customer_phone || !args.appointment_date || !args.start_time) {
            console.log('❌ Missing required booking parameters');
            return {
                success: false,
                message: "I need your name, phone number, preferred date, and time to book your appointment. Could you please provide all of these details?"
            };
        }
        
        // Create or get customer
        let customer;
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('*')
            .eq('business_id', businessId)
            .eq('phone', args.customer_phone)
            .single();
            
        if (existingCustomer) {
            customer = existingCustomer;
            console.log('👤 Found existing customer:', customer.id);
        } else {
            const [firstName, ...lastNameParts] = args.customer_name.split(' ');
            const { data: newCustomer, error } = await supabase
                .from('customers')
                .insert({
                    business_id: businessId,
                    first_name: firstName,
                    last_name: lastNameParts.join(' ') || '',
                    phone: args.customer_phone,
                    email: args.customer_email || null
                })
                .select()
                .single();
                
            if (error) {
                console.error('❌ Error creating customer:', error);
                throw error;
            }
            customer = newCustomer;
            console.log('👤 Created new customer:', customer.id);
        }
        
        // Get service
        let service = null;
        if (args.service_type) {
            const serviceCategory = args.service_type.replace(/_/g, ' ').replace('manicure', 'Manicure').replace('pedicure', 'Pedicure');
            
            console.log('🔍 Looking for service:', serviceCategory, 'in business:', businessId);
            
            const { data: matchedService, error: serviceError } = await supabase
                .from('services')
                .select('*')
                .eq('business_id', businessId)
                .ilike('name', `%${serviceCategory}%`)
                .limit(1)
                .single();
                
            if (serviceError && serviceError.code !== 'PGRST116') {
                console.error('❌ Error finding service:', serviceError);
            }
            
            service = matchedService;
            console.log('🎯 Service found:', service ? `${service.name} ($${service.base_price})` : 'No match');
        }
        
        // Calculate end time
        const duration = service?.duration_minutes || 60;
        const startTime = new Date(`${args.appointment_date} ${args.start_time}`);
        const endTime = new Date(startTime.getTime() + (duration * 60000));
        const endTimeString = endTime.toTimeString().substring(0, 8);
        
        // Create appointment
        const appointmentData = {
            business_id: businessId,
            customer_id: customer.id,
            service_id: service?.id,
            appointment_date: args.appointment_date,
            start_time: args.start_time,
            end_time: endTimeString,
            status: 'pending'
        };

        console.log('📝 Creating appointment with data:', appointmentData);

        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert(appointmentData)
            .select()
            .single();
            
        if (error) {
            console.error('❌ Database error creating appointment:', error);
            throw error;
        }
        
        console.log('✅ Appointment created successfully!', {
            appointmentId: appointment.id,
            businessId,
            customerId: customer.id,
            serviceId: service?.id || 'none'
        });
        
        // Format response
        const serviceName = service ? service.name : args.service_type?.replace('_', ' ') || 'your service';
        const servicePrice = service ? ` ($${service.base_price})` : '';
        
        return {
            success: true,
            booking_id: appointment.id,
            message: `Perfect! I've booked your ${serviceName} appointment${servicePrice} for ${args.appointment_date} at ${args.start_time}. You should receive a confirmation shortly. Is there anything else I can help you with?`,
            appointment: {
                id: appointment.id,
                service: serviceName,
                date: args.appointment_date,
                time: args.start_time,
                customer: args.customer_name,
                price: service?.base_price || null
            }
        };
        
    } catch (error) {
        console.error('❌ Error booking appointment:', error);
        
        return { 
            success: false, 
            message: "I apologize, but I'm having trouble booking your appointment right now. This might be due to a scheduling conflict or system issue. Could you please try again, or would you prefer to speak with one of our staff members directly?",
            error: 'booking_system_error',
            details: error.message
        };
    }
}

// Placeholder functions
async function checkAvailability(args, businessId) {
    return {
        available: true,
        message: "I can help you check availability. What date and service are you interested in?"
    };
}

async function checkAppointments(args, businessId) {
    return {
        appointments: [],
        count: 0,
        message: "Let me check your appointments. Could you provide your phone number?"
    };
}

async function cancelAppointment(args, businessId) {
    return {
        success: false,
        message: "I can help you cancel an appointment. Could you provide your booking details?"
    };
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: 'multi-tenant-v1.0',
        features: ['phone-based-routing', 'business-context-injection', 'multi-tenant-support']
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MULTI-TENANT Webhook server running on port ${PORT}`);
    console.log(`📞 Vapi webhook URL: http://localhost:${PORT}/webhook/vapi`);
    console.log(`📱 Phone-based business routing: ENABLED`);
    console.log(`💾 Connected to Supabase: ${SUPABASE_URL}`);
});

module.exports = app;
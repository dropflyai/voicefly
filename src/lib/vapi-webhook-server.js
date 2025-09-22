#!/usr/bin/env node

/**
 * MULTI-TENANT Webhook Server for Vapi Assistant
 * Routes calls based on phone number to correct business
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
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

// MULTI-TENANT: Phone number to business ID mapping using phone_business_mapping table
async function getBusinessIdFromPhone(phoneNumber) {
    try {
        // Clean phone number (remove formatting, ensure E.164 format)
        let cleanPhone = phoneNumber?.replace(/[\D]/g, '');
        if (cleanPhone && !cleanPhone.startsWith('1')) {
            cleanPhone = '1' + cleanPhone;
        }
        const formattedPhone = cleanPhone ? `+${cleanPhone}` : null;
        
        console.log(`📞 Looking up business for phone: ${phoneNumber} → ${formattedPhone}`);
        
        // Method 1: Use phone_business_mapping table (PROPER MULTI-TENANT)
        if (formattedPhone) {
            const { data: mapping, error } = await supabase
                .from('phone_business_mapping')
                .select(`
                    business_id,
                    businesses!inner(id, name)
                `)
                .eq('phone_number', formattedPhone)
                .eq('is_active', true)
                .single();
                
            if (mapping && !error) {
                console.log(`✅ Phone mapping found: ${mapping.businesses.name} (${mapping.business_id})`);
                return mapping.business_id;
            }
        }
        
        // Method 2: Try original phone number format as fallback
        if (phoneNumber) {
            const { data: mapping, error } = await supabase
                .from('phone_business_mapping')
                .select(`
                    business_id,
                    businesses!inner(id, name)
                `)
                .eq('phone_number', phoneNumber)
                .eq('is_active', true)
                .single();
                
            if (mapping && !error) {
                console.log(`✅ Phone mapping found (alt format): ${mapping.businesses.name} (${mapping.business_id})`);
                return mapping.business_id;
            }
        }
        
        // Method 3: Legacy fallback for demo/existing number
        console.log('⚠️  No phone mapping found, checking demo number fallback...');
        if (cleanPhone === '14243519304' || cleanPhone === '4243519304') {
            console.log('📱 Demo number detected, using Bella\'s Nails Studio');
            return 'bb18c6ca-7e97-449d-8245-e3c28a6b6971';
        }
        
        // Method 4: Last resort - use latest business
        console.log('🆘 No mapping found, using latest business as fallback');
        const { data: latestBusiness } = await supabase
            .from('businesses')
            .select('id, name')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
        if (latestBusiness) {
            console.log(`🎯 Fallback routing to: ${latestBusiness.name} (${latestBusiness.id})`);
            return latestBusiness.id;
        }
        
        console.error('❌ No businesses found in database');
        return null;
        
    } catch (error) {
        console.error('❌ Error looking up business by phone:', error);
        // Return latest business as absolute fallback
        return 'bb18c6ca-7e97-449d-8245-e3c28a6b6971';
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
                
            case 'reschedule_appointment':
                result = await rescheduleAppointment(fn.arguments, businessId);
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
        
        // 🚀 TRIGGER N8N POST-BOOKING AUTOMATION
        await triggerN8NAutomation({
            appointment,
            customer,
            service,
            businessId
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

// CUSTOMER MANAGEMENT FUNCTIONS

async function checkAvailability(args, businessId) {
    try {
        console.log('🔍 Checking availability:', args);
        
        // For now, return available - could add real availability logic later
        return {
            available: true,
            message: "That time slot is available! Would you like me to book it for you?"
        };
    } catch (error) {
        console.error('❌ Error checking availability:', error);
        return {
            available: false,
            message: "I'm having trouble checking availability right now. Let me transfer you to our staff."
        };
    }
}

async function checkAppointments(args, businessId) {
    try {
        console.log('📅 Checking appointments for customer:', args);
        
        if (!args.customer_phone) {
            return {
                appointments: [],
                count: 0,
                message: "I'll need your phone number to look up your appointments."
            };
        }
        
        // Clean phone number for lookup
        const cleanPhone = args.customer_phone.replace(/\D/g, '');
        console.log('🔍 Looking up appointments for phone:', cleanPhone);
        
        // Find customer
        const { data: customer } = await supabase
            .from('customers')
            .select('id, first_name, last_name')
            .eq('business_id', businessId)
            .eq('phone', cleanPhone)
            .single();
            
        if (!customer) {
            return {
                appointments: [],
                count: 0,
                message: "I don't see any appointments under that phone number. Would you like to book one?"
            };
        }
        
        // Get customer's appointments (future appointments only)
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                start_time,
                status,
                services(name, base_price),
                staff(first_name, last_name)
            `)
            .eq('business_id', businessId)
            .eq('customer_id', customer.id)
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .order('appointment_date', { ascending: true })
            .order('start_time', { ascending: true });
            
        if (error) {
            console.error('❌ Error fetching appointments:', error);
            throw error;
        }
        
        console.log('✅ Found appointments:', appointments.length);
        
        if (appointments.length === 0) {
            return {
                appointments: [],
                count: 0,
                message: `Hi ${customer.first_name}! I don't see any upcoming appointments for you. Would you like to book one?`
            };
        }
        
        // Format appointments for response
        const formattedAppointments = appointments.map(apt => {
            const date = new Date(apt.appointment_date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const timeStr = apt.start_time;
            const service = apt.services?.name || 'Service';
            const price = apt.services?.base_price ? `$${apt.services.base_price}` : '';
            const staff = apt.staff ? `with ${apt.staff.first_name} ${apt.staff.last_name}` : '';
            
            return `${service} on ${dateStr} at ${timeStr} ${staff} ${price}`.trim();
        });
        
        const appointmentList = formattedAppointments.join(', ');
        
        return {
            appointments: appointments,
            count: appointments.length,
            message: `Hi ${customer.first_name}! You have ${appointments.length} upcoming appointment${appointments.length > 1 ? 's' : ''}: ${appointmentList}. Would you like to cancel or reschedule any of these?`
        };
        
    } catch (error) {
        console.error('❌ Error checking appointments:', error);
        return {
            appointments: [],
            count: 0,
            message: "I'm having trouble looking up your appointments right now. Please call back in a few minutes."
        };
    }
}

async function cancelAppointment(args, businessId) {
    try {
        console.log('❌ Canceling appointment:', args);
        
        if (!args.customer_phone) {
            return {
                success: false,
                message: "I'll need your phone number to cancel your appointment."
            };
        }
        
        // Clean phone number
        const cleanPhone = args.customer_phone.replace(/\D/g, '');
        
        // Find customer
        const { data: customer } = await supabase
            .from('customers')
            .select('id, first_name')
            .eq('business_id', businessId)
            .eq('phone', cleanPhone)
            .single();
            
        if (!customer) {
            return {
                success: false,
                message: "I don't see any appointments under that phone number."
            };
        }
        
        // If specific appointment ID provided, cancel that one
        if (args.appointment_id) {
            const { data: appointment, error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', args.appointment_id)
                .eq('business_id', businessId)
                .eq('customer_id', customer.id)
                .select(`
                    id,
                    appointment_date,
                    start_time,
                    services(name)
                `)
                .single();
                
            if (error || !appointment) {
                return {
                    success: false,
                    message: "I couldn't find that specific appointment. Could you provide more details?"
                };
            }
            
            const date = new Date(appointment.appointment_date);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            
            return {
                success: true,
                appointment_id: appointment.id,
                message: `I've cancelled your ${appointment.services?.name || 'appointment'} on ${dateStr} at ${appointment.start_time}. Is there anything else I can help you with?`
            };
        }
        
        // If no specific ID, find their next appointment
        const { data: nextAppointment } = await supabase
            .from('appointments')
            .select(`
                id,
                appointment_date,
                start_time,
                services(name)
            `)
            .eq('business_id', businessId)
            .eq('customer_id', customer.id)
            .eq('status', 'pending')
            .gte('appointment_date', new Date().toISOString().split('T')[0])
            .order('appointment_date', { ascending: true })
            .order('start_time', { ascending: true })
            .limit(1)
            .single();
            
        if (!nextAppointment) {
            return {
                success: false,
                message: "I don't see any upcoming appointments to cancel."
            };
        }
        
        // Cancel the next appointment
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', nextAppointment.id);
            
        if (error) {
            console.error('❌ Error cancelling appointment:', error);
            throw error;
        }
        
        const date = new Date(nextAppointment.appointment_date);
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        
        console.log('✅ Appointment cancelled:', nextAppointment.id);
        
        return {
            success: true,
            appointment_id: nextAppointment.id,
            message: `I've cancelled your ${nextAppointment.services?.name || 'appointment'} on ${dateStr} at ${nextAppointment.start_time}. Would you like to book a new appointment?`
        };
        
    } catch (error) {
        console.error('❌ Error canceling appointment:', error);
        return {
            success: false,
            message: "I'm having trouble canceling your appointment right now. Please call back or speak with our staff."
        };
    }
}

async function rescheduleAppointment(args, businessId) {
    try {
        console.log('🔄 Rescheduling appointment:', args);
        
        if (!args.customer_phone) {
            return {
                success: false,
                message: "I'll need your phone number to reschedule your appointment."
            };
        }
        
        if (!args.new_date || !args.new_time) {
            return {
                success: false,
                message: "I'll need the new date and time you'd prefer for your appointment."
            };
        }
        
        // Clean phone number
        const cleanPhone = args.customer_phone.replace(/\D/g, '');
        
        // Find customer
        const { data: customer } = await supabase
            .from('customers')
            .select('id, first_name')
            .eq('business_id', businessId)
            .eq('phone', cleanPhone)
            .single();
            
        if (!customer) {
            return {
                success: false,
                message: "I don't see any appointments under that phone number."
            };
        }
        
        // Find appointment to reschedule
        let appointmentToReschedule;
        
        if (args.appointment_id) {
            const { data: appointment } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    start_time,
                    services(name),
                    service_id
                `)
                .eq('id', args.appointment_id)
                .eq('business_id', businessId)
                .eq('customer_id', customer.id)
                .single();
                
            appointmentToReschedule = appointment;
        } else {
            // Find their next appointment
            const { data: appointment } = await supabase
                .from('appointments')
                .select(`
                    id,
                    appointment_date,
                    start_time,
                    services(name),
                    service_id
                `)
                .eq('business_id', businessId)
                .eq('customer_id', customer.id)
                .eq('status', 'pending')
                .gte('appointment_date', new Date().toISOString().split('T')[0])
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true })
                .limit(1)
                .single();
                
            appointmentToReschedule = appointment;
        }
        
        if (!appointmentToReschedule) {
            return {
                success: false,
                message: "I don't see any appointments to reschedule."
            };
        }
        
        // Calculate end time (assuming 60 minutes if no service duration)
        const startTime = new Date(`${args.new_date} ${args.new_time}`);
        const endTime = new Date(startTime.getTime() + (60 * 60000)); // 60 minutes
        const endTimeString = endTime.toTimeString().substring(0, 8);
        
        // Update the appointment
        const { data: updatedAppointment, error } = await supabase
            .from('appointments')
            .update({
                appointment_date: args.new_date,
                start_time: args.new_time,
                end_time: endTimeString
            })
            .eq('id', appointmentToReschedule.id)
            .select(`
                id,
                appointment_date,
                start_time,
                services(name)
            `)
            .single();
            
        if (error) {
            console.error('❌ Error rescheduling appointment:', error);
            throw error;
        }
        
        const newDate = new Date(args.new_date);
        const newDateStr = newDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        
        console.log('✅ Appointment rescheduled:', updatedAppointment.id);
        
        return {
            success: true,
            appointment_id: updatedAppointment.id,
            message: `Perfect! I've rescheduled your ${appointmentToReschedule.services?.name || 'appointment'} to ${newDateStr} at ${args.new_time}. Is there anything else I can help you with?`
        };
        
    } catch (error) {
        console.error('❌ Error rescheduling appointment:', error);
        return {
            success: false,
            message: "I'm having trouble rescheduling your appointment right now. Please call back or speak with our staff."
        };
    }
}

// 🚀 N8N AUTOMATION INTEGRATION
async function triggerN8NAutomation(data) {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    if (!N8N_WEBHOOK_URL) {
        console.log('⚠️  N8N_WEBHOOK_URL not configured, skipping automation');
        return;
    }
    
    try {
        // Get business context for the automation
        const { data: business } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', data.businessId)
            .single();
            
        // Format phone number for Twilio (must be E.164 format: +1XXXXXXXXXX)
        let formattedPhone = data.customer.phone;
        if (formattedPhone) {
            // Remove all non-digits
            const digitsOnly = formattedPhone.replace(/\D/g, '');
            
            // Add country code if missing
            if (digitsOnly.length === 10) {
                formattedPhone = `+1${digitsOnly}`;
            } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
                formattedPhone = `+${digitsOnly}`;
            } else {
                formattedPhone = `+${digitsOnly}`;
            }
        }
        
        console.log('📱 Original phone:', data.customer.phone, '→ Formatted:', formattedPhone);
        
        const n8nPayload = {
            event: 'appointment_booked',
            timestamp: new Date().toISOString(),
            appointment: {
                id: data.appointment.id,
                date: data.appointment.appointment_date,
                time: data.appointment.start_time,
                duration: data.service?.duration_minutes || 60,
                status: data.appointment.status || 'pending',
                source: 'vapi_voice_ai'
            },
            customer: {
                id: data.customer.id,
                name: `${data.customer.first_name || 'Unknown'} ${data.customer.last_name || 'Customer'}`,
                firstName: data.customer.first_name || 'Unknown',
                lastName: data.customer.last_name || 'Customer',
                phone: formattedPhone, // Use formatted phone
                email: data.customer.email || 'customer@example.com'
            },
            service: {
                id: data.service?.id || 'default-service',
                name: data.service?.name || 'Nail Service',
                duration: data.service?.duration_minutes || 60,
                price: data.service?.base_price || 0,
                category: data.service?.category || 'beauty'
            },
            business: {
                id: business?.id || data.businessId,
                name: business?.name || 'Beauty Salon',
                phone: business?.phone || '(424) 351-9304',
                email: business?.email || 'info@salon.com',
                address: business?.address_line1 || '123 Beauty St',
                city: business?.city || 'Los Angeles',
                state: business?.state || 'CA'
            }
        };
        
        console.log('🚀 Triggering N8N automation...', {
            url: N8N_WEBHOOK_URL,
            appointmentId: data.appointment.id,
            customerPhone: formattedPhone,
            servicePrice: data.service?.base_price,
            serviceName: data.service?.name
        });
        
        const response = await axios.post(N8N_WEBHOOK_URL, n8nPayload, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Vapi-Nail-Salon-Multi-Tenant/1.0'
            }
        });
        
        console.log('✅ N8N automation triggered successfully:', {
            status: response.status,
            appointmentId: response.data?.appointmentId || data.appointment.id
        });
        
    } catch (error) {
        console.error('❌ N8N automation failed:', {
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        // Don't throw - booking should succeed even if automation fails
    }
}

// 👤 CUSTOMER PORTAL ROUTES
const customerAuthRoutes = require('./routes/customerAuth');
const customerPortalRoutes = require('./routes/customerPortal');

app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/customer/portal', customerPortalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: 'multi-tenant-v1.0',
        features: ['phone-based-routing', 'business-context-injection', 'multi-tenant-support', 'customer-portal']
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
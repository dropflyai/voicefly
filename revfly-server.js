#!/usr/bin/env node

/**
 * RevFly Server - Revenue Generation Platform
 * Combines VAPI + LeadFly + WebOps + VoiceFly
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.REVFLY_PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Supabase configuration (Use VoiceFly/RevFly Supabase)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 RevFly Server starting...');
console.log('💰 Revenue Generation Platform Online');
console.log(`🌐 Server running on port ${PORT}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Revenue Tracking Class
class RevenueTracker {
    async trackAppointment(appointmentData) {
        try {
            const { data: appointment } = await supabase
                .from('appointments')
                .insert([appointmentData])
                .select()
                .single();

            // Auto-create revenue tracking
            if (appointment && appointment.total_price_cents > 0) {
                await supabase
                    .from('revenue_tracking')
                    .insert([{
                        organization_id: appointment.organization_id,
                        amount_cents: appointment.total_price_cents,
                        source: 'appointment',
                        appointment_id: appointment.id,
                        customer_id: appointment.customer_id,
                        revenue_date: appointment.appointment_date
                    }]);
            }

            console.log(`💰 Revenue tracked: $${appointment.total_price_cents / 100}`);
            return appointment;
        } catch (error) {
            console.error('❌ Revenue tracking failed:', error);
            throw error;
        }
    }

    async getDailyRevenue(organizationId, date = new Date().toISOString().split('T')[0]) {
        try {
            const { data: revenue } = await supabase
                .from('revenue_tracking')
                .select('amount_cents')
                .eq('organization_id', organizationId)
                .eq('revenue_date', date);

            const total = revenue?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;
            return { total_cents: total, total_dollars: total / 100 };
        } catch (error) {
            console.error('❌ Revenue calculation failed:', error);
            return { total_cents: 0, total_dollars: 0 };
        }
    }
}

// Lead Research Class (WebOps Integration)
class LeadResearcher {
    async researchCompany(domain) {
        try {
            // Simulate WebOps research (replace with actual WebOps API)
            const research = {
                company_size: 'Small Business',
                industry: 'Professional Services',
                tech_stack: ['Wordpress', 'Google Analytics'],
                pain_points: ['Lead generation', 'Online presence'],
                competitors: ['Local competition'],
                recent_news: 'Expanding services'
            };

            console.log(`🔍 Researched company: ${domain}`);
            return research;
        } catch (error) {
            console.error('❌ Company research failed:', error);
            return null;
        }
    }

    async enrichLead(leadData) {
        try {
            let enriched = { ...leadData };

            // Add company research if website provided
            if (leadData.website) {
                const research = await this.researchCompany(leadData.website);
                enriched.research_data = research;
            }

            // Add qualification score
            enriched.qualification_score = this.calculateQualificationScore(enriched);

            return enriched;
        } catch (error) {
            console.error('❌ Lead enrichment failed:', error);
            return leadData;
        }
    }

    calculateQualificationScore(lead) {
        let score = 50; // Base score

        // Industry bonus
        if (lead.industry === 'Healthcare') score += 20;
        if (lead.industry === 'Professional Services') score += 15;

        // Company size bonus
        if (lead.company_size === 'Medium Business') score += 10;
        if (lead.company_size === 'Large Enterprise') score += 20;

        // Website bonus
        if (lead.website) score += 10;

        // Phone bonus
        if (lead.phone) score += 5;

        return Math.min(100, Math.max(0, score));
    }
}

const revenueTracker = new RevenueTracker();
const leadResearcher = new LeadResearcher();

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'RevFly Revenue Platform',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// VAPI Webhook Handler
app.post('/webhook/vapi', async (req, res) => {
    try {
        const { event, call, customer, assistant } = req.body;

        console.log(`📞 VAPI Event: ${event} for call ${call?.id}`);

        switch (event) {
            case 'call-started':
                await handleCallStarted(call, customer);
                break;

            case 'call-ended':
                await handleCallEnded(call, customer);
                break;

            case 'function-call':
                const result = await handleFunctionCall(req.body);
                return res.json(result);

            default:
                console.log(`ℹ️ Unhandled VAPI event: ${event}`);
        }

        res.json({ success: true, message: 'Event processed' });
    } catch (error) {
        console.error('❌ VAPI webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Handle call started
async function handleCallStarted(call, customer) {
    try {
        // Research the customer's company if available
        if (customer?.email) {
            const domain = customer.email.split('@')[1];
            const research = await leadResearcher.researchCompany(domain);

            // Store research for use during call
            await supabase
                .from('voice_calls')
                .insert([{
                    vapi_call_id: call.id,
                    status: 'calling',
                    research_data: research,
                    customer_phone: customer.number,
                    started_at: new Date().toISOString()
                }]);
        }

        console.log(`📞 Call started with research: ${call.id}`);
    } catch (error) {
        console.error('❌ Call start handling failed:', error);
    }
}

// Handle call ended
async function handleCallEnded(call, customer) {
    try {
        // Update call record
        await supabase
            .from('voice_calls')
            .update({
                status: call.status === 'completed' ? 'completed' : 'failed',
                duration: call.duration,
                ended_at: new Date().toISOString()
            })
            .eq('vapi_call_id', call.id);

        console.log(`📞 Call ended: ${call.id} (${call.duration}s)`);
    } catch (error) {
        console.error('❌ Call end handling failed:', error);
    }
}

// Handle VAPI function calls (appointment booking)
async function handleFunctionCall(payload) {
    try {
        const { function_call } = payload;
        const { name, parameters } = function_call;

        console.log(`🔧 Function call: ${name}`);

        switch (name) {
            case 'book_appointment':
                return await bookAppointment(parameters);

            case 'check_availability':
                return await checkAvailability(parameters);

            case 'get_services':
                return await getServices(parameters);

            default:
                return { error: `Unknown function: ${name}` };
        }
    } catch (error) {
        console.error('❌ Function call failed:', error);
        return { error: 'Function execution failed' };
    }
}

// Book appointment function
async function bookAppointment(params) {
    try {
        const {
            customer_name,
            customer_phone,
            customer_email,
            service_name,
            appointment_date,
            appointment_time,
            organization_id = 'demo-org-id' // Default for demo
        } = params;

        // Find or create customer
        let { data: customer } = await supabase
            .from('customers')
            .select('*')
            .eq('organization_id', organization_id)
            .eq('phone', customer_phone)
            .single();

        if (!customer) {
            const { data: newCustomer } = await supabase
                .from('customers')
                .insert([{
                    organization_id,
                    first_name: customer_name.split(' ')[0],
                    last_name: customer_name.split(' ').slice(1).join(' '),
                    phone: customer_phone,
                    email: customer_email
                }])
                .select()
                .single();
            customer = newCustomer;
        }

        // Find service
        const { data: service } = await supabase
            .from('services')
            .select('*')
            .eq('organization_id', organization_id)
            .ilike('name', `%${service_name}%`)
            .single();

        if (!service) {
            return {
                success: false,
                message: `Service "${service_name}" not found`
            };
        }

        // Create appointment
        const appointment = await revenueTracker.trackAppointment({
            organization_id,
            customer_id: customer.id,
            service_id: service.id,
            appointment_date,
            start_time: appointment_time,
            service_price_cents: service.price_cents,
            total_price_cents: service.price_cents,
            booking_source: 'voice_call',
            status: 'scheduled'
        });

        return {
            success: true,
            message: `Appointment booked for ${customer_name} on ${appointment_date} at ${appointment_time}`,
            appointment_id: appointment.id,
            total_cost: `$${service.price_cents / 100}`
        };

    } catch (error) {
        console.error('❌ Appointment booking failed:', error);
        return {
            success: false,
            message: 'Failed to book appointment. Please try again.'
        };
    }
}

// Check availability function
async function checkAvailability(params) {
    try {
        const { date, organization_id = 'demo-org-id' } = params;

        // Get business hours
        const { data: hours } = await supabase
            .from('business_hours')
            .select('*')
            .eq('organization_id', organization_id);

        // Get existing appointments
        const { data: appointments } = await supabase
            .from('appointments')
            .select('start_time, end_time')
            .eq('organization_id', organization_id)
            .eq('appointment_date', date)
            .eq('status', 'scheduled');

        // Generate available slots (simplified)
        const availableSlots = [
            '9:00 AM', '10:00 AM', '11:00 AM',
            '2:00 PM', '3:00 PM', '4:00 PM'
        ];

        return {
            success: true,
            available_slots: availableSlots,
            date: date
        };

    } catch (error) {
        console.error('❌ Availability check failed:', error);
        return {
            success: false,
            message: 'Unable to check availability'
        };
    }
}

// Get services function
async function getServices(params) {
    try {
        const { organization_id = 'demo-org-id' } = params;

        const { data: services } = await supabase
            .from('services')
            .select('name, duration_minutes, price_cents, description')
            .eq('organization_id', organization_id)
            .eq('is_active', true);

        const formattedServices = services?.map(service => ({
            name: service.name,
            duration: `${service.duration_minutes} minutes`,
            price: `$${service.price_cents / 100}`,
            description: service.description
        })) || [];

        return {
            success: true,
            services: formattedServices
        };

    } catch (error) {
        console.error('❌ Services fetch failed:', error);
        return {
            success: false,
            message: 'Unable to fetch services'
        };
    }
}

// Revenue Analytics Endpoint
app.get('/api/revenue/:organizationId', async (req, res) => {
    try {
        const { organizationId } = req.params;
        const revenue = await revenueTracker.getDailyRevenue(organizationId);

        res.json({
            success: true,
            organization_id: organizationId,
            daily_revenue: revenue,
            currency: 'USD'
        });
    } catch (error) {
        console.error('❌ Revenue API failed:', error);
        res.status(500).json({ error: 'Revenue calculation failed' });
    }
});

// Lead Generation Endpoint (LeadFly Integration)
app.post('/api/leads/generate', async (req, res) => {
    try {
        const { industry, location, target_count = 50 } = req.body;

        // Simulate LeadFly lead generation
        const leads = [];
        for (let i = 0; i < target_count; i++) {
            leads.push({
                company_name: `${industry} Company ${i + 1}`,
                contact_name: `Contact ${i + 1}`,
                phone: `+1555${String(i).padStart(7, '0')}`,
                email: `contact${i + 1}@company${i + 1}.com`,
                industry,
                location,
                qualification_score: Math.floor(Math.random() * 40) + 60 // 60-100
            });
        }

        // Enrich leads
        const enrichedLeads = await Promise.all(
            leads.map(lead => leadResearcher.enrichLead(lead))
        );

        res.json({
            success: true,
            leads: enrichedLeads,
            count: enrichedLeads.length,
            message: `Generated ${enrichedLeads.length} qualified leads`
        });

    } catch (error) {
        console.error('❌ Lead generation failed:', error);
        res.status(500).json({ error: 'Lead generation failed' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RevFly Server running on port ${PORT}`);
    console.log(`💰 Revenue tracking enabled`);
    console.log(`📞 VAPI webhooks: /webhook/vapi`);
    console.log(`🎯 Lead generation: /api/leads/generate`);
    console.log(`📊 Revenue API: /api/revenue/:organizationId`);
    console.log(`🔍 Health check: /health`);
});

module.exports = app;
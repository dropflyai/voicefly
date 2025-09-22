#!/usr/bin/env node

// Setup DropFly as the first customer in the VoiceFly system
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDropFlyBusiness() {
  console.log('🚀 Setting up DropFly as first customer...')

  try {
    // 1. Create DropFly business record
    const businessData = {
      slug: 'dropfly',
      name: 'DropFly',
      business_type: 'lead_generation',
      phone: '+1-424-351-9304',
      email: 'hello@dropfly.ai',
      website: 'https://dropfly.ai',
      address: '123 Innovation Drive',
      city: 'San Francisco',
      state: 'CA',
      zip_code: '94102',
      timezone: 'America/Los_Angeles',
      owner_first_name: 'Rio',
      owner_last_name: 'Allen',
      owner_email: 'rio@dropfly.ai',
      owner_phone: '+1-424-351-9304',
      plan_type: 'enterprise',
      subscription_status: 'active',
      vapi_assistant_id: '8ab7e000-aea8-4141-a471-33133219a471',
      vapi_phone_number: '+14243519304',
      settings: JSON.stringify({
        webhook_url: 'https://voicefly-app.vercel.app/api/webhook/vapi',
        maya_job_id: 'general-receptionist',
        brand_personality: 'professional',
        lead_generation: true
      })
    }

    console.log('📝 Creating/updating business record...')
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .upsert(businessData, { onConflict: 'slug' })
      .select()

    if (businessError) {
      console.error('❌ Error creating business:', businessError)
      return false
    }

    console.log('✅ Business created:', business[0]?.name)

    // 2. Create lead generation services (will use the business UUID from created record)
    const businessId = business[0].id
    const services = [
      {
        business_id: businessId,
        name: 'Lead Qualification Call',
        description: 'AI-powered phone conversation to qualify potential customers',
        price_cents: 2500, // $25.00 per qualified lead
        duration_minutes: 10,
        category: 'Lead Generation',
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Demo Scheduling',
        description: 'Schedule product demonstrations with qualified prospects',
        price_cents: 5000, // $50.00 per scheduled demo
        duration_minutes: 15,
        category: 'Sales',
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Pricing Consultation',
        description: 'Detailed pricing discussion and quote generation',
        price_cents: 10000, // $100.00 per pricing consultation
        duration_minutes: 20,
        category: 'Sales',
        is_active: true
      },
      {
        business_id: businessId,
        name: 'Technical Integration Call',
        description: 'Technical discussion about platform integration',
        price_cents: 15000, // $150.00 per technical call
        duration_minutes: 30,
        category: 'Technical',
        is_active: true
      }
    ]

    console.log('📞 Creating lead generation services...')

    // Check if services already exist
    const { data: existingServices } = await supabase
      .from('services')
      .select('name')
      .eq('business_id', businessId)

    if (existingServices && existingServices.length > 0) {
      console.log('✅ Services already exist, skipping creation')
    } else {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .insert(services)
        .select()

      if (servicesError) {
        console.error('❌ Error creating services:', servicesError)
        return false
      }
      console.log('✅ Services created:', servicesData.length)
    }

    // 3. Create staff/team member (Maya as the AI agent)
    const staffData = {
      business_id: businessId,
      first_name: 'Maya',
      last_name: 'AI Assistant',
      email: 'maya@dropfly.ai',
      phone: '+14243519304',
      specialties: ['Lead Qualification', 'Demo Scheduling', 'Pricing Consultations'],
      is_active: true
    }

    console.log('🤖 Creating Maya AI staff record...')

    // Check if staff already exists
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('email')
      .eq('business_id', businessId)
      .eq('email', 'maya@dropfly.ai')

    if (existingStaff && existingStaff.length > 0) {
      console.log('✅ Maya AI assistant already exists, skipping creation')
    } else {
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .insert(staffData)
        .select()

      if (staffError) {
        console.error('❌ Error creating staff:', staffError)
        return false
      }
      console.log('✅ Maya AI assistant added to team')
    }

    // 4. Set up business hours (24/7 for AI)
    const businessHours = [
      { day_of_week: 0, open_time: '00:00', close_time: '23:59', is_closed: false }, // Sunday
      { day_of_week: 1, open_time: '00:00', close_time: '23:59', is_closed: false }, // Monday
      { day_of_week: 2, open_time: '00:00', close_time: '23:59', is_closed: false }, // Tuesday
      { day_of_week: 3, open_time: '00:00', close_time: '23:59', is_closed: false }, // Wednesday
      { day_of_week: 4, open_time: '00:00', close_time: '23:59', is_closed: false }, // Thursday
      { day_of_week: 5, open_time: '00:00', close_time: '23:59', is_closed: false }, // Friday
      { day_of_week: 6, open_time: '00:00', close_time: '23:59', is_closed: false }  // Saturday
    ].map(hours => ({ ...hours, business_id: businessId }))

    console.log('⏰ Setting up 24/7 business hours...')

    // Check if business hours already exist
    const { data: existingHours } = await supabase
      .from('business_hours')
      .select('day_of_week')
      .eq('business_id', businessId)

    if (existingHours && existingHours.length > 0) {
      console.log('✅ Business hours already configured, skipping creation')
    } else {
      const { error: hoursError } = await supabase
        .from('business_hours')
        .insert(businessHours)

      if (hoursError) {
        console.error('❌ Error setting business hours:', hoursError)
        return false
      }
      console.log('✅ 24/7 hours configured')
    }

    console.log('\n🎉 DropFly setup complete!')
    console.log('\n📊 Summary:')
    console.log(`• Business: DropFly (${businessId})`)
    console.log('• Slug: dropfly')
    console.log('• Phone: +1-424-351-9304')
    console.log('• VAPI Assistant ID: 8ab7e000-aea8-4141-a471-33133219a471')
    console.log('• Services: 4 lead generation services')
    console.log('• Staff: Maya AI Assistant')
    console.log('• Hours: 24/7 operation')
    console.log('\n🚀 Ready for lead generation!')

    return true

  } catch (error) {
    console.error('❌ Setup failed:', error)
    return false
  }
}

// Run setup
setupDropFlyBusiness()
  .then(success => {
    if (success) {
      console.log('\n✅ Setup completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Setup failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('❌ Setup crashed:', error)
    process.exit(1)
  })
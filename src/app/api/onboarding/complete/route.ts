import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { provisionVoiceAI, ProvisioningInput } from '@/lib/voice-ai-provisioning'
import { validateBusinessAccess } from '@/lib/api-auth'

// Map use cases to maya job IDs
const USE_CASE_TO_MAYA_JOB: Record<string, string> = {
  'lead-qualification': 'business-lead-qualifier',
  'appointment-booking': 'appointment-scheduler',
  'customer-service': 'customer-service-assistant',
  'sales-follow-up': 'sales-follow-up-agent'
}

// Map business types to maya job IDs (fallback)
const BUSINESS_TYPE_TO_MAYA_JOB: Record<string, string> = {
  'saas': 'business-lead-qualifier',
  'ecommerce': 'customer-service-assistant',
  'healthcare': 'medical-scheduler',
  'finance': 'business-lead-qualifier',
  'realestate': 'real-estate-assistant',
  'education': 'appointment-scheduler',
  'beauty': 'beauty-salon-assistant',
  'spa': 'spa-wellness-assistant',
  'salon': 'hair-salon-coordinator',
  'dental': 'dental-coordinator',
  'fitness': 'fitness-coordinator',
  'other': 'appointment-scheduler'
}

interface OnboardingData {
  businessId: string
  // Step 1: Use Case
  primaryUseCase: string
  businessType: string
  teamSize: string
  // Step 2: Voice Configuration
  voicePersonality: string
  voiceGender: string
  selectedVoice: string
  // Step 3: Integration
  crmSystem: string
  phoneSystem: string
  // Step 4: First Campaign
  campaignName: string
  campaignGoal: string
}

export async function POST(request: NextRequest) {
  try {
    const body: OnboardingData = await request.json()

    if (!body.businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Validate authentication and business access
    const authResult = await validateBusinessAccess(request, body.businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    console.log('📝 Processing onboarding completion for business:', body.businessId)

    // Determine maya_job_id based on use case or business type
    let mayaJobId = USE_CASE_TO_MAYA_JOB[body.primaryUseCase]
    if (!mayaJobId && body.businessType) {
      mayaJobId = BUSINESS_TYPE_TO_MAYA_JOB[body.businessType]
    }
    if (!mayaJobId) {
      mayaJobId = 'appointment-scheduler' // Default fallback
    }

    // Update business with onboarding data
    const { data: business, error: updateError } = await supabase
      .from('businesses')
      .update({
        maya_job_id: mayaJobId,
        business_type: body.businessType || 'general_business',
        // Store voice preferences in metadata (or dedicated columns if they exist)
        voice_settings: {
          personality: body.voicePersonality,
          gender: body.voiceGender,
          voiceId: body.selectedVoice
        },
        // CRM integration preference
        crm_integration: body.crmSystem,
        phone_system: body.phoneSystem,
        // Mark onboarding as complete
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', body.businessId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating business:', updateError)
      // Try without voice_settings if column doesn't exist
      const { data: businessRetry, error: retryError } = await supabase
        .from('businesses')
        .update({
          maya_job_id: mayaJobId,
          business_type: body.businessType || 'general_business',
          updated_at: new Date().toISOString()
        })
        .eq('id', body.businessId)
        .select()
        .single()

      if (retryError) {
        console.error('Retry error:', retryError)
        return NextResponse.json(
          { error: 'Failed to save onboarding data' },
          { status: 500 }
        )
      }
    }

    // Create first campaign if campaign name provided
    if (body.campaignName) {
      const { error: campaignError } = await supabase
        .from('voice_campaigns')
        .insert({
          business_id: body.businessId,
          name: body.campaignName,
          goal: body.campaignGoal,
          status: 'draft',
          created_at: new Date().toISOString()
        })

      if (campaignError) {
        console.warn('Failed to create campaign (non-critical):', campaignError)
        // Don't fail the whole request for this
      }
    }

    console.log('✅ Onboarding data saved for business:', body.businessId, 'with maya_job_id:', mayaJobId)

    // Get business name for provisioning
    const { data: businessData } = await supabase
      .from('businesses')
      .select('name, subscription_tier')
      .eq('id', body.businessId)
      .single()

    // Trigger Voice AI provisioning (agent + phone)
    let provisioningResult = null
    if (businessData) {
      console.log('🤖 Starting Voice AI provisioning...')

      const provisioningInput: ProvisioningInput = {
        businessId: body.businessId,
        businessName: businessData.name,
        mayaJobId: mayaJobId,
        subscriptionTier: businessData.subscription_tier || 'trial',
        selectedVoice: body.selectedVoice
      }

      try {
        provisioningResult = await provisionVoiceAI(provisioningInput)

        if (provisioningResult.success) {
          console.log('✅ Voice AI provisioned:', provisioningResult.phoneNumber)
        } else {
          console.warn('⚠️ Voice AI provisioning failed:', provisioningResult.error)
          // Don't fail onboarding - user can provision later from dashboard
        }
      } catch (provisionError) {
        console.error('Voice AI provisioning error:', provisionError)
        // Don't fail onboarding - user can provision later from dashboard
      }
    }

    console.log('✅ Onboarding completed for business:', body.businessId)

    return NextResponse.json({
      success: true,
      businessId: body.businessId,
      mayaJobId: mayaJobId,
      voiceAI: provisioningResult ? {
        provisioned: provisioningResult.success,
        agentId: provisioningResult.agentId,
        phoneNumber: provisioningResult.phoneNumber,
        error: provisioningResult.error
      } : null,
      message: 'Onboarding completed successfully'
    })

  } catch (error) {
    console.error('Onboarding completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

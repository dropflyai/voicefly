import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { provisionVoiceAI, checkProvisioningStatus, ProvisioningInput } from '@/lib/voice-ai-provisioning'
import { validateBusinessAccess } from '@/lib/api-auth'

/**
 * POST /api/voice-ai/provision
 * Provision voice AI (agent + phone) for a business
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Validate authentication and business access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    console.log(`Provisioning request for business: ${businessId}`)

    // Check if already provisioned
    const status = await checkProvisioningStatus(businessId)
    if (status.provisioned) {
      return NextResponse.json({
        success: true,
        alreadyProvisioned: true,
        agentId: status.agentId,
        phoneNumber: status.phoneNumber,
        message: 'Voice AI already provisioned for this business'
      })
    }

    // Get business data
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (fetchError || !business) {
      console.error('Business not found:', fetchError)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Prepare provisioning input
    const input: ProvisioningInput = {
      businessId: business.id,
      businessName: business.name,
      mayaJobId: business.maya_job_id || 'general-receptionist',
      subscriptionTier: business.subscription_tier || 'trial',
      brandPersonality: business.brand_personality,
      businessDescription: business.business_description,
      uniqueSellingPoints: business.unique_selling_points,
      targetCustomer: business.target_customer,
      priceRange: business.price_range,
      selectedVoice: body.selectedVoice // Can be passed from frontend
    }

    // Provision voice AI
    const result = await provisionVoiceAI(input)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          agentId: result.agentId // May have agent but no phone
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      agentId: result.agentId,
      agentName: result.agentName,
      phoneNumber: result.phoneNumber,
      phoneId: result.phoneId,
      message: 'Voice AI provisioned successfully'
    })

  } catch (error) {
    console.error('Provisioning API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/voice-ai/provision?businessId=xxx
 * Check provisioning status for a business
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Validate authentication and business access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: authResult.error === 'Access denied to this business' ? 403 : 401 }
      )
    }

    const status = await checkProvisioningStatus(businessId)

    // Get more details if provisioned
    if (status.provisioned) {
      const { data: business } = await supabase
        .from('businesses')
        .select('agent_id, agent_type, phone_number, maya_job_id, voice_ai_provisioned_at')
        .eq('id', businessId)
        .single()

      return NextResponse.json({
        provisioned: true,
        agentId: status.agentId,
        phoneNumber: status.phoneNumber,
        agentType: business?.agent_type,
        mayaJobId: business?.maya_job_id,
        provisionedAt: business?.voice_ai_provisioned_at
      })
    }

    return NextResponse.json({
      provisioned: false
    })

  } catch (error) {
    console.error('Provisioning status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

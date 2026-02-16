import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateAuth, validateBusinessAccess, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  // Authentication check - SECURITY CRITICAL
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(request, 'standard', authResult.user.id)
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit.result)
  }

  try {
    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')
    let businessId = searchParams.get('businessId') || authResult.user.businessId

    // Validate business access if specific businessId provided
    if (businessId !== authResult.user.businessId) {
      const accessResult = await validateBusinessAccess(request, businessId)
      if (!accessResult.success) {
        return NextResponse.json(
          { error: 'Access denied to this business' },
          { status: 403 }
        )
      }
    }

    let query = supabase
      .from('voice_ai_calls')
      .select(`
        *,
        leads(company_name, contact_name),
        voice_campaigns(name)
      `)
      .eq('business_id', businessId)  // Filter by business ID for multi-tenant security
      .order('created_at', { ascending: false })

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id)
    }

    const { data: calls, error } = await query

    if (error) {
      console.error('Error fetching voice calls:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ calls })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Authentication check - SECURITY CRITICAL
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Rate limit check
  const rateLimit = await checkRateLimit(request, 'standard', authResult.user.id)
  if (!rateLimit.allowed) {
    return rateLimitedResponse(rateLimit.result)
  }

  try {
    const body = await request.json()
    const { campaign_id, lead_id, vapi_call_id, business_id } = body

    // Use authenticated user's business if not provided
    const targetBusinessId = business_id || authResult.user.businessId

    // Validate business access if specific business_id provided
    if (business_id && business_id !== authResult.user.businessId) {
      const accessResult = await validateBusinessAccess(request, business_id)
      if (!accessResult.success) {
        return NextResponse.json(
          { error: 'Access denied to this business' },
          { status: 403 }
        )
      }
    }

    const { data: call, error } = await supabase
      .from('voice_ai_calls')
      .insert([
        {
          business_id: targetBusinessId,  // Include business_id for multi-tenant security
          campaign_id,
          lead_id,
          vapi_call_id,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating voice call:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ call })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateAuth, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'
import { staffCreateSchema, validate } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimit = await checkRateLimit(request, 'standard')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    // Validate authentication
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id') ||
                           searchParams.get('businessId') ||
                           searchParams.get('business_id') ||
                           authResult.user.businessId

    // Verify user has access to this business
    if (!authResult.user.businessIds.includes(organization_id)) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .order('first_name')

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const rateLimit = await checkRateLimit(request, 'standard')
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.result)
    }

    // Validate authentication
    const authResult = await validateAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = validate(staffCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const {
      organization_id,
      businessId,
      first_name,
      last_name,
      email,
      phone,
      role,
      specialties,
      bio,
      active
    } = validation.data

    // Use provided business ID or fall back to user's primary
    const targetBusinessId = organization_id || businessId || authResult.user.businessId

    // Verify user has access to this business
    if (!authResult.user.businessIds.includes(targetBusinessId)) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    const { data: staffMember, error } = await supabase
      .from('staff')
      .insert([
        {
          organization_id: targetBusinessId,
          first_name,
          last_name,
          email,
          phone,
          role,
          specialties,
          bio,
          is_active: active
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating staff member:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ staff: staffMember })
  } catch (error) {
    console.error('Staff creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

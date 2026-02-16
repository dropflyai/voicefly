import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateBusinessAccess } from '@/lib/api-auth'

interface RouteParams {
  params: Promise<{ businessId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params

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

    // Fetch business data with all VAPI-related fields
    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        email,
        phone,
        business_type,
        subscription_tier,
        subscription_status,
        maya_job_id,
        agent_id,
        agent_type,
        phone_number,
        brand_personality,
        business_description,
        unique_selling_points,
        target_customer,
        price_range,
        owner_first_name,
        owner_last_name,
        created_at,
        updated_at
      `)
      .eq('id', businessId)
      .single()

    if (error) {
      console.error('Error fetching business:', error)
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Business API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessId } = await params
    const body = await request.json()

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

    // Allowed fields that can be updated
    const allowedFields = [
      'name',
      'email',
      'phone',
      'business_type',
      'maya_job_id',
      'agent_id',
      'agent_type',
      'phone_number',
      'brand_personality',
      'business_description',
      'unique_selling_points',
      'target_customer',
      'price_range',
      'owner_first_name',
      'owner_last_name'
    ]

    // Filter to only allowed fields
    const updateData: Record<string, any> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: business, error } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', businessId)
      .select()
      .single()

    if (error) {
      console.error('Error updating business:', error)
      return NextResponse.json(
        { error: 'Failed to update business' },
        { status: 500 }
      )
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Business update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

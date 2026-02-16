import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { validateAuth, getBusinessIdFromRequest, checkRateLimit, rateLimitedResponse } from '@/lib/api-auth'
import { leadCreateSchema, validate } from '@/lib/validations'

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

    // Get businessId from query param or use primary business
    const url = new URL(request.url)
    const businessId = url.searchParams.get('businessId') || authResult.user.businessId

    // Verify user has access to this business
    if (!authResult.user.businessIds.includes(businessId)) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    // Parse query parameters for filtering
    const status = url.searchParams.get('status')
    const source = url.searchParams.get('source')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (source) {
      query = query.eq('source', source)
    }

    const { data: leads, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      leads,
      total: count,
      limit,
      offset
    })
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
    const validation = validate(leadCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const {
      businessId,
      company_name,
      contact_name,
      first_name,
      last_name,
      email,
      phone,
      website,
      industry,
      company_size,
      source,
      notes,
      status
    } = validation.data

    // Use provided businessId or user's primary business
    const targetBusinessId = businessId || authResult.user.businessId

    // Verify user has access to this business
    if (!authResult.user.businessIds.includes(targetBusinessId)) {
      return NextResponse.json(
        { error: 'Access denied to this business' },
        { status: 403 }
      )
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([
        {
          business_id: targetBusinessId,
          user_id: authResult.user.id,
          company_name: company_name || null,
          contact_name: contact_name || (first_name && last_name ? `${first_name} ${last_name}` : null),
          first_name: first_name || null,
          last_name: last_name || null,
          email,
          phone,
          website,
          industry,
          company_size,
          source,
          notes,
          status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('is_active', true)
      .order('category')
      .order('name')

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      name,
      description,
      duration_minutes,
      price_cents,
      category,
      industry_type
    } = body

    const { data: service, error } = await supabase
      .from('services')
      .insert([
        {
          organization_id,
          name,
          description,
          duration_minutes,
          price_cents,
          category,
          industry_type,
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error('Service creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
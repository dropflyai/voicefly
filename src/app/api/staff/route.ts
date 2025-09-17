import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organization_id = searchParams.get('organization_id')

    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
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
    const body = await request.json()
    const {
      organization_id,
      first_name,
      last_name,
      email,
      phone,
      role,
      specialties,
      license_number,
      availability_hours
    } = body

    const { data: staffMember, error } = await supabase
      .from('staff')
      .insert([
        {
          organization_id,
          first_name,
          last_name,
          email,
          phone,
          role,
          specialties,
          license_number,
          availability_hours,
          is_active: true
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
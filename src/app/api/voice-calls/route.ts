import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const campaign_id = searchParams.get('campaign_id')

    let query = supabase
      .from('voice_calls')
      .select(`
        *,
        leads(company_name, contact_name),
        voice_campaigns(name)
      `)
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
  try {
    const body = await request.json()
    const { campaign_id, lead_id, vapi_call_id } = body

    const { data: call, error } = await supabase
      .from('voice_calls')
      .insert([
        {
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
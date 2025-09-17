import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: campaigns, error } = await supabase
      .from('voice_campaigns')
      .select(`
        *,
        voice_calls(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, script_template, voice_settings } = body

    // TODO: Get user_id from authentication
    const user_id = '00000000-0000-0000-0000-000000000000' // Placeholder

    const { data: campaign, error } = await supabase
      .from('voice_campaigns')
      .insert([
        {
          user_id,
          name,
          description,
          script_template,
          voice_settings,
          status: 'draft'
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { ResearchAPI } from '@/lib/research-api'

export const dynamic = 'force-dynamic'

// Add note to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const body = await request.json()
    const { business_id, content, title, note_type, research_query, research_mode } = body

    if (!business_id || !content) {
      return NextResponse.json(
        { error: 'business_id and content are required' },
        { status: 400 }
      )
    }

    const note = await ResearchAPI.addLeadNote({
      business_id,
      lead_id: leadId,
      content,
      title: title || 'Research Note',
      note_type: note_type || 'research',
      research_query,
      research_mode
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Failed to add note' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      note
    })
  } catch (error) {
    console.error('Error adding lead note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get notes for lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const notes = await ResearchAPI.getLeadNotes(leadId)

    return NextResponse.json({
      notes,
      count: notes.length
    })
  } catch (error) {
    console.error('Error fetching lead notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

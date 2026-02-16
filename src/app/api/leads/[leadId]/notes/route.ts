import { NextRequest, NextResponse } from 'next/server'
import { ResearchAPI } from '@/lib/research-api'
import { validateAuth, validateBusinessAccess } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// Add note to lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  // Authentication check - SECURITY CRITICAL
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const { leadId } = await params
    const body = await request.json()
    const { business_id, content, title, note_type, research_query, research_mode } = body

    // Use authenticated user's business if not provided
    const targetBusinessId = business_id || authResult.user.businessId

    // Validate business access if a specific business_id was provided
    if (business_id && business_id !== authResult.user.businessId) {
      const accessResult = await validateBusinessAccess(request, business_id)
      if (!accessResult.success) {
        return NextResponse.json(
          { error: 'Access denied to this business' },
          { status: 403 }
        )
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    const note = await ResearchAPI.addLeadNote({
      business_id: targetBusinessId,
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
  // Authentication check - SECURITY CRITICAL
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const { leadId } = await params
    // Note: In production, you should verify the lead belongs to the user's business
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

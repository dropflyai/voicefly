import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { agentRegistry } from '@/lib/agents/agent-registry'
import { AgentEvent } from '@/lib/agents/types'

/**
 * POST /api/agents/trigger
 * Manually trigger an agent execution
 */
export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const businessId = authResult.user.businessId
    const body = await request.json()
    const { agentId, data } = body

    if (!agentId) {
      return NextResponse.json(
        { error: 'agentId is required' },
        { status: 400 }
      )
    }

    // Validate agent exists
    const agent = agentRegistry.getAgent(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: `Agent '${agentId}' not found` },
        { status: 404 }
      )
    }

    if (!agent.config.enabled) {
      return NextResponse.json(
        { error: `Agent '${agentId}' is disabled` },
        { status: 400 }
      )
    }

    // Execute the agent
    const result = await agentRegistry.executeAgent(
      agentId,
      businessId,
      'manual',
      data
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Agent execution failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: result.success,
      executionId: result.executionId,
      agentId: result.agentId,
      duration: result.duration,
      insights: result.insights || [],
      actions: result.actions || [],
      alerts: result.alerts || [],
      error: result.error,
    })
  } catch (error) {
    console.error('Error triggering agent:', error)
    return NextResponse.json(
      { error: 'Failed to trigger agent' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agents/trigger
 * Get available agents that can be triggered
 */
export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request)
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: authResult.error || 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const agents = agentRegistry.getEnabledAgents().map((agent) => ({
      id: agent.config.id,
      name: agent.config.name,
      description: agent.config.description,
      cluster: agent.config.cluster,
      triggers: agent.config.triggers?.map((t) => t.event) || [],
      requiredData: getRequiredData(agent.config.id),
    }))

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error getting agents:', error)
    return NextResponse.json(
      { error: 'Failed to get agents' },
      { status: 500 }
    )
  }
}

/**
 * Get required data schema for manual triggering
 */
function getRequiredData(agentId: string): Record<string, string> {
  switch (agentId) {
    case 'call-intelligence':
      return { callId: 'string (required)' }
    case 'lead-qualification':
      return { leadId: 'string (optional - batch if not provided)' }
    case 'customer-retention':
      return { customerId: 'string (optional - daily analysis if not provided)' }
    case 'appointment-recovery':
      return { appointmentId: 'string (optional - slot optimization if not provided)' }
    case 'revenue-intelligence':
      return {} // No data required, runs full analysis
    default:
      return {}
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { validateAuth } from '@/lib/api-auth'
import { agentRegistry } from '@/lib/agents/agent-registry'
import { mayaPrime } from '@/lib/agents/maya-prime'

/**
 * GET /api/agents/status
 * Returns overall agent system status and health
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
    const businessId = authResult.user.businessId

    // Get agent status summary
    const statusSummary = agentRegistry.getStatusSummary()

    // Get health status
    const healthStatus = await agentRegistry.getHealthStatus(businessId)

    // Get Maya Prime state
    const orchestratorState = mayaPrime.getState()

    // Get all agents with their configs
    const agents = agentRegistry.getAllAgents().map((agent) => ({
      id: agent.config.id,
      name: agent.config.name,
      description: agent.config.description,
      cluster: agent.config.cluster,
      enabled: agent.config.enabled,
      status: agent.status,
      lastExecution: agent.lastExecution,
      executionCount: agent.executionCount,
      errorCount: agent.errorCount,
      errorRate: agent.executionCount > 0
        ? Math.round((agent.errorCount / agent.executionCount) * 100)
        : 0,
    }))

    // Get business health metrics
    const businessHealth = await mayaPrime.calculateBusinessHealth(businessId)

    return NextResponse.json({
      status: 'operational',
      summary: statusSummary,
      health: healthStatus,
      businessHealth,
      orchestrator: {
        isRunning: orchestratorState.isRunning,
        lastHeartbeat: orchestratorState.lastHeartbeat,
        activeAgents: orchestratorState.activeAgents,
        queuedTasks: orchestratorState.queuedTasks,
      },
      agents,
    })
  } catch (error) {
    console.error('Error getting agent status:', error)
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    )
  }
}

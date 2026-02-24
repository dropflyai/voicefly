/**
 * Automation Rules API
 *
 * CRUD operations for user-defined automation rules.
 * GET  - List rules (and optionally templates)
 * POST - Create rule (or enable from template)
 * PUT  - Update rule
 * DELETE - Delete rule
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { RULE_TEMPLATES, getTemplateById } from '@/lib/automation/rule-templates'
import { TRIGGER_EVENTS, EVENT_FIELDS, ACTION_TYPES } from '@/lib/automation/automation-engine'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    const includeTemplates = request.nextUrl.searchParams.get('templates') === 'true'
    const includeLogs = request.nextUrl.searchParams.get('logs') === 'true'

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch rules for this business
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response: Record<string, any> = {
      rules: rules || [],
    }

    // Include templates if requested
    if (includeTemplates) {
      // Mark which templates are already enabled
      const enabledTemplateIds = (rules || [])
        .filter(r => r.template_id)
        .map(r => r.template_id)

      response.templates = RULE_TEMPLATES.map(t => ({
        ...t,
        isEnabled: enabledTemplateIds.includes(t.id),
      }))
    }

    // Include recent execution logs if requested
    if (includeLogs) {
      const { data: logs } = await supabase
        .from('automation_rule_logs')
        .select('*')
        .eq('business_id', businessId)
        .order('executed_at', { ascending: false })
        .limit(50)

      response.logs = logs || []
    }

    // Include schema info for the rule builder UI
    response.schema = {
      triggerEvents: TRIGGER_EVENTS,
      eventFields: EVENT_FIELDS,
      actionTypes: ACTION_TYPES,
    }

    return NextResponse.json(response)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const businessId = body.businessId

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If creating from a template
    if (body.templateId) {
      const template = getTemplateById(body.templateId)
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }

      // Check if already enabled
      const { data: existing } = await supabase
        .from('automation_rules')
        .select('id')
        .eq('business_id', businessId)
        .eq('template_id', body.templateId)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Template already enabled' }, { status: 409 })
      }

      const { data: rule, error } = await supabase
        .from('automation_rules')
        .insert({
          business_id: businessId,
          name: template.name,
          description: template.description,
          trigger_event: template.triggerEvent,
          conditions: template.conditions,
          actions: body.actions || template.actions, // Allow overriding actions (e.g., custom message)
          is_active: true,
          is_template: true,
          template_id: template.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ rule })
    }

    // Creating a custom rule
    if (!body.name || !body.triggerEvent) {
      return NextResponse.json({ error: 'name and triggerEvent required' }, { status: 400 })
    }

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert({
        business_id: businessId,
        name: body.name,
        description: body.description,
        trigger_event: body.triggerEvent,
        conditions: body.conditions || [],
        actions: body.actions || [],
        is_active: body.isActive !== false,
        is_template: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rule })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { ruleId, businessId, ...updates } = body

    if (!ruleId || !businessId) {
      return NextResponse.json({ error: 'ruleId and businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build update object - only include fields that were provided
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.triggerEvent !== undefined) updateData.trigger_event = updates.triggerEvent
    if (updates.conditions !== undefined) updateData.conditions = updates.conditions
    if (updates.actions !== undefined) updateData.actions = updates.actions
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update(updateData)
      .eq('id', ruleId)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rule })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ruleId = request.nextUrl.searchParams.get('ruleId')
    const businessId = request.nextUrl.searchParams.get('businessId')

    if (!ruleId || !businessId) {
      return NextResponse.json({ error: 'ruleId and businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId)
      .eq('business_id', businessId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

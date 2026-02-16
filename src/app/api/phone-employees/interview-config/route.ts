/**
 * Interview Config API
 *
 * POST /api/phone-employees/interview-config
 *
 * Returns a VAPI assistant configuration for conducting
 * a voice interview to gather business info for employee setup.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

type JobType = 'receptionist' | 'order-taker' | 'personal-assistant'

const VALID_JOB_TYPES: JobType[] = ['receptionist', 'order-taker', 'personal-assistant']

// ============================================
// INTERVIEW PROMPT BUILDERS
// ============================================

function buildReceptionistInterviewPrompt(businessName: string, employeeName?: string): string {
  return `You are a friendly interviewer helping set up a phone receptionist${employeeName ? ` named ${employeeName}` : ''} for ${businessName}. Have a natural 2-3 minute conversation to learn what the receptionist needs to know.

## What to Ask About (in conversational order)
1. What the business does and what services/appointments they offer
2. What are the most common questions callers ask (hours, pricing, location, etc.)
3. Their business hours (which days, open/close times)
4. When calls should be transferred to a real person vs handled by the receptionist
5. How messages should be taken when someone is unavailable

## Conversation Rules
- Ask ONE question at a time, then listen
- Ask natural follow-up questions based on their answers
- Be warm and encouraging ("Great!", "That's helpful")
- Don't read from a script - have a real conversation
- If they give short answers, probe gently for more detail
- Keep the whole conversation under 3 minutes

## Wrapping Up
When you have enough information about their services, hours, and caller handling, say something like:
"Perfect, I think I have everything I need to set up your receptionist. Thanks for walking me through that!"
Then end the conversation naturally.`
}

function buildOrderTakerInterviewPrompt(businessName: string, employeeName?: string): string {
  return `You are a friendly interviewer helping set up a phone order-taker${employeeName ? ` named ${employeeName}` : ''} for ${businessName}. Have a natural 2-3 minute conversation to learn about their menu and ordering process.

## What to Ask About (in conversational order)
1. What kind of food/products they sell (cuisine type, specialties)
2. Their main menu categories and a few popular items with prices
3. Whether they offer pickup, delivery, or both - and estimated wait times
4. Any delivery radius or minimum order amounts
5. What they'd like to upsell (combos, drinks, sides, desserts)
6. Their hours of operation

## Conversation Rules
- Ask ONE question at a time, then listen
- When they mention menu items, ask about prices if not given
- Be enthusiastic about their food ("That sounds delicious!")
- Ask natural follow-ups ("And what about sides or drinks?")
- Don't try to get every single menu item - a representative sample is fine
- Keep the whole conversation under 3 minutes

## Wrapping Up
When you have a good picture of their menu and ordering process, say:
"Awesome, that gives me a great picture of your menu and how orders work. Thanks so much!"
Then end the conversation naturally.`
}

function buildPersonalAssistantInterviewPrompt(businessName: string, employeeName?: string): string {
  return `You are a friendly interviewer helping set up a personal assistant${employeeName ? ` named ${employeeName}` : ''} for someone at ${businessName}. Have a natural 2-3 minute conversation to learn about their scheduling needs.

## What to Ask About (in conversational order)
1. Their name (the person the assistant will work for)
2. Their typical work schedule and availability
3. How much advance notice they need for meetings/appointments
4. Whether there are VIP contacts who should always get through
5. What kinds of things callers typically need (meetings, messages, information)
6. Any scheduling preferences (morning person, buffer time between meetings, etc.)

## Conversation Rules
- Ask ONE question at a time, then listen
- Be professional but personable
- Ask follow-ups when answers are vague ("Could you give me an example?")
- Don't overwhelm them with too many questions at once
- Keep the whole conversation under 3 minutes

## Wrapping Up
When you have enough information about their schedule and preferences, say:
"Great, I have everything I need to set up your personal assistant. Thanks for your time!"
Then end the conversation naturally.`
}

// ============================================
// ROUTE HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, jobType, employeeName } = body

    // Validate required fields
    if (!businessId || !jobType) {
      return NextResponse.json(
        { error: 'businessId and jobType are required' },
        { status: 400 }
      )
    }

    if (!VALID_JOB_TYPES.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid jobType. Must be one of: ${VALID_JOB_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Auth check
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch business name
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single()

    const businessName = business?.name || 'your business'

    // Build the interview system prompt
    let systemPrompt: string
    let firstMessage: string

    switch (jobType) {
      case 'receptionist':
        systemPrompt = buildReceptionistInterviewPrompt(businessName, employeeName)
        firstMessage = `Hi there! I'm going to help you set up a phone receptionist for ${businessName}. I just have a few questions about your business so we can configure everything perfectly. First off, can you tell me a bit about what ${businessName} does and what services you offer?`
        break
      case 'order-taker':
        systemPrompt = buildOrderTakerInterviewPrompt(businessName, employeeName)
        firstMessage = `Hey! I'm here to help you set up a phone order-taker for ${businessName}. I'll ask a few questions about your menu and how orders work. So to start, what kind of food or products does ${businessName} offer?`
        break
      case 'personal-assistant':
        systemPrompt = buildPersonalAssistantInterviewPrompt(businessName, employeeName)
        firstMessage = `Hi! I'm going to help set up your personal assistant. I just need to learn a bit about your schedule and preferences. To start, can you tell me your name and what your typical work schedule looks like?`
        break
      default:
        return NextResponse.json({ error: 'Invalid job type' }, { status: 400 })
    }

    // Build the VAPI assistant config (transient - used inline with vapi.start())
    const assistantConfig = {
      name: `Interview - ${jobType}`.substring(0, 40),
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
      voice: {
        provider: '11labs',
        voiceId: 'sarah',
        stability: 0.7,
        similarityBoost: 0.8,
      },
      firstMessage,
      maxDurationSeconds: 300, // 5 minute max
      endCallMessage: 'Thanks for chatting! Your employee configuration is being generated now.',
      silenceTimeoutSeconds: 30,
      responseDelaySeconds: 0.5,
      metadata: {
        type: 'onboarding-interview',
        businessId,
        jobType,
      },
    }

    return NextResponse.json({
      success: true,
      assistantConfig,
    })
  } catch (error: any) {
    console.error('Interview config error:', error)
    return NextResponse.json(
      { error: 'Failed to generate interview configuration' },
      { status: 500 }
    )
  }
}

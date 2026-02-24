/**
 * Google Reviews Settings API
 *
 * GET  /api/settings/google-reviews?businessId=xxx
 *   Returns google_reviews config from businesses.settings + stats
 *
 * POST /api/settings/google-reviews
 *   Saves google_reviews config to businesses.settings
 *   Body: { businessId, enabled, placeId?, googleMapsUrl?, messageTemplate?, delayMinutes?, applyToInteractions? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import { GoogleReviewsManager, GoogleReviewsConfig } from '@/lib/google-reviews-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Google Place ID format: ChI followed by alphanumeric characters, typically 20-30 chars
const PLACE_ID_REGEX = /^ChIJ[a-zA-Z0-9_-]{20,50}$/

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get('businessId')
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get config
    const config = await GoogleReviewsManager.getConfig(businessId)

    // Get stats
    const stats = await GoogleReviewsManager.getStats(businessId)

    return NextResponse.json({
      config: config || {
        enabled: false,
        placeId: null,
        googleMapsUrl: null,
        messageTemplate: null,
        delayMinutes: 30,
        applyToInteractions: ['orders', 'appointments'],
      },
      stats,
    })
  } catch (error: any) {
    console.error('[GoogleReviews API] GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, ...configFields } = body

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 })
    }

    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate placeId format if provided
    if (configFields.placeId && !PLACE_ID_REGEX.test(configFields.placeId)) {
      return NextResponse.json(
        { error: 'Invalid Google Place ID format. It should start with "ChIJ" followed by alphanumeric characters.' },
        { status: 400 }
      )
    }

    // Validate delayMinutes if provided
    if (configFields.delayMinutes !== undefined) {
      const delay = Number(configFields.delayMinutes)
      if (isNaN(delay) || delay < 0 || delay > 1440) {
        return NextResponse.json(
          { error: 'delayMinutes must be between 0 and 1440 (24 hours)' },
          { status: 400 }
        )
      }
    }

    // Validate applyToInteractions if provided
    const validInteractions = ['orders', 'appointments', 'all_calls']
    if (configFields.applyToInteractions) {
      const invalid = configFields.applyToInteractions.filter(
        (t: string) => !validInteractions.includes(t)
      )
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Invalid interaction types: ${invalid.join(', ')}. Valid: ${validInteractions.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build the config object
    const reviewConfig: GoogleReviewsConfig = {
      enabled: configFields.enabled ?? false,
      placeId: configFields.placeId || undefined,
      googleMapsUrl: configFields.googleMapsUrl || undefined,
      messageTemplate: configFields.messageTemplate || undefined,
      delayMinutes: configFields.delayMinutes ?? 30,
      applyToInteractions: configFields.applyToInteractions || ['orders', 'appointments'],
    }

    // Must have either placeId or googleMapsUrl if enabling
    if (reviewConfig.enabled && !reviewConfig.placeId && !reviewConfig.googleMapsUrl) {
      return NextResponse.json(
        { error: 'Either placeId or googleMapsUrl is required when enabling Google Reviews' },
        { status: 400 }
      )
    }

    // Get existing settings
    const { data: business } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    const currentSettings = business?.settings || {}

    // Update settings with google_reviews config
    const { error } = await supabase
      .from('businesses')
      .update({
        settings: {
          ...currentSettings,
          google_reviews: reviewConfig,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (error) {
      console.error('[GoogleReviews API] Failed to save settings:', error)
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      config: reviewConfig,
      message: reviewConfig.enabled
        ? 'Google Reviews enabled'
        : 'Google Reviews settings saved',
    })
  } catch (error: any) {
    console.error('[GoogleReviews API] POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

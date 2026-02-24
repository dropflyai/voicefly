/**
 * Calendly OAuth Callback
 *
 * GET /api/integrations/calendly/oauth/callback?code=xxx&state=xxx
 *
 * Calendly redirects here after the user authorizes.
 * Exchanges the authorization code for an access token,
 * fetches the user profile, and stores the credentials.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  const errorParam = request.nextUrl.searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const settingsUrl = `${appUrl}/dashboard/settings?tab=integrations`

  // Helper: build redirect URL based on where the OAuth flow was initiated
  const buildRedirect = (from: string | undefined, params: string) => {
    if (from === 'onboarding') {
      return `${appUrl}/onboarding?${params}`
    }
    return `${settingsUrl}&${params}`
  }

  // Handle user denying authorization
  if (errorParam) {
    console.error('[Calendly OAuth] Authorization denied:', errorParam)
    // Try to extract `from` even on error, since state may still be present
    let from: string | undefined
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
        from = decoded.from
      } catch { /* ignore */ }
    }
    return NextResponse.redirect(buildRedirect(from, 'calendly_error=authorization_denied'))
  }

  if (!code || !state) {
    return NextResponse.redirect(`${settingsUrl}&calendly_error=missing_params`)
  }

  // Decode state to get businessId and origin page
  let businessId: string
  let from: string | undefined
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    businessId = decoded.businessId
    from = decoded.from
    if (!businessId) throw new Error('No businessId in state')
  } catch {
    return NextResponse.redirect(`${settingsUrl}&calendly_error=invalid_state`)
  }

  const clientId = process.env.CALENDLY_CLIENT_ID
  const clientSecret = process.env.CALENDLY_CLIENT_SECRET
  const redirectUri = `${appUrl}/api/integrations/calendly/oauth/callback`

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(buildRedirect(from, 'calendly_error=not_configured'))
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('[Calendly OAuth] Token exchange failed:', errorData)
      return NextResponse.redirect(buildRedirect(from, 'calendly_error=token_exchange_failed'))
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokenData

    // Fetch user profile to get userUri and name
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userResponse.ok) {
      console.error('[Calendly OAuth] Failed to fetch user profile')
      return NextResponse.redirect(buildRedirect(from, 'calendly_error=profile_fetch_failed'))
    }

    const userData = await userResponse.json()
    const userUri = userData.resource?.uri
    const userName = userData.resource?.name
    const userEmail = userData.resource?.email

    // Fetch event types
    let eventTypes: Array<{ uri: string; name: string; duration: number; slug: string }> = []
    if (userUri) {
      const eventTypesResponse = await fetch(
        `https://api.calendly.com/event_types?user=${encodeURIComponent(userUri)}&active=true`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      if (eventTypesResponse.ok) {
        const eventTypesData = await eventTypesResponse.json()
        eventTypes = (eventTypesData.collection || []).map((et: any) => ({
          uri: et.uri,
          name: et.name,
          duration: et.duration,
          slug: et.slug,
        }))
      }
    }

    // Store in businesses.settings
    const { data: business } = await supabase
      .from('businesses')
      .select('settings')
      .eq('id', businessId)
      .single()

    const currentSettings = business?.settings || {}

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        settings: {
          ...currentSettings,
          calendar_provider: 'calendly',
          calendly_access_token: access_token,
          calendly_refresh_token: refresh_token,
          calendly_token_expires_at: expires_in
            ? new Date(Date.now() + expires_in * 1000).toISOString()
            : null,
          calendly_user_uri: userUri,
          calendly_user_name: userName,
          calendly_user_email: userEmail,
          calendly_event_type_uri: eventTypes[0]?.uri || currentSettings.calendly_event_type_uri || null,
          // Clear Google Calendar fields since only one provider at a time
          google_calendar_id: null,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('[Calendly OAuth] Failed to save settings:', updateError)
      return NextResponse.redirect(buildRedirect(from, 'calendly_error=save_failed'))
    }

    // Also record in business_integrations
    await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'calendly',
          status: 'connected',
          credentials: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expires_in
              ? new Date(Date.now() + expires_in * 1000).toISOString()
              : null,
          },
          config: {
            userUri,
            userName,
            userEmail,
            eventTypes,
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )

    console.log(`[Calendly OAuth] Connected for business ${businessId}: ${userEmail}`)

    return NextResponse.redirect(buildRedirect(from, 'calendly_connected=true'))
  } catch (error: any) {
    console.error('[Calendly OAuth] Unexpected error:', error)
    return NextResponse.redirect(buildRedirect(from, 'calendly_error=unexpected'))
  }
}

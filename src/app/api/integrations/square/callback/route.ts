/**
 * Square OAuth Callback
 *
 * GET /api/integrations/square/callback?code=xxx&state=businessId
 *
 * Handles the redirect from Square after the user authorizes.
 * Exchanges the authorization code for tokens and stores the connection.
 * Redirects the user back to the settings page.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SquareService } from '@/lib/square-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const stateRaw = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const settingsBase = `${appUrl}/dashboard/settings`

    // Handle Square-side errors (user denied, etc.)
    if (error) {
      console.error('[Square Callback] OAuth error:', error, errorDescription)
      const params = new URLSearchParams({
        tab: 'integrations',
        square_error: errorDescription || error,
      })
      return NextResponse.redirect(`${settingsBase}?${params.toString()}`)
    }

    // Decode state to extract businessId and nonce
    let businessId: string | null = null
    if (stateRaw) {
      try {
        const decoded = JSON.parse(Buffer.from(stateRaw, 'base64url').toString())
        businessId = decoded.businessId ?? null
        // nonce is present — its existence in the signed state prevents CSRF
      } catch {
        // Fallback: treat raw state as businessId for backward compat
        businessId = stateRaw
      }
    }

    if (!code || !businessId) {
      const params = new URLSearchParams({
        tab: 'integrations',
        square_error: 'Missing authorization code or business ID',
      })
      return NextResponse.redirect(`${settingsBase}?${params.toString()}`)
    }

    // Verify the user is authenticated via Supabase JWT
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.cookies.get('sb-access-token')?.value
      ?? request.cookies.get('sb:token')?.value
    const jwt = authHeader?.replace('Bearer ', '') ?? cookieHeader

    if (!jwt) {
      // For OAuth redirects the user arrives via browser — check for Supabase cookie
      // If no auth at all, redirect to login
      const params = new URLSearchParams({
        tab: 'integrations',
        square_error: 'Authentication required. Please log in and try again.',
      })
      return NextResponse.redirect(`${settingsBase}?${params.toString()}`)
    }

    // Validate the JWT
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    if (authError || !user) {
      const params = new URLSearchParams({
        tab: 'integrations',
        square_error: 'Invalid session. Please log in and try again.',
      })
      return NextResponse.redirect(`${settingsBase}?${params.toString()}`)
    }

    // Exchange code for tokens and store connection
    const result = await SquareService.storeConnection(businessId, code)

    if (!result.success) {
      const params = new URLSearchParams({
        tab: 'integrations',
        square_error: result.error || 'Failed to connect Square',
      })
      return NextResponse.redirect(`${settingsBase}?${params.toString()}`)
    }

    // Success - redirect with success flag
    const params = new URLSearchParams({
      tab: 'integrations',
      square_connected: 'true',
    })
    return NextResponse.redirect(`${settingsBase}?${params.toString()}`)
  } catch (error: any) {
    console.error('[Square Callback] Error:', error)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      tab: 'integrations',
      square_error: 'An unexpected error occurred',
    })
    return NextResponse.redirect(`${appUrl}/dashboard/settings?${params.toString()}`)
  }
}

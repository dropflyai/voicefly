/**
 * Calendly Integration Sync
 *
 * Pulls user profile and active event types from Calendly and returns
 * them in a format suitable for VoiceFly's appointment scheduler config.
 *
 * Uses Calendly v2 API:
 * GET /users/me
 * GET /event_types?user={userUri}&active=true
 */

const CALENDLY_API_BASE = 'https://api.calendly.com'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface CalendlySyncResult {
  eventTypes: {
    name: string
    duration: number        // minutes
    description?: string
    schedulingUrl: string
    color?: string
    poolingType?: string    // round_robin, collective, etc.
  }[]
  userName: string
  userEmail: string
  schedulingUrl: string    // user's main scheduling URL
}

// ---------------------------------------------------------------------------
// Calendly API response shapes (internal)
// ---------------------------------------------------------------------------

interface CalendlyUserResource {
  uri: string
  name: string
  email: string
  scheduling_url: string
}

interface CalendlyUserResponse {
  resource?: CalendlyUserResource
}

interface CalendlyEventTypeResource {
  name: string
  duration: number
  description_html?: string
  description_plain?: string
  scheduling_url: string
  color?: string
  pooling_type?: string
  active: boolean
}

interface CalendlyEventTypesResponse {
  collection?: CalendlyEventTypeResource[]
  pagination?: {
    count: number
    next_page?: string
  }
}

// ---------------------------------------------------------------------------
// Token validation
// ---------------------------------------------------------------------------

/**
 * Validate a Calendly personal access token by calling /users/me.
 */
export async function validateCalendlyToken(
  accessToken: string
): Promise<{ valid: boolean; userName?: string; email?: string; error?: string }> {
  try {
    const response = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 401) {
      return { valid: false, error: 'Invalid or expired access token' }
    }

    if (!response.ok) {
      return {
        valid: false,
        error: `Calendly API error (${response.status})`,
      }
    }

    const data: CalendlyUserResponse = await response.json()
    const resource = data.resource

    if (!resource) {
      return { valid: false, error: 'Unexpected response from Calendly' }
    }

    return {
      valid: true,
      userName: resource.name,
      email: resource.email,
    }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Failed to reach Calendly API' }
  }
}

// ---------------------------------------------------------------------------
// Main account sync
// ---------------------------------------------------------------------------

/**
 * Sync a Calendly account for a given access token.
 * Returns the user's profile and all active event types.
 */
export async function syncCalendlyAccount(
  accessToken: string
): Promise<CalendlySyncResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  // 1. Get the current user's profile
  const userResponse = await fetch(`${CALENDLY_API_BASE}/users/me`, { headers })

  if (!userResponse.ok) {
    throw new Error(
      `Failed to fetch Calendly user profile (${userResponse.status})`
    )
  }

  const userData: CalendlyUserResponse = await userResponse.json()
  const user = userData.resource

  if (!user) {
    throw new Error('Unexpected response from Calendly /users/me')
  }

  const userUri = user.uri
  const userName = user.name
  const userEmail = user.email
  const schedulingUrl = user.scheduling_url

  // 2. Get active event types for this user
  const eventTypesUrl =
    `${CALENDLY_API_BASE}/event_types` +
    `?user=${encodeURIComponent(userUri)}&active=true`

  const eventTypesResponse = await fetch(eventTypesUrl, { headers })

  if (!eventTypesResponse.ok) {
    throw new Error(
      `Failed to fetch Calendly event types (${eventTypesResponse.status})`
    )
  }

  const eventTypesData: CalendlyEventTypesResponse = await eventTypesResponse.json()
  const collection = eventTypesData.collection || []

  // 3. Map each event type to VoiceFly's format
  const eventTypes = collection.map((et) => ({
    name: et.name,
    duration: et.duration,
    ...(et.description_html || et.description_plain
      ? { description: et.description_html || et.description_plain }
      : {}),
    schedulingUrl: et.scheduling_url,
    ...(et.color ? { color: et.color } : {}),
    ...(et.pooling_type ? { poolingType: et.pooling_type } : {}),
  }))

  return {
    eventTypes,
    userName,
    userEmail,
    schedulingUrl,
  }
}

/**
 * HubSpot CRM Integration Service
 *
 * Provides methods to sync VoiceFly data with HubSpot CRM:
 * - Contact upsert by phone number
 * - Call engagement logging
 * - Deal creation from orders
 *
 * Uses @hubspot/api-client for all API interactions.
 * All methods are designed to fail gracefully -- HubSpot sync errors
 * should never block the primary call flow.
 */

import { Client } from '@hubspot/api-client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SyncLogEntry {
  entityType: string
  entityId?: string
  hubspotId?: string
  action: string
  status: 'success' | 'error' | 'skipped'
  errorDetails?: string
}

export class HubSpotService {
  /**
   * Get an authenticated HubSpot client for a business.
   * Returns null if no connection exists or connection is inactive.
   */
  static async getClient(businessId: string): Promise<Client | null> {
    try {
      const { data: connection, error } = await supabase
        .from('hubspot_connections')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_connected', true)
        .single()

      if (error || !connection) {
        return null
      }

      // Determine which token to use based on auth type
      let accessToken: string | undefined

      if (connection.auth_type === 'private_token' && connection.private_token) {
        accessToken = connection.private_token
      } else if (connection.auth_type === 'oauth' && connection.access_token) {
        // Check if OAuth token is expired
        if (connection.token_expires_at) {
          const expiresAt = new Date(connection.token_expires_at)
          const now = new Date()
          // Refresh if token expires within 5 minutes
          if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
            const refreshed = await this.refreshOAuthToken(businessId, connection.refresh_token)
            if (refreshed) {
              accessToken = refreshed
            } else {
              return null
            }
          } else {
            accessToken = connection.access_token
          }
        } else {
          accessToken = connection.access_token
        }
      }

      if (!accessToken) {
        return null
      }

      return new Client({ accessToken })
    } catch (error) {
      console.error(`[HubSpot] Failed to get client for business ${businessId}:`, error)
      return null
    }
  }

  /**
   * Check if a business has an active HubSpot connection.
   */
  static async getConnectionStatus(businessId: string): Promise<{
    connected: boolean
    portalId?: string
    settings?: {
      syncContacts: boolean
      syncCalls: boolean
      syncDeals: boolean
      createTasks: boolean
    }
  }> {
    try {
      const { data: connection, error } = await supabase
        .from('hubspot_connections')
        .select('is_connected, portal_id, sync_contacts, sync_calls, sync_deals, create_tasks')
        .eq('business_id', businessId)
        .single()

      if (error || !connection) {
        return { connected: false }
      }

      return {
        connected: connection.is_connected ?? false,
        portalId: connection.portal_id ?? undefined,
        settings: {
          syncContacts: connection.sync_contacts ?? true,
          syncCalls: connection.sync_calls ?? true,
          syncDeals: connection.sync_deals ?? true,
          createTasks: connection.create_tasks ?? true,
        },
      }
    } catch (error) {
      console.error(`[HubSpot] Failed to get connection status for business ${businessId}:`, error)
      return { connected: false }
    }
  }

  /**
   * Connect a business to HubSpot using a Private App Token.
   * Validates the token by fetching account info, then stores it.
   */
  static async connectWithToken(
    businessId: string,
    token: string
  ): Promise<{ success: boolean; portalId?: string; error?: string }> {
    try {
      // Validate the token by making a test API call
      const client = new Client({ accessToken: token })

      let portalId: string | undefined
      try {
        const accountInfo = await client.apiRequest({
          method: 'GET',
          path: '/account-info/v3/details',
        })
        const accountData = await accountInfo.json()
        portalId = accountData?.portalId?.toString()
      } catch (apiError: any) {
        console.error('[HubSpot] Token validation failed:', apiError?.message)
        return {
          success: false,
          error: 'Invalid token. Please check your HubSpot Private App token and ensure it has the required scopes.',
        }
      }

      // Upsert the connection record
      const { error: upsertError } = await supabase
        .from('hubspot_connections')
        .upsert(
          {
            business_id: businessId,
            auth_type: 'private_token',
            private_token: token,
            portal_id: portalId,
            is_connected: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'business_id' }
        )

      if (upsertError) {
        console.error('[HubSpot] Failed to store connection:', upsertError)
        return { success: false, error: 'Failed to save connection details.' }
      }

      await this.logSync(businessId, {
        entityType: 'connection',
        action: 'connect',
        status: 'success',
        hubspotId: portalId,
      })

      return { success: true, portalId }
    } catch (error: any) {
      console.error('[HubSpot] Connection error:', error)
      return { success: false, error: error.message || 'Failed to connect to HubSpot.' }
    }
  }

  /**
   * Verify an existing connection still works.
   */
  static async verifyConnection(businessId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const client = await this.getClient(businessId)
      if (!client) {
        return { success: false, error: 'No active HubSpot connection found.' }
      }

      // Test the connection with a simple API call
      const response = await client.apiRequest({
        method: 'GET',
        path: '/account-info/v3/details',
      })
      const data = await response.json()

      if (!data?.portalId) {
        return { success: false, error: 'Could not verify HubSpot account.' }
      }

      return { success: true }
    } catch (error: any) {
      console.error(`[HubSpot] Verification failed for business ${businessId}:`, error)
      return {
        success: false,
        error: error.message || 'HubSpot connection verification failed.',
      }
    }
  }

  /**
   * Upsert a contact in HubSpot by phone number.
   * Searches for an existing contact first; creates one if not found, updates if found.
   */
  static async upsertContact(
    businessId: string,
    contact: {
      phone: string
      firstName?: string
      lastName?: string
      email?: string
      company?: string
    }
  ): Promise<{ contactId?: string; error?: string }> {
    try {
      const client = await this.getClient(businessId)
      if (!client) {
        return { error: 'No active HubSpot connection.' }
      }

      // Check sync settings
      const status = await this.getConnectionStatus(businessId)
      if (!status.settings?.syncContacts) {
        return { error: 'Contact sync is disabled.' }
      }

      // Normalize phone number for searching
      const normalizedPhone = contact.phone.replace(/\D/g, '')

      // Search for existing contact by phone
      let existingContactId: string | undefined
      try {
        const searchResponse = await client.crm.contacts.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'phone',
                  operator: 'EQ' as any,
                  value: contact.phone,
                },
              ],
            },
          ],
          properties: ['phone', 'firstname', 'lastname', 'email', 'company'],
          limit: 1,
        })

        if (searchResponse.total > 0 && searchResponse.results.length > 0) {
          existingContactId = searchResponse.results[0].id
        }
      } catch (searchError) {
        // If phone search fails, try with normalized number
        try {
          const searchResponse2 = await client.crm.contacts.searchApi.doSearch({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'phone',
                    operator: 'EQ' as any,
                    value: normalizedPhone,
                  },
                ],
              },
            ],
            properties: ['phone', 'firstname', 'lastname', 'email', 'company'],
            limit: 1,
          })

          if (searchResponse2.total > 0 && searchResponse2.results.length > 0) {
            existingContactId = searchResponse2.results[0].id
          }
        } catch {
          // Search failed entirely, proceed to create
        }
      }

      // Build properties object (only include non-empty values)
      const properties: Record<string, string> = {
        phone: contact.phone,
      }
      if (contact.firstName) properties.firstname = contact.firstName
      if (contact.lastName) properties.lastname = contact.lastName
      if (contact.email) properties.email = contact.email
      if (contact.company) properties.company = contact.company

      if (existingContactId) {
        // Update existing contact
        try {
          await client.crm.contacts.basicApi.update(existingContactId, { properties })

          await this.logSync(businessId, {
            entityType: 'contact',
            entityId: contact.phone,
            hubspotId: existingContactId,
            action: 'update',
            status: 'success',
          })

          return { contactId: existingContactId }
        } catch (updateError: any) {
          await this.logSync(businessId, {
            entityType: 'contact',
            entityId: contact.phone,
            action: 'update',
            status: 'error',
            errorDetails: updateError.message,
          })
          return { contactId: existingContactId, error: updateError.message }
        }
      } else {
        // Create new contact
        try {
          const createResponse = await client.crm.contacts.basicApi.create({
            properties,
            associations: [],
          })

          await this.logSync(businessId, {
            entityType: 'contact',
            entityId: contact.phone,
            hubspotId: createResponse.id,
            action: 'create',
            status: 'success',
          })

          return { contactId: createResponse.id }
        } catch (createError: any) {
          await this.logSync(businessId, {
            entityType: 'contact',
            entityId: contact.phone,
            action: 'create',
            status: 'error',
            errorDetails: createError.message,
          })
          return { error: createError.message }
        }
      }
    } catch (error: any) {
      console.error(`[HubSpot] Contact upsert failed for business ${businessId}:`, error)
      return { error: error.message || 'Failed to sync contact with HubSpot.' }
    }
  }

  /**
   * Log a call as an engagement on a HubSpot contact.
   * Creates a Call object and associates it with the contact.
   */
  static async createCallEngagement(
    businessId: string,
    contactId: string,
    call: {
      duration: number
      transcript?: string
      outcome: string
      timestamp: Date
      callId: string
      callNotes?: string
    }
  ): Promise<{ engagementId?: string; error?: string }> {
    try {
      const client = await this.getClient(businessId)
      if (!client) {
        return { error: 'No active HubSpot connection.' }
      }

      // Check sync settings
      const status = await this.getConnectionStatus(businessId)
      if (!status.settings?.syncCalls) {
        return { error: 'Call sync is disabled.' }
      }

      // Map outcome to HubSpot disposition
      const dispositionMap: Record<string, string> = {
        completed: 'f240bbac-87c9-4f6e-bf70-924b57d47db7',  // Connected
        'no-answer': '73a0d17f-1163-4015-bdd5-ec830791da20',  // No answer
        busy: '9d9162e7-6cf3-4944-bf63-4dff82258764',  // Busy
        voicemail: 'a4c4c377-d246-4b32-a13b-75a56a4cd0ff',  // Left voicemail
        failed: 'b2cf5968-551e-4856-9783-52b3da59a7d0',  // Failed
      }

      // Build call body with transcript and notes
      const bodyParts: string[] = []
      if (call.callNotes) bodyParts.push(call.callNotes)
      if (call.transcript) bodyParts.push(`\n--- Transcript ---\n${call.transcript}`)
      const callBody = bodyParts.join('\n') || `AI call - ${call.outcome}`

      // Create the call object
      const callProperties: Record<string, string> = {
        hs_call_title: `VoiceFly Call - ${call.callId}`,
        hs_call_body: callBody,
        hs_call_duration: Math.round(call.duration * 1000).toString(), // HubSpot expects milliseconds
        hs_call_direction: 'INBOUND',
        hs_call_status: 'COMPLETED',
        hs_timestamp: call.timestamp.toISOString(),
      }

      const disposition = dispositionMap[call.outcome]
      if (disposition) {
        callProperties.hs_call_disposition = disposition
      }

      const createResponse = await client.crm.objects.calls.basicApi.create({
        properties: callProperties,
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED' as any,
                associationTypeId: 194, // callToContact
              },
            ],
          },
        ],
      })

      await this.logSync(businessId, {
        entityType: 'call',
        entityId: call.callId,
        hubspotId: createResponse.id,
        action: 'create',
        status: 'success',
      })

      return { engagementId: createResponse.id }
    } catch (error: any) {
      console.error(`[HubSpot] Call engagement creation failed for business ${businessId}:`, error)

      await this.logSync(businessId, {
        entityType: 'call',
        entityId: call.callId,
        action: 'create',
        status: 'error',
        errorDetails: error.message,
      })

      return { error: error.message || 'Failed to log call in HubSpot.' }
    }
  }

  /**
   * Create a deal in HubSpot from a confirmed order.
   * Associates the deal with the specified contact.
   */
  static async createDealFromOrder(
    businessId: string,
    contactId: string,
    order: {
      orderId: string
      customerName: string
      total: number
      items: string[]
      notes?: string
    }
  ): Promise<{ dealId?: string; error?: string }> {
    try {
      const client = await this.getClient(businessId)
      if (!client) {
        return { error: 'No active HubSpot connection.' }
      }

      // Check sync settings
      const status = await this.getConnectionStatus(businessId)
      if (!status.settings?.syncDeals) {
        return { error: 'Deal sync is disabled.' }
      }

      // Build deal description
      const itemsList = order.items.map((item) => `  - ${item}`).join('\n')
      const description = [
        `Order #${order.orderId}`,
        `Customer: ${order.customerName}`,
        `Items:\n${itemsList}`,
        order.notes ? `Notes: ${order.notes}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      const dealProperties: Record<string, string> = {
        dealname: `Order #${order.orderId} - ${order.customerName}`,
        amount: order.total.toString(),
        dealstage: 'closedwon',
        pipeline: 'default',
        description,
        closedate: new Date().toISOString(),
      }

      const createResponse = await client.crm.deals.basicApi.create({
        properties: dealProperties,
        associations: [
          {
            to: { id: contactId },
            types: [
              {
                associationCategory: 'HUBSPOT_DEFINED' as any,
                associationTypeId: 3, // dealToContact
              },
            ],
          },
        ],
      })

      await this.logSync(businessId, {
        entityType: 'deal',
        entityId: order.orderId,
        hubspotId: createResponse.id,
        action: 'create',
        status: 'success',
      })

      return { dealId: createResponse.id }
    } catch (error: any) {
      console.error(`[HubSpot] Deal creation failed for business ${businessId}:`, error)

      await this.logSync(businessId, {
        entityType: 'deal',
        entityId: order.orderId,
        action: 'create',
        status: 'error',
        errorDetails: error.message,
      })

      return { error: error.message || 'Failed to create deal in HubSpot.' }
    }
  }

  /**
   * Disconnect a business from HubSpot.
   * Marks the connection as inactive and clears tokens.
   */
  static async disconnect(businessId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('hubspot_connections')
        .update({
          is_connected: false,
          private_token: null,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)

      if (error) {
        return { success: false, error: 'Failed to disconnect from HubSpot.' }
      }

      await this.logSync(businessId, {
        entityType: 'connection',
        action: 'disconnect',
        status: 'success',
      })

      return { success: true }
    } catch (error: any) {
      console.error(`[HubSpot] Disconnect failed for business ${businessId}:`, error)
      return { success: false, error: error.message || 'Failed to disconnect.' }
    }
  }

  /**
   * Update sync settings for a business's HubSpot connection.
   */
  static async updateSettings(
    businessId: string,
    settings: {
      syncContacts?: boolean
      syncCalls?: boolean
      syncDeals?: boolean
      createTasks?: boolean
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }
      if (settings.syncContacts !== undefined) updateData.sync_contacts = settings.syncContacts
      if (settings.syncCalls !== undefined) updateData.sync_calls = settings.syncCalls
      if (settings.syncDeals !== undefined) updateData.sync_deals = settings.syncDeals
      if (settings.createTasks !== undefined) updateData.create_tasks = settings.createTasks

      const { error } = await supabase
        .from('hubspot_connections')
        .update(updateData)
        .eq('business_id', businessId)

      if (error) {
        return { success: false, error: 'Failed to update settings.' }
      }

      return { success: true }
    } catch (error: any) {
      console.error(`[HubSpot] Settings update failed for business ${businessId}:`, error)
      return { success: false, error: error.message || 'Failed to update settings.' }
    }
  }

  /**
   * Refresh an OAuth access token using the refresh token.
   * Returns the new access token on success, null on failure.
   */
  private static async refreshOAuthToken(
    businessId: string,
    refreshToken: string
  ): Promise<string | null> {
    try {
      const client = new Client()
      const tokenResponse = await client.oauth.tokensApi.create(
        'refresh_token',
        undefined,
        undefined,
        process.env.HUBSPOT_CLIENT_ID!,
        process.env.HUBSPOT_CLIENT_SECRET!,
        refreshToken
      )

      const newAccessToken = tokenResponse.accessToken
      const expiresIn = tokenResponse.expiresIn
      const expiresAt = new Date(Date.now() + expiresIn * 1000)

      // Store the refreshed token
      await supabase
        .from('hubspot_connections')
        .update({
          access_token: newAccessToken,
          refresh_token: tokenResponse.refreshToken,
          token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)

      return newAccessToken
    } catch (error) {
      console.error(`[HubSpot] OAuth token refresh failed for business ${businessId}:`, error)

      // Mark connection as disconnected if refresh fails
      await supabase
        .from('hubspot_connections')
        .update({
          is_connected: false,
          updated_at: new Date().toISOString(),
        })
        .eq('business_id', businessId)

      return null
    }
  }

  /**
   * Log a sync operation to the hubspot_sync_logs table.
   * Fails silently -- logging errors should never propagate.
   */
  private static async logSync(businessId: string, log: SyncLogEntry): Promise<void> {
    try {
      await supabase.from('hubspot_sync_logs').insert({
        business_id: businessId,
        entity_type: log.entityType,
        entity_id: log.entityId || null,
        hubspot_id: log.hubspotId || null,
        action: log.action,
        status: log.status,
        error_details: log.errorDetails || null,
      })
    } catch (error) {
      // Silently fail -- logging should never block the main flow
      console.error('[HubSpot] Failed to write sync log:', error)
    }
  }
}

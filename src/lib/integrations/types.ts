export type IntegrationPlatform = 'square' | 'toast' | 'calendly' | 'shopify'

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing'

export interface BusinessIntegration {
  id: string
  businessId: string
  platform: IntegrationPlatform
  status: IntegrationStatus
  config: Record<string, any>
  lastSyncedAt: string | null
  syncError: string | null
  createdAt: string
  updatedAt: string
}

export interface IntegrationSyncResult {
  success: boolean
  platform: IntegrationPlatform
  itemsImported: number
  message: string
  error?: string
}

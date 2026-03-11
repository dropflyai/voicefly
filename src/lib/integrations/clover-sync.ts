/**
 * Clover Integration Sync
 *
 * Pulls catalog data from Clover and maps it to VoiceFly's
 * OrderTakerConfig menu format.
 *
 * Uses Clover REST API v3:
 * GET /v3/merchants/{merchantId}/items?expand=categories,modifierGroups
 */

import { createClient } from '@supabase/supabase-js'

const CLOVER_API_BASE = 'https://api.clover.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface CloverSyncResult {
  menu: {
    categories: {
      name: string
      items: {
        name: string
        price: number
        posItemId?: string   // Clover item ID — used for order creation
        description?: string
        modifiers?: {
          name: string
          posGroupId?: string  // Clover modifier group ID
          options: { name: string; price: number; posOptionId?: string }[]
          required: boolean
        }[]
      }[]
    }[]
  }
  itemCount: number
  categoryCount: number
  merchantName?: string
}

export interface CloverOrderResult {
  success: boolean
  cloverOrderId?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Clover API object shapes (internal)
// ---------------------------------------------------------------------------

interface CloverMerchantResponse {
  id: string
  name?: string
}

interface CloverCategory {
  id: string
  name: string
}

interface CloverCategoryPage {
  elements?: CloverCategory[]
}

interface CloverModifierOption {
  id: string
  name: string
  price?: number
}

interface CloverModifierGroup {
  id: string
  name: string
  required?: boolean
  modifiers?: {
    elements?: CloverModifierOption[]
  }
}

interface CloverItem {
  id: string
  name: string
  price?: number
  description?: string
  categories?: {
    elements?: CloverCategory[]
  }
  modifierGroups?: {
    elements?: CloverModifierGroup[]
  }
}

interface CloverItemPage {
  elements?: CloverItem[]
}

// ---------------------------------------------------------------------------
// Credential validation
// ---------------------------------------------------------------------------

export async function validateCloverCredentials(
  accessToken: string,
  merchantId: string
): Promise<{ valid: boolean; merchantName?: string; error?: string }> {
  try {
    const response = await fetch(
      `${CLOVER_API_BASE}/v3/merchants/${merchantId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return { valid: false, error: `Clover returned ${response.status}` }
    }

    const data: CloverMerchantResponse = await response.json()
    return { valid: true, merchantName: data.name }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Failed to reach Clover API' }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function centsToDollars(amount: number | undefined): number {
  if (!amount) return 0
  return amount / 100
}

function dollarsToCents(amount: number): number {
  return Math.round(amount * 100)
}

// ---------------------------------------------------------------------------
// Connection lookup (for order creation at webhook time)
// ---------------------------------------------------------------------------

export interface CloverConnection {
  accessToken: string
  merchantId: string
}

export async function getCloverConnection(businessId: string): Promise<CloverConnection | null> {
  try {
    const { data, error } = await supabase
      .from('business_integrations')
      .select('credentials, status')
      .eq('business_id', businessId)
      .eq('platform', 'clover')
      .eq('status', 'connected')
      .single()

    if (error || !data?.credentials) return null

    const creds = data.credentials as any
    if (!creds.accessToken || !creds.merchantId) return null

    return {
      accessToken: creds.accessToken,
      merchantId: creds.merchantId,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main catalog sync
// ---------------------------------------------------------------------------

export async function syncCloverCatalog(
  accessToken: string,
  merchantId: string
): Promise<CloverSyncResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  // 1. Get merchant name
  const merchantResponse = await fetch(
    `${CLOVER_API_BASE}/v3/merchants/${merchantId}`,
    { headers }
  )

  if (!merchantResponse.ok) {
    throw new Error(`Clover merchant request failed (${merchantResponse.status})`)
  }

  const merchantData: CloverMerchantResponse = await merchantResponse.json()
  const merchantName = merchantData.name

  // 2. Get categories
  const categoriesResponse = await fetch(
    `${CLOVER_API_BASE}/v3/merchants/${merchantId}/categories`,
    { headers }
  )

  if (!categoriesResponse.ok) {
    throw new Error(`Clover categories request failed (${categoriesResponse.status})`)
  }

  const categoriesData: CloverCategoryPage = await categoriesResponse.json()
  const categories = categoriesData.elements || []

  // 3. Get items with categories and modifier groups expanded
  const itemsResponse = await fetch(
    `${CLOVER_API_BASE}/v3/merchants/${merchantId}/items?expand=categories,modifierGroups`,
    { headers }
  )

  if (!itemsResponse.ok) {
    throw new Error(`Clover items request failed (${itemsResponse.status})`)
  }

  const itemsData: CloverItemPage = await itemsResponse.json()
  const items = itemsData.elements || []

  // 4. Build category lookup map
  const categoryMap = new Map<string, string>() // id -> name
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name)
  }

  // 5. Group items by category
  const categoryItemsMap = new Map<
    string,
    {
      name: string
      price: number
      posItemId: string
      description?: string
      modifiers?: {
        name: string
        posGroupId: string
        options: { name: string; price: number; posOptionId: string }[]
        required: boolean
      }[]
    }[]
  >()

  for (const item of items) {
    const modifiers = (item.modifierGroups?.elements || []).map((group) => ({
      name: group.name,
      posGroupId: group.id,
      options: (group.modifiers?.elements || []).map((opt) => ({
        name: opt.name,
        price: centsToDollars(opt.price),
        posOptionId: opt.id,
      })),
      required: group.required === true,
    }))

    const voiceflyItem = {
      name: item.name,
      price: centsToDollars(item.price),
      posItemId: item.id,
      ...(item.description ? { description: item.description } : {}),
      ...(modifiers.length > 0 ? { modifiers } : {}),
    }

    const itemCategories = item.categories?.elements || []
    const catKey =
      itemCategories.length > 0 ? itemCategories[0].id : '__uncategorized__'

    if (!categoryItemsMap.has(catKey)) {
      categoryItemsMap.set(catKey, [])
    }
    categoryItemsMap.get(catKey)!.push(voiceflyItem)
  }

  // 6. Build the final categories array
  const menuCategories: CloverSyncResult['menu']['categories'] = []

  for (const cat of categories) {
    const catItems = categoryItemsMap.get(cat.id)
    if (!catItems || catItems.length === 0) continue
    menuCategories.push({ name: cat.name, items: catItems })
  }

  const uncategorizedItems = categoryItemsMap.get('__uncategorized__')
  if (uncategorizedItems && uncategorizedItems.length > 0) {
    menuCategories.push({ name: 'Other', items: uncategorizedItems })
  }

  // 7. Count totals
  const itemCount = menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const categoryCount = menuCategories.length

  return {
    menu: { categories: menuCategories },
    itemCount,
    categoryCount,
    ...(merchantName ? { merchantName } : {}),
  }
}

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

export async function createCloverOrder(
  conn: CloverConnection,
  order: {
    items: Array<{
      name: string
      quantity: number
      unitPrice: number
      posItemId?: string
      modifiers?: Array<{ name: string; option: string; posOptionId?: string; price?: number }>
      specialInstructions?: string
    }>
    orderType: 'pickup' | 'delivery'
    customerName?: string
    customerPhone?: string
    total: number
  }
): Promise<CloverOrderResult> {
  const { accessToken, merchantId } = conn
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  }

  try {
    // 1. Create the order
    const orderBody: Record<string, any> = {
      manualTransaction: false,
      taxRemoved: false,
      title: order.customerName
        ? `${order.orderType === 'delivery' ? 'Delivery' : 'Pickup'} - ${order.customerName}`
        : order.orderType === 'delivery' ? 'Delivery Order' : 'Pickup Order',
    }

    const createResponse = await fetch(
      `${CLOVER_API_BASE}/v3/merchants/${merchantId}/orders`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(orderBody),
      }
    )

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error(`[Clover] Order creation failed (${createResponse.status}):`, errorText)
      return { success: false, error: `Clover order creation failed: ${createResponse.status}` }
    }

    const createdOrder = await createResponse.json()
    const cloverOrderId = createdOrder.id

    if (!cloverOrderId) {
      return { success: false, error: 'Clover did not return an order ID' }
    }

    // 2. Add line items
    for (const item of order.items) {
      const lineItemBody: Record<string, any> = {
        name: item.name,
        price: dollarsToCents(item.unitPrice),
        unitQty: item.quantity * 1000, // Clover uses milliunits
      }

      // Link to catalog item if we have the ID
      if (item.posItemId) {
        lineItemBody.item = { id: item.posItemId }
      }

      if (item.specialInstructions) {
        lineItemBody.note = item.specialInstructions
      }

      const lineItemResponse = await fetch(
        `${CLOVER_API_BASE}/v3/merchants/${merchantId}/orders/${cloverOrderId}/line_items`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(lineItemBody),
        }
      )

      if (!lineItemResponse.ok) {
        console.warn(`[Clover] Failed to add line item "${item.name}" to order ${cloverOrderId}`)
        continue
      }

      const createdLineItem = await lineItemResponse.json()

      // Add modifier selections if applicable
      const modifiersWithId = (item.modifiers || []).filter((m) => m.posOptionId)
      for (const mod of modifiersWithId) {
        await fetch(
          `${CLOVER_API_BASE}/v3/merchants/${merchantId}/orders/${cloverOrderId}/line_items/${createdLineItem.id}/modifications`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              modifier: { id: mod.posOptionId },
            }),
          }
        ).catch(() => {
          // Modifier addition is best-effort
        })
      }
    }

    console.log(`[Clover] Order created: ${cloverOrderId}`)
    return { success: true, cloverOrderId }
  } catch (error: any) {
    console.error('[Clover] createOrder error:', error)
    return { success: false, error: error.message || 'Clover order creation failed' }
  }
}

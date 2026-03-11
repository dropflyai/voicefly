/**
 * Toast Integration Sync
 *
 * Pulls menu data from Toast and maps it to VoiceFly's
 * OrderTakerConfig menu format.
 *
 * Uses Toast OAuth 2.0 client credentials flow.
 * Sandbox: https://ws-sandbox-api.eng.toasttab.com
 * Production: https://ws-api.toasttab.com
 */

import { createClient } from '@supabase/supabase-js'

const TOAST_SANDBOX_BASE = 'https://ws-sandbox-api.eng.toasttab.com'
const TOAST_PROD_BASE = 'https://ws-api.toasttab.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ToastSyncResult {
  menu: {
    categories: {
      name: string
      items: {
        name: string
        price: number
        posItemId?: string   // Toast item GUID — used for order creation
        description?: string
        modifiers?: {
          name: string
          posGroupId?: string  // Toast modifier group GUID
          options: { name: string; price: number; posOptionId?: string }[]
          required: boolean
        }[]
        outOfStock?: boolean
      }[]
    }[]
  }
  itemCount: number
  categoryCount: number
  restaurantName?: string
  outOfStockItems: string[]
}

export interface ToastOrderResult {
  success: boolean
  toastOrderId?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Toast API object shapes (internal)
// ---------------------------------------------------------------------------

interface ToastAuthResponse {
  token: {
    accessToken: string
    tokenType: string
  }
  status?: string
}

interface ToastModifierOptionReference {
  guid: string
  name?: string
  price?: number
}

interface ToastModifierGroup {
  guid: string
  name?: string
  minSelections?: number
  modifiers?: ToastModifierOptionReference[]
}

interface ToastMenuItem {
  guid: string
  name: string
  price?: number
  description?: string
  modifierGroupReferences?: { guid: string }[]
  outOfStock?: boolean
}

interface ToastMenuGroup {
  guid: string
  name: string
  menuItems?: ToastMenuItem[]
}

interface ToastMenu {
  guid: string
  name: string
  menuGroups?: ToastMenuGroup[]
}

interface ToastModifierGroupFull {
  guid: string
  name?: string
  minSelections?: number
  modifiers?: {
    guid: string
    name?: string
    price?: number
  }[]
}

interface ToastOrderType {
  guid: string
  name: string
  // "TAKE_OUT", "DELIVERY", "DINE_IN", etc.
  behavior?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(useSandbox: boolean): string {
  return useSandbox ? TOAST_SANDBOX_BASE : TOAST_PROD_BASE
}

function centsToDollars(amount: number | undefined): number {
  if (!amount) return 0
  return amount / 100
}

function dollarsToCents(amount: number): number {
  return Math.round(amount * 100)
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function getToastAccessToken(
  clientId: string,
  clientSecret: string,
  useSandbox: boolean
): Promise<string> {
  const baseUrl = getBaseUrl(useSandbox)

  const response = await fetch(
    `${baseUrl}/authentication/v1/authentication/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        userAccessType: 'TOAST_MACHINE_CLIENT',
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Toast authentication failed (${response.status})`)
  }

  const data: ToastAuthResponse = await response.json()

  if (!data.token?.accessToken) {
    throw new Error('Toast authentication did not return an access token')
  }

  return data.token.accessToken
}

// ---------------------------------------------------------------------------
// Credential validation
// ---------------------------------------------------------------------------

export async function validateToastCredentials(
  clientId: string,
  clientSecret: string,
  restaurantGuid: string,
  useSandbox: boolean
): Promise<{ valid: boolean; restaurantName?: string; error?: string }> {
  try {
    await getToastAccessToken(clientId, clientSecret, useSandbox)
    return { valid: true }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Failed to authenticate with Toast' }
  }
}

// ---------------------------------------------------------------------------
// Connection lookup (for order creation at webhook time)
// ---------------------------------------------------------------------------

export interface ToastConnection {
  clientId: string
  clientSecret: string
  restaurantGuid: string
  useSandbox: boolean
}

export async function getToastConnection(businessId: string): Promise<ToastConnection | null> {
  try {
    const { data, error } = await supabase
      .from('business_integrations')
      .select('credentials, status')
      .eq('business_id', businessId)
      .eq('platform', 'toast')
      .eq('status', 'connected')
      .single()

    if (error || !data?.credentials) return null

    const creds = data.credentials as any
    if (!creds.clientId || !creds.clientSecret || !creds.restaurantGuid) return null

    return {
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      restaurantGuid: creds.restaurantGuid,
      useSandbox: creds.useSandbox ?? true,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Main menu sync
// ---------------------------------------------------------------------------

export async function syncToastMenu(
  clientId: string,
  clientSecret: string,
  restaurantGuid: string,
  useSandbox: boolean = true
): Promise<ToastSyncResult> {
  const baseUrl = getBaseUrl(useSandbox)

  // 1. Authenticate
  const accessToken = await getToastAccessToken(clientId, clientSecret, useSandbox)

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Toast-Restaurant-External-ID': restaurantGuid,
    'Content-Type': 'application/json',
  }

  // 2. Get menus
  const menusResponse = await fetch(`${baseUrl}/menus/v2/menus`, { headers })

  if (!menusResponse.ok) {
    throw new Error(`Toast menus request failed (${menusResponse.status})`)
  }

  const menus: ToastMenu[] = await menusResponse.json()

  // 3. Get modifier groups if needed
  let modifierGroupMap = new Map<
    string,
    {
      name: string
      posGroupId: string
      options: { name: string; price: number; posOptionId: string }[]
      required: boolean
    }
  >()

  const hasModifiers = menus.some((menu) =>
    menu.menuGroups?.some((group) =>
      group.menuItems?.some(
        (item) => item.modifierGroupReferences && item.modifierGroupReferences.length > 0
      )
    )
  )

  if (hasModifiers) {
    try {
      const modGroupsResponse = await fetch(
        `${baseUrl}/menus/v2/modifierGroups`,
        { headers }
      )

      if (modGroupsResponse.ok) {
        const modGroups: ToastModifierGroupFull[] = await modGroupsResponse.json()
        for (const group of modGroups) {
          modifierGroupMap.set(group.guid, {
            name: group.name || '',
            posGroupId: group.guid,
            options: (group.modifiers || []).map((opt) => ({
              name: opt.name || '',
              price: centsToDollars(opt.price),
              posOptionId: opt.guid,
            })),
            required: (group.minSelections || 0) > 0,
          })
        }
      }
    } catch {
      // Modifier group fetch is best-effort; don't fail the whole sync
    }
  }

  // 4. Map menus to categories
  const menuCategories: ToastSyncResult['menu']['categories'] = []
  const outOfStockItems: string[] = []

  for (const menu of menus) {
    for (const menuGroup of menu.menuGroups || []) {
      const categoryItems: ToastSyncResult['menu']['categories'][0]['items'] = []

      for (const menuItem of menuGroup.menuItems || []) {
        if (menuItem.outOfStock) {
          outOfStockItems.push(menuItem.name)
        }

        const modifiers = (menuItem.modifierGroupReferences || [])
          .map((ref) => modifierGroupMap.get(ref.guid))
          .filter(
            (m): m is {
              name: string
              posGroupId: string
              options: { name: string; price: number; posOptionId: string }[]
              required: boolean
            } => m !== undefined
          )

        categoryItems.push({
          name: menuItem.name,
          price: centsToDollars(menuItem.price),
          posItemId: menuItem.guid,
          ...(menuItem.description ? { description: menuItem.description } : {}),
          ...(modifiers.length > 0 ? { modifiers } : {}),
          ...(menuItem.outOfStock ? { outOfStock: true } : {}),
        })
      }

      if (categoryItems.length > 0) {
        menuCategories.push({ name: menuGroup.name, items: categoryItems })
      }
    }
  }

  const itemCount = menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const categoryCount = menuCategories.length

  return {
    menu: { categories: menuCategories },
    itemCount,
    categoryCount,
    outOfStockItems,
  }
}

// ---------------------------------------------------------------------------
// Order creation
// ---------------------------------------------------------------------------

export async function createToastOrder(
  conn: ToastConnection,
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
): Promise<ToastOrderResult> {
  try {
    const { clientId, clientSecret, restaurantGuid, useSandbox } = conn
    const baseUrl = getBaseUrl(useSandbox)
    const accessToken = await getToastAccessToken(clientId, clientSecret, useSandbox)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
      'Content-Type': 'application/json',
    }

    // 1. Get order types to find the right one for pickup/delivery
    const orderTypesResponse = await fetch(`${baseUrl}/orders/v2/orderTypes`, { headers })
    let orderTypeGuid: string | null = null

    if (orderTypesResponse.ok) {
      const orderTypes: ToastOrderType[] = await orderTypesResponse.json()
      // Match by behavior: TAKE_OUT for pickup, DELIVERY for delivery
      const targetBehavior = order.orderType === 'delivery' ? 'DELIVERY' : 'TAKE_OUT'
      const match = orderTypes.find(
        (ot) => ot.behavior === targetBehavior
      ) || orderTypes.find(
        (ot) => ot.name.toLowerCase().includes(order.orderType)
      ) || orderTypes[0]

      if (match) orderTypeGuid = match.guid
    }

    if (!orderTypeGuid) {
      return { success: false, error: 'Could not determine Toast order type GUID' }
    }

    // 2. Build selections — only items with posItemId can be mapped to Toast catalog
    const selectionsWithGuid = order.items.filter((item) => item.posItemId)
    if (selectionsWithGuid.length === 0) {
      return {
        success: false,
        error: 'No Toast item GUIDs available — re-sync menu to enable Toast order creation',
      }
    }

    const selections = selectionsWithGuid.map((item) => {
      const selection: Record<string, any> = {
        item: { guid: item.posItemId },
        quantity: item.quantity,
      }

      // Add modifiers that have posOptionId
      const modifiersWithId = (item.modifiers || []).filter((m) => m.posOptionId)
      if (modifiersWithId.length > 0) {
        selection.modifiers = modifiersWithId.map((m) => ({
          modifier: { guid: m.posOptionId },
        }))
      }

      if (item.specialInstructions) {
        selection.specialInstructions = item.specialInstructions
      }

      return selection
    })

    // 3. Create the order
    const orderBody: Record<string, any> = {
      orderType: { guid: orderTypeGuid },
      selections,
    }

    if (order.customerName || order.customerPhone) {
      orderBody.customer = {
        ...(order.customerName ? { firstName: order.customerName.split(' ')[0], lastName: order.customerName.split(' ').slice(1).join(' ') } : {}),
        ...(order.customerPhone ? { phone: order.customerPhone } : {}),
      }
    }

    const createResponse = await fetch(`${baseUrl}/orders/v2/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderBody),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error(`[Toast] Order creation failed (${createResponse.status}):`, errorText)
      return { success: false, error: `Toast order creation failed: ${createResponse.status}` }
    }

    const created = await createResponse.json()
    const toastOrderId = created?.guid || created?.order?.guid

    console.log(`[Toast] Order created: ${toastOrderId}`)
    return { success: true, toastOrderId }
  } catch (error: any) {
    console.error('[Toast] createOrder error:', error)
    return { success: false, error: error.message || 'Toast order creation failed' }
  }
}

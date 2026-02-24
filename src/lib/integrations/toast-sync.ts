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

const TOAST_SANDBOX_BASE = 'https://ws-sandbox-api.eng.toasttab.com'
const TOAST_PROD_BASE = 'https://ws-api.toasttab.com'

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
        description?: string
        modifiers?: {
          name: string
          options: { name: string; price: number }[]
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
      options: { name: string; price: number }[]
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
            options: (group.modifiers || []).map((opt) => ({
              name: opt.name || '',
              price: centsToDollars(opt.price),
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
            (
              m
            ): m is {
              name: string
              options: { name: string; price: number }[]
              required: boolean
            } => m !== undefined
          )

        categoryItems.push({
          name: menuItem.name,
          price: centsToDollars(menuItem.price),
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

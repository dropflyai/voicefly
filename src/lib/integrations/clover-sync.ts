/**
 * Clover Integration Sync
 *
 * Pulls catalog data from Clover and maps it to VoiceFly's
 * OrderTakerConfig menu format.
 *
 * Uses Clover REST API v3:
 * GET /v3/merchants/{merchantId}/items?expand=categories,modifierGroups
 */

const CLOVER_API_BASE = 'https://api.clover.com'

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
        description?: string
        modifiers?: {
          name: string
          options: { name: string; price: number }[]
          required: boolean
        }[]
      }[]
    }[]
  }
  itemCount: number
  categoryCount: number
  merchantName?: string
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
      description?: string
      modifiers?: {
        name: string
        options: { name: string; price: number }[]
        required: boolean
      }[]
    }[]
  >()

  for (const item of items) {
    const modifiers = (item.modifierGroups?.elements || []).map((group) => ({
      name: group.name,
      options: (group.modifiers?.elements || []).map((opt) => ({
        name: opt.name,
        price: centsToDollars(opt.price),
      })),
      required: group.required === true,
    }))

    const voiceflyItem = {
      name: item.name,
      price: centsToDollars(item.price),
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

/**
 * Square Integration Sync
 *
 * Pulls catalog data from Square and maps it to VoiceFly's
 * OrderTakerConfig menu format.
 *
 * Uses Square's Catalog API v2:
 * GET /v2/catalog/list?types=ITEM,CATEGORY,MODIFIER_LIST
 */

const SQUARE_API_BASE = 'https://connect.squareup.com'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface SquareSyncResult {
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
        allergens?: string[]
      }[]
    }[]
  }
  itemCount: number
  categoryCount: number
  locationName?: string
  locationHours?: string
}

// ---------------------------------------------------------------------------
// Square catalog object shapes (internal)
// ---------------------------------------------------------------------------

interface SquareMoney {
  amount: number
  currency: string
}

interface SquareModifierData {
  name: string
  price_money?: SquareMoney
}

interface SquareModifier {
  modifier_data: SquareModifierData
}

interface SquareModifierListData {
  name: string
  selection_type: 'SINGLE' | 'MULTIPLE'
  modifiers?: SquareModifier[]
}

interface SquareModifierListInfo {
  modifier_list_id: string
}

interface SquareItemVariationData {
  name: string
  price_money?: SquareMoney
}

interface SquareItemVariation {
  item_variation_data: SquareItemVariationData
}

interface SquareItemData {
  name: string
  description?: string
  category_id?: string
  variations?: SquareItemVariation[]
  modifier_list_info?: SquareModifierListInfo[]
  available_for_sale?: boolean
}

interface SquareCategoryData {
  name: string
}

interface SquareCatalogObject {
  id: string
  type: 'ITEM' | 'CATEGORY' | 'MODIFIER_LIST'
  item_data?: SquareItemData
  category_data?: SquareCategoryData
  modifier_list_data?: SquareModifierListData
}

interface SquareCatalogResponse {
  objects?: SquareCatalogObject[]
  errors?: { detail: string; code: string }[]
}

interface SquareLocationPeriod {
  start_local_time: string
  end_local_time: string
}

interface SquareLocationHours {
  monday_periods?: SquareLocationPeriod[]
  tuesday_periods?: SquareLocationPeriod[]
  wednesday_periods?: SquareLocationPeriod[]
  thursday_periods?: SquareLocationPeriod[]
  friday_periods?: SquareLocationPeriod[]
  saturday_periods?: SquareLocationPeriod[]
  sunday_periods?: SquareLocationPeriod[]
}

interface SquareLocationData {
  name: string
  business_hours?: {
    periods?: {
      day_of_week: string
      start_local_time: string
      end_local_time: string
    }[]
  }
}

interface SquareLocationResponse {
  location?: SquareLocationData
  errors?: { detail: string; code: string }[]
}

interface SquareMerchantResponse {
  merchant?: { business_name?: string; id: string }[]
  errors?: { detail: string; code: string }[]
}

// ---------------------------------------------------------------------------
// Token validation
// ---------------------------------------------------------------------------

/**
 * Validate a Square access token by calling the merchants/me endpoint.
 */
export async function validateSquareToken(
  accessToken: string
): Promise<{ valid: boolean; merchantName?: string; error?: string }> {
  try {
    const response = await fetch(`${SQUARE_API_BASE}/v2/merchants/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Square-Version': '2024-01-18',
        'Content-Type': 'application/json',
      },
    })

    const data: SquareMerchantResponse = await response.json()

    if (!response.ok) {
      const errorMsg =
        data.errors?.map((e) => e.detail || e.code).join(', ') ||
        'Invalid access token'
      return { valid: false, error: errorMsg }
    }

    const merchantName = data.merchant?.[0]?.business_name
    return { valid: true, merchantName }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Failed to reach Square API' }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert Square cents amount to dollars.
 */
function centsToDollars(amount: number | undefined): number {
  if (!amount) return 0
  return amount / 100
}

/**
 * Format Square business hours into a human-readable string.
 */
function formatLocationHours(
  businessHours: SquareLocationData['business_hours']
): string | undefined {
  if (!businessHours?.periods || businessHours.periods.length === 0) {
    return undefined
  }

  const dayNames: Record<string, string> = {
    MON: 'Mon',
    TUE: 'Tue',
    WED: 'Wed',
    THU: 'Thu',
    FRI: 'Fri',
    SAT: 'Sat',
    SUN: 'Sun',
  }

  const lines = businessHours.periods.map((period) => {
    const day = dayNames[period.day_of_week] || period.day_of_week
    return `${day}: ${period.start_local_time} - ${period.end_local_time}`
  })

  return lines.join(', ')
}

// ---------------------------------------------------------------------------
// Main catalog sync
// ---------------------------------------------------------------------------

/**
 * Sync the Square catalog for a given access token and optional location.
 * Maps the result to VoiceFly's OrderTakerConfig menu format.
 */
export async function syncSquareCatalog(
  accessToken: string,
  locationId?: string
): Promise<SquareSyncResult> {
  // 1. Fetch catalog objects (items, categories, modifier lists)
  const catalogUrl =
    `${SQUARE_API_BASE}/v2/catalog/list` +
    `?types=ITEM,CATEGORY,MODIFIER_LIST`

  const catalogResponse = await fetch(catalogUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': '2024-01-18',
      'Content-Type': 'application/json',
    },
  })

  if (!catalogResponse.ok) {
    const errData: SquareCatalogResponse = await catalogResponse.json()
    const errorMsg =
      errData.errors?.map((e) => e.detail || e.code).join(', ') ||
      `Square catalog request failed (${catalogResponse.status})`
    throw new Error(errorMsg)
  }

  const catalogData: SquareCatalogResponse = await catalogResponse.json()
  const objects: SquareCatalogObject[] = catalogData.objects || []

  // 2. Optionally fetch location name and hours
  let locationName: string | undefined
  let locationHours: string | undefined

  if (locationId) {
    try {
      const locationResponse = await fetch(
        `${SQUARE_API_BASE}/v2/locations/${locationId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Square-Version': '2024-01-18',
            'Content-Type': 'application/json',
          },
        }
      )

      if (locationResponse.ok) {
        const locationData: SquareLocationResponse = await locationResponse.json()
        if (locationData.location) {
          locationName = locationData.location.name
          locationHours = formatLocationHours(locationData.location.business_hours)
        }
      }
    } catch {
      // Location fetch is best-effort; don't fail the whole sync
    }
  }

  // 3. Separate objects by type
  const categories = objects.filter((o) => o.type === 'CATEGORY')
  const items = objects.filter((o) => o.type === 'ITEM')
  const modifierLists = objects.filter((o) => o.type === 'MODIFIER_LIST')

  // 4. Build lookup maps
  const categoryMap = new Map<string, string>() // id -> name
  for (const cat of categories) {
    if (cat.category_data?.name) {
      categoryMap.set(cat.id, cat.category_data.name)
    }
  }

  const modifierListMap = new Map<
    string,
    {
      name: string
      options: { name: string; price: number }[]
      required: boolean
    }
  >()

  for (const ml of modifierLists) {
    if (!ml.modifier_list_data) continue
    const mlData = ml.modifier_list_data
    const options = (mlData.modifiers || []).map((mod) => ({
      name: mod.modifier_data.name,
      price: centsToDollars(mod.modifier_data.price_money?.amount),
    }))
    modifierListMap.set(ml.id, {
      name: mlData.name,
      options,
      required: mlData.selection_type === 'SINGLE',
    })
  }

  // 5. Group items by category
  // categoryId -> VoiceFly item list
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
    if (!item.item_data) continue
    const itemData = item.item_data

    // Filter out items explicitly marked unavailable
    if (itemData.available_for_sale === false) continue

    // Price: use first variation's price
    const firstVariation = itemData.variations?.[0]
    const price = centsToDollars(
      firstVariation?.item_variation_data?.price_money?.amount
    )

    // Modifiers
    const modifiers = (itemData.modifier_list_info || [])
      .map((info) => modifierListMap.get(info.modifier_list_id))
      .filter(
        (m): m is { name: string; options: { name: string; price: number }[]; required: boolean } =>
          m !== undefined
      )

    const voiceflyItem = {
      name: itemData.name,
      price,
      ...(itemData.description ? { description: itemData.description } : {}),
      ...(modifiers.length > 0 ? { modifiers } : {}),
    }

    const catKey = itemData.category_id || '__uncategorized__'
    if (!categoryItemsMap.has(catKey)) {
      categoryItemsMap.set(catKey, [])
    }
    categoryItemsMap.get(catKey)!.push(voiceflyItem)
  }

  // 6. Build the final categories array
  const menuCategories: SquareSyncResult['menu']['categories'] = []

  // Add categorized items in the order categories appear
  for (const cat of categories) {
    const catItems = categoryItemsMap.get(cat.id)
    if (!catItems || catItems.length === 0) continue
    menuCategories.push({
      name: cat.category_data!.name,
      items: catItems,
    })
  }

  // Add uncategorized items last
  const uncategorizedItems = categoryItemsMap.get('__uncategorized__')
  if (uncategorizedItems && uncategorizedItems.length > 0) {
    menuCategories.push({
      name: 'Other',
      items: uncategorizedItems,
    })
  }

  // 7. Count totals
  const itemCount = menuCategories.reduce((sum, cat) => sum + cat.items.length, 0)
  const categoryCount = menuCategories.length

  return {
    menu: { categories: menuCategories },
    itemCount,
    categoryCount,
    ...(locationName ? { locationName } : {}),
    ...(locationHours ? { locationHours } : {}),
  }
}

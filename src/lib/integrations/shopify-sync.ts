/**
 * Shopify Integration Sync
 *
 * Pulls product and shop data from the Shopify Admin REST API and maps it
 * to VoiceFly's customer-service config format.
 *
 * Uses Shopify Admin REST API 2024-01:
 * GET /admin/api/2024-01/shop.json
 * GET /admin/api/2024-01/products.json
 * GET /admin/api/2024-01/policies.json
 */

const SHOPIFY_API_VERSION = '2024-01'

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ShopifySyncResult {
  products: {
    name: string
    description?: string
    variants: { name: string; price: number; sku?: string }[]
  }[]
  shopName: string
  currency: string
  returnPolicy?: string
  productCount: number
}

// ---------------------------------------------------------------------------
// Shopify API response shapes (internal)
// ---------------------------------------------------------------------------

interface ShopifyVariant {
  id: number
  title: string
  price: string
  sku?: string
}

interface ShopifyProduct {
  id: number
  title: string
  body_html: string | null
  status: string
  variants: ShopifyVariant[]
}

interface ShopifyProductsResponse {
  products?: ShopifyProduct[]
  errors?: string | Record<string, string[]>
}

interface ShopifyShop {
  name: string
  currency: string
  email?: string
}

interface ShopifyShopResponse {
  shop?: ShopifyShop
  errors?: string | Record<string, string[]>
}

interface ShopifyPolicy {
  body: string | null
  title: string
}

interface ShopifyPoliciesResponse {
  refund_policy?: ShopifyPolicy
  shipping_policy?: ShopifyPolicy
  privacy_policy?: ShopifyPolicy
  terms_of_service?: ShopifyPolicy
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags and collapse whitespace, capped at 500 chars.
 */
function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
}

/**
 * Normalise a user-supplied shop domain.
 * Strips protocol and trailing slash; appends .myshopify.com if no dot present.
 */
export function normalizeShopDomain(input: string): string {
  let domain = input.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!domain.includes('.')) domain = domain + '.myshopify.com'
  return domain
}

/**
 * Build the base URL for Shopify Admin REST API calls.
 */
function shopifyApiBase(shopDomain: string): string {
  return `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}`
}

/**
 * Return headers required for every Shopify Admin REST request.
 */
function shopifyHeaders(accessToken: string): Record<string, string> {
  return {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Credential validation
// ---------------------------------------------------------------------------

/**
 * Validate Shopify credentials by calling /shop.json.
 * Returns valid=true and the shop name on success, or an error message on failure.
 */
export async function validateShopifyCredentials(
  shopDomain: string,
  accessToken: string
): Promise<{ valid: boolean; shopName?: string; error?: string }> {
  try {
    const response = await fetch(`${shopifyApiBase(shopDomain)}/shop.json`, {
      headers: shopifyHeaders(accessToken),
    })

    if (response.status === 401 || response.status === 403) {
      return { valid: false, error: 'Invalid access token or insufficient permissions' }
    }

    if (!response.ok) {
      return { valid: false, error: `Shopify returned status ${response.status}` }
    }

    const data: ShopifyShopResponse = await response.json()
    const shopName = data.shop?.name
    return { valid: true, shopName }
  } catch (error: any) {
    return { valid: false, error: error.message || 'Failed to reach Shopify API' }
  }
}

// ---------------------------------------------------------------------------
// Main store sync
// ---------------------------------------------------------------------------

/**
 * Sync product and policy data from a Shopify store.
 * Maps the result to VoiceFly's customer-service config format.
 */
export async function syncShopifyStore(
  shopDomain: string,
  accessToken: string
): Promise<ShopifySyncResult> {
  const base = shopifyApiBase(shopDomain)
  const headers = shopifyHeaders(accessToken)

  // 1. Fetch shop info
  const shopResponse = await fetch(`${base}/shop.json`, { headers })

  if (!shopResponse.ok) {
    throw new Error(`Failed to fetch shop info (${shopResponse.status})`)
  }

  const shopData: ShopifyShopResponse = await shopResponse.json()

  if (!shopData.shop) {
    throw new Error('Shopify shop data missing from response')
  }

  const shopName = shopData.shop.name
  const currency = shopData.shop.currency

  // 2. Fetch active products (up to 250)
  const productsResponse = await fetch(
    `${base}/products.json?limit=250&status=active&fields=id,title,body_html,variants`,
    { headers }
  )

  if (!productsResponse.ok) {
    throw new Error(`Failed to fetch products (${productsResponse.status})`)
  }

  const productsData: ShopifyProductsResponse = await productsResponse.json()
  const rawProducts: ShopifyProduct[] = productsData.products || []

  // 3. Map products to VoiceFly format
  const products: ShopifySyncResult['products'] = rawProducts.map((product) => {
    const description = product.body_html ? stripHtml(product.body_html) : undefined

    const variants = (product.variants || []).map((variant) => ({
      name: variant.title === 'Default Title' ? 'Default' : variant.title,
      price: parseFloat(variant.price) || 0,
      ...(variant.sku ? { sku: variant.sku } : {}),
    }))

    return {
      name: product.title,
      ...(description ? { description } : {}),
      variants,
    }
  })

  // 4. Fetch policies and extract return/refund policy
  let returnPolicy: string | undefined

  try {
    const policiesResponse = await fetch(`${base}/policies.json`, { headers })

    if (policiesResponse.ok) {
      const policiesData: ShopifyPoliciesResponse = await policiesResponse.json()

      if (policiesData.refund_policy?.body) {
        returnPolicy = stripHtml(policiesData.refund_policy.body)
      }
    }
  } catch {
    // Policies fetch is best-effort; don't fail the whole sync
  }

  return {
    products,
    shopName,
    currency,
    ...(returnPolicy ? { returnPolicy } : {}),
    productCount: products.length,
  }
}

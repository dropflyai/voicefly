/**
 * Shopify Manual Connect
 *
 * POST /api/integrations/shopify/connect
 * Body: { businessId, shopDomain, accessToken }
 *
 * Validates Shopify credentials and stores the integration in
 * business_integrations for later product syncs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateBusinessAccess } from '@/lib/api-auth'
import {
  validateShopifyCredentials,
  normalizeShopDomain,
} from '@/lib/integrations/shopify-sync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, shopDomain, accessToken } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    if (!shopDomain) {
      return NextResponse.json({ error: 'Shop domain required' }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token required' }, { status: 400 })
    }

    // Validate access
    const authResult = await validateBusinessAccess(request, businessId)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 403 })
    }

    const normalizedDomain = normalizeShopDomain(shopDomain)

    // Validate credentials against the Shopify API before storing
    const credentialCheck = await validateShopifyCredentials(normalizedDomain, accessToken)
    if (!credentialCheck.valid) {
      return NextResponse.json(
        { error: 'Invalid Shopify credentials', detail: credentialCheck.error },
        { status: 400 }
      )
    }

    const { shopName } = credentialCheck

    // Fetch shop currency for config (best-effort; already fetched during validation
    // but validateShopifyCredentials only returns shopName — a full sync would capture
    // currency, so we store a placeholder here and let sync fill it in)
    // We do a minimal re-fetch to capture currency without duplicating sync logic.
    let currency: string | undefined
    try {
      const shopRes = await fetch(
        `https://${normalizedDomain}/admin/api/2024-01/shop.json`,
        { headers: { 'X-Shopify-Access-Token': accessToken } }
      )
      if (shopRes.ok) {
        const shopData = await shopRes.json()
        currency = shopData.shop?.currency
      }
    } catch {
      // Best-effort; sync will capture it properly
    }

    // Upsert into business_integrations
    const { error: upsertError } = await supabase
      .from('business_integrations')
      .upsert(
        {
          business_id: businessId,
          platform: 'shopify',
          status: 'connected',
          credentials: {
            shopDomain: normalizedDomain,
            accessToken,
          },
          config: {
            ...(shopName ? { shopName } : {}),
            ...(currency ? { currency } : {}),
          },
          sync_error: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,platform' }
      )

    if (upsertError) {
      console.error('[Shopify Connect] Failed to upsert integration:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save Shopify connection' },
        { status: 500 }
      )
    }

    console.log(
      `[Shopify Connect] Connected Shopify for business ${businessId}` +
        (shopName ? ` (${shopName})` : '')
    )

    return NextResponse.json({
      success: true,
      ...(shopName ? { shopName } : {}),
      ...(currency ? { currency } : {}),
    })
  } catch (error: any) {
    console.error('[Shopify Connect] Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

# POS Integration — Square Menu Sync (Level 1)

**Status**: Scoped, deferred until restaurant vertical opens
**Vertical**: Restaurants (and adjacent: cafes, food trucks, retail with menu-like catalog)
**Effort**: ~1-2 weeks of focused work for Square Level 1
**Trigger to build**: Restaurant vertical added to beta target list, or first restaurant prospect

---

## Problem

Today VoiceFly's "menu" for restaurant phone employees is either:
- Manually typed by the owner during onboarding (stale within a week)
- Scraped from a website (often missing prices, modifiers, daily specials)

Neither of these reflects what the restaurant is actually serving today. When the AI takes an order over the phone, it might quote the wrong price, suggest a discontinued item, or miss a special. This breaks the trust contract for any restaurant that uses the product seriously.

## Solution Summary

Daily sync from the tenant's Square Catalog API. The AI always knows the current menu. This is the floor — Level 1 = read-only. No order placement back into the POS, no inventory awareness, no modifiers in v1. Sets the foundation for Level 2 + 3 later.

**Why Square first**:
- Largest US SMB restaurant POS share
- Cleanest public API (well-documented, stable)
- OAuth flow is standard, no partner application required
- Already have a Square OAuth integration scaffolded in `/dashboard/integrations`

**Explicit non-goals** (these are Level 2+):
- Placing orders back into Square
- Real-time inventory ("we're 86'd on chicken wings")
- Modifiers and variants in detail (small/medium/large, extra cheese, etc.)
- Toast / Clover / Shopify integrations

---

## Architecture

### Database Schema

New table: `tenant_pos_catalogs`

```sql
CREATE TABLE tenant_pos_catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Provider context
  provider text NOT NULL, -- 'square' | 'toast' | 'clover' | 'shopify'
  provider_account_id text NOT NULL, -- Square location ID, etc.

  -- Sync state
  last_synced_at timestamptz,
  last_sync_status text, -- 'success' | 'error' | 'partial'
  last_sync_error text,
  next_sync_at timestamptz,

  -- The catalog snapshot (denormalized for AI consumption)
  catalog jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- shape:
  -- {
  --   "categories": [
  --     {
  --       "name": "Pizzas",
  --       "items": [
  --         {
  --           "id": "square_item_id",
  --           "name": "Margherita Pizza",
  --           "price": 14.99,
  --           "description": "...",
  --           "available": true,
  --           "variations": [{ "name": "Small", "price": 11.99 }, ...]
  --         }
  --       ]
  --     }
  --   ],
  --   "synced_at": "2026-04-16T10:00:00Z"
  -- }

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(business_id, provider, provider_account_id)
);

CREATE INDEX idx_pos_catalogs_business ON tenant_pos_catalogs(business_id);
CREATE INDEX idx_pos_catalogs_next_sync ON tenant_pos_catalogs(next_sync_at) WHERE next_sync_at IS NOT NULL;

ALTER TABLE tenant_pos_catalogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_members_view_own_catalog"
  ON tenant_pos_catalogs FOR SELECT
  USING (business_id IN (SELECT business_id FROM business_users WHERE user_id = auth.uid()));

CREATE POLICY "service_role_manages_catalog"
  ON tenant_pos_catalogs FOR ALL
  USING (auth.role() = 'service_role');
```

`business_integrations` table (likely already exists for Square OAuth tokens) gets used as the auth source — no new auth schema needed.

### Library: Square Catalog Client

New file: `src/lib/pos/square-catalog.ts`

Wraps the Square Catalog API. Same pattern as `src/lib/sms/twilio-client.ts` — direct REST via fetch, no Square SDK needed.

```ts
const SQUARE_API_BASE = 'https://connect.squareup.com/v2'

interface SquareItem {
  id: string
  name: string
  description?: string
  category_id?: string
  variations: Array<{ id: string; name: string; price_money?: { amount: number, currency: string } }>
  available?: boolean
}

interface SquareCategory {
  id: string
  name: string
}

interface NormalizedCatalog {
  categories: Array<{
    name: string
    items: Array<{
      id: string
      name: string
      description?: string
      price: number // dollars, not cents
      available: boolean
      variations: Array<{ name: string; price: number }>
    }>
  }>
  synced_at: string
}

export async function fetchSquareCatalog(accessToken: string): Promise<NormalizedCatalog> {
  // 1. GET /v2/catalog/list?types=ITEM,CATEGORY → paginated
  // 2. Build a category lookup
  // 3. For each ITEM, normalize variations + prices (cents → dollars)
  // 4. Group items by category
  // 5. Return NormalizedCatalog
}

export async function syncCatalogForBusiness(
  businessId: string,
  squareAccessToken: string,
  squareLocationId: string
): Promise<{ success: boolean; itemCount: number; error?: string }> {
  try {
    const catalog = await fetchSquareCatalog(squareAccessToken)
    await supabase
      .from('tenant_pos_catalogs')
      .upsert({
        business_id: businessId,
        provider: 'square',
        provider_account_id: squareLocationId,
        catalog,
        last_synced_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_sync_error: null,
        next_sync_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'business_id,provider,provider_account_id' })

    return { success: true, itemCount: catalog.categories.flatMap(c => c.items).length }
  } catch (err: any) {
    await supabase.from('tenant_pos_catalogs').upsert({
      business_id: businessId,
      provider: 'square',
      provider_account_id: squareLocationId,
      last_sync_status: 'error',
      last_sync_error: err.message,
      next_sync_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // retry sooner on error
    })
    return { success: false, itemCount: 0, error: err.message }
  }
}
```

### Sync Strategy

Three triggers for sync:

1. **Initial sync on OAuth connect** — fire `syncCatalogForBusiness()` immediately when tenant connects Square
2. **Daily cron** — `/api/cron/pos-catalog-sync` runs every 24 hours, syncs every business with `next_sync_at < now()`
3. **Manual refresh** — button on `/dashboard/integrations` for tenant to force-resync

### Cron Endpoint

New file: `src/app/api/cron/pos-catalog-sync/route.ts`

```ts
export async function GET(req: NextRequest) {
  // Auth: CRON_SECRET or vercel-cron user-agent
  const { data: due } = await supabase
    .from('tenant_pos_catalogs')
    .select('business_id, provider, provider_account_id')
    .lte('next_sync_at', new Date().toISOString())
    .limit(100) // batch, run again next interval if more

  for (const row of due || []) {
    if (row.provider !== 'square') continue
    const { data: integration } = await supabase
      .from('business_integrations')
      .select('credentials')
      .eq('business_id', row.business_id)
      .eq('platform', 'square')
      .single()
    if (!integration?.credentials?.access_token) continue
    await syncCatalogForBusiness(
      row.business_id,
      integration.credentials.access_token,
      row.provider_account_id
    )
  }
  return NextResponse.json({ synced: due?.length ?? 0 })
}
```

Add to `vercel.json`:
```json
{ "path": "/api/cron/pos-catalog-sync", "schedule": "0 6 * * *" }
```

(6am UTC daily — late enough that any restaurant that updates their menu before opening has the new data by call time.)

### AI Prompt Injection

When VAPI calls the phone employee webhook (`/api/webhooks/phone-employee`), the system prompt for `order-taker` and `restaurant-host` job types should include the latest catalog.

Today the webhook builds a system prompt from the employee's `job_config`. Add a fetch step that pulls the latest catalog from `tenant_pos_catalogs` and injects it as a `<menu>` block:

```
## Current Menu (synced from Square at 2026-04-16 06:00 UTC)

### Pizzas
- Margherita Pizza — $14.99 (Small $11.99, Large $18.99)
  Fresh mozzarella, tomato, basil
- Pepperoni Pizza — $15.99 (Small $12.99, Large $19.99)

### Pastas
- Spaghetti Bolognese — $13.99
...

When taking an order, only suggest items from this menu. Quote the prices
exactly as listed. If a customer asks for something not on the menu,
politely say "I don't see that on our menu — would you like one of these
similar items?"
```

This is a token-budget concern for restaurants with 200+ items. Mitigation: only inject the categories the AI is being asked about (intent-based filtering) OR truncate to the top N items + a "see more" disclaimer. For Level 1, just inject everything and watch the token usage.

### Dashboard UI

`/dashboard/integrations` (existing page) gets enhanced for Square:

When Square is connected:
```
┌────────────────────────────────────────────────────────────────┐
│ Square                                            [Connected]  │
│ Last synced: 4 hours ago · 87 menu items                       │
│ Next sync: tomorrow at 6:00 AM                                 │
│                                                                 │
│ [Refresh Now]  [View Menu]  [Disconnect]                       │
└────────────────────────────────────────────────────────────────┘
```

"View Menu" opens a modal showing the synced catalog so the tenant can verify what the AI sees.

### Maya Awareness

Update Maya's dashboard system prompt for restaurant tenants:
- Knows when catalog was last synced
- Knows item count
- Can answer "what's on my menu?"
- Can suggest a manual refresh if items look stale

---

## Implementation Order (~1-2 weeks)

**Week 1**:
1. Schema migration — `tenant_pos_catalogs` table + RLS
2. Library — `src/lib/pos/square-catalog.ts` — `fetchSquareCatalog` + `syncCatalogForBusiness`
3. Wire initial sync into Square OAuth callback (when tenant connects)
4. Test against a Square sandbox account

**Week 2**:
5. Cron endpoint — `/api/cron/pos-catalog-sync` + vercel.json schedule
6. Integrate catalog into VAPI system prompt for order-taker employees
7. Dashboard UI on `/dashboard/integrations` — sync status + manual refresh + view menu modal
8. Maya prompt awareness
9. End-to-end test: connect Square → sync → call the AI → order an item that exists → verify price quoted matches Square
10. Documentation for first restaurant beta tenant

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Restaurant has 500+ items → AI prompt blows token budget | For v1, hard cap at 200 items in the injected prompt with a disclaimer. For v2, build category-aware filtering. |
| Square access token expires → silent sync failures | Refresh token flow on OAuth (Square supports it). Notify tenant via email if sync fails 3+ times consecutively. |
| Tenant changes prices but cron hasn't run → AI quotes old price | "View Menu" + "Refresh Now" button gives tenant control. Manual refresh on demand via dashboard. |
| AI suggests an item that's been removed → angry customer | Mark items with `available: false` and tell AI: "Items marked unavailable should never be suggested." For Level 1 we're trusting the catalog; for inventory accuracy we need Level 3. |
| Sync runs during a restaurant's peak hours and slows things down | Schedule at 6am UTC = 1-2am local US time. Manual refresh is on-demand and tenant-initiated, so no surprise load. |

---

## Future Work — Levels 2 and 3

### Level 2 — Order Placement (3-4 weeks)

The AI not only takes the order but creates a real Square order:
- Use Square `Orders API` to POST a draft order with items + variations + modifiers
- Capture customer phone for SMS receipt
- Optional: trigger payment hold via Square Online (for pickup) or direct kitchen ticket print
- Modifiers handled (small/medium/large, extra cheese, no onions, etc.)
- Open question: how does payment work? Pre-auth? Pay at pickup? Cash on delivery?

Adds significant complexity — modifiers and variants are the hard part. Each restaurant configures these differently in Square.

### Level 3 — Inventory Awareness (5-6 weeks)

- Subscribe to Square `Inventory` webhooks
- Cache inventory state per item
- AI knows in real-time what's 86'd
- Graceful "we're out of pepperoni today" handling

This is what enterprise restaurant chatbots (Domino's, Pizza Hut) do. Probably overkill for SMB until you have 50+ restaurant tenants.

### Multi-POS Expansion

When Square is proven and stable, evaluate:
- **Toast** — apply for partner API; mostly enterprise restaurants
- **Clover** — solid mid-market option, similar API shape to Square
- **Shopify** — mostly e-commerce, but a few restaurants use Shopify POS

Each is 1-2 weeks of incremental work. Build only when there's demand.

---

## Open Questions for Erik

1. **When does restaurant vertical actually open?** This work doesn't make sense to ship until we're targeting restaurants in beta. If that's 6+ months away, skip building this entirely for now.
2. **Should we charge extra for POS sync?** Some platforms charge $50-100/mo for "POS integration." Could be a Pro-tier feature or add-on.
3. **Square sandbox testing — do you have a Square sandbox account?** Will need one for development.
4. **Multi-location restaurants** — most chains have one Square account per location. The location-aware multi-tenant design (see `multi-location.md` scope) needs to handle this. Probably waits for the multi-location work to land first.

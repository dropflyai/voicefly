# Multi-Location Support — Login Switcher (Option B)

**Status**: Scoped, deferred until first chain prospect signs
**Verticals**: Salons, dental groups, med spa chains, restaurant chains
**Effort**: ~1-2 weeks of focused work
**Trigger to build**: First multi-location prospect either signs (or commits in writing) to ~$200+/mo per location

---

## Problem

A salon chain owner with 3 locations today must:
- Maintain 3 separate VoiceFly logins
- Forward 3 different business numbers to 3 different VoiceFly numbers
- Get 3 separate Stripe invoices
- Have no consolidated view of "how is the chain doing"
- Configure each location's AI separately, repeating themselves

This kills the "one place to manage everything" pitch and pushes chains to enterprise platforms.

## Solution Summary

One login for the chain owner. A location picker in the dashboard nav. Every dashboard query becomes location-aware. New roles: `chain_owner` (sees all) and `location_manager` (sees one). Aggregated chain dashboard view.

**Explicit non-goals** (these are Option C / enterprise):
- Cross-location reporting comparisons (e.g. "which location performs best")
- Consolidated billing rollup
- Per-location custom domains / white-label

---

## What Already Exists

Good news — the data model is mostly in place:

- `businesses.parent_business_id` — links a location to its parent business
- `businesses.is_location` — boolean flag
- `businesses.location_name` — short label like "Downtown" or "Midtown"
- `locations` table + `LocationAPIImpl` — separate concept, may be redundant or complementary
- `business_users` table with `role` field — currently 'owner', 'admin', 'manager', 'member'
- `/dashboard/locations` page exists (uses `LocationAPIImpl`)
- Twilio subaccount fields on businesses (`twilio_subaccount_sid`) — can isolate billing per location

What's missing is mostly UI plumbing: every dashboard query assumes one business; the user can only ever see one at a time.

## Open Architectural Question (Resolve Before Building)

**Are locations separate `businesses` records (with `parent_business_id`) OR are they rows in the `locations` table?**

Both seem to exist in the codebase, which suggests the original architect started one way and pivoted (or never finished). Before building, audit:
- Which approach has more downstream code dependencies (employees, calls, appointments)?
- Pick one. Migrate the other away.

My read: `parent_business_id` on `businesses` is the cleaner model because every business-scoped table (phone_employees, employee_calls, appointments, business_hours, etc.) already takes `business_id`. Each location being its own business record means zero changes to those tables.

The `locations` table seems vestigial and should probably be archived.

---

## Architecture (Assuming `parent_business_id` Wins)

### Schema Updates

```sql
-- Extend role enum
ALTER TABLE business_users
  DROP CONSTRAINT IF EXISTS business_users_role_check;

ALTER TABLE business_users
  ADD CONSTRAINT business_users_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'member', 'chain_owner', 'location_manager'));

-- New helper view: businesses + their locations
CREATE OR REPLACE VIEW business_with_locations AS
SELECT
  b.id, b.name, b.business_type, b.parent_business_id, b.is_location,
  b.location_name, b.subscription_tier, b.subscription_status,
  COALESCE(b.parent_business_id, b.id) AS chain_root_id
FROM businesses b;

-- Helper RPC: get all businesses a user can access (parent + locations)
CREATE OR REPLACE FUNCTION get_user_accessible_businesses(p_user_id uuid)
RETURNS SETOF businesses
LANGUAGE sql STABLE
AS $$
  WITH user_memberships AS (
    SELECT business_id, role FROM business_users WHERE user_id = p_user_id
  ),
  -- For each direct membership, also include child locations if role is chain_owner
  accessible AS (
    SELECT b.* FROM businesses b
    JOIN user_memberships um ON um.business_id = b.id
    UNION
    SELECT b.* FROM businesses b
    JOIN user_memberships um
      ON b.parent_business_id = um.business_id
     AND um.role IN ('chain_owner', 'owner')
  )
  SELECT * FROM accessible;
$$;
```

### Frontend: Location Picker Component

New component in `src/components/LocationSwitcher.tsx`:

```
Sidebar (top, above nav):
┌──────────────────────────────────┐
│ [Acme Salon Chain  ▾]            │
└──────────────────────────────────┘
   ┌─ Dropdown when open ─────────┐
   │ All Locations (chain view)   │
   │ ──────────────────────────── │
   │ ✓ Downtown                   │
   │   Midtown                    │
   │   Westside                   │
   │ ──────────────────────────── │
   │ + Add new location           │
   └──────────────────────────────┘
```

Selecting a location stores the choice in localStorage (`active_business_id`). Every dashboard query reads from this. `getSecureBusinessId()` already exists and is the natural place to apply it.

### Backend: Location-Aware Queries

Today every dashboard query reads:
```ts
const businessId = getSecureBusinessId()
```

Doesn't change at the call site. What changes is `getSecureBusinessId()` — it now returns whatever business is "active" per the LocationSwitcher (default: first business in user's `get_user_accessible_businesses` result).

Auth validation in `validateBusinessAccess(req, businessId)` needs to check that `businessId` is in the user's accessible list (parent OR child if chain_owner).

### Aggregated Chain View

When the user picks "All Locations" in the switcher, the dashboard shows:
- Total calls across all locations today
- Total appointments across all locations today
- Per-location summary cards: "Downtown — 12 calls, 5 appts" with a link to drill into that location

New route: `/dashboard/chain` (only accessible to chain_owner role).

Implementation: each Supabase query takes a list of business_ids instead of one. Refactor `loadDashboardData()` to accept `businessIds: string[]` and use `.in('business_id', businessIds)` instead of `.eq()`.

### Roles & Permissions

| Role | Can see | Can edit |
|---|---|---|
| chain_owner | All locations + chain view | All locations |
| owner | This business only | This business |
| admin | This business only | This business |
| manager | This business only | Limited (no billing) |
| location_manager | This location only | Limited (no billing, no employee creation) |
| member | This business only | Read-only |

### Onboarding Flow Changes

When a chain owner signs up, they:
1. Create the parent business (chain) — no phone employee yet
2. Add locations one at a time (each gets its own AI employee + phone number)
3. Optionally invite a location_manager per location

UI: new "Add location" flow under `/dashboard/locations` (page already exists, needs polish).

### Billing

**Open question** — need product decision:

- Option A: One subscription, billed per-location ($129/location/mo for Growth chain)
- Option B: Volume discount (3 locations = 2.5x single price)
- Option C: Enterprise tier ($499/mo for unlimited locations + dedicated support)

For first chain prospect, default to A. They pay 3x Growth = $387/mo. If they push back, negotiate.

---

## Implementation Order (~1-2 weeks)

**Week 1**:
1. Audit `locations` table vs `parent_business_id` — pick winner (likely the latter); document migration plan for the other
2. Schema migration — extend role enum, create `get_user_accessible_businesses` RPC
3. Refactor `getSecureBusinessId()` to support multi-business users
4. Build `LocationSwitcher` component
5. Wire into `Layout.tsx` sidebar (above nav)
6. Update `validateBusinessAccess` to handle chain access

**Week 2**:
7. Build `/dashboard/chain` aggregated view
8. Refactor `loadDashboardData` to accept `businessIds: string[]`
9. Polish `/dashboard/locations` (add/edit/remove locations)
10. Add invite flow for location_manager
11. End-to-end test with a 3-location test chain
12. Update Maya prompts: aware of chain context, can switch context per location

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `locations` table vs `parent_business_id` ambiguity causes data drift | Audit + pick + migrate before any new code. Add a release-note doc explaining the chosen model. |
| chain_owner accidentally edits the wrong location | Show big "Editing: Downtown location" banner at top of dashboard when in single-location mode |
| Per-location billing feels punitive at SMB scale | Offer 20% volume discount on 2nd+ location at sign |
| Maya gets confused about which location's data to read | Always include location context in Maya's system prompt: "User is currently viewing Downtown location" |

---

## Future Work — Option C (Enterprise Chain Dashboard)

When a chain reaches 10+ locations or pushes for enterprise features:

- Cross-location performance comparison ("Westside misses 30% more calls than Downtown")
- Centralized AI knowledge inheritance (chain-wide policies + per-location overrides)
- Consolidated billing with PO support
- SSO (SAML / Google Workspace / Okta)
- White-label dashboard for franchise chains
- Per-location custom domains
- Dedicated CSM / SLA

Estimated effort: 4-6 weeks on top of Option B. Triggers a higher pricing tier ($999+/mo).

---

## Open Questions for Erik

1. **`locations` table vs `parent_business_id` — which do you intend to use?** Need to pick before any code is written.
2. **Per-location billing model** — A (per-location flat), B (volume discount), or C (enterprise tier)?
3. **Should Maya help chain owners triage across locations?** ("Which location had the most missed calls today?") — would be a nice differentiator
4. **Default behavior for new chain owner** — auto-create one location on signup, or require explicit "Add location" step?

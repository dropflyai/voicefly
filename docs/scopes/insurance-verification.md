# Insurance Verification — Capture + Queue Flow (Option A)

**Status**: Scoped, awaiting decision to ship
**Vertical**: Dental (and adjacent: medical, med spa, optometry)
**Effort**: ~2-3 days of focused work
**Deferred upgrade path**: Real-time clearinghouse verification (Option B) — see "Future Work" section

---

## Problem

Dental front desks spend 30-60 minutes per new patient verifying insurance. It is the #1 reason their phones go to voicemail. Patients calling to book often ask "do you take my insurance?" and the AI today has no way to answer or even capture the info for staff to follow up.

## Solution Summary

The AI captures insurance info during the call, stores it in a verification queue, and tells the caller "I've got your insurance info — we'll verify and call you back to confirm coverage." Staff verifies in batches (typically morning) using a dashboard queue and updates the record with results.

**Explicit non-goals** (these are Option B):
- Real-time eligibility checks during the call
- Out-of-pocket cost quoting on the call
- Direct EDI integration with carriers

---

## Architecture

### Database Schema

New table: `insurance_records`

```sql
CREATE TABLE insurance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Linked sources (at least one populated)
  appointment_id uuid REFERENCES appointments(id),  -- if collected during booking
  call_id text,                                       -- references employee_calls.call_id

  -- Caller identity
  customer_name text,
  customer_phone text,
  customer_dob date,

  -- Insurance details (collected from caller)
  carrier_name text NOT NULL,        -- "Delta Dental", "Aetna", etc.
  member_id text NOT NULL,
  group_number text,
  subscriber_name text,              -- if different from customer
  subscriber_relationship text,       -- 'self', 'spouse', 'parent', 'child'
  subscriber_dob date,

  -- Optional procedure context
  procedure_inquired text,            -- "cleaning", "root canal", "consultation"

  -- Verification state
  status text NOT NULL DEFAULT 'pending',
    -- pending | verified | denied | needs_more_info | archived
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  coverage_notes text,                -- staff notes from verification call
  estimated_patient_responsibility numeric(8, 2),
  estimated_insurance_pays numeric(8, 2),

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insurance_records_business_status
  ON insurance_records(business_id, status);

CREATE INDEX idx_insurance_records_appointment
  ON insurance_records(appointment_id) WHERE appointment_id IS NOT NULL;

ALTER TABLE insurance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_members_view_own_insurance"
  ON insurance_records FOR ALL
  USING (
    business_id IN (
      SELECT business_id FROM business_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service_role_manages_insurance"
  ON insurance_records FOR ALL
  USING (auth.role() = 'service_role');
```

### AI Capture (during call)

Update the AI's job-config prompt for `appointment-scheduler` and `receptionist` job types to add an insurance capture phase. Triggered when:
- Caller is a new patient AND wants to book
- Caller asks "do you take [insurance carrier]?"
- Existing patient wants a procedure-specific quote

**Capture script (added to AI prompt for dental businesses)**:

```
If the caller is booking a new patient appointment OR asks about insurance
coverage, ask for their insurance information BEFORE confirming the booking:

1. "Can I get the name of your dental insurance carrier?"
2. "What's your member ID?"
3. "Do you have a group number? Sometimes it's on the back of your card."
4. "Is the policy in your name, or someone else's?"
   - If someone else: "What's the subscriber's name and date of birth?"
5. "Just to confirm — what procedure are you calling about?"

Then: "I've got all your insurance info — our team will verify your benefits
and call you back today to confirm coverage before your appointment. The
appointment is booked but consider it pending until we verify."

NEVER promise specific coverage amounts. NEVER quote dollar figures.
NEVER say "your insurance covers this." Always say "we'll verify and confirm."
```

The AI calls a new tool `capture_insurance_info` that creates an `insurance_records` row.

### New Tool: `capture_insurance_info`

Add to dashboard tools in `src/lib/a2p/...` or wherever Maya tools live (and to the VAPI assistant function definitions for phone calls):

```ts
{
  name: 'capture_insurance_info',
  description: 'Capture insurance details from a patient during a call. Creates a record for staff to verify later.',
  parameters: z.object({
    customer_name: z.string(),
    customer_phone: z.string(),
    customer_dob: z.string().optional(), // YYYY-MM-DD
    carrier_name: z.string(),
    member_id: z.string(),
    group_number: z.string().optional(),
    subscriber_name: z.string().optional(),
    subscriber_relationship: z.enum(['self', 'spouse', 'parent', 'child', 'other']).optional(),
    subscriber_dob: z.string().optional(),
    procedure_inquired: z.string().optional(),
    appointment_id: z.string().optional(), // link to booked appointment if available
  }),
  execute: async (input) => {
    // INSERT into insurance_records with status='pending'
    // Return { success, record_id, message }
  }
}
```

For VAPI phone employees, this becomes a function call definition the LLM can invoke during the call. Wire through `src/app/api/webhooks/phone-employee/` action handler.

### API Routes

```
POST /api/insurance-records
  body: { businessId, ...insurance fields }
  → creates record (used by AI tool execution)

GET /api/insurance-records?businessId=...&status=pending
  → list records for queue UI

PATCH /api/insurance-records/:id
  body: { status, coverage_notes, estimated_patient_responsibility, estimated_insurance_pays }
  → staff updates after verifying

DELETE /api/insurance-records/:id
  → archive (soft delete via status='archived')
```

### Dashboard UI

New page: `/dashboard/insurance-verifications`

```
┌──────────────────────────────────────────────────────────────────┐
│ Insurance Verifications                                           │
│ Records captured during AI calls — verify and update coverage     │
│                                                                   │
│ [Pending: 7]  [Verified: 23]  [Denied: 2]   [Filter: All ▾]     │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ Sarah Johnson                              [Pending]         │ │
│ │ Delta Dental · #XXX-12345 · Group 778                       │ │
│ │ For: New patient cleaning · Apt: Thu Apr 18 at 2pm          │ │
│ │ Captured 2 hours ago                                         │ │
│ │ [Mark Verified] [Needs More Info] [Open]                    │ │
│ └─────────────────────────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ Michael Chen                               [Pending]         │ │
│ │ Aetna · #YYY-67890                                          │ │
│ │ ...                                                          │ │
│ └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

When a record is opened, show:
- All captured info
- Field for coverage notes (free text)
- Estimated patient responsibility ($)
- Estimated insurance pays ($)
- Status dropdown
- Save → updates record + (optionally) sends caller an SMS confirming verification

### Sidebar Nav

Add nav item in `src/components/Layout.tsx`:

```ts
{
  name: 'Insurance',
  href: '/dashboard/insurance-verifications',
  icon: ShieldCheckIcon,
  requiresVertical: ['dental', 'medical', 'medspa', 'optometry'],
}
```

(Use the same `requiresOrderRelevant` pattern we already built for Orders — this becomes `requiresVertical: string[]`.)

### Notification on New Record

When the AI captures an insurance record, send an email to the business owner:
- Subject: "New insurance verification needed: Sarah Johnson"
- Body: caller name, carrier, member ID, callback phone, deep link to record
- Optional SMS to a designated front-desk phone (uses existing SMS infrastructure)

### Maya Awareness

Update Maya's dashboard system prompt:
- Knows whether the business has dental vertical
- Knows count of pending verifications
- Can answer "how many insurance verifications are waiting?"
- Can navigate user to `/dashboard/insurance-verifications`

---

## Implementation Order (~2-3 days)

**Day 1**:
1. Schema migration — `insurance_records` table + indexes + RLS
2. API routes — POST, GET, PATCH, DELETE
3. AI tool definition — `capture_insurance_info`
4. Wire VAPI assistant function call → API route

**Day 2**:
5. Dashboard page — `/dashboard/insurance-verifications` with queue UI
6. Sidebar nav with vertical gating
7. Notification email when new record arrives
8. Maya prompt awareness

**Day 3**:
9. End-to-end test with a dental tenant account
10. Polish: empty state, mobile layout, status badge colors
11. AI prompt tuning — make sure it doesn't promise coverage
12. Documentation for first dental beta tenant

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI promises specific coverage on the call → patient angry when reality differs | Strong prompt rule: "NEVER quote dollar figures or promise coverage." Beta with one tenant first to verify AI behavior. |
| HIPAA/PHI in DB without proper safeguards | Supabase already encrypts at rest + RLS. Document in privacy policy. Don't log insurance fields in plaintext to console/Sentry. |
| Staff doesn't actually use the queue → records pile up | Daily email digest of pending records. Slack-style notification on new record. |
| AI captures wrong info (mishears member ID) | AI confirms back to caller: "Just to confirm, that's M-E-M-1-2-3-4-5, is that right?" |

---

## Future Work — Option B (Real-Time Verification)

When a dental tenant pushes for "tell me my copay during the call":

**Vendors to evaluate**:
- Onederful (modern REST API, dental-focused)
- Change Healthcare (largest, but slow integrations)
- Availity (free for many payers, harder API)
- pVerify (smaller, dental coverage)
- DentalXChange / Trizetto (legacy)

**Approach**:
- Add `clearinghouse_provider` column to `insurance_records`
- New API route: `POST /api/insurance-records/:id/verify` — calls clearinghouse synchronously
- AI flow: capture info → call verify API → if response within 5s, quote estimated copay; otherwise fall back to "we'll verify and call back"
- Per-call cost (~$0.25-$1.50) — eat it on Pro plan, charge as add-on for Starter/Growth
- HIPAA: real BAA with clearinghouse, additional access controls
- Estimated effort: 4-6 weeks

**Trigger to build**: 5+ paying dental customers, or one customer willing to pay a $50/mo upcharge for the feature.

---

## Resolved Decisions (2026-04-16)

1. **Med spas — skip insurance.** Med spa procedures are ~90% cash/credit/HSA/FSA. Capture payment method + HSA/FSA eligibility instead. Revisit if a specific med spa tenant pushes for insurance.
2. **SMS confirmation back to patient after verification — YES, build it.** When staff marks a record as `verified` (or `denied` / `needs_more_info`), auto-send SMS to the patient with status + estimated patient responsibility. Routes through `sendSmsForBusiness()` so it respects the tenant's A2P state and SMS quota. See "SMS Back to Patient" section below.
3. **Verify-by deadline in queue UI — YES, build it.** Each pending record gets a red/yellow/green urgency badge based on days until the linked appointment. Staff works red ones first.

## SMS Back to Patient — Implementation

When the PATCH route updates a record's status to `verified` or `denied`:

1. Look up the linked appointment (if any) and the patient's phone
2. Build a tenant-branded SMS body:
   - Verified: `"Hi {customer_name}, your {carrier_name} coverage is confirmed for your appointment {appointment_date} at {appointment_time}. Estimated cost: ${estimated_patient_responsibility} out of pocket. Reply STOP to opt out. — {business_name}"`
   - Denied: `"Hi {customer_name}, we weren't able to verify your {carrier_name} coverage for {appointment_date}. Please call us at {business_phone} so we can help. — {business_name}"`
   - Needs more info: `"Hi {customer_name}, we need a bit more info to verify your {carrier_name} coverage. Please call us at {business_phone} when you have a moment. — {business_name}"`
3. Call `sendSmsForBusiness({ businessId, to: customer_phone, from: tenant_phone, body })`
4. If `result.blocked === 'sms_not_enabled'`, log + show toast in dashboard: "SMS not active — staff will need to call patient manually"
5. If `result.blocked === 'quota_exceeded'`, same as above
6. Set new column `insurance_records.patient_notified_at` on success

Schema addition:
```sql
ALTER TABLE insurance_records
  ADD COLUMN IF NOT EXISTS patient_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS patient_notification_status text; -- 'sent' | 'blocked_no_sms' | 'blocked_quota' | 'failed'
```

Dashboard UI: show "✓ Patient notified" or "⚠️ SMS blocked — call manually" next to verified records.

Edge case: tenant doesn't have SMS enabled (A2P not yet approved) — just show the manual-call warning. Don't block verification.

## Verify-By Deadline — Implementation

In the queue UI, compute urgency from the linked appointment (if present):

```ts
function computeUrgency(record: InsuranceRecord, appointment?: Appointment): 'red' | 'yellow' | 'green' | 'no_appointment' {
  if (!appointment) return 'no_appointment'
  const daysUntil = differenceInDays(parseISO(appointment.appointment_date), new Date())
  if (daysUntil <= 1) return 'red'      // appointment is today or tomorrow
  if (daysUntil <= 5) return 'yellow'   // within next 5 days
  return 'green'                         // 6+ days out
}
```

Default queue sort: red → yellow → green → no_appointment, then by `created_at` descending within each tier.

Visual treatment in the queue:
- 🔴 Red border + "Verify today" badge for records with appointment ≤ 1 day
- 🟡 Yellow border + "Verify by [date]" badge for records with appointment 2-5 days out
- 🟢 Green border + "Not urgent" subtext for records with appointment > 5 days
- ⚫ Gray "No appointment linked" badge if `appointment_id` is null (rare — usually means AI captured insurance for a question, not a booking)

Staff visual scan = "what do I do first" answered in 2 seconds.

Optional: daily morning email digest — "You have 3 records to verify TODAY: Sarah Johnson (2pm), Michael Chen (4pm), Lisa Park (6pm)."

## Open Questions for Erik

(All previous open questions resolved. Add new ones here as they come up during implementation.)

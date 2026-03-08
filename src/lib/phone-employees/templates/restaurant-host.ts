/**
 * Restaurant Host Employee Template
 *
 * A warm, hospitable AI phone host that can:
 * - Handle reservations (book, modify, cancel)
 * - Manage the waitlist
 * - Answer dining inquiries
 * - Handle special occasions
 * - Cross-sell to order line for takeout/delivery
 */

import { EmployeeConfig, RestaurantHostConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateRestaurantHostPrompt(config: EmployeeConfig, jobConfig: RestaurantHostConfig): string {
  const restaurantName = jobConfig.restaurantName || 'the restaurant'

  // Build hours summary from reservation slots
  const hoursLines = (jobConfig.reservationSlots || []).map(slot => {
    const day = slot.day.charAt(0).toUpperCase() + slot.day.slice(1)
    return `- ${day}: ${formatTime(slot.openTime)} – ${formatTime(slot.closeTime)}`
  })

  const depositNote = jobConfig.depositRequired
    ? `\n- Parties of ${jobConfig.depositRequired.partySize} or more require a $${jobConfig.depositRequired.amount} deposit to secure the reservation.`
    : ''

  const specialtiesNote = jobConfig.specialties?.length
    ? `\n## Signature Dishes & Specials\n${jobConfig.specialties.map(s => `- ${s}`).join('\n')}`
    : ''

  const parkingNote = jobConfig.parkingInfo
    ? `\n## Parking\n${jobConfig.parkingInfo}`
    : ''

  const dresscodeNote = jobConfig.dressCode
    ? `\n## Dress Code\n${jobConfig.dressCode}`
    : ''

  const cancellationNote = jobConfig.cancellationPolicy
    ? `\n## Cancellation Policy\n${jobConfig.cancellationPolicy}`
    : ''

  const noShowNote = jobConfig.noShowPolicy
    ? `\n## No-Show Policy\n${jobConfig.noShowPolicy}`
    : ''

  const transferNote = jobConfig.orderTakerTransferPhone
    ? `\n## Takeout & Delivery Orders\nIf a caller is looking to place a takeout or delivery order (not a dine-in reservation), warmly offer to transfer them to our order line. Use the transferCall function with destination "order line".`
    : ''

  return `You are ${config.name}, the gracious phone host for ${restaurantName}. Your voice is warm, welcoming, and genuinely excited to help guests have a wonderful dining experience.

## Your Role
You handle all reservation-related calls for ${restaurantName}:
1. Book reservations for guests
2. Check availability for requested dates and party sizes
3. Modify existing reservations (date, time, party size)
4. Cancel reservations when needed
5. Add guests to the waitlist when fully booked
6. Answer questions about the restaurant, menu, parking, and policies
7. Note special occasions and ensure the team can make them memorable

## Greeting
Always start with: "${jobConfig.greeting}"

## Personality
- Tone: ${config.personality.tone}
- Be ${config.personality.enthusiasm === 'high' ? 'enthusiastic and genuinely excited' : config.personality.enthusiasm === 'medium' ? 'warm and gracious' : 'calm and refined'}
- ${config.personality.formality === 'formal' ? 'Use formal language — address guests as "Mr./Ms." when you have their name' : config.personality.formality === 'semi-formal' ? 'Be professional yet personable' : 'Be conversational and approachable'}
- Speak like a real restaurant host — not a call center agent

## Restaurant Capacity & Policies
- Total seating capacity: ${jobConfig.tableCapacity} seats
- Maximum party size accepted: ${jobConfig.partyMaxSize} guests${depositNote}
${hoursLines.length ? `\n## Reservation Hours\n${hoursLines.join('\n')}` : ''}
${cancellationNote}${noShowNote}${dresscodeNote}${parkingNote}${specialtiesNote}${transferNote}

## Handling Reservations

### Booking a New Reservation
1. Ask for the date, time preference, and party size
2. Use checkReservationAvailability to confirm availability
3. If available, collect: guest name, phone number, email (optional)
4. Ask if there is a special occasion (birthday, anniversary, proposal, etc.)
5. Ask for any special requests (dietary needs, seating preferences, high chair, etc.)
6. Use bookReservation to confirm the booking
7. Read back the details: date, time, party size, and any special notes
8. Let the guest know a confirmation will be sent to their phone
${jobConfig.depositRequired ? `\nFor parties of ${jobConfig.depositRequired.partySize} or more: inform the guest that a $${jobConfig.depositRequired.amount} deposit is required to secure the reservation. Collect this information and note it.` : ''}

### Special Occasions
${jobConfig.specialOccasionsEnabled ? `When a guest mentions a birthday, anniversary, engagement, or other celebration:
1. Express excitement: "How wonderful! We'd love to help make that evening special."
2. Ask if they'd like the team to know so they can arrange something special
3. Note the occasion in the booking using the specialOccasion field in bookReservation
4. Mention any relevant special touches (e.g., candles, a complimentary dessert plate)` : 'Ask about special requests when booking but keep it brief.'}

### Modifying a Reservation
1. Verify the guest by name and phone number
2. Ask what they'd like to change (date, time, party size)
3. If changing date/time, check availability first
4. Use modifyReservation to apply the changes
5. Confirm the updated details

### Cancellations
1. Verify the guest by name and phone number
2. Express understanding — "Of course, I'll take care of that for you."
3. Use cancelReservation to process it
4. Offer to rebook for a future date
${jobConfig.cancellationPolicy ? `5. Mention the cancellation policy if relevant: ${jobConfig.cancellationPolicy}` : ''}

### Waitlist
${jobConfig.waitlistEnabled ? `When the restaurant is fully booked:
1. Let the guest know we're fully booked for that date/time
2. Offer the waitlist: "We do have a waitlist — would you like me to add you? We'll call you right away if a table becomes available."
3. Collect name, phone, party size, preferred date/time
4. Use addToWaitlist to record them
5. Let them know we'll contact them as soon as a table opens up` : 'If fully booked, let the guest know and suggest they try another date.'}

## Functions Available
- checkReservationAvailability: Check open slots for a date and party size
- bookReservation: Confirm a new reservation
- cancelReservation: Cancel an existing reservation
- modifyReservation: Change date, time, or party size on an existing reservation
- addToWaitlist: Add a guest to the waitlist
- transferCall: Transfer to staff or order line
- captureLeadInfo: Record contact info for a caller not ready to book

## Important Guidelines
- Always confirm reservation details by reading them back before finalizing
- If the caller's preferred time isn't available, proactively suggest the nearest alternatives
- Never leave a caller without a next step — book, waitlist, or callback
- Keep the conversation warm and unhurried — dining reservations are exciting for guests
- If asked about the menu in detail, you can share the signature dishes but recommend visiting the website or asking the team on arrival for full details

You represent ${restaurantName}. Make every caller feel like a welcomed guest before they even walk through the door.`
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultRestaurantHostConfig(restaurantName: string): RestaurantHostConfig {
  return {
    type: 'restaurant-host',
    restaurantName,
    greeting: `Thank you for calling ${restaurantName}! How can I help you today?`,
    tableCapacity: 60,
    partyMaxSize: 12,
    reservationSlots: [
      { day: 'tuesday', openTime: '17:00', closeTime: '21:30', slotIntervalMinutes: 30 },
      { day: 'wednesday', openTime: '17:00', closeTime: '21:30', slotIntervalMinutes: 30 },
      { day: 'thursday', openTime: '17:00', closeTime: '21:30', slotIntervalMinutes: 30 },
      { day: 'friday', openTime: '17:00', closeTime: '22:00', slotIntervalMinutes: 30 },
      { day: 'saturday', openTime: '12:00', closeTime: '22:00', slotIntervalMinutes: 30 },
      { day: 'sunday', openTime: '12:00', closeTime: '20:00', slotIntervalMinutes: 30 },
    ],
    waitlistEnabled: true,
    specialOccasionsEnabled: true,
    cancellationPolicy: 'Please cancel at least 2 hours in advance.',
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const RESTAURANT_HOST_FUNCTIONS = [
  {
    name: 'checkReservationAvailability',
    description: 'Check available reservation times for a specific date and party size',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to check (YYYY-MM-DD)' },
        partySize: { type: 'number', description: 'Number of guests' },
        preferredTime: { type: 'string', description: 'Preferred time (HH:MM), optional' },
      },
      required: ['date', 'partySize'],
    },
  },
  {
    name: 'bookReservation',
    description: 'Book a reservation for a guest',
    parameters: {
      type: 'object',
      properties: {
        guestName: { type: 'string', description: "Guest's full name" },
        guestPhone: { type: 'string', description: "Guest's phone number" },
        guestEmail: { type: 'string', description: "Guest's email (optional)" },
        date: { type: 'string', description: 'Reservation date (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Reservation time (HH:MM)' },
        partySize: { type: 'number', description: 'Number of guests' },
        specialOccasion: { type: 'string', description: 'Special occasion (birthday, anniversary, etc.), optional' },
        specialRequests: { type: 'string', description: 'Dietary restrictions, seating preferences, etc., optional' },
      },
      required: ['guestName', 'guestPhone', 'date', 'time', 'partySize'],
    },
  },
  {
    name: 'cancelReservation',
    description: 'Cancel an existing reservation',
    parameters: {
      type: 'object',
      properties: {
        guestName: { type: 'string', description: "Guest's name" },
        guestPhone: { type: 'string', description: "Guest's phone number" },
        date: { type: 'string', description: 'Reservation date (YYYY-MM-DD)' },
        time: { type: 'string', description: 'Reservation time (HH:MM)' },
      },
      required: ['guestName', 'guestPhone'],
    },
  },
  {
    name: 'modifyReservation',
    description: 'Modify an existing reservation (date, time, party size)',
    parameters: {
      type: 'object',
      properties: {
        guestName: { type: 'string', description: "Guest's name" },
        guestPhone: { type: 'string', description: "Guest's phone number" },
        newDate: { type: 'string', description: 'New date (YYYY-MM-DD)' },
        newTime: { type: 'string', description: 'New time (HH:MM)' },
        newPartySize: { type: 'number', description: 'New party size' },
      },
      required: ['guestName', 'guestPhone'],
    },
  },
  {
    name: 'addToWaitlist',
    description: 'Add a guest to the waitlist when no immediate availability exists',
    parameters: {
      type: 'object',
      properties: {
        guestName: { type: 'string', description: "Guest's name" },
        guestPhone: { type: 'string', description: "Guest's phone number" },
        partySize: { type: 'number', description: 'Number of guests' },
        preferredDate: { type: 'string', description: 'Preferred date (YYYY-MM-DD)' },
        preferredTime: { type: 'string', description: 'Preferred time (HH:MM)' },
      },
      required: ['guestName', 'guestPhone', 'partySize'],
    },
  },
  {
    name: 'captureLeadInfo',
    description: 'Record contact information for a caller who is not ready to book',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: "Caller's full name" },
        phone: { type: 'string', description: "Caller's phone number" },
        email: { type: 'string', description: "Caller's email address (optional)" },
        interestedIn: { type: 'string', description: 'What they are interested in (optional)' },
        notes: { type: 'string', description: 'Any additional notes (optional)' },
      },
      required: ['name', 'phone'],
    },
  },
  {
    name: 'transferCall',
    description: 'Transfer to staff or order line',
    parameters: {
      type: 'object',
      properties: {
        destination: { type: 'string', description: 'Who to transfer to' },
        reason: { type: 'string', description: 'Reason for transfer' },
      },
      required: ['destination'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createRestaurantHostEmployee(params: {
  businessId: string
  restaurantName: string
  name?: string
  customConfig?: Partial<RestaurantHostConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultRestaurantHostConfig(params.restaurantName)
  const jobConfig: RestaurantHostConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'restaurant-host',
  }

  return {
    businessId: params.businessId,
    name: (params.name || 'Sofia').substring(0, 40),
    jobType: 'restaurant-host',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'aVR2rUXJY4MTezzJjPyQ',
      speed: 1.0,
      stability: 0.8,
    },

    personality: params.personality || {
      tone: 'warm',
      enthusiasm: 'medium',
      formality: 'semi-formal',
    },

    schedule: {
      timezone: 'America/Los_Angeles',
      businessHours: {
        monday: null,
        tuesday: { start: '17:00', end: '22:00' },
        wednesday: { start: '17:00', end: '22:00' },
        thursday: { start: '17:00', end: '22:00' },
        friday: { start: '17:00', end: '23:00' },
        saturday: { start: '12:00', end: '23:00' },
        sunday: { start: '12:00', end: '21:00' },
      },
      afterHoursMessage: `Thank you for calling ${params.restaurantName}. We are currently closed. Please call back during our reservation hours or visit our website to check availability.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['restaurant-host'],
    jobConfig,
    isActive: true,
  }
}

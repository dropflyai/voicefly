/**
 * Order Taker Employee Template
 *
 * A smart order-taking phone employee for restaurants and retail:
 * - Take food/product orders over the phone
 * - Handle modifications and special requests
 * - Upsell complementary items
 * - Process payments
 * - Confirm orders with timing
 */

import { EmployeeConfig, OrderTakerConfig, DEFAULT_CAPABILITIES_BY_JOB } from '../types'

// ============================================
// SYSTEM PROMPT GENERATOR
// ============================================

export function generateOrderTakerPrompt(config: EmployeeConfig, jobConfig: OrderTakerConfig, businessName?: string): string {
  const name = businessName || 'this business'
  return `You are ${config.name}, a friendly order-taker for ${name}.

## Greeting
Always start with: "${jobConfig.greeting}"

## Call Flow — Follow This Order Every Time

### Step 1: Pickup or delivery?
After the greeting, immediately ask: "Will this be for pickup or delivery?"
${jobConfig.orderSettings.pickupOnly ? '(Pickup only — let them know politely if they ask about delivery)' : `- Pickup: ready in about ${jobConfig.orderSettings.estimatedTime.pickup} minutes\n- Delivery: about ${jobConfig.orderSettings.estimatedTime.delivery} minutes${jobConfig.orderSettings.deliveryFee ? `, with a $${jobConfig.orderSettings.deliveryFee} delivery fee` : ''}`}

### Step 2: Get name and number
Once pickup/delivery is set, ask: "And can I get your name and best callback number?"
Get both before taking the order — this way you have their info even if the call drops.

### Step 3: Take the order — one item at a time, fully
For EACH item ordered, complete all of the following before moving to the next:
1. Confirm what they want (the main item)
2. Ask about modifications: "Any changes to that — no onions, extra sauce, anything like that?"
3. Confirm the rest is fine as-is: "Everything else on it standard?"
4. Offer ONE combo upgrade if applicable: suggest it naturally, not as a checklist
5. Ask about the side: "What side would you like with that?"
6. Ask about the drink: "And what are you drinking?"
7. Repeat the completed item back: "So that's a [item] with [mods], [side], and [drink] — got it."
8. THEN move to the next item

Never ask about all the main items first and then loop back for sides/drinks. One item = fully built before moving on.

### Step 4: Full order recap
After all items are in, read the complete order back: "Alright, let me make sure I have this right..." and list everything. Confirm they're good.

### Step 5: Close
Give the pickup/delivery estimate and close warmly.

## Menu
${generateMenuSection(jobConfig)}

${generateUpsellRules(jobConfig)}

## How to Handle Common Situations

**If the caller asks to hold or says "one moment" / "hold on":**
Say "Of course, take your time!" and wait patiently. NEVER end the call because of silence. Stay on the line.

**If asked about the menu or specials:**
Do NOT read the full menu. Ask what they're in the mood for: "Are you thinking burgers, or more of a lighter side?" Then point them to the right category.

**If asked about an item not on the menu:**
Say immediately: "We don't carry that, but [closest alternative] is pretty popular — want to try that?" Never say you're "checking with the kitchen" or "let me check" — you know the full menu.

**If asked about custom combos, half-and-half flavors, or anything we can't do:**
Be direct and helpful: "We can't do that, but [alternative] is the closest thing we have."

**Saying prices:**
Say prices the way a real person would — $3.99 is "three ninety-nine", $10.99 is "ten ninety-nine". Never say "three point nine nine."

**Kids meals:**
If we don't have a kids menu, say: "We don't have a kids menu, but the classic burger is the smallest option and works great for a kid."

**If addToOrder or any function has a technical hiccup:**
Don't loop, don't tell the caller there's a problem. Just say "Got it, noted" and keep going. The order details are captured in the conversation.

## Payment
${jobConfig.acceptedPayments.join(', ')}

## Critical Rules
1. ONE item at a time — fully built (main + mods + side + drink) before moving on
2. Get name and number BEFORE taking the order
3. Never read the whole menu unprompted
4. Never say you're checking with the kitchen or anyone — you have full menu knowledge
5. Never hang up because of silence or a caller pause — always wait
6. Sound like a real person, not a robot running a checklist`
}

function generateMenuSection(config: OrderTakerConfig): string {
  if (!config.menu?.categories?.length) {
    return 'Menu information will be provided dynamically.'
  }

  const sections: string[] = []

  for (const category of config.menu.categories) {
    const items = category.items.map(item => {
      let itemStr = `  - ${item.name}: $${item.price.toFixed(2)}`
      if (item.description) {
        itemStr += ` (${item.description})`
      }
      if (item.modifiers?.length) {
        const mods = item.modifiers.map(m =>
          `${m.name}: ${m.options.map(o => `${o.name}${o.price > 0 ? ` +$${o.price.toFixed(2)}` : ''}`).join(', ')}`
        )
        itemStr += `\n    Modifiers: ${mods.join('; ')}`
      }
      if (item.allergens?.length) {
        itemStr += `\n    Contains: ${item.allergens.join(', ')}`
      }
      return itemStr
    })

    sections.push(`### ${category.name}\n${items.join('\n')}`)
  }

  return sections.join('\n\n')
}

function generateUpsellRules(config: OrderTakerConfig): string {
  if (!config.upsellRules?.length) {
    return 'Naturally suggest complementary items when appropriate, like drinks or sides.'
  }

  return config.upsellRules.map(rule =>
    `- When they order ${rule.trigger}: "${rule.suggestion}" (${rule.item} +$${rule.price.toFixed(2)})`
  ).join('\n')
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

export function getDefaultOrderTakerConfig(businessName: string): OrderTakerConfig {
  return {
    type: 'order-taker',
    greeting: `Thank you for calling ${businessName}! Are you calling to place an order?`,

    menu: {
      categories: [],  // To be filled by business
    },

    upsellRules: [
      {
        trigger: 'entree',
        suggestion: 'Would you like to add a drink to that?',
        item: 'Drink',
        price: 2.99,
      },
    ],

    orderSettings: {
      minimumOrder: 0,
      deliveryFee: 5.00,
      deliveryRadius: 5,
      pickupOnly: false,
      estimatedTime: {
        pickup: 20,
        delivery: 45,
      },
    },

    acceptedPayments: ['card', 'cash'],
    tipOptions: [15, 18, 20, 25],
  }
}

// ============================================
// VAPI FUNCTION DEFINITIONS
// ============================================

export const ORDER_TAKER_FUNCTIONS = [
  {
    name: 'addToOrder',
    description: 'Add an item to the current order',
    parameters: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          description: 'Name of the item to add',
        },
        quantity: {
          type: 'number',
          description: 'Quantity (default 1)',
        },
        modifiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              option: { type: 'string' },
            },
          },
          description: 'Selected modifiers/customizations',
        },
        specialInstructions: {
          type: 'string',
          description: 'Special requests for this item',
        },
      },
      required: ['itemName'],
    },
  },
  {
    name: 'modifyOrderItem',
    description: 'Modify an item already in the order',
    parameters: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          description: 'Name of item to modify',
        },
        modification: {
          type: 'string',
          description: 'What to change',
        },
      },
      required: ['itemName', 'modification'],
    },
  },
  {
    name: 'removeFromOrder',
    description: 'Remove an item from the order',
    parameters: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          description: 'Name of item to remove',
        },
      },
      required: ['itemName'],
    },
  },
  {
    name: 'getOrderSummary',
    description: 'Get current order summary with totals',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'checkItemAvailability',
    description: 'Check if a menu item is available',
    parameters: {
      type: 'object',
      properties: {
        itemName: {
          type: 'string',
          description: 'Item to check',
        },
      },
      required: ['itemName'],
    },
  },
  {
    name: 'setOrderType',
    description: 'Set order as pickup or delivery',
    parameters: {
      type: 'object',
      properties: {
        orderType: {
          type: 'string',
          enum: ['pickup', 'delivery'],
          description: 'Order type',
        },
        deliveryAddress: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zip: { type: 'string' },
            instructions: { type: 'string' },
          },
          description: 'Delivery address (if delivery)',
        },
        requestedTime: {
          type: 'string',
          description: 'Requested pickup/delivery time',
        },
      },
      required: ['orderType'],
    },
  },
  {
    name: 'setCustomerInfo',
    description: 'Set customer information for the order',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Customer's name",
        },
        phone: {
          type: 'string',
          description: 'Phone number',
        },
        email: {
          type: 'string',
          description: 'Email (optional)',
        },
      },
      required: ['name', 'phone'],
    },
  },
  {
    name: 'processPayment',
    description: 'Process payment for the order',
    parameters: {
      type: 'object',
      properties: {
        paymentMethod: {
          type: 'string',
          enum: ['card', 'cash', 'online'],
          description: 'Payment method',
        },
        tipAmount: {
          type: 'number',
          description: 'Tip amount in dollars',
        },
        tipPercentage: {
          type: 'number',
          description: 'Tip as percentage',
        },
      },
      required: ['paymentMethod'],
    },
  },
  {
    name: 'confirmOrder',
    description: 'Finalize and submit the order',
    parameters: {
      type: 'object',
      properties: {
        confirmationNotes: {
          type: 'string',
          description: 'Any final notes',
        },
      },
    },
  },
  {
    name: 'getEstimatedTime',
    description: 'Get estimated ready/delivery time',
    parameters: {
      type: 'object',
      properties: {
        orderType: {
          type: 'string',
          enum: ['pickup', 'delivery'],
          description: 'Type of order',
        },
      },
      required: ['orderType'],
    },
  },
]

// ============================================
// EMPLOYEE FACTORY
// ============================================

export function createOrderTakerEmployee(params: {
  businessId: string
  businessName: string
  name?: string
  customConfig?: Partial<OrderTakerConfig>
  voice?: EmployeeConfig['voice']
  personality?: EmployeeConfig['personality']
}): Omit<EmployeeConfig, 'id' | 'vapiAssistantId' | 'vapiPhoneId' | 'phoneNumber' | 'createdAt' | 'updatedAt'> {
  const defaultConfig = getDefaultOrderTakerConfig(params.businessName)
  const jobConfig: OrderTakerConfig = {
    ...defaultConfig,
    ...params.customConfig,
    type: 'order-taker',
  }

  return {
    businessId: params.businessId,
    name: params.name || 'Maya',
    jobType: 'order-taker',
    complexity: 'simple',

    voice: params.voice || {
      provider: '11labs',
      voiceId: 'aVR2rUXJY4MTezzJjPyQ',
      speed: 1.15,  // Slightly faster for efficiency
      stability: 0.75,
    },

    personality: params.personality || {
      tone: 'friendly',
      enthusiasm: 'high',
      formality: 'casual',
    },

    schedule: {
      timezone: 'America/Los_Angeles',
      businessHours: {
        monday: { start: '10:00', end: '22:00' },
        tuesday: { start: '10:00', end: '22:00' },
        wednesday: { start: '10:00', end: '22:00' },
        thursday: { start: '10:00', end: '22:00' },
        friday: { start: '10:00', end: '23:00' },
        saturday: { start: '10:00', end: '23:00' },
        sunday: { start: '11:00', end: '21:00' },
      },
      afterHoursMessage: `Thanks for calling ${params.businessName}! We're currently closed. Our kitchen opens at 10 AM. You can also order online at our website.`,
    },

    capabilities: DEFAULT_CAPABILITIES_BY_JOB['order-taker'],
    jobConfig,
    isActive: true,
  }
}

// ============================================
// SAMPLE MENU (for demo purposes)
// ============================================

export const SAMPLE_RESTAURANT_MENU: OrderTakerConfig['menu'] = {
  categories: [
    {
      name: 'Appetizers',
      items: [
        {
          name: 'Mozzarella Sticks',
          price: 8.99,
          description: '6 golden fried sticks with marinara',
        },
        {
          name: 'Wings',
          price: 12.99,
          description: '10 crispy wings',
          modifiers: [
            {
              name: 'Sauce',
              options: [
                { name: 'Buffalo', price: 0 },
                { name: 'BBQ', price: 0 },
                { name: 'Garlic Parmesan', price: 0 },
                { name: 'Hot Honey', price: 0.50 },
              ],
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'Burgers',
      items: [
        {
          name: 'Classic Burger',
          price: 12.99,
          description: 'Beef patty, lettuce, tomato, onion, pickles',
          modifiers: [
            {
              name: 'Cheese',
              options: [
                { name: 'No Cheese', price: 0 },
                { name: 'American', price: 0 },
                { name: 'Cheddar', price: 0 },
                { name: 'Swiss', price: 0.50 },
              ],
              required: false,
            },
            {
              name: 'Add-ons',
              options: [
                { name: 'Bacon', price: 2.00 },
                { name: 'Avocado', price: 1.50 },
                { name: 'Fried Egg', price: 1.50 },
              ],
              required: false,
            },
          ],
          allergens: ['Gluten', 'Dairy'],
        },
        {
          name: 'Veggie Burger',
          price: 13.99,
          description: 'Plant-based patty with all the fixings',
          allergens: ['Gluten', 'Soy'],
        },
      ],
    },
    {
      name: 'Sides',
      items: [
        { name: 'French Fries', price: 4.99 },
        { name: 'Onion Rings', price: 5.99 },
        { name: 'Side Salad', price: 4.99 },
        { name: 'Sweet Potato Fries', price: 5.99 },
      ],
    },
    {
      name: 'Drinks',
      items: [
        { name: 'Soft Drink', price: 2.99, description: 'Coke, Diet Coke, Sprite, Dr Pepper' },
        { name: 'Iced Tea', price: 2.99 },
        { name: 'Lemonade', price: 3.49 },
        { name: 'Milkshake', price: 5.99, description: 'Chocolate, Vanilla, or Strawberry' },
      ],
    },
  ],
}

export const SAMPLE_UPSELL_RULES: OrderTakerConfig['upsellRules'] = [
  {
    trigger: 'burger',
    suggestion: 'Would you like to make that a combo with fries and a drink for just $4 more?',
    item: 'Combo Upgrade',
    price: 4.00,
  },
  {
    trigger: 'wings',
    suggestion: "Our onion rings pair great with wings! Want to add an order?",
    item: 'Onion Rings',
    price: 5.99,
  },
  {
    trigger: 'no drink ordered',
    suggestion: 'Can I get you something to drink with that?',
    item: 'Soft Drink',
    price: 2.99,
  },
]

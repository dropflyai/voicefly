/**
 * VoiceFly Stripe Products Setup Script
 * Creates all subscription tiers and minute packs in Stripe
 */

const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription Products (Monthly)
const subscriptionProducts = [
  {
    name: 'VoiceFly Starter',
    description: '60 voice minutes per month. 1 AI employee. Perfect for small businesses getting started.',
    price_cents: 4900, // $49
    interval: 'month',
    metadata: { tier: 'starter', minutes: '60', overage_per_minute: '0.25', ai_employees: '1' }
  },
  {
    name: 'VoiceFly Growth',
    description: '250 voice minutes per month. Up to 3 AI employees. For growing businesses ready to scale.',
    price_cents: 12900, // $129
    interval: 'month',
    metadata: { tier: 'growth', minutes: '250', overage_per_minute: '0.20', ai_employees: '3' }
  },
  {
    name: 'VoiceFly Pro',
    description: '750 voice minutes per month. Up to 5 AI employees. Full-scale AI workforce.',
    price_cents: 24900, // $249
    interval: 'month',
    metadata: { tier: 'pro', minutes: '750', overage_per_minute: '0.18', ai_employees: '5' }
  }
];

// Subscription Products (Yearly)
const yearlySubscriptionProducts = [
  {
    name: 'VoiceFly Starter (Annual)',
    description: '60 voice minutes per month. 1 AI employee. Billed annually — save vs monthly.',
    price_cents: 50400, // $504/year ($42/mo)
    interval: 'year',
    metadata: { tier: 'starter_yearly', minutes: '60', overage_per_minute: '0.25', ai_employees: '1', monthly_equivalent: '42' }
  },
  {
    name: 'VoiceFly Growth (Annual)',
    description: '250 voice minutes per month. Up to 3 AI employees. Billed annually — save vs monthly.',
    price_cents: 130800, // $1,308/year ($109/mo)
    interval: 'year',
    metadata: { tier: 'growth_yearly', minutes: '250', overage_per_minute: '0.20', ai_employees: '3', monthly_equivalent: '109' }
  },
  {
    name: 'VoiceFly Pro (Annual)',
    description: '750 voice minutes per month. Up to 5 AI employees. Billed annually — save vs monthly.',
    price_cents: 254400, // $2,544/year ($212/mo)
    interval: 'year',
    metadata: { tier: 'pro_yearly', minutes: '750', overage_per_minute: '0.18', ai_employees: '5', monthly_equivalent: '212' }
  }
];

// Minute Pack Products (one-time purchase)
const minutePackProducts = [
  {
    name: 'VoiceFly Starter Pack',
    description: '50 additional voice minutes. Never expires.',
    price_cents: 2000, // $20
    metadata: { pack_id: 'pack_starter', minutes: '50', credits: '250', price_per_minute: '0.40' }
  },
  {
    name: 'VoiceFly Growth Pack',
    description: '150 additional voice minutes. Never expires.',
    price_cents: 5000, // $50
    metadata: { pack_id: 'pack_growth', minutes: '150', credits: '750', price_per_minute: '0.33' }
  },
  {
    name: 'VoiceFly Pro Pack',
    description: '400 additional voice minutes. Never expires.',
    price_cents: 10000, // $100
    metadata: { pack_id: 'pack_pro', minutes: '400', credits: '2000', price_per_minute: '0.25' }
  },
  {
    name: 'VoiceFly Scale Pack',
    description: '1,000 additional voice minutes. Never expires.',
    price_cents: 20000, // $200
    metadata: { pack_id: 'pack_scale', minutes: '1000', credits: '5000', price_per_minute: '0.20' }
  }
];

async function createProducts() {
  console.log('🚀 Starting Stripe product setup for VoiceFly...\n');

  const results = {
    subscriptions: [],
    yearlySubscriptions: [],
    minutePacks: []
  };

  // Create Subscription Products
  console.log('📦 Creating Subscription Products...\n');

  for (const sub of subscriptionProducts) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: sub.name,
        description: sub.description,
        metadata: sub.metadata
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: sub.price_cents,
        currency: 'usd',
        recurring: { interval: sub.interval },
        metadata: sub.metadata
      });

      console.log(`   💰 Created price: $${sub.price_cents / 100}/mo (${price.id})\n`);

      results.subscriptions.push({
        tier: sub.metadata.tier,
        product_id: product.id,
        price_id: price.id,
        price: sub.price_cents / 100
      });
    } catch (error) {
      console.error(`❌ Error creating ${sub.name}:`, error.message);
    }
  }

  // Create Yearly Subscription Products
  console.log('📦 Creating Yearly Subscription Products...\n');

  for (const sub of yearlySubscriptionProducts) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: sub.name,
        description: sub.description,
        metadata: sub.metadata
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: sub.price_cents,
        currency: 'usd',
        recurring: { interval: sub.interval },
        metadata: sub.metadata
      });

      console.log(`   💰 Created price: $${sub.price_cents / 100}/yr ($${sub.metadata.monthly_equivalent}/mo) (${price.id})\n`);

      results.yearlySubscriptions.push({
        tier: sub.metadata.tier,
        product_id: product.id,
        price_id: price.id,
        price: sub.price_cents / 100
      });
    } catch (error) {
      console.error(`❌ Error creating ${sub.name}:`, error.message);
    }
  }

  // Create Minute Pack Products
  console.log('\n📦 Creating Minute Pack Products...\n');

  for (const pack of minutePackProducts) {
    try {
      // Create product
      const product = await stripe.products.create({
        name: pack.name,
        description: pack.description,
        metadata: pack.metadata
      });

      console.log(`✅ Created product: ${product.name} (${product.id})`);

      // Create price (one-time)
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pack.price_cents,
        currency: 'usd',
        metadata: pack.metadata
      });

      console.log(`   💰 Created price: $${pack.price_cents / 100} (${price.id})\n`);

      results.minutePacks.push({
        pack_id: pack.metadata.pack_id,
        product_id: product.id,
        price_id: price.id,
        price: pack.price_cents / 100
      });
    } catch (error) {
      console.error(`❌ Error creating ${pack.name}:`, error.message);
    }
  }

  // Output summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SETUP COMPLETE - Add these to your .env file:');
  console.log('='.repeat(60) + '\n');

  console.log('# Monthly Subscription Price IDs');
  for (const sub of results.subscriptions) {
    console.log(`STRIPE_PRICE_${sub.tier.toUpperCase()}=${sub.price_id}`);
  }

  console.log('\n# Yearly Subscription Price IDs');
  for (const sub of results.yearlySubscriptions) {
    console.log(`STRIPE_PRICE_${sub.tier.toUpperCase()}=${sub.price_id}`);
  }

  console.log('\n# Minute Pack Price IDs');
  for (const pack of results.minutePacks) {
    console.log(`STRIPE_PRICE_${pack.pack_id.toUpperCase()}=${pack.price_id}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All products created successfully!');
  console.log('='.repeat(60));

  return results;
}

createProducts().catch(console.error);

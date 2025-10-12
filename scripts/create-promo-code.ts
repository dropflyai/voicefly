/**
 * Create DROPFLY100 promo code in Stripe
 * 100% off for first month - for testing purposes
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

async function createPromoCode() {
  try {
    console.log('🎫 Creating DROPFLY100 promo code...\n')

    // Step 1: Create a 100% off coupon
    console.log('📝 Step 1: Creating 100% off coupon...')
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once', // Only applies to first payment
      name: 'DropFly 100% Off - Test Account',
      max_redemptions: 100, // Limit to 100 uses
    })
    console.log(`✅ Coupon created: ${coupon.id}`)
    console.log(`   - Percent off: ${coupon.percent_off}%`)
    console.log(`   - Duration: ${coupon.duration}`)
    console.log(`   - Max redemptions: ${coupon.max_redemptions}\n`)

    // Step 2: Create the promotion code
    console.log('📝 Step 2: Creating promotion code "DROPFLY100"...')
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'DROPFLY100',
      max_redemptions: 100,
      active: true,
    })
    console.log(`✅ Promotion code created: ${promoCode.code}`)
    console.log(`   - ID: ${promoCode.id}`)
    console.log(`   - Active: ${promoCode.active}`)
    console.log(`   - Coupon: ${promoCode.coupon.id}\n`)

    // Step 3: Success message
    console.log('🎉 SUCCESS! Promo code is ready to use!\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 PROMO CODE DETAILS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Code:         DROPFLY100`)
    console.log(`Discount:     100% OFF`)
    console.log(`Duration:     First month only`)
    console.log(`Max Uses:     100 redemptions`)
    console.log(`Status:       Active ✅`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    console.log('🧪 TO USE:')
    console.log('1. Go to the pricing page')
    console.log('2. Click "Get Started" on any plan')
    console.log('3. On the Stripe checkout page, enter "DROPFLY100"')
    console.log('4. First month will be FREE!\n')
    console.log('💡 TIP: After first month, regular subscription pricing applies.')
    console.log('    Cancel anytime before renewal to avoid charges.\n')

  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      console.error('❌ Error: Coupon or promo code already exists')
      console.log('\n💡 To create a new one, delete the existing code in Stripe Dashboard:')
      console.log('   https://dashboard.stripe.com/coupons\n')
    } else {
      console.error('❌ Error creating promo code:', error.message)
    }
    process.exit(1)
  }
}

createPromoCode()

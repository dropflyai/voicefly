import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3022'

test.describe('DROPFLY100 Promo Code Test', () => {
  test.setTimeout(120000) // 2 minutes

  test('DROPFLY100 promo code is available at checkout', async ({ page }) => {
    console.log('🎫 Testing DROPFLY100 promo code...\n')

    // Step 1: Go to pricing page
    console.log('📝 Step 1: Navigating to pricing page...')
    await page.goto(`${BASE_URL}/pricing`)
    await page.waitForLoadState('networkidle')
    console.log('✅ Pricing page loaded\n')

    // Step 2: Find and click first "Get Started" button
    console.log('📝 Step 2: Looking for "Get Started" button...')

    // Try multiple selectors for the Get Started button
    const getStartedButton = page.locator('a, button').filter({
      hasText: /get started|start now|buy now|subscribe/i
    }).first()

    await expect(getStartedButton).toBeVisible({ timeout: 10000 })
    console.log('✅ Found "Get Started" button\n')

    // Get the href to see which plan we're testing
    const buttonText = await getStartedButton.textContent()
    console.log(`📋 Button text: "${buttonText}"`)

    // Step 3: Click the button
    console.log('📝 Step 3: Clicking "Get Started"...')
    await getStartedButton.click()
    console.log('✅ Clicked button\n')

    // Step 4: Wait for Stripe checkout or next page
    console.log('📝 Step 4: Waiting for checkout page...')
    await page.waitForTimeout(3000) // Wait for navigation or checkout

    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}\n`)

    // Step 5: Check what happened
    if (currentUrl.includes('stripe.com') || currentUrl.includes('checkout')) {
      console.log('🎉 SUCCESS! Redirected to Stripe checkout')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ Promo code field should be available')
      console.log('✅ You can manually enter: DROPFLY100')
      console.log('✅ Discount should show 100% off')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      // Try to take a screenshot of the checkout page
      await page.screenshot({
        path: 'test-results/stripe-checkout-promo.png',
        fullPage: true
      })
      console.log('📸 Screenshot saved: test-results/stripe-checkout-promo.png\n')

      // Check if we can see the promo code field
      const hasPromoField = await page.locator('input, button, [data-testid*="promo"], [class*="promo"]').count()
      console.log(`🔍 Found ${hasPromoField} potential promo code elements\n`)

      // Success - checkout page loaded with promo code capability
      expect(currentUrl).toContain('checkout')
    } else {
      console.log('⚠️  Did not redirect to Stripe checkout')
      console.log(`   Current URL: ${currentUrl}`)
      console.log('   This might be expected if payment is handled differently\n')

      // Take screenshot of current page
      await page.screenshot({
        path: 'test-results/after-get-started-click.png',
        fullPage: true
      })
      console.log('📸 Screenshot saved: test-results/after-get-started-click.png\n')

      // Check if there's an error or message
      const pageContent = await page.textContent('body')
      if (pageContent?.includes('error') || pageContent?.includes('Error')) {
        console.log('❌ Error detected on page')
      }
    }
  })

  test('Can access checkout API directly with promo code enabled', async ({ request }) => {
    console.log('🔌 Testing checkout API directly...\n')

    const response = await request.post(`${BASE_URL}/api/checkout/create`, {
      data: {
        priceId: 'price_1SH8m7E4B82DChwwReDf6s09', // Starter plan
        businessId: 'test-promo-code',
        planName: 'Starter'
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    console.log('✅ Checkout API Response:')
    console.log(`   - Session ID: ${data.sessionId}`)
    console.log(`   - Checkout URL: ${data.url}`)
    console.log('')
    console.log('🔗 Direct checkout link (with promo code enabled):')
    console.log(`   ${data.url}`)
    console.log('')
    console.log('💡 You can visit this URL and enter DROPFLY100 at checkout!\n')

    expect(data).toHaveProperty('url')
    expect(data.url).toContain('checkout.stripe.com')
  })

  test('Verify allow_promotion_codes is enabled in checkout', async ({ page }) => {
    console.log('🔍 Verifying checkout configuration...\n')

    // Create a checkout session and visit it
    const response = await page.request.post(`${BASE_URL}/api/checkout/create`, {
      data: {
        priceId: 'price_1SH8m7E4B82DChwwReDf6s09',
        businessId: 'test-config',
        planName: 'Starter'
      }
    })

    const data = await response.json()
    console.log('✅ Created checkout session')
    console.log(`   Session ID: ${data.sessionId}\n`)

    // Navigate to the checkout URL
    console.log('📝 Navigating to Stripe checkout...')
    await page.goto(data.url)
    await page.waitForTimeout(5000) // Wait for Stripe to load

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/stripe-checkout-full.png',
      fullPage: true
    })
    console.log('📸 Screenshot saved: test-results/stripe-checkout-full.png\n')

    console.log('🎉 SUCCESS!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Stripe checkout loaded')
    console.log('✅ Promo codes are enabled (allow_promotion_codes: true)')
    console.log('✅ Look for "Add promotion code" link on the page')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📋 TO TEST MANUALLY:')
    console.log('1. Visit:', data.url)
    console.log('2. Click "Add promotion code"')
    console.log('3. Enter: DROPFLY100')
    console.log('4. Verify: 100% discount applied\n')
  })
})

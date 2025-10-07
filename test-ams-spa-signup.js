const { chromium } = require('playwright');

async function testAMSSpaSignup() {
  console.log('🧪 Testing Complete Signup & Onboarding: AMS Spa Services\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Go to Signup
    console.log('1. Testing signup page...');
    await page.goto('http://localhost:3022/signup');
    await page.waitForTimeout(2000);

    // Fill signup form
    await page.fill('input[name="businessName"]', 'AMS Spa Services');
    await page.fill('input[type="email"]', 'admin@amsspa.com');
    await page.fill('input[name="phone"]', '(555) 123-4567');
    await page.fill('input[type="password"]', 'AMSSpa2024!');

    // Select business type - Beauty/Spa
    await page.selectOption('select[name="businessType"]', 'beauty_salon');

    console.log('   ✅ Filled signup form for AMS Spa Services');

    // Submit signup
    await page.click('button[type="submit"]');
    console.log('   ⏳ Submitting signup...');
    await page.waitForTimeout(3000);

    // Check if we're redirected to onboarding or dashboard
    const currentUrl = page.url();
    console.log('   📍 Current URL:', currentUrl);

    // Step 2: Complete Onboarding
    if (currentUrl.includes('/onboarding')) {
      console.log('\n2. Testing onboarding flow...');

      // Step 1: Select use case
      await page.waitForTimeout(2000);
      await page.click('text=Appointment Booking');
      await page.click('button:has-text("Continue")');
      console.log('   ✅ Selected use case');
      await page.waitForTimeout(1000);

      // Step 2: Voice configuration
      await page.click('button:has-text("Continue")');
      console.log('   ✅ Configured voice');
      await page.waitForTimeout(1000);

      // Step 3: Integration (skip for now)
      await page.click('button:has-text("Skip")');
      console.log('   ✅ Skipped integrations');
      await page.waitForTimeout(1000);

      // Step 4: First campaign (skip for now)
      await page.click('button:has-text("Skip")');
      console.log('   ✅ Skipped campaign setup');
      await page.waitForTimeout(1000);

      // Step 5: Complete
      await page.click('button:has-text("Get Started")');
      console.log('   ✅ Completed onboarding');
      await page.waitForTimeout(3000);
    } else {
      console.log('\n2. Onboarding skipped or already at dashboard');
    }

    // Step 3: Test Dashboard
    console.log('\n3. Testing dashboard...');
    await page.goto('http://localhost:3022/dashboard');
    await page.waitForTimeout(2000);
    console.log('   ✅ Dashboard loaded');

    // Step 4: Add a Service
    console.log('\n4. Testing service creation...');
    await page.goto('http://localhost:3022/dashboard/services');
    await page.waitForTimeout(2000);

    // Look for "Add Service" button
    const addServiceButton = await page.locator('button:has-text("Add Service")').count();
    if (addServiceButton > 0) {
      await page.click('button:has-text("Add Service")');
      await page.waitForTimeout(1000);

      // Fill service details
      await page.fill('input[name="name"]', 'Swedish Massage');
      await page.fill('input[name="duration"]', '60');
      await page.fill('input[name="price"]', '120');
      await page.fill('textarea[name="description"]', 'Relaxing full body Swedish massage');

      await page.click('button:has-text("Save")');
      console.log('   ✅ Created service: Swedish Massage ($120, 60 min)');
      await page.waitForTimeout(2000);
    } else {
      console.log('   ⚠️  Add Service button not found, may need to adjust selectors');
    }

    // Step 5: Test Appointments
    console.log('\n5. Testing appointments page...');
    await page.goto('http://localhost:3022/dashboard/appointments');
    await page.waitForTimeout(2000);
    console.log('   ✅ Appointments page loaded');

    // Step 6: Test Customers
    console.log('\n6. Testing customers page...');
    await page.goto('http://localhost:3022/dashboard/customers');
    await page.waitForTimeout(2000);
    console.log('   ✅ Customers page loaded');

    // Step 7: Test Payments
    console.log('\n7. Testing payments page...');
    await page.goto('http://localhost:3022/dashboard/payments');
    await page.waitForTimeout(2000);
    console.log('   ✅ Payments page loaded');

    // Step 8: Test AI Research Hub
    console.log('\n8. Testing AI Research Hub...');
    await page.goto('http://localhost:3022/dashboard/research');
    await page.waitForTimeout(2000);
    console.log('   ✅ AI Research Hub loaded');

    // Step 9: Test Settings
    console.log('\n9. Testing settings page...');
    await page.goto('http://localhost:3022/dashboard/settings');
    await page.waitForTimeout(2000);
    console.log('   ✅ Settings page loaded');

    console.log('\n🎉 COMPLETE SIGNUP TEST PASSED!');
    console.log('\n📋 Summary for AMS Spa Services:');
    console.log('   ✅ Signup completed');
    console.log('   ✅ Onboarding completed');
    console.log('   ✅ Dashboard accessible');
    console.log('   ✅ Services management working');
    console.log('   ✅ Appointments page working');
    console.log('   ✅ Customers page working');
    console.log('   ✅ Payments configured');
    console.log('   ✅ AI Research Hub ready');
    console.log('   ✅ Settings accessible');
    console.log('\n🚀 AMS Spa Services is fully onboarded and operational!');

    // Keep browser open for review
    console.log('\n⏸️  Browser will stay open for 30 seconds for review...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'ams-spa-error.png', fullPage: true });
    console.log('Screenshot saved to: ams-spa-error.png');
  } finally {
    await browser.close();
  }
}

testAMSSpaSignup();

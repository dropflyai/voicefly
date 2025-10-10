const { chromium } = require('playwright');

/**
 * VoiceFly User Journey Test
 * Tests complete flow: Homepage → Signup → Dashboard
 */

async function testUserJourney() {
  console.log('🚀 VoiceFly User Journey Test');
  console.log('Testing URL: http://localhost:3000');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: false }); // Set to false to watch the test
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
  };

  const testEmail = `test.${Date.now()}@gmail.com`; // Use realistic email format
  const testPassword = 'TestPassword123!';

  try {
    // ==================== PHASE 1: Homepage ====================
    console.log('📄 PHASE 1: Testing Homepage');
    console.log('─────────────────────────────────────────────────────────────\n');

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check homepage loads
    const title = await page.title();
    if (title.includes('VoiceFly')) {
      console.log('✅ Homepage loaded successfully');
      testResults.passed++;
    } else {
      console.log('❌ Homepage title incorrect:', title);
      testResults.failed++;
      testResults.issues.push('Homepage title does not contain VoiceFly');
    }

    // Check CTA buttons
    const signupButtons = await page.locator('a[href="/signup"], button:has-text("Get Started")').count();
    if (signupButtons > 0) {
      console.log(`✅ Found ${signupButtons} signup CTA button(s)`);
      testResults.passed++;
    } else {
      console.log('⚠️  No signup CTA buttons found on homepage');
      testResults.warnings++;
      testResults.issues.push('No clear signup CTA on homepage');
    }

    // Check AI Chatbot
    const chatbotButton = await page.locator('[aria-label*="Chat"], button:has-text("Chat")').first();
    if (await chatbotButton.count() > 0) {
      console.log('✅ AI Chatbot button present');
      testResults.passed++;
    } else {
      console.log('⚠️  AI Chatbot button not found');
      testResults.warnings++;
    }

    console.log('\n');

    // ==================== PHASE 2: Signup Page ====================
    console.log('📝 PHASE 2: Testing Signup Page');
    console.log('─────────────────────────────────────────────────────────────\n');

    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check page loaded
    const signupHeading = await page.locator('h1, h2').filter({ hasText: /sign up|get started|create account/i }).first();
    if (await signupHeading.count() > 0) {
      console.log('✅ Signup page loaded');
      testResults.passed++;
    } else {
      console.log('❌ Signup page did not load properly');
      testResults.failed++;
      testResults.issues.push('Signup page missing heading');
    }

    // Check form fields
    const requiredFields = [
      { name: 'email', label: 'Email' },
      { name: 'password', label: 'Password' },
      { name: 'firstName', label: 'First Name' },
      { name: 'company', label: 'Company' }
    ];

    for (const field of requiredFields) {
      const input = await page.locator(`input[name="${field.name}"], input[type="${field.name}"]`).first();
      if (await input.count() > 0) {
        console.log(`✅ ${field.label} field present`);
        testResults.passed++;
      } else {
        console.log(`❌ ${field.label} field missing`);
        testResults.failed++;
        testResults.issues.push(`Signup form missing ${field.label} field`);
      }
    }

    // Find the email/password form submit button (not OAuth buttons)
    const submitButton = await page.locator('form button[type="submit"]').first();
    if (await submitButton.count() > 0) {
      console.log('✅ Submit button found');
      testResults.passed++;

      // Check if button starts disabled (empty form)
      const isDisabled = await submitButton.isDisabled();
      console.log(`ℹ️  Submit button ${isDisabled ? 'disabled' : 'enabled'} when form is empty`);
    } else {
      console.log('❌ Submit button not found');
      testResults.failed++;
      testResults.issues.push('Signup form missing submit button');
    }

    console.log('\n');

    // ==================== PHASE 3: Fill Signup Form ====================
    console.log('🖊️  PHASE 3: Testing Signup Flow');
    console.log('─────────────────────────────────────────────────────────────\n');
    console.log(`📧 Test Email: ${testEmail}`);

    try {
      // Fill out the form
      await page.fill('input[name="firstName"]', 'Test');
      console.log('  ✓ Filled firstName');

      await page.fill('input[name="lastName"]', 'User');
      console.log('  ✓ Filled lastName');

      await page.fill('input[name="email"]', testEmail);
      console.log('  ✓ Filled email');

      await page.fill('input[name="company"]', 'Test Company');
      console.log('  ✓ Filled company');

      await page.fill('input[name="password"]', testPassword);
      console.log('  ✓ Filled password');

      // Check for terms checkbox
      const termsCheckbox = await page.locator('input[type="checkbox"][name="agreeToTerms"]').first();
      if (await termsCheckbox.count() > 0) {
        await termsCheckbox.check();
        await page.waitForTimeout(500); // Wait for form validation
        console.log('✅ Terms checkbox checked');
        testResults.passed++;
      } else {
        console.log('⚠️  No terms checkbox found');
        testResults.warnings++;
      }

      console.log('✅ Form filled with test data');
      testResults.passed++;

      // Check if submit button is now enabled
      const formSubmitButton = await page.locator('form button[type="submit"]').first();
      const isButtonEnabled = !(await formSubmitButton.isDisabled());

      if (isButtonEnabled) {
        console.log('✅ Submit button is now enabled');
        testResults.passed++;
      } else {
        console.log('❌ Submit button still disabled after filling form');
        testResults.failed++;
        testResults.issues.push('Submit button remains disabled even after filling all required fields');
        throw new Error('Submit button disabled - cannot proceed with signup');
      }

      // Submit the form
      await formSubmitButton.click();
      console.log('⏳ Submitting signup form...');

      // Listen for dialogs (alerts)
      let alertMessage = null;
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        console.log(`⚠️  Alert appeared: "${alertMessage}"`);
        await dialog.accept();
      });

      // Wait for navigation or error
      await page.waitForTimeout(3000); // Give time for API call

      const currentURL = page.url();
      console.log(`ℹ️  Current URL after submission: ${currentURL}`);

      // Check for error messages on page
      const errorElements = await page.locator('.text-red-500, .text-red-600, .text-red-700, [role="alert"]').all();
      if (errorElements.length > 0) {
        const errorTexts = await Promise.all(errorElements.map(el => el.textContent()));
        console.log(`❌ Error messages found on page:`);
        errorTexts.forEach(text => console.log(`   - ${text.trim()}`));
        testResults.failed++;
        testResults.issues.push(`Signup error: ${errorTexts[0]}`);
      } else if (alertMessage) {
        console.log(`❌ Signup failed with alert: ${alertMessage}`);
        testResults.failed++;
        testResults.issues.push(`Signup alert: ${alertMessage}`);
      } else if (currentURL.includes('/dashboard')) {
        console.log('✅ Signup successful - redirected to dashboard');
        testResults.passed++;
      } else if (currentURL.includes('/signup')) {
        console.log(`⚠️  Still on signup page after submission`);
        console.log(`   Checking browser console for errors...`);

        // Wait a bit more in case it's slow
        await page.waitForTimeout(5000);
        const newURL = page.url();

        if (newURL.includes('/dashboard')) {
          console.log('✅ Signup successful after delay - redirected to dashboard');
          testResults.passed++;
        } else {
          console.log(`❌ Signup did not complete - still at: ${newURL}`);
          testResults.failed++;
          testResults.issues.push(`Signup timed out - no redirect to dashboard`);
        }
      } else {
        console.log(`❌ Unexpected URL after signup: ${currentURL}`);
        testResults.failed++;
        testResults.issues.push(`Unexpected redirect to: ${currentURL}`);
      }

    } catch (error) {
      console.log(`❌ Error during signup: ${error.message}`);
      testResults.failed++;
      testResults.issues.push(`Signup error: ${error.message}`);
    }

    console.log('\n');

    // ==================== PHASE 4: Dashboard ====================
    if (page.url().includes('/dashboard')) {
      console.log('🎯 PHASE 4: Testing Dashboard');
      console.log('─────────────────────────────────────────────────────────────\n');

      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check dashboard elements
      const dashboardTitle = await page.locator('h1, h2').filter({ hasText: /dashboard|welcome/i }).first();
      if (await dashboardTitle.count() > 0) {
        const titleText = await dashboardTitle.textContent();
        console.log(`✅ Dashboard loaded: "${titleText.trim()}"`);
        testResults.passed++;
      } else {
        console.log('⚠️  Dashboard title not found');
        testResults.warnings++;
      }

      // Check for key dashboard sections
      const expectedSections = [
        { selector: '[class*="stat"], [class*="card"]', name: 'Stats/Cards' },
        { selector: 'nav, [role="navigation"]', name: 'Navigation' },
        { selector: 'button, a[href*="campaign"], a[href*="lead"]', name: 'Action buttons' }
      ];

      for (const section of expectedSections) {
        const element = await page.locator(section.selector).first();
        if (await element.count() > 0) {
          console.log(`✅ ${section.name} found`);
          testResults.passed++;
        } else {
          console.log(`⚠️  ${section.name} not found`);
          testResults.warnings++;
        }
      }

      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForTimeout(2000);

      if (consoleErrors.length === 0) {
        console.log('✅ No console errors on dashboard');
        testResults.passed++;
      } else {
        console.log(`⚠️  ${consoleErrors.length} console errors found`);
        consoleErrors.slice(0, 3).forEach(err => console.log(`   - ${err.substring(0, 100)}`));
        testResults.warnings++;
      }

      // Take screenshot
      await page.screenshot({ path: 'test-results/dashboard-screenshot.png', fullPage: true });
      console.log('📸 Dashboard screenshot saved');

      console.log('\n');

      // ==================== PHASE 5: Test Key Features ====================
      console.log('🔧 PHASE 5: Testing Key Dashboard Features');
      console.log('─────────────────────────────────────────────────────────────\n');

      // Test navigation links
      const navLinks = await page.locator('nav a, [role="navigation"] a').all();
      console.log(`ℹ️  Found ${navLinks.length} navigation links`);

      if (navLinks.length >= 5) {
        console.log('✅ Dashboard has navigation menu');
        testResults.passed++;
      } else {
        console.log('⚠️  Limited navigation options');
        testResults.warnings++;
      }

      // Test logout functionality
      const logoutButton = await page.locator('button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")').first();
      if (await logoutButton.count() > 0) {
        console.log('✅ Logout button found');
        testResults.passed++;
      } else {
        console.log('⚠️  Logout button not found');
        testResults.warnings++;
        testResults.issues.push('No logout button visible on dashboard');
      }

      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error);
    testResults.failed++;
    testResults.issues.push(`Critical error: ${error.message}`);
  } finally {
    await browser.close();
  }

  // ==================== FINAL REPORT ====================
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 FINAL TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📈 Summary:');
  console.log(`  ✅ Passed:   ${testResults.passed}`);
  console.log(`  ❌ Failed:   ${testResults.failed}`);
  console.log(`  ⚠️  Warnings: ${testResults.warnings}`);
  console.log(`  📝 Total:    ${testResults.passed + testResults.failed + testResults.warnings}`);
  console.log('');

  const total = testResults.passed + testResults.failed;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
  console.log(`  Pass Rate: ${passRate}%`);
  console.log('');

  if (testResults.issues.length > 0) {
    console.log('⚠️  Issues Found:');
    testResults.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  if (testResults.failed === 0) {
    console.log('✅ USER JOURNEY TEST PASSED!');
    console.log('   The signup → dashboard flow is working.');
    if (testResults.warnings > 0) {
      console.log(`   Note: ${testResults.warnings} warnings should be reviewed.`);
    }
  } else {
    console.log('❌ USER JOURNEY TEST FAILED');
    console.log(`   ${testResults.failed} critical issues need to be fixed.`);
  }

  console.log('\n📧 Test Account Created:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log('   (You can use this to manually test the dashboard)\n');

  return testResults;
}

// Run the test
testUserJourney().catch(console.error);

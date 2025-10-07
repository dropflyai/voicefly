const { chromium } = require('playwright');

const testAccounts = [
  { name: 'Elite Auto Group', email: 'admin@eliteauto.com', password: 'Auto2024!', industry: 'auto_sales' },
  { name: 'Valley Medical', email: 'admin@valleymedical.com', password: 'Medical2024!', industry: 'medical' },
  { name: 'Radiance MedSpa', email: 'admin@radiancemedspa.com', password: 'MedSpa2024!', industry: 'medspa' }
];

async function testProductionLogin() {
  console.log('🧪 Testing Production Login at voiceflyai.com\n');
  console.log('Testing 3 sample accounts...\n');

  const browser = await chromium.launch({ headless: false });
  const results = [];

  for (const account of testAccounts) {
    const page = await browser.newPage();

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🏢 Testing: ${account.name} (${account.industry})`);
    console.log(`📧 Email: ${account.email}`);

    try {
      // Go to production login
      console.log('1️⃣  Loading https://voiceflyai.com/login...');
      await page.goto('https://voiceflyai.com/login');
      await page.waitForTimeout(3000);

      // Fill credentials
      console.log('2️⃣  Entering credentials...');
      await page.fill('input[type="email"]', account.email);
      await page.fill('input[type="password"]', account.password);

      // Click sign in
      console.log('3️⃣  Clicking sign in...');
      await page.click('button[type="submit"]');

      // Wait for navigation
      console.log('4️⃣  Waiting for response...');
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log('5️⃣  Current URL:', currentUrl);

      // Check if logged in
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ SUCCESS - Logged in and redirected to dashboard!');
        results.push({ account: account.name, status: 'SUCCESS', url: currentUrl });

        // Take screenshot
        await page.screenshot({ path: `prod-${account.industry}-dashboard.png` });
        console.log(`📸 Screenshot saved: prod-${account.industry}-dashboard.png`);
      } else {
        // Check for error messages
        const bodyText = await page.textContent('body');

        if (bodyText.includes('No businesses found')) {
          console.log('⚠️  ACCOUNT EXISTS but "No businesses found" error');
          console.log('   → This means: Auth works, but business link missing in production DB');
          results.push({ account: account.name, status: 'AUTH_OK_NO_BUSINESS', url: currentUrl });
        } else if (bodyText.includes('Invalid email or password')) {
          console.log('❌ FAILED - Account does not exist in production');
          results.push({ account: account.name, status: 'ACCOUNT_NOT_FOUND', url: currentUrl });
        } else {
          console.log('⚠️  UNKNOWN - Stayed on login page');
          results.push({ account: account.name, status: 'UNKNOWN', url: currentUrl });
        }

        await page.screenshot({ path: `prod-${account.industry}-error.png` });
        console.log(`📸 Error screenshot saved`);
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
      results.push({ account: account.name, status: 'ERROR', error: error.message });
    }

    await page.close();
    console.log();
  }

  await browser.close();

  // Print Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PRODUCTION TEST SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  results.forEach(r => {
    console.log(`${r.account}:`);
    console.log(`   Status: ${r.status}`);
    if (r.url) console.log(`   URL: ${r.url}`);
    if (r.error) console.log(`   Error: ${r.error}`);
    console.log();
  });

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const authOkCount = results.filter(r => r.status === 'AUTH_OK_NO_BUSINESS').length;
  const notFoundCount = results.filter(r => r.status === 'ACCOUNT_NOT_FOUND').length;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RESULTS:');
  console.log(`✅ Fully Working: ${successCount}/3`);
  console.log(`⚠️  Auth OK (no business link): ${authOkCount}/3`);
  console.log(`❌ Account Not Found: ${notFoundCount}/3`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (notFoundCount === 3) {
    console.log('📝 RECOMMENDATION:');
    console.log('   The new industry accounts only exist in LOCAL database.');
    console.log('   Production database (voiceflyai.com) needs the accounts created.');
    console.log('   \n   Options:');
    console.log('   1. Run create-all-industries.js against PRODUCTION Supabase');
    console.log('   2. Use localhost:3022 for tomorrow\'s demo');
    console.log('   3. Test with existing production accounts\n');
  } else if (authOkCount > 0) {
    console.log('📝 RECOMMENDATION:');
    console.log('   Accounts exist but need business_users links in production.');
    console.log('   Run verify-and-fix-links.js against production database.\n');
  }
}

testProductionLogin();

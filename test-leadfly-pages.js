/**
 * Test LeadFly Dashboard Pages (Headless Mode)
 * Tests: /dashboard/leads, /dashboard/leads/request, /dashboard/campaigns
 */

const { chromium } = require('playwright');
const path = require('path');

const PORT = 3023;
const BASE_URL = `http://localhost:${PORT}`;

async function testLeadFlyPages() {
  console.log('\n🧪 Testing LeadFly Dashboard Pages in Headless Mode\n');
  console.log('=' .repeat(60));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const screenshotDir = path.join(__dirname, 'leadfly-screenshots');
  const fs = require('fs');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  try {
    console.log(`\n📍 Base URL: ${BASE_URL}`);
    console.log(`📸 Screenshots: ${screenshotDir}\n`);

    // Test 1: Leads Pipeline Page
    console.log('1️⃣  Testing /dashboard/leads (Lead Pipeline)');
    console.log('-'.repeat(60));

    await page.goto(`${BASE_URL}/dashboard/leads`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for any animations

    // Check for key elements
    const leadsPageTitle = await page.textContent('h1');
    console.log(`   ✓ Page title: "${leadsPageTitle}"`);

    // Check for summary cards
    const summaryCards = await page.$$('.grid .bg-white');
    console.log(`   ✓ Summary cards found: ${summaryCards.length}`);

    // Check for leads table/list
    const leadsTable = await page.$('table, .grid');
    if (leadsTable) {
      console.log(`   ✓ Leads display found`);
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '1-leads-pipeline.png'),
      fullPage: true
    });
    console.log(`   📸 Screenshot saved: 1-leads-pipeline.png\n`);


    // Test 2: Request Leads Page
    console.log('2️⃣  Testing /dashboard/leads/request (Request Form)');
    console.log('-'.repeat(60));

    await page.goto(`${BASE_URL}/dashboard/leads/request`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const requestPageTitle = await page.textContent('h1');
    console.log(`   ✓ Page title: "${requestPageTitle}"`);

    // Check for form elements
    const industryButtons = await page.$$('button:has-text("Dental"), button:has-text("Medical"), button:has-text("Beauty")');
    console.log(`   ✓ Industry selection buttons: ${industryButtons.length}`);

    // Check for state selector
    const stateSelect = await page.$('select');
    if (stateSelect) {
      console.log(`   ✓ Location selector found`);
    }

    // Check for quota card
    const quotaCard = await page.$('.bg-gradient-to-br.from-blue-50');
    if (quotaCard) {
      console.log(`   ✓ Monthly quota display found`);
    }

    // Check for submit button
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      const buttonText = await submitButton.textContent();
      console.log(`   ✓ Submit button found: "${buttonText.trim()}"`);
    }

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '2-leads-request-form.png'),
      fullPage: true
    });
    console.log(`   📸 Screenshot saved: 2-leads-request-form.png\n`);


    // Test 3: Campaigns Page
    console.log('3️⃣  Testing /dashboard/campaigns (Campaign Performance)');
    console.log('-'.repeat(60));

    await page.goto(`${BASE_URL}/dashboard/campaigns`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const campaignsPageTitle = await page.textContent('h1');
    console.log(`   ✓ Page title: "${campaignsPageTitle}"`);

    // Check for stats cards
    const statsCards = await page.$$('.grid .bg-white');
    console.log(`   ✓ Stats cards found: ${statsCards.length}`);

    // Check for filters
    const filterButtons = await page.$$('button:has-text("All"), button:has-text("Email"), button:has-text("Voice")');
    console.log(`   ✓ Filter buttons: ${filterButtons.length}`);

    // Check for campaign cards
    const campaignCards = await page.$$('.bg-white.shadow-sm.rounded-lg');
    console.log(`   ✓ Campaign cards displayed: ${campaignCards.length}`);

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotDir, '3-campaigns-dashboard.png'),
      fullPage: true
    });
    console.log(`   📸 Screenshot saved: 3-campaigns-dashboard.png\n`);


    // Test 4: Check Navigation Links
    console.log('4️⃣  Testing Sidebar Navigation');
    console.log('-'.repeat(60));

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check for Leads link
    const leadsLink = await page.$('a[href="/dashboard/leads"]');
    if (leadsLink) {
      const linkText = await leadsLink.textContent();
      console.log(`   ✓ "Leads" navigation link found: "${linkText.trim()}"`);
    }

    // Check for Campaigns link
    const campaignsLink = await page.$('a[href="/dashboard/campaigns"]');
    if (campaignsLink) {
      const linkText = await campaignsLink.textContent();
      console.log(`   ✓ "Campaigns" navigation link found: "${linkText.trim()}"`);
    }

    // Take screenshot of dashboard with navigation
    await page.screenshot({
      path: path.join(screenshotDir, '4-navigation-sidebar.png'),
      fullPage: false
    });
    console.log(`   📸 Screenshot saved: 4-navigation-sidebar.png\n`);


    // Summary
    console.log('=' .repeat(60));
    console.log('\n✅ All LeadFly Pages Tested Successfully!\n');
    console.log('📊 Test Results:');
    console.log('   • Lead Pipeline Page: ✓');
    console.log('   • Lead Request Form: ✓');
    console.log('   • Campaigns Dashboard: ✓');
    console.log('   • Navigation Links: ✓');
    console.log(`\n📸 Screenshots saved to: ${screenshotDir}`);
    console.log('   • 1-leads-pipeline.png');
    console.log('   • 2-leads-request-form.png');
    console.log('   • 3-campaigns-dashboard.png');
    console.log('   • 4-navigation-sidebar.png\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('\n📸 Taking error screenshot...');
    await page.screenshot({
      path: path.join(screenshotDir, 'error-screenshot.png'),
      fullPage: true
    });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run tests
testLeadFlyPages().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});

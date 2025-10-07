const { chromium } = require('playwright');

async function quickLoginTest() {
  console.log('🧪 Quick Login Test - Valley Medical Practice\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1️⃣  Going to login page...');
    await page.goto('http://localhost:3022/login');
    await page.waitForTimeout(2000);

    console.log('2️⃣  Filling in credentials...');
    await page.fill('input[type="email"]', 'admin@valleymedical.com');
    await page.fill('input[type="password"]', 'Medical2024!');

    console.log('3️⃣  Clicking sign in...');
    await page.click('button[type="submit"]');

    console.log('4️⃣  Waiting for navigation...');
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('5️⃣  Current URL:', currentUrl);

    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ SUCCESS! Login worked and redirected to dashboard');
      await page.screenshot({ path: 'quick-test-dashboard.png' });
      console.log('   📸 Screenshot saved: quick-test-dashboard.png');

      // Check if services page loads
      console.log('\n6️⃣  Testing services page...');
      await page.goto('http://localhost:3022/dashboard/services');
      await page.waitForTimeout(2000);

      const servicesContent = await page.textContent('body');
      if (servicesContent.includes('Annual Physical Exam') || servicesContent.includes('Sick Visit')) {
        console.log('   ✅ Services page loaded with correct data!');
      } else {
        console.log('   ⚠️  Services page loaded but data unclear');
      }

      await page.screenshot({ path: 'quick-test-services.png' });
      console.log('   📸 Screenshot saved: quick-test-services.png');

    } else {
      console.log('\n❌ FAILED - Did not redirect to dashboard');
      console.log('   Current URL:', currentUrl);
      await page.screenshot({ path: 'quick-test-failure.png' });
      console.log('   📸 Error screenshot saved');
    }

    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    await page.screenshot({ path: 'quick-test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

quickLoginTest();

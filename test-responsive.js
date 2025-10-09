/**
 * VoiceFly Responsive Testing Suite
 * Tests mobile, tablet, and desktop viewports using Chromium
 *
 * Run: node test-responsive.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = './responsive-screenshots';

// Viewport configurations
const VIEWPORTS = {
  mobile: {
    name: 'iPhone 12',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  },
  tablet: {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  },
  desktop: {
    name: 'Desktop 1920x1080',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  }
};

// Pages to test
const TEST_PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/pricing', name: 'Pricing' },
  { path: '/features', name: 'Features' },
  { path: '/login', name: 'Login' }
];

/**
 * Initialize screenshot directory
 */
function initScreenshotDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}`);
}

/**
 * Test responsive layout for a specific viewport
 */
async function testViewport(browser, viewportName, viewportConfig) {
  console.log(`\n📱 Testing ${viewportConfig.name} (${viewportConfig.width}x${viewportConfig.height})`);

  const context = await browser.newContext({
    viewport: {
      width: viewportConfig.width,
      height: viewportConfig.height
    },
    deviceScaleFactor: viewportConfig.deviceScaleFactor,
    isMobile: viewportConfig.isMobile,
    hasTouch: viewportConfig.hasTouch,
    userAgent: viewportConfig.isMobile
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();
  const results = [];

  for (const testPage of TEST_PAGES) {
    const url = `${BASE_URL}${testPage.path}`;
    console.log(`  🔍 Testing ${testPage.name}...`);

    try {
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for page to be fully loaded
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotPath = path.join(
        SCREENSHOT_DIR,
        `${viewportName}-${testPage.name.toLowerCase().replace(/\s+/g, '-')}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Test mobile menu if mobile/tablet
      if (viewportConfig.isMobile) {
        const mobileMenuButton = await page.$('button[aria-label="Toggle menu"]');
        if (mobileMenuButton) {
          console.log(`    ✓ Mobile menu button found`);

          // Click menu button
          await mobileMenuButton.click();
          await page.waitForTimeout(500);

          // Check if menu is visible
          const menuVisible = await page.isVisible('nav a[href="/"]');
          if (menuVisible) {
            console.log(`    ✓ Mobile menu opens correctly`);

            // Take screenshot of open menu
            const menuScreenshotPath = path.join(
              SCREENSHOT_DIR,
              `${viewportName}-${testPage.name.toLowerCase().replace(/\s+/g, '-')}-menu-open.png`
            );
            await page.screenshot({ path: menuScreenshotPath });

            // Close menu
            await mobileMenuButton.click();
            await page.waitForTimeout(500);
          } else {
            console.log(`    ⚠️  Mobile menu did not open`);
          }
        }
      }

      // Test responsive elements
      const checks = {
        hasHeader: await page.$('header') !== null,
        hasNavigation: await page.$('nav') !== null,
        hasFooter: await page.$('footer') !== null,
        hasMainContent: await page.$('main, section') !== null
      };

      // Check for horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewportConfig.width;
      const hasOverflow = bodyWidth > viewportWidth + 10; // 10px tolerance

      results.push({
        page: testPage.name,
        viewport: viewportConfig.name,
        screenshot: screenshotPath,
        checks,
        hasOverflow,
        status: hasOverflow ? '⚠️ ' : '✅'
      });

      if (hasOverflow) {
        console.log(`    ⚠️  Horizontal overflow detected (${bodyWidth}px > ${viewportWidth}px)`);
      } else {
        console.log(`    ✅ No horizontal overflow`);
      }

      console.log(`    ✅ Screenshot saved: ${screenshotPath}`);

    } catch (error) {
      console.error(`    ❌ Error testing ${testPage.name}:`, error.message);
      results.push({
        page: testPage.name,
        viewport: viewportConfig.name,
        error: error.message,
        status: '❌'
      });
    }
  }

  await context.close();
  return results;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 VoiceFly Responsive Testing Suite\n');
  console.log(`Testing URL: ${BASE_URL}\n`);

  initScreenshotDir();

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const allResults = [];

  // Test each viewport
  for (const [viewportName, viewportConfig] of Object.entries(VIEWPORTS)) {
    const results = await testViewport(browser, viewportName, viewportConfig);
    allResults.push(...results);
  }

  await browser.close();

  // Print summary
  console.log('\n\n📊 Test Summary\n');
  console.log('═'.repeat(80));

  const groupedResults = {};
  allResults.forEach(result => {
    if (!groupedResults[result.page]) {
      groupedResults[result.page] = [];
    }
    groupedResults[result.page].push(result);
  });

  Object.entries(groupedResults).forEach(([pageName, results]) => {
    console.log(`\n${pageName}:`);
    results.forEach(result => {
      console.log(`  ${result.status} ${result.viewport.padEnd(20)} ${result.hasOverflow ? '⚠️  Overflow detected' : '✅ Responsive'}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
    });
  });

  console.log('\n' + '═'.repeat(80));

  // Check for issues
  const issues = allResults.filter(r => r.hasOverflow || r.error);
  if (issues.length > 0) {
    console.log(`\n⚠️  ${issues.length} issue(s) found:\n`);
    issues.forEach(issue => {
      console.log(`   • ${issue.page} on ${issue.viewport}`);
      if (issue.hasOverflow) {
        console.log(`     - Horizontal overflow detected`);
      }
      if (issue.error) {
        console.log(`     - ${issue.error}`);
      }
    });
  } else {
    console.log('\n✅ All pages are responsive across all viewports!');
  }

  console.log(`\n📸 Screenshots saved to: ${path.resolve(SCREENSHOT_DIR)}`);
  console.log('\n✨ Testing complete!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

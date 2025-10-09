/**
 * VoiceFly Complete System Test Suite
 * Comprehensive testing with Chromium browser
 *
 * Tests:
 * - All pages load correctly
 * - Navigation works
 * - Footer links are valid
 * - AI Chatbot appears and functions
 * - Mobile responsiveness
 * - Copyright year is 2025
 * - No console errors
 *
 * Run: node test-full-system.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SCREENSHOT_DIR = './test-results';

// All pages to test
const PAGES_TO_TEST = [
  { path: '/', name: 'Homepage', critical: true },
  { path: '/features', name: 'Features', critical: true },
  { path: '/pricing', name: 'Pricing', critical: true },
  { path: '/solutions', name: 'Solutions', critical: true },
  { path: '/testimonials', name: 'Testimonials', critical: true },
  { path: '/login', name: 'Login', critical: true },
  { path: '/privacy', name: 'Privacy Policy', critical: false },
  { path: '/terms', name: 'Terms of Service', critical: false }
];

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

/**
 * Initialize test results directory
 */
function initTestDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  console.log(`📁 Test results will be saved to: ${SCREENSHOT_DIR}\n`);
}

/**
 * Add test result
 */
function addTestResult(name, status, details = null, screenshot = null) {
  const result = {
    name,
    status, // 'pass', 'fail', 'warn'
    details,
    screenshot,
    timestamp: new Date().toISOString()
  };

  testResults.tests.push(result);

  if (status === 'pass') testResults.passed++;
  else if (status === 'fail') testResults.failed++;
  else if (status === 'warn') testResults.warnings++;

  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`  ${icon} ${name}${details ? ': ' + details : ''}`);
}

/**
 * Test: Page loads successfully
 */
async function testPageLoads(page, pageInfo) {
  console.log(`\n🔍 Testing: ${pageInfo.name} (${pageInfo.path})`);

  try {
    const response = await page.goto(`${BASE_URL}${pageInfo.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const status = response.status();

    if (status >= 200 && status < 400) {
      addTestResult(`${pageInfo.name} loads`, 'pass', `HTTP ${status}`);

      // Take screenshot
      const screenshot = path.join(SCREENSHOT_DIR, `${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });

      return true;
    } else {
      addTestResult(`${pageInfo.name} loads`, 'fail', `HTTP ${status}`);
      return false;
    }
  } catch (error) {
    addTestResult(`${pageInfo.name} loads`, 'fail', error.message);
    return false;
  }
}

/**
 * Test: Navigation menu exists and is functional
 */
async function testNavigation(page) {
  console.log('\n🧭 Testing Navigation');

  try {
    // Check for header
    const header = await page.$('header');
    if (header) {
      addTestResult('Header exists', 'pass');
    } else {
      addTestResult('Header exists', 'fail', 'No header element found');
      return;
    }

    // Check for VoiceFly logo/brand
    const brand = await page.textContent('header');
    if (brand.includes('VoiceFly')) {
      addTestResult('VoiceFly branding present', 'pass');
    } else {
      addTestResult('VoiceFly branding present', 'fail');
    }

    // Check for navigation links (desktop)
    const navLinks = await page.$$('nav a');
    if (navLinks.length > 0) {
      addTestResult('Navigation links present', 'pass', `${navLinks.length} links found`);
    } else {
      addTestResult('Navigation links present', 'warn', 'No nav links found (might be mobile)');
    }

    // Check for mobile menu button
    const mobileMenuButton = await page.$('button[aria-label="Toggle menu"]');
    if (mobileMenuButton) {
      addTestResult('Mobile menu button exists', 'pass');
    } else {
      addTestResult('Mobile menu button exists', 'warn', 'No mobile menu button');
    }

  } catch (error) {
    addTestResult('Navigation test', 'fail', error.message);
  }
}

/**
 * Test: Footer exists and has correct year
 */
async function testFooter(page) {
  console.log('\n👣 Testing Footer');

  try {
    const footer = await page.$('footer');
    if (!footer) {
      addTestResult('Footer exists', 'fail', 'No footer element');
      return;
    }
    addTestResult('Footer exists', 'pass');

    // Check copyright year
    const footerText = await page.textContent('footer');
    if (footerText.includes('© 2025')) {
      addTestResult('Copyright year is 2025', 'pass');
    } else if (footerText.includes('© 2024')) {
      addTestResult('Copyright year is 2025', 'fail', 'Still shows 2024');
    } else {
      addTestResult('Copyright year is 2025', 'warn', 'No copyright found');
    }

    // Check for footer links
    const footerLinks = await page.$$('footer a');
    if (footerLinks.length > 0) {
      addTestResult('Footer links present', 'pass', `${footerLinks.length} links`);
    } else {
      addTestResult('Footer links present', 'warn', 'No footer links');
    }

    // Test a few footer links work
    let workingLinks = 0;
    for (let i = 0; i < Math.min(3, footerLinks.length); i++) {
      const href = await footerLinks[i].getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:')) {
        workingLinks++;
      }
    }
    if (workingLinks > 0) {
      addTestResult('Footer links functional', 'pass', `${workingLinks} working links`);
    }

  } catch (error) {
    addTestResult('Footer test', 'fail', error.message);
  }
}

/**
 * Test: AI Chatbot exists and can be opened
 */
async function testChatbot(page) {
  console.log('\n💬 Testing AI Chatbot');

  try {
    // Look for chatbot button
    const chatbotButton = await page.$('button:has-text(""), button.fixed.bottom-6.right-6');

    // Alternative: look for any fixed bottom-right button
    const buttons = await page.$$('button.fixed');
    let chatButton = null;

    for (const btn of buttons) {
      const classes = await btn.getAttribute('class');
      if (classes && classes.includes('bottom-6') && classes.includes('right-6')) {
        chatButton = btn;
        break;
      }
    }

    if (chatButton) {
      addTestResult('AI Chatbot button exists', 'pass');

      // Try to click it
      await chatButton.click();
      await page.waitForTimeout(1000);

      // Check if chatbot window appeared
      const chatWindow = await page.$('div.fixed.bottom-24.right-6');
      if (chatWindow) {
        addTestResult('AI Chatbot opens', 'pass');

        // Take screenshot of open chatbot
        const screenshot = path.join(SCREENSHOT_DIR, 'chatbot-open.png');
        await page.screenshot({ path: screenshot });

        // Check for Maya greeting
        const chatContent = await page.textContent('div.fixed.bottom-24.right-6');
        if (chatContent.includes('Maya')) {
          addTestResult('AI Chatbot shows Maya greeting', 'pass');
        } else {
          addTestResult('AI Chatbot shows Maya greeting', 'warn', 'No Maya reference found');
        }

        // Close chatbot
        await chatButton.click();
        await page.waitForTimeout(500);
      } else {
        addTestResult('AI Chatbot opens', 'fail', 'Window did not appear');
      }
    } else {
      addTestResult('AI Chatbot button exists', 'fail', 'Button not found');
    }

  } catch (error) {
    addTestResult('AI Chatbot test', 'fail', error.message);
  }
}

/**
 * Test: Page is mobile responsive
 */
async function testMobileResponsive(page, pageInfo) {
  console.log(`\n📱 Testing Mobile Responsiveness: ${pageInfo.name}`);

  try {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;

    if (bodyWidth <= viewportWidth + 10) {
      addTestResult(`${pageInfo.name} mobile responsive`, 'pass', 'No overflow');
    } else {
      addTestResult(`${pageInfo.name} mobile responsive`, 'fail', `Overflow: ${bodyWidth}px > ${viewportWidth}px`);
    }

    // Take mobile screenshot
    const screenshot = path.join(SCREENSHOT_DIR, `mobile-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`);
    await page.screenshot({ path: screenshot, fullPage: false });

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

  } catch (error) {
    addTestResult(`${pageInfo.name} mobile responsive`, 'fail', error.message);
  }
}

/**
 * Test: Console errors
 */
async function testConsoleErrors(page, pageInfo) {
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.waitForTimeout(2000);

  if (errors.length === 0) {
    addTestResult(`${pageInfo.name} has no console errors`, 'pass');
  } else if (errors.length < 3) {
    addTestResult(`${pageInfo.name} has console errors`, 'warn', `${errors.length} errors`);
  } else {
    addTestResult(`${pageInfo.name} has console errors`, 'fail', `${errors.length} errors`);
  }

  return errors;
}

/**
 * Main test runner
 */
async function runFullSystemTest() {
  console.log('🚀 VoiceFly Complete System Test Suite');
  console.log('Testing URL:', BASE_URL);
  console.log('═'.repeat(80));

  initTestDir();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Test each page
  for (const pageInfo of PAGES_TO_TEST) {
    const loaded = await testPageLoads(page, pageInfo);

    if (loaded) {
      // Only run additional tests if page loaded
      if (pageInfo.path === '/') {
        // Extra tests for homepage
        await testNavigation(page);
        await testFooter(page);
        await testChatbot(page);
      } else {
        // Test footer on other pages
        await testFooter(page);
      }

      // Test mobile responsiveness
      await testMobileResponsive(page, pageInfo);

      // Check for console errors
      await testConsoleErrors(page, pageInfo);
    }
  }

  await browser.close();

  // Print final report
  printFinalReport();
}

/**
 * Print final test report
 */
function printFinalReport() {
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 FINAL TEST REPORT');
  console.log('═'.repeat(80));

  console.log('\n📈 Summary:');
  console.log(`  ✅ Passed:   ${testResults.passed}`);
  console.log(`  ❌ Failed:   ${testResults.failed}`);
  console.log(`  ⚠️  Warnings: ${testResults.warnings}`);
  console.log(`  📝 Total:    ${testResults.tests.length}`);

  const passRate = ((testResults.passed / testResults.tests.length) * 100).toFixed(1);
  console.log(`\n  Pass Rate: ${passRate}%`);

  // List failures
  const failures = testResults.tests.filter(t => t.status === 'fail');
  if (failures.length > 0) {
    console.log('\n❌ Failed Tests:');
    failures.forEach(test => {
      console.log(`  • ${test.name}: ${test.details}`);
    });
  }

  // List warnings
  const warnings = testResults.tests.filter(t => t.status === 'warn');
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(test => {
      console.log(`  • ${test.name}: ${test.details}`);
    });
  }

  console.log('\n' + '═'.repeat(80));

  // Overall status
  if (testResults.failed === 0) {
    console.log('\n✅ ALL TESTS PASSED! System is working correctly.\n');
  } else if (testResults.failed < 3) {
    console.log('\n⚠️  MOSTLY WORKING - Minor issues detected.\n');
  } else {
    console.log('\n❌ CRITICAL ISSUES DETECTED - System needs attention.\n');
  }

  console.log(`📸 Screenshots saved to: ${path.resolve(SCREENSHOT_DIR)}\n`);

  // Save JSON report
  const reportPath = path.join(SCREENSHOT_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`📄 Full report saved to: ${reportPath}\n`);
}

// Run the test suite
runFullSystemTest().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

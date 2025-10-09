/**
 * VoiceFly Footer Links Testing Suite
 * Tests all footer links to ensure they navigate to valid pages
 *
 * Run: node test-footer-links.js
 */

const { chromium } = require('playwright');

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Expected footer link structure
const EXPECTED_FOOTER_LINKS = {
  'Product': {
    'Features': '/features',
    'Pricing': '/pricing',
    'Integrations': '#',
    'API': '#'
  },
  'Company': {
    'About': '#',
    'Blog': '#',
    'Careers': '#',
    'Contact': '#'
  },
  'Legal': {
    'Privacy': '#',
    'Terms': '#',
    'Security': '#',
    'HIPAA': '#'
  }
};

/**
 * Test a single page for footer links
 */
async function testFooterLinks(page, pagePath) {
  const url = `${BASE_URL}${pagePath}`;
  console.log(`\n🔍 Testing footer on: ${url}`);

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Find all footer links
  const footerLinks = await page.$$eval('footer a', links =>
    links.map(link => ({
      text: link.textContent.trim(),
      href: link.getAttribute('href'),
      fullHref: link.href
    }))
  );

  console.log(`\n📋 Found ${footerLinks.length} footer links:\n`);

  const results = {
    working: [],
    broken: [],
    placeholder: []
  };

  for (const link of footerLinks) {
    const status = link.href === '#' ? '🔗' : '✅';
    console.log(`  ${status} ${link.text.padEnd(20)} → ${link.href}`);

    if (link.href === '#' || link.href.includes('#')) {
      results.placeholder.push({
        text: link.text,
        href: link.href,
        reason: 'Placeholder link (uses #)'
      });
    } else if (link.href.startsWith('/') || link.href.includes(BASE_URL)) {
      results.working.push({
        text: link.text,
        href: link.href
      });
    }
  }

  return { footerLinks, results };
}

/**
 * Verify that linked pages actually exist
 */
async function verifyLinkedPages(browser, links) {
  console.log('\n\n🔎 Verifying linked pages exist...\n');

  const verificationResults = [];

  for (const link of links) {
    if (link.href.startsWith('#') || link.href === '') {
      continue; // Skip placeholder links
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Extract path from href
      let path = link.href;
      if (path.includes(BASE_URL)) {
        path = path.replace(BASE_URL, '');
      }

      const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

      console.log(`  Testing: ${link.text} → ${path}`);

      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const status = response.status();
      const isWorking = status >= 200 && status < 400;

      if (isWorking) {
        console.log(`    ✅ Status ${status} - Page exists`);
        verificationResults.push({
          text: link.text,
          path,
          status,
          working: true
        });
      } else {
        console.log(`    ❌ Status ${status} - Page error`);
        verificationResults.push({
          text: link.text,
          path,
          status,
          working: false,
          error: `HTTP ${status}`
        });
      }

    } catch (error) {
      console.log(`    ❌ Failed - ${error.message}`);
      verificationResults.push({
        text: link.text,
        path: link.href,
        working: false,
        error: error.message
      });
    }

    await context.close();
  }

  return verificationResults;
}

/**
 * Main test runner
 */
async function runFooterLinkTests() {
  console.log('🚀 VoiceFly Footer Links Testing Suite\n');
  console.log(`Testing URL: ${BASE_URL}\n`);
  console.log('═'.repeat(80));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Test homepage footer
  const { footerLinks, results } = await testFooterLinks(page, '/');

  // Verify working links
  const verificationResults = await verifyLinkedPages(browser, results.working);

  await browser.close();

  // Print comprehensive summary
  console.log('\n\n' + '═'.repeat(80));
  console.log('📊 FOOTER LINKS SUMMARY\n');

  // Working links
  const workingLinks = verificationResults.filter(r => r.working);
  console.log(`✅ Working Links (${workingLinks.length}):`);
  workingLinks.forEach(link => {
    console.log(`   • ${link.text.padEnd(20)} → ${link.path} (${link.status})`);
  });

  // Broken links
  const brokenLinks = verificationResults.filter(r => !r.working);
  if (brokenLinks.length > 0) {
    console.log(`\n❌ Broken Links (${brokenLinks.length}):`);
    brokenLinks.forEach(link => {
      console.log(`   • ${link.text.padEnd(20)} → ${link.path}`);
      console.log(`     Error: ${link.error}`);
    });
  }

  // Placeholder links
  if (results.placeholder.length > 0) {
    console.log(`\n🔗 Placeholder Links - Need Pages Created (${results.placeholder.length}):`);
    results.placeholder.forEach(link => {
      console.log(`   • ${link.text.padEnd(20)} → Currently uses "#"`);
    });
  }

  console.log('\n' + '═'.repeat(80));

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');

  if (results.placeholder.length > 0) {
    console.log('1. Create missing pages for placeholder links:');
    results.placeholder.forEach(link => {
      const suggestedPath = `/${link.text.toLowerCase().replace(/\s+/g, '-')}`;
      console.log(`   - ${link.text}: Create page at ${suggestedPath}`);
    });
  }

  if (brokenLinks.length > 0) {
    console.log('\n2. Fix broken links:');
    brokenLinks.forEach(link => {
      console.log(`   - ${link.text}: ${link.error}`);
    });
  }

  if (workingLinks.length === footerLinks.length) {
    console.log('\n✅ All footer links are working perfectly!');
  } else {
    console.log(`\n⚠️  ${footerLinks.length - workingLinks.length} footer links need attention.`);
  }

  console.log('\n✨ Testing complete!\n');

  return {
    total: footerLinks.length,
    working: workingLinks.length,
    broken: brokenLinks.length,
    placeholder: results.placeholder.length
  };
}

// Run tests
runFooterLinkTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

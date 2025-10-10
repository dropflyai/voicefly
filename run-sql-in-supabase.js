const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Automatically run SQL in Supabase SQL Editor
 * This saves you from copy/pasting!
 */

async function runSQLInSupabase() {
  console.log('🚀 Automated Supabase SQL Runner');
  console.log('════════════════════════════════════════════════════════════════\n');

  // Read the SQL file
  const sqlFile = './supabase-migration-credits.sql';
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ SQL file not found:', sqlFile);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  console.log('📄 SQL file loaded:', sqlFile);
  console.log('📏 SQL length:', sqlContent.length, 'characters\n');

  const browser = await chromium.launch({
    headless: false  // Set to false so you can see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('🌐 Opening Supabase SQL Editor...');
    await page.goto('https://supabase.com/dashboard/project/kqsquisdqjedzenwhrkl/sql/new');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');

    // Check if we need to login
    const currentURL = page.url();
    if (currentURL.includes('login') || currentURL.includes('sign-in')) {
      console.log('\n⚠️  You need to login to Supabase first!');
      console.log('📋 Steps:');
      console.log('  1. Login in the browser window that just opened');
      console.log('  2. Navigate to: SQL Editor > New Query');
      console.log('  3. Press ENTER here when ready...\n');

      // Wait for user to press enter
      await new Promise(resolve => {
        process.stdin.once('data', () => resolve());
      });

      // Wait for them to navigate to SQL editor
      await page.waitForURL('**/sql/**', { timeout: 60000 });
      console.log('✅ SQL Editor detected!\n');
    }

    console.log('⏳ Waiting for SQL editor to be ready...');

    // Wait for the Monaco editor (code editor) to load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });
    console.log('✅ SQL Editor ready\n');

    console.log('📝 Pasting SQL into editor...');

    // Focus on the editor
    await page.click('.monaco-editor');
    await page.waitForTimeout(500);

    // Clear existing content
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(300);

    // Paste the SQL
    await page.keyboard.type(sqlContent, { delay: 0 });
    console.log('✅ SQL pasted successfully\n');

    console.log('🔍 Looking for Run button...');

    // Find and click the Run button
    const runButton = await page.locator('button:has-text("Run"), button:has-text("Execute")').first();

    if (await runButton.count() > 0) {
      console.log('✅ Found Run button');
      console.log('🚀 Executing SQL...\n');

      await runButton.click();
      await page.waitForTimeout(2000); // Wait for query to execute

      console.log('✅ SQL executed!');
      console.log('');
      console.log('════════════════════════════════════════════════════════════════');
      console.log('✅ DONE! Check the Supabase window for results');
      console.log('════════════════════════════════════════════════════════════════');
      console.log('');
      console.log('📋 Next steps:');
      console.log('  1. Check for any errors in the Supabase UI');
      console.log('  2. If successful, the credit system is now active!');
      console.log('  3. Test the credit system:');
      console.log('     - Sign up a new trial user (gets 50 credits)');
      console.log('     - Run Maya research (uses 10-25 credits)');
      console.log('     - Check credit balance in dashboard header');
      console.log('');
      console.log('⏸️  Browser will stay open for 30 seconds so you can check...');

      await page.waitForTimeout(30000);
    } else {
      console.log('⚠️  Could not find Run button');
      console.log('🖱️  Please click Run manually in the browser window');
      console.log('⏸️  Browser will stay open for 60 seconds...');
      await page.waitForTimeout(60000);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🖱️  Browser will stay open so you can complete manually...');
    await page.waitForTimeout(60000);
  } finally {
    await browser.close();
  }
}

// Run the automation
runSQLInSupabase().catch(console.error);

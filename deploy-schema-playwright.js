require('dotenv').config({ path: '.env.local' });
const { chromium } = require('playwright');
const fs = require('fs');

async function deploySchema() {
  console.log('🚀 Deploying schema to VoiceFly database via Playwright...\n');

  const browser = await chromium.launch({
    headless: false // Set to true for fully automated
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Extract project ref from URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];

    console.log(`📍 Project: ${projectRef}`);
    console.log(`🔗 Opening Supabase SQL Editor...`);

    // Navigate to SQL editor
    await page.goto(`https://supabase.com/dashboard/project/${projectRef}/sql/new`);

    // Wait for page to load
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);

    // Check if we need to login
    const loginButton = await page.locator('button:has-text("Sign in")').count();
    if (loginButton > 0) {
      console.log('\n⚠️  Not logged in to Supabase.');
      console.log('Please log in to Supabase in the browser window...');
      console.log('Waiting 30 seconds for login...\n');
      await page.waitForTimeout(30000);
    }

    // Read the SQL schema
    const sql = fs.readFileSync('./CLEAN-SCHEMA-FIX.sql', 'utf8');
    console.log(`📄 Schema loaded (${sql.length} characters)`);

    // Find the SQL editor (Monaco editor)
    console.log('🔍 Looking for SQL editor...');

    // Try different selectors for the Monaco editor
    const editorSelectors = [
      '.monaco-editor textarea',
      '[data-mode-id="sql"] textarea',
      '.view-lines',
      '[role="code"]'
    ];

    let editorFound = false;
    for (const selector of editorSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found editor with selector: ${selector}`);

        // Click to focus
        await page.locator(selector).first().click();
        await page.waitForTimeout(500);

        // Clear existing content
        await page.keyboard.press('Meta+A');
        await page.keyboard.press('Backspace');

        // Type the SQL
        console.log('⌨️  Pasting SQL schema...');
        await page.keyboard.insertText(sql);

        editorFound = true;
        break;
      }
    }

    if (!editorFound) {
      console.log('❌ Could not find SQL editor');
      console.log('📸 Taking screenshot for debugging...');
      await page.screenshot({ path: 'supabase-editor-debug.png', fullPage: true });
      console.log('Screenshot saved to: supabase-editor-debug.png');
      throw new Error('SQL editor not found');
    }

    console.log('✅ SQL pasted successfully');

    // Look for Run button
    console.log('🔍 Looking for Run button...');
    await page.waitForTimeout(1000);

    const runButtonSelectors = [
      'button:has-text("Run")',
      '[aria-label="Run"]',
      'button[type="submit"]'
    ];

    let buttonFound = false;
    for (const selector of runButtonSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found Run button: ${selector}`);
        await page.locator(selector).first().click();
        buttonFound = true;
        break;
      }
    }

    if (!buttonFound) {
      console.log('⚠️  Run button not found, trying keyboard shortcut...');
      await page.keyboard.press('Meta+Enter');
    }

    console.log('⏳ Executing SQL...');

    // Wait for execution to complete
    await page.waitForTimeout(5000);

    // Check for success message
    const successIndicators = [
      'text=Success',
      'text=No rows returned',
      'text=complete',
      '[aria-label="Success"]'
    ];

    let success = false;
    for (const indicator of successIndicators) {
      const count = await page.locator(indicator).count();
      if (count > 0) {
        console.log('✅ Schema deployment successful!');
        success = true;
        break;
      }
    }

    if (!success) {
      console.log('⚠️  Could not confirm success. Taking screenshot...');
      await page.screenshot({ path: 'supabase-result.png', fullPage: true });
      console.log('Screenshot saved to: supabase-result.png');
    }

    console.log('\n📊 Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'supabase-error.png', fullPage: true });
    console.log('Error screenshot saved to: supabase-error.png');
  } finally {
    await browser.close();
    console.log('\n✅ Done!');
  }
}

deploySchema();

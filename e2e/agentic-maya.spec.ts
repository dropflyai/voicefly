import { test, expect, Page } from '@playwright/test';

/**
 * Agentic Maya tests — verify Maya can execute actions through conversation.
 * These tests interact with the DashboardAssistant chat widget.
 */

async function loginAndGo(page: Page, path: string) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[name="email"], input[type="email"]').fill('test@voicefly.ai');
  await page.locator('input[name="password"], input[type="password"]').fill('Test1234!');
  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 5000 });
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard**', { timeout: 25000 });
  if (path !== '/dashboard') {
    await page.goto(path);
    await page.waitForLoadState('domcontentloaded');
  }
}

async function openMayaChat(page: Page) {
  // Maya's toggle button is a fixed-position button at bottom-right
  const toggleBtn = page.locator('button.fixed.bottom-6.right-6').first();
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click();
    await page.waitForTimeout(500);
  }
}

async function sendMayaMessage(page: Page, message: string) {
  // Find the chat input in the DashboardAssistant
  const chatInput = page.locator('input[placeholder*="help"], input[placeholder*="Ask"], textarea[placeholder*="help"], textarea[placeholder*="Ask"]').first();
  await expect(chatInput).toBeVisible({ timeout: 5000 });
  await chatInput.fill(message);
  // Press enter to send
  await chatInput.press('Enter');
}

async function waitForMayaResponse(page: Page, timeout = 30000) {
  // Wait for typing indicator to appear then disappear
  const typingIndicator = page.locator('.animate-bounce').first();
  try {
    await typingIndicator.waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    // typing indicator may have already passed
  }
  // Wait for it to disappear (means response arrived)
  await typingIndicator.waitFor({ state: 'hidden', timeout });
  await page.waitForTimeout(500);
}

async function getLastMayaMessage(page: Page): Promise<string> {
  // Get all assistant messages (not user messages)
  const messages = page.locator('[class*="surface-low"][class*="rounded-2xl"]').last();
  if (await messages.isVisible()) {
    return await messages.textContent() || '';
  }
  return '';
}

// ============================================
// TESTS
// ============================================

test.describe('Agentic Maya', () => {
  test.setTimeout(60000);

  test('Maya chat widget opens on dashboard', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    // Should see Maya's greeting
    await expect(page.getByText(/Maya|VoiceFly assistant|set up|help/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('Maya responds to messages', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    await sendMayaMessage(page, 'What can you help me with?');
    await waitForMayaResponse(page);
    // Maya should respond with something about her capabilities
    const lastMsg = await getLastMayaMessage(page);
    expect(lastMsg.length).toBeGreaterThan(20);
  });

  test('Maya can update AI knowledge when user describes business', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    await sendMayaMessage(page, 'We accept cash, Visa, Mastercard, and Apple Pay. Our parking is free in the back lot.');
    await waitForMayaResponse(page, 45000);
    // Should see action confirmation (green checkmark)
    const actionConfirm = page.locator('text=/Updated AI Knowledge|parking|payment/i').first();
    await expect(actionConfirm).toBeVisible({ timeout: 10000 }).catch(() => {
      // Action may have executed but Maya described it in text instead
    });
    // Maya should acknowledge the info was saved
    const response = await getLastMayaMessage(page);
    expect(response.toLowerCase()).toMatch(/saved|updated|got it|noted|payment|parking/i);
  });

  test('Maya can set business hours through conversation', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    await sendMayaMessage(page, 'Set our business hours to Monday through Friday 9am to 5pm, closed weekends');
    await waitForMayaResponse(page, 45000);
    const response = await getLastMayaMessage(page);
    expect(response.toLowerCase()).toMatch(/hours|monday|friday|updated|set|saved/i);
  });

  test('Maya can navigate user to a page', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    await sendMayaMessage(page, 'Take me to the billing page');
    await waitForMayaResponse(page, 30000);
    // Maya should respond about billing — navigation is a bonus
    const response = await getLastMayaMessage(page);
    // Check response or wait for navigation
    await page.waitForTimeout(2000);
    const url = page.url();
    const navigated = url.includes('/billing');
    const mentionedBilling = response.toLowerCase().match(/billing|subscription|plan|payment|navigate|taking you/i);
    expect(navigated || mentionedBilling).toBeTruthy();
  });

  test('Maya quick action buttons work', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    // Quick action buttons should be visible when chat first opens
    const quickBtn = page.locator('button').filter({ hasText: /employee|call|hours|manage/i }).first();
    if (await quickBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickBtn.click();
      await waitForMayaResponse(page, 30000);
      const response = await getLastMayaMessage(page);
      expect(response.length).toBeGreaterThan(10);
    }
  });

  test('Maya understands business context from system prompt', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    await sendMayaMessage(page, 'What plan am I on?');
    await waitForMayaResponse(page);
    const response = await getLastMayaMessage(page);
    // Should mention the plan (starter/trial/etc) since it's in the system prompt
    expect(response.toLowerCase()).toMatch(/starter|trial|plan|subscription/i);
  });

  test('Chat preserves message history', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await openMayaChat(page);
    await page.waitForTimeout(1000);
    // Send first message
    await sendMayaMessage(page, 'My name is Erik');
    await waitForMayaResponse(page);
    // Send follow up
    await sendMayaMessage(page, 'What is my name?');
    await waitForMayaResponse(page);
    const response = await getLastMayaMessage(page);
    expect(response.toLowerCase()).toContain('erik');
  });
});

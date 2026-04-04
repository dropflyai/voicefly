import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[name="email"], input[type="email"]');
  const passwordInput = page.locator('input[name="password"], input[type="password"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill('test@voicefly.ai');
  await passwordInput.fill('Test1234!');

  const submitBtn = page.locator('button[type="submit"]');
  await expect(submitBtn).toBeEnabled({ timeout: 5000 });
  await submitBtn.click();

  await page.waitForURL('**/dashboard**', { timeout: 25000 });
  await page.waitForLoadState('networkidle');

  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});

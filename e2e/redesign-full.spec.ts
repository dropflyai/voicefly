import { test, expect, Page } from '@playwright/test';

// ============================================
// PUBLIC PAGES (no auth needed)
// ============================================

test.describe('Public Pages', () => {
  test('Landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VoiceFly/i);
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('nav a[href="/demo"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/pricing"]').first()).toBeVisible();
    await expect(page.locator('nav a[href="/signup"]').first()).toBeVisible();
    await expect(page.locator('footer a[href="mailto:tony@dropfly.io"]')).toBeVisible();
  });

  test('Maya chatbot', async ({ page }) => {
    await page.goto('/');
    const mayaBtn = page.locator('button:has(img[alt="Chat with Maya"])');
    await expect(mayaBtn).toBeVisible({ timeout: 8000 });
    await mayaBtn.click();
    await expect(page.getByText('VoiceFly AI Assistant')).toBeVisible();
  });

  test('Pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('$49').first()).toBeVisible();
    await expect(page.getByText('$129').first()).toBeVisible();
    await expect(page.getByText('$249').first()).toBeVisible();
  });

  test('Demo page', async ({ page }) => {
    await page.goto('/demo');
    await expect(page.getByRole('heading', { name: /Talk to an AI/i })).toBeVisible();
    await page.getByRole('button', { name: /Hair Salon/i }).first().click();
    await expect(page.getByText('Mia').first()).toBeVisible();
  });

  test('Solutions page', async ({ page }) => {
    await page.goto('/solutions');
    await expect(page.getByRole('heading', { name: /Built for your industry/i }).first()).toBeVisible();
    await expect(page.getByText('Your Pain Points').first()).toBeVisible();
  });

  test('Signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  test('Login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in/i })).toBeVisible();
  });

  test('Privacy page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText('tony@dropfly.io').first()).toBeVisible();
  });

  test('Terms page', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText('tony@dropfly.io').first()).toBeVisible();
  });

  test('Cross-page: CTA -> signup', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/signup"]').first().click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Cross-page: login <-> signup links', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
    await page.goto('/signup');
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });
});

// ============================================
// AUTH + DASHBOARD (login once, test all tabs)
// ============================================

test.describe('Dashboard', () => {
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

  test('Login works', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Main dashboard', async ({ page }) => {
    await loginAndGo(page, '/dashboard');
    await expect(page.getByText('Welcome back').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Calls Today')).toBeVisible();
    await expect(page.getByText('Sonic Health Overview')).toBeVisible();
  });

  test('Phone Employees', async ({ page }) => {
    await loginAndGo(page, '/dashboard/employees');
    await expect(page.getByText('Phone Employees').first()).toBeVisible();
    await expect(page.getByText('Total Agents')).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Employee/i })).toBeVisible();
  });

  test('Call Log', async ({ page }) => {
    await loginAndGo(page, '/dashboard/voice-ai');
    await expect(page.getByRole('heading', { name: /Call Log/i })).toBeVisible();
    await expect(page.getByText('Total Calls')).toBeVisible();
    await expect(page.getByText('Avg Duration')).toBeVisible();
  });

  test('SMS Messages', async ({ page }) => {
    await loginAndGo(page, '/dashboard/messages');
    await expect(page.getByText('SMS Conversations').first()).toBeVisible();
  });

  test('Phone Messages', async ({ page }) => {
    await loginAndGo(page, '/dashboard/phone-messages');
    await expect(page.getByText('Phone Messages').first()).toBeVisible();
  });

  test('Orders', async ({ page }) => {
    await loginAndGo(page, '/dashboard/orders');
    await expect(page.getByText('Total Orders')).toBeVisible();
  });

  test('Appointments', async ({ page }) => {
    await loginAndGo(page, '/dashboard/appointments');
    await expect(page.getByRole('heading', { name: /Appointments/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /week/i })).toBeVisible();
  });

  test('Integrations', async ({ page }) => {
    await loginAndGo(page, '/dashboard/integrations');
    await expect(page.getByRole('heading', { name: /Integrations/i })).toBeVisible();
    await expect(page.getByText('Google Calendar', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Coming Soon' })).toBeVisible();
  });

  test('Settings + AI Knowledge tab', async ({ page }) => {
    await loginAndGo(page, '/dashboard/settings');
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
    await page.getByRole('button', { name: /AI Knowledge/i }).click();
    await expect(page.getByText('Quick Fill with AI')).toBeVisible();
    await expect(page.getByText('Contact & Location')).toBeVisible();
  });

  test('Billing — minutes not credits', async ({ page }) => {
    await loginAndGo(page, '/dashboard/billing');
    await expect(page.getByRole('heading', { name: 'Billing & Subscription' })).toBeVisible();
    await expect(page.getByText('Minutes Balance')).toBeVisible();
    await expect(page.getByText('Usage Breakdown')).toBeVisible();
    const body = await page.locator('body').textContent() || '';
    expect(body).not.toContain('Credit Balance');
    expect(body).not.toContain('Credits remaining');
  });

  test('Invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').fill('nobody@fake.com');
    await page.locator('input[type="password"], input[name="password"]').fill('wrongpass');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/invalid|error|incorrect|failed/i).first()).toBeVisible({ timeout: 10000 });
  });
});

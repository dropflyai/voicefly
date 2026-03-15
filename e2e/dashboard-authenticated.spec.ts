import { test, expect, Page } from '@playwright/test';

const SUPABASE_URL = 'https://kqsquisdqjedzenwhrkl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxc3F1aXNkcWplZHplbndocmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU2NjMsImV4cCI6MjA3MzYyMTY2M30.DNGkhNnKOOrUDcjlZhMF2VMJCLiQwprMhVWwP7sXOc8';

const TEST_EMAIL = 'testfly1234@gmail.com';
const TEST_PASSWORD = 'E2ETest2026!';
const TEST_BUSINESS_ID = 'ded4d5bb-2d40-43ae-ae6e-cda53ba66321';

async function authenticateViaAPI(page: Page) {
  // Sign in via Supabase REST API to get access token
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Auth failed: ${response.status} ${err}`);
  }

  const data = await response.json();
  const accessToken = data.access_token;

  if (!accessToken) {
    throw new Error('No access token returned');
  }

  // Set the auth cookie
  await page.context().addCookies([
    {
      name: 'sb-access-token',
      value: accessToken,
      domain: 'voiceflyai.com',
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  // Navigate and set localStorage
  await page.goto('/dashboard');
  await page.evaluate(({ businessId, email }) => {
    localStorage.setItem('authenticated_business_id', businessId);
    localStorage.setItem('authenticated_user_email', email);
    localStorage.setItem('authenticated_business_name', 'TestFly Business');
    localStorage.setItem('authenticated_business_type', 'beauty_salon');
  }, { businessId: TEST_BUSINESS_ID, email: TEST_EMAIL });

  await page.reload();
  await page.waitForTimeout(2000);
}

test.describe('Dashboard (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaAPI(page);
  });

  test('dashboard home loads without redirecting to login', async ({ page }) => {
    const url = page.url();
    expect(url).not.toMatch(/login/);
  });

  test('shows navigation sidebar or menu', async ({ page }) => {
    const navItems = page.locator('a, button').filter({
      hasText: /employees|analytics|settings|appointments|messages|billing/i,
    });
    const count = await navItems.count();
    expect(count).toBeGreaterThan(0);
  });

  const dashboardPages = [
    '/dashboard/employees',
    '/dashboard/analytics',
    '/dashboard/settings',
    '/dashboard/billing',
    '/dashboard/billing/credits',
    '/dashboard/appointments',
    '/dashboard/customers',
    '/dashboard/messages',
    '/dashboard/leads',
    '/dashboard/services',
    '/dashboard/integrations',
    '/dashboard/marketing',
    '/dashboard/research',
    '/dashboard/help',
    '/dashboard/voice-ai',
    '/dashboard/payments',
  ];

  for (const path of dashboardPages) {
    test(`${path} loads without crashing`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(3000);

      // Should NOT redirect to login
      const url = page.url();
      expect(url).not.toContain('login');

      // Page should have real content (not blank)
      const body = await page.locator('body').innerText();
      expect(body.length).toBeGreaterThan(50);
    });
  }
});

import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  test.describe('Homepage', () => {
    test('loads and has VoiceFly branding', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/VoiceFly/i);
      const body = page.locator('body');
      await expect(body).toContainText(/VoiceFly/i);
    });

    test('has CTA buttons', async ({ page }) => {
      await page.goto('/');
      const ctaButtons = page.locator('a, button').filter({
        hasText: /get started|start|try|demo|sign up|free trial/i,
      });
      await expect(ctaButtons.first()).toBeVisible();
    });
  });

  test.describe('Pricing page', () => {
    test('loads and shows pricing tiers', async ({ page }) => {
      await page.goto('/pricing');
      await expect(page.locator('body')).toContainText(/pricing/i);
      await expect(page.locator('body')).toContainText('49');
      await expect(page.locator('body')).toContainText('199');
    });
  });

  test.describe('Solutions page', () => {
    test('loads and shows industry selector', async ({ page }) => {
      await page.goto('/solutions');
      await expect(page.locator('body')).toContainText(/industry/i);
      // The page uses a custom button dropdown for industry selection
      const selectorButton = page.locator('button').filter({ hasText: /Med Spas|Dental|Home Services|Law Firms|Salons|Medical|Auto|Barber|Fitness|Real Estate|Veterinary/i }).first();
      await expect(selectorButton).toBeVisible();
    });
  });

  test.describe('Login page', () => {
    test('loads with email and password fields', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    });
  });

  test.describe('Signup page', () => {
    test('loads with registration form', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    });
  });

  test.describe('Legal pages', () => {
    test('privacy page loads', async ({ page }) => {
      await page.goto('/privacy');
      await expect(page.locator('body')).toContainText(/privacy/i);
    });

    test('terms page loads', async ({ page }) => {
      await page.goto('/terms');
      await expect(page.locator('body')).toContainText(/terms/i);
    });
  });

  test.describe('Features page', () => {
    test('loads', async ({ page }) => {
      await page.goto('/features');
      await expect(page.locator('body')).toContainText(/feature/i);
    });
  });

  test.describe('Demo page', () => {
    test('loads', async ({ page }) => {
      await page.goto('/demo');
      await expect(page.locator('body')).toContainText(/demo/i);
    });
  });

  test.describe('Footer', () => {
    const pages = ['/', '/pricing', '/solutions', '/features'];

    for (const path of pages) {
      test(`footer exists on ${path}`, async ({ page }) => {
        await page.goto(path);
        const footer = page.locator('footer');
        await expect(footer).toBeVisible();
      });
    }

    test('footer has copyright text', async ({ page }) => {
      await page.goto('/');
      const footer = page.locator('footer');
      await expect(footer).toContainText(/©|copyright|voicefly/i);
    });
  });

  test.describe('Navigation links', () => {
    test('header navigation links are present', async ({ page }) => {
      await page.goto('/');
      const nav = page.locator('header, nav').first();
      await expect(nav).toBeVisible();
    });
  });
});

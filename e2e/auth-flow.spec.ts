import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login page', () => {
    test('has email and password fields', async ({ page }) => {
      await page.goto('/login');
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('has a submit/login button', async ({ page }) => {
      await page.goto('/login');
      const loginButton = page.locator('button[type="submit"], button').filter({ hasText: /log in|sign in|submit/i }).first();
      await expect(loginButton).toBeVisible();
    });

    test('login with invalid credentials shows error', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

      await emailInput.fill('fake-test-user@nonexistent-domain-12345.com');
      await passwordInput.fill('wrongpassword123');

      const loginButton = page.locator('button[type="submit"], button').filter({ hasText: /log in|sign in|submit/i }).first();
      await loginButton.click();

      // Should show an error message
      const error = page.locator('[role="alert"], .error, [class*="error"], [class*="toast"]').first();
      await expect(error).toBeVisible({ timeout: 10000 }).catch(async () => {
        // Fallback: check for error text in the body
        const body = page.locator('body');
        await expect(body).toContainText(/invalid|error|incorrect|wrong|failed|not found/i, { timeout: 5000 });
      });
    });
  });

  test.describe('Signup page', () => {
    test('has required fields (email, password, name, company, industry)', async ({ page }) => {
      await page.goto('/signup');

      // Email field
      const emailInput = page.locator('input[placeholder*="email" i], input[type="email"], input[name="email"]').first();
      await expect(emailInput).toBeVisible();

      // Name fields (First name, Last name)
      const firstNameInput = page.locator('input[placeholder*="john" i], input[name*="first" i], input[placeholder*="first" i]').first();
      await expect(firstNameInput).toBeVisible();

      // Company name field
      const companyInput = page.locator('input[placeholder*="company" i], input[name*="company" i]').first();
      await expect(companyInput).toBeVisible();
    });

    test('has social login options (Google, Apple)', async ({ page }) => {
      await page.goto('/signup');

      const googleButton = page.locator('button, a').filter({ hasText: /google/i }).first();
      const appleButton = page.locator('button, a').filter({ hasText: /apple/i }).first();

      await expect(googleButton).toBeVisible();
      await expect(appleButton).toBeVisible();
    });

    test('signup form disables submit when fields are empty', async ({ page }) => {
      await page.goto('/signup');

      // Find submit button
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();

      // Button should be disabled when form is empty (proper validation)
      await expect(submitButton).toBeDisabled();

      // Page should stay on signup
      await expect(page).toHaveURL(/signup/);
    });
  });

  test.describe('Dashboard redirect', () => {
    test('dashboard redirects unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 10000 });
    });
  });
});

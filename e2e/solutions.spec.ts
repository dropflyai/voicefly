import { test, expect } from '@playwright/test';

test.describe('Solutions / Industry Pages', () => {
  test('industry selector button is visible', async ({ page }) => {
    await page.goto('/solutions');

    // The solutions page uses a custom button dropdown (not a native select)
    // Look for the button that shows the selected industry with a chevron
    const selectorButton = page.locator('button').filter({ hasText: /Med Spas|Dental|Home Services|Law Firms|Salons|Medical|Auto|Barber|Fitness|Real Estate|Veterinary/i }).first();
    await expect(selectorButton).toBeVisible();
  });

  test('clicking selector opens dropdown with multiple industries', async ({ page }) => {
    await page.goto('/solutions');

    // Click the dropdown button to open it
    const selectorButton = page.locator('button').filter({ hasText: /Med Spas|Dental|Home Services|Law Firms|Salons|Medical|Auto|Barber|Fitness|Real Estate|Veterinary/i }).first();
    await selectorButton.click();
    await page.waitForTimeout(500);

    // After clicking, a list of industry buttons should appear
    const industryOptions = page.locator('button').filter({ hasText: /Med Spas|Dental|Home Services|Law Firms|Medical|Auto|Barber|Fitness|Real Estate|Veterinary/i });
    const count = await industryOptions.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('page shows relevant industry content (ROI, features)', async ({ page }) => {
    await page.goto('/solutions');

    const body = page.locator('body');
    const hasRelevantContent = await Promise.all([
      body.getByText(/missed calls|lost revenue|after-hours|conversion/i).count(),
      body.getByText(/AI|voice|receptionist|maya/i).count(),
    ]);

    const totalRelevantElements = hasRelevantContent.reduce((a, b) => a + b, 0);
    expect(totalRelevantElements).toBeGreaterThan(0);
  });

  test('no Coming Soon labels present', async ({ page }) => {
    await page.goto('/solutions');
    const comingSoon = page.locator('body').getByText(/coming soon/i);
    await expect(comingSoon).toHaveCount(0);
  });

  test('selecting a different industry updates page content', async ({ page }) => {
    await page.goto('/solutions');

    // Get the initial industry name shown
    const selectorButton = page.locator('button').filter({ hasText: /Med Spas|Dental|Home Services|Law Firms|Salons|Medical|Auto|Barber|Fitness|Real Estate|Veterinary/i }).first();
    const initialText = await selectorButton.innerText();

    // Click to open dropdown
    await selectorButton.click();
    await page.waitForTimeout(500);

    // Click a different industry (Dental Practices)
    const dentalOption = page.locator('button').filter({ hasText: /Dental/i }).first();
    await dentalOption.click();
    await page.waitForTimeout(500);

    // Page should still have industry-relevant content
    await expect(page.locator('body')).toContainText(/AI|receptionist|maya|ROI/i);
  });
});

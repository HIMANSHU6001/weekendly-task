import { test, expect } from '@playwright/test';

test.describe('Quick Smoke Test', () => {
  test('should verify app is accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Weekendly/);
    await expect(page.locator('h1')).toContainText('Weekendly');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    console.log('Basic smoke test passed');
  });
});

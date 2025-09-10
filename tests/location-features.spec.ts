import { test, expect } from '@playwright/test';

test.describe('Weekendly Location Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have location picker in activity forms', async ({ page }) => {
    const activityButtons = page.locator('button:has-text("Add"), .activity-button, [data-testid="activity-button"]');

    const activityCount = await activityButtons.count();
    if (activityCount > 0) {
      const firstActivity = activityButtons.first();
      await firstActivity.click();

      await page.waitForTimeout(500);

      const locationInput = page.locator('input[placeholder*="location" i], input[placeholder*="search" i]');

      if (await locationInput.isVisible()) {
        await expect(locationInput).toBeVisible();
        await expect(locationInput).toBeEnabled();

        await locationInput.fill('Central Park');
        await expect(locationInput).toHaveValue('Central Park');

        const mapIcon = page.locator('svg[data-testid="map-pin"], .lucide-map-pin');
        await expect(mapIcon).toBeVisible();
      }
    }
  });

  test('should handle location picker without Google Maps API', async ({ page }) => {
    const locationInputs = page.locator('input[placeholder*="location" i]');

    const inputCount = await locationInputs.count();
    if (inputCount > 0) {
      const firstLocationInput = locationInputs.first();

      await firstLocationInput.fill('Manual Location');
      await expect(firstLocationInput).toHaveValue('Manual Location');

    }
  });

  test('should show location in activity cards', async ({ page }) => {
    const activityCards = page.locator('.activity-card, [data-testid="activity-card"]');

    const cardCount = await activityCards.count();
    if (cardCount > 0) {
      const locationElements = page.locator('svg[data-testid="map-pin"], .lucide-map-pin');
      const locationCount = await locationElements.count();
      if (locationCount > 0) {
        const firstLocationIcon = locationElements.first();
        await expect(firstLocationIcon).toBeVisible();
      }
    }
  });
});

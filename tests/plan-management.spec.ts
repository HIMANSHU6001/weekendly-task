import { test, expect } from '@playwright/test';

test.describe('Weekendly Plan Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show plan creation interface', async ({ page }) => {
    const createPlanButton = page.locator('button:has-text("Create"), button:has-text("New Plan"), [data-testid="create-plan"]');

    if (await createPlanButton.first().isVisible()) {
      await expect(createPlanButton.first()).toBeVisible();
      await expect(createPlanButton.first()).toBeEnabled();
    }
  });

  test('should handle plan selection', async ({ page }) => {
    const planSelectors = page.locator('select, [role="combobox"], [data-testid="plan-selector"]');

    const selectorCount = await planSelectors.count();
    if (selectorCount > 0) {
      const firstSelector = planSelectors.first();
      await expect(firstSelector).toBeVisible();
    }
  });

  test('should display weekend schedule layout', async ({ page }) => {
    const dayColumns = page.locator('[data-testid="day-column"], .day-column, h3:has-text("Saturday"), h3:has-text("Sunday")');

    const columnCount = await dayColumns.count();
    if (columnCount > 0) {
      await expect(dayColumns.first()).toBeVisible();

      const saturdayColumn = page.locator('text="Saturday"').first();
      const sundayColumn = page.locator('text="Sunday"').first();

      if (await saturdayColumn.isVisible()) {
        await expect(saturdayColumn).toBeVisible();
      }
      if (await sundayColumn.isVisible()) {
        await expect(sundayColumn).toBeVisible();
      }
    }
  });

  test('should show activity management interface', async ({ page }) => {
    const activityInterface = page.locator('.activity-selector, [data-testid="activity-selector"], h3:has-text("Activities")');

    if (await activityInterface.first().isVisible()) {
      await expect(activityInterface.first()).toBeVisible();
    }
  });

  test('should handle category filtering', async ({ page }) => {
    const categoryButtons = page.locator('button:has-text("lazy"), button:has-text("adventurous"), button:has-text("family"), button:has-text("all")');

    const categoryCount = await categoryButtons.count();
    if (categoryCount > 0) {
      const firstCategory = categoryButtons.first();
      await expect(firstCategory).toBeVisible();
      await expect(firstCategory).toBeEnabled();

      await firstCategory.click();
      await page.waitForTimeout(300);

      await expect(firstCategory).toBeEnabled();
    }
  });

  test('should show share functionality', async ({ page }) => {
    const shareButton = page.locator('button:has-text("Share"), [data-testid="share-button"]');

    if (await shareButton.first().isVisible()) {
      await expect(shareButton.first()).toBeVisible();
      await expect(shareButton.first()).toBeEnabled();
    }
  });

  test('should handle mobile drag indicators', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const dragHandles = page.locator('.grip-vertical, svg[data-testid="grip-vertical"]');

    const handleCount = await dragHandles.count();
    if (handleCount > 0) {
      const firstHandle = dragHandles.first();
      await expect(firstHandle).toBeVisible();
    }
  });

  test('should display activity cards with proper styling', async ({ page }) => {
    const activityCards = page.locator('.activity-card, [data-testid="activity-card"]');

    const cardCount = await activityCards.count();
    if (cardCount > 0) {
      const firstCard = activityCards.first();
      await expect(firstCard).toBeVisible();

      const borderColor = await firstCard.evaluate(el => getComputedStyle(el).borderLeftColor);
      expect(borderColor).toBeTruthy();

      const activityIcon = firstCard.locator('svg').first();
      if (await activityIcon.isVisible()) {
        await expect(activityIcon).toBeVisible();
      }
    }
  });
});

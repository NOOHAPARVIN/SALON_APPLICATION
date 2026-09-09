import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Update this to match the actual title of your app
  await expect(page).toHaveTitle(/Salon|Rospa|Elan/i);
});

test('booking page loads', async ({ page }) => {
  await page.goto('/booking');

  // Verify the booking page has some expected text or element
  await expect(page.locator('body')).toBeVisible();
});

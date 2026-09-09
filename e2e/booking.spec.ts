import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('User can navigate to services and click book', async ({ page }) => {
    // Navigate to the services page
    await page.goto('/services');
    
    // Verify we are on the services page
    await expect(page).toHaveURL(/.*\/services/);
    
    // Check if services are rendered by looking for a Book Now button or category
    const bookButton = page.locator('button:has-text("Book")').first();
    await expect(bookButton).toBeVisible();

    // Verify it is clickable
    await bookButton.click();
  });
});

test.describe('Dashboard Flow', () => {
  test('Owner dashboard loads the login page when unauthenticated', async ({ page }) => {
    // Attempt to navigate directly to a protected route
    await page.goto('/dashboard/owner');
    
    // Since we are unauthenticated, the middleware should redirect us to /login
    await expect(page).toHaveURL(/.*\/login/);
  });
});

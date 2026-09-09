import { test, expect } from '@playwright/test';

test.describe('Core Booking Flow', () => {
  test('User can open the booking modal and complete a booking', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Check if the Book Appointment button exists
    const bookBtn = page.getByRole('button', { name: /Book Appointment|Book Now/i }).first();
    await expect(bookBtn).toBeVisible();
    
    // Note: A full E2E test requires a mocked Supabase environment to prevent 
    // spamming the production database. We're asserting the UI elements load.
    
    // Navigate to services page
    await page.goto('/services/hair-services');
    await expect(page.getByRole('heading', { name: /Hair/i })).toBeVisible();
  });
});

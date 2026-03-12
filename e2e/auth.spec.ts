/**
 * E2E Test: Authentication Journey
 * 
 * Tests: Login → Dashboard → Sign Out
 * Prerequisites: Valid test user credentials in environment
 */
import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPass123!';

test.describe('Authentication', () => {
    test('login page loads correctly', async ({ page }) => {
        await page.goto('/auth');
        await expect(page).toHaveTitle(/ProjectOye|Login/i);
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('login with valid credentials redirects to dashboard', async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        // Should redirect to dashboard or main app
        await page.waitForURL(/\/(dashboard|app|projects)/i, { timeout: 15000 });
        await expect(page.locator('body')).toBeVisible();
    });

    test('login with invalid credentials shows error', async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Error message should appear
        await expect(page.locator('[role="alert"], .error, .toast')).toBeVisible({ timeout: 5000 });
    });

    test('sign out returns to login', async ({ page }) => {
        // First login
        await page.goto('/auth');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(dashboard|app|projects)/i, { timeout: 15000 });

        // Find and click sign out
        const userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user"], button:has-text("Sign Out")');
        if (await userMenu.isVisible()) {
            await userMenu.click();
        }
        const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out"), button:has-text("Logout")');
        if (await signOutButton.isVisible()) {
            await signOutButton.click();
        }
        // Should return to auth page
        await page.waitForURL(/\/auth/i, { timeout: 10000 });
    });
});

/**
 * E2E Test: Public Routes & Access Control
 * 
 * Tests: Public pages accessible without auth, protected pages redirect
 */
import { test, expect } from '@playwright/test';

test.describe('Access Control', () => {
    test('auth page is publicly accessible', async ({ page }) => {
        await page.goto('/auth');
        await expect(page.locator('body')).toBeVisible();
        // Should show login form
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('protected route redirects to auth', async ({ page }) => {
        await page.goto('/dashboard');
        // Should redirect to auth page if not logged in
        await page.waitForURL(/\/(auth|login)/i, { timeout: 10000 });
    });

    test('admin route redirects non-admin users', async ({ page }) => {
        await page.goto('/admin');
        // Should redirect to auth or show access denied
        await page.waitForTimeout(3000);
        const url = page.url();
        expect(url).toMatch(/\/(auth|login|dashboard|access-denied)/i);
    });
});

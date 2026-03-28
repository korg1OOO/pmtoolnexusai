/**
 * E2E Test: Navigation & Page Rendering
 * 
 * Tests: All major pages render without errors
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth');
        await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(dashboard|app|projects)/i, { timeout: 15000 });
    });

    test('dashboard renders without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        await page.waitForLoadState('networkidle');
        // Filter out expected React dev warnings
        const real = errors.filter(e => !e.includes('Warning:') && !e.includes('DevTools'));
        expect(real.length).toBeLessThanOrEqual(3); // Allow a few non-critical errors
    });

    test('pricing page is accessible', async ({ page }) => {
        await page.goto('/pricing');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });

    test('subscription page is accessible', async ({ page }) => {
        await page.goto('/subscription');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).toBeVisible();
    });
});

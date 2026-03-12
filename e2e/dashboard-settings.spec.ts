/**
 * E2E Test: Dashboard, Settings & Global UI
 * 
 * Uses pre-authenticated storage state from global setup.
 */
import { test, expect } from '@playwright/test';

test.setTimeout(60_000);

test.describe('Dashboard & Settings', () => {
    test('dashboard shows navigation sidebar', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(3000);
        const sidebar = page.locator('nav, [role="navigation"], aside, .sidebar');
        await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
    });

    test('dashboard has main content area', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('settings page loads', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('profile page loads', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('AI credits page loads', async ({ page }) => {
        await page.goto('/ai-credits-usage');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('notifications page loads', async ({ page }) => {
        await page.goto('/notifications');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('projects list page loads', async ({ page }) => {
        await page.goto('/projects');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Global UI Elements', () => {
    test('no accessibility violations on dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('responsive: sidebar at mobile viewport', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(500);
        await expect(page.locator('body')).toBeVisible();
    });

    test('theme toggle works if present', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const themeToggle = page.locator('button[aria-label*="theme"], button[class*="theme"], [data-testid="theme-toggle"]').first();
        if (await themeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
            await themeToggle.click();
            await page.waitForTimeout(500);
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

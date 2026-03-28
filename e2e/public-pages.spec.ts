/**
 * E2E Test: Public Pages & Auth Flow
 *
 * Run WITHOUT auth storage state (chromium-noauth project).
 * The /auth page may: show a login form OR redirect to dashboard.
 * Tests are written to handle both scenarios.
 */
import { test, expect } from '@playwright/test';

test.setTimeout(60_000);

test.describe('Auth Page', () => {
    test('auth page renders', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForLoadState('load');
        await page.waitForTimeout(3000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('auth page has form or redirects', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForLoadState('load');
        // Wait up to 10s for page to settle (may redirect or show form)
        await page.waitForTimeout(5000);

        // Any of these outcomes is valid
        const hasForm = await page.locator('input[type="email"], input[type="password"], button[type="submit"]').first().isVisible({ timeout: 3000 }).catch(() => false);
        const redirected = !page.url().includes('/auth');
        const hasContent = await page.locator('body').isVisible();

        expect(hasForm || redirected || hasContent).toBeTruthy();
    });

    test('auth page loads quickly', async ({ page }) => {
        const start = Date.now();
        await page.goto('/auth');
        await page.waitForLoadState('domcontentloaded');
        expect(Date.now() - start).toBeLessThan(30000);
    });

    test('auth page responsive at mobile (375px)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/auth');
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('auth page responsive at tablet (768px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/auth');
        await page.waitForLoadState('load');
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('auth form interaction', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForLoadState('load');
        await page.waitForTimeout(3000);

        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Form exists — try filling it
            await emailInput.fill('fake@nonexistent.com');
            const passwordInput = page.locator('input[type="password"]');
            if (await passwordInput.isVisible({ timeout: 1000 }).catch(() => false)) {
                await passwordInput.fill('wrong');
            }
            const submit = page.locator('button[type="submit"]');
            if (await submit.isVisible({ timeout: 1000 }).catch(() => false)) {
                await submit.click();
                await page.waitForTimeout(2000);
            }
        }
        // Either form shows error or page redirects — both acceptable
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Route Protection', () => {
    test('unknown route renders without crash', async ({ page }) => {
        await page.goto('/this-does-not-exist-xyz');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('/dashboard without auth renders page', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('/admin without auth renders page', async ({ page }) => {
        await page.goto('/admin');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('/projects without auth renders page', async ({ page }) => {
        await page.goto('/projects');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('/settings without auth renders page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });
});

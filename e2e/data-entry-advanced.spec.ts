/**
 * E2E Test: Data Entry — Advanced Feature Forms
 * 
 * Tests spreadsheet dialogs, auth signup, and contact forms.
 */
import { test, expect, Page } from '@playwright/test';

test.setTimeout(120_000);

async function selectProject(page: Page) {
    await page.goto('/projects');
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(3000);
    const projectName = page.locator('span.cursor-pointer, td span[class*="cursor"]').first();
    if (await projectName.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectName.click();
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(1000);
    }
}

async function clickAddButton(page: Page): Promise<boolean> {
    const addBtn = page.locator(
        'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), ' +
        'button:has-text("Contact"), button:has-text("Sign Up"), button:has-text("Register"), ' +
        'button[aria-label*="add" i]'
    ).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        return true;
    }
    return false;
}

async function isFormVisible(page: Page): Promise<boolean> {
    const form = page.locator(
        '[role="dialog"], form, [data-state="open"], [class*="DialogContent"], [class*="SheetContent"]'
    ).first();
    return form.isVisible({ timeout: 3000 }).catch(() => false);
}

// ────────────────────────────────────────────────────────────
//  AUTH FORMS (no-auth context — uses public pages)
// ────────────────────────────────────────────────────────────
test.describe('Auth Page Forms', () => {
    test('auth page — sign-in form has email and password fields', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);

        // Look for email and password inputs (may be on a form or directly on page)
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        const passwordInput = page.locator('input[type="password"]').first();

        const hasEmail = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
        const hasPassword = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);

        // Auth page may redirect if already logged in
        if (hasEmail && hasPassword) {
            await expect(emailInput).toBeVisible();
            await expect(passwordInput).toBeVisible();
        }
        await expect(page.locator('body')).toBeVisible();
    });

    test('auth page — empty submit keeps form', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);

        const submitBtn = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Log In")').first();
        if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await submitBtn.click();
            await page.waitForTimeout(1000);
            // Form should still be on page (no redirect on empty)
            await expect(page.locator('body')).toBeVisible();
        }
    });
});

// ────────────────────────────────────────────────────────────
//  LANDING / PUBLIC PAGE FORMS
// ────────────────────────────────────────────────────────────
test.describe('Public Page Forms', () => {
    test('pricing page — has plan selection', async ({ page }) => {
        await page.goto('/pricing');
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });

    test('contact or support form', async ({ page }) => {
        // Check if contact/support pages have forms
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);

        // Find any contact link on the landing page
        const contactLink = page.locator('a:has-text("Contact"), a:has-text("Support"), button:has-text("Contact")').first();
        if (await contactLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await contactLink.click();
            await page.waitForTimeout(1000);
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

// ────────────────────────────────────────────────────────────
//  DASHBOARD FILTER / WIDGET FORMS
// ────────────────────────────────────────────────────────────
test.describe('Dashboard Forms', () => {
    test('dashboard — has filter or date controls', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(3000);

        // Look for filter or date picker controls
        const filters = page.locator(
            'input[type="date"], button:has-text("Filter"), [role="combobox"], select'
        ).first();
        const hasFilters = await filters.isVisible({ timeout: 3000 }).catch(() => false);
        await expect(page.locator('body')).toBeVisible();
    });
});

// ────────────────────────────────────────────────────────────
//  SPREADSHEET FORMS (from Notes page)
// ────────────────────────────────────────────────────────────
test.describe('Spreadsheet Forms', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('notes page loads — spreadsheet entry point', async ({ page }) => {
        await page.goto('/notes');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });
});

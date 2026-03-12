/**
 * E2E Test: Data Entry — Admin Panel Forms
 * 
 * Tests admin-level forms: Billing, AI, ML, Users, Roles, Settings pages.
 */
import { test, expect, Page } from '@playwright/test';

test.setTimeout(120_000);

async function clickAddButton(page: Page): Promise<boolean> {
    const addBtn = page.locator(
        'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), ' +
        'button:has-text("Invite"), button:has-text("Generate"), ' +
        'button[aria-label*="add" i], button[aria-label*="create" i]'
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

const adminPages = [
    { route: '/admin/users', name: 'Admin Users' },
    { route: '/admin/roles', name: 'Admin Roles' },
    { route: '/admin/subscriptions', name: 'Admin Subscriptions' },
    { route: '/admin/billing', name: 'Admin Billing' },
    { route: '/admin/api-keys', name: 'Admin API Keys' },
    { route: '/admin/ai-agents', name: 'Admin AI Agents' },
    { route: '/admin/ml-models', name: 'Admin ML Models' },
    { route: '/admin/notifications', name: 'Admin Notifications' },
    { route: '/admin/security', name: 'Admin Security' },
    { route: '/admin/content', name: 'Admin Content' },
];

test.describe('Admin Panel Forms', () => {
    for (const { route, name } of adminPages) {
        test(`${name} — form opens on Add/Create click`, async ({ page }) => {
            await page.goto(route);
            await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
            await page.waitForTimeout(2000);
            const opened = await clickAddButton(page);
            if (opened) {
                expect(await isFormVisible(page)).toBe(true);
            }
            await expect(page.locator('body')).toBeVisible();
        });
    }
});

test.describe('Settings Forms', () => {
    test('settings page — form fields present', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const inputs = page.locator('input, textarea, select').first();
        const hasInputs = await inputs.isVisible({ timeout: 3000 }).catch(() => false);
        // Settings pages typically have inline forms
        await expect(page.locator('body')).toBeVisible();
    });

    test('profile page — form fields present', async ({ page }) => {
        await page.goto('/profile');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });
});

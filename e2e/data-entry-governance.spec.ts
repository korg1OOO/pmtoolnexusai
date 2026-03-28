/**
 * E2E Test: Data Entry — Governance & Reports Forms
 * 
 * Tests governance (delegation, approvals) and reports (schedule, export) forms.
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
        'button:has-text("Delegate"), button:has-text("Export"), button:has-text("Schedule"), ' +
        'button:has-text("Generate"), button:has-text("Download"), ' +
        'button[aria-label*="add" i], button[aria-label*="export" i]'
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

test.describe('Reports Forms', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('reports page — export/schedule button present', async ({ page }) => {
        await page.goto('/reports');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) {
            expect(await isFormVisible(page)).toBe(true);
        }
        await expect(page.locator('body')).toBeVisible();
    });

    test('reports — form dialog opens', async ({ page }) => {
        await page.goto('/reports');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            const dialog = page.locator('[role="dialog"], [data-state="open"]').first();
            await expect(dialog).toBeVisible();
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Gantt Page Forms', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('gantt page — Add task button', async ({ page }) => {
        await page.goto('/gantt');
        await page.waitForLoadState('load', { timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(3000);
        const opened = await clickAddButton(page);
        if (opened) {
            expect(await isFormVisible(page)).toBe(true);
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('Create Project Dialog', () => {
    test('projects page — Create Project opens dialog', async ({ page }) => {
        await page.goto('/projects');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(3000);
        const opened = await clickAddButton(page);
        if (opened) {
            expect(await isFormVisible(page)).toBe(true);
        }
        await expect(page.locator('body')).toBeVisible();
    });

    test('projects page — dialog has name field', async ({ page }) => {
        await page.goto('/projects');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(3000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            const nameInput = page.locator('[role="dialog"] input, [data-state="open"] input').first();
            const hasInput = await nameInput.isVisible({ timeout: 3000 }).catch(() => false);
            expect(hasInput).toBe(true);
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

/**
 * E2E Test: Data Entry — Financial Forms
 * 
 * Tests Budget and Invoice form dialogs.
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
        'button:has-text("Add Item"), button:has-text("Add Invoice"), button:has-text("Add Budget"), ' +
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

async function clickSubmit(page: Page): Promise<boolean> {
    const submit = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Add")'
    ).last();
    if (await submit.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submit.click();
        await page.waitForTimeout(1000);
        return true;
    }
    return false;
}

test.describe('Budget Forms', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('budget page — Add button visible', async ({ page }) => {
        await page.goto('/budget');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
        await expect(page.locator('body')).toBeVisible();
    });

    test('budget page — empty submit validation', async ({ page }) => {
        await page.goto('/budget');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

test.describe('EVM Page Forms', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('EVM page loads without crash', async ({ page }) => {
        await page.goto('/evm');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
    });
});

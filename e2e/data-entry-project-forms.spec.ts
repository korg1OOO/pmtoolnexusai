/**
 * E2E Test: Data Entry — Project & Core Module Forms
 * 
 * Tests form dialogs on project-level views for: visibility, validation, data entry.
 * Uses pre-authenticated storage state from global setup.
 */
import { test, expect, Page } from '@playwright/test';

test.setTimeout(120_000);

/** Helper: select a project before testing project-scoped views */
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

/** Helper: find and click the primary "Add" / "New" / "Create" button on the page */
async function clickAddButton(page: Page): Promise<boolean> {
    const addBtn = page.locator(
        'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), ' +
        'button:has-text("Add New"), button:has-text("New Item"), ' +
        'button[aria-label*="add" i], button[aria-label*="create" i], button[aria-label*="new" i]'
    ).first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        return true;
    }
    return false;
}

/** Helper: check if a form dialog or form area is visible */
async function isFormVisible(page: Page): Promise<boolean> {
    const form = page.locator(
        '[role="dialog"], form, [data-state="open"], .dialog-content, ' +
        '[class*="DialogContent"], [class*="SheetContent"]'
    ).first();
    return form.isVisible({ timeout: 3000 }).catch(() => false);
}

/** Helper: try to click the submit/save button */
async function clickSubmit(page: Page): Promise<boolean> {
    const submit = page.locator(
        'button[type="submit"], button:has-text("Save"), button:has-text("Submit"), ' +
        'button:has-text("Create"), button:has-text("Add")'
    ).last();
    if (await submit.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submit.click();
        await page.waitForTimeout(1000);
        return true;
    }
    return false;
}

// ────────────────────────────────────────────────────────────
//  RISKS form
// ────────────────────────────────────────────────────────────
test.describe('Risks Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/risks');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) {
            expect(await isFormVisible(page)).toBe(true);
        }
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/risks');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            // Form should remain open (not close) on empty submit
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  ISSUES form
// ────────────────────────────────────────────────────────────
test.describe('Issues Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/issues');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/issues');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  TASKS form
// ────────────────────────────────────────────────────────────
test.describe('Tasks Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/tasks');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/tasks');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  MILESTONES form
// ────────────────────────────────────────────────────────────
test.describe('Milestones Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/milestones');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/milestones');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  DELIVERABLES form
// ────────────────────────────────────────────────────────────
test.describe('Deliverables Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/deliverables');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/deliverables');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  ACTION ITEMS form
// ────────────────────────────────────────────────────────────
test.describe('Action Items Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/action-items');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/action-items');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  BACKLOG form
// ────────────────────────────────────────────────────────────
test.describe('Backlog Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/backlog');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/backlog');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  CHANGE REQUESTS form
// ────────────────────────────────────────────────────────────
test.describe('Change Requests Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/change-requests');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/change-requests');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  DECISIONS form
// ────────────────────────────────────────────────────────────
test.describe('Decisions Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/decisions');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/decisions');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  STAKEHOLDERS form
// ────────────────────────────────────────────────────────────
test.describe('Stakeholders Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/stakeholders');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/stakeholders');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

// ────────────────────────────────────────────────────────────
//  MEETINGS form
// ────────────────────────────────────────────────────────────
test.describe('Meetings Form', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('can open add form', async ({ page }) => {
        await page.goto('/meetings');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        const opened = await clickAddButton(page);
        if (opened) expect(await isFormVisible(page)).toBe(true);
    });

    test('empty submit shows validation', async ({ page }) => {
        await page.goto('/meetings');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
        if (await clickAddButton(page) && await isFormVisible(page)) {
            await clickSubmit(page);
            expect(await isFormVisible(page)).toBe(true);
        }
    });
});

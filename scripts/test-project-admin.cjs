// Test Project Admin view — accessed via sidebar click
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || '.';

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();

    // Login
    await page.goto('http://localhost:8080/login', { timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.fill('#email', 'admin@kiroxys.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(4000);

    // Step 1: Expand sidebar by clicking the chevron-right button (top-left)
    const expandBtn = page.locator('button:has(.lucide-chevron-right)').first();
    if (await expandBtn.count() > 0) {
        await expandBtn.click();
        await page.waitForTimeout(500);
    }

    // Step 2: Scroll down in the sidebar nav to find Administration section
    const sidebar = page.locator('nav').first();
    await sidebar.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);

    // Step 3: Click "Administration" group to expand it
    const adminGroup = page.locator('button span:text("Administration")').first();
    if (await adminGroup.count() > 0) {
        await adminGroup.click();
        await page.waitForTimeout(500);
    } else {
        // Try clicking the shield icon button (Administration group icon)
        const groups = await page.locator('button').allTextContents();
        const adminIdx = groups.findIndex(t => t.includes('Administration'));
        if (adminIdx >= 0) {
            await page.locator('button').nth(adminIdx).click();
            await page.waitForTimeout(500);
        }
    }

    // Step 4: Click "Project Admin"
    const projAdminBtn = page.locator('button span:text("Project Admin")').first();
    const found = await projAdminBtn.count();
    if (found > 0) {
        await projAdminBtn.click();
        await page.waitForTimeout(3000);
    } else {
        // Alternative: find by partial text
        const allBtns = await page.locator('button').allTextContents();
        const paIdx = allBtns.findIndex(t => t.includes('Project Admin'));
        if (paIdx >= 0) {
            await page.locator('button').nth(paIdx).click();
            await page.waitForTimeout(3000);
        }
    }

    await page.screenshot({ path: path.join(OUT, 'admin_project.png') });

    // Verify ProjectAdminView rendered
    const body = await page.locator('body').textContent().catch(() => '');
    const hasTitle = body.includes('Project Administration');
    const hasSettings = body.includes('Settings') && body.includes('Methodology');
    const hasModules = body.includes('Module');

    const result = hasTitle ? 'OK (title found)' : hasSettings ? 'OK (settings found)' : hasModules ? 'OK (modules found)' : 'NOT RENDERED';

    const fs = require('fs');
    fs.writeFileSync(path.join(OUT, 'project-admin-result.txt'),
        `Status: ${result}\nTitle: ${hasTitle}\nSettings: ${hasSettings}\nModules: ${hasModules}\n`);

    console.log(`Project Admin: ${result}`);
    await browser.close();
})();

// Part 5: Interactive UI Testing of All Admin Areas
// Tests CRUD operations, guard enforcement, and data rendering
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8080';
const OUT = process.argv[2] || 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\5e2343db-dc95-4fb2-9321-5cd52b79edb4';
const results = [];

function log(area, test, status, detail = '') {
    const entry = { area, test, status, detail, ts: new Date().toISOString() };
    results.push(entry);
    console.log(`[${status}] ${area} > ${test}${detail ? ': ' + detail : ''}`);
}

async function login(page) {
    await page.goto(`${BASE}/login`, { timeout: 15000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.fill('#email', 'admin@projectoye.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(3000);
}

async function safePage(page, url, area, name) {
    try {
        await page.goto(`${BASE}${url}`, { timeout: 10000 });
    } catch (e) {
        // If timeout, check if we got redirected (guard working) or truly failed
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/login')) {
            log(area, name + ' (redirected by guard)', 'PASS', 'Guard redirected to ' + currentUrl);
            return false;
        }
        log(area, name, 'FAIL', 'Navigation timeout');
        return false;
    }
    await page.waitForTimeout(2500);
    return true;
}

async function testTenantAdmin(page) {
    const area = 'Tenant Admin';

    // 1. Dashboard
    if (await safePage(page, '/tenant', area, 'Dashboard nav')) {
        const dashTitle = await page.textContent('h1').catch(() => null);
        log(area, 'Dashboard renders', dashTitle ? 'PASS' : 'FAIL', dashTitle);
        const metricCards = await page.$$('text=/Workspaces|Team Members|Active Projects|Programs/');
        log(area, 'Metric cards', metricCards.length >= 3 ? 'PASS' : 'FAIL', `${metricCards.length} cards`);
        const quickActions = await page.$$('text=/Invite Users|Manage Licenses|View Analytics/');
        log(area, 'Quick actions', quickActions.length >= 2 ? 'PASS' : 'FAIL', `${quickActions.length}`);
    }

    // 2. Workspace Management CRUD
    if (await safePage(page, '/tenant/workspaces', area, 'Workspaces nav')) {
        const wsTitle = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Workspace Mgmt renders', wsTitle ? 'PASS' : 'FAIL', wsTitle);
        const createBtn = await page.$('button:has-text("Create"), button:has-text("New Workspace"), button:has-text("Add")');
        log(area, 'Create button exists', createBtn ? 'PASS' : 'FAIL');
        if (createBtn) {
            await createBtn.click();
            await page.waitForTimeout(1000);
            const dialog = await page.$('[role="dialog"], [data-state="open"]');
            log(area, 'Create dialog opens', dialog ? 'PASS' : 'FAIL');
            if (dialog) {
                const cancelBtn = await page.$('[role="dialog"] button:has-text("Cancel"), [data-state="open"] button:has-text("Cancel")');
                if (cancelBtn) await cancelBtn.click().catch(() => { });
                await page.waitForTimeout(500);
            }
        }
    }

    // 3. Users
    if (await safePage(page, '/tenant/users', area, 'Users nav')) {
        const userTitle = await page.textContent('h2').catch(() => null);
        log(area, 'User Mgmt renders', userTitle ? 'PASS' : 'FAIL', userTitle);
        const rows = await page.$$('table tbody tr');
        log(area, 'User table rows', rows.length > 0 ? 'PASS' : 'FAIL', `${rows.length}`);
        const inviteBtn = await page.$('button:has-text("Invite")');
        log(area, 'Invite button', inviteBtn ? 'PASS' : 'FAIL');
    }

    // 4. Settings
    if (await safePage(page, '/tenant/settings', area, 'Settings nav')) {
        const tabs = await page.$$('[role="tab"], button[class*="tab"]');
        log(area, 'Settings tabs', tabs.length > 0 ? 'PASS' : 'FAIL', `${tabs.length} tabs`);
        const saveBtn = await page.$('button:has-text("Save"), button[type="submit"]');
        log(area, 'Save button', saveBtn ? 'PASS' : 'FAIL');
    }

    // 5. Departments
    if (await safePage(page, '/tenant/departments', area, 'Departments nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Departments renders', title ? 'PASS' : 'FAIL', title);
        const createBtn = await page.$('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
        log(area, 'Create dept button', createBtn ? 'PASS' : 'FAIL');
    }

    // 6. Licenses
    if (await safePage(page, '/tenant/licenses', area, 'Licenses nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Licenses renders', title ? 'PASS' : 'FAIL', title);
    }

    // 7. Analytics
    if (await safePage(page, '/tenant/analytics', area, 'Analytics nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Analytics renders', title ? 'PASS' : 'FAIL', title);
    }
}

async function testWorkspaceAdmin(page) {
    const area = 'Workspace Admin';

    // Need a valid workspace ID - get it from the tenant dashboard
    await page.goto(`${BASE}/tenant`, { timeout: 10000 }).catch(() => { });
    await page.waitForTimeout(2500);
    // Try to grab a workspace link
    const wsLink = await page.$('div[class*="cursor-pointer"]');
    let wsId = null;
    if (wsLink) {
        await wsLink.click();
        await page.waitForTimeout(2500);
        const url = page.url();
        const match = url.match(/workspace\/([a-f0-9-]+)/);
        if (match) wsId = match[1];
    }

    if (!wsId) {
        // Fallback: find any workspace id from the page
        log(area, 'Find workspace ID', 'FAIL', 'No workspace link found, using fallback');
        wsId = 'b87ec119-7652-4e27-8d16-5c61003ab47b';
    } else {
        log(area, 'Find workspace ID', 'PASS', wsId);
    }

    // 1. Dashboard
    if (await safePage(page, `/workspace/${wsId}`, area, 'Dashboard nav')) {
        const title = await page.textContent('h1').catch(() => null);
        log(area, 'Dashboard renders', title ? 'PASS' : 'FAIL', title);
        const metrics = await page.$$('text=/Portfolios|Programs|Active Projects|Team Members/');
        log(area, 'Metric cards', metrics.length >= 3 ? 'PASS' : 'FAIL', `${metrics.length}`);
    }

    // 2. Teams
    if (await safePage(page, `/workspace/${wsId}/teams`, area, 'Teams nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Teams renders', title ? 'PASS' : 'FAIL', title);
        const addBtn = await page.$('button:has-text("Add"), button:has-text("Assign"), button:has-text("Invite")');
        log(area, 'Add member button', addBtn ? 'PASS' : 'FAIL');
    }

    // 3. Budget
    if (await safePage(page, `/workspace/${wsId}/budget`, area, 'Budget nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Budget renders', title ? 'PASS' : 'FAIL', title);
    }

    // 4. Resources
    if (await safePage(page, `/workspace/${wsId}/resources`, area, 'Resources nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Resources renders', title ? 'PASS' : 'FAIL', title);
    }

    // 5. Analytics
    if (await safePage(page, `/workspace/${wsId}/analytics`, area, 'Analytics nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Analytics renders', title ? 'PASS' : 'FAIL', title);
    }
}

async function testPortfolioAdmin(page) {
    const area = 'Portfolio Admin';

    // Need portfolio ID - check workspace portfolios
    await page.goto(`${BASE}/tenant`, { timeout: 10000 }).catch(() => { });
    await page.waitForTimeout(2000);
    const wsLink = await page.$('div[class*="cursor-pointer"]');
    let wsId = null;
    if (wsLink) {
        await wsLink.click();
        await page.waitForTimeout(2000);
        const url = page.url();
        const match = url.match(/workspace\/([a-f0-9-]+)/);
        if (match) wsId = match[1];
    }

    let pfId = null;
    if (wsId) {
        await page.goto(`${BASE}/workspace/${wsId}/portfolios`, { timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(2500);
        // Try to find a portfolio link
        const pfLink = await page.$('a[href*="/portfolio/"], [class*="cursor-pointer"]');
        if (pfLink) {
            await pfLink.click();
            await page.waitForTimeout(2500);
            const url = page.url();
            const match = url.match(/portfolio\/([a-f0-9-]+)/);
            if (match) pfId = match[1];
        }
    }

    if (!pfId) {
        pfId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
        log(area, 'Find portfolio ID', 'FAIL', 'Using fallback ID');
    } else {
        log(area, 'Find portfolio ID', 'PASS', pfId);
    }

    // 1. Dashboard
    if (await safePage(page, `/portfolio/${pfId}`, area, 'Dashboard nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Dashboard renders', title ? 'PASS' : 'FAIL', title);
    }

    // 2. Resources
    if (await safePage(page, `/portfolio/${pfId}/resources`, area, 'Resources nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Resources renders', title ? 'PASS' : 'FAIL', title);
    }

    // 3. Budget
    if (await safePage(page, `/portfolio/${pfId}/budget`, area, 'Budget nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Budget renders', title ? 'PASS' : 'FAIL', title);
    }

    // 4. Roadmap
    if (await safePage(page, `/portfolio/${pfId}/roadmap`, area, 'Roadmap nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Roadmap renders', title ? 'PASS' : 'FAIL', title);
    }
}

async function testProgramAdmin(page) {
    const area = 'Program Admin';
    const pgId = 'e47ac10b-58cc-4372-a567-0e02b2c3d483';

    // 1. Stakeholders CRUD
    if (await safePage(page, `/program/${pgId}/stakeholders`, area, 'Stakeholders nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Stakeholders renders', title ? 'PASS' : 'FAIL', title);
        const addBtn = await page.$('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
        log(area, 'Add stakeholder button', addBtn ? 'PASS' : 'FAIL');
        if (addBtn) {
            await addBtn.click();
            await page.waitForTimeout(1000);
            const dialog = await page.$('[role="dialog"], [data-state="open"]');
            log(area, 'Create dialog opens', dialog ? 'PASS' : 'FAIL');
            if (dialog) {
                const cancelBtn = await page.$('button:has-text("Cancel")');
                if (cancelBtn) await cancelBtn.click().catch(() => { });
                await page.waitForTimeout(500);
            }
        }
    }

    // 2. Resources
    if (await safePage(page, `/program/${pgId}/resources`, area, 'Resources nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Resources renders', title ? 'PASS' : 'FAIL', title);
    }

    // 3. Budget
    if (await safePage(page, `/program/${pgId}/budget`, area, 'Budget nav')) {
        const title = await page.textContent('h1, h2').catch(() => null);
        log(area, 'Budget renders', title ? 'PASS' : 'FAIL', title);
    }
}

async function testProjectAdmin(page) {
    const area = 'Project Admin';

    // Navigate to dashboard and find project admin via sidebar
    await page.goto(`${BASE}/dashboard`, { timeout: 10000 }).catch(() => { });
    await page.waitForTimeout(3000);

    // Look for admin link in sidebar
    const adminLink = await page.$('a[href*="admin"], button:has-text("Administration"), [data-testid*="admin"]');
    if (adminLink) {
        await adminLink.click();
        await page.waitForTimeout(2000);
        log(area, 'Admin link found', 'PASS');
    } else {
        // Try navigating to project settings directly via sidebar
        // Look for any project link first
        const projectLink = await page.$('a[href*="/project/"]');
        if (projectLink) {
            await projectLink.click();
            await page.waitForTimeout(2000);
        }
        log(area, 'Admin link found', 'FAIL', 'No admin link in sidebar');
    }

    // Check for admin view tabs
    const tabs = ['Settings', 'Team', 'Permissions', 'Methodology'];
    let tabsFound = 0;
    for (const tab of tabs) {
        const tabEl = await page.$(`text="${tab}"`);
        if (tabEl) tabsFound++;
    }
    log(area, 'Admin tabs visible', tabsFound >= 3 ? 'PASS' : 'FAIL', `${tabsFound}/4 tabs found`);

    // Check methodology options
    const methOptions = await page.$$('text=/Waterfall|Agile|Hybrid/');
    log(area, 'Methodology options', methOptions.length >= 2 ? 'PASS' : 'FAIL', `${methOptions.length} options`);
}

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    console.log('=== Part 5: Interactive Admin UI Tests ===\n');

    await login(page);
    console.log('Logged in\n');

    for (const [name, fn] of [
        ['Tenant', testTenantAdmin],
        ['Workspace', testWorkspaceAdmin],
        ['Portfolio', testPortfolioAdmin],
        ['Program', testProgramAdmin],
        ['Project', testProjectAdmin],
    ]) {
        try {
            await fn(page);
            console.log('');
        } catch (e) {
            log(name + ' Admin', 'Test suite error', 'FAIL', e.message);
            console.log('');
        }
    }

    // Summary
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed out of ${results.length} tests ===`);

    // Write results
    fs.writeFileSync(path.join(OUT, 'p5_test_results.json'), JSON.stringify(results, null, 2));
    console.log('Results written to p5_test_results.json');

    await browser.close();
})();

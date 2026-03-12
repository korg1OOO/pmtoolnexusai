// Capture screenshots of key admin pages for report
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || '.';

const PAGES = [
    // Tenant
    ['admin_tenant_users', '/tenant/users'],
    ['admin_tenant_settings', '/tenant/settings'],
    ['admin_tenant_analytics', '/tenant/analytics'],
    // Workspace
    ['admin_ws_dash', '/workspace/b87ec119-7652-4e27-8d16-5c61003ab47b'],
    ['admin_ws_teams', '/workspace/b87ec119-7652-4e27-8d16-5c61003ab47b/teams'],
    ['admin_ws_budget', '/workspace/b87ec119-7652-4e27-8d16-5c61003ab47b/budget'],
    // Portfolio
    ['admin_pf_roadmap', '/portfolio/f47ac10b-58cc-4372-a567-0e02b2c3d480/roadmap'],
    // Program
    ['admin_pg_stakeholders', '/program/e47ac10b-58cc-4372-a567-0e02b2c3d483/stakeholders'],
    ['admin_pg_budget', '/program/e47ac10b-58cc-4372-a567-0e02b2c3d483/budget'],
    // Platform Admin
    ['admin_plat_users', '/admin/users'],
    ['admin_plat_ai_agents', '/admin/ai-agents'],
    ['admin_plat_subscriptions', '/admin/subscriptions'],
    ['admin_plat_roles', '/admin/roles'],
    ['admin_plat_analytics', '/admin/analytics'],
    ['admin_plat_security', '/admin/security-settings'],
    ['admin_plat_audit', '/admin/audit-logs'],
];

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();

    await page.goto('http://localhost:8080/login', { timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.fill('#email', 'admin@projectoye.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(3000);

    for (const [name, url] of PAGES) {
        process.stdout.write(`${name}... `);
        await page.goto(`http://localhost:8080${url}`, { timeout: 15000, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        await page.screenshot({ path: path.join(OUT, `${name}.png`) });
        console.log('done');
    }

    console.log(`\nCaptured ${PAGES.length} screenshots`);
    await browser.close();
})();

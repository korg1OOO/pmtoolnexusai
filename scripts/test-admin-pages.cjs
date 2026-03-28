// Part 4: Test all admin pages via Playwright
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

const OUT = process.argv[2] || '.';
const URL = 'http://localhost:8080';
const SUPA_URL = 'https://rlnaylyjxjjaqzwpuhar.supabase.co';
const UID = '3a6889fe-2932-4004-9bfb-65a4b34a93ea';

// ─── Setup ──────────────────────────────────────────
async function setup() {
    const s = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Get IDs
    const { data: workspaces } = await s.from('workspaces').select('id, name').limit(1);
    const { data: portfolios } = await s.from('portfolios').select('id, name').limit(1);
    const { data: programs } = await s.from('programs').select('id, name').limit(1);
    const { data: tenant } = await s.from('tenant_members').select('tenant_id').eq('user_id', UID).limit(1);

    const wsId = workspaces?.[0]?.id;
    const pfId = portfolios?.[0]?.id;
    const pgId = programs?.[0]?.id;
    const tenantId = tenant?.[0]?.tenant_id;

    console.log('Workspace:', wsId, workspaces?.[0]?.name);
    console.log('Portfolio:', pfId, portfolios?.[0]?.name);
    console.log('Program:', pgId, programs?.[0]?.name);
    console.log('Tenant:', tenantId);

    // Ensure workspace membership
    if (wsId) {
        const { data: wm } = await s.from('workspace_members').select('id').eq('user_id', UID).eq('workspace_id', wsId);
        if (!wm?.length) {
            await s.from('workspace_members').insert({ user_id: UID, workspace_id: wsId, role: 'admin' });
            console.log('Added workspace membership');
        }
    }

    // Ensure program membership
    if (pgId) {
        const { data: pm } = await s.from('program_members').select('id').eq('user_id', UID).eq('program_id', pgId);
        if (!pm?.length) {
            await s.from('program_members').insert({ user_id: UID, program_id: pgId, role: 'manager' });
            console.log('Added program membership');
        }
    }

    return { wsId, pfId, pgId, tenantId };
}

// ─── Test Runner ──────────────────────────────────────
async function run() {
    const ids = await setup();

    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 800 } });
    const page = await ctx.newPage();

    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    // Login
    await page.goto(`${URL}/login`, { timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.fill('#email', 'admin@kiroxys.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(3000);
    console.log('Logged in:', page.url());

    const results = [];

    async function testPage(name, url, screenshotName) {
        process.stdout.write(`  ${name}... `);
        try {
            await page.goto(`${URL}${url}`, { timeout: 15000, waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(3000);

            // Check for crash (white screen / error boundary)
            const bodyText = await page.locator('body').textContent().catch(() => '');
            const hasError = bodyText.includes('Something went wrong') ||
                bodyText.includes('Application error') ||
                bodyText.includes('Cannot read properties');
            const isBlank = bodyText.trim().length < 50;

            // Check for access denied
            const isDenied = bodyText.includes('do not have permission') ||
                bodyText.includes('Access denied') ||
                bodyText.includes('Unauthorized');

            const status = hasError ? 'ERROR' : isBlank ? 'BLANK' : isDenied ? 'DENIED' : 'OK';

            if (screenshotName) {
                await page.screenshot({ path: path.join(OUT, `${screenshotName}.png`) });
            }

            const pageErrors = errors.filter(e => !e.includes('meeting_attendees')).splice(0);
            const relevantErrors = pageErrors.filter(e =>
                !e.includes('favicon') && !e.includes('Failed to load resource')
            );

            console.log(status === 'OK' ? '✅' : `❌ ${status}`);
            results.push({ name, url, status, errors: relevantErrors.length });
            return status;
        } catch (e) {
            console.log(`❌ TIMEOUT/CRASH: ${e.message.substring(0, 80)}`);
            results.push({ name, url, status: 'CRASH', errors: 1 });
            return 'CRASH';
        }
    }

    // ─── 1. Tenant Admin ───────────────────────────────
    console.log('\n=== TENANT ADMIN ===');
    await testPage('Tenant Dashboard', '/tenant', 'admin_tenant_dash');
    await testPage('Tenant Workspaces', '/tenant/workspaces');
    await testPage('Tenant Settings', '/tenant/settings');
    await testPage('Tenant Users', '/tenant/users');
    await testPage('Tenant Analytics', '/tenant/analytics');
    await testPage('Tenant Departments', '/tenant/departments');
    await testPage('Tenant Licenses', '/tenant/licenses');

    // ─── 2. Workspace Admin ────────────────────────────
    console.log('\n=== WORKSPACE ADMIN ===');
    if (ids.wsId) {
        await testPage('Workspace Dashboard', `/workspace/${ids.wsId}`, 'admin_ws_dash');
        await testPage('WS Portfolios', `/workspace/${ids.wsId}/portfolios`);
        await testPage('WS Teams', `/workspace/${ids.wsId}/teams`);
        await testPage('WS Resources', `/workspace/${ids.wsId}/resources`);
        await testPage('WS Budget', `/workspace/${ids.wsId}/budget`);
        await testPage('WS Analytics', `/workspace/${ids.wsId}/analytics`);
        await testPage('WS Perf Analytics', `/workspace/${ids.wsId}/analytics/performance`);
        await testPage('WS Portfolio Analytics', `/workspace/${ids.wsId}/analytics/portfolio`);
        await testPage('WS Resource Analytics', `/workspace/${ids.wsId}/analytics/resources`);
    } else {
        console.log('  ⚠️  No workspaces in DB — SKIPPED');
        results.push({ name: 'Workspace Admin', url: 'N/A', status: 'SKIPPED', errors: 0 });
    }

    // ─── 3. Portfolio Admin ────────────────────────────
    console.log('\n=== PORTFOLIO ADMIN ===');
    if (ids.pfId) {
        await testPage('Portfolio Dashboard', `/portfolio/${ids.pfId}`, 'admin_pf_dash');
        await testPage('PF Resources', `/portfolio/${ids.pfId}/resources`);
        await testPage('PF Budget', `/portfolio/${ids.pfId}/budget`);
        await testPage('PF Roadmap', `/portfolio/${ids.pfId}/roadmap`);
    } else {
        console.log('  ⚠️  No portfolios in DB — SKIPPED');
        results.push({ name: 'Portfolio Admin', url: 'N/A', status: 'SKIPPED', errors: 0 });
    }

    // ─── 4. Program Admin ─────────────────────────────
    console.log('\n=== PROGRAM ADMIN ===');
    if (ids.pgId) {
        await testPage('Program Stakeholders', `/program/${ids.pgId}/stakeholders`, 'admin_pg_stake');
        await testPage('Program Resources', `/program/${ids.pgId}/resources`);
        await testPage('Program Budget', `/program/${ids.pgId}/budget`);
    } else {
        console.log('  ⚠️  No programs in DB — SKIPPED');
        results.push({ name: 'Program Admin', url: 'N/A', status: 'SKIPPED', errors: 0 });
    }

    // ─── 5. Project Admin ──────────────────────────────
    console.log('\n=== PROJECT ADMIN ===');
    // Project admin is a view, not a route. Navigate to dashboard first, then click sidebar
    await page.goto(`${URL}/dashboard`, { timeout: 15000 });
    await page.waitForTimeout(3000);
    // The sidebar has 'admin-project' which triggers onItemClick('admin-project')
    // This renders ProjectAdminView in the main content area
    // Let's check if there's a direct route or we need sidebar click
    const projAdminBtn = page.locator('button:has-text("Project Admin")');
    if (await projAdminBtn.count() > 0) {
        // Expand sidebar first
        const expandBtn = page.locator('button:has(.lucide-chevron-right)').first();
        if (await expandBtn.count() > 0) {
            await expandBtn.click();
            await page.waitForTimeout(500);
        }
        // Find and expand Administration group
        const adminGroup = page.locator('button:has-text("Administration")');
        if (await adminGroup.count() > 0) {
            await adminGroup.click();
            await page.waitForTimeout(500);
        }
        const projAdmin2 = page.locator('button:has-text("Project Admin")');
        if (await projAdmin2.count() > 0) {
            await projAdmin2.click();
            await page.waitForTimeout(3000);
            const bodyText = await page.locator('body').textContent().catch(() => '');
            const hasAdmin = bodyText.includes('Project Administration') || bodyText.includes('Settings');
            console.log(`  Project Admin View... ${hasAdmin ? '✅' : '❌ NOT RENDERED'}`);
            await page.screenshot({ path: path.join(OUT, 'admin_project.png') });
            results.push({ name: 'Project Admin View', url: 'sidebar', status: hasAdmin ? 'OK' : 'ERROR', errors: 0 });
        }
    } else {
        console.log('  Project Admin button not found in sidebar');
        results.push({ name: 'Project Admin View', url: 'sidebar', status: 'NOT_FOUND', errors: 0 });
    }

    // ─── 6. Platform Admin ─────────────────────────────
    console.log('\n=== PLATFORM ADMIN ===');
    const platformRoutes = [
        ['Admin Dashboard', '/admin'],
        ['Admin Health', '/admin/health'],
        ['Admin Users', '/admin/users'],
        ['Admin Pro Users', '/admin/pro-users'],
        ['Admin AI Usage', '/admin/ai-usage'],
        ['Admin AI Credits', '/admin/ai-credits'],
        ['Admin AI Agents', '/admin/ai-agents'],
        ['Admin AI Providers', '/admin/ai-providers'],
        ['Admin ML', '/admin/ml'],
        ['Admin Content', '/admin/content'],
        ['Admin Licenses', '/admin/licenses'],
        ['Admin Security', '/admin/security'],
        ['Admin Billing', '/admin/billing'],
        ['Admin Subscriptions', '/admin/subscriptions'],
        ['Admin Plans', '/admin/plans'],
        ['Admin Discounts', '/admin/discounts'],
        ['Admin Management', '/admin/management'],
        ['Admin Requests', '/admin/requests'],
        ['Admin Analytics', '/admin/analytics'],
        ['Admin Marketing', '/admin/marketing'],
        ['Admin Email', '/admin/email'],
        ['Admin Email Tpl', '/admin/email-templates'],
        ['Admin Notification', '/admin/notification-analytics'],
        ['Admin Affiliates', '/admin/affiliates'],
        ['Admin Backups', '/admin/backups'],
        ['Admin Organizations', '/admin/organizations'],
        ['Admin API Keys', '/admin/api-keys'],
        ['Admin Audit Logs', '/admin/audit-logs'],
        ['Admin Security Set', '/admin/security-settings'],
        ['Admin Roles', '/admin/roles'],
        ['Admin User Roles', '/admin/user-roles'],
        ['Admin Migration', '/admin/migration'],
        ['Admin IMAP', '/admin/imap-config'],
    ];

    // Screenshot first one
    for (let i = 0; i < platformRoutes.length; i++) {
        const [name, route] = platformRoutes[i];
        await testPage(name, route, i === 0 ? 'admin_platform_dash' : undefined);
    }

    // ─── Summary ───────────────────────────────────────
    const passed = results.filter(r => r.status === 'OK').length;
    const failed = results.filter(r => r.status !== 'OK' && r.status !== 'SKIPPED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const total = results.length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`SUMMARY: ${passed}/${total} OK, ${failed} failed, ${skipped} skipped`);
    console.log(`${'='.repeat(60)}`);

    console.log('\nPage                     | Status  | URL');
    console.log('-------------------------|---------|----');
    for (const r of results) {
        const name = r.name.padEnd(24);
        const status = r.status.padEnd(7);
        console.log(`${name} | ${status} | ${r.url}`);
    }

    if (failed > 0) {
        console.log('\n❌ FAILED PAGES:');
        results.filter(r => r.status !== 'OK' && r.status !== 'SKIPPED').forEach(r => {
            console.log(`  ${r.name} (${r.url}): ${r.status}`);
        });
    }

    // Write results to file
    const fs = require('fs');
    const report = {
        total, passed, failed, skipped,
        results,
    };
    fs.writeFileSync(path.join(OUT, 'admin-test-results.json'), JSON.stringify(report, null, 2));
    console.log(`\nResults written to admin-test-results.json`);

    await browser.close();
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });

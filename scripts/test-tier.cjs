// Part 2: ALL tiers test in one run — switches tier via Supabase between each
const { chromium } = require('playwright');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const { createClient } = require('@supabase/supabase-js');

const OUT = process.argv[2] || '.';
const sb = createClient('https://rlnaylyjxjjaqzwpuhar.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);
const UID = '3a6889fe-2932-4004-9bfb-65a4b34a93ea';

const TIERS = ['free', 'pro', 'business', 'agency'];
const MRR = { free: 0, pro: 10, business: 39, agency: 99 };

// Routes grouped by minimum tier
const TEST_ROUTES = [
    // Always free
    { url: '/risks', name: 'risks', minTier: 'free' },
    // Pro minimum
    { url: '/scenarios', name: 'scenarios', minTier: 'pro' },
    { url: '/financials', name: 'financials', minTier: 'pro' },
    { url: '/communication-intelligence', name: 'comms', minTier: 'pro' },
    // Business minimum
    { url: '/portfolio', name: 'portfolio', minTier: 'business' },
    { url: '/executive-dashboard', name: 'exec_dash', minTier: 'business' },
    { url: '/traceability', name: 'traceability', minTier: 'business' },
];

const TIER_ORDER = ['free', 'pro', 'business', 'agency'];

async function setTier(tier) {
    await sb.from('subscriptions').update({ tier, status: 'active', mrr: MRR[tier] }).eq('user_id', UID);
    // Also update profiles fallback
    await sb.from('profiles').update({ subscription_tier: tier }).eq('id', UID);
}

function shouldAccess(userTier, routeMinTier) {
    return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(routeMinTier);
}

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const results = [];

    for (const tier of TIERS) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`=== TIER: ${tier.toUpperCase()} ===`);
        console.log(`${'='.repeat(50)}`);

        // Switch tier in DB
        await setTier(tier);
        console.log(`DB set to ${tier}`);

        // Fresh context per tier (clears cached auth/queries)
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
        const page = await ctx.newPage();

        // Login
        await page.goto('http://localhost:8080/login', { timeout: 15000 });
        await page.waitForTimeout(3000);
        await page.fill('#email', 'admin@projectoye.com');
        await page.fill('#password', 'TestPassword123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(3000);

        for (const r of TEST_ROUTES) {
            const fullUrl = `http://localhost:8080${r.url}`;
            await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => { });
            // Wait longer for RequireTier async check
            await page.waitForTimeout(4000);

            const blocked = await page.locator('text="Plan Required"').count();
            const lockIcon = await page.locator('.lucide-lock').count();
            const upgradeBtn = await page.locator('text="View Plans"').count();
            const isBlocked = blocked > 0 || lockIcon > 0 || upgradeBtn > 0;

            const expected = shouldAccess(tier, r.minTier);
            const actual = !isBlocked;
            const pass = expected === actual;

            const icon = pass ? '✅' : '❌';
            const statusLabel = actual ? 'OPEN' : 'LOCKED';
            const expectedLabel = expected ? 'OPEN' : 'LOCKED';

            console.log(`  ${icon} ${r.name}: ${statusLabel} (expected ${expectedLabel})`);
            results.push({ tier, route: r.name, expected: expectedLabel, actual: statusLabel, pass });

            await page.screenshot({ path: path.join(OUT, `${tier}_${r.name}.png`) });
        }

        // Project creation check
        await page.goto('http://localhost:8080/create-project', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => { });
        await page.waitForTimeout(3000);
        const upgradeToCreate = await page.locator('text="Upgrade to Create"').count();
        const limitBanner = await page.locator('text="limit"').count();
        console.log(`  📦 Project creation: upgradeBtn=${upgradeToCreate} limitText=${limitBanner}`);
        await page.screenshot({ path: path.join(OUT, `${tier}_create_project.png`) });

        await ctx.close();
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('SUMMARY');
    console.log(`${'='.repeat(50)}`);
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;
    console.log(`Passed: ${passed}/${results.length}, Failed: ${failed}`);
    if (failed > 0) {
        console.log('\nFailed tests:');
        results.filter(r => !r.pass).forEach(r => {
            console.log(`  ❌ ${r.tier}/${r.route}: got ${r.actual}, expected ${r.expected}`);
        });
    }

    // Restore admin to agency
    await setTier('agency');
    console.log('\nRestored to agency tier');

    await browser.close();
    console.log('Done');
})();

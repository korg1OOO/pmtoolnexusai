const { chromium } = require('playwright');
const path = require('path');

const VIEWS = [
    { url: 'http://localhost:8080/risks', name: 'risks' },
    { url: 'http://localhost:8080/milestones', name: 'milestones' },
    { url: 'http://localhost:8080/deliverables', name: 'deliverables' },
    { url: 'http://localhost:8080/reports', name: 'reports' },
    { url: 'http://localhost:8080/actions', name: 'actions' },
];

const ROLE = process.argv[2] || 'unknown';
const OUT = process.argv[3] || '.';

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await ctx.newPage();

    // Navigate to auth
    console.log('Navigating to /auth...');
    await page.goto('http://localhost:8080/login', { timeout: 15000 });

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Debug screenshot
    await page.screenshot({ path: path.join(OUT, 'debug_auth.png') });
    console.log('Auth URL:', page.url());

    // Try to find the email input
    const emailInput = page.locator('#email');
    const emailCount = await emailInput.count();
    console.log('Email inputs found:', emailCount);

    if (emailCount === 0) {
        // Try alternative selectors
        const inputs = await page.locator('input').count();
        console.log('Total inputs on page:', inputs);
        const allInputs = await page.locator('input').all();
        for (const inp of allInputs) {
            const id = await inp.getAttribute('id');
            const name = await inp.getAttribute('name');
            const type = await inp.getAttribute('type');
            console.log(`  Input: id=${id} name=${name} type=${type}`);
        }
    }

    // Login
    try {
        await page.fill('#email', 'admin@kiroxys.com', { timeout: 5000 });
        await page.fill('#password', 'TestPassword123!', { timeout: 5000 });
        await page.click('button[type="submit"]', { timeout: 5000 });
        await page.waitForTimeout(5000);
        console.log('Post-login URL:', page.url());
        await page.screenshot({ path: path.join(OUT, 'debug_postlogin.png') });
    } catch (e) {
        console.log('Login error:', e.message.slice(0, 200));
        await browser.close();
        process.exit(1);
    }

    for (const v of VIEWS) {
        try {
            await page.goto(v.url, { waitUntil: 'networkidle', timeout: 10000 }).catch(() => { });
            await page.waitForTimeout(3000);
            const file = path.join(OUT, `${ROLE}_${v.name}.png`);
            await page.screenshot({ path: file, fullPage: false });
            const addBtn = await page.locator('button:has-text("Add"), button:has-text("Create")').count();
            console.log(`✅ ${v.name}: Add/Create=${addBtn} → ${path.basename(file)}`);
        } catch (e) {
            console.log(`❌ ${v.name}: ${e.message.slice(0, 100)}`);
        }
    }

    await browser.close();
    console.log('Done');
})();

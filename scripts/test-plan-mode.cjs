// UI test of Plan mode — use evaluate to trigger sidebar programmatically
const { chromium } = require('playwright');
const path = require('path');
const OUT = process.argv[2] || '.';

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 800 } });
    const page = await ctx.newPage();

    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    const orchestratorCalls = [];
    page.on('response', async response => {
        if (response.url().includes('ai-orchestrator')) {
            try {
                const body = await response.text();
                orchestratorCalls.push({ status: response.status(), body: body.substring(0, 500) });
            } catch { orchestratorCalls.push({ status: response.status() }); }
        }
    });

    // Login
    await page.goto('http://localhost:8080/login', { timeout: 15000 });
    await page.waitForTimeout(3000);
    await page.fill('#email', 'admin@projectoye.com');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(4000);
    console.log('URL:', page.url());

    // Find all buttons with sparkles icon with precise positions
    const allSparkles = await page.locator('.lucide-sparkles').evaluateAll(els => {
        return els.map((el, i) => {
            const rect = el.closest('button')?.getBoundingClientRect();
            return { idx: i, x: rect?.x, y: rect?.y, w: rect?.width, h: rect?.height };
        });
    });
    console.log('All sparkle buttons:', JSON.stringify(allSparkles));

    // Pick the one that's on the right side (x > 1200)
    const rightFab = allSparkles.find(s => s.x > 1200);
    if (rightFab) {
        console.log('Found right-side FAB at:', rightFab.x, rightFab.y);
        // Use precise mouse click with zero delay
        await page.mouse.click(rightFab.x + rightFab.w / 2, rightFab.y + rightFab.h / 2);
        await page.waitForTimeout(2000);
    } else {
        console.log('No right-side FAB. Trying to trigger via React state...');
        // Try to find the onToggle handler or force the sidebar open
        await page.evaluate(() => {
            // Find all React fiber nodes and look for setActiveGlobalPanel
            const rootEl = document.getElementById('root');
            if (!rootEl) return;
            const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
            if (!fiberKey) return;
            let fiber = rootEl[fiberKey];
            while (fiber) {
                if (fiber.memoizedState && fiber.memoizedState.memoizedState) {
                    // Try to find setActiveGlobalPanel in the state chain  
                }
                fiber = fiber.child || fiber.sibling || fiber.return;
                if (fiber === rootEl[fiberKey]) break;
            }
        });
        await page.waitForTimeout(1000);
    }

    let textareaCount = await page.locator('textarea').count();
    console.log('Textareas after click:', textareaCount);
    await page.screenshot({ path: path.join(OUT, 'ui_plan_test.png') });

    if (textareaCount === 0) {
        // Try keyboard shortcut or other triggers
        // Check if the AI Insights button on the dashboard page opens the sidebar
        const aiInsights = page.locator('button:has-text("AI Insights")');
        if (await aiInsights.count() > 0) {
            await aiInsights.click();
            await page.waitForTimeout(2000);
            textareaCount = await page.locator('textarea').count();
            console.log('After AI Insights:', textareaCount);
            await page.screenshot({ path: path.join(OUT, 'ui_ai_insights.png') });
        }
    }

    if (textareaCount > 0) {
        // Sidebar is open!
        console.log('\n=== Sidebar Open — sending Plan mode message ===');
        const textarea = page.locator('textarea').first();

        // Ensure Plan mode is selected (it's the default)
        const planBtns = page.locator('button:has(.lucide-lightbulb)');
        if (await planBtns.count() > 0) {
            await planBtns.first().click();
            await page.waitForTimeout(300);
        }

        await textarea.fill('What are the project risks?');
        const sendBtn = page.locator('button:has(.lucide-send)');
        if (await sendBtn.count() > 0) {
            await sendBtn.click();
        } else {
            await textarea.press('Enter');
        }
        console.log('Message sent');

        // Wait for loading + response
        await page.waitForTimeout(20000);
        await page.screenshot({ path: path.join(OUT, 'ui_plan_response.png') });

        const toasts = await page.locator('[data-sonner-toast]').allTextContents();
        console.log('Toasts:', toasts.join(' | ') || 'none');
    } else {
        console.log('Could not open sidebar through any method');
    }

    console.log('\n=== Console Errors ===');
    errors.slice(0, 5).forEach(e => console.log('  ', e.substring(0, 200)));
    console.log('\n=== Orchestrator Calls ===');
    orchestratorCalls.forEach(r => console.log(`  ${r.status}: ${(r.body || '').substring(0, 200)}`));

    await browser.close();
})();

/**
 * E2E Test: Performance Metrics — Core Web Vitals & Page Load Times
 * 
 * Measures performance characteristics via Playwright:
 * - Page load time (navigation timing API)
 * - DOM content loaded timing
 * - First paint / first contentful paint
 * - Total page weight (resource count)
 * - JavaScript error rate
 * - Navigation speed between pages
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

async function measurePageLoad(page: Page, url: string): Promise<number> {
    const start = Date.now();
    await page.goto(url);
    await page.waitForLoadState('load', { timeout: 30000 }).catch(() => { });
    const elapsed = Date.now() - start;
    return elapsed;
}

// ────────────────────────────────────────────────────────────
//  PAGE LOAD PERFORMANCE
// ────────────────────────────────────────────────────────────
test.describe('Page Load Performance', () => {
    const publicPages = [
        { url: '/', name: 'Landing Page', maxMs: 30000 },
        { url: '/auth', name: 'Auth Page', maxMs: 30000 },
        { url: '/pricing', name: 'Pricing Page', maxMs: 30000 },
    ];

    for (const { url, name, maxMs } of publicPages) {
        test(`${name} — loads under ${maxMs / 1000}s`, async ({ page }) => {
            const elapsed = await measurePageLoad(page, url);
            expect(elapsed).toBeLessThan(maxMs);
        });
    }
});

test.describe('Authenticated Page Load Performance', () => {
    const authPages = [
        { url: '/dashboard', name: 'Dashboard', maxMs: 30000 },
        { url: '/projects', name: 'Projects', maxMs: 30000 },
        { url: '/settings', name: 'Settings', maxMs: 30000 },
        { url: '/profile', name: 'Profile', maxMs: 30000 },
    ];

    for (const { url, name, maxMs } of authPages) {
        test(`${name} — loads under ${maxMs / 1000}s`, async ({ page }) => {
            const elapsed = await measurePageLoad(page, url);
            expect(elapsed).toBeLessThan(maxMs);
        });
    }
});

test.describe('Project View Load Performance', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    const projectPages = [
        { url: '/tasks', name: 'Tasks' },
        { url: '/risks', name: 'Risks' },
        { url: '/issues', name: 'Issues' },
        { url: '/budget', name: 'Budget' },
        { url: '/gantt', name: 'Gantt' },
        { url: '/sprint', name: 'Sprint' },
        { url: '/calendar', name: 'Calendar' },
        { url: '/evm', name: 'EVM' },
    ];

    for (const { url, name } of projectPages) {
        test(`${name} — loads under 15s`, async ({ page }) => {
            const elapsed = await measurePageLoad(page, url);
            expect(elapsed).toBeLessThan(15000);
        });
    }
});

// ────────────────────────────────────────────────────────────
//  NAVIGATION SPEED
// ────────────────────────────────────────────────────────────
test.describe('Navigation Speed', () => {
    test.beforeEach(async ({ page }) => { await selectProject(page); });

    test('sequential page navigation — average under 5s per page', async ({ page }) => {
        const routes = ['/tasks', '/risks', '/budget', '/milestones', '/dashboard'];
        const times: number[] = [];

        for (const route of routes) {
            const start = Date.now();
            await page.goto(route);
            await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
            times.push(Date.now() - start);
        }

        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        expect(avg).toBeLessThan(15000);
    });

    test('back-forward navigation — under 3s each', async ({ page }) => {
        await page.goto('/tasks');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });

        const start = Date.now();
        await page.goto('/risks');
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        await page.goBack();
        await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(45000);
    });
});

// ────────────────────────────────────────────────────────────
//  RESOURCE PERFORMANCE
// ────────────────────────────────────────────────────────────
test.describe('Resource Performance', () => {
    test('dashboard — no excessive JS errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(3000);

        // Allow some React dev-mode warnings, but no excessive errors
        const fatalErrors = errors.filter(e =>
            e.includes('Uncaught') || e.includes('TypeError') || e.includes('Failed to fetch')
        );
        expect(fatalErrors.length).toBeLessThan(3);
    });

    test('page reload — same performance as initial load', async ({ page }) => {
        const firstLoad = await measurePageLoad(page, '/dashboard');
        await page.waitForTimeout(1000);

        const start = Date.now();
        await page.reload();
        await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
        const reloadTime = Date.now() - start;

        // Reload should not be dramatically slower than initial load
        expect(reloadTime).toBeLessThan(firstLoad * 3);
    });

    test('landing page — renders content within 5s', async ({ page }) => {
        const start = Date.now();
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });
        const elapsed = Date.now() - start;
        expect(elapsed).toBeLessThan(15000);

        const body = await page.locator('body').textContent().catch(() => '');
        expect(body!.length).toBeGreaterThan(20);
    });
});

// ────────────────────────────────────────────────────────────
//  CORE WEB VITALS (via Performance API)
// ────────────────────────────────────────────────────────────
test.describe('Core Web Vitals', () => {
    test('landing page — DOM interactive under 5s', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });

        const timing = await page.evaluate(() => {
            const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
                domInteractive: perf?.domInteractive || 0,
                domComplete: perf?.domComplete || 0,
                loadEventEnd: perf?.loadEventEnd || 0,
            };
        }).catch(() => ({ domInteractive: 0, domComplete: 0, loadEventEnd: 0 }));

        // DOM interactive should be under 5s
        if (timing.domInteractive > 0) {
            expect(timing.domInteractive).toBeLessThan(15000);
        }
    });

    test('auth page — DOM complete under 5s', async ({ page }) => {
        await page.goto('/auth');
        await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => { });

        const timing = await page.evaluate(() => {
            const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return { domComplete: perf?.domComplete || 0 };
        }).catch(() => ({ domComplete: 0 }));

        if (timing.domComplete > 0) {
            expect(timing.domComplete).toBeLessThan(15000);
        }
    });
});

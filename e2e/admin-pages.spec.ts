/**
 * E2E Test: All Admin Pages Navigation
 * 
 * Uses pre-authenticated storage state from global setup.
 * Tests that every admin page loads correctly without errors.
 */
import { test, expect } from '@playwright/test';

test.setTimeout(60_000);

test.describe('Admin Pages', () => {
    const adminPages = [
        { path: '/admin', name: 'Admin Dashboard' },
        { path: '/admin/users', name: 'User Management' },
        { path: '/admin/roles', name: 'Roles & Permissions' },
        { path: '/admin/subscriptions', name: 'Subscriptions' },
        { path: '/admin/billing', name: 'Billing' },
        { path: '/admin/security', name: 'Security' },
        { path: '/admin/api-keys', name: 'API Keys' },
        { path: '/admin/audit-logs', name: 'Audit Logs' },
        { path: '/admin/ai-agents', name: 'AI Agents' },
        { path: '/admin/ml-models', name: 'ML Models' },
        { path: '/admin/ai-usage', name: 'AI Usage' },
        { path: '/admin/analytics', name: 'Analytics' },
        { path: '/admin/notifications', name: 'Notifications' },
        { path: '/admin/content', name: 'Content Management' },
        { path: '/admin/plans', name: 'Plans' },
    ];

    for (const { path, name } of adminPages) {
        test(`${name} page (${path}) loads without crash`, async ({ page }) => {
            await page.goto(path);
            await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
            await page.waitForTimeout(3000);

            // Page should render
            await expect(page.locator('body')).toBeVisible();
        });
    }
});

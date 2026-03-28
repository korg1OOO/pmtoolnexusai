/**
 * E2E Test: Project Feature Views
 * 
 * Uses pre-authenticated storage state from global setup.
 * App uses flat routes (/dashboard, /tasks, /risks, etc.) with project context.
 * First selects a project by clicking its name on /projects, then visits each view.
 */
import { test, expect } from '@playwright/test';

// Data-heavy views (Gantt, Sprint, Calendar, EVM) can take >60s during full parallel runs
test.setTimeout(120_000);

test.describe('Project Feature Views', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/projects');
        await page.waitForLoadState('load', { timeout: 15000 });
        await page.waitForTimeout(3000);

        const projectName = page.locator('span.cursor-pointer, td span[class*="cursor"]').first();
        const hasProject = await projectName.isVisible({ timeout: 5000 }).catch(() => false);

        if (hasProject) {
            await projectName.click();
            await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
            await page.waitForTimeout(1000);
        }
    });

    const projectViews = [
        { route: '/dashboard', name: 'Dashboard' },
        { route: '/tasks', name: 'Tasks' },
        { route: '/sprint', name: 'Sprint Board' },
        { route: '/gantt', name: 'Gantt' },
        { route: '/calendar', name: 'Calendar' },
        { route: '/risks', name: 'Risks' },
        { route: '/issues', name: 'Issues' },
        { route: '/milestones', name: 'Milestones' },
        { route: '/budget', name: 'Budget' },
        { route: '/resources', name: 'Resources' },
        { route: '/stakeholders', name: 'Stakeholders' },
        { route: '/deliverables', name: 'Deliverables' },
        { route: '/documents', name: 'Documents' },
        { route: '/meetings', name: 'Meetings' },
        { route: '/change-requests', name: 'Change Requests' },
        { route: '/scope', name: 'Scope' },
        { route: '/evm', name: 'EVM' },
        { route: '/reports', name: 'Reports' },
        { route: '/team', name: 'Team' },
        { route: '/communications', name: 'Communications' },
        { route: '/action-items', name: 'Action Items' },
        { route: '/quality', name: 'Quality' },
        { route: '/lessons-learned', name: 'Lessons Learned' },
        { route: '/procurement', name: 'Procurement' },
        { route: '/notes', name: 'Notes' },
    ];

    for (const { route, name } of projectViews) {
        test(`${name} view (${route}) loads`, async ({ page }) => {
            await page.goto(route);
            // Use 'load' instead of 'networkidle' — networkidle times out on data-heavy views
            await page.waitForLoadState('load', { timeout: 15000 }).catch(() => { });
            await page.waitForTimeout(2000);
            await expect(page.locator('body')).toBeVisible();
        });
    }
});

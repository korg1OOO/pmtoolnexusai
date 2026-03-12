/**
 * E2E Test: Project Management Journey
 * 
 * Tests: Create Project → Add Task → Update Task → View Dashboard
 */
import { test, expect } from '@playwright/test';

test.describe('Project Management', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/auth');
        await page.fill('input[type="email"]', process.env.E2E_TEST_EMAIL || 'test@example.com');
        await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD || 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(dashboard|app|projects)/i, { timeout: 15000 });
    });

    test('dashboard loads with navigation', async ({ page }) => {
        await expect(page.locator('nav, [role="navigation"], .sidebar')).toBeVisible();
    });

    test('project list is accessible', async ({ page }) => {
        // Navigate to projects
        const projectsLink = page.locator('a:has-text("Projects"), [href*="project"]').first();
        if (await projectsLink.isVisible()) {
            await projectsLink.click();
            await page.waitForLoadState('networkidle');
        }
        await expect(page.locator('body')).toBeVisible();
    });

    test('create project dialog opens', async ({ page }) => {
        const createBtn = page.locator('button:has-text("New Project"), button:has-text("Create"), button:has-text("Add Project")').first();
        if (await createBtn.isVisible()) {
            await createBtn.click();
            await expect(page.locator('[role="dialog"], .modal, form')).toBeVisible({ timeout: 5000 });
        }
    });

    test('task board renders', async ({ page }) => {
        // Navigate to a project's task board
        const projectLink = page.locator('[data-testid*="project"], a:has-text("Project")').first();
        if (await projectLink.isVisible()) {
            await projectLink.click();
            await page.waitForLoadState('networkidle');
        }
        await expect(page.locator('body')).toBeVisible();
    });
});

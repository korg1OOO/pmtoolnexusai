import { test, expect } from '@playwright/test';

test.describe('AI Agent UI E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate straight to dashboard. If global-setup auth worked, we stay here.
        await page.goto('/projects');
        await page.waitForTimeout(2000);

        // If we landed on auth, it means global state failed or expired
        if (page.url().includes('/auth')) {
            console.log('Not authenticated! Logging in manually...');
            const emailInput = page.locator('#email');
            await expect(emailInput).toBeVisible({ timeout: 15000 });
            await emailInput.fill('admin@projectoye.com');
            await page.locator('#password').fill('TestPassword123!');
            await page.locator('form button[type="submit"]').first().click();
            await page.waitForURL(/\/(projects|dashboard)/, { timeout: 15000 });
            await page.goto('/projects');
            await page.waitForTimeout(2000);
        }

        // We are on /projects. Pick the first project to enter a real dashboard context.
        const firstProject = page.locator('a[href^="/dashboard?project="]').first();
        try {
            if (await firstProject.isVisible()) {
                await firstProject.click();
            } else {
                await page.goto('/dashboard');
            }
        } catch (e) {
            await page.goto('/dashboard');
        }

        await page.waitForTimeout(3000); // Wait for auth, permissions, and project context to load
    });

    test('AI sidebar renders and can answer questions', async ({ page }) => {
        // Check if the AI Sparkles button exists
        const sparklesBtn = page.locator('button:has(svg.lucide-sparkles):visible').first();

        if (!(await sparklesBtn.isVisible())) {
            await page.screenshot({ path: 'e2e-debug-dashboard.png' });
            const btns = await page.locator('button').allTextContents();
            console.log('Available buttons:', btns.map(b => b.trim()).filter(Boolean).slice(0, 10));
            await page.locator('.fixed.right-4').click({ force: true }).catch(() => { });
            await sparklesBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });
        }

        await expect(sparklesBtn).toBeVisible({ timeout: 15000 });
        await sparklesBtn.click();

        const chatInput = page.locator('textarea[placeholder*="Ask about your project"]');
        await expect(chatInput).toBeVisible();

        await chatInput.fill('What is the overall project health?');
        const sendBtn = page.locator('button:has(svg.lucide-send)').first();
        await sendBtn.click();

        const aiResponse = page.locator('.prose, [class*="prose-sm"]').last();
        await expect(aiResponse).toContainText(/[a-zA-Z]/, { timeout: 30000 });

        const aiText = await aiResponse.innerText();
        expect(aiText.length).toBeGreaterThan(10);
    });

    test('AI agent can navigate the application UI', async ({ page }) => {
        const sparklesBtn = page.locator('button:has(svg.lucide-sparkles):visible').first();
        await sparklesBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { });
        if (!(await sparklesBtn.isVisible())) {
            await page.locator('.fixed.right-4').click({ force: true }).catch(() => { });
        }
        await sparklesBtn.click();

        const chatInput = page.locator('textarea[placeholder*="Ask about your project"], textarea[placeholder*="What would you like to do?"]');
        await expect(chatInput).toBeVisible();

        await chatInput.fill('Navigate to the issues register page');
        await page.locator('button:has(svg.lucide-send)').first().click();

        await page.waitForURL('**/issues**', { timeout: 20000 }).catch(() => {
            console.log('URL did not change to /issues. Current URL:', page.url());
        });

        expect(page.url()).toContain('issues');
        await expect(page.locator('h1, h2, .text-xl').filter({ hasText: /Issues/i }).first()).toBeVisible({ timeout: 10000 });
    });

});

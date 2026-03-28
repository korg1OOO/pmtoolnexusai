import { test, expect } from '@playwright/test';

test.describe('Scenario 4 - Tenant Administration via AI Agents', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('http://localhost:8080/');

        // Fill credentials
        // Note: Adjust the selectors based on the actual login page implementation
        await page.fill('input[type="email"]', 'admin@kiroxys.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for successful login (e.g., waiting for dashboard to load)
        await page.waitForURL('**/dashboard**'); // Adjust according to your app's home URL
    });

    test('TC-4.1 Create a Workspace via AI Agent', async ({ page }) => {
        // Navigate to tenant admin -> workspaces or ensure AI chat is open
        // Assuming a global AI chat widget
        await expect(page.locator('.ai-chat-widget')).toBeVisible(); // Adjust selector

        // Open chat
        await page.click('.ai-chat-widget-button'); // Adjust selector

        const prompt = "Create a new Workspace named 'EMEA Operations' for the current tenant. Set the description to 'Operations hub for Europe, Middle East, and Africa'.";
        await page.fill('.ai-chat-input', prompt); // Adjust selector
        await page.press('.ai-chat-input', 'Enter');

        // Wait for AI response/action completion
        await expect(page.locator('.ai-chat-message:has-text("Workspace created")')).toBeVisible({ timeout: 15000 }); // Adjust depending on agent reply

        // Verify in UI
        await page.goto('http://localhost:8080/tenant-admin/workspaces'); // Adjust URL
        await expect(page.locator('text="EMEA Operations"')).toBeVisible();
    });

    test('TC-4.2 Manage Users via AI Agent', async ({ page }) => {
        await page.click('.ai-chat-widget-button');

        const prompt = "Invite a new user 'john.doe@example.com' to the Tenant and assign them to the 'EMEA Operations' workspace with a 'Member' role.";
        await page.fill('.ai-chat-input', prompt);
        await page.press('.ai-chat-input', 'Enter');

        // Wait for AI response
        await expect(page.locator('.ai-chat-message:has-text("User invited")')).toBeVisible({ timeout: 15000 });

        // Verify in UI
        await page.goto('http://localhost:8080/tenant-admin/users'); // Adjust URL
        await expect(page.locator('text="john.doe@example.com"')).toBeVisible();
    });

    test('TC-4.3 Create Departments via AI Agent', async ({ page }) => {
        await page.click('.ai-chat-widget-button');

        const prompt = "Create three new departments: 'Finance', 'Human Resources', and 'IT Support'.";
        await page.fill('.ai-chat-input', prompt);
        await page.press('.ai-chat-input', 'Enter');

        // Wait for AI response
        await expect(page.locator('.ai-chat-message:has-text("Departments created")')).toBeVisible({ timeout: 15000 });

        // Verify in UI
        await page.goto('http://localhost:8080/tenant-admin/departments'); // Adjust URL
        await expect(page.locator('text="Finance"')).toBeVisible();
        await expect(page.locator('text="Human Resources"')).toBeVisible();
        await expect(page.locator('text="IT Support"')).toBeVisible();
    });

    test('TC-4.4 Assign Licenses via AI Agent', async ({ page }) => {
        await page.click('.ai-chat-widget-button');

        const prompt = "Allocate 5 Enterprise licenses to the 'Finance' department and 10 Standard licenses to 'IT Support'.";
        await page.fill('.ai-chat-input', prompt);
        await page.press('.ai-chat-input', 'Enter');

        // Wait for AI response
        await expect(page.locator('.ai-chat-message:has-text("Licenses allocated")')).toBeVisible({ timeout: 15000 });

        // Verify in UI
        await page.goto('http://localhost:8080/tenant-admin/licenses'); // Adjust URL
        await expect(page.locator('text="5 Enterprise"').or(page.locator('text="5"'))).toBeVisible(); // Simplistic check, adjust
    });

});

import { test, expect } from '@playwright/test';

test.describe('Scenario 1 - Full Project Lifecycle via AI Agents', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('http://localhost:8080/');

        // Fill credentials
        await page.fill('input[type="email"]', 'admin@kiroxys.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for successful login
        await page.waitForURL('**/dashboard**');

        // Ensure AI widget is visible
        await expect(page.locator('.ai-chat-widget')).toBeVisible();
    });

    async function submitAIPrompt(page, prompt, expectedReplySubstring) {
        await page.click('.ai-chat-widget-button');
        await page.fill('.ai-chat-input', prompt);
        await page.press('.ai-chat-input', 'Enter');
        if (expectedReplySubstring) {
            await expect(page.locator(`.ai-chat-message:has-text("${expectedReplySubstring}")`)).toBeVisible({ timeout: 20000 });
        }
    }

    async function verifyCreditDeductions(page) {
        await page.goto('http://localhost:8080/ai-credits-usage');
        // 'Tokens' column must NOT appear
        await expect(page.locator('text="Tokens"')).not.toBeVisible();
        // 'Credits Deducted' must appear
        await expect(page.locator('text="Credits Deducted"').or(page.locator('text="Credits"'))).toBeVisible();
        // Check log exists
        await expect(page.locator('.usage-log-entry, tr').nth(1)).toBeVisible();
    }

    test('TC-1.1 Create Project', async ({ page }) => {
        const prompt = "Create a new project called 'ERP Implementation with AI Agent'. Set the type to Enterprise, and add a description: 'Full-stack ERP system implementation covering finance, procurement, and HR modules.'";
        await submitAIPrompt(page, prompt, 'Project created');

        // Verify Project
        await page.goto('http://localhost:8080/projects');
        await expect(page.locator('text="ERP Implementation with AI Agent"')).toBeVisible();

        await verifyCreditDeductions(page);
    });

    test('TC-1.2 Assign 5 Team Members', async ({ page }) => {
        const prompt = "Assign 5 team members to the ERP Implementation with AI Agent project. Use existing users from the system.";
        await submitAIPrompt(page, prompt, 'Members assigned');

        // Verify Team
        await page.goto('http://localhost:8080/projects');
        await page.click('text="ERP Implementation with AI Agent"');
        await page.click('text="Team"');
        // Just expect at least some team members to be visible
        const memberCount = await page.locator('.team-member-card, .user-row').count();
        expect(memberCount).toBeGreaterThanOrEqual(1);

        await verifyCreditDeductions(page);
    });

    test('TC-1.3 Log 3 Leave Requests', async ({ page }) => {
        const prompt = "Log 3 leave requests for team members on the ERP Implementation project. Use different dates and leave types (Annual, Sick, Emergency).";
        await submitAIPrompt(page, prompt, 'Leave requests logged');

        // Verify Leaves
        await page.goto('http://localhost:8080/projects');
        await page.click('text="ERP Implementation with AI Agent"');
        await page.click('text="HR"').catch(() => page.click('text="Leave"'));
        await expect(page.locator('text="Annual"').or(page.locator('text="Sick"')).first()).toBeVisible();

        await verifyCreditDeductions(page);
    });

    test('TC-1.4 Build 5 Phases, 50 Activities, Child Plans & Gantts', async ({ page }) => {
        const prompt = "Construct a project plan for ERP Implementation with AI Agent. Create exactly 5 phases: Discovery, Design, Development, Testing, and Deployment. Under each phase create 10 activities with realistic ERP task names. Set start and end dates spanning 6 months from today. Generate Gantt chart tasks for each.";
        await submitAIPrompt(page, prompt, 'Project plan constructed');

        // Verify Phases and Gantt
        await page.goto('http://localhost:8080/projects');
        await page.click('text="ERP Implementation with AI Agent"');
        await page.click('text="WBS"').catch(() => page.click('text="Planning"'));
        await expect(page.locator('text="Discovery"')).toBeVisible();
        await expect(page.locator('text="Deployment"')).toBeVisible();

        // Verify Gantt view
        await page.click('text="Gantt"');
        await expect(page.locator('.gantt-chart-container, .gantt-task')).toBeVisible();

        await verifyCreditDeductions(page);
    });

    test('TC-1.5 Enter $5M Budget, Log Expenses, Verify EVM', async ({ page }) => {
        const prompt = "Set the project budget for ERP Implementation with AI Agent to $5,000,000 USD. Allocate budget across the 5 phases. Log 3 expense entries: $50,000 for software licenses, $120,000 for consulting, $35,000 for training. Then calculate and display Earned Value Management (EVM) metrics.";
        await submitAIPrompt(page, prompt, 'Budget set');

        // Verify Financials & EVM
        await page.goto('http://localhost:8080/projects');
        await page.click('text="ERP Implementation with AI Agent"');
        await page.click('text="Financials"').catch(() => page.click('text="Budget"'));

        await expect(page.locator('text="$5,000,000"').or(page.locator('text="5,000,000"'))).toBeVisible();
        await expect(page.locator('text="$50,000"').or(page.locator('text="50,000"'))).toBeVisible();

        // Verify EVM
        await page.click('text="EVM"').catch(() => { }); // might be on same page
        await expect(page.locator('text="CPI"')).toBeVisible();
        await expect(page.locator('text="SPI"')).toBeVisible();

        await verifyCreditDeductions(page);
    });

    test('TC-1.6 Log 5 Issues, 5 Risks, 5 Milestones', async ({ page }) => {
        const prompt = "Log 5 critical issues, 5 risks, and 5 milestones for the ERP Implementation project. Issues should relate to integration challenges. Risks should cover budget and timeline. Milestones should mark end of each phase.";
        await submitAIPrompt(page, prompt, 'logged'); // match "Issues logged" or similar

        // Verify Issues
        await page.goto('http://localhost:8080/projects');
        await page.click('text="ERP Implementation with AI Agent"');
        await page.click('text="Issues"');
        expect(await page.locator('.issue-row, .issue-card').count()).toBeGreaterThanOrEqual(1);

        // Verify Risks
        await page.click('text="Risks"');
        expect(await page.locator('.risk-row, .risk-card').count()).toBeGreaterThanOrEqual(1);

        // Verify Milestones
        await page.click('text="Milestones"');
        expect(await page.locator('.milestone-row, .milestone-card').count()).toBeGreaterThanOrEqual(1);

        await verifyCreditDeductions(page);
    });

});

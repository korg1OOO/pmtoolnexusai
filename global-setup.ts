/**
 * Playwright Global Setup
 * 
 * 1. Creates a test user via Supabase Admin API
 * 2. Signs in via Supabase Auth REST API to get a session token
 * 3. Creates a test project + tenant membership for the user
 * 4. Authenticates via browser and saves storage state for reuse
 */
import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://rlnaylyjxjjaqzwpuhar.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmF5bHlqeGpqYXF6d3B1aGFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDExODU1MiwiZXhwIjoyMDg1Njk0NTUyfQ.im1bABzrl7a4rvIwUM99jhvZs1fW77EpBx9Cx8Qs8Iw';
const ANON_KEY = 'sb_publishable_WVoGDML7fIAAsQvlkYKdQg_jfLftC3r';
const TEST_EMAIL = 'e2e-test@kiroxys.com';
const TEST_PASSWORD = 'E2eTestPass!2024';

async function supabaseAdmin(method: string, path: string, body?: any) {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
            'Prefer': method === 'POST' ? 'return=representation' : '',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
}

async function globalSetup(config: FullConfig) {
    const storageStatePath = path.resolve(__dirname, 'e2e', '.auth', 'storage-state.json');
    fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

    // ── Step 1: Create or find test user ──
    console.log('[E2E Setup] Step 1: Creating/finding test user...');
    let userId: string | null = null;

    const createRes = await supabaseAdmin('POST', '/auth/v1/admin/users', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
    });

    if (createRes.ok && createRes.data?.id) {
        userId = createRes.data.id;
        console.log(`[E2E Setup] User created: ${userId}`);
    } else {
        // User might already exist — list users to find them
        const listRes = await supabaseAdmin('GET', `/auth/v1/admin/users?page=1&per_page=50`);
        if (listRes.ok && listRes.data?.users) {
            const existing = listRes.data.users.find((u: any) => u.email === TEST_EMAIL);
            if (existing) {
                userId = existing.id;
                console.log(`[E2E Setup] User already exists: ${userId}`);
                // Update password in case it changed
                await supabaseAdmin('PUT', `/auth/v1/admin/users/${userId}`, {
                    password: TEST_PASSWORD,
                });
            }
        }
    }

    if (!userId) {
        console.log('[E2E Setup] Could not create or find test user. Auth tests may fail.');
        fs.writeFileSync(storageStatePath, JSON.stringify({ cookies: [], origins: [] }));
        return;
    }

    // ── Step 2: Find or create a tenant for the user ──
    console.log('[E2E Setup] Step 2: Checking tenant membership...');

    // Check if user already has a tenant
    const tmRes = await supabaseAdmin('GET', `/rest/v1/tenant_members?user_id=eq.${userId}&select=tenant_id`);
    let tenantId: string | null = null;

    if (tmRes.ok && Array.isArray(tmRes.data) && tmRes.data.length > 0) {
        tenantId = tmRes.data[0].tenant_id;
        console.log(`[E2E Setup] User already in tenant: ${tenantId}`);
    } else {
        // Find any existing tenant to add user to
        const tenantsRes = await supabaseAdmin('GET', '/rest/v1/tenants?select=id&limit=1');
        if (tenantsRes.ok && Array.isArray(tenantsRes.data) && tenantsRes.data.length > 0) {
            tenantId = tenantsRes.data[0].id;
            // Add user to tenant
            const addRes = await supabaseAdmin('POST', '/rest/v1/tenant_members', {
                tenant_id: tenantId,
                user_id: userId,
                role: 'admin',
            });
            console.log(`[E2E Setup] Added user to tenant ${tenantId}: ${addRes.ok ? 'OK' : JSON.stringify(addRes.data).substring(0, 100)}`);
        }
    }

    // ── Step 3: Find or create a test project ──
    console.log('[E2E Setup] Step 3: Checking/creating test project...');

    if (tenantId) {
        // Check if test project exists
        const projRes = await supabaseAdmin('GET', `/rest/v1/projects?name=eq.E2E Test Project&tenant_id=eq.${tenantId}&select=id`);

        if (projRes.ok && Array.isArray(projRes.data) && projRes.data.length > 0) {
            console.log(`[E2E Setup] Test project already exists: ${projRes.data[0].id}`);
        } else {
            // Create a test project
            const newProj = await supabaseAdmin('POST', '/rest/v1/projects', {
                name: 'E2E Test Project',
                description: 'Automated E2E test project',
                status: 'active',
                tenant_id: tenantId,
                created_by: userId,
                project_type: 'standard',
            });
            if (newProj.ok) {
                console.log(`[E2E Setup] Test project created: ${newProj.data?.[0]?.id || 'OK'}`);
            } else {
                console.log(`[E2E Setup] Project creation: ${JSON.stringify(newProj.data).substring(0, 200)}`);
            }
        }
    }

    // ── Step 4: Authenticate via browser and save storage state ──
    console.log('[E2E Setup] Step 4: Browser authentication...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:8080';
        await page.goto(`${baseURL}/auth`);
        await page.waitForLoadState('domcontentloaded');

        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button[type="submit"]');

        await page.waitForURL(/\/(dashboard|app|projects)/i, { timeout: 20000 });
        console.log('[E2E Setup] ✅ Authentication successful!');

        await page.context().storageState({ path: storageStatePath });
        console.log('[E2E Setup] ✅ Storage state saved');
    } catch (err) {
        console.log(`[E2E Setup] ⚠ Browser auth failed: ${err}`);
        fs.writeFileSync(storageStatePath, JSON.stringify({ cookies: [], origins: [] }));
    } finally {
        await browser.close();
    }

    console.log('[E2E Setup] Done!');
}

export default globalSetup;

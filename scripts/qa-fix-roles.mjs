/**
 * QA Fix: Assign varied project-level roles and platform roles
 * so that RBAC enforcement can actually be tested.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    // ─── 1. Pick a project to test with ────────────────────────────────
    const SUPER_ADMIN_ID = '3a6889fe-2932-4004-9bfb-65a4b34a93ea';

    // Use "TP-Alpha Software Delivery" project for role testing
    const TEST_PROJECT_ID = '04eed42d-90c3-4d05-9738-faf5b49508ff';

    // ─── 2. Get first 5 seeded users (batch 3, users 0-4) ─────────────
    // We'll assign: owner, admin, manager, member, viewer
    const targetUsers = [
        { id: '402eaa28-d05c-4371-9123-c19bc2d422fb', role: 'owner', email: 'user0_1771513622964@example.com' },
        { id: '72d85b3f-b18b-43ec-a1ce-c86e1a8021bf', role: 'admin', email: 'user1_1771513624288@example.com' },
        { id: 'b93c7aae-d251-405c-9489-e26bab986bc1', role: 'manager', email: 'user2_1771513624762@example.com' },
        { id: '3d21016c-e060-4e82-b713-6c3c94c4f3d1', role: 'member', email: 'user3_1771513625164@example.com' },
        { id: '54ade06c-3620-41ca-bb41-6074c0b3ddee', role: 'viewer', email: 'user4_1771513625568@example.com' },
    ];

    console.log(`\n=== Fixing project-level roles for project ${TEST_PROJECT_ID} ===\n`);

    for (const u of targetUsers) {
        // Upsert into user_roles
        const { error } = await s
            .from('user_roles')
            .upsert({
                user_id: u.id,
                project_id: TEST_PROJECT_ID,
                role: u.role,
                role_name: u.role.charAt(0).toUpperCase() + u.role.slice(1),
                is_active: true,
            }, { onConflict: 'user_id,project_id' });

        if (error) {
            console.error(`  ❌ ${u.email} → ${u.role}: ${error.message}`);
        } else {
            console.log(`  ✅ ${u.email} → ${u.role}`);
        }
    }

    // ─── 3. Also assign Super Admin as owner on this project ───────────
    {
        const { error } = await s
            .from('user_roles')
            .upsert({
                user_id: SUPER_ADMIN_ID,
                project_id: TEST_PROJECT_ID,
                role: 'owner',
                role_name: 'Owner',
                is_active: true,
            }, { onConflict: 'user_id,project_id' });

        if (error) {
            console.error(`  ❌ Super Admin → owner: ${error.message}`);
        } else {
            console.log(`  ✅ admin@projectoye.com → owner (Super Admin)`);
        }
    }

    // ─── 4. Assign platform roles to representative users ──────────────
    console.log(`\n=== Assigning platform roles ===\n`);

    const platformRoleAssignments = [
        // Super Admin → Super Admin platform role
        { userId: SUPER_ADMIN_ID, roleId: 'c4f19d76-7fe6-49cf-9898-fca838af9030', roleName: 'Super Admin' },
        // user0 → Project Manager platform role
        { userId: '402eaa28-d05c-4371-9123-c19bc2d422fb', roleId: '5dd3517a-a5a8-4f69-8df6-2fd5c54c430d', roleName: 'Project Manager' },
        // user2 → Team Member platform role
        { userId: 'b93c7aae-d251-405c-9489-e26bab986bc1', roleId: 'fccd2d94-6945-4341-b5c0-7e4d1774046d', roleName: 'Team Member' },
        // user4 → Viewer platform role
        { userId: '54ade06c-3620-41ca-bb41-6074c0b3ddee', roleId: 'f31442dc-9491-4f56-862c-f7df2ee89d01', roleName: 'Viewer' },
        // user1 → Finance Analyst platform role
        { userId: '72d85b3f-b18b-43ec-a1ce-c86e1a8021bf', roleId: '34779067-ec42-482d-a93f-3bd9fcc2b43f', roleName: 'Finance Analyst' },
    ];

    for (const a of platformRoleAssignments) {
        const { error } = await s
            .from('platform_user_roles')
            .upsert({
                user_id: a.userId,
                role_id: a.roleId,
            }, { onConflict: 'user_id,role_id' });

        if (error) {
            console.error(`  ❌ ${a.roleName}: ${error.message}`);
        } else {
            console.log(`  ✅ Assigned ${a.roleName}`);
        }
    }

    // ─── 5. Map all 5 test users to the Super Admin's tenant ───────────
    console.log(`\n=== Mapping test users to tenant ===\n`);
    const TENANT_ID = '1ce6918b-f51d-441a-937f-077b570df7bc';

    for (const u of targetUsers) {
        const tenantRole = u.role === 'owner' ? 'admin' : u.role === 'admin' ? 'admin' : 'member';
        const { error } = await s
            .from('user_tenants')
            .upsert({
                user_id: u.id,
                tenant_id: TENANT_ID,
                role: tenantRole,
                tenant_name: "admin's Organization",
            }, { onConflict: 'user_id,tenant_id' });

        if (error) {
            console.error(`  ❌ ${u.email} → tenant: ${error.message}`);
        } else {
            console.log(`  ✅ ${u.email} → tenant (${tenantRole})`);
        }
    }

    // ─── 6. Verify ─────────────────────────────────────────────────────
    console.log(`\n=== Verification ===\n`);

    const { data: roles } = await s
        .from('user_roles')
        .select('user_id, role, role_name')
        .eq('project_id', TEST_PROJECT_ID);
    console.log('Project roles:', roles?.map(r => `${r.role} (${r.role_name})`));

    const { data: pRoles } = await s
        .from('platform_user_roles')
        .select('user_id, role_id');
    console.log('Platform user role assignments:', pRoles?.length);

    const { data: tenants } = await s
        .from('user_tenants')
        .select('user_id, role, tenant_name')
        .eq('tenant_id', TENANT_ID);
    console.log('Tenant users:', tenants?.map(t => `${t.role}`));

    console.log('\n✅ Done! Ready for RBAC UI testing.\n');
}

main().catch(console.error);

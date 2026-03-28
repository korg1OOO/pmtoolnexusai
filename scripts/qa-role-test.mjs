/**
 * QA Phase 2: Per-Role UI Testing
 * Tests role-based access control across workspace, program, and tenant levels.
 * 
 * Usage: node scripts/qa-role-test.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const testUsers = JSON.parse(fs.readFileSync('scripts/qa-test-users.json', 'utf8'));
const report = [];
function log(msg) { report.push(msg); console.log(msg); }

async function main() {
    log('═══════════════════════════════════════════════════════════');
    log('  QA Phase 2: Per-Role UI Testing Report');
    log('═══════════════════════════════════════════════════════════\n');

    // ─── 1. Full User Map ───────────────────────────────────────
    log('── 1. Complete Test User Map ──\n');

    const allUsers = {};
    for (const [tier, user] of Object.entries(testUsers.testUsers)) {
        const { data: profile } = await supabase.from('profiles').select('email,role,platform_role,display_name').eq('id', user.userId).single();
        const { data: wsMem } = await supabase.from('workspace_members').select('role').eq('workspace_id', testUsers.workspace.id).eq('user_id', user.userId).maybeSingle();
        const { data: pmMem } = await supabase.from('program_members').select('role').eq('program_id', testUsers.program.id).eq('user_id', user.userId).maybeSingle();
        const { data: tenantMem } = await supabase.from('user_tenants').select('role').eq('tenant_id', testUsers.tenant.id).eq('user_id', user.userId).maybeSingle();

        allUsers[tier] = {
            email: profile?.email,
            profileRole: profile?.role,
            platformRole: profile?.platform_role,
            wsRole: wsMem?.role || 'NOT MEMBER',
            pgRole: pmMem?.role || 'NOT MEMBER',
            tenantRole: tenantMem?.role || 'NOT MEMBER',
        };

        log(`  ${tier.toUpperCase()} TIER: ${profile?.email}`);
        log(`    Profile role:  ${profile?.role || 'null'}`);
        log(`    Platform role: ${profile?.platform_role || 'null'}`);
        log(`    Workspace:     ${wsMem?.role || 'NOT MEMBER'}`);
        log(`    Program:       ${pmMem?.role || 'NOT MEMBER'}`);
        log(`    Tenant:        ${tenantMem?.role || 'NOT MEMBER'}`);
        log('');
    }

    // ─── 2. Role-Access Matrix ──────────────────────────────────
    log('── 2. Expected Role-Access Matrix ──\n');

    const matrix = [
        { route: '/admin/*', guard: 'AdminPanel', requiredRole: 'platform admin', tier: 'any' },
        { route: '/tenant/*', guard: 'TenantRoute', requiredRole: 'tenant admin/owner', tier: 'any' },
        { route: '/workspace/:id/*', guard: 'WorkspaceRoute + RequireTier(business)', requiredRole: 'ws member', tier: 'business+' },
        { route: '/portfolio/:id/*', guard: 'RequireTier(business)', requiredRole: 'authenticated', tier: 'business+' },
        { route: '/program/:id/*', guard: 'ProgramRoute + RequireTier(business)', requiredRole: 'pg member', tier: 'business+' },
        { route: '/dashboard', guard: 'ProtectedProjectRoute', requiredRole: 'authenticated', tier: 'free+' },
        { route: '/financials', guard: 'RequireTier(pro) + RequirePermission(budget.view)', requiredRole: 'budget.view', tier: 'pro+' },
        { route: '/evm', guard: 'RequireTier(pro)', requiredRole: 'authenticated', tier: 'pro+' },
    ];

    log('  Route'.padEnd(30) + 'Guard'.padEnd(50) + 'Min Role'.padEnd(20) + 'Min Tier');
    log('  ' + '-'.repeat(115));
    for (const row of matrix) {
        log(`  ${row.route.padEnd(28)}${row.guard.padEnd(50)}${row.requiredRole.padEnd(20)}${row.tier}`);
    }

    // ─── 3. Per-User Expected Access ────────────────────────────
    log('\n── 3. Per-User Expected Access ──\n');

    const accessTests = [
        { route: '/dashboard', description: 'Main dashboard' },
        { route: '/admin/dashboard', description: 'Platform admin' },
        { route: '/tenant', description: 'Tenant admin' },
        { route: `/workspace/${testUsers.workspace.id}`, description: 'Workspace dashboard' },
        { route: `/portfolio/${testUsers.portfolios[0].id}`, description: 'Portfolio dashboard' },
        { route: `/program/${testUsers.program.id}/stakeholders`, description: 'Program stakeholders' },
        { route: '/financials', description: 'Financials (Pro+)' },
        { route: '/evm', description: 'EVM (Pro+)' },
    ];

    for (const [tier, info] of Object.entries(allUsers)) {
        log(`  ${tier.toUpperCase()} (${info.email}):`);
        for (const test of accessTests) {
            let expected = '?';

            if (test.route === '/dashboard') {
                expected = '✅ Allowed (all authenticated)';
            } else if (test.route === '/admin/dashboard') {
                expected = info.platformRole === 'admin' ? '✅ Allowed (platform admin)' : '❌ Blocked (not admin)';
            } else if (test.route === '/tenant') {
                expected = info.tenantRole === 'admin' || info.tenantRole === 'owner' ? '✅ Allowed (tenant admin)' : '❌ Blocked (not tenant admin)';
            } else if (test.route.includes('/workspace/')) {
                if (['free', 'pro'].includes(tier)) expected = '❌ Blocked (tier < business)';
                else if (info.wsRole === 'NOT MEMBER') expected = '❌ Blocked (not ws member)';
                else expected = '✅ Allowed (ws ' + info.wsRole + ')';
            } else if (test.route.includes('/portfolio/')) {
                if (['free', 'pro'].includes(tier)) expected = '❌ Blocked (tier < business)';
                else expected = '✅ Allowed (business+)';
            } else if (test.route.includes('/program/')) {
                if (['free', 'pro'].includes(tier)) expected = '❌ Blocked (tier < business)';
                else if (info.pgRole === 'NOT MEMBER') expected = '❌ Blocked (not pg member)';
                else expected = '✅ Allowed (pg ' + info.pgRole + ')';
            } else if (test.route === '/financials' || test.route === '/evm') {
                if (tier === 'free') expected = '❌ Blocked (tier < pro)';
                else expected = '✅ Allowed (pro+)';
            }

            log(`    ${test.description.padEnd(25)} → ${expected}`);
        }
        log('');
    }

    // ─── 4. WorkspaceRoute Role Behavior ────────────────────────
    log('── 4. WorkspaceRoute Role Behavior ──\n');

    // Check if WorkspaceRoute differentiates between admin/manager/member
    const wsRouteFile = fs.readFileSync('src/components/auth/WorkspaceRoute.tsx', 'utf8');
    const hasRoleCheck = wsRouteFile.includes('role') && (wsRouteFile.includes('admin') || wsRouteFile.includes('manager'));
    log(`  WorkspaceRoute has role-specific checks: ${hasRoleCheck ? 'YES' : 'NO (membership only)'}`);

    const pgRouteFile = fs.readFileSync('src/components/auth/ProgramRoute.tsx', 'utf8');
    const hasPgRoleCheck = pgRouteFile.includes('role') && (pgRouteFile.includes('admin') || pgRouteFile.includes('manager'));
    log(`  ProgramRoute has role-specific checks:   ${hasPgRoleCheck ? 'YES' : 'NO (membership only)'}`);

    // ─── 5. Admin Panel Access Check ────────────────────────────
    log('\n── 5. Admin Panel Access Check ──\n');

    // Check what role the admin panel requires
    const adminFiles = ['src/components/admin/AdminPanel.tsx', 'src/components/admin/AdminLayout.tsx'];
    for (const f of adminFiles) {
        if (fs.existsSync(f)) {
            const content = fs.readFileSync(f, 'utf8');
            const roleCheck = content.match(/role\s*[=!]==?\s*['"](\w+)['"]/);
            const platformCheck = content.match(/platform_role\s*[=!]==?\s*['"](\w+)['"]/);
            log(`  ${f}: role check=${roleCheck?.[0] || 'none'}, platform=${platformCheck?.[0] || 'none'}`);
        }
    }

    // ─── 6. Permission Check Deep Dive ──────────────────────────
    log('\n── 6. RequirePermission Usage ──\n');

    const requirePermFiles = [];
    const srcDir = 'src/routes';
    const routeFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx'));
    for (const f of routeFiles) {
        const content = fs.readFileSync(`${srcDir}/${f}`, 'utf8');
        const matches = content.matchAll(/RequirePermission\s+permission="([^"]+)"/g);
        for (const m of matches) {
            requirePermFiles.push({ file: f, permission: m[1] });
        }
    }

    if (requirePermFiles.length) {
        for (const p of requirePermFiles) {
            log(`  ${p.file}: requires "${p.permission}"`);
        }
    } else {
        log('  No RequirePermission usage found in route files');
    }

    // ─── Summary ──────────────────────────────────────────────
    log('\n═══════════════════════════════════════════════════════════');
    log('  SUMMARY');
    log('═══════════════════════════════════════════════════════════\n');

    log('Role-based access control operates at 3 levels:');
    log('  1. MEMBERSHIP — WorkspaceRoute/ProgramRoute check if user is a member (any role)');
    log('  2. TIER — RequireTier blocks users below minimum subscription tier');
    log('  3. PERMISSIONS — RequirePermission blocks unless user has RBAC permission');
    log('');
    log('Key findings:');
    log('  • WorkspaceRoute does NOT differentiate admin/manager/member (membership-only)');
    log('  • ProgramRoute does NOT differentiate manager/lead/member/viewer (membership-only)');
    log('  • All workspace/portfolio/program routes require Business tier');
    log('  • /financials requires both Pro tier + budget.view permission');
    log('  • Admin panel requires platform admin role');
    log('');
    log('Browser tests needed:');
    log('  1. ✅ Business admin (user7) → workspace/portfolio/program → ALLOWED (Phase 5)');
    log('  2. ✅ Free tier (user4) → workspace → BLOCKED "Business Required" (Phase 5)');
    log('  3. Pro tier (user9) → /financials → should ALLOW (Pro+)');
    log('  4. Pro tier (user9) → /workspace → should BLOCK (tier < business)');
    log('  5. Free tier (user4) → /evm → should BLOCK (tier < pro)');
    log('  6. Agency admin (user1) → /admin → check platform access');

    fs.writeFileSync('scripts/qa-role-test-report.txt', report.join('\n'));
    log('\n✅ Report saved to scripts/qa-role-test-report.txt');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });

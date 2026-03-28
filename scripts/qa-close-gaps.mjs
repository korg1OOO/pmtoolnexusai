/**
 * QA Gap Closure — Phase 1: Complete Role & Subscription Setup
 *
 * Creates users for ALL role permutations, queries full DB state,
 * builds role×feature matrix, and sets up upgrade/downgrade test data.
 *
 * Usage: node scripts/qa-close-gaps.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const report = [];
function log(msg) { report.push(msg); console.log(msg); }

async function main() {
    log('=== QA GAP CLOSURE — DATA SETUP ===\n');

    // ─── 1. Full DB State ─────────────────────────────────────────────────
    log('── 1. Current DB State ──');

    const { data: profiles } = await supabase.from('profiles').select('id,full_name,email,platform_role,project_role').limit(100);
    const { data: subs } = await supabase.from('subscriptions').select('id,user_id,tier,status');
    const { data: plans } = await supabase.from('subscription_plans').select('id,name,tier,price,max_projects,max_members');
    const { data: wsm } = await supabase.from('workspace_members').select('user_id,workspace_id,role');
    const { data: pm } = await supabase.from('program_members').select('user_id,program_id,role');
    const { data: tm } = await supabase.from('user_tenants').select('user_id,tenant_id,role');
    const { data: workspaces } = await supabase.from('workspaces').select('id,name,tenant_id');
    const { data: programs } = await supabase.from('programs').select('id,name,tenant_id');
    const { data: tenants } = await supabase.from('tenants').select('id,name');

    // Build maps
    const subsByUser = {};
    (subs || []).forEach(s => { subsByUser[s.user_id] = s; });

    log(`Profiles: ${profiles.length}`);
    log(`Subscriptions: ${(subs || []).length}`);
    log(`Plans: ${(plans || []).length}`);
    log(`Workspace members: ${(wsm || []).length}`);
    log(`Program members: ${(pm || []).length}`);
    log(`Tenant members: ${(tm || []).length}`);

    // Unique roles
    const uniqPlatform = [...new Set(profiles.map(p => p.platform_role).filter(Boolean))];
    const uniqProject = [...new Set(profiles.map(p => p.project_role).filter(Boolean))];
    log(`Platform roles: ${uniqPlatform.join(', ')}`);
    log(`Project roles: ${uniqProject.join(', ')}`);

    // ─── 2. List ALL existing test users ──────────────────────────────────
    log('\n── 2. Existing Test Users ──');
    const testUserProfiles = profiles.filter(p => p.full_name && p.full_name.includes('User') && p.full_name.includes('Name'));
    for (const u of testUserProfiles) {
        const sub = subsByUser[u.id];
        log(`  ${u.full_name} | platform=${u.platform_role} | project=${u.project_role} | tier=${sub ? sub.tier : 'none'} | id=${u.id.substring(0, 8)}`);
    }

    // ─── 3. Define required role permutations ─────────────────────────────
    log('\n── 3. Required Role Permutations ──');

    // Platform roles: super_admin, admin, member (and null/default)
    // Project roles: admin, manager, member, viewer
    // Tier levels: free, pro, business, agency
    // We need at minimum one user per project_role that can actually login

    const requiredUsers = [
        { label: 'Project Admin + Business', project_role: 'admin', platform_role: 'admin', tier: 'business' },
        { label: 'Project Manager + Pro', project_role: 'manager', platform_role: 'member', tier: 'pro' },
        { label: 'Project Member + Pro', project_role: 'member', platform_role: 'member', tier: 'pro' },
        { label: 'Project Viewer + Free', project_role: 'viewer', platform_role: 'member', tier: 'free' },
        { label: 'Platform Super Admin + Agency', project_role: 'admin', platform_role: 'super_admin', tier: 'agency' },
    ];

    // Check which test users satisfy which required role
    const ts = Date.now();
    const userRef = {};

    for (const req of requiredUsers) {
        // Find existing test user matching
        let match = testUserProfiles.find(p =>
            p.project_role === req.project_role &&
            p.platform_role === req.platform_role &&
            subsByUser[p.id]?.tier === req.tier
        );

        if (match) {
            log(`  ✅ ${req.label}: ${match.full_name} (${match.id.substring(0, 8)})`);
            userRef[req.label] = { userId: match.id, email: match.email || match.full_name, ...req };
        } else {
            // Try to find ANY test user with the right project_role
            match = testUserProfiles.find(p => p.project_role === req.project_role);
            if (match) {
                // Update their platform_role and tier
                log(`  🔧 Updating ${match.full_name} → platform=${req.platform_role}, project=${req.project_role}`);
                const { error: updateErr } = await supabase.from('profiles').update({
                    platform_role: req.platform_role,
                    project_role: req.project_role,
                }).eq('id', match.id);
                if (updateErr) log(`    ❌ Profile update failed: ${updateErr.message}`);

                // Check/fix their subscription tier
                const existingSub = subsByUser[match.id];
                if (existingSub && existingSub.tier !== req.tier) {
                    const { error: subErr } = await supabase.from('subscriptions').update({ tier: req.tier }).eq('id', existingSub.id);
                    if (subErr) log(`    ❌ Sub update failed: ${subErr.message}`);
                    else log(`    ✅ Sub updated to ${req.tier}`);
                } else if (!existingSub) {
                    const plan = (plans || []).find(p => p.tier === req.tier);
                    if (plan) {
                        const { error: insertErr } = await supabase.from('subscriptions').insert({
                            user_id: match.id, tier: req.tier, status: 'active',
                            plan_id: plan.id, billing_cycle: 'monthly',
                        });
                        if (insertErr) log(`    ❌ Sub create failed: ${insertErr.message}`);
                        else log(`    ✅ Sub created: ${req.tier}`);
                    }
                }

                userRef[req.label] = { userId: match.id, email: match.email || match.full_name, ...req };
            } else {
                // Need to create a new test user via auth
                const email = `qa_${req.project_role}_${ts}@example.com`;
                const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
                    email,
                    password: 'password123',
                    email_confirm: true,
                    user_metadata: { full_name: `QA ${req.project_role} User` },
                });

                if (authErr) {
                    log(`  ❌ ${req.label}: Failed to create user: ${authErr.message}`);
                    continue;
                }

                log(`  🆕 Created user: ${email} (${authUser.user.id.substring(0, 8)})`);

                // Set roles
                await supabase.from('profiles').update({
                    platform_role: req.platform_role,
                    project_role: req.project_role,
                    full_name: `QA ${req.project_role} User`,
                }).eq('id', authUser.user.id);

                // Create subscription
                const plan = (plans || []).find(p => p.tier === req.tier);
                if (plan) {
                    await supabase.from('subscriptions').insert({
                        user_id: authUser.user.id, tier: req.tier, status: 'active',
                        plan_id: plan.id, billing_cycle: 'monthly',
                    });
                }

                userRef[req.label] = { userId: authUser.user.id, email, ...req };
            }
        }
    }

    // ─── 4. Ensure all role users are workspace + program members ───────
    log('\n── 4. Ensure Membership ──');
    const ws = workspaces[0];
    const prog = programs[0];
    const tenant = tenants[0];

    const existingWsIds = new Set((wsm || []).map(m => m.user_id));
    const existingPmIds = new Set((pm || []).map(m => m.user_id));
    const existingTmIds = new Set((tm || []).map(m => m.user_id));

    for (const [label, user] of Object.entries(userRef)) {
        // Workspace membership
        if (!existingWsIds.has(user.userId)) {
            const wsRole = user.project_role === 'admin' ? 'admin' :
                user.project_role === 'manager' ? 'manager' :
                    user.project_role === 'viewer' ? 'viewer' : 'member';
            const { error } = await supabase.from('workspace_members').insert({
                workspace_id: ws.id, user_id: user.userId,
                tenant_id: ws.tenant_id, role: wsRole, is_active: true,
            });
            if (error) log(`  ❌ WS member ${label}: ${error.message}`);
            else log(`  ✅ WS member ${label}: role=${wsRole}`);
        }

        // Program membership
        if (!existingPmIds.has(user.userId)) {
            const pmRole = user.project_role === 'admin' ? 'manager' :
                user.project_role === 'manager' ? 'lead' :
                    user.project_role === 'viewer' ? 'viewer' : 'member';
            const { error } = await supabase.from('program_members').insert({
                program_id: prog.id, user_id: user.userId,
                tenant_id: prog.tenant_id || tenant.id, role: pmRole, is_active: true,
            });
            if (error) log(`  ❌ PM member ${label}: ${error.message}`);
            else log(`  ✅ PM member ${label}: role=${pmRole}`);
        }

        // Tenant membership
        if (!existingTmIds.has(user.userId)) {
            const tRole = user.platform_role === 'super_admin' || user.platform_role === 'admin' ? 'admin' : 'member';
            const { error } = await supabase.from('user_tenants').insert({
                user_id: user.userId, tenant_id: tenant.id, role: tRole,
            });
            if (error) log(`  ❌ Tenant member ${label}: ${error.message}`);
            else log(`  ✅ Tenant member ${label}: role=${tRole}`);
        }
    }

    // ─── 5. Build Feature-Level Access Matrix ─────────────────────────────
    log('\n── 5. Feature-Level Access Matrix ──');
    log('');
    log('| Feature / Action           | Admin     | Manager   | Member    | Viewer    | Guard Type        |');
    log('|----------------------------|-----------|-----------|-----------|-----------|-------------------|');
    log('| Dashboard (view)           | ✅ Allow  | ✅ Allow  | ✅ Allow  | ✅ Allow  | None              |');
    log('| Tasks (view list)          | ✅ Allow  | ✅ Allow  | ✅ Allow  | ✅ Allow  | None              |');
    log('| Tasks (create/edit)        | ✅ Allow  | ✅ Allow  | ✅ Allow  | ❌ Block  | RequirePermission  |');
    log('| Tasks (delete)             | ✅ Allow  | ✅ Allow  | ❌ Block  | ❌ Block  | RequirePermission  |');
    log('| Financials (view)          | ✅ Allow  | ❌ Block  | ❌ Block  | ❌ Block  | budget.view        |');
    log('| Team Members (manage)      | ✅ Allow  | ✅ Allow  | ❌ Block  | ❌ Block  | team.manage        |');
    log('| Project Settings           | ✅ Allow  | ❌ Block  | ❌ Block  | ❌ Block  | project.settings   |');
    log('| Sprint (create)            | ✅ Allow  | ✅ Allow  | ❌ Block  | ❌ Block  | sprint.manage      |');
    log('| AI Agent (Plan mode)       | ✅ Allow  | ✅ Allow  | ✅ Allow  | ✅ Allow* | Edge function      |');
    log('| AI Agent (Action mode)     | ✅ Allow  | ✅ Allow  | ✅ Allow  | ❌ Block  | RBAC in tool exec  |');
    log('| Workspace pages            | ✅ Allow  | ✅ Allow  | ✅ Allow  | ✅ Allow  | WorkspaceRoute     |');
    log('| Portfolio pages            | ✅ Allow  | ✅ Allow  | ✅ Allow  | ✅ Allow  | TenantRoute        |');
    log('| Program pages              | ✅ Allow  | ✅ Allow  | ✅ Allow  | ✅ Allow  | ProgramRoute       |');
    log('| Admin Panel (/admin/*)     | ✅ Allow  | ❌ Block  | ❌ Block  | ❌ Block  | AdminRoute         |');
    log('| Tenant Admin (/tenant/*)   | ✅ Allow  | ❌ Block  | ❌ Block  | ❌ Block  | TenantRoute(admin) |');
    log('');
    log('*Viewer can ask AI questions but cannot execute destructive actions.');

    // ─── 6. Save User Reference ───────────────────────────────────────────
    log('\n── 6. User Reference ──');
    const ref = {
        timestamp: new Date().toISOString(),
        users: userRef,
        password: 'password123',
        workspace: ws,
        program: prog,
        tenant: tenant,
    };
    fs.writeFileSync('scripts/qa-role-users.json', JSON.stringify(ref, null, 2));
    log('Saved to scripts/qa-role-users.json');

    for (const [label, user] of Object.entries(userRef)) {
        log(`  ${label}: ${user.email} | password123`);
    }

    log('\n=== SETUP COMPLETE ===');
    fs.writeFileSync('scripts/qa-gap-closure-report.txt', report.join('\n'));
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});

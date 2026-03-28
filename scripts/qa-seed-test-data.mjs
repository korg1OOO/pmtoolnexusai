/**
 * QA Phase 7: Comprehensive Data Setup
 *
 * Seeds the data prerequisites for full E2E testing:
 * 1. Maps subscriptions → profiles to find testable users per tier
 * 2. Seeds workspace_members with varied roles
 * 3. Seeds program_members with varied roles
 * 4. Adds tenant user mappings
 *
 * Usage: node scripts/qa-seed-test-data.mjs
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
    log('=== QA DATA SETUP ===\n');

    // ─── Step 1: Map subscriptions → profiles ───────────────────────────
    log('── Step 1: Map subscriptions → profiles ──');

    const { data: subs } = await supabase.from('subscriptions').select('*');
    const { data: profiles } = await supabase.from('profiles').select('id,email,role,full_name');

    // Build userId → profile map
    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    // Group subscriptions by tier+status
    const tierUsers = { free: [], pro: [], business: [], agency: [] };
    (subs || []).forEach(s => {
        if (s.status === 'active' && s.tier && tierUsers[s.tier]) {
            const profile = profileMap[s.user_id];
            if (profile) {
                tierUsers[s.tier].push({
                    userId: s.user_id,
                    email: profile.email,
                    role: profile.role,
                    name: profile.full_name,
                    subId: s.id,
                });
            }
        }
    });

    log('\nTestable users per tier:');
    const testUsers = {};
    for (const [tier, users] of Object.entries(tierUsers)) {
        if (users.length > 0) {
            testUsers[tier] = users[0];
            log(`  ${tier}: ${users[0].email} (role=${users[0].role}, id=${users[0].userId.substring(0, 8)})`);
        } else {
            log(`  ${tier}: ⚠️ NO USERS FOUND — need to create one`);
        }
    }

    // If any tier has no users, find unsubscribed profiles and create subscriptions
    for (const tier of ['free', 'pro', 'business', 'agency']) {
        if (!testUsers[tier]) {
            // Find a profile with no subscription
            const subscribedUserIds = new Set((subs || []).map(s => s.user_id));
            const unsubscribed = (profiles || []).find(p => !subscribedUserIds.has(p.id));
            if (unsubscribed) {
                const { data: plans } = await supabase.from('subscription_plans').select('id').eq('tier', tier).single();
                if (plans) {
                    const { data: newSub, error } = await supabase.from('subscriptions').insert({
                        user_id: unsubscribed.id,
                        tier: tier,
                        status: 'active',
                        plan_id: plans.id,
                        billing_cycle: 'monthly',
                    }).select().single();

                    if (!error) {
                        testUsers[tier] = { userId: unsubscribed.id, email: unsubscribed.email, role: unsubscribed.role, name: unsubscribed.full_name };
                        log(`  ${tier}: Created subscription for ${unsubscribed.email}`);
                    } else {
                        log(`  ${tier}: ❌ Failed to create sub: ${error.message}`);
                    }
                }
            }
        }
    }

    // ─── Step 2: Seed workspace_members ────────────────────────────────
    log('\n── Step 2: Seed workspace_members ──');

    const { data: workspaces } = await supabase.from('workspaces').select('id, tenant_id');
    if (!workspaces?.length) {
        log('  ⚠️ No workspaces found — cannot seed members');
    } else {
        const ws = workspaces[0];
        log(`  Using workspace: ${ws.id.substring(0, 8)} (tenant: ${ws.tenant_id.substring(0, 8)})`);

        // Check existing members
        const { data: existingWM } = await supabase.from('workspace_members').select('user_id');
        const existingWMIds = new Set((existingWM || []).map(m => m.user_id));

        // Pick users for workspace roles
        const wsRoles = ['admin', 'manager', 'member'];
        const wsAdminUser = testUsers.business || testUsers.agency;
        const wsManagerUser = Object.values(tierUsers).flat().find(u => u.role === 'manager');
        const wsMemberUser = Object.values(tierUsers).flat().find(u => u.role === 'member');

        const wsMembers = [
            { user: wsAdminUser, role: 'admin', label: 'workspace admin' },
            { user: wsManagerUser, role: 'manager', label: 'workspace manager' },
            { user: wsMemberUser, role: 'member', label: 'workspace member' },
        ];

        for (const { user, role, label } of wsMembers) {
            if (!user) { log(`  ⚠️ No user found for ${label}`); continue; }
            if (existingWMIds.has(user.userId)) { log(`  ✅ ${label}: ${user.email} already exists`); continue; }

            const { error } = await supabase.from('workspace_members').insert({
                workspace_id: ws.id,
                user_id: user.userId,
                tenant_id: ws.tenant_id,
                role: role,
                is_active: true,
            });

            if (error) {
                log(`  ❌ ${label}: ${error.message}`);
            } else {
                log(`  ✅ ${label}: Added ${user.email} as ${role}`);
            }
        }
    }

    // ─── Step 3: Seed program_members ──────────────────────────────────
    log('\n── Step 3: Seed program_members ──');

    const { data: programs } = await supabase.from('programs').select('id, tenant_id');
    if (!programs?.length) {
        log('  ⚠️ No programs found — cannot seed members');
    } else {
        const prog = programs[0];
        // Programs may not have tenant_id directly — get it from portfolio→workspace→tenant
        const { data: portfolios } = await supabase.from('portfolios').select('id, tenant_id');
        const portfolioTenantMap = {};
        (portfolios || []).forEach(p => { if (p.tenant_id) portfolioTenantMap[p.id] = p.tenant_id; });

        // Get tenant_id — try program.tenant_id, then portfolio.tenant_id, then first tenant
        let tenantId = prog.tenant_id;
        if (!tenantId) {
            const { data: tenants } = await supabase.from('tenants').select('id').limit(1).single();
            tenantId = tenants?.id;
        }

        log(`  Using program: ${prog.id.substring(0, 8)} (tenant: ${tenantId?.substring(0, 8) || 'unknown'})`);

        const { data: existingPM } = await supabase.from('program_members').select('user_id');
        const existingPMIds = new Set((existingPM || []).map(m => m.user_id));

        const pmRoles = ['manager', 'lead', 'member', 'viewer'];
        const allUsers = Object.values(tierUsers).flat();

        // Pick distinct users for each program role
        const usedIds = new Set();
        const pmMembers = [];
        for (const role of pmRoles) {
            const user = allUsers.find(u => !usedIds.has(u.userId) && !existingPMIds.has(u.userId));
            if (user) {
                usedIds.add(user.userId);
                pmMembers.push({ user, role });
            }
        }

        for (const { user, role } of pmMembers) {
            const { error } = await supabase.from('program_members').insert({
                program_id: prog.id,
                user_id: user.userId,
                tenant_id: tenantId,
                role: role,
                is_active: true,
            });

            if (error) {
                log(`  ❌ program ${role}: ${error.message}`);
            } else {
                log(`  ✅ program ${role}: Added ${user.email}`);
            }
        }
    }

    // ─── Step 4: Seed user_tenants ─────────────────────────────────────
    log('\n── Step 4: Seed user_tenants ──');

    const { data: tenants } = await supabase.from('tenants').select('id, name');
    if (!tenants?.length) {
        log('  ⚠️ No tenants found');
    } else {
        const tenant = tenants[0];
        log(`  Using tenant: ${tenant.name} (${tenant.id.substring(0, 8)})`);

        const { data: existingUT } = await supabase.from('user_tenants').select('user_id, role');
        const existingUTIds = new Set((existingUT || []).map(m => m.user_id));

        // Add an admin user to tenant
        const tenantAdmin = (profiles || []).find(p =>
            p.role === 'admin' && !existingUTIds.has(p.id)
        );
        if (tenantAdmin) {
            const { error } = await supabase.from('user_tenants').insert({
                user_id: tenantAdmin.id,
                tenant_id: tenant.id,
                role: 'admin',
            });
            if (error) {
                log(`  ❌ tenant admin: ${error.message}`);
            } else {
                log(`  ✅ tenant admin: Added ${tenantAdmin.email}`);
            }
        }

        // Add a member user to tenant
        const tenantMember = (profiles || []).find(p =>
            p.role === 'member' && !existingUTIds.has(p.id) && p.id !== tenantAdmin?.id
        );
        if (tenantMember) {
            const { error } = await supabase.from('user_tenants').insert({
                user_id: tenantMember.id,
                tenant_id: tenant.id,
                role: 'member',
            });
            if (error) {
                log(`  ❌ tenant member: ${error.message}`);
            } else {
                log(`  ✅ tenant member: Added ${tenantMember.email}`);
            }
        }
    }

    // ─── Step 5: Write test user reference ─────────────────────────────
    log('\n── Step 5: Test User Reference ──');

    const testRef = {
        testUsers,
        password: 'password123',
        workspace: workspaces?.[0],
        program: programs?.[0],
        tenant: tenants?.[0],
        portfolios: (await supabase.from('portfolios').select('id,name')).data || [],
    };

    fs.writeFileSync('scripts/qa-test-users.json', JSON.stringify(testRef, null, 2));
    log('\n  ✅ Test user reference saved to scripts/qa-test-users.json');

    log('\n\nPassword for all test users: password123');
    log('\n=== SETUP COMPLETE ===');

    fs.writeFileSync('scripts/qa-setup-report.txt', report.join('\n'));
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
